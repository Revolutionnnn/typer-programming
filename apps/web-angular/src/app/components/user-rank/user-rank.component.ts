import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { LeaderboardService, UserRank } from '../../services/leaderboard.service';

@Component({
  selector: 'app-user-rank',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-rank">
      <h3 class="user-rank__title">{{ i18n.t('rank.yourRank') }}</h3>
      <div class="user-rank__grid">
        <div class="rank-item">
          <div class="rank-item__period">{{ i18n.t('rank.daily') }}</div>
          <div class="rank-item__position" [class.rank-item--unranked]="!dailyRank || dailyRank === 0">
            @if (loading) {
              <span class="rank-item__loading">...</span>
            } @else if (!dailyRank || dailyRank === 0) {
              <span class="rank-item__unranked">{{ i18n.t('rank.unranked') }}</span>
            } @else {
              <span class="rank-item__number">#{{ dailyRank }}</span>
            }
          </div>
        </div>

        <div class="rank-item">
          <div class="rank-item__period">{{ i18n.t('rank.weekly') }}</div>
          <div class="rank-item__position" [class.rank-item--unranked]="!weeklyRank || weeklyRank === 0">
            @if (loading) {
              <span class="rank-item__loading">...</span>
            } @else if (!weeklyRank || weeklyRank === 0) {
              <span class="rank-item__unranked">{{ i18n.t('rank.unranked') }}</span>
            } @else {
              <span class="rank-item__number">#{{ weeklyRank }}</span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .user-rank {
        margin-top: 2rem;
        padding: 1.5rem;
        background: var(--bg-secondary);
        border-radius: 0.75rem;
        border: 1px solid var(--border-color);
      }

      .user-rank__title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--text-primary);
        text-align: center;
      }

      .user-rank__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .rank-item {
        text-align: center;
        padding: 1rem;
        background: var(--bg-primary);
        border-radius: 0.5rem;
        border: 1px solid var(--border-color);
      }

      .rank-item__period {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      .rank-item__position {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .rank-item__number {
        color: var(--accent-primary);
        font-size: 1.75rem;
      }

      .rank-item__unranked {
        color: var(--text-secondary);
        font-size: 1rem;
        font-weight: 400;
      }

      .rank-item__loading {
        color: var(--text-secondary);
        font-size: 1.25rem;
      }

      .rank-item--unranked {
        opacity: 0.7;
      }

      @media (max-width: 600px) {
        .user-rank__grid {
          grid-template-columns: 1fr;
        }

        .rank-item {
          padding: 0.75rem;
        }
      }
    `,
  ],
})
export class UserRankComponent implements OnInit {
  @Input() showOnComplete: boolean = false;

  i18n = inject(I18nService);
  leaderboardService = inject(LeaderboardService);

  dailyRank: number = 0;
  weeklyRank: number = 0;
  loading: boolean = true;

  ngOnInit(): void {
    if (this.showOnComplete) {
      this.loadUserRank();
    }
  }

  private loadUserRank(): void {
    this.loading = true;
    this.leaderboardService.getUserRank().subscribe({
      next: (rank: UserRank) => {
        this.dailyRank = rank.dailyRank;
        this.weeklyRank = rank.weeklyRank;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load user rank:', error);
        this.loading = false;
      },
    });
  }
}