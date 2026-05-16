import type { ContentStats } from '../api/getMetrics';
import { KpiCard } from './KpiCard';

interface Props {
  data: ContentStats;
}

export function ContentStatsGrid({ data }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <KpiCard label="Упражнения" value={data.exercises_count} />
      <KpiCard label="Тренировки" value={data.workouts_count} />
      <KpiCard label="Программы" value={data.programs_count} />
      <KpiCard label="Посты блога" value={data.blog_posts_count} />
      <KpiCard label="Продукты" value={data.foods_count} />
      <KpiCard label="Пользователи" value={data.total_users} />
    </div>
  );
}
