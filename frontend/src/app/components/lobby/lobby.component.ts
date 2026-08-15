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
  
  private wsSubscription!: Subscription;

  constructor(
    private router: Router,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.currentUsername = localStorage.getItem('username') || 'Commander_' + Math.floor(100 + Math.random() * 900);

    this.wsSubscription = this.wsService.messages$.subscribe(message => {
      if (message.action === 'LOBBY_LIST') {
        this.lobbies = message.lobbies || [];
      } else if (message.action === 'PLAYER_JOINED') {
        // As host, navigate to game with guest details
        this.router.navigate(['/game'], {
          queryParams: {
            role: 'host',
            target: message.guestConnectionId
          }
        });
      } else if (message.action === 'JOINED_LOBBY') {
        // As guest, navigate to game with host details
        this.router.navigate(['/game'], {
          queryParams: {
            role: 'guest',
            target: message.hostConnectionId,
            roomId: message.roomId
          }
        });
      }
    });

    this.wsService.getLobbies();
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
