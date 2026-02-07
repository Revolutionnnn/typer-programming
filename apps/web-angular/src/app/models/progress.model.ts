export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  attempts: number;
  lastAttempt: string;
}

export interface ProgressRequest {
  userId: string;
  lessonId: string;
  wpm: number;
  accuracy: number;
  completed: boolean;
}
