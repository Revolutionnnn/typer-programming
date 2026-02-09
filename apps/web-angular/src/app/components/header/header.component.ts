import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
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
      </div>
    </header>
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
    `,
  ],
})
export class HeaderComponent {
  i18n = inject(I18nService);
}
