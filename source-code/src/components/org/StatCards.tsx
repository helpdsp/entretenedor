import React from 'react';
import { Users, BookOpen, Activity } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.isUp ? '+' : '-'}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
    </div>
  );
};

export const OrgStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard 
        label="Total Members" 
        value="1,284" 
        icon={<Users size={20} />} 
        trend={{ value: 12, isUp: true }} 
      />
      <StatCard 
        label="Active Atoms" 
        value="4,560" 
        icon={<BookOpen size={20} />} 
        trend={{ value: 5.4, isUp: true }} 
      />
      <StatCard 
        label="Weekly Activity" 
        value="92%" 
        icon={<Activity size={20} />} 
        trend={{ value: 2.1, isUp: false }} 
      />
    </div>
  );
};
