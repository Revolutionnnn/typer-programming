import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, RegisterRequest, LoginRequest, AuthResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Initialize user on app startup
   * Checks if user is already authenticated, otherwise creates a guest
   */
  async initializeUser(): Promise<void> {
    try {
      // Try to get current user (will work if cookie exists)
      const user = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/me`)
      );
      this.currentUserSubject.next(user);
    } catch (error) {
      // No valid session, create guest user
      await this.createGuestUser();
    }
  }

  /**
   * Create a new guest user
   */
  private async createGuestUser(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/auth/guest`, {})
      );
      this.currentUserSubject.next(response.user);
    } catch (error) {
      console.error('Failed to create guest user:', error);
    }
  }

  /**
   * Register a new user or convert guest to registered
   */
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<User> {
    const currentUser = this.currentUserSubject.value;
    const request: RegisterRequest = {
      username,
      email,
      password,
      guestId: currentUser?.isGuest ? currentUser.id : undefined,
    };

    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
    );
    this.currentUserSubject.next(response.user);
    return response.user;
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<User> {
    const request: LoginRequest = { username, password };
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
    );
    this.currentUserSubject.next(response.user);
    return response.user;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout`, {})
      );
    } catch (error) {
      console.error('Logout failed:', error);
    }
    // Create new guest user after logout
    await this.createGuestUser();
  }

  /**
   * Get current user (synchronous)
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if current user is a guest
   */
  isGuest(): boolean {
    return this.currentUserSubject.value?.isGuest ?? true;
  }

  /**
   * Get user ID for API calls (for backward compatibility)
   */
  getUserId(): string {
    return this.currentUserSubject.value?.id || '';
  }
}
