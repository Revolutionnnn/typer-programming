import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  TypingState,
  CharState,
  ErrorEntry,
  MetricsRequest,
} from '../models/typing.model';

@Injectable({ providedIn: 'root' })
export class TypingEngineService {
  private state!: TypingState;
  private code = '';
  private mode: 'strict' | 'practice' = 'strict';

  private lastLesson?: { code: string; mode?: 'strict' | 'practice'; exclude?: string[] };
  readonly state$ = new BehaviorSubject<TypingState>(this.createEmptyState());
  readonly finished$ = new BehaviorSubject<boolean>(false);
  totalErrorAttempts = 0;

  /** Initialize the engine with a code snippet */
  init(lesson: { code: string; mode?: 'strict' | 'practice'; exclude?: string[] }): void {
    this.lastLesson = lesson;
    const code = lesson.code;
    const mode = lesson.mode || 'strict';
    const exclude = lesson.exclude || [];

    this.mode = mode;

    // First, process any manual [[hidden]] markers
    const chars: CharState[] = [];
    const manualRegex = /\[\[(.*?)\]\]/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const segments: { text: string; isHidden: boolean }[] = [];

    while ((match = manualRegex.exec(code)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: code.substring(lastIndex, match.index), isHidden: false });
      }
      segments.push({ text: match[1], isHidden: true });
      lastIndex = manualRegex.lastIndex;
    }
    if (lastIndex < code.length) {
      segments.push({ text: code.substring(lastIndex), isHidden: false });
    }

    // Now, for each non-hidden segment, apply the exclude list
    for (const seg of segments) {
      if (seg.isHidden) {
        for (const c of seg.text) {
          chars.push({ char: c, status: 'pending', isHidden: true });
        }
      } else {
        // If there's an exclude list, we need to mark those words
        if (exclude.length > 0) {
          // Build regex carefully: only use \b for words that start/end with word characters
          const escapedWords = exclude.map(w => {
            const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const startBoundary = /^\w/.test(w) ? '\\b' : '';
            const endBoundary = /\w$/.test(w) ? '\\b' : '';
            return `${startBoundary}${escaped}${endBoundary}`;
          });
          const excludeRegex = new RegExp(`(${escapedWords.join('|')})`, 'g');

          let segLastIndex = 0;
          let segMatch: RegExpExecArray | null;

          while ((segMatch = excludeRegex.exec(seg.text)) !== null) {
            // Text before match
            for (let i = segLastIndex; i < segMatch.index; i++) {
              chars.push({ char: seg.text[i], status: 'pending' });
            }
            // The excluded word
            for (const c of segMatch[1]) {
              chars.push({ char: c, status: 'pending', isHidden: true });
            }
            segLastIndex = excludeRegex.lastIndex;
          }
          // Remaining text
          for (let i = segLastIndex; i < seg.text.length; i++) {
            chars.push({ char: seg.text[i], status: 'pending' });
          }
        } else {
          for (const c of seg.text) {
            chars.push({ char: c, status: 'pending' });
          }
        }
      }
    }

    // Store the clean code (without [[ ]] markers)
    this.code = chars.map((c) => c.char).join('');

    this.state = {
      currentIndex: 0,
      chars,
      started: false,
      finished: false,
      startTime: null,
      endTime: null,
      errors: new Map(),
    };

    this.totalErrorAttempts = 0;
    this.finished$.next(false);
    this.emit();
  }

  /** Process a keypress from the user */
  handleKey(event: KeyboardEvent): void {
    if (this.state.finished) return;

    // Prevent paste
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault();
      return;
    }

    // Handle special keys
    if (event.key === 'Backspace') {
      this.processBackspace();
      return;
    }

    // Ignore modifier keys, function keys, etc.
    if (event.key.length > 1 && event.key !== 'Tab' && event.key !== 'Enter') {
      return;
    }

    // Map key
    let typed: string;
    if (event.key === 'Enter') {
      typed = '\n';
    } else if (event.key === 'Tab') {
      event.preventDefault();
      typed = '\t';
    } else {
      typed = event.key;
    }

    this.processChar(typed);
  }

  /**
   * Process text coming from an <input>/<textarea> (mobile virtual keyboards, IME, etc).
   * This bypasses KeyboardEvent and feeds characters directly.
   */
  handleTextInput(text: string): void {
    if (this.state.finished) return;
    if (!text) return;

    // Normalize CRLF and stray CR
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (const ch of normalized) {
      this.processChar(ch);
      if (this.state.finished) return;
    }
  }

  /** Handle backspace coming from an <input>/<textarea> */
  handleBackspaceInput(): void {
    if (this.state.finished) return;
    this.processBackspace();
  }

  /** Process a single character */
  private processChar(typed: string): void {
    if (this.state.currentIndex >= this.state.chars.length) return;

    // Start timer on first keypress
    if (!this.state.started) {
      this.state.started = true;
      this.state.startTime = Date.now();
    }

    const expected = this.state.chars[this.state.currentIndex].char;

    if (typed === expected) {
      this.state.chars[this.state.currentIndex].status = 'correct';
      this.state.currentIndex++;
    } else {
      this.state.chars[this.state.currentIndex].status = 'incorrect';

      // Track errors
      const errorKey = `${expected}->${typed}`;
      const existing = this.state.errors.get(errorKey);
      if (existing) {
        existing.count++;
      } else {
        this.state.errors.set(errorKey, {
          expected,
          typed,
          count: 1,
        });
      }

      this.totalErrorAttempts++;

      if (this.mode === 'practice') {
        // In practice mode, advance even on errors
        this.state.currentIndex++;
      } else {
        // In strict mode, flash incorrect then reset to pending so user retries
        this.emit();
        setTimeout(() => {
          this.state.chars[this.state.currentIndex].status = 'pending';
          this.emit();
        }, 200);
        return; // don't emit twice
      }
    }

    // Check if finished
    if (this.state.currentIndex >= this.state.chars.length) {
      this.state.finished = true;
      this.state.endTime = Date.now();
      this.finished$.next(true);
    }

    this.emit();
  }

  /** Handle backspace */
  private processBackspace(): void {
    if (this.state.currentIndex <= 0) return;

    // Only allow backspace in practice mode or when current char is incorrect
    if (this.mode === 'strict') {
      // In strict mode, allow going back only if current position has an incorrect char
      const current = this.state.chars[this.state.currentIndex];
      if (current?.status === 'incorrect') {
        current.status = 'pending';
        // Don't decrement — stay and retry
      }
    } else {
      // In practice mode, allow free backspace
      this.state.currentIndex--;
      this.state.chars[this.state.currentIndex].status = 'pending';
    }

    this.emit();
  }

  /** Calculate current metrics */
  getMetrics(): {
    wpm: number;
    accuracy: number;
    totalTime: number;
    totalChars: number;
    correctChars: number;
    incorrectChars: number;
    totalKeystrokes: number;
  } {
    const endTime = this.state.endTime || Date.now();
    const startTime = this.state.startTime || endTime;
    const totalTimeSeconds = (endTime - startTime) / 1000;
    const totalTimeMinutes = totalTimeSeconds / 60;

    const correct = this.state.chars.filter(
      (c) => c.status === 'correct'
    ).length;
    const totalKeystrokes = correct + this.totalErrorAttempts;
    const wpm = totalTimeMinutes > 0 ? correct / 5 / totalTimeMinutes : 0;
    const accuracy = totalKeystrokes > 0 ? (correct / totalKeystrokes) * 100 : 100;

    return {
      wpm: Math.round(wpm * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
      totalTime: Math.round(totalTimeSeconds * 10) / 10,
      totalChars: this.state.chars.length,
      correctChars: correct,
      incorrectChars: this.totalErrorAttempts,
      totalKeystrokes,
    };
  }

  /** Build a metrics request for saving to the API */
  buildMetricsRequest(userId: string, lessonId: string): MetricsRequest {
    const m = this.getMetrics();
    return {
      userId,
      lessonId,
      wpm: m.wpm,
      accuracy: m.accuracy,
      totalTime: m.totalTime,
      totalChars: m.totalChars,
      correctChars: m.correctChars,
      incorrectChars: m.incorrectChars,
      commonErrors: Array.from(this.state.errors.values()),
    };
  }

  /** Get current WPM (live) */
  getLiveWPM(): number {
    if (!this.state.started || !this.state.startTime) return 0;
    const elapsed = (Date.now() - this.state.startTime) / 1000 / 60;
    const correct = this.state.chars.filter(
      (c) => c.status === 'correct'
    ).length;
    return elapsed > 0 ? Math.round((correct / 5 / elapsed) * 10) / 10 : 0;
  }

  /** Reset the engine */
  reset(): void {
    if (this.lastLesson) {
      this.init(this.lastLesson);
    }
  }

  private emit(): void {
    this.state$.next({ ...this.state });
  }

  private createEmptyState(): TypingState {
    return {
      currentIndex: 0,
      chars: [],
      started: false,
      finished: false,
      startTime: null,
      endTime: null,
      errors: new Map(),
    };
  }
}
