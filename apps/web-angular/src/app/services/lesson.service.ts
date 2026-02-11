import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lesson, LessonSummary, LanguageInfo } from '../models/lesson.model';
import { environment } from '../../environments/environment';

import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);
  private apiUrl = environment.apiUrl;

  getLanguages(): Observable<LanguageInfo[]> {
    return this.http.get<LanguageInfo[]>(`${this.apiUrl}/languages`, {
      params: { lang: this.i18n.getLocale() },
    });
  }

  getLessons(): Observable<LessonSummary[]> {
    return this.http.get<LessonSummary[]>(`${this.apiUrl}/lessons`, {
      params: { lang: this.i18n.getLocale() },
    });
  }

  getLesson(id: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/lessons/${id}`, {
      params: { lang: this.i18n.getLocale() },
    });
  }

  getLessonsByLanguage(language: string): Observable<LessonSummary[]> {
    return this.http.get<LessonSummary[]>(
      `${this.apiUrl}/lessons/language/${language}`,
      {
        params: { lang: this.i18n.getLocale() },
      }
    );
  }
}
