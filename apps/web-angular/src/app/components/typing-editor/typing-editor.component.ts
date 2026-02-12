import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TypingEngineService } from '../../services/typing-engine.service';
import { I18nService } from '../../services/i18n.service';
import { CharState, TypingState } from '../../models/typing.model';
import { Lesson } from '../../models/lesson.model';

/** A line with its chars and their global indices for cursor tracking */
interface LineDef {
  chars: CharState[];
  globalIndices: number[];
}

/** Max lives before game over */
const MAX_LIVES = 5;

/** Thresholds for consecutive errors to show escalating messages */
const ERROR_THRESHOLDS = [1, 3, 5, 8, 12, 15];
const ERROR_EMOJIS = ['😅', '😬', '🫠', '💀', '🤯', '🪦'];

const STREAK_THRESHOLDS = [10, 25, 50, 75, 100];
const STREAK_EMOJIS = ['🔥', '⚡', '🚀', '🏆', '👑'];

@Component({
  selector: 'app-typing-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="editor"
      tabindex="0"
      #editorEl
      (click)="focusEditor()"
      (pointerdown)="focusEditor()"
      [class.editor--finished]="state?.finished"
      [class.editor--active]="state?.started && !state?.finished"
      [class.editor--shake]="shaking"
      [class.editor--game-over]="gameOver"
    >
      <textarea
        #inputEl
        class="editor__input"
        inputmode="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        aria-label="Typing input"
        (keydown)="onKeyDown($event)"
        (beforeinput)="onBeforeInput($event)"
        (input)="onInput($event)"
        (compositionend)="onCompositionEnd($event)"
        (paste)="onPaste($event)"
      ></textarea>

      <!-- macOS Window Header -->
      <div class="editor__window-bar">
        <div class="editor__window-controls">
          <span class="editor__dot editor__dot--red"></span>
          <span class="editor__dot editor__dot--yellow"></span>
          <span class="editor__dot editor__dot--green"></span>
        </div>
        <div class="editor__window-title">
          <span class="editor__filename">{{ lesson?.title || 'main.ts' }}</span>
        </div>
        <div class="editor__window-actions"></div>
      </div>

      <!-- Lives + streak header -->
      @if (state?.started && !state?.finished && !gameOver) {
        <div class="editor__gamebar">
          <div class="editor__lives">
            @for (i of livesArray; track i) {
              <span class="editor__heart" [class.editor__heart--lost]="i >= lives">❤️</span>
            }
          </div>
          @if (streak >= 10) {
            <div class="editor__streak">
              <span class="editor__streak-emoji">{{ streakEmoji }}</span>
              <span class="editor__streak-count">{{ streak }}</span>
              <span class="editor__streak-label">{{ streakMessage }}</span>
            </div>
          }
          @if (comboMessage) {
            <div class="editor__combo" [class.editor__combo--error]="comboIsError" [class.editor__combo--success]="!comboIsError">
              <span>{{ comboEmoji }} {{ comboMessage }}</span>
            </div>
          }
        </div>
      }

      <!-- Progress bar -->
      <div class="editor__progress-bar">
        <div
          class="editor__progress-fill"
          [style.width.%]="progressPercent"
          [class.editor__progress-fill--danger]="liveAccuracy < 75"
          [class.editor__progress-fill--warning]="liveAccuracy >= 75 && liveAccuracy < 90"
        ></div>
      </div>

      <!-- Line numbers + code -->
      <div class="editor__content" #contentEl>
        <div class="editor__lines">
          @for (line of lines; track lineIdx; let lineIdx = $index) {
            <div
              class="editor__line"
              [class.editor__line--active]="isActiveLine(lineIdx)"
              [class.editor__line--completed]="isCompletedLine(lineIdx)"
              [attr.data-line]="lineIdx"
              #lineEl
            >
              <span class="editor__line-number">{{ lineIdx + 1 }}</span>
              <span class="editor__line-code">
                @for (charState of line.chars; track charIdx; let charIdx = $index) {
                  <span
                    class="editor__char"
                    [class.editor__char--correct]="charState.status === 'correct'"
                    [class.editor__char--incorrect]="charState.status === 'incorrect'"
                    [class.editor__char--pending]="charState.status === 'pending'"
                    [class.editor__char--cursor]="line.globalIndices[charIdx] === currentIndex"
                    [class.editor__char--next]="charState.status === 'pending' && line.globalIndices[charIdx] === currentIndex"
                    [class.editor__char--hidden]="charState.isHidden && charState.status === 'pending'"
                  >{{ charState.isHidden && charState.status === 'pending' ? '_' : displayChar(charState.char) }}</span>
                }
              </span>
            </div>
          }
        </div>
      </div>

      <!-- Live stats bar -->
      <div class="editor__stats">
        <div class="stat-group">
          <div class="stat">
            <span class="stat__icon">⚡</span>
            <span class="stat__value">{{ liveWPM }} WPM</span>
          </div>
          <div class="stat">
            <span class="stat__icon">🎯</span>
            <span class="stat__value" [class.stat__value--danger]="liveAccuracy < 90">{{ liveAccuracy }}% ACC</span>
          </div>
          <div class="stat">
            <span class="stat__icon">❌</span>
            <span class="stat__value" [class.stat__value--danger]="errorCount > 0">{{ errorCount }} ERR</span>
          </div>
        </div>
        
        <div class="stat-group stat-group--right">
             <div class="stat">
                <span>Ln {{ getCurrentLineNumber() }}, Col {{ getCurrentColNumber() }}</span>
             </div>
             <div class="stat">
                <span class="stat__icon">{{ lesson?.language === 'python' ? '🐍' : lesson?.language === 'go' ? '🐹' : lesson?.language === 'javascript' || lesson?.language === 'typescript' ? '📜' : '📄' }}</span>
                <span>{{ lesson?.language || 'Text' }}</span>
             </div>
        </div>
      </div>

      <!-- Caps Lock warning -->
      @if (capsLockOn) {
        <div class="editor__caps-warning">
          <span class="editor__caps-icon">🔒</span>
          <span>{{ i18n.t('editor.capsLock') }}</span>
        </div>
      }

      <!-- Initial overlay -->
      @if (!ready && !state?.started && !state?.finished && !gameOver) {
        <div class="editor__overlay" (click)="dismissOverlay($event)">
          <div class="editor__overlay-content">
            <div class="editor__overlay-icon">⌨️</div>
            <p>{{ i18n.t('editor.clickToStart') }}</p>
            <span class="editor__overlay-hint">{{ i18n.t('editor.livesHint', { count: maxLives }) }}</span>
          </div>
        </div>
      }

      <!-- Game Over overlay -->
      @if (gameOver) {
        <div class="editor__overlay editor__overlay--gameover">
          <div class="editor__overlay-content editor__overlay-content--gameover">
            <div class="editor__overlay-icon">💀</div>
            <p>{{ i18n.t('editor.gameOverTitle') }}</p>
            <span class="editor__overlay-subtitle">{{ i18n.t('editor.gameOverSubtitle') }}</span>
            <div class="editor__gameover-stats">
              <span>{{ i18n.t('editor.gameOverProgress') }}: {{ progressPercent }}%</span>
              <span>{{ i18n.t('editor.gameOverAccuracy') }}: {{ liveAccuracy }}%</span>
              <span>{{ i18n.t('editor.gameOverErrors') }}: {{ errorCount }}</span>
            </div>
            <button class="editor__retry-btn" (click)="retry()">{{ i18n.t('editor.retry') }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .editor {
        display: flex;
        flex-direction: column;
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 8px;
        overflow: hidden;
        outline: none;
        position: relative;
        font-family: var(--font-code);
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        transition: box-shadow 0.3s ease;

        &:focus-within {
           box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.3), 0 20px 50px rgba(0,0,0,0.5);
        }
      }

      /* Hidden input to capture mobile virtual keyboard typing */
      .editor__input {
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: auto;
        background: transparent;
        color: transparent;
        caret-color: transparent;
        resize: none;
        border: 0;
        outline: none;
        padding: 0;
        margin: 0;
        z-index: 1;
      }

      /* ── Window Bar ── */
      .editor__window-bar {
        display: flex;
        align-items: center;
        padding: 0.6rem 1rem;
        background: #252526;
        border-bottom: 1px solid #333;
        user-select: none;
        flex-shrink: 0;
      }

      .editor__window-controls {
        display: flex;
        gap: 8px;
        width: 60px;
      }

      .editor__dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      .editor__dot--red { background: #ff5f56; }
      .editor__dot--yellow { background: #ffbd2e; }
      .editor__dot--green { background: #27c93f; }

      .editor__window-title {
        flex: 1;
        text-align: center;
        color: #9da5b4;
        font-size: 0.8rem;
        opacity: 0.8;
      }

      .editor__window-actions { width: 60px; }

      /* ── Status Bar (New Look) ── */
      .editor__stats { 
        display: flex;
        justify-content: space-between !important;
        background: #007acc !important;
        color: white;
        padding: 4px 12px !important;
        font-size: 0.75rem;
        font-family: var(--font-ui);
        align-items: center;
        border-top: none !important;
        flex-wrap: nowrap !important;
        min-height: 24px;
      }

      @media (max-width: 480px) {
        .editor__stats {
          padding: 6px 10px !important;
          flex-wrap: wrap !important;
          gap: 0.5rem;
          justify-content: flex-start !important;
        }

        .stat-group {
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .stat-group--right {
          margin-left: 0;
        }

        .editor__line-number {
          width: 2.25rem;
          padding-right: 0.5rem;
          font-size: 0.75rem;
        }

        .editor__line-code {
          font-size: 0.875rem;
        }

        .editor__overlay-content {
          padding: 1.25rem 1.5rem;
        }
      }
      
      .editor--finished .editor__stats { background: var(--accent-success) !important; }
      .editor--game-over .editor__stats { background: var(--accent-error) !important; }

      .stat-group { display: flex; gap: 1rem; align-items: center; }
      .stat-group--right { margin-left: auto; }
      
      .stat { 
        display: flex; 
        align-items: center; 
        gap: 0.4rem; 
      }
      .stat__label { display: none; }
      .stat__value { font-family: var(--font-ui) !important; font-weight: normal; }
      
      .editor__content { background: #1e1e1e; }
      .editor__line--active { background: #2c2c2d !important; border-left: 2px solid #58a6ff; }

      .editor--active {
        border-color: var(--accent-primary);
      }

      .editor--finished {
        border-color: var(--accent-success);
        box-shadow: 0 0 0 3px rgba(63, 185, 80, 0.2);
      }

      .editor--game-over {
        border-color: var(--accent-error);
        box-shadow: 0 0 0 3px rgba(248, 81, 73, 0.2);
      }

      .editor--shake {
        animation: shake 0.4s ease;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 50%, 90% { transform: translateX(-4px); }
        30%, 70% { transform: translateX(4px); }
      }

      /* ── Progress bar ── */
      .editor__progress-bar {
        height: 3px;
        background: var(--bg-tertiary);
        overflow: hidden;
      }

      .editor__progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-success));
        transition: width 0.15s ease-out;
        border-radius: 0 2px 2px 0;
      }

      .editor__progress-fill--warning {
        background: linear-gradient(90deg, var(--accent-warning), var(--accent-primary));
      }

      .editor__progress-fill--danger {
        background: linear-gradient(90deg, var(--accent-error), var(--accent-warning));
      }

      /* ── Game bar (lives + streak) ── */
      .editor__gamebar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.4rem 1rem;
        background: var(--bg-tertiary);
        border-bottom: 1px solid var(--border-color);
        flex-wrap: wrap;
        min-height: 2rem;
      }

      .editor__lives {
        display: flex;
        gap: 2px;
      }

      .editor__heart {
        font-size: 1rem;
        transition: all 0.3s ease;
      }

      .editor__heart--lost {
        filter: grayscale(1) opacity(0.3);
        transform: scale(0.8);
      }

      .editor__streak {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.15rem 0.6rem;
        background: rgba(63, 185, 80, 0.15);
        border: 1px solid rgba(63, 185, 80, 0.3);
        border-radius: 20px;
        animation: streakPulse 1.5s ease infinite;
      }

      .editor__streak-emoji {
        font-size: 0.85rem;
      }

      .editor__streak-count {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--accent-success);
        font-family: var(--font-code);
      }

      .editor__streak-label {
        font-size: 0.7rem;
        color: var(--accent-success);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      @keyframes streakPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(63, 185, 80, 0.2); }
        50% { box-shadow: 0 0 8px 2px rgba(63, 185, 80, 0.15); }
      }

      .editor__combo {
        padding: 0.15rem 0.6rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        animation: comboSlideIn 0.3s ease;
        margin-left: auto;
      }

      .editor__combo--error {
        background: rgba(248, 81, 73, 0.15);
        border: 1px solid rgba(248, 81, 73, 0.3);
        color: var(--accent-error);
      }

      .editor__combo--success {
        background: rgba(63, 185, 80, 0.15);
        border: 1px solid rgba(63, 185, 80, 0.3);
        color: var(--accent-success);
      }

      @keyframes comboSlideIn {
        from { opacity: 0; transform: translateY(-8px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* ── Content area ── */
      .editor__content {
        padding: 1rem;
        overflow-x: auto;
        min-height: 200px;
        max-height: 60vh;
        overflow-y: auto;
        scroll-behavior: smooth;
      }

      @media (max-width: 600px) {
        .editor__content {
          min-height: 150px;
          max-height: 50vh;
          padding: 0.75rem 0.5rem;
        }
      }

      @media (min-width: 1200px) {
        .editor__content {
          min-height: 250px;
          max-height: 70vh;
        }
      }

      .editor__lines {
        display: flex;
        flex-direction: column;
      }

      .editor__line {
        display: flex;
        min-height: 1.75rem;
        line-height: 1.75rem;
        border-radius: 4px;
        padding: 1px 0;
        transition: background-color 0.15s ease;
      }

      .editor__line--active {
        background: rgba(88, 166, 255, 0.06);
      }

      .editor__line--completed {
        background: rgba(63, 185, 80, 0.04);
      }

      .editor__line-number {
        width: 3rem;
        text-align: right;
        padding-right: 1rem;
        color: var(--text-muted);
        font-size: 0.8125rem;
        user-select: none;
        flex-shrink: 0;
        transition: color 0.15s ease;
      }

      .editor__line--active .editor__line-number {
        color: var(--accent-primary);
      }

      .editor__line--completed .editor__line-number {
        color: var(--accent-success);
      }

      .editor__line-code {
        white-space: pre;
        font-size: 0.9375rem;
      }

      /* ── Characters ── */
      .editor__char {
        position: relative;
        transition: color 0.08s ease;
        letter-spacing: 0.5px;
      }

      .editor__char--pending {
        color: var(--text-muted);
        opacity: 0.5;
      }

      .editor__char--hidden {
        color: var(--accent-primary);
        opacity: 0.9;
        font-weight: bold;
        background: rgba(88, 166, 255, 0.08);
        border-radius: 2px;
      }

      .editor__char--correct {
        color: var(--text-primary);
        opacity: 1;
      }

      .editor__char--incorrect {
        color: var(--accent-error);
        background: rgba(248, 81, 73, 0.2);
        border-radius: 2px;
        text-decoration: underline wavy var(--accent-error);
        text-underline-offset: 3px;
      }

      /* Next char to type: slightly highlighted */
      .editor__char--next {
        color: var(--text-secondary);
        opacity: 1;
        background: rgba(88, 166, 255, 0.1);
        border-radius: 2px;
      }

      /* Blinking cursor bar before the current character */
      .editor__char--cursor::before {
        content: '';
        position: absolute;
        left: -1px;
        top: 2px;
        bottom: 2px;
        width: 2px;
        background: var(--accent-primary);
        border-radius: 1px;
        animation: cursor-blink 1s step-end infinite;
        box-shadow: 0 0 4px rgba(88, 166, 255, 0.5);
      }

      @keyframes cursor-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      /* ── Stats bar (Overridden above) ── */
      /* .editor__stats { ... } */

      .stat {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }

      .stat__icon {
        font-size: 0.8rem;
      }

      .stat__label {
        font-size: 0.7rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat__value {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--text-primary);
        font-family: var(--font-code);
        min-width: 2ch;
      }

      .stat__value--warning {
        color: var(--accent-warning);
      }

      .stat__value--danger {
        color: var(--accent-error);
      }

      .editor__caps-warning {
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--accent-warning);
        color: var(--bg-primary);
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius);
        font-size: 0.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 20;
        animation: fadeIn 0.2s ease;
      }

      .editor__caps-icon {
        font-size: 1rem;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* ── Overlay ── */
      .editor__overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(13, 17, 23, 0.75);
        backdrop-filter: blur(3px);
        z-index: 10;
        cursor: pointer;
      }

      .editor__overlay--gameover {
        background: rgba(13, 17, 23, 0.9);
        backdrop-filter: blur(6px);
      }

      .editor__overlay-content {
        text-align: center;
        padding: 2rem 3rem;
        border: 1px dashed var(--border-color);
        border-radius: var(--border-radius);
        background: rgba(22, 27, 34, 0.8);
        transition: border-color 0.2s ease, transform 0.2s ease;

        &:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
        }
      }

      .editor__overlay-content--gameover {
        border-color: var(--accent-error);
        animation: gameOverPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

        &:hover {
          border-color: var(--accent-error);
        }
      }

      @keyframes gameOverPop {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      .editor__overlay-icon {
        font-size: 2.5rem;
        margin-bottom: 0.75rem;
      }

      .editor__overlay-content p {
        color: var(--text-primary);
        font-size: 1.1rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }

      .editor__overlay-subtitle {
        color: var(--text-secondary);
        font-size: 0.9rem;
        display: block;
        margin-bottom: 1rem;
      }

      .editor__overlay-hint {
        color: var(--text-muted);
        font-size: 0.8rem;
      }

      .editor__gameover-stats {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-bottom: 1.25rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 6px;

        span {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-family: var(--font-code);
        }
      }

      .editor__retry-btn {
        background: var(--accent-primary);
        color: var(--bg-primary);
        border: none;
        padding: 0.6rem 1.5rem;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.15s ease;
        font-family: var(--font-ui);

        &:hover {
          background: #79b8ff;
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class TypingEditorComponent implements OnChanges, AfterViewInit {
  @Input() lesson: Lesson | null = null;
  @Output() completed = new EventEmitter<void>();

  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;
  @ViewChild('contentEl') contentEl!: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl') inputEl!: ElementRef<HTMLTextAreaElement>;

  state: TypingState | null = null;
  lines: LineDef[] = [];
  currentIndex = 0;
  liveWPM = 0;
  liveAccuracy = 100;
  progressPercent = 0;
  errorCount = 0;
  capsLockOn = false;

  // Gamification
  readonly maxLives = MAX_LIVES;
  lives = MAX_LIVES;
  livesArray = Array.from({ length: MAX_LIVES }, (_, i) => i);
  streak = 0;
  bestStreak = 0;
  consecutiveErrors = 0;
  shaking = false;
  gameOver = false;
  ready = false;

  comboMessage = '';
  comboEmoji = '';
  comboIsError = false;
  streakEmoji = '🔥';
  streakMessage = '';

  private prevErrorCount = 0;
  private comboTimeout: ReturnType<typeof setTimeout> | null = null;
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private stateSub: Subscription | null = null;
  private finishedSub: Subscription | null = null;

  private suppressNextBackspaceKeydown = false;
  private ignoreNextInput = false;

  i18n: I18nService;

  constructor(
    private engine: TypingEngineService,
    private cdr: ChangeDetectorRef,
    i18n: I18nService,
  ) {
    this.i18n = i18n;
    this.streakMessage = this.i18n.t('editor.streak.default');
  }

  ngAfterViewInit(): void {
    this.focusEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lesson'] && this.lesson) {
      this.resetGame();
      this.clearSubscriptions();
      this.engine.init(this.lesson);

      this.stateSub = this.engine.state$.subscribe((state) => {
        this.state = state;
        this.currentIndex = state.currentIndex;
        this.buildLines(state.chars);
        this.updateLiveStats();
        this.checkGamification();
        this.scrollToActiveLine();
      });

      this.finishedSub = this.engine.finished$.subscribe((finished) => {
        if (finished && this.state?.started) {
          this.completed.emit();
          this.clearStatsInterval();
        }
      });

      this.startStatsInterval();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Detect Caps Lock state (best-effort; may be false on mobile)
    this.capsLockOn = event.getModifierState?.('CapsLock') || false;

    if (this.gameOver) {
      event.preventDefault();
      return;
    }

    // If beforeinput already handled backspace, don't double-apply it.
    if (event.key === 'Backspace' && this.suppressNextBackspaceKeydown) {
      this.suppressNextBackspaceKeydown = false;
      event.preventDefault();
      return;
    }

    // Special keys that won't reliably arrive via `input`
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.engine.handleBackspaceInput();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      this.ignoreNextInput = true;
      this.engine.handleTextInput('\t');
      return;
    }

    // For regular characters / Enter: avoid handling in keydown.
    // Mobile keyboards may emit keydown + beforeinput + input, which causes duplicates.
    // We handle text via beforeinput/input/compositionend instead.
  }

  onBeforeInput(event: Event): void {
    if (this.gameOver) return;

    const e = event as InputEvent;
    if (e.inputType === 'deleteContentBackward') {
      this.suppressNextBackspaceKeydown = true;
      e.preventDefault();
      this.ignoreNextInput = true;
      this.engine.handleBackspaceInput();
      return;
    }

    // Capture inserted text here for best mobile support (Gboard/iOS composition/prediction).
    if (
      e.inputType === 'insertText'
      || e.inputType === 'insertReplacementText'
    ) {
      const data = e.data ?? '';
      if (data) {
        e.preventDefault();
        this.ignoreNextInput = true;
        this.engine.handleTextInput(data);
        return;
      }
    }

    if (e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') {
      e.preventDefault();
      this.ignoreNextInput = true;
      this.engine.handleTextInput('\n');
      return;
    }

    // Prevent paste/drag-drop insertions from injecting full text.
    if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') {
      e.preventDefault();
    }
  }

  onInput(event: Event): void {
    if (this.gameOver) return;

    const e = event as InputEvent;
    // If the keyboard is composing and we didn't intercept via beforeinput,
    // let it finish and handle it on compositionend.
    if (e.isComposing) return;

    const el = event.target as HTMLTextAreaElement | null;
    if (!el) return;

    if (this.ignoreNextInput) {
      this.ignoreNextInput = false;
      el.value = '';
      return;
    }

    const value = el.value;
    if (!value) return;

    this.engine.handleTextInput(value);

    // Keep textarea empty so next input event only contains new chars.
    el.value = '';
  }

  onCompositionEnd(event: CompositionEvent): void {
    if (this.gameOver) return;

    const el = event.target as HTMLTextAreaElement | null;
    if (!el) return;
    if (!el.value) return;

    this.engine.handleTextInput(el.value);
    el.value = '';
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
  }

  focusEditor(): void {
    // Focus the hidden textarea to open the virtual keyboard on mobile.
    this.inputEl?.nativeElement.focus();
  }

  dismissOverlay(event: Event): void {
    event.stopPropagation();
    this.ready = true;
    this.focusEditor();
  }

  retry(): void {
    this.resetGame();
    if (this.lesson) {
      this.engine.init(this.lesson);
    }
    this.focusEditor();
  }

  /** Check if this line contains the cursor */
  isActiveLine(lineIdx: number): boolean {
    if (!this.lines[lineIdx]) return false;
    const indices = this.lines[lineIdx].globalIndices;
    return indices.length > 0
      && this.currentIndex >= indices[0]
      && this.currentIndex <= indices[indices.length - 1];
  }

  /** Check if all chars in this line are completed */
  isCompletedLine(lineIdx: number): boolean {
    if (!this.lines[lineIdx]) return false;
    const indices = this.lines[lineIdx].globalIndices;
    return indices.length > 0 && this.currentIndex > indices[indices.length - 1];
  }

  displayChar(char: string): string {
    if (char === '\n') return '↵\n';
    if (char === '\t') return '  ';
    return char;
  }

  private resetGame(): void {
    this.lives = MAX_LIVES;
    this.streak = 0;
    this.bestStreak = 0;
    this.consecutiveErrors = 0;
    this.shaking = false;
    this.gameOver = false;
    this.ready = false;
    this.comboMessage = '';
    this.comboEmoji = '';
    this.prevErrorCount = 0;
    this.errorCount = 0;
    this.liveAccuracy = 100;
    this.progressPercent = 0;
  }

  private checkGamification(): void {
    const currentErrors = this.engine.totalErrorAttempts;
    const newErrors = currentErrors - this.prevErrorCount;

    if (newErrors > 0) {
      // User made error(s)
      this.streak = 0;
      this.consecutiveErrors += newErrors;
      this.lives = Math.max(0, MAX_LIVES - this.consecutiveErrors);

      // Shake the editor
      this.triggerShake();

      // Show escalating error message
      const msg = this.getErrorMessage(this.consecutiveErrors);
      if (msg) {
        this.showCombo(msg.emoji, msg.message, true);
      }

      // Game over check
      if (this.lives <= 0) {
        this.gameOver = true;
      }
    } else if (this.state && this.state.started && currentErrors === this.prevErrorCount && this.currentIndex > 0) {
      // User typed correctly — only count if index advanced
      const prevIndex = this.currentIndex;
      if (prevIndex > 0) {
        this.streak++;
        // Recovering from errors: every 5 correct in a row recovers a life
        if (this.consecutiveErrors > 0 && this.streak > 0 && this.streak % 5 === 0) {
          this.consecutiveErrors = Math.max(0, this.consecutiveErrors - 1);
          this.lives = Math.min(MAX_LIVES, MAX_LIVES - this.consecutiveErrors);
          this.showCombo('💚', this.i18n.t('editor.lifeRecovered'), false);
        }

        if (this.streak > this.bestStreak) {
          this.bestStreak = this.streak;
        }

        // Show streak message at thresholds
        const streakMsg = this.getStreakMessage(this.streak);
        if (streakMsg) {
          this.streakEmoji = streakMsg.emoji;
          this.streakMessage = streakMsg.message;
          // Show combo for milestone streaks
          if (STREAK_THRESHOLDS.includes(this.streak)) {
            this.showCombo(streakMsg.emoji, streakMsg.message, false);
          }
        }
      }
    }

    this.prevErrorCount = currentErrors;
  }

  private getErrorMessage(consecutive: number): { emoji: string; message: string } | null {
    let result: { emoji: string; message: string } | null = null;
    for (let i = 0; i < ERROR_THRESHOLDS.length; i++) {
      if (consecutive >= ERROR_THRESHOLDS[i]) {
        result = {
          emoji: ERROR_EMOJIS[i],
          message: this.i18n.t(`editor.error.${ERROR_THRESHOLDS[i]}`),
        };
      }
    }
    return result;
  }

  private getStreakMessage(streak: number): { emoji: string; message: string } | null {
    let result: { emoji: string; message: string } | null = null;
    for (let i = 0; i < STREAK_THRESHOLDS.length; i++) {
      if (streak >= STREAK_THRESHOLDS[i]) {
        result = {
          emoji: STREAK_EMOJIS[i],
          message: this.i18n.t(`editor.streak.${STREAK_THRESHOLDS[i]}`),
        };
      }
    }
    return result;
  }

  private showCombo(emoji: string, message: string, isError: boolean): void {
    this.comboEmoji = emoji;
    this.comboMessage = message;
    this.comboIsError = isError;

    if (this.comboTimeout) clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.comboMessage = '';
      this.cdr.detectChanges();
    }, 2000);
  }

  private triggerShake(): void {
    this.shaking = true;
    setTimeout(() => {
      this.shaking = false;
      this.cdr.detectChanges();
    }, 400);
  }

  private buildLines(chars: CharState[]): void {
    this.lines = [];
    let currentLine: CharState[] = [];
    let currentIndices: number[] = [];

    for (let i = 0; i < chars.length; i++) {
      currentLine.push(chars[i]);
      currentIndices.push(i);
      if (chars[i].char === '\n') {
        this.lines.push({ chars: currentLine, globalIndices: currentIndices });
        currentLine = [];
        currentIndices = [];
      }
    }

    if (currentLine.length > 0) {
      this.lines.push({ chars: currentLine, globalIndices: currentIndices });
    }
  }

  getCurrentLineNumber(): number {
    // Find line containing currentIndex
    for (let i = 0; i < this.lines.length; i++) {
        const line = this.lines[i];
        if (line.globalIndices.length > 0) {
            const first = line.globalIndices[0];
            const last = line.globalIndices[line.globalIndices.length - 1];
            // If current index is in this line (or at the very end of it, waiting for next char)
            if (this.currentIndex >= first && this.currentIndex <= last + 1) {
                return i + 1;
            }
        } else if (this.lines.length === 1) {
            // Empty single line case
            return 1;
        }
    }
    return this.lines.length; // Default to last line
  }

  getCurrentColNumber(): number {
      const lineNum = this.getCurrentLineNumber();
      const line = this.lines[lineNum - 1];
      if (!line || line.globalIndices.length === 0) return 1;
      
      const col = this.currentIndex - line.globalIndices[0] + 1;
      return col > 0 ? col : 1;
  }

  private updateLiveStats(): void {
    if (!this.state) return;
    const metrics = this.engine.getMetrics();
    this.liveWPM = metrics.wpm;
    this.liveAccuracy = metrics.accuracy;
    this.errorCount = metrics.incorrectChars;

    const total = this.state.chars.length;
    this.progressPercent =
      total > 0
        ? Math.round((this.state.currentIndex / total) * 100)
        : 0;
  }

  private scrollToActiveLine(): void {
    if (!this.contentEl) return;
    const activeLineIdx = this.lines.findIndex((line) => {
      const indices = line.globalIndices;
      return indices.length > 0
        && this.currentIndex >= indices[0]
        && this.currentIndex <= indices[indices.length - 1];
    });
    if (activeLineIdx < 0) return;

    const container = this.contentEl.nativeElement;
    const lineElements = container.querySelectorAll('[data-line]');
    const activeLine = lineElements[activeLineIdx] as HTMLElement;
    if (!activeLine) return;

    const containerRect = container.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();

    if (lineRect.bottom > containerRect.bottom - 40) {
      activeLine.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    if (lineRect.top < containerRect.top + 40) {
      activeLine.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  private startStatsInterval(): void {
    this.clearStatsInterval();
    this.statsInterval = setInterval(() => {
      if (this.state?.started && !this.state.finished) {
        this.liveWPM = this.engine.getLiveWPM();
        this.cdr.detectChanges();
      }
    }, 500);
  }

  private clearStatsInterval(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private clearSubscriptions(): void {
    if (this.stateSub) {
      this.stateSub.unsubscribe();
      this.stateSub = null;
    }
    if (this.finishedSub) {
      this.finishedSub.unsubscribe();
      this.finishedSub = null;
    }
    this.clearStatsInterval();
  }
}
