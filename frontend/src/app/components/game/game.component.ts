import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebRtcService } from '../../services/webrtc.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  p2pStatus: string = 'DISCONNECTED';
  targetConnectionId: string | null = null;
  role: string = 'spectator';

  private stateSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private webrtcService: WebRtcService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.role = params['role'] || 'spectator';
      this.targetConnectionId = params['target'] || null;

      if (this.targetConnectionId) {
        const isHost = this.role === 'host';
        this.webrtcService.initializePeer(this.targetConnectionId, isHost);
      }
    });

    this.stateSub = this.webrtcService.connectionState$.subscribe(state => {
      this.p2pStatus = state;
    });
  }

  ngOnDestroy(): void {
    if (this.stateSub) {
      this.stateSub.unsubscribe();
    }
  }
}
