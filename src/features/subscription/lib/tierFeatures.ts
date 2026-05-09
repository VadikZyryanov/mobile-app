import type { Tier } from '../types';

export const TIER_NAMES: Record<Tier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  pro_max: 'Pro Max',
};

export const TIER_FEATURES: Record<Tier, string[]> = {
  free: ['Превью техники упражнений (GIF)'],
  basic: ['Всё из Free', 'Готовые тренировки и программы', 'Видео техники без ограничений'],
  pro: ['Всё из Basic', 'Индивидуальный план тренировок'],
  pro_max: ['Всё из Pro', 'Трекинг питания и КБЖУ'],
};
