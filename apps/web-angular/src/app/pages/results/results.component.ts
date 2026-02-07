import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../services/progress.service';
import { UserService } from '../../services/user.service';
import { I18nService } from '../../services/i18n.service';
import { UserMetricsSummary } from '../../models/typing.model';
import { Progress } from '../../models/progress.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="results container">
      <h1>{{ i18n.t('results.title') }}</h1>

      @if (loading) {
        <div class="loading">
          <p>{{ i18n.t('results.loading') }}</p>
        </div>
      }

      @if (!loading && summary) {
        <!-- Summary Cards -->
        <div class="summary">
          <div class="summary-card card">
            <span class="summary-card__value">{{ summary.averageWpm | number:'1.0-1' }}</span>
            <span class="summary-card__label">{{ i18n.t('results.avgWpm') }}</span>
          </div>
          <div class="summary-card card">
            <span class="summary-card__value">{{ summary.averageAccuracy | number:'1.0-1' }}%</span>
            <span class="summary-card__label">{{ i18n.t('results.avgAccuracy') }}</span>
          </div>
          <div class="summary-card card">
            <span class="summary-card__value">{{ summary.bestWpm | number:'1.0-1' }}</span>
            <span class="summary-card__label">{{ i18n.t('results.bestWpm') }}</span>
          </div>
          <div class="summary-card card">
            <span class="summary-card__value">{{ summary.totalSessions }}</span>
            <span class="summary-card__label">{{ i18n.t('results.sessions') }}</span>
          </div>
          <div class="summary-card card">
            <span class="summary-card__value">{{ formatTime(summary.totalTime) }}</span>
            <span class="summary-card__label">{{ i18n.t('results.totalTime') }}</span>
          </div>
        </div>

        <!-- Progress List -->
        @if (progressList.length > 0) {
          <h2 class="section-title">{{ i18n.t('results.completedLessons') }}</h2>
          <div class="progress-list">
            @for (p of progressList; track p.id) {
              <div class="progress-item card">
                <div class="progress-item__info">
                  <span class="progress-item__lesson">{{ p.lessonId }}</span>
                  <span class="progress-item__attempts">{{ p.attempts }} {{ i18n.t('results.attempts') }}</span>
                </div>
                <div class="progress-item__stats">
                  <span class="stat-pill">{{ p.bestWpm | number:'1.0-1' }} WPM</span>
                  <span class="stat-pill">{{ p.bestAccuracy | number:'1.0-1' }}%</span>
                  @if (p.completed) {
                    <span class="stat-pill stat-pill--done">✓</span>
                  }
                </div>
              </div>
            }
          </div>
        }

        @if (progressList.length === 0) {
          <div class="empty card">
            <p>{{ i18n.t('results.empty') }}</p>
            <a routerLink="/lessons" class="btn btn--primary">
              {{ i18n.t('results.startNow') }}
            </a>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .results {
        padding: 2rem 1.5rem;
        max-width: 900px;

        h1 {
          font-size: 2rem;
          margin-bottom: 2rem;
          text-align: center;
        }
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 3rem;
      }

      .summary-card {
        text-align: center;
        padding: 1.5rem 1rem;
      }

      .summary-card__value {
        display: block;
        font-size: 1.75rem;
        font-weight: 700;
        font-family: var(--font-code);
        color: var(--accent-primary);
        margin-bottom: 0.25rem;
      }

      .summary-card__label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .section-title {
        font-size: 1.25rem;
        margin-bottom: 1rem;
      }

      .progress-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .progress-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
      }

      .progress-item__info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .progress-item__lesson {
        font-weight: 600;
        font-size: 0.9375rem;
      }

      .progress-item__attempts {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .progress-item__stats {
        display: flex;
        gap: 0.5rem;
      }

      .stat-pill {
        padding: 0.25rem 0.75rem;
        background: var(--bg-tertiary);
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
        font-family: var(--font-code);
        color: var(--text-secondary);
      }

      .stat-pill--done {
        background: rgba(63, 185, 80, 0.15);
        color: var(--accent-success);
      }

      .empty {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);

        p {
          margin-bottom: 1.5rem;
        }
      }

      .loading {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
      }
    `,
  ],
})
export class ResultsComponent implements OnInit {
  private progressService = inject(ProgressService);
  private userService = inject(UserService);
  i18n = inject(I18nService);

  summary: UserMetricsSummary | null = null;
  progressList: Progress[] = [];
  loading = true;

  ngOnInit(): void {
    const userId = this.userService.getUserId();

    this.progressService.getUserMetrics(userId).subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (err) => {
        console.error('Failed to load metrics:', err);
        this.summary = {
          userId,
          averageWpm: 0,
          averageAccuracy: 0,
          totalSessions: 0,
          totalTime: 0,
          bestWpm: 0,
        };
      },
    });

    this.progressService.getUserProgress(userId).subscribe({
      next: (progress) => {
        this.progressList = progress;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load progress:', err);
        this.progressList = [];
        this.loading = false;
      },
    });
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
}
