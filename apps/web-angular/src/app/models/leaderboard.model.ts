export interface Badge {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface BadgeWithDetails {
  badge: Badge;
  assignedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  githubUsername?: string;
  points: number;
  rank: number;
  avatarUrl?: string;
  badges?: BadgeWithDetails[];
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
