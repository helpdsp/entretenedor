import React, { useState } from 'react';
import { X, Search, User, Users, Shield, Target, CreditCard, Loader2, Check } from 'lucide-react';

interface AssignTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AssignmentTarget = 'organization' | 'team' | 'individual';

const tracks = [
  { id: 1, name: 'Rust for Experts', level: 'Advanced', duration: '12h', price: 45 },
  { id: 2, name: 'Product Strategy', level: 'Intermediate', duration: '8h', price: 35 },
  { id: 3, name: 'Cybersecurity 101', level: 'Beginner', duration: '4h', price: 25 },
  { id: 4, name: 'Leadership Skills', level: 'All Levels', duration: '6h', price: 30 },
];

export const AssignTrackModal: React.FC<AssignTrackModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<AssignmentTarget | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step === 1 && target) setStep(2);
    else if (step === 2 && selectedTrack) setStep(3);
  };

  const handleConfirmPay = async () => {
    setIsProcessing(true);
    // Simulate Edge Function: stripe-checkout
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setTarget(null);
    setSelectedTrack(null);
    onClose();
  };

  const track = tracks.find(t => t.id === selectedTrack);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Assign Learning Track</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Who are you assigning this to?</h3>
                <p className="text-sm text-gray-400 mt-1">Select the target for this assignment.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'organization', label: 'Organization', icon: <Shield size={24} />, desc: 'Entire company' },
                  { id: 'team', label: 'Team', icon: <Users size={24} />, desc: 'Specific group' },
                  { id: 'individual', label: 'Individual', icon: <User size={24} />, desc: 'Single member' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTarget(item.id as AssignmentTarget)}
                    className={`flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all ${target === item.id ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                  >
                    <div className={target === item.id ? 'text-indigo-400' : 'text-gray-400'}>{item.icon}</div>
                    <div className="text-center">
                      <p className="font-bold text-white text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Select a Learning Track</h3>
                <p className="text-sm text-gray-400 mt-1">Choose the content to assign.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search tracks..." 
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {tracks.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${selectedTrack === track.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={`p-2 rounded-lg ${selectedTrack === track.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-gray-400'}`}>
                        <Target size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{track.name}</p>
                        <p className="text-xs text-gray-500">{track.level} • {track.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-indigo-400">${track.price}</span>
                      {selectedTrack === track.id && <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-4">
              <div className="relative">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <CreditCard size={40} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center border-4 border-[#0a0a0a]">
                  <Check size={16} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Checkout Summary</h3>
                <p className="text-gray-400 mt-2 max-w-sm text-sm">
                  Assigning <span className="text-indigo-400 font-bold">{track?.name}</span> to 
                  <span className="text-indigo-400 font-bold"> {target === 'organization' ? 'the entire organization' : target === 'team' ? 'selected team' : 'selected member'}</span>.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Price per seat</span>
                  <span className="text-white font-medium">${track?.price}.00</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Seats</span>
                  <span className="text-white font-medium">{target === 'organization' ? '124' : target === 'team' ? '12' : '1'}</span>
                </div>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">Total Amount</span>
                  <span className="text-emerald-400 text-xl font-bold">
                    ${(track?.price || 0) * (target === 'organization' ? 124 : target === 'team' ? 12 : 1)}.00
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 italic">
                * This will trigger a Stripe Checkout session for payment confirmation.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex justify-between gap-4 bg-white/5">
          <button 
            onClick={step === 1 ? handleClose : () => setStep(step - 1)}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button 
            onClick={step === 3 ? handleConfirmPay : handleNextStep}
            disabled={((step === 1 && !target) || (step === 2 && !selectedTrack)) || isProcessing}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${((step === 1 && !target) || (step === 2 && !selectedTrack)) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : step === 3 ? 'Confirm & Pay with Stripe' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};
