import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class WebRtcService {
  private peerConnection!: RTCPeerConnection;
  private dataChannel!: RTCDataChannel;

  private p2pMessagesSubject = new Subject<any>();
  private connectionStateSubject = new BehaviorSubject<string>('DISCONNECTED');

  public p2pMessages$: Observable<any> = this.p2pMessagesSubject.asObservable();
  public connectionState$: Observable<string> = this.connectionStateSubject.asObservable();

  private targetConnectionId: string | null = null;

  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor(private wsService: WebSocketService) {
    this.wsService.messages$.subscribe(message => {
      if (message.action === 'SIGNAL_RECEIVED') {
        this.handleSignal(message.senderConnectionId, message.signal);
      }
    });
  }

  public initializePeer(targetConnectionId: string, isHost: boolean): void {
    this.targetConnectionId = targetConnectionId;
    this.peerConnection = new RTCPeerConnection(this.iceServers);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.targetConnectionId) {
        this.wsService.sendSignal(this.targetConnectionId, {
          type: 'candidate',
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('WebRTC Connection State:', state);
      this.connectionStateSubject.next(state.toUpperCase());
    };

    if (isHost) {
      this.dataChannel = this.peerConnection.createDataChannel('gameDataChannel');
      this.setupDataChannel(this.dataChannel);
      this.createOffer();
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }
  }

  private async createOffer(): Promise<void> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    if (this.targetConnectionId) {
      this.wsService.sendSignal(this.targetConnectionId, {
        type: 'offer',
        sdp: offer
      });
    }
  }

  private async handleSignal(senderId: string, signal: any): Promise<void> {
    if (!this.peerConnection) {
      this.initializePeer(senderId, false);
    }

    if (signal.type === 'offer') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.wsService.sendSignal(senderId, {
        type: 'answer',
        sdp: answer
      });
    } else if (signal.type === 'answer') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    } else if (signal.type === 'candidate' && signal.candidate) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('Direct P2P DataChannel OPEN');
      this.connectionStateSubject.next('CONNECTED');
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.p2pMessagesSubject.next(data);
      } catch {
        this.p2pMessagesSubject.next(event.data);
      }
    };

    channel.onclose = () => {
      console.warn('P2P DataChannel CLOSED');
      this.connectionStateSubject.next('CLOSED');
    };
  }

  public sendP2P(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('Cannot send P2P message: DataChannel is not open.');
    }
  }
}
