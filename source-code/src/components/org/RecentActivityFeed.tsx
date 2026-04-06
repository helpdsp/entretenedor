import React from 'react';
import { User, Atom, Trophy } from 'lucide-react';

const activities = [
  { id: 1, type: 'assignment', user: 'Maria Garcia', track: 'Python Foundations', time: '2h ago', icon: <Atom size={16} /> },
  { id: 2, type: 'completion', user: 'John Doe', track: 'React Patterns', time: '5h ago', icon: <Trophy size={16} /> },
  { id: 3, type: 'join', user: 'David Smith', track: 'Team Engineering', time: 'Yesterday', icon: <User size={16} /> },
  { id: 4, type: 'assignment', user: 'Ana Lopez', track: 'Product Strategy', time: '2d ago', icon: <Atom size={16} /> },
];

export const RecentActivityFeed: React.FC = () => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4">
            <div className="p-2 bg-white/5 rounded-full text-indigo-400 h-fit">
              {activity.icon}
            </div>
            <div>
              <p className="text-sm text-gray-200">
                <span className="font-semibold text-white">{activity.user}</span> 
                {activity.type === 'assignment' ? ' was assigned to ' : activity.type === 'completion' ? ' completed ' : ' joined '}
                <span className="font-semibold text-white">{activity.track}</span>
              </p>
              <span className="text-xs text-gray-400 mt-1 block">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
