import React, { useState, useEffect } from 'react';
import { LucideMoon, LucideSun, Sparkles } from 'lucide-react';

type Theme = 'light' | 'dark' | 'cyberpunk';

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<Theme>(
    (typeof window !== 'undefined' && localStorage.getItem('theme') as Theme) || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark' || theme === 'cyberpunk') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('cyberpunk');
    else setTheme('light');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-full transition-all flex items-center gap-2 group border ${
        theme === 'cyberpunk' ? 'bg-black border-[#00ffcc] text-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.4)]' : 
        theme === 'dark' ? 'bg-white/5 border-white/10 text-indigo-400 hover:bg-white/10' : 
        'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'light' && <LucideSun className="h-5 w-5" />}
      {theme === 'dark' && <LucideMoon className="h-5 w-5" />}
      {theme === 'cyberpunk' && <Sparkles className="h-5 w-5 animate-pulse" />}
      <span className="text-[10px] font-bold uppercase tracking-widest overflow-hidden max-w-0 group-hover:max-w-[100px] transition-all duration-300">
        {theme}
      </span>
    </button>
  );
};
