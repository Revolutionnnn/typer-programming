import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { LessonService } from '../../services/lesson.service';
import { ProgressService } from '../../services/progress.service';
import { UserService } from '../../services/user.service';
import { I18nService } from '../../services/i18n.service';
import { LessonSummary, LanguageInfo } from '../../models/lesson.model';
import { Progress } from '../../models/progress.model';

type LevelType = 'basic' | 'intermediate' | 'advanced' | 'exercises';

interface LevelInfo {
  id: LevelType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="lesson-list container">
      <div class="lesson-list__header">
        <h1>{{ i18n.t('lessonList.title') }}</h1>
        <p>{{ i18n.t('lessonList.subtitle') }}</p>
      </div>

      <!-- Language selector -->
      <div class="language-selector">
        <h2 class="language-selector__title">{{ i18n.t('lessonList.chooseLanguage') }}</h2>
        <div class="language-selector__grid">
          @for (lang of languages; track lang.id) {
            <button
              class="lang-btn"
              [class.lang-btn--active]="selectedLanguage === lang.id"
              (click)="selectLanguage(lang.id)"
            >
              <span class="lang-btn__icon">{{ lang.icon }}</span>
              <span class="lang-btn__name">{{ lang.name }}</span>
              <span class="lang-btn__count">{{ lang.lessonCount }} {{ i18n.t('lessonList.lessons') }}</span>
            </button>
          }
          @if (!loadingLanguages && languages.length === 0) {
            <p class="no-data">{{ i18n.t('lessonList.noLanguages') }}</p>
          }
        </div>
      </div>

      @if (loadingLanguages) {
        <div class="loading">
          <p>{{ i18n.t('lessonList.loadingLanguages') }}</p>
        </div>
      }

      @if (error) {
        <div class="error card">
          <p>⚠️ {{ error }}</p>
          <button class="btn" (click)="loadLanguages()">{{ i18n.t('lessonList.retry') }}</button>
        </div>
      }

      <!-- Lessons for selected language -->
      @if (selectedLanguage) {
        <div class="lessons-section">
          <div class="lessons-section__header">
            <h2>{{ selectedLanguageInfo?.icon }} {{ selectedLanguageInfo?.name }}</h2>
            <span class="lessons-section__count">{{ filteredLessons.length }} {{ i18n.t('lessonList.lessons') }}</span>
          </div>

          <!-- Level selector -->
          <div class="level-selector">
            <div class="level-selector__grid">
              @for (level of levels; track level.id) {
                <button
                  class="level-btn"
                  [class.level-btn--active]="selectedLevel === level.id"
                  [class.level-btn--has-content]="hasLessonsInLevel(level.id)"
                  (click)="selectLevel(level.id)"
                >
                  <span class="level-btn__icon">{{ level.icon }}</span>
                  <span class="level-btn__name">{{ level.label }}</span>
                  <span class="level-btn__count">{{ countLessonsInLevel(level.id) }}</span>
                </button>
              }
            </div>
          </div>

          @if (loadingLessons) {
            <div class="loading">
              <p>{{ i18n.t('lessonList.loadingLessons') }}</p>
            </div>
          }

          <div class="lessons-grid">
            @for (lesson of filteredLessons; track lesson.id) {
              <a
                [routerLink]="['/lesson', lesson.id]"
                class="lesson-card card"
                [class.lesson-card--completed]="isCompleted(lesson.id)"
              >
                <div class="lesson-card__header">
                  <span class="lesson-card__order" [class.lesson-card__order--done]="isCompleted(lesson.id)">
                    @if (isCompleted(lesson.id)) { ✓ } @else { {{ lesson.order }} }
                  </span>
                  <div class="lesson-card__badges">
                    <span
                      class="badge"
                      [class.badge--beginner]="lesson.difficulty === 'beginner'"
                      [class.badge--intermediate]="lesson.difficulty === 'intermediate'"
                      [class.badge--advanced]="lesson.difficulty === 'advanced'"
                    >
                      {{ difficultyLabel(lesson.difficulty) }}
                    </span>
                    <span class="badge badge--mode">
                      {{ lesson.mode === 'strict' ? '🔒' : '🔓' }}
                    </span>
                  </div>
                </div>
                <h3 class="lesson-card__title">{{ lesson.title }}</h3>
                <p class="lesson-card__desc">{{ lesson.description }}</p>
                <div class="lesson-card__footer">
                  <span class="lesson-card__concept">{{ lesson.concept }}</span>
                  @if (getProgress(lesson.id); as prog) {
                    <span class="lesson-card__stats">
                      <span class="lesson-card__stat">{{ prog.bestWpm | number:'1.0-0' }} WPM</span>
                      <span class="lesson-card__stat">{{ prog.bestAccuracy | number:'1.0-0' }}%</span>
                    </span>
                  } @else {
                    <span class="lesson-card__arrow">→</span>
                  }
                </div>
              </a>
            }
          </div>

          @if (!loadingLessons && filteredLessons.length === 0) {
            <div class="empty-state card">
              <p>{{ i18n.t('lessonList.noLessons') }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .lesson-list {
        padding: 2rem 1.5rem;
      }

      .lesson-list__header {
        text-align: center;
        margin-bottom: 2rem;

        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        p {
          color: var(--text-secondary);
          font-size: 1rem;
        }
      }

      /* ── Language selector ── */
      .language-selector {
        margin-bottom: 2.5rem;
      }

      .language-selector__title {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .language-selector__grid {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .lang-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 1rem 1.5rem;
        background: var(--bg-card);
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--text-primary);
        min-width: 120px;

        &:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
          background: var(--bg-tertiary);
        }
      }

      .lang-btn--active {
        border-color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.1);
        box-shadow: 0 0 0 1px rgba(88, 166, 255, 0.2);
      }

      .lang-btn__icon {
        font-size: 1.75rem;
      }

      .lang-btn__name {
        font-size: 0.875rem;
        font-weight: 600;
      }

      .lang-btn__count {
        font-size: 0.7rem;
        color: var(--text-muted);
      }

      /* ── Lessons section ── */
      .lessons-section {
        margin-top: 1rem;
      }

      .lessons-section__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border-color);

        h2 {
          font-size: 1.375rem;
          font-weight: 700;
        }
      }

      .lessons-section__count {
        font-size: 0.8rem;
        color: var(--text-muted);
        background: var(--bg-tertiary);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
      }

      /* ── Level selector ── */
      .level-selector {
        margin-bottom: 1.5rem;
      }

      .level-selector__grid {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .level-btn {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.5rem 0.875rem;
        background: var(--bg-card);
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--text-secondary);
        font-size: 0.8125rem;

        &:hover {
          border-color: var(--accent-primary);
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }
      }

      .level-btn--active {
        border-color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.1);
        color: var(--text-primary);
        box-shadow: 0 0 0 1px rgba(88, 166, 255, 0.2);
      }

      .level-btn--has-content {
        /* Visual indicator that level has content */
      }

      .level-btn__icon {
        font-size: 0.875rem;
      }

      .level-btn__name {
        font-weight: 500;
        text-transform: capitalize;
      }

      .level-btn__count {
        font-size: 0.7rem;
        color: var(--text-muted);
        background: var(--bg-tertiary);
        padding: 0.1rem 0.4rem;
        border-radius: 10px;
      }

      .level-btn--active .level-btn__count {
        background: rgba(88, 166, 255, 0.2);
        color: var(--accent-primary);
      }

      .lessons-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .lesson-card {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: var(--text-primary);
        transition: all var(--transition);
        cursor: pointer;

        &:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
        }
      }

      .lesson-card__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .lesson-card__badges {
        display: flex;
        gap: 0.35rem;
      }

      .lesson-card__order {
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-tertiary);
        border-radius: 50%;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--accent-primary);
      }

      .lesson-card__title {
        font-size: 1.0625rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .lesson-card__desc {
        color: var(--text-secondary);
        font-size: 0.8125rem;
        flex-grow: 1;
        margin-bottom: 1rem;
        line-height: 1.5;
      }

      .lesson-card__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-color);
      }

      .lesson-card__concept {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .lesson-card__arrow {
        color: var(--accent-primary);
        font-size: 1.125rem;
      }

      .lesson-card--completed {
        border-color: rgba(63, 185, 80, 0.3);
        background: rgba(63, 185, 80, 0.03);

        &:hover {
          border-color: var(--accent-success);
        }
      }

      .lesson-card__order--done {
        background: rgba(63, 185, 80, 0.2);
        color: var(--accent-success);
        font-size: 0.75rem;
      }

      .lesson-card__stats {
        display: flex;
        gap: 0.5rem;
      }

      .lesson-card__stat {
        font-size: 0.7rem;
        font-family: var(--font-code);
        color: var(--accent-success);
        background: rgba(63, 185, 80, 0.1);
        padding: 0.15rem 0.5rem;
        border-radius: 10px;
        font-weight: 600;
      }

      .badge--mode {
        font-size: 0.7rem;
        padding: 0.1rem 0.4rem;
      }

      .loading, .error, .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
      }

      .no-data {
        color: var(--text-muted);
        font-size: 0.9rem;
        padding: 1rem;
      }

      @media (max-width: 600px) {
        .language-selector__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class LessonListComponent implements OnInit {
  private lessonService = inject(LessonService);
  private progressService = inject(ProgressService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  i18n = inject(I18nService);

  languages: LanguageInfo[] = [];
  lessons: LessonSummary[] = [];
  selectedLanguage = '';
  selectedLanguageInfo: LanguageInfo | null = null;
  selectedLevel: LevelType = 'basic';
  loadingLanguages = true;
  loadingLessons = false;
  error = '';

  levels: LevelInfo[] = [
    { id: 'basic', label: 'Basic', icon: '🌱' },
    { id: 'intermediate', label: 'Intermediate', icon: '📚' },
    { id: 'advanced', label: 'Advanced', icon: '🔥' },
    { id: 'exercises', label: 'Exercises', icon: '✏️' },
  ];

  /** Map of lessonId → Progress for completed lessons */
  private progressMap = new Map<string, Progress>();

  ngOnInit(): void {
    this.loadLanguages();
    this.loadUserProgress();
  }

  private loadUserProgress(): void {
    const userId = this.userService.getUserId();
    this.progressService.getUserProgress(userId).subscribe({
      next: (list) => {
        this.progressMap.clear();
        for (const p of list) {
          this.progressMap.set(p.lessonId, p);
        }
      },
      error: () => { /* silently ignore — badges just won't show */ },
    });
  }

  isCompleted(lessonId: string): boolean {
    return this.progressMap.get(lessonId)?.completed === true;
  }

  getProgress(lessonId: string): Progress | undefined {
    const p = this.progressMap.get(lessonId);
    return p?.completed ? p : undefined;
  }

  loadLanguages(): void {
    this.loadingLanguages = true;
    this.error = '';

    this.lessonService.getLanguages().subscribe({
      next: (languages) => {
        this.languages = languages;
        this.loadingLanguages = false;

        // Auto-select from query param or first language
        const langParam = this.route.snapshot.queryParamMap.get('lang');
        if (langParam && languages.some(l => l.id === langParam)) {
          this.selectLanguage(langParam);
        } else if (languages.length > 0) {
          this.selectLanguage(languages[0].id);
        }
      },
      error: (err) => {
        this.error = this.i18n.t('lessonList.errorLanguages');
        this.loadingLanguages = false;
        console.error('Error loading languages:', err);
      },
    });
  }

  selectLanguage(languageId: string): void {
    if (this.selectedLanguage === languageId && this.lessons.length > 0) return;

    this.selectedLanguage = languageId;
    this.selectedLanguageInfo = this.languages.find(l => l.id === languageId) || null;
    // Reset to basic level when changing language
    this.selectedLevel = 'basic';
    this.loadLessons(languageId);

    // Update URL query param without navigation
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lang: languageId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  selectLevel(level: LevelType): void {
    this.selectedLevel = level;
  }

  get filteredLessons(): LessonSummary[] {
    return this.lessons.filter(lesson => lesson.level === this.selectedLevel);
  }

  hasLessonsInLevel(level: LevelType): boolean {
    return this.lessons.some(lesson => lesson.level === level);
  }

  countLessonsInLevel(level: LevelType): number {
    return this.lessons.filter(lesson => lesson.level === level).length;
  }

  difficultyLabel(difficulty: string): string {
    const key = `lessonList.difficulty.${difficulty}`;
    return this.i18n.t(key);
  }

  private loadLessons(language: string): void {
    this.loadingLessons = true;

    this.lessonService.getLessonsByLanguage(language).subscribe({
      next: (lessons) => {
        this.lessons = lessons.sort((a, b) => a.order - b.order);
        this.loadingLessons = false;
      },
      error: (err) => {
        this.error = this.i18n.t('lessonList.errorLessons');
        this.loadingLessons = false;
        console.error('Error loading lessons:', err);
      },
    });
  }
}
