import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messagesSubject = new Subject<any>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  public messages$: Observable<any> = this.messagesSubject.asObservable();
  public isConnected$: Observable<boolean> = this.connectionStatusSubject.asObservable();

  constructor() {}

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.socket = new WebSocket(environment.websocketUrl);

    this.socket.onopen = () => {
      console.log('Connected to API Gateway WebSocket');
      this.connectionStatusSubject.next(true);

      const username = localStorage.getItem('username');
      if (username) {
        this.registerUser(username);
      }
      this.getLobbies();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messagesSubject.next(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed.');
      this.connectionStatusSubject.next(false);
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
  }

  public registerUser(username: string): void {
    this.send('registerUser', { username });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connectionStatusSubject.next(false);
    }
  }

  public send(action: string, payload: any = {}): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action, ...payload });
      this.socket.send(message);
    } else {
      console.warn('Cannot send message, WebSocket is not open.');
    }
  }

  public getLobbies(): void {
    this.send('getLobbies');
  }

  public createLobby(roomName: string, username: string): void {
    this.send('createLobby', { roomName, username });
  }

  public joinLobby(roomId: string, username: string): void {
    this.send('joinLobby', { roomId, username });
  }

  public closeLobby(roomId: string): void {
    this.send('closeLobby', { roomId });
  }

  public sendSignal(targetConnectionId: string, signal: any): void {
    this.send('sendSignal', { targetConnectionId, signal });
  }
}
