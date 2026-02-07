import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LessonService } from '../../services/lesson.service';
import { I18nService } from '../../services/i18n.service';
import { LanguageInfo } from '../../models/lesson.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home container">
      <section class="hero">
        <h1 class="hero__title">
          {{ i18n.t('home.title') }}
          <span class="hero__highlight">{{ i18n.t('home.title.highlight') }}</span>
        </h1>
        <p class="hero__subtitle">
          {{ i18n.t('home.subtitle') }}
        </p>
        <div class="hero__actions">
          <a routerLink="/lessons" class="btn btn--primary btn--lg">
            {{ i18n.t('home.cta') }}
          </a>
        </div>
      </section>

      <section class="features">
        <div class="feature card">
          <div class="feature__icon">⌨️</div>
          <h3 class="feature__title">{{ i18n.t('home.feature.typing.title') }}</h3>
          <p class="feature__desc">
            {{ i18n.t('home.feature.typing.desc') }}
          </p>
        </div>

        <div class="feature card">
          <div class="feature__icon">📊</div>
          <h3 class="feature__title">{{ i18n.t('home.feature.metrics.title') }}</h3>
          <p class="feature__desc">
            {{ i18n.t('home.feature.metrics.desc') }}
          </p>
        </div>

        <div class="feature card">
          <div class="feature__icon">🧠</div>
          <h3 class="feature__title">{{ i18n.t('home.feature.concepts.title') }}</h3>
          <p class="feature__desc">
            {{ i18n.t('home.feature.concepts.desc') }}
          </p>
        </div>

        <div class="feature card">
          <div class="feature__icon">🎯</div>
          <h3 class="feature__title">{{ i18n.t('home.feature.progressive.title') }}</h3>
          <p class="feature__desc">
            {{ i18n.t('home.feature.progressive.desc') }}
          </p>
        </div>
      </section>

      <section class="languages">
        <h2 class="languages__title">{{ i18n.t('home.languages.title') }}</h2>
        <div class="languages__grid">
          @for (lang of languages; track lang.id) {
            <a
              [routerLink]="['/lessons']"
              [queryParams]="{ lang: lang.id }"
              class="lang-card card"
            >
              <span class="lang-card__icon">{{ lang.icon }}</span>
              <h3>{{ lang.name }}</h3>
              <p>{{ lang.lessonCount }} {{ i18n.t('home.lessons.count') }}</p>
              <span class="badge badge--beginner">{{ i18n.t('home.languages.available') }}</span>
            </a>
          }
          @if (languages.length === 0 && !loadingLangs) {
            <div class="lang-card card lang-card--soon">
              <span class="lang-card__icon">⏳</span>
              <h3>{{ i18n.t('home.languages.loading') }}</h3>
              <p>{{ i18n.t('home.languages.connecting') }}</p>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .home {
        padding: 3rem 1.5rem;
      }

      .hero {
        text-align: center;
        padding: 4rem 0 3rem;
        max-width: 720px;
        margin: 0 auto;
      }

      .hero__title {
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 1rem;
      }

      .hero__highlight {
        display: block;
        background: linear-gradient(135deg, #58a6ff, #3fb950);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero__subtitle {
        color: var(--text-secondary);
        font-size: 1.125rem;
        max-width: 560px;
        margin: 0 auto 2rem;
        line-height: 1.7;
      }

      .hero__actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
      }

      .btn--lg {
        padding: 0.875rem 2rem;
        font-size: 1rem;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        padding: 3rem 0;
      }

      .feature {
        text-align: center;
        padding: 2rem;
      }

      .feature__icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      .feature__title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .feature__desc {
        color: var(--text-secondary);
        font-size: 0.875rem;
        line-height: 1.6;
      }

      .languages {
        padding: 2rem 0 4rem;
      }

      .languages__title {
        text-align: center;
        font-size: 1.5rem;
        margin-bottom: 2rem;
      }

      .languages__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        max-width: 900px;
        margin: 0 auto;
      }

      .lang-card {
        text-align: center;
        padding: 2rem;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--accent-primary);
          transform: translateY(-3px);
        }

        h3 {
          font-size: 1.125rem;
          margin: 0.75rem 0 0.25rem;
        }

        p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }
      }

      .lang-card__icon {
        font-size: 2.5rem;
      }

      .lang-card--soon {
        opacity: 0.5;
        pointer-events: none;
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  private lessonService = inject(LessonService);
  i18n = inject(I18nService);

  languages: LanguageInfo[] = [];
  loadingLangs = true;

  ngOnInit(): void {
    this.lessonService.getLanguages().subscribe({
      next: (langs) => {
        this.languages = langs;
        this.loadingLangs = false;
      },
      error: () => {
        this.loadingLangs = false;
      },
    });
  }
}
