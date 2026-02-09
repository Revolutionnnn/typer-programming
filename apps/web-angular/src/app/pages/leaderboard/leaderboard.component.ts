import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../services/leaderboard.service';
import { LeaderboardEntry } from '../../models/leaderboard.model';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="title-container">
        <div class="trophy-icon">🏆</div>
        <h1 class="main-title">
          <span class="title-text">{{ i18n.t('leaderboard.title') }}</span>
          <div class="title-underline"></div>
        </h1>
      </div>

      <div class="flex justify-center mb-8 space-x-4">
        <button 
          (click)="setPeriod('daily')" 
          [class.active]="period() === 'daily'"
          class="period-btn">
          {{ i18n.t('leaderboard.daily') }}
        </button>
        <button 
          (click)="setPeriod('weekly')" 
          [class.active]="period() === 'weekly'"
          class="period-btn">
          {{ i18n.t('leaderboard.weekly') }}
        </button>
        <button 
          (click)="setPeriod('monthly')" 
          [class.active]="period() === 'monthly'"
          class="period-btn">
          {{ i18n.t('leaderboard.monthly') }}
        </button>
        <button 
          (click)="setPeriod('all_time')" 
          [class.active]="period() === 'all_time'"
          class="period-btn">
          {{ i18n.t('leaderboard.allTime') }}
        </button>
      </div>

      <!-- Top 3 Podium -->
      @if (entries().length > 0) {
        <div class="podium-container" [class.single]="entries().length === 1" [class.double]="entries().length === 2">
          <!-- 2nd Place -->
          @if (entries().length >= 2) {
            <div class="podium-card second">
              <div class="podium-rank">
                <div class="medal silver">🥈</div>
                <div class="rank-number">2</div>
              </div>
              <div class="podium-avatar">
                {{ getUserInitials(entries()[1]) }}
              </div>
              <div class="podium-username">{{ getUserDisplay(entries()[1]) }}</div>
              @if (entries()[1].badges && entries()[1].badges.length > 0) {
                <div class="podium-badges">
                  @for (badge of entries()[1].badges; track badge.badge.id) {
                    <span class="badge" [style.background-color]="badge.badge.color">{{ badge.badge.name }}</span>
                  }
                </div>
              }
              <div class="podium-points">
                <span class="points-number">{{ entries()[1].points | number }}</span>
                <span class="points-label">{{ i18n.t('leaderboard.points') }}</span>
              </div>
            </div>
          }

          <!-- 1st Place -->
          <div class="podium-card first">
            <div class="crown">👑</div>
            <div class="podium-rank">
              <div class="medal gold">🥇</div>
              <div class="rank-number">1</div>
            </div>
            <div class="podium-avatar champion">
              {{ getUserInitials(entries()[0]) }}
            </div>
            <div class="podium-username">{{ getUserDisplay(entries()[0]) }}</div>
            @if (entries()[0].badges && entries()[0].badges.length > 0) {
              <div class="podium-badges">
                @for (badge of entries()[0].badges; track badge.badge.id) {
                  <span class="badge" [style.background-color]="badge.badge.color">{{ badge.badge.name }}</span>
                }
              </div>
            }
            <div class="podium-points">
              <span class="points-number">{{ entries()[0].points | number }}</span>
              <span class="points-label">points</span>
            </div>
          </div>

          <!-- 3rd Place -->
          @if (entries().length >= 3) {
            <div class="podium-card third">
              <div class="podium-rank">
                <div class="medal bronze">🥉</div>
                <div class="rank-number">3</div>
              </div>
              <div class="podium-avatar">
                {{ getUserInitials(entries()[2]) }}
              </div>
              <div class="podium-username">{{ getUserDisplay(entries()[2]) }}</div>
              @if (entries()[2].badges && entries()[2].badges.length > 0) {
                <div class="podium-badges">
                  @for (badge of entries()[2].badges; track badge.badge.id) {
                    <span class="badge" [style.background-color]="badge.badge.color">{{ badge.badge.name }}</span>
                  }
                </div>
              }
              <div class="podium-points">
                <span class="points-number">{{ entries()[2].points | number }}</span>
                <span class="points-label">points</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Rest of rankings -->
      @if (entries().length > 3) {
        <div class="rankings-table">
          <div class="table-header">
            <div class="col-rank">Rank</div>
            <div class="col-user">Player</div>
            <div class="col-points">Points</div>
          </div>
          @for (entry of entries().slice(3); track entry.userId) {
            <div class="ranking-row">
              <div class="col-rank">
                <div class="rank-badge">{{ entry.rank }}</div>
              </div>
              <div class="col-user">
                <div class="user-avatar">
                  {{ getUserInitials(entry) }}
                </div>
                <div class="user-info">
                  <span class="user-name">{{ getUserDisplay(entry) }}</span>
                  @if (entry.badges && entry.badges.length > 0) {
                    <div class="user-badges">
                      @for (badge of entry.badges; track badge.badge.id) {
                        <span class="badge small" [style.background-color]="badge.badge.color">{{ badge.badge.name }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
              <div class="col-points">
                <span class="points-value">{{ entry.points | number }}</span>
              </div>
            </div>
          }
        </div>
      }

      @if (entries().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <p class="empty-text">{{ i18n.t('leaderboard.empty') }}</p>
        </div>
      }
      
      <div class="mt-12 text-center">
        <a routerLink="/" class="cta-button">
          {{ i18n.t('leaderboard.cta') }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    .title-container {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem 0;
    }

    .trophy-icon {
      font-size: 4rem;
      display: inline-block;
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 8px 16px rgba(255, 215, 0, 0.3));
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-10px) rotate(-2deg); }
      75% { transform: translateY(-10px) rotate(2deg); }
    }

    .main-title {
      margin-top: 1rem;
      position: relative;
      display: inline-block;
    }

    .title-text {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 25%, #ffd700 50%, #ffed4e 75%, #ffd700 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
      letter-spacing: 0.05em;
    }

    @keyframes shimmer {
      0% { background-position: 0% center; }
      100% { background-position: 200% center; }
    }

    .title-underline {
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 4px;
      background: linear-gradient(90deg, transparent 0%, #ffd700 20%, #ffd700 80%, transparent 100%);
      border-radius: 2px;
      box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
    }

    /* Period Buttons */
    .period-btn {
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .period-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
    }

    .period-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: #667eea;
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    /* Podium Container */
    .podium-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto 3rem;
      align-items: end;
    }

    .podium-container.single {
      grid-template-columns: 1fr;
      max-width: 400px;
    }

    .podium-container.double {
      grid-template-columns: repeat(2, 1fr);
      max-width: 600px;
    }

    .podium-container.single .podium-card.first {
      grid-column: 1;
    }

    .podium-container.double .podium-card.first {
      grid-column: 2;
    }

    .podium-container.double .podium-card.second {
      grid-column: 1;
    }


    .podium-card {
      background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%);
      border-radius: 20px;
      padding: 2rem 1.5rem;
      text-align: center;
      position: relative;
      border: 2px solid;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .podium-card:hover {
      transform: translateY(-8px);
    }

    .podium-card.first {
      border-color: #ffd700;
      box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
      grid-row: 1;
      grid-column: 2;
    }

    .podium-card.first:hover {
      box-shadow: 0 12px 48px rgba(255, 215, 0, 0.5);
    }

    .podium-card.second {
      border-color: #c0c0c0;
      box-shadow: 0 6px 24px rgba(192, 192, 192, 0.2);
      grid-row: 1;
      grid-column: 1;
      padding-top: 2.5rem;
    }

    .podium-card.second:hover {
      box-shadow: 0 10px 36px rgba(192, 192, 192, 0.4);
    }

    .podium-card.third {
      border-color: #cd7f32;
      box-shadow: 0 6px 24px rgba(205, 127, 50, 0.2);
      grid-row: 1;
      grid-column: 3;
      padding-top: 3rem;
    }

    .podium-card.third:hover {
      box-shadow: 0 10px 36px rgba(205, 127, 50, 0.4);
    }

    .crown {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2.5rem;
      animation: bounce 2s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-10px); }
    }

    .podium-rank {
      position: relative;
      margin-bottom: 1rem;
    }

    .medal {
      font-size: 3rem;
      display: inline-block;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    }

    .rank-number {
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.2rem;
      font-weight: 800;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .podium-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 800;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .podium-avatar.champion {
      width: 100px;
      height: 100px;
      font-size: 2.2rem;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .podium-username {
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.5rem;
    }

    .podium-badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
    }

    .badge.small {
      font-size: 0.6rem;
      padding: 0.2rem 0.4rem;
    }

    .podium-points {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .points-number {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .podium-card.first .points-number {
      font-size: 2.2rem;
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .points-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* Rankings Table */
    .rankings-table {
      max-width: 900px;
      margin: 0 auto;
      background: linear-gradient(135deg, rgba(30, 30, 50, 0.6) 0%, rgba(20, 20, 40, 0.8) 100%);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .table-header {
      display: grid;
      grid-template-columns: 80px 1fr 150px;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.6);
    }

    .ranking-row {
      display: grid;
      grid-template-columns: 80px 1fr 150px;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .ranking-row:hover {
      background: rgba(102, 126, 234, 0.1);
      transform: translateX(4px);
    }

    .ranking-row:last-child {
      border-bottom: none;
    }

    .col-rank {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rank-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .col-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar {
      width: 45px;
      height: 45px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      color: white;
      flex-shrink: 0;
    }

    .user-name {
      font-weight: 600;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .col-points {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .points-value {
      font-size: 1.3rem;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.5);
    }

    /* CTA Button */
    .cta-button {
      display: inline-block;
      padding: 1rem 3rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      font-weight: 700;
      font-size: 1.1rem;
      color: white;
      text-decoration: none;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .podium-container {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .podium-card.first,
      .podium-card.second,
      .podium-card.third {
        grid-column: 1;
        padding-top: 2rem;
      }

      .ranking-row,
      .table-header {
        grid-template-columns: 60px 1fr 120px;
        gap: 0.75rem;
        padding: 1rem;
      }

      .trophy-icon {
        font-size: 3rem;
      }

      .title-text {
        font-size: 1.75rem;
      }
    }
  `]
})
export class LeaderboardPageComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);
  i18n = inject(I18nService);

  entries = signal<LeaderboardEntry[]>([]);
  period = signal<'daily' | 'weekly' | 'monthly' | 'all_time'>('daily');

  ngOnInit() {
    this.loadLeaderboard();
  }

  setPeriod(newPeriod: 'daily' | 'weekly' | 'monthly' | 'all_time') {
    this.period.set(newPeriod);
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    const p = this.period() as 'daily' | 'weekly' | 'monthly' | 'all_time';
    this.leaderboardService.getLeaderboard(p).subscribe({
      next: (data: any) => this.entries.set(data),
      error: (err: any) => console.error('Failed to load leaderboard', err)
    });
  }

  getUserDisplay(entry: LeaderboardEntry): string {
    if (entry.username && entry.username.trim() !== '') {
      return entry.username;
    }
    return `User ${entry.userId.slice(0, 8)}...`;
  }

  getUserInitials(entry: LeaderboardEntry): string {
    if (entry.username && entry.username.trim() !== '') {
      return entry.username.slice(0, 2).toUpperCase();
    }
    return entry.userId.slice(0, 2).toUpperCase();
  }
}
