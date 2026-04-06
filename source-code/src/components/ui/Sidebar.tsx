import React from 'react';
import { LayoutDashboard, Database, BarChart3, Settings, Bell, Shield, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/creator/dashboard' },
    { label: 'Tracks', icon: <Database size={20} />, path: '/tracks' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics' },
    { label: 'Admin', icon: <Shield size={20} />, path: '/admin' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl z-20 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">V</div>
          <span className="font-bold text-xl tracking-tight text-white">Vision</span>
        </div>
        
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-600/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-black animate-pulse"></span>
          </button>
          <ThemeSwitcher />
        </div>
        
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};
