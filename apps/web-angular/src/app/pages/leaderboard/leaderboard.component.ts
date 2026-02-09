import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../services/leaderboard.service';
import { LeaderboardEntry, BadgeWithDetails } from '../../models/leaderboard.model';
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
              <div class="podium-username">
                @if (entries()[1].githubUsername) {
                  <a [href]="'https://github.com/' + entries()[1].githubUsername" target="_blank" rel="noopener" class="github-link">
                    <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                }
                {{ getUserDisplay(entries()[1]) }}
              </div>
              @if (entries()[1].badges?.length) {
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
            <div class="podium-username">
              @if (entries()[0].githubUsername) {
                <a [href]="'https://github.com/' + entries()[0].githubUsername" target="_blank" rel="noopener" class="github-link">
                  <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              }
              {{ getUserDisplay(entries()[0]) }}
            </div>
            @if (entries()[0].badges?.length) {
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
              <div class="podium-username">
                @if (entries()[2].githubUsername) {
                  <a [href]="'https://github.com/' + entries()[2].githubUsername" target="_blank" rel="noopener" class="github-link">
                    <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                }
                {{ getUserDisplay(entries()[2]) }}
              </div>
              @if (entries()[2].badges?.length) {
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

      <!-- Rankings Table - All Participants -->
      @if (entries().length > 0) {
        <div class="rankings-table-container">
          <table class="rankings-table">
            <thead>
              <tr>
                <th class="col-rank">#</th>
                <th class="col-player">{{ i18n.t('leaderboard.player') || 'Player' }}</th>
                <th class="col-badges">{{ i18n.t('leaderboard.badges') || 'Badges' }}</th>
                <th class="col-points">{{ i18n.t('leaderboard.points') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.userId; let i = $index) {
                <tr class="ranking-row" [class.top-three]="i < 3" [class.first-place]="i === 0" [class.second-place]="i === 1" [class.third-place]="i === 2">
                  <td class="col-rank">
                    @if (i === 0) {
                      <span class="rank-medal gold">🥇</span>
                    } @else if (i === 1) {
                      <span class="rank-medal silver">🥈</span>
                    } @else if (i === 2) {
                      <span class="rank-medal bronze">🥉</span>
                    } @else {
                      <span class="rank-number">{{ entry.rank }}</span>
                    }
                  </td>
                  <td class="col-player">
                    <div class="player-cell">
                      <div class="player-avatar" [class.champion]="i === 0">
                        {{ getUserInitials(entry) }}
                      </div>
                      <div class="player-info">
                        <div class="player-name-wrapper">
                          @if (entry.githubUsername) {
                            <a [href]="'https://github.com/' + entry.githubUsername" target="_blank" rel="noopener" class="github-link" title="GitHub: @{{ entry.githubUsername }}">
                              <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                            </a>
                          }
                          <span class="player-name" [class.highlight]="i < 3">{{ getUserDisplay(entry) }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="col-badges">
                    @if (entry.badges?.length) {
                      <div class="badges-cell">
                        @for (badge of entry.badges?.slice(0, 3) ?? []; track badge.badge.id) {
                          <span class="badge-tag" [style.background-color]="badge.badge.color" [title]="badge.badge.name">
                            {{ badge.badge.name }}
                          </span>
                        }
                        @if ((entry.badges?.length ?? 0) > 3) {
                          <span class="badge-more">+{{ (entry.badges?.length ?? 0) - 3 }}</span>
                        }
                      </div>
                    } @else {
                      <span class="no-badges">-</span>
                    }
                  </td>
                  <td class="col-points">
                    <span class="points-display" [class.highlight]="i < 3">{{ entry.points | number }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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

    /* Rankings Table - New Design */
    .rankings-table-container {
      max-width: 1000px;
      margin: 0 auto;
      background: linear-gradient(135deg, rgba(30, 30, 50, 0.6) 0%, rgba(20, 20, 40, 0.8) 100%);
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .rankings-table {
      width: 100%;
      border-collapse: collapse;
    }

    .rankings-table thead {
      background: rgba(0, 0, 0, 0.4);
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }

    .rankings-table th {
      padding: 1.25rem 1rem;
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.6);
      text-align: left;
    }

    .rankings-table th.col-rank {
      width: 80px;
      text-align: center;
    }

    .rankings-table th.col-player {
      width: auto;
    }

    .rankings-table th.col-badges {
      width: 200px;
    }

    .rankings-table th.col-points {
      width: 120px;
      text-align: right;
    }

    .rankings-table tbody tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
    }

    .rankings-table tbody tr:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .rankings-table tbody tr:last-child {
      border-bottom: none;
    }

    .rankings-table tbody tr.top-three {
      background: rgba(255, 215, 0, 0.05);
    }

    .rankings-table tbody tr.first-place {
      background: linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%);
    }

    .rankings-table tbody tr.second-place {
      background: linear-gradient(90deg, rgba(192, 192, 192, 0.15) 0%, rgba(192, 192, 192, 0.05) 100%);
    }

    .rankings-table tbody tr.third-place {
      background: linear-gradient(90deg, rgba(205, 127, 50, 0.15) 0%, rgba(205, 127, 50, 0.05) 100%);
    }

    .rankings-table td {
      padding: 1rem;
      vertical-align: middle;
    }

    .col-rank {
      text-align: center;
    }

    .rank-medal {
      font-size: 1.8rem;
      display: inline-block;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    .rank-medal.gold {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .rank-number {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .player-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .player-avatar {
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

    .player-avatar.champion {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.3);
    }

    .player-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .player-name-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .player-name {
      font-weight: 600;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.85);
    }

    .player-name.highlight {
      font-size: 1.1rem;
      color: white;
    }

    .badges-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .badge-tag {
      padding: 0.3rem 0.6rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      white-space: nowrap;
    }

    .badge-more {
      padding: 0.3rem 0.6rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.1);
    }

    .no-badges {
      color: rgba(255, 255, 255, 0.3);
      font-size: 1rem;
    }

    .col-points {
      text-align: right;
    }

    .points-display {
      font-size: 1.2rem;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .points-display.highlight {
      font-size: 1.4rem;
    }

    /* GitHub Icon */
    .github-link {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      color: inherit;
    }

    .github-icon {
      width: 18px;
      height: 18px;
      fill: rgba(255, 255, 255, 0.6);
      transition: all 0.3s ease;
    }

    .github-link:hover .github-icon {
      fill: #fff;
      transform: scale(1.1);
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

      .rankings-table th,
      .rankings-table td {
        padding: 0.75rem 0.5rem;
      }

      .rankings-table th.col-badges,
      .rankings-table td.col-badges {
        display: none;
      }

      .player-avatar {
        width: 38px;
        height: 38px;
        font-size: 0.8rem;
      }

      .player-name {
        font-size: 0.9rem;
      }

      .points-display {
        font-size: 1rem;
      }

      .rank-medal {
        font-size: 1.4rem;
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
