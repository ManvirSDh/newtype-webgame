import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username: string = '';

  constructor(private router: Router) {}

  onLogin(): void {
    if (this.username.trim()) {
      localStorage.setItem('username', this.username.trim());
    } else {
      localStorage.setItem('username', 'Player_' + Math.floor(1000 + Math.random() * 9000));
    }
    this.router.navigate(['/lobby']);
  }
}
