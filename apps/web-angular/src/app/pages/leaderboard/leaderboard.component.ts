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

      <div class="period-tabs">
        <button 
          (click)="setPeriod('daily')" 
          [class.active]="period() === 'daily'"
          class="tab-btn">
          <span class="tab-icon">📅</span>
          <span class="tab-label">{{ i18n.t('leaderboard.daily') }}</span>
        </button>
        <button 
          (click)="setPeriod('weekly')" 
          [class.active]="period() === 'weekly'"
          class="tab-btn">
          <span class="tab-icon">📊</span>
          <span class="tab-label">{{ i18n.t('leaderboard.weekly') }}</span>
        </button>
        <button 
          (click)="setPeriod('monthly')" 
          [class.active]="period() === 'monthly'"
          class="tab-btn">
          <span class="tab-icon">📈</span>
          <span class="tab-label">{{ i18n.t('leaderboard.monthly') }}</span>
        </button>
        <button 
          (click)="setPeriod('all_time')" 
          [class.active]="period() === 'all_time'"
          class="tab-btn">
          <span class="tab-icon">🏆</span>
          <span class="tab-label">{{ i18n.t('leaderboard.allTime') }}</span>
        </button>
      </div>

      <!-- Top 3 Podium -->
      @if (entries().length > 0) {
        <div class="podium-wrapper">
          <!-- Podium Platform -->
          <div class="podium-platforms">
            <!-- 2nd Place Platform -->
            @if (entries().length >= 2) {
              <div class="platform second-place">
                <div class="platform-top">
                  <div class="player-spot">
                    <div class="avatar-ring silver">
                      <div class="spot-avatar">{{ getUserInitials(entries()[1]) }}</div>
                    </div>
                    <div class="spot-rank">2</div>
                  </div>
                  <div class="player-details">
                    <a [routerLink]="['/user', entries()[1].userId]" class="spot-name">{{ getUserDisplay(entries()[1]) }}</a>
                    <div class="spot-points">{{ entries()[1].points | number }} pts</div>
                  </div>
                </div>
                <div class="platform-base"></div>
              </div>
            }

            <!-- 1st Place Platform -->
            <div class="platform first-place">
              <div class="crown-icon">👑</div>
              <div class="platform-top">
                <div class="player-spot champion">
                  <div class="avatar-ring gold">
                    <div class="spot-avatar">{{ getUserInitials(entries()[0]) }}</div>
                  </div>
                  <div class="spot-rank">1</div>
                </div>
                <div class="player-details">
                  <a [routerLink]="['/user', entries()[0].userId]" class="spot-name">{{ getUserDisplay(entries()[0]) }}</a>
                  <div class="spot-points champion-points">{{ entries()[0].points | number }} pts</div>
                </div>
              </div>
              <div class="platform-base gold-base"></div>
            </div>

            <!-- 3rd Place Platform -->
            @if (entries().length >= 3) {
              <div class="platform third-place">
                <div class="platform-top">
                  <div class="player-spot">
                    <div class="avatar-ring bronze">
                      <div class="spot-avatar">{{ getUserInitials(entries()[2]) }}</div>
                    </div>
                    <div class="spot-rank">3</div>
                  </div>
                  <div class="player-details">
                    <a [routerLink]="['/user', entries()[2].userId]" class="spot-name">{{ getUserDisplay(entries()[2]) }}</a>
                    <div class="spot-points">{{ entries()[2].points | number }} pts</div>
                  </div>
                </div>
                <div class="platform-base"></div>
              </div>
            }
          </div>
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
                          <a [routerLink]="['/user', entry.userId]" class="player-name" [class.highlight]="i < 3">{{ getUserDisplay(entry) }}</a>
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

    /* Period Tabs - Modern & Aesthetic */
    .period-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2.5rem;
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      max-width: fit-content;
      margin-left: auto;
      margin-right: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .tab-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 12px;
    }

    .tab-btn:hover {
      color: rgba(255, 255, 255, 0.8);
      transform: translateY(-2px);
    }

    .tab-btn:hover::before {
      opacity: 1;
    }

    .tab-btn.active {
      background: var(--accent-primary);
      color: white;
      box-shadow: 0 4px 20px rgba(88, 166, 255, 0.4);
      font-weight: 600;
    }

    .tab-btn.active:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(88, 166, 255, 0.5);
    }

    .tab-icon {
      font-size: 1.1rem;
      filter: grayscale(100%);
      opacity: 0.7;
      transition: all 0.3s ease;
    }

    .tab-btn.active .tab-icon {
      filter: grayscale(0%);
      opacity: 1;
    }

    .tab-label {
      position: relative;
      z-index: 1;
    }

    @media (max-width: 640px) {
      .period-tabs {
        flex-wrap: wrap;
        gap: 0.25rem;
        padding: 0.4rem;
        border-radius: 14px;
      }

      .tab-btn {
        padding: 0.6rem 0.9rem;
        font-size: 0.8rem;
        border-radius: 10px;
      }

      .tab-btn::before {
        border-radius: 10px;
      }

      .tab-icon {
        font-size: 1rem;
      }
    }

    /* Podium - Diseño Facherito */
    .podium-wrapper {
      max-width: 700px;
      margin: 0 auto 3rem;
      padding: 0 1rem;
    }

    .podium-platforms {
      display: grid;
      grid-template-columns: 1fr 1.2fr 1fr;
      gap: 1rem;
      align-items: end;
    }

    .platform {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .platform-top {
      background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-tertiary) 100%);
      border-radius: 16px 16px 0 0;
      padding: 1.5rem 1rem 1rem;
      width: 100%;
      text-align: center;
      border: 1px solid var(--border-color);
      border-bottom: none;
      position: relative;
    }

    .platform-base {
      width: 100%;
      height: 20px;
      background: linear-gradient(180deg, var(--bg-tertiary) 0%, var(--border-color) 100%);
      border-radius: 0 0 4px 4px;
      position: relative;
    }

    /* Heights for each place */
    .first-place .platform-top {
      padding-top: 2rem;
      min-height: 180px;
    }

    .first-place .platform-base {
      height: 30px;
      background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%);
      box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
    }

    .second-place .platform-top {
      min-height: 140px;
    }

    .second-place .platform-base {
      height: 25px;
      background: linear-gradient(180deg, #c0c0c0 0%, #808080 100%);
    }

    .third-place .platform-top {
      min-height: 120px;
    }

    .third-place .platform-base {
      height: 20px;
      background: linear-gradient(180deg, #cd7f32 0%, #8b4513 100%);
    }

    .crown-icon {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2rem;
      z-index: 10;
      animation: float-crown 2s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.5));
    }

    @keyframes float-crown {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-8px); }
    }

    .player-spot {
      position: relative;
      margin-bottom: 0.75rem;
    }

    .player-spot.champion {
      transform: scale(1.1);
    }

    .avatar-ring {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      position: relative;
    }

    .avatar-ring.gold {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
      padding: 4px;
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
    }

    .avatar-ring.silver {
      background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 50%, #c0c0c0 100%);
      padding: 3px;
    }

    .avatar-ring.bronze {
      background: linear-gradient(135deg, #cd7f32 0%, #daa520 50%, #cd7f32 100%);
      padding: 3px;
    }

    .spot-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .avatar-ring.gold .spot-avatar {
      font-size: 1.6rem;
    }

    .spot-rank {
      position: absolute;
      bottom: -5px;
      right: -5px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: white;
      font-weight: 800;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg-primary);
    }

    .player-details {
      margin-top: 0.5rem;
    }

    .spot-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-decoration: none;
      display: block;
      transition: color 0.2s;
    }

    .spot-name:hover {
      color: var(--accent-primary);
    }

    .spot-points {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-family: var(--font-code);
    }

    .champion-points {
      color: #ffd700;
      font-weight: 700;
      font-size: 1rem;
    }

    /* Glow effects */
    .first-place .platform-top {
      box-shadow: 0 -10px 40px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255, 215, 0, 0.2);
      border-color: rgba(255, 215, 0, 0.3);
    }

    /* Single / Double variants */
    .podium-wrapper:has(.platform:only-child) {
      max-width: 280px;
    }

    .podium-wrapper:has(.platform:first-child:nth-last-child(2)) {
      max-width: 450px;
    }

    .podium-wrapper:has(.platform:first-child:nth-last-child(2)) .platform:first-child {
      grid-column: 1;
    }

    .podium-wrapper:has(.platform:first-child:nth-last-child(2)) .platform:last-child {
      grid-column: 2;
    }

    @media (max-width: 600px) {
      .podium-platforms {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .platform {
        max-width: 280px;
        margin: 0 auto;
      }

      .first-place .platform-top,
      .second-place .platform-top,
      .third-place .platform-top {
        min-height: auto;
        padding: 1rem;
        border-radius: 16px;
      }

      .platform-base {
        display: none;
      }

      .crown-icon {
        top: -15px;
        font-size: 1.5rem;
      }
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
      background: rgba(88, 166, 255, 0.08);
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
      background: var(--bg-tertiary);
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-primary);
      flex-shrink: 0;
    }

    .player-avatar.champion {
      background: var(--bg-tertiary);
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3);
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
      text-decoration: none;
      transition: color 0.2s;
    }

    .player-name:hover {
      color: var(--accent-primary);
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
      font-family: var(--font-code);
      color: var(--text-primary);
    }

    .points-display.highlight {
      font-size: 1.4rem;
      color: var(--accent-success);
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

    /* Responsive */
    @media (max-width: 768px) {
      .podium-platforms {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .platform {
        max-width: 280px;
        margin: 0 auto;
      }

      .first-place .platform-top,
      .second-place .platform-top,
      .third-place .platform-top {
        min-height: auto;
        padding: 1rem;
        border-radius: 16px;
      }

      .platform-base {
        display: none;
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
