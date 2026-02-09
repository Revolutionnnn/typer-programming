import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LessonService } from '../../services/lesson.service';
import { I18nService } from '../../services/i18n.service';
import { LanguageInfo } from '../../models/lesson.model';
import { LucideAngularModule, Sparkles, Terminal, Keyboard, BarChart2, BrainCircuit, Crosshair, Github, HeartHandshake, ArrowRight, Timer } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  readonly icons = { Sparkles, Terminal, Keyboard, BarChart2, BrainCircuit, Crosshair, Github, HeartHandshake, ArrowRight, Timer };
  private lessonService = inject(LessonService);
  i18n = inject(I18nService);

  languages: LanguageInfo[] = [];
  loadingLangs = true;

  ngOnInit(): void {
    this.lessonService.getLanguages().subscribe({
      next: (langs) => {
        this.languages = langs;
        this.loadingLangs = false;
      },
      error: () => {
        this.loadingLangs = false;
      },
    });
  }

  getLangStyle(langId: string) {
    switch (langId) {
      case 'go': return { '--lang-color': '#00ADD8' };
      case 'javascript': return { '--lang-color': '#F7DF1E' };
      case 'python': return { '--lang-color': '#3776AB' };
      default: return { '--lang-color': 'var(--accent-primary)' };
    }
  }
}
