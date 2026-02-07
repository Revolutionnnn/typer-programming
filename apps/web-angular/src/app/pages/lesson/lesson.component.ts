import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LessonService } from '../../services/lesson.service';
import { ProgressService } from '../../services/progress.service';
import { TypingEngineService } from '../../services/typing-engine.service';
import { UserService } from '../../services/user.service';
import { I18nService } from '../../services/i18n.service';
import { Lesson } from '../../models/lesson.model';
import { TypingEditorComponent } from '../../components/typing-editor/typing-editor.component';

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [CommonModule, RouterLink, TypingEditorComponent],
  template: `
    <div class="lesson container">
      @if (loading) {
        <div class="loading">
          <p>{{ i18n.t('lesson.loading') }}</p>
        </div>
      }

      @if (error) {
        <div class="error card">
          <p>⚠️ {{ error }}</p>
          <a routerLink="/lessons" class="btn">{{ i18n.t('lesson.backToLessons') }}</a>
        </div>
      }

      @if (lesson) {
        <!-- Lesson Header -->
        <div class="lesson__header">
          <a routerLink="/lessons" class="lesson__back">{{ i18n.t('lesson.back') }}</a>
          <div class="lesson__meta">
            <span
              class="badge"
              [class.badge--beginner]="lesson.difficulty === 'beginner'"
              [class.badge--intermediate]="lesson.difficulty === 'intermediate'"
              [class.badge--advanced]="lesson.difficulty === 'advanced'"
            >
              {{ lesson.difficulty }}
            </span>
            <span class="lesson__mode">
              {{ lesson.mode === 'strict' ? i18n.t('lesson.strict') : i18n.t('lesson.practice') }}
            </span>
          </div>
        </div>

        <h1 class="lesson__title">{{ lesson.title }}</h1>
        <p class="lesson__desc">{{ lesson.description }}</p>

        <!-- Explanation -->
        @if (!showEditor) {
          <div class="explanation card">
            <h2>{{ i18n.t('lesson.explanation') }}</h2>
            <ul class="explanation__list">
              @for (line of lesson.explanation; track $index) {
                <li>{{ line }}</li>
              }
            </ul>
            <button class="btn btn--primary" (click)="startTyping()">
              {{ i18n.t('lesson.startTyping') }}
            </button>
          </div>
        }

        <!-- Typing Editor -->
        @if (showEditor && !showResults) {
          <app-typing-editor
            [code]="lesson.code"
            [mode]="lesson.mode"
            (completed)="onCompleted()"
          />
        }

        <!-- Results -->
        @if (showResults) {
          <div class="results card">
            <h2>{{ i18n.t('lesson.completed') }}</h2>

            <div class="results__grid">
              <div class="result-item">
                <span class="result-item__value">{{ metrics.wpm }}</span>
                <span class="result-item__label">{{ i18n.t('lesson.wpm') }}</span>
              </div>
              <div class="result-item">
                <span class="result-item__value">{{ metrics.accuracy }}%</span>
                <span class="result-item__label">{{ i18n.t('lesson.accuracy') }}</span>
              </div>
              <div class="result-item">
                <span class="result-item__value">{{ metrics.totalTime }}s</span>
                <span class="result-item__label">{{ i18n.t('lesson.time') }}</span>
              </div>
              <div class="result-item">
                <span class="result-item__value">{{ metrics.incorrectChars }}</span>
                <span class="result-item__label">{{ i18n.t('lesson.errors') }}</span>
              </div>
            </div>

            <div class="results__actions">
              <button class="btn" (click)="retry()">{{ i18n.t('lesson.retry') }}</button>
              <a routerLink="/lessons" class="btn btn--primary">
                {{ i18n.t('lesson.next') }}
              </a>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .lesson {
        padding: 2rem 1.5rem;
        max-width: 900px;
      }

      .lesson__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .lesson__back {
        color: var(--text-secondary);
        font-size: 0.875rem;

        &:hover {
          color: var(--text-primary);
        }
      }

      .lesson__meta {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .lesson__mode {
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }

      .lesson__title {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .lesson__desc {
        color: var(--text-secondary);
        margin-bottom: 2rem;
        font-size: 1rem;
      }

      .explanation {
        margin-bottom: 2rem;

        h2 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }
      }

      .explanation__list {
        list-style: none;
        margin-bottom: 1.5rem;

        li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          color: var(--text-secondary);
          font-size: 0.9375rem;
          line-height: 1.6;

          &::before {
            content: '▸';
            position: absolute;
            left: 0;
            color: var(--accent-primary);
          }
        }
      }

      .results {
        text-align: center;
        padding: 2.5rem;

        h2 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
        }
      }

      .results__grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .result-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .result-item__value {
        font-size: 2rem;
        font-weight: 700;
        font-family: var(--font-code);
        color: var(--accent-primary);
      }

      .result-item__label {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .results__actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
      }

      .loading, .error {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
      }

      @media (max-width: 600px) {
        .results__grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class LessonComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private lessonService = inject(LessonService);
  private progressService = inject(ProgressService);
  private typingEngine = inject(TypingEngineService);
  private userService = inject(UserService);
  i18n = inject(I18nService);

  lesson: Lesson | null = null;
  loading = true;
  error = '';
  showEditor = false;
  showResults = false;

  metrics = {
    wpm: 0,
    accuracy: 0,
    totalTime: 0,
    totalChars: 0,
    correctChars: 0,
    incorrectChars: 0,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = this.i18n.t('lesson.errorNoId');
      this.loading = false;
      return;
    }

    this.lessonService.getLesson(id).subscribe({
      next: (lesson) => {
        this.lesson = lesson;
        this.loading = false;
      },
      error: (err) => {
        this.error = this.i18n.t('lesson.errorLoad');
        this.loading = false;
        console.error(err);
      },
    });
  }

  startTyping(): void {
    this.showEditor = true;
  }

  onCompleted(): void {
    // Defer to avoid ExpressionChangedAfterItHasBeenCheckedError (NG0100)
    // The typing editor emits completed during a CD cycle that may overlap
    // with the parent template's bindings.
    setTimeout(() => {
      this.metrics = this.typingEngine.getMetrics();
      this.showResults = true;

      if (this.lesson) {
        const userId = this.userService.getUserId();

        // Save progress
        this.progressService
          .saveProgress({
            userId,
            lessonId: this.lesson.id,
            wpm: this.metrics.wpm,
            accuracy: this.metrics.accuracy,
            completed: true,
          })
          .subscribe({
            error: (err) => console.error('Failed to save progress:', err),
          });

        // Save metrics
        const metricsReq = this.typingEngine.buildMetricsRequest(
          userId,
          this.lesson.id
        );
        this.progressService.saveMetrics(metricsReq).subscribe({
          error: (err) => console.error('Failed to save metrics:', err),
        });
      }
    });
  }

  retry(): void {
    this.showEditor = false;
    this.showResults = false;
    this.typingEngine.reset();

    // Small delay to re-render
    setTimeout(() => {
      this.showEditor = true;
    }, 50);
  }
}
