export interface User {
    id: string;
    username: string;
    email?: string;
    displayName: string;
    isGuest: boolean;
    currentStreak: number;
    lastStreakAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    guestId?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
