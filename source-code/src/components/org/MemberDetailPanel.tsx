import React from 'react';
import { X, User, Mail, Calendar, ShieldCheck, Clock } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  tracksCount: number;
}

interface MemberDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export const MemberDetailPanel: React.FC<MemberDetailPanelProps> = ({ isOpen, onClose, member }) => {
  if (!member) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Member Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
              <User size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{member.name}</h3>
              <p className="text-gray-400">{member.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <Mail className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Email</p>
                <p className="text-sm text-white">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <ShieldCheck className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Role</p>
                <p className="text-sm text-white">{member.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <Calendar className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Joined</p>
                <p className="text-sm text-white">{member.joinedAt}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <Clock className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Last Active</p>
                <p className="text-sm text-white">{member.lastActive}</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
            <p className="text-sm text-indigo-400 mb-2">Learning Tracks</p>
            <h4 className="text-3xl font-bold text-white">{member.tracksCount}</h4>
            <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors">
              View All Tracks
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-4">
          <button className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-lg text-sm font-medium transition-colors">
            Remove Member
          </button>
        </div>
      </div>
    </div>
  );
};
