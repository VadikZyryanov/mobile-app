import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SubscriptionEventDay } from '../api/getMetrics';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  data: SubscriptionEventDay[];
}

function pivot(data: SubscriptionEventDay[]) {
  const map = new Map<string, Record<string, unknown>>();
  for (const { day, event_type, count } of data) {
    if (!map.has(day)) map.set(day, { day });
    map.get(day)![event_type] = count;
  }
  return [...map.values()].map((row) => ({
    ...row,
    day: format(parseISO(row['day'] as string), 'd MMM', { locale: ru }),
  }));
}

const COLORS: Record<string, string> = {
  INITIAL_PURCHASE: '#16a34a',
  RENEWAL: '#2563EB',
  CANCELLATION: '#dc2626',
  EXPIRATION: '#f97316',
};

export function SubscriptionEventsChart({ data }: Props) {
  const pivoted = pivot(data);
  const types = [...new Set(data.map((d) => d.event_type))];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={pivoted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        {types.map((t) => (
          <Bar key={t} dataKey={t} stackId="a" fill={COLORS[t] ?? '#94a3b8'} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
