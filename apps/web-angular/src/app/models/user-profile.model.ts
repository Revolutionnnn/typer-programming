import { User } from './user.model';
import { BadgeWithDetails } from './leaderboard.model';
import { Progress } from './progress.model';

export interface UserMetricsSummary {
  userId: string;
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  totalTime: number;
  bestWpm: number;
}

export interface UserProfile {
  user: User & { badges?: BadgeWithDetails[] };
  metrics?: UserMetricsSummary;
  progress?: Progress[];
  completedLessons: number;
  totalPoints: number;
}
