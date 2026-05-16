import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCard } from '../components/KpiCard';
import { RegistrationsChart } from '../components/RegistrationsChart';
import { SubscriptionEventsChart } from '../components/SubscriptionEventsChart';
import { TierPieChart } from '../components/TierPieChart';
import { ContentStatsGrid } from '../components/ContentStatsGrid';
import {
  useRegistrationsDaily,
  useSubscriptionEventsDaily,
  useTierDistribution,
  useActiveSubs,
  useContentStats,
} from '../hooks/useMetrics';
import { calcMrr } from '../lib/mrrCalc';

const PERIOD_OPTIONS = [
  { label: '7 дней', value: 7 },
  { label: '30 дней', value: 30 },
  { label: '90 дней', value: 90 },
] as const;

export function MetricsPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const registrations = useRegistrationsDaily(days);
  const subEvents = useSubscriptionEventsDaily(days);
  const tierDist = useTierDistribution();
  const activeSubs = useActiveSubs();
  const contentStats = useContentStats();

  const mrr = activeSubs.data ? calcMrr(activeSubs.data) : null;
  const arr = mrr != null ? mrr * 12 : null;

  const totalActive = activeSubs.data?.reduce((s, d) => s + d.count, 0) ?? 0;
  const totalUsers = contentStats.data?.total_users ?? 0;

  const newInPeriod = registrations.data?.reduce((s, d) => s + d.new_users, 0) ?? 0;

  const churned =
    subEvents.data
      ?.filter((e) => ['CANCELLATION', 'EXPIRATION'].includes(e.event_type))
      .reduce((s, e) => s + e.count, 0) ?? 0;

  const anyLoading =
    registrations.isLoading ||
    subEvents.isLoading ||
    tierDist.isLoading ||
    activeSubs.isLoading ||
    contentStats.isLoading;

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Метрики</h1>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={days === opt.value ? 'default' : 'outline'}
              onClick={() => setDays(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {anyLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка…
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Активных подписок" value={totalActive} />
        <KpiCard label="Всего пользователей" value={totalUsers} />
        <KpiCard
          label="Est. MRR"
          value={mrr != null ? `$${mrr.toFixed(0)}` : '—'}
          sub={arr != null ? `ARR ≈ $${arr.toFixed(0)}` : undefined}
        />
        <KpiCard label={`Новых за ${days}д`} value={newInPeriod} sub={`Churn: ${churned}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Новые пользователи</h2>
          {registrations.data ? <RegistrationsChart data={registrations.data} /> : null}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">События подписок</h2>
          {subEvents.data ? <SubscriptionEventsChart data={subEvents.data} /> : null}
        </section>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Распределение по тирам</h2>
        <div className="max-w-sm">
          {tierDist.data ? <TierPieChart data={tierDist.data} /> : null}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Контент</h2>
        {contentStats.data ? <ContentStatsGrid data={contentStats.data} /> : null}
      </section>
    </div>
  );
}
