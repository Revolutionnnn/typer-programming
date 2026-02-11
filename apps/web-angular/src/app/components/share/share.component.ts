import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-share',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="share">
      <button class="share__button" (click)="toggleShare()" [class.active]="showShare">
        <span class="share__icon">📤</span>
        {{ i18n.t('share.share') }}
      </button>

      @if (showShare) {
        <div class="share__modal">
          <div class="share__content">
            <h3 class="share__title">{{ i18n.t('share.shareProgress') }}</h3>
            <p class="share__message">{{ shareMessage }}</p>

            <div class="share__buttons">
              <a
                [href]="twitterUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="share__btn share__btn--twitter"
                (click)="onShare('Twitter')"
              >
                <span class="share__btn-icon">🐦</span>
                Twitter
              </a>

              <a
                [href]="facebookUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="share__btn share__btn--facebook"
                (click)="onShare('Facebook')"
              >
                <span class="share__btn-icon">📘</span>
                Facebook
              </a>

              <a
                [href]="linkedinUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="share__btn share__btn--linkedin"
                (click)="onShare('LinkedIn')"
              >
                <span class="share__btn-icon">💼</span>
                LinkedIn
              </a>

              <button
                class="share__btn share__btn--copy"
                (click)="copyToClipboard()"
                [class.copied]="copied"
              >
                <span class="share__btn-icon">{{ copied ? '✅' : '📋' }}</span>
                {{ copied ? i18n.t('share.copied') : i18n.t('share.copyLink') }}
              </button>
            </div>

            <button class="share__close" (click)="toggleShare()">×</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .share {
        position: relative;
        display: inline-block;
      }

      .share__button {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all var(--transition);

        &:hover {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }

        &.active {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }
      }

      .share__modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .share__content {
        background: var(--bg-primary);
        border-radius: 1rem;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        position: relative;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }

      .share__title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--text-primary);
      }

      .share__message {
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
        line-height: 1.5;
        border: 1px solid var(--border-color);
      }

      .share__buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .share__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all var(--transition);
        border: none;
        cursor: pointer;
      }

      .share__btn--twitter {
        background: #1da1f2;
        color: white;

        &:hover {
          background: #0d95e8;
        }
      }

      .share__btn--facebook {
        background: #1877f2;
        color: white;

        &:hover {
          background: #166fe5;
        }
      }

      .share__btn--linkedin {
        background: #0077b5;
        color: white;

        &:hover {
          background: #005885;
        }
      }

      .share__btn--copy {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);

        &:hover {
          background: var(--bg-tertiary);
        }

        &.copied {
          background: #4caf50;
          color: white;
          border-color: #4caf50;
        }
      }

      .share__close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;

        &:hover {
          color: var(--text-primary);
        }
      }

      .share__btn-icon {
        font-size: 1rem;
      }
    `,
  ],
})
export class ShareComponent {
  @Input() lessonTitle: string = '';
  @Input() wpm: number = 0;
  @Input() accuracy: number = 0;
  @Input() streak: number = 0;

  i18n = inject(I18nService);
  showShare = false;
  copied = false;

  get shareMessage(): string {
    return this.i18n.t('share.message', {
      lesson: this.lessonTitle,
      wpm: this.wpm.toString(),
      accuracy: this.accuracy.toString(),
      streak: this.streak.toString()
    });
  }

  get shareUrl(): string {
    // For now, share the main app URL. Could be lesson-specific in the future
    return window.location.origin;
  }

  get twitterUrl(): string {
    const text = encodeURIComponent(this.shareMessage);
    const url = encodeURIComponent(this.shareUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=TypingCodeLearn,Programacion`;
  }

  get facebookUrl(): string {
    const url = encodeURIComponent(this.shareUrl);
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }

  get linkedinUrl(): string {
    const url = encodeURIComponent(this.shareUrl);
    const title = encodeURIComponent('Typing Code Learn - Aprende programando');
    const summary = encodeURIComponent(this.shareMessage);
    return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
  }

  toggleShare(): void {
    this.showShare = !this.showShare;
    if (!this.showShare) {
      this.copied = false;
    }
  }

  onShare(platform: string): void {
    // Track share event (could integrate with analytics later)
    console.log(`Shared on ${platform}`);
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${this.shareMessage} ${this.shareUrl}`);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }
}