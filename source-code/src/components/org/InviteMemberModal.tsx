import React, { useState } from 'react';
import { X, Mail, Shield, UserPlus, Info } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Member' | 'Admin'>('Member');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async () => {
    setIsSending(true);
    // Simulate Edge Function call: create-org-invite
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setEmail('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus size={20} className="text-indigo-400" />
            Invite Team Member
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">Invitation Sent!</h3>
              <p className="text-gray-400 mt-2">We've sent an invitation email to {email}.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="email" 
                      placeholder="teammate@company.com" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setRole('Member')}
                      className={`flex flex-col gap-1 p-4 rounded-xl border-2 transition-all text-left ${role === 'Member' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                    >
                      <span className={`text-sm font-bold ${role === 'Member' ? 'text-white' : 'text-gray-400'}`}>Member</span>
                      <span className="text-[10px] text-gray-500">View and complete assigned content.</span>
                    </button>
                    <button 
                      onClick={() => setRole('Admin')}
                      className={`flex flex-col gap-1 p-4 rounded-xl border-2 transition-all text-left ${role === 'Admin' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                    >
                      <span className={`text-sm font-bold ${role === 'Admin' ? 'text-white' : 'text-gray-400'}`}>Admin</span>
                      <span className="text-[10px] text-gray-500">Manage members and track assignments.</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  The invitee will receive an email with a link to join your organization. Invitations expire in 48 hours.
                </p>
              </div>
            </>
          )}
        </div>

        {!isSuccess && (
          <div className="p-6 border-t border-white/10 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleInvite}
              disabled={!email || isSending}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : 'Send Invite'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
