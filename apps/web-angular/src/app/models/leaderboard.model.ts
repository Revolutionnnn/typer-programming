export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  rank: number;
  avatarUrl?: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  sourceId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface MetricSaveResponse {
  metrics: unknown;
  pointsEarned: number;
}
