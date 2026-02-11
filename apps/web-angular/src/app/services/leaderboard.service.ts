import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LeaderboardEntry } from '../models/leaderboard.model';

export interface UserRank {
    dailyRank: number;
    weeklyRank: number;
}

@Injectable({
    providedIn: 'root'
})
export class LeaderboardService {
    private apiUrl = `${environment.apiUrl}/leaderboard`;

    constructor(private http: HttpClient) { }

    getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly', limit: number = 10): Observable<LeaderboardEntry[]> {
        return this.http.get<LeaderboardEntry[]>(this.apiUrl, {
            params: {
                period,
                limit: limit.toString()
            }
        });
    }

    getUserRank(): Observable<UserRank> {
        return this.http.get<UserRank>(`${this.apiUrl}/rank`);
    }
}
