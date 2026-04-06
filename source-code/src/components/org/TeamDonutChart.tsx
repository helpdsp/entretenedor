import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Engineering', value: 400 },
  { name: 'Product', value: 300 },
  { name: 'Marketing', value: 300 },
  { name: 'Sales', value: 200 },
];

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

export const TeamDonutChart: React.FC = () => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 h-[400px]">
      <h3 className="text-lg font-semibold text-white mb-6">Distribution by Team</h3>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
