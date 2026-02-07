import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Progress, ProgressRequest } from '../models/progress.model';
import { MetricsRequest, TypingMetrics, UserMetricsSummary } from '../models/typing.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  saveProgress(req: ProgressRequest): Observable<Progress> {
    return this.http.post<Progress>(`${this.apiUrl}/progress`, req);
  }

  getUserProgress(userId: string): Observable<Progress[]> {
    return this.http.get<Progress[]>(`${this.apiUrl}/progress/${userId}`);
  }

  getLessonProgress(userId: string, lessonId: string): Observable<Progress> {
    return this.http.get<Progress>(
      `${this.apiUrl}/progress/${userId}/${lessonId}`
    );
  }

  saveMetrics(req: MetricsRequest): Observable<TypingMetrics> {
    return this.http.post<TypingMetrics>(`${this.apiUrl}/metrics`, req);
  }

  getUserMetrics(userId: string): Observable<UserMetricsSummary> {
    return this.http.get<UserMetricsSummary>(
      `${this.apiUrl}/metrics/${userId}`
    );
  }
}
