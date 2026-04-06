import React, { useState } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../components/ui/Sidebar';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  date: string;
}

export const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Application Approved', message: 'Congratulations! Your creator application has been approved. Start building tracks today.', type: 'success', read: false, date: '2026-04-01' },
    { id: '2', title: 'Content Fragmented', message: 'Your "Rust for Experts" content has been fragmented and is ready for review.', type: 'info', read: true, date: '2026-04-02' },
    { id: '3', title: 'Draft Reminder', message: 'You have a draft that was last modified 2 days ago. Complete your track to reach more learners.', type: 'warning', read: false, date: '2026-04-03' },
  ]);

  const markAllRead = () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      
      <div className="flex-1 ml-64 p-8">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1 font-medium">Stay updated with your account activity.</p>
          </div>
          <button 
            onClick={markAllRead}
            className="text-sm font-bold text-accent hover:underline flex items-center gap-2"
          >
            <Check size={16} />
            Mark all as read
          </button>
        </header>

        <div className="max-w-3xl space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <Bell size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold">No notifications yet.</h3>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-6 rounded-2xl border transition-all flex gap-6 ${
                  n.read ? 'bg-muted/30 border-border opacity-70' : 'bg-card border-accent/20 shadow-lg shadow-accent/5'
                }`}
              >
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                  n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                  n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-accent/10 text-accent'
                }`}>
                  {n.type === 'success' ? <CheckCircle size={24} /> : 
                   n.type === 'warning' ? <AlertTriangle size={24} /> : <Info size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg">{n.title}</h3>
                    <span className="text-xs text-muted-foreground font-bold">{n.date}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">{n.message}</p>
                  <div className="mt-4 flex gap-4">
                    {!n.read && <button className="text-xs font-black text-accent uppercase tracking-widest hover:underline">Mark read</button>}
                    <button 
                      onClick={() => deleteNotification(n.id)}
                      className="text-xs font-black text-muted-foreground hover:text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
