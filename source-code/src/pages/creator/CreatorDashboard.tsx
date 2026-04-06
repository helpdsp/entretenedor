import React from 'react';
import { Plus, Database, BarChart3, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';

export const CreatorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Published Tracks', value: '12', change: '+2', icon: <Database size={18} /> },
    { label: 'Total Learners', value: '4,230', change: '+12%', icon: <BarChart3 size={18} /> },
    { label: 'Completion Rate', value: '84%', change: '+5%', icon: <BarChart3 size={18} /> },
  ];

  const recentTracks = [
    { id: 1, title: 'Rust for Experts', status: 'Published', learners: 1240, lastUpdate: '2h ago' },
    { id: 2, title: 'Product Strategy v2', status: 'Draft', learners: 0, lastUpdate: '1d ago' },
    { id: 3, title: 'Cybersecurity 101', status: 'Processing', learners: 0, lastUpdate: '5m ago' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground flex">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 bg-background">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Welcome back, creator. What's next?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-muted border border-border rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => navigate('/creator/wizard')}
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-accent/20"
            >
              <Plus size={20} />
              New Track
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 backdrop-blur-sm group hover:border-accent transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-accent/10 text-accent rounded-xl group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <span className="text-emerald-500 text-sm font-bold">{stat.change}</span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-1 tracking-tight text-foreground">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Recent Tracks */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
            <h2 className="text-xl font-bold">Recent Tracks</h2>
            <button className="text-sm text-accent font-bold hover:underline">View All</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted-foreground text-sm border-b border-border">
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Track Name</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Learners</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTracks.map((track) => (
                <tr key={track.id} className="hover:bg-accent/5 transition-colors group">
                  <td className="px-6 py-4 font-bold">{track.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      track.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                      track.status === 'Processing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-muted-foreground/10 text-muted-foreground border border-muted-foreground/20'
                    }`}>
                      {track.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">{track.learners.toLocaleString()}</td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">{track.lastUpdate}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="opacity-0 group-hover:opacity-100 text-accent font-bold hover:underline transition-all">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
