import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebRtcService } from '../../services/webrtc.service';
import { WebSocketService } from '../../services/websocket.service';

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  p2pStatus: string = 'DISCONNECTED';
  targetConnectionId: string | null = null;
  role: string = 'spectator';
  currentUsername: string = '';

  // Status text overlay
  statusText: string = 'Initializing match...';

  // Chat
  chatMessages: ChatMessage[] = [];
  newMessage: string = '';

  // Users List
  usersList: string[] = [];

  private stateSub!: Subscription;
  private p2pSub!: Subscription;
  private wsSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webrtcService: WebRtcService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUsername = localStorage.getItem('username') || 'Player';

    this.route.queryParams.subscribe(params => {
      this.role = params['role'] || 'spectator';
      this.targetConnectionId = params['target'] || null;
      const hostUsername = params['hostUsername'] || 'Host Pilot';

      if (this.role === 'host') {
        if (this.targetConnectionId) {
          this.webrtcService.initializePeer(this.targetConnectionId, true);
        } else {
          this.statusText = 'Waiting for second player...';
          this.usersList = [this.currentUsername];
        }
      } else if (this.role === 'guest') {
        if (this.targetConnectionId) {
          this.webrtcService.initializePeer(this.targetConnectionId, false);
          this.statusText = `Connecting to ${hostUsername}...`;
          this.usersList = [this.currentUsername, hostUsername];
        }
      }
    });

    // Listen to WebSocket while waiting in room as host for second player
    this.wsSub = this.wsService.messages$.subscribe(message => {
      if (message.action === 'PLAYER_JOINED') {
        this.targetConnectionId = message.guestConnectionId;
        const guestName = message.guestUsername || 'Guest Pilot';
        this.usersList = [this.currentUsername, guestName];
        this.statusText = `Player ${guestName} joined! Establishing P2P link...`;
        this.cdr.detectChanges();
        
        // Host initializes WebRTC offer to guest
        if (this.targetConnectionId) {
          this.webrtcService.initializePeer(this.targetConnectionId, true);
        }
      }
    });

    // Listen for WebRTC Connection State
    this.stateSub = this.webrtcService.connectionState$.subscribe(state => {
      this.p2pStatus = state;

      if (state === 'CONNECTED') {
        this.statusText = 'P2P Connection Established!';
        console.log('Direct WebRTC P2P channel established. Closing signaling WebSocket.');
        this.wsService.disconnect();
      } else if (state === 'CONNECTING') {
        this.statusText = 'Establishing P2P Data Channel...';
      } else if (state === 'CLOSED' || state === 'FAILED') {
        this.statusText = 'P2P Connection Closed / Failed';
      }
      this.cdr.detectChanges();
    });

    // Listen for incoming P2P Messages (Chat)
    this.p2pSub = this.webrtcService.p2pMessages$.subscribe(msg => {
      if (msg && msg.type === 'CHAT') {
        this.chatMessages.push({
          sender: msg.sender || 'Opponent',
          text: msg.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false
        });

        // Update partner username in user list if sent in chat metadata
        if (msg.sender && this.usersList.length >= 2) {
          this.usersList = [this.currentUsername, msg.sender];
        }

        // Trigger Angular change detection so chat bubble updates immediately!
        this.cdr.detectChanges();
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const text = this.newMessage.trim();
    const messagePayload = {
      type: 'CHAT',
      sender: this.currentUsername,
      text: text
    };

    // Send over WebRTC DataChannel
    this.webrtcService.sendP2P(messagePayload);

    // Add to local chat view
    this.chatMessages.push({
      sender: this.currentUsername,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    });

    this.newMessage = '';
    this.cdr.detectChanges();
  }

  disconnectGame(): void {
    this.router.navigate(['/lobby']);
  }

  ngOnDestroy(): void {
    if (this.stateSub) this.stateSub.unsubscribe();
    if (this.p2pSub) this.p2pSub.unsubscribe();
    if (this.wsSub) this.wsSub.unsubscribe();
  }
}
