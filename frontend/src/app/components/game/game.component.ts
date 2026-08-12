import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Unit {
  id: string;
  name: string;
  age: number; // Younger units are stronger
  x: number;
  y: number;
  lastAction: string;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  
  roomId: string = 'Local';
  wasmLoaded: boolean = false;
  wasmStatus: string = 'Awaiting WebAssembly / Go binary engine initialization...';
  
  // Game state simulation
  currentTurn: number = 1;
  turnTimer: number = 5;
  timerInterval: any;

  units: Unit[] = [
    { id: 'u1', name: 'Alpha Chrono', age: 18, x: 2, y: 3, lastAction: 'WARP_FORWARD' },
    { id: 'u2', name: 'Psychic Aegis', age: 24, x: 4, y: 1, lastAction: 'PSYCHIC_BLAST' },
    { id: 'u3', name: 'Temporal Sentinel', age: 32, x: 1, y: 5, lastAction: 'TIME_REVERSAL' }
  ];

  selectedUnit: Unit | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['room']) {
        this.roomId = params['room'];
      }
    });

    this.startTurnTimer();
  }

  ngAfterViewInit(): void {
    this.mockWasmLoad();
  }

  mockWasmLoad(): void {
    setTimeout(() => {
      this.wasmLoaded = true;
      this.wasmStatus = 'Go WebAssembly Engine Attached. Ready for P2P state updates.';
    }, 1500);
  }

  startTurnTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.turnTimer > 1) {
        this.turnTimer--;
      } else {
        this.turnTimer = 5;
        this.currentTurn++;
        this.executeAutoActions();
      }
    }, 1000);
  }

  executeAutoActions(): void {
    // Units repeat their actions unless updated by commander
    this.units.forEach(unit => {
      if (unit.lastAction === 'WARP_FORWARD') {
        unit.age = Math.max(12, unit.age - 1); // Aging down makes unit stronger
      }
    });
  }

  selectUnit(unit: Unit): void {
    this.selectedUnit = unit;
  }

  setAction(action: string): void {
    if (this.selectedUnit) {
      this.selectedUnit.lastAction = action;
    }
  }

  exitGame(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.router.navigate(['/lobby']);
  }
}
