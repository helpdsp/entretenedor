import { useAuth } from '../hooks/useAuth';
import { LucideLayoutDashboard, LucideLogOut, LucideUser, LucideSettings, LucideBookOpen, LucideZap, LucideTrendingUp, LucideCalendar, LucideCheckCircle2, LucideLoader2, LucideShare2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import NodeGraph from '@/components/track/NodeGraph';

interface DashboardStats {
  total_atoms_mastered: number;
  active_tracks: number;
  current_streak: number;
}

interface WeeklyActivity {
  day: string;
  completed_atoms: number;
}

export const DashboardPage = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Dashboard Stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      return data[0] || { total_atoms_mastered: 0, active_tracks: 0, current_streak: 0 };
    },
    enabled: !!user
  });

  // Fetch Weekly Activity
  const { data: activity, isLoading: activityLoading } = useQuery<WeeklyActivity[]>({
    queryKey: ['weekly-activity'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_weekly_activity');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Mutation to mark an atom as complete (to test logic)
  const markCompleteMutation = useMutation({
    mutationFn: async (atomId: string) => {
      const { data, error } = await supabase.rpc('mark_atom_complete', { p_atom_id: atomId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-activity'] });
    }
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-900/50 border-r border-zinc-800 flex flex-col backdrop-blur-xl">
        <div className="p-6 flex items-center gap-2">
          <div className="rounded-lg bg-violet-600 p-1">
            <LucideZap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">FastTrack AI</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-cyan-400 bg-cyan-400/10 rounded-lg">
            <LucideLayoutDashboard className="h-5 w-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <LucideBookOpen className="h-5 w-5" />
            My Learning
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <LucideSettings className="h-5 w-5" />
            Settings
          </a>
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-4">
          <div className="flex items-center justify-between px-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LucideLogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-zinc-900/30 border-b border-zinc-800 flex items-center justify-between px-8 backdrop-blur-md">
          <h1 className="text-lg font-semibold text-white">Learning Overview</h1>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs text-zinc-500 capitalize">{role || 'Learner'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <LucideUser className="h-6 w-6 text-violet-400" />
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400">
                  <LucideCheckCircle2 className="h-6 w-6" />
                </div>
                {statsLoading && <LucideLoader2 className="h-4 w-4 animate-spin text-zinc-500" />}
              </div>
              <h3 className="text-sm font-medium text-zinc-400 mb-1">Total Atoms Mastered</h3>
              <p className="text-4xl font-bold text-white">{stats?.total_atoms_mastered ?? 0}</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <LucideCheckCircle2 className="h-24 w-24" />
              </div>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-violet-400/10 text-violet-400">
                  <LucideZap className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-zinc-400 mb-1">Active Tracks</h3>
              <p className="text-4xl font-bold text-white">{stats?.active_tracks ?? 0}</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <LucideZap className="h-24 w-24" />
              </div>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <LucideTrendingUp className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-zinc-400 mb-1">Learning Streak</h3>
              <p className="text-4xl font-bold text-white">{stats?.current_streak ?? 0} Days</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <LucideTrendingUp className="h-24 w-24" />
              </div>
            </div>
          </div>

          {/* Learning Track Graph (RF-08) */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <LucideShare2 className="h-5 w-5 text-violet-400" />
                Visual Learning Path
              </h2>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold bg-zinc-800/50 px-2 py-1 rounded">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div> Completed
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold bg-zinc-800/50 px-2 py-1 rounded">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div> In Progress
                </span>
              </div>
            </div>
            <div className="flex-1 relative">
              <NodeGraph />
            </div>
          </div>

          {/* Activity Section */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <LucideCalendar className="h-5 w-5 text-cyan-400" />
                  Weekly Activity
                </h2>
              </div>
              <div className="p-6">
                {activityLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <LucideLoader2 className="h-8 w-8 animate-spin text-violet-500" />
                  </div>
                ) : activity && activity.length > 0 ? (
                  <div className="flex items-end justify-between h-48 gap-2">
                    {activity.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-violet-600/20 border-x border-t border-violet-500/30 rounded-t-lg transition-all hover:bg-violet-600/40 relative group"
                          style={{ height: `${Math.min(100, (day.completed_atoms / 5) * 100)}%`, minHeight: '4px' }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.completed_atoms} atoms
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">{day.day}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-zinc-500">No activity recorded this week.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions / Recommendations */}
            <div className="bg-violet-600/10 rounded-2xl border border-violet-500/20 p-6 flex flex-col">
              <h2 className="text-lg font-bold text-white mb-6">Continue Learning</h2>
              <div className="space-y-4 flex-1">
                <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-violet-500/50 transition-colors cursor-pointer group">
                  <p className="text-[10px] text-violet-400 font-bold uppercase mb-1">Current Track</p>
                  <h4 className="font-bold text-white group-hover:text-violet-400 transition-colors">Intro to React Atoms</h4>
                  <div className="mt-3 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-violet-500"></div>
                  </div>
                </div>
                
                <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-violet-500/50 transition-colors cursor-pointer group">
                  <p className="text-[10px] text-cyan-400 font-bold uppercase mb-1">Recommended Cell</p>
                  <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">Supabase RPC Basics</h4>
                </div>
              </div>
              
              <button 
                onClick={() => markCompleteMutation.mutate('test-atom-id')}
                disabled={markCompleteMutation.isPending}
                className="mt-6 w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 transition-all"
              >
                {markCompleteMutation.isPending ? <LucideLoader2 className="h-5 w-5 animate-spin" /> : <LucideCheckCircle2 className="h-5 w-5" />}
                Quick Test: Mark Atom
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

