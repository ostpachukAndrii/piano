import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { EvaluationService } from '../../../core/services/evaluation.service';

/**
 * Particle Effects Component
 * Creates visual effects for perfect notes, combos, and achievements
 */
@Component({
  selector: 'app-particle-effects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #particleCanvas
            class="particle-canvas"
            [width]="canvasWidth"
            [height]="canvasHeight">
    </canvas>
  `,
  styles: [`
    .particle-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
    }
  `]
})
export class ParticleEffectsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private evaluationService = inject(EvaluationService);
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId: number = 0;
  private lastResultTimestamp: number = 0;

  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  constructor() {
    // Listen for evaluation results using effect
    effect(() => {
      const result = this.evaluationService.lastResult();
      const now = Date.now();

      // Avoid duplicate triggers by checking timestamp
      if (result && result.pitch_correct && now - this.lastResultTimestamp > 100) {
        this.lastResultTimestamp = now;

        const isPerfect = result.score >= 100;
        const streak = this.evaluationService.currentStreak();

        if (isPerfect) {
          this.createPerfectNoteEffect(streak);
        } else {
          this.createGoodNoteEffect();
        }

        // Combo effects for streaks
        if (streak >= 10 && streak % 5 === 0) {
          this.createComboEffect(streak);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvasWidth = window.innerWidth;
      this.canvasHeight = window.innerHeight;
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Create particles for perfect note hit
   */
  private createPerfectNoteEffect(streak: number): void {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;

    // More particles for higher streaks
    const particleCount = Math.min(20 + streak * 2, 50);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 3 + Math.random() * 2;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: 3 + Math.random() * 3,
        color: this.getStreakColor(streak),
        alpha: 1,
        life: 1
      });
    }

    // Add sparkles
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 1 + Math.random() * 2,
        color: '#FFD700',
        alpha: 1,
        life: 1,
        sparkle: true
      });
    }
  }

  /**
   * Create subtle effect for good (but not perfect) notes
   */
  private createGoodNoteEffect(): void {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        radius: 2,
        color: '#4CAF50',
        alpha: 0.6,
        life: 1
      });
    }
  }

  /**
   * Create explosion effect for combo milestones
   */
  private createComboEffect(streak: number): void {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2 - 100;

    // Large burst
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 4 + Math.random() * 4;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: 4 + Math.random() * 4,
        color: this.getComboColor(streak),
        alpha: 1,
        life: 1
      });
    }

    // Show combo text
    this.showComboText(streak, centerX, centerY);
  }

  /**
   * Show animated combo text
   */
  private showComboText(streak: number, x: number, y: number): void {
    const text = `${streak} COMBO!`;
    const fontSize = 48;

    const textElement = document.createElement('div');
    textElement.textContent = text;
    textElement.style.position = 'fixed';
    textElement.style.left = `${x}px`;
    textElement.style.top = `${y}px`;
    textElement.style.transform = 'translate(-50%, -50%)';
    textElement.style.fontSize = `${fontSize}px`;
    textElement.style.fontWeight = 'bold';
    textElement.style.color = '#FFD700';
    textElement.style.textShadow = '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)';
    textElement.style.pointerEvents = 'none';
    textElement.style.zIndex = '9999';
    document.body.appendChild(textElement);

    // Animate with GSAP
    gsap.timeline()
      .from(textElement, {
        scale: 0,
        rotation: -180,
        duration: 0.5,
        ease: 'back.out(2)'
      })
      .to(textElement, {
        y: '-=100',
        opacity: 0,
        duration: 1,
        ease: 'power2.in',
        onComplete: () => textElement.remove()
      }, '+=0.5');
  }

  /**
   * Get color based on streak
   */
  private getStreakColor(streak: number): string {
    if (streak >= 25) return '#FF1744'; // Red for fire
    if (streak >= 15) return '#FF6F00'; // Orange
    if (streak >= 10) return '#FFD700'; // Gold
    if (streak >= 5) return '#00E676';  // Green
    return '#4CAF50'; // Light green
  }

  /**
   * Get color for combo effects
   */
  private getComboColor(streak: number): string {
    const colors = ['#FFD700', '#FF6F00', '#FF1744', '#E91E63', '#9C27B0'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity

      // Update life
      p.life -= 0.02;
      p.alpha = p.life;

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Draw particle
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();

      if (p.sparkle) {
        // Draw star for sparkles
        this.drawStar(p.x, p.y, p.radius, 5);
      } else {
        // Draw circle for normal particles
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      }

      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Draw a star shape
   */
  private drawStar(cx: number, cy: number, radius: number, points: number): void {
    const step = Math.PI / points;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - radius);

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius / 2;
      const angle = i * step - Math.PI / 2;
      this.ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }

    this.ctx.closePath();
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  sparkle?: boolean;
}
