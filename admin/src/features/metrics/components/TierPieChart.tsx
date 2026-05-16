import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { TierCount } from '../api/getMetrics';

const TIER_COLORS: Record<string, string> = {
  free: '#94a3b8',
  basic: '#60a5fa',
  pro: '#2563EB',
  pro_max: '#7c3aed',
};

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  pro_max: 'Pro Max',
};

interface Props {
  data: TierCount[];
}

export function TierPieChart({ data }: Props) {
  const formatted = data.map((d) => ({ ...d, name: TIER_LABELS[d.tier] ?? d.tier }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={formatted}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {formatted.map((d) => (
            <Cell key={d.tier} fill={TIER_COLORS[d.tier] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
