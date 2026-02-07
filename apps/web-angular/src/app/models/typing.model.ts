export interface TypingMetrics {
  id: string;
  userId: string;
  lessonId: string;
  wpm: number;
  accuracy: number;
  totalTime: number;
  totalChars: number;
  correctChars: number;
  incorrectChars: number;
  commonErrors: ErrorEntry[];
  createdAt: string;
}

export interface ErrorEntry {
  expected: string;
  typed: string;
  count: number;
}

export interface MetricsRequest {
  userId: string;
  lessonId: string;
  wpm: number;
  accuracy: number;
  totalTime: number;
  totalChars: number;
  correctChars: number;
  incorrectChars: number;
  commonErrors: ErrorEntry[];
}

export interface UserMetricsSummary {
  userId: string;
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  totalTime: number;
  bestWpm: number;
}

/** Represents the live state of the typing engine */
export interface TypingState {
  currentIndex: number;
  chars: CharState[];
  started: boolean;
  finished: boolean;
  startTime: number | null;
  endTime: number | null;
  errors: Map<string, ErrorEntry>;
}

export interface CharState {
  char: string;
  status: 'pending' | 'correct' | 'incorrect';
  /** When true, the char is hidden (fill-in-the-blank) until typed */
  isHidden?: boolean;
}
