import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit {
  newRoomName: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {}

  createRoom(): void {
    this.router.navigate(['/game']);
  }
}
