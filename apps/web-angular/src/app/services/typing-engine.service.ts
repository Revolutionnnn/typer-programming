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

  readonly state$ = new BehaviorSubject<TypingState>(this.createEmptyState());
  readonly finished$ = new BehaviorSubject<boolean>(false);
  totalErrorAttempts = 0;

  /** Initialize the engine with a code snippet */
  init(code: string, mode: 'strict' | 'practice' = 'strict'): void {
    this.mode = mode;

    // Parse [[hidden]] markers and build char array
    const chars: CharState[] = [];
    const regex = /\[\[(.*?)\]\]/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(code)) !== null) {
      // Normal text before the hidden segment
      const before = code.substring(lastIndex, match.index);
      for (const c of before) {
        chars.push({ char: c, status: 'pending' as const });
      }
      // Hidden segment (fill-in-the-blank)
      for (const c of match[1]) {
        chars.push({ char: c, status: 'pending' as const, isHidden: true });
      }
      lastIndex = regex.lastIndex;
    }
    // Remaining normal text
    const remaining = code.substring(lastIndex);
    for (const c of remaining) {
      chars.push({ char: c, status: 'pending' as const });
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
      this.handleBackspace();
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
  private handleBackspace(): void {
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
    if (this.code) {
      this.init(this.code, this.mode);
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
