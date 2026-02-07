import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lesson, LessonSummary, LanguageInfo } from '../models/lesson.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getLanguages(): Observable<LanguageInfo[]> {
    return this.http.get<LanguageInfo[]>(`${this.apiUrl}/languages`);
  }

  getLessons(): Observable<LessonSummary[]> {
    return this.http.get<LessonSummary[]>(`${this.apiUrl}/lessons`);
  }

  getLesson(id: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/lessons/${id}`);
  }

  getLessonsByLanguage(language: string): Observable<LessonSummary[]> {
    return this.http.get<LessonSummary[]>(
      `${this.apiUrl}/lessons/language/${language}`
    );
  }
}
