import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LeaderboardEntry } from '../models/leaderboard.model';

@Injectable({
    providedIn: 'root'
})
export class LeaderboardService {
    private apiUrl = `${environment.apiUrl}/leaderboard`;

    constructor(private http: HttpClient) { }

    getLeaderboard(period: 'weekly' | 'monthly' | 'all_time' = 'weekly', limit: number = 10): Observable<LeaderboardEntry[]> {
        return this.http.get<LeaderboardEntry[]>(this.apiUrl, {
            params: {
                period,
                limit: limit.toString()
            }
        });
    }
}
