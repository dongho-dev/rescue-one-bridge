import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface HourlyLoadEntry {
  hour: string;
  patients: number;
}

interface HourlyLoadChartProps {
  data: HourlyLoadEntry[];
}

export function HourlyLoadChart({ data }: HourlyLoadChartProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp size={18} className="text-primary" />
          시간대별 환자 부하
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickLine={{ stroke: 'var(--border)' }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickLine={{ stroke: 'var(--border)' }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--card-foreground)',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="patients"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--chart-1)', strokeWidth: 2, stroke: 'var(--background)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
