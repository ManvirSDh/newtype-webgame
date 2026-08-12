import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Room {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'Open' | 'In Progress';
  mode: string;
}

interface User {
  id: string;
  username: string;
  status: 'Online' | 'In Match' | 'AFK';
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit {
  currentUsername: string = '';
  newRoomName: string = '';
  selectedMode: string = '1v1 Blitz';

  rooms: Room[] = [
    { id: 'rm-101', name: "Alpha Sector 1v1 Blitz", host: 'ZeroTwo', players: 1, maxPlayers: 2, status: 'Open', mode: '1v1 Blitz' },
    { id: 'rm-102', name: "Tetris Time Race Practice", host: 'Aegis', players: 1, maxPlayers: 2, status: 'Open', mode: 'Tetris-like Race' },
    { id: 'rm-103', name: "Chrono Duel #42", host: 'Paradox', players: 2, maxPlayers: 2, status: 'In Progress', mode: '1v1 Blitz' }
  ];

  onlineUsers: User[] = [
    { id: 'u-1', username: 'ZeroTwo', status: 'Online' },
    { id: 'u-2', username: 'Aegis', status: 'Online' },
    { id: 'u-3', username: 'Paradox', status: 'In Match' },
    { id: 'u-4', username: 'Chronos', status: 'AFK' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.currentUsername = localStorage.getItem('username') || 'Commander';
  }

  createRoom(): void {
    const roomTitle = this.newRoomName.trim() || `${this.currentUsername}'s Match`;
    const newRoom: Room = {
      id: `rm-${Math.floor(100 + Math.random() * 900)}`,
      name: roomTitle,
      host: this.currentUsername,
      players: 1,
      maxPlayers: 2,
      status: 'Open',
      mode: this.selectedMode
    };
    this.rooms.unshift(newRoom);
    this.newRoomName = '';
  }

  joinRoom(roomId: string): void {
    this.router.navigate(['/game'], { queryParams: { room: roomId } });
  }

  quickMatch(): void {
    this.router.navigate(['/game'], { queryParams: { room: 'quick-match' } });
  }

  logout(): void {
    localStorage.removeItem('username');
    this.router.navigate(['/login']);
  }
}
