import React from 'react';
import { LucideGlobe } from 'lucide-react';

export const LanguageSwitcher = () => {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <LucideGlobe className="h-4 w-4" />
      <select 
        className="bg-transparent border-none focus:ring-0 cursor-pointer"
        defaultValue="en"
      >
        <option value="en" className="text-black">EN</option>
        <option value="es" className="text-black">ES</option>
      </select>
    </div>
  );
};
