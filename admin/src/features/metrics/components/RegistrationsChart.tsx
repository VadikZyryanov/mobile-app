import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RegistrationDay } from '../api/getMetrics';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  data: RegistrationDay[];
}

export function RegistrationsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    day: format(parseISO(d.day), 'd MMM', { locale: ru }),
    'Новые пользователи': d.new_users,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="Новые пользователи"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
