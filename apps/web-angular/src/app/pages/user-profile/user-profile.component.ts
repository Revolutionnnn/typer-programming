import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { I18nService } from '../../services/i18n.service';
import { UserProfile } from '../../models/user-profile.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="profile-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ i18n.t('common.loading') || 'Loading...' }}</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <p>{{ error() }}</p>
          <a [routerLink]="['/leaderboard']" class="btn-primary">
            {{ i18n.t('common.goBack') || 'Go Back' }}
          </a>
        </div>
      } @else if (profile()) {
        <div class="profile-content">
          <!-- Header -->
          <div class="profile-header">
            <a [routerLink]="['/leaderboard']" class="back-link">
              ← {{ i18n.t('common.back') || 'Back' }}
            </a>
          </div>

          <!-- User Card -->
          <div class="user-card">
            <div class="avatar-section">
              <div class="avatar" [class.guest]="profile()!.user.isGuest">
                {{ getInitials(profile()!.user) }}
              </div>
              @if (profile()!.user.githubUsername) {
                <a 
                  [href]="'https://github.com/' + profile()!.user.githubUsername" 
                  target="_blank" 
                  rel="noopener"
                  class="github-badge"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {{ profile()!.user.githubUsername }}
                </a>
              }
            </div>
            
            <div class="user-info">
              <h1 class="username">{{ profile()!.user.displayName }}</h1>
              @if (profile()!.user.isGuest) {
                <span class="guest-badge">{{ i18n.t('user.guest') || 'Guest' }}</span>
              }
              <p class="member-since">
                {{ i18n.t('user.memberSince') || 'Member since' }} {{ formatDate(profile()!.user.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-icon">🏆</div>
              <div class="stat-value">{{ profile()!.totalPoints | number }}</div>
              <div class="stat-label">{{ i18n.t('user.totalPoints') || 'Total Points' }}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📚</div>
              <div class="stat-value">{{ profile()!.completedLessons }}</div>
              <div class="stat-label">{{ i18n.t('user.completedLessons') || 'Completed Lessons' }}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">🔥</div>
              <div class="stat-value">{{ profile()!.user.currentStreak }}</div>
              <div class="stat-label">{{ i18n.t('user.currentStreak') || 'Day Streak' }}</div>
            </div>
            
            @if (profile()!.metrics) {
              <div class="stat-card">
                <div class="stat-icon">⚡</div>
                <div class="stat-value">{{ profile()!.metrics!.averageWpm | number:'1.0-0' }}</div>
                <div class="stat-label">{{ i18n.t('user.avgWpm') || 'Avg WPM' }}</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">{{ profile()!.metrics!.averageAccuracy | number:'1.0-1' }}%</div>
                <div class="stat-label">{{ i18n.t('user.accuracy') || 'Accuracy' }}</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">🚀</div>
                <div class="stat-value">{{ profile()!.metrics!.bestWpm | number:'1.0-0' }}</div>
                <div class="stat-label">{{ i18n.t('user.bestWpm') || 'Best WPM' }}</div>
              </div>
            }
          </div>

          <!-- Badges Section -->
          @if ((profile()!.user.badges?.length ?? 0) > 0) {
            <div class="badges-section">
              <h2>{{ i18n.t('user.badges') || 'Badges' }}</h2>
              <div class="badges-grid">
                @for (badge of profile()!.user.badges!; track badge.badge.id) {
                  <div class="badge-card" [style.border-color]="badge.badge.color">
                    <div class="badge-icon" [style.background-color]="badge.badge.color">🏅</div>
                    <div class="badge-name">{{ badge.badge.name }}</div>
                    <div class="badge-date">{{ formatDate(badge.assignedAt) }}</div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Progress Section -->
          @if ((profile()!.progress?.length ?? 0) > 0) {
            <div class="progress-section">
              <h2>{{ i18n.t('user.recentProgress') || 'Recent Progress' }}</h2>
              <div class="progress-list">
                @for (progress of getRecentProgress(); track progress.id) {
                  <div class="progress-item">
                    <div class="progress-lesson">{{ progress.lessonId }}</div>
                    <div class="progress-stats">
                      <span class="wpm">{{ progress.bestWpm | number:'1.0-0' }} WPM</span>
                      <span class="accuracy">{{ progress.bestAccuracy | number:'1.0-0' }}% acc</span>
                    </div>
                    <div class="progress-status">
                      @if (progress.completed) {
                        <span class="completed-badge">✓ {{ i18n.t('lesson.completed') || 'Completed' }}</span>
                      } @else {
                        <span class="attempts">{{ progress.attempts }} {{ i18n.t('lesson.attempts') || 'attempts' }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(88, 166, 255, 0.3);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .btn-primary {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: var(--accent-primary);
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 1rem;
    }

    .profile-header {
      margin-bottom: 2rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: var(--accent-primary);
    }

    .user-card {
      background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border-color);
    }

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-success) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .avatar.guest {
      background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
    }

    .github-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.2s;
    }

    .github-badge:hover {
      background: rgba(255,255,255,0.2);
      color: white;
    }

    .github-badge svg {
      width: 16px;
      height: 16px;
    }

    .user-info {
      flex: 1;
    }

    .username {
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 0.5rem;
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .guest-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(107, 114, 128, 0.3);
      border-radius: 12px;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .member-since {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      border: 1px solid var(--border-color);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }

    .stat-card.primary {
      background: linear-gradient(135deg, rgba(88, 166, 255, 0.2) 0%, rgba(63, 185, 80, 0.2) 100%);
      border-color: var(--accent-primary);
    }

    .stat-card.primary .stat-value {
      color: var(--accent-primary);
      font-size: 2rem;
    }

    .stat-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      font-family: var(--font-code);
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .badges-section, .progress-section {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
    }

    .badges-section h2, .progress-section h2 {
      margin: 0 0 1rem;
      font-size: 1.25rem;
      color: var(--text-primary);
    }

    .badges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .badge-card {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      border: 2px solid transparent;
    }

    .badge-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin: 0 auto 0.5rem;
    }

    .badge-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .badge-date {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .progress-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .progress-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--bg-tertiary);
      border-radius: 12px;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .progress-lesson {
      font-weight: 600;
      color: var(--text-primary);
    }

    .progress-stats {
      display: flex;
      gap: 1rem;
    }

    .wpm {
      color: var(--accent-primary);
      font-weight: 600;
      font-family: var(--font-code);
    }

    .accuracy {
      color: var(--accent-success);
      font-weight: 600;
      font-family: var(--font-code);
    }

    .completed-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(63, 185, 80, 0.2);
      color: var(--accent-success);
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .attempts {
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    @media (max-width: 600px) {
      .user-card {
        flex-direction: column;
        text-align: center;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .progress-item {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class UserProfileComponent implements OnInit {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  i18n = inject(I18nService);

  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.error.set('User ID not provided');
      this.loading.set(false);
      return;
    }

    this.loadUserProfile(userId);
  }

  loadUserProfile(userId: string) {
    this.userService.getUserProfile(userId).pipe(
      catchError(err => {
        this.error.set('Failed to load user profile');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe(profile => {
      if (profile) {
        this.profile.set(profile);
      }
      this.loading.set(false);
    });
  }

  getInitials(user: { displayName: string; username: string }): string {
    return user.displayName.slice(0, 2).toUpperCase();
  }

  formatDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getRecentProgress() {
    return this.profile()?.progress?.slice(0, 5) || [];
  }
}
