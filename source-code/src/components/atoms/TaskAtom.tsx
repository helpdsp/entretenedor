import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, Maximize2, X, Link as LinkIcon, Download } from 'lucide-react';
import { clsx } from 'clsx';

interface TaskAtomProps {
  instruction: string;
  resources?: { name: string; url: string; type: 'link' | 'file' }[];
  onComplete: () => void;
}

const TaskAtom: React.FC<TaskAtomProps> = ({ instruction, resources = [], onComplete }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxContent, setLightboxContent] = useState<string | null>(null);

  const sanitizedHTML = DOMPurify.sanitize(instruction);

  const handleCheck = () => {
    if (!isChecked) {
      setIsChecked(true);
      onComplete();
    }
  };

  const openLightbox = (url: string) => {
    setLightboxContent(url);
    setShowLightbox(true);
  }

  return (
    <div className="flex flex-col space-y-8 p-6 md:p-8 bg-slate-900/40 rounded-3xl border border-white/5 glass-morphism relative overflow-hidden">
      
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Task Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-cyan-400" />
          </div>
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest leading-none">Practical Task</h4>
        </div>
        {isChecked && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/40 text-[10px] font-bold text-emerald-400"
          >
            <Check className="w-3 h-3" /> VERIFIED
          </motion.div>
        )}
      </div>

      {/* Sanitized Instruction Content */}
      <div className="prose prose-invert prose-cyan max-w-none prose-p:text-white/70 prose-p:leading-relaxed prose-strong:text-cyan-400">
        <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
      </div>

      {/* Resource Cards */}
      {resources.length > 0 && (
        <div className="space-y-4">
          <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Resources & Attachments</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resources.map((res, idx) => (
              <div 
                key={idx}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => res.type === 'file' && res.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? openLightbox(res.url) : window.open(res.url, '_blank')}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:bg-violet-500 group-hover:text-white transition-colors">
                    {res.type === 'link' ? <LinkIcon className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-medium text-white/60 truncate group-hover:text-white transition-colors">
                    {res.name}
                  </span>
                </div>
                {res.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                  <Maximize2 className="w-4 h-4 text-white/20 group-hover:text-cyan-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Area */}
      <div className="pt-6 border-t border-white/5">
        <button
          onClick={handleCheck}
          disabled={isChecked}
          className={clsx(
            "w-full group relative flex items-center justify-between p-1 rounded-2xl transition-all duration-500",
            isChecked ? "bg-emerald-500/20 border-emerald-500 shadow-xl shadow-emerald-500/10 cursor-default" : "bg-white/5 border border-white/10 hover:border-cyan-500/50"
          )}
        >
          <div className="flex items-center gap-4 py-4 px-6">
            <div className={clsx(
              "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
              isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/10 group-hover:border-cyan-400"
            )}>
              {isChecked && <Check className="w-5 h-5 stroke-[4px]" />}
            </div>
            <span className={clsx(
              "text-sm font-bold tracking-tight transition-colors duration-500",
              isChecked ? "text-emerald-400" : "text-white/60 group-hover:text-white"
            )}>
              {isChecked ? "TASK COMPLETED" : "I HAVE FINISHED THIS TASK"}
            </span>
          </div>
          
          {!isChecked && (
            <div className="mr-6 w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 scale-0 group-hover:scale-100 transition-transform">
               <Check className="w-6 h-6 stroke-[3px]" />
            </div>
          )}
        </button>
      </div>

      {/* Lightbox Implementation */}
      <AnimatePresence>
        {showLightbox && lightboxContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-8"
            onClick={() => setShowLightbox(false)}
          >
            <button 
              className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setShowLightbox(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={lightboxContent} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              alt="Task Resource Preview"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskAtom;
