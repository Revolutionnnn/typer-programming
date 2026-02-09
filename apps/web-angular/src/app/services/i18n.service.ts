import { Injectable } from '@angular/core';

export type Locale = 'es' | 'en';

type TranslationDict = Record<string, string>;

const translations: Record<Locale, TranslationDict> = {
  es: {
    // ── Header ──
    'nav.lessons': 'Lecciones',
    'nav.progress': 'Progreso',

    // ── Home ──
    'home.title': 'Aprende a programar',
    'home.title.highlight': 'escribiendo código real',
    'home.subtitle':
      'Mejora tu velocidad, precisión y comprensión de la programación con typing guiado. Escribe código real, carácter por carácter, y aprende mientras practicas.',
    'home.cta': '🚀 Empezar ahora',
    'home.opensource.badge': '🌟 Proyecto Open Source',
    'home.feature.typing.title': 'Typing guiado',
    'home.feature.typing.desc':
      'Escribe código carácter por carácter con feedback visual en tiempo real. Verde = correcto, rojo = incorrecto.',
    'home.feature.metrics.title': 'Métricas en vivo',
    'home.feature.metrics.desc':
      'Mide tu WPM, precisión y errores más comunes. Observa cómo mejoras con cada práctica.',
    'home.feature.concepts.title': 'Aprende conceptos',
    'home.feature.concepts.desc':
      'Cada lección incluye explicaciones claras. Entiende qué estás escribiendo y por qué funciona.',
    'home.feature.progressive.title': 'Progresivo',
    'home.feature.progressive.desc':
      'Lecciones cortas y ordenadas. Empieza con lo básico y avanza a tu ritmo.',
    'home.languages.title': 'Lenguajes disponibles',
    'home.languages.available': 'Disponible',
    'home.languages.soon': 'PRONTO',
    'home.languages.loading': 'Cargando...',
    'home.languages.connecting': 'Conectando con el servidor',
    'home.lessons.count': 'lecciones',

    // ── Open Source ──
    'opensource.title': '🌟 Proyecto Open Source',
    'opensource.subtitle': '¡Contribuye y ayuda a crecer la comunidad!',
    'opensource.desc': 'Este proyecto es completamente open source. Puedes contribuir agregando nuevos ejercicios, mejorando el código, o simplemente ejecutándolo localmente.',
    'opensource.contribute': '🤝 Contribuir',
    'opensource.github': 'Ver en GitHub',

    // ── Lesson List ──
    'lessonList.title': '📚 Lecciones',
    'lessonList.subtitle': 'Aprende escribiendo código real, lección por lección.',
    'lessonList.chooseLanguage': 'Elige un lenguaje',
    'lessonList.lessons': 'lecciones',
    'lessonList.noLanguages': 'No hay lenguajes disponibles. ¿Está corriendo el backend?',
    'lessonList.loadingLanguages': 'Cargando lenguajes...',
    'lessonList.loadingLessons': 'Cargando lecciones...',
    'lessonList.retry': 'Reintentar',
    'lessonList.noLessons': '🚧 Aún no hay lecciones para este lenguaje. ¡Pronto habrá más! <br> <a href="https://github.com/Revolutionnnn/typer-programming" target="_blank">Contribuye en GitHub</a>',
    'lessonList.errorLanguages': 'No se pudieron cargar los lenguajes. ¿Está corriendo el backend?',
    'lessonList.errorLessons': 'No se pudieron cargar las lecciones.',
    'lessonList.difficulty.beginner': 'Básico',
    'lessonList.difficulty.intermediate': 'Intermedio',
    'lessonList.difficulty.advanced': 'Avanzado',
    'lessonList.completed': 'Completada',

    // ── Lesson ──
    'lesson.loading': 'Cargando lección...',
    'lesson.back': '← Lecciones',
    'lesson.backToLessons': '← Volver a lecciones',
    'lesson.strict': '🔒 Estricto',
    'lesson.practice': '🔓 Práctica',
    'lesson.explanation': '💡 Explicación',
    'lesson.startTyping': '⌨️ Empezar a escribir',
    'lesson.completed': '🎉 ¡Lección completada!',
    'lesson.retry': '🔄 Reintentar',
    'lesson.next': '📚 Siguiente lección',
    'lesson.errorNoId': 'ID de lección no proporcionado',
    'lesson.errorLoad': 'No se pudo cargar la lección.',
    'lesson.wpm': 'WPM',
    'lesson.accuracy': 'Precisión',
    'lesson.time': 'Tiempo',
    'lesson.errors': 'Errores',
    'lesson.points': 'Puntos',

    // ── Typing Editor ──
    'editor.stat.wpm': 'WPM',
    'editor.stat.accuracy': 'Precisión',
    'editor.stat.progress': 'Progreso',
    'editor.stat.errors': 'Errores',
    'editor.capsLock': 'Bloq Mayús activado',
    'editor.clickToStart': 'Haz clic aquí y comienza a escribir',
    'editor.livesHint': 'Tienes {{count}} vidas — ¡no las desperdicies!',
    'editor.gameOver': '💀',
    'editor.gameOverTitle': '¡Game Over!',
    'editor.gameOverSubtitle': 'Te quedaste sin vidas',
    'editor.gameOverProgress': 'Progreso',
    'editor.gameOverAccuracy': 'Precisión',
    'editor.gameOverErrors': 'Errores',
    'editor.retry': '🔄 Reintentar',
    'editor.lifeRecovered': '¡Vida recuperada!',

    // Error messages (gamification)
    'editor.error.1': '¡Oops! Pequeño tropiezo',
    'editor.error.3': 'Cuidado, te estás resbalando...',
    'editor.error.5': 'El teclado no muerde, ¡relax!',
    'editor.error.8': '¿Estás tecleando con los codos?',
    'editor.error.12': '¡Houston, tenemos un problema!',
    'editor.error.15': 'R.I.P. tus dedos',

    // Streak messages
    'editor.streak.10': '¡En racha!',
    'editor.streak.25': '¡Imparable!',
    'editor.streak.50': '¡Máquina!',
    'editor.streak.75': '¡Leyenda!',
    'editor.streak.100': '¡GOD MODE!',
    'editor.streak.default': 'En racha',
    'streak.days': 'días',

    // ── Results ──
    'results.title': '📈 Tu Progreso',
    'results.loading': 'Cargando estadísticas...',
    'results.avgWpm': 'WPM Promedio',
    'results.avgAccuracy': 'Precisión Promedio',
    'results.bestWpm': 'Mejor WPM',
    'results.sessions': 'Sesiones',
    'results.totalTime': 'Tiempo Total',
    'results.completedLessons': 'Lecciones completadas',
    'results.attempts': 'intentos',
    'results.empty': 'Aún no has completado ninguna lección.',
    'results.startNow': '🚀 Empezar ahora',

    // ── Share ──
    'share.share': 'Compartir',
    'share.shareProgress': 'Comparte tu progreso',
    'share.message': '¡Acabo de completar "{{lesson}}" en Typing Code Learn! 🚀\n\nWPM: {{wpm}}\nPrecisión: {{accuracy}}%\nRacha diaria: {{streak}} días\n\n¿Te animas a probar?',
    'share.copyLink': 'Copiar enlace',
    'share.copied': '¡Copiado!',

    // ── User Rank ──
    'rank.yourRank': 'Tu posición',
    'rank.daily': 'Hoy',
    'rank.weekly': 'Esta semana',
    'rank.unranked': 'Sin ranking',

    // ── Leaderboard ──
    'nav.leaderboard': 'Ranking',
    'leaderboard.title': '🏆 Campeones del Teclado',
    'leaderboard.daily': 'Diario',
    'leaderboard.weekly': 'Semanal',
    'leaderboard.monthly': 'Mensual',
    'leaderboard.allTime': 'Histórico',
    'leaderboard.rank': 'Rango',
    'leaderboard.user': 'Usuario',
    'leaderboard.points': 'Puntos',
    'leaderboard.empty': 'No hay registros para este periodo. ¡Sé el primero!',
    'leaderboard.cta': '¡Empieza a competir!',

    // ── User Profile ──
    'user.totalPoints': 'Puntos Totales',
    'user.completedLessons': 'Lecciones Completadas',
    'user.currentStreak': 'Racha de Días',
    'user.avgWpm': 'WPM Promedio',
    'user.accuracy': 'Precisión',
    'user.bestWpm': 'Mejor WPM',
    'user.badges': 'Insignias',
    'user.recentProgress': 'Progreso Reciente',
    'user.memberSince': 'Miembro desde',
    'user.guest': 'Invitado',

    // ── Common ──
    'common.back': 'Volver',
    'common.loading': 'Cargando...',
    'common.goBack': 'Volver atrás',
  },

  en: {
    // ── Header ──
    'nav.lessons': 'Lessons',
    'nav.progress': 'Progress',

    // ── Home ──
    'home.title': 'Learn to code',
    'home.title.highlight': 'by writing real code',
    'home.subtitle':
      'Improve your speed, accuracy and understanding of programming with guided typing. Write real code, character by character, and learn while you practice.',
    'home.cta': '🚀 Start now',
    'home.feature.typing.title': 'Guided typing',
    'home.feature.typing.desc':
      'Type code character by character with real-time visual feedback. Green = correct, red = incorrect.',
    'home.feature.metrics.title': 'Live metrics',
    'home.feature.metrics.desc':
      'Measure your WPM, accuracy and most common mistakes. Watch yourself improve with every session.',
    'home.feature.concepts.title': 'Learn concepts',
    'home.feature.concepts.desc':
      'Every lesson includes clear explanations. Understand what you\'re typing and why it works.',
    'home.feature.progressive.title': 'Progressive',
    'home.feature.progressive.desc':
      'Short, ordered lessons. Start with the basics and advance at your own pace.',
    'home.languages.title': 'Available languages',
    'home.languages.available': 'Available',
    'home.languages.soon': 'SOON',
    'home.languages.loading': 'Loading...',
    'home.languages.connecting': 'Connecting to server',
    'home.lessons.count': 'lessons',

    // ── Open Source ──
    'opensource.title': '🌟 Open Source Project',
    'opensource.subtitle': 'Contribute and help grow the community!',
    'opensource.desc': 'This project is completely open source. You can contribute by adding new exercises, improving the code, or simply running it locally.',
    'opensource.contribute': '🤝 Contribute',
    'opensource.github': 'View on GitHub',

    // ── Lesson List ──
    'lessonList.title': '📚 Lessons',
    'lessonList.subtitle': 'Learn by writing real code, lesson by lesson.',
    'lessonList.chooseLanguage': 'Choose a language',
    'lessonList.lessons': 'lessons',
    'lessonList.noLanguages': 'No languages available. Is the backend running?',
    'lessonList.loadingLanguages': 'Loading languages...',
    'lessonList.loadingLessons': 'Loading lessons...',
    'lessonList.retry': 'Retry',
    'lessonList.noLessons': '🚧 No lessons for this language yet. More coming soon! <br> <a href="https://github.com/Revolutionnnn/typer-programming" target="_blank">Contribute on GitHub</a>',
    'lessonList.errorLanguages': 'Could not load languages. Is the backend running?',
    'lessonList.errorLessons': 'Could not load lessons.',
    'lessonList.difficulty.beginner': 'Beginner',
    'lessonList.difficulty.intermediate': 'Intermediate',
    'lessonList.difficulty.advanced': 'Advanced',
    'lessonList.completed': 'Completed',

    // ── Lesson ──
    'lesson.loading': 'Loading lesson...',
    'lesson.back': '← Lessons',
    'lesson.backToLessons': '← Back to lessons',
    'lesson.strict': '🔒 Strict',
    'lesson.practice': '🔓 Practice',
    'lesson.explanation': '💡 Explanation',
    'lesson.startTyping': '⌨️ Start typing',
    'lesson.completed': '🎉 Lesson completed!',
    'lesson.retry': '🔄 Retry',
    'lesson.next': '📚 Next lesson',
    'lesson.errorNoId': 'Lesson ID not provided',
    'lesson.errorLoad': 'Could not load the lesson.',
    'lesson.wpm': 'WPM',
    'lesson.accuracy': 'Accuracy',
    'lesson.time': 'Time',
    'lesson.errors': 'Errors',
    'lesson.points': 'Points',

    // ── Typing Editor ──
    'editor.stat.wpm': 'WPM',
    'editor.stat.accuracy': 'Accuracy',
    'editor.stat.progress': 'Progress',
    'editor.stat.errors': 'Errors',
    'editor.capsLock': 'Caps Lock is on',
    'editor.clickToStart': 'Click here and start typing',
    'editor.livesHint': 'You have {{count}} lives — don\'t waste them!',
    'editor.gameOver': '💀',
    'editor.gameOverTitle': 'Game Over!',
    'editor.gameOverSubtitle': 'You ran out of lives',
    'editor.gameOverProgress': 'Progress',
    'editor.gameOverAccuracy': 'Accuracy',
    'editor.gameOverErrors': 'Errors',
    'editor.retry': '🔄 Retry',
    'editor.lifeRecovered': 'Life recovered!',

    // Error messages (gamification)
    'editor.error.1': 'Oops! Small stumble',
    'editor.error.3': 'Careful, you\'re slipping...',
    'editor.error.5': 'The keyboard won\'t bite, relax!',
    'editor.error.8': 'Are you typing with your elbows?',
    'editor.error.12': 'Houston, we have a problem!',
    'editor.error.15': 'R.I.P. your fingers',

    // Streak messages
    'editor.streak.10': 'On fire!',
    'editor.streak.25': 'Unstoppable!',
    'editor.streak.50': 'Machine!',
    'editor.streak.75': 'Legend!',
    'editor.streak.100': 'GOD MODE!',
    'editor.streak.default': 'On fire',
    'streak.days': 'days',

    // ── Results ──
    'results.title': '📈 Your Progress',
    'results.loading': 'Loading stats...',
    'results.avgWpm': 'Average WPM',
    'results.avgAccuracy': 'Average Accuracy',
    'results.bestWpm': 'Best WPM',
    'results.sessions': 'Sessions',
    'results.totalTime': 'Total Time',
    'results.completedLessons': 'Completed lessons',
    'results.attempts': 'attempts',
    'results.empty': 'You haven\'t completed any lessons yet.',
    'results.startNow': '🚀 Start now',

    // ── Share ──
    'share.share': 'Share',
    'share.shareProgress': 'Share your progress',
    'share.message': 'I just completed "{{lesson}}" on Typing Code Learn! 🚀\n\nWPM: {{wpm}}\nAccuracy: {{accuracy}}%\nDaily streak: {{streak}} days\n\nThink you can beat that?',
    'share.copyLink': 'Copy link',
    'share.copied': 'Copied!',

    // ── User Rank ──
    'rank.yourRank': 'Your rank',
    'rank.daily': 'Today',
    'rank.weekly': 'This week',
    'rank.unranked': 'Unranked',

    // ── Leaderboard ──
    'nav.leaderboard': 'Leaderboard',
    'leaderboard.title': '🏆 Keyboard Champions',
    'leaderboard.daily': 'Daily',
    'leaderboard.weekly': 'Weekly',
    'leaderboard.monthly': 'Monthly',
    'leaderboard.allTime': 'All Time',
    'leaderboard.rank': 'Rank',
    'leaderboard.user': 'User',
    'leaderboard.points': 'Points',
    'leaderboard.empty': 'No records for this period. Be the first!',
    'leaderboard.cta': 'Start Competing!',

    // ── User Profile ──
    'user.totalPoints': 'Total Points',
    'user.completedLessons': 'Completed Lessons',
    'user.currentStreak': 'Day Streak',
    'user.avgWpm': 'Avg WPM',
    'user.accuracy': 'Accuracy',
    'user.bestWpm': 'Best WPM',
    'user.badges': 'Badges',
    'user.recentProgress': 'Recent Progress',
    'user.memberSince': 'Member since',
    'user.guest': 'Guest',

    // ── Common ──
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.goBack': 'Go Back',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private locale: Locale;

  constructor() {
    this.locale = this.detectLocale();
  }

  /** Get the current locale */
  getLocale(): Locale {
    return this.locale;
  }

  /** Switch locale manually */
  setLocale(locale: Locale): void {
    this.locale = locale;
  }

  /** Translate a key. Supports {{placeholder}} interpolation. */
  t(key: string, params?: Record<string, string | number>): string {
    let text = translations[this.locale]?.[key] ?? translations['en']?.[key] ?? key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }

    return text;
  }

  /** Detect browser language, default to Spanish */
  private detectLocale(): Locale {
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('en')) return 'en';
    // Default: Spanish for all other languages
    return 'es';
  }
}
