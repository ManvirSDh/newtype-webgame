import { Component, OnInit, OnDestroy } from '@angular/core';
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

  // Chat
  chatMessages: ChatMessage[] = [];
  newMessage: string = '';

  // Users List
  usersList: string[] = [];

  private stateSub!: Subscription;
  private p2pSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webrtcService: WebRtcService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.currentUsername = localStorage.getItem('username') || 'Player';

    this.route.queryParams.subscribe(params => {
      this.role = params['role'] || 'spectator';
      this.targetConnectionId = params['target'] || null;

      if (this.targetConnectionId) {
        const isHost = this.role === 'host';
        this.webrtcService.initializePeer(this.targetConnectionId, isHost);
      }
    });

    // Populate user list
    this.usersList = [this.currentUsername, 'Opponent (P2P Client)'];

    // Listen for WebRTC Connection State
    this.stateSub = this.webrtcService.connectionState$.subscribe(state => {
      this.p2pStatus = state;

      if (state === 'CONNECTED') {
        console.log('Direct WebRTC P2P channel established. Closing signaling WebSocket.');
        this.wsService.disconnect();
      }
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
  }

  disconnectGame(): void {
    this.router.navigate(['/lobby']);
  }

  ngOnDestroy(): void {
    if (this.stateSub) this.stateSub.unsubscribe();
    if (this.p2pSub) this.p2pSub.unsubscribe();
  }
}
