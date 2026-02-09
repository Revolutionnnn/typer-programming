import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../services/leaderboard.service';
import { LeaderboardEntry } from '../../models/leaderboard.model';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-primary-400">{{ i18n.t('leaderboard.title') }}</h1>

      <div class="flex justify-center mb-6 space-x-4">
        <button 
          (click)="setPeriod('weekly')" 
          [class.bg-primary-600]="period() === 'weekly'"
          [class.bg-gray-700]="period() !== 'weekly'"
          class="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-primary-500">
          {{ i18n.t('leaderboard.weekly') }}
        </button>
        <button 
          (click)="setPeriod('monthly')" 
          [class.bg-primary-600]="period() === 'monthly'"
          [class.bg-gray-700]="period() !== 'monthly'"
          class="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-primary-500">
          {{ i18n.t('leaderboard.monthly') }}
        </button>
        <button 
          (click)="setPeriod('all_time')" 
          [class.bg-primary-600]="period() === 'all_time'"
          [class.bg-gray-700]="period() !== 'all_time'"
          class="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-primary-500">
          {{ i18n.t('leaderboard.allTime') }}
        </button>
      </div>

      <div class="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-900 bg-opacity-50">
              <tr>
                <th class="px-6 py-4 font-semibold text-gray-300">{{ i18n.t('leaderboard.rank') }}</th>
                <th class="px-6 py-4 font-semibold text-gray-300">{{ i18n.t('leaderboard.user') }}</th>
                <th class="px-6 py-4 font-semibold text-gray-300 text-right">{{ i18n.t('leaderboard.points') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              @for (entry of entries(); track entry.userId) {
                <tr class="hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center w-8 h-8 rounded-full font-bold"
                         [ngClass]="{
                           'bg-yellow-500 text-black': entry.rank === 1,
                           'bg-gray-400 text-black': entry.rank === 2,
                           'bg-orange-500 text-black': entry.rank === 3,
                           'text-gray-400': entry.rank > 3
                         }">
                      {{ entry.rank }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-3 text-xs font-bold">
                        {{ entry.userId.slice(0, 2).toUpperCase() }}
                      </div>
                      <span class="font-medium text-gray-200">User {{ entry.userId.slice(0, 8) }}...</span>
                      @if(entry.rank <= 3) {
                         <span class="ml-2">🔥</span>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right font-mono text-primary-300 font-bold">
                    {{ entry.points | number }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-6 py-12 text-center text-gray-500">
                    {{ i18n.t('leaderboard.empty') }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-8 text-center">
        <a routerLink="/" class="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-bold shadow-lg transform hover:-translate-y-0.5 transition-all">
          {{ i18n.t('leaderboard.cta') }}
        </a>
      </div>
    </div>
  `,
  styles: []
})
export class LeaderboardPageComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);
  i18n = inject(I18nService);

  entries = signal<LeaderboardEntry[]>([]);
  period = signal<'weekly' | 'monthly' | 'all_time'>('weekly');

  ngOnInit() {
    this.loadLeaderboard();
  }

  setPeriod(newPeriod: 'weekly' | 'monthly' | 'all_time') {
    this.period.set(newPeriod);
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    // We explicitly cast the period value to the expected type to satisfy TS
    const p = this.period() as 'weekly' | 'monthly' | 'all_time';
    this.leaderboardService.getLeaderboard(p).subscribe({
      next: (data) => this.entries.set(data),
      error: (err) => console.error('Failed to load leaderboard', err)
    });
  }
}
