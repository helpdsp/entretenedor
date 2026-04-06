import React, { useState } from 'react';
import { CheckCircle, XCircle, Users, Search } from 'lucide-react';
import { Sidebar } from '../../components/ui/Sidebar';

interface CreatorApplication {
  id: string;
  name: string;
  email: string;
  portfolio: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export const AdminPanel: React.FC = () => {
  const [applications, setApplications] = useState<CreatorApplication[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', portfolio: 'https://portfolio.com/john', status: 'pending', date: '2026-04-01' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', portfolio: 'https://portfolio.com/jane', status: 'pending', date: '2026-04-02' },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com', portfolio: 'https://portfolio.com/bob', status: 'approved', date: '2026-03-28' },
  ]);

  const handleApprove = (id: string) => {
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'approved' } : app));
  };

  const handleReject = (id: string) => {
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'rejected' } : app));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      
      <div className="flex-1 ml-64 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
          <p className="text-muted-foreground mt-1">Manage creator applications and platform settings.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2 text-accent">
              <Users size={20} />
              <span className="text-sm font-medium">Pending Apps</span>
            </div>
            <h3 className="text-2xl font-bold">{applications.filter(a => a.status === 'pending').length}</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2 text-emerald-400">
              <CheckCircle size={20} />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <h3 className="text-2xl font-bold">{applications.filter(a => a.status === 'approved').length}</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2 text-red-400">
              <XCircle size={20} />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <h3 className="text-2xl font-bold">{applications.filter(a => a.status === 'rejected').length}</h3>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
            <h2 className="text-xl font-bold">Creator Applications</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-muted border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-64"
              />
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted-foreground text-sm border-b border-border">
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-accent/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{app.name}</div>
                    <div className="text-xs text-muted-foreground">{app.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                      app.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm font-medium">{app.date}</td>
                  <td className="px-6 py-4 text-right">
                    {app.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(app.id)}
                          className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleReject(app.id)}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    <button className="text-sm text-accent font-bold ml-4 hover:underline">View Portfolio</button>
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
