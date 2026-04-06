import React from 'react';

const teams = [
  { id: 1, name: 'Core Eng', members: 12, progress: 85, activeTrack: 'Rust for Experts' },
  { id: 2, name: 'Product Ops', members: 8, progress: 62, activeTrack: 'Agile 2.0' },
  { id: 3, name: 'Growth Team', members: 15, progress: 45, activeTrack: 'Growth Hacking' },
  { id: 4, name: 'SRE / DevOps', members: 6, progress: 92, activeTrack: 'Kubernetes Mastery' },
];

export const TeamProgressTable: React.FC = () => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Team Progress</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs font-medium uppercase">
              <th className="px-6 py-3">Team Name</th>
              <th className="px-6 py-3 text-center">Members</th>
              <th className="px-6 py-3">Current Track</th>
              <th className="px-6 py-3">Avg Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{team.name}</td>
                <td className="px-6 py-4 text-center text-gray-300">{team.members}</td>
                <td className="px-6 py-4 text-gray-300 text-sm">{team.activeTrack}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${team.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{team.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
