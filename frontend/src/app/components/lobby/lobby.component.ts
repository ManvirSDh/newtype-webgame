import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';

interface Lobby {
  roomId: string;
  roomName: string;
  hostConnectionId: string;
  hostUsername: string;
  status: string;
}

interface OnlineUser {
  connectionId: string;
  username: string;
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit, OnDestroy {
  newRoomName: string = '';
  currentUsername: string = '';
  lobbies: Lobby[] = [];
  onlineUsers: OnlineUser[] = [];
  
  private wsSubscription!: Subscription;

  constructor(
    private router: Router,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.currentUsername = localStorage.getItem('username') || 'Commander_' + Math.floor(100 + Math.random() * 900);

    // Connect WebSocket when user enters Lobby
    this.wsService.connect();

    this.wsSubscription = this.wsService.messages$.subscribe(message => {
      if (message.action === 'LOBBY_LIST') {
        this.lobbies = message.lobbies || [];
      } else if (message.action === 'USER_LIST') {
        this.onlineUsers = message.users || [];
      } else if (message.action === 'PLAYER_JOINED') {
        this.router.navigate(['/game'], {
          queryParams: {
            role: 'host',
            target: message.guestConnectionId
          }
        });
      } else if (message.action === 'JOINED_LOBBY') {
        this.router.navigate(['/game'], {
          queryParams: {
            role: 'guest',
            target: message.hostConnectionId,
            roomId: message.roomId
          }
        });
      }
    });
  }

  createRoom(): void {
    if (!this.newRoomName.trim()) return;
    this.wsService.createLobby(this.newRoomName.trim(), this.currentUsername);
    this.newRoomName = '';
  }

  joinLobby(roomId: string): void {
    this.wsService.joinLobby(roomId, this.currentUsername);
  }

  closeLobby(roomId: string): void {
    this.wsService.closeLobby(roomId);
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }
}
