import React, { useState } from 'react';
import { OrgStats } from '../../components/org/StatCards';
import { TeamProgressTable } from '../../components/org/TeamProgressTable';
import { TeamDonutChart } from '../../components/org/TeamDonutChart';
import { RecentActivityFeed } from '../../components/org/RecentActivityFeed';
import { AssignTrackModal } from '../../components/org/AssignTrackModal';

const OrgDashboard: React.FC = () => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold">Organization Admin</h1>
            <p className="text-gray-400 mt-2">Oversee team progress and track assignments.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors">
              Manage Members
            </button>
            <button 
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Assign New Track
            </button>
          </div>
        </header>

        <OrgStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TeamProgressTable />
          </div>
          <div className="space-y-8">
            <TeamDonutChart />
            <RecentActivityFeed />
          </div>
        </div>
      </div>

      <AssignTrackModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
      />
    </div>
  );
};

export default OrgDashboard;
