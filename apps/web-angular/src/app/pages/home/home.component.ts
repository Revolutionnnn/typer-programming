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
      case 'typescript': return { '--lang-color': '#3178C6' };
      case 'rust': return { '--lang-color': '#000000' };
      case 'java': return { '--lang-color': '#ED8B00' };
      case 'c': return { '--lang-color': '#A8B9CC' };
      case 'cpp': return { '--lang-color': '#00599C' };
      case 'csharp': return { '--lang-color': '#239120' };
      case 'ruby': return { '--lang-color': '#CC342D' };
      case 'php': return { '--lang-color': '#777BB4' };
      case 'swift': return { '--lang-color': '#FA7343' };
      case 'kotlin': return { '--lang-color': '#7F52FF' };
      case 'cybersecurity': return { '--lang-color': '#FF6B6B' };
      case 'aws': return { '--lang-color': '#FF9900' };
      case 'devops': return { '--lang-color': '#4A90E2' };
      case 'docker': return { '--lang-color': '#2496ED' };
      case 'kubernetes': return { '--lang-color': '#326CE5' };
      case 'react': return { '--lang-color': '#61DAFB' };
      default: return { '--lang-color': 'var(--accent-primary)' };
    }
  }
}
