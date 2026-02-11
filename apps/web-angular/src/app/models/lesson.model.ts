export interface Lesson {
  id: string;
  title: string;
  title_en?: string;
  language: string;
  concept: string;
  description: string;
  description_en?: string;
  explanation: string[];
  explanation_en?: string[];
  code: string;
  exclude?: string[];
  mode: 'strict' | 'practice';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  tags?: string[];
  level?: string;
}

export interface LessonSummary {
  id: string;
  title: string;
  language: string;
  concept: string;
  description: string;
  difficulty: string;
  mode: string;
  order: number;
  level?: 'basic' | 'intermediate' | 'advanced' | 'exercises';
}

export interface LanguageInfo {
  id: string;
  name: string;
  icon: string;
  lessonCount: number;
  soon?: boolean;
}
