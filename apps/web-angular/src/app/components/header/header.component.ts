import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { UserService } from '../../services/user.service';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LoginComponent,
    RegisterComponent,
  ],
  template: `
    <header class="header">
      <div class="header__inner container">
        <a routerLink="/" class="header__logo">
          <span class="header__logo-icon">⌨️</span>
          <span class="header__logo-text">Typing Code Learn</span>
        </a>
        <nav class="header__nav">
          <a
            routerLink="/lessons"
            routerLinkActive="active"
            class="header__link"
          >
            {{ i18n.t('nav.lessons') }}
          </a>
          <a
            routerLink="/results"
            routerLinkActive="active"
            class="header__link"
          >
            {{ i18n.t('nav.progress') }}
          </a>
          <a
            routerLink="/leaderboard"
            routerLinkActive="active"
            class="header__link"
          >
            {{ i18n.t('nav.leaderboard') }}
          </a>
        </nav>
        <div class="header__auth">
          @if (currentUser$ | async; as user) {
            <div class="user-info">
              <div class="user-details">
                <span class="username">
                  {{ user.displayName }}
                  @if (user.isGuest) {
                    <span class="guest-badge">Guest</span>
                  }
                </span>
                <div class="streak-info">
                  <span class="streak-icon">🔥</span>
                  <span class="streak-count">{{ user.currentStreak }}</span>
                  <span class="streak-label">{{ i18n.t('streak.days') }}</span>
                </div>
              </div>
              @if (user.isGuest) {
                <button class="btn-auth btn-login" (click)="showLoginModal()">
                  Login
                </button>
                <button class="btn-auth" (click)="showRegisterModal()">
                  Save Progress
                </button>
              } @else {
                <button class="btn-auth" (click)="onLogout()">Logout</button>
              }
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Login Modal -->
    @if (showLogin) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <app-login 
            (loginSuccess)="closeModals()" 
            (closeModal)="closeModals()"
            (switchToRegister)="showRegisterModal()"
          />
        </div>
      </div>
    }

    <!-- Register Modal -->
    @if (showRegister) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <app-register 
            (registerSuccess)="closeModals()"
            (closeModal)="closeModals()"
            (switchToLogin)="showLoginModal()"
          />
        </div>
      </div>
    }
  `,
  styles: [
    `
      .header {
        height: 64px;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
      }

      .header__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      .header__logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        text-decoration: none;
      }

      .header__logo-icon {
        font-size: 1.5rem;
      }

      .header__nav {
        display: flex;
        gap: 1.5rem;
      }

      .header__link {
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        padding: 0.5rem 0;
        transition: color var(--transition);
        text-decoration: none;

        &:hover,
        &.active {
          color: var(--text-primary);
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .user-details {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
      }

      .username {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .guest-badge {
        background: var(--accent-color);
        color: white;
        font-size: 0.625rem;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-weight: 600;
      }

      .streak-info {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .streak-icon {
        font-size: 0.875rem;
      }

      .streak-count {
        font-weight: 600;
        color: var(--accent-color);
      }

      .streak-label {
        font-size: 0.625rem;
      }

      .btn-auth {
        background: #4a90e2;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background: #357abd;
        }
      }

      .btn-login {
        background: #66bb6a;

        &:hover {
          background: #4caf50;
        }
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        position: relative;
        z-index: 1001;
      }
    `,
  ],
})
export class HeaderComponent {
  i18n = inject(I18nService);
  userService = inject(UserService);
  currentUser$ = this.userService.currentUser$;

  showLogin = false;
  showRegister = false;

  showLoginModal() {
    this.showLogin = true;
    this.showRegister = false;
  }

  showRegisterModal() {
    this.showRegister = true;
    this.showLogin = false;
  }

  closeModals() {
    this.showLogin = false;
    this.showRegister = false;
  }

  async onLogout() {
    await this.userService.logout();
  }
}

