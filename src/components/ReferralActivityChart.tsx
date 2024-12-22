'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ChartData {
  month: string;
  count: number;
}

interface ReferralActivityChartProps {
  data: ChartData[];
}

export function ReferralActivityChart({ data }: ReferralActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No referral data available
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis 
            dataKey="month"
            tick={{ fill: '#666' }}
            tickLine={{ stroke: '#666' }}
          />
          <YAxis
            tick={{ fill: '#666' }}
            tickLine={{ stroke: '#666' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
          />
          <Bar 
            dataKey="count"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            name="Referrals"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
