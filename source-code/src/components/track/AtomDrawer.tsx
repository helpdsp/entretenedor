import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, BookOpen, MessageSquare, Award, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../../lib/supabase';

// Import Players
import VideoPlayer from '../atoms/VideoPlayer';
import PlaybookReader from '../atoms/PlaybookReader';
import QuizPlayer from '../atoms/QuizPlayer';
import FlashcardDeck from '../atoms/FlashcardDeck';
import TaskAtom from '../atoms/TaskAtom';

interface AtomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  atom?: {
    id: string;
    title: string;
    description: string;
    status: string;
    type?: 'video' | 'playbook' | 'quiz' | 'flashcard' | 'task';
    content?: any;
    track_id?: string;
  };
}

const AtomDrawer: React.FC<AtomDrawerProps> = ({ isOpen, onClose, atom }) => {
  const [activePlayer, setActivePlayer] = useState<boolean>(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>('not_started');

  useEffect(() => {
    if (atom) {
      setLocalStatus(atom.status);
      setActivePlayer(false);
    }
  }, [atom]);

  if (!atom) return null;

  const handleMarkComplete = async () => {
    if (isMarkingComplete || localStatus === 'completed') return;
    
    setIsMarkingComplete(true);
    try {
      const { error } = await supabase.rpc('mark_atom_complete', { 
        p_atom_id: atom.id,
        // track_id: atom.track_id // The RPC might need track_id as per specs
      });

      if (!error) {
        setLocalStatus('completed');
      } else {
        console.error('Error marking atom complete:', error);
      }
    } catch (err) {
      console.error('Failed to call mark_atom_complete:', err);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const renderPlayer = () => {
    if (!atom.type || !atom.content) {
      return (
        <div className="p-8 rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Play className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-sm text-white/40">Select a player to begin this atom's content</p>
        </div>
      );
    }

    switch (atom.type) {
      case 'video':
        return <VideoPlayer url={atom.content.url} title={atom.title} onComplete={handleMarkComplete} />;
      case 'playbook':
        return <PlaybookReader content={atom.content.markdown} onComplete={handleMarkComplete} />;
      case 'quiz':
        return <QuizPlayer questions={atom.content.questions} onComplete={(score) => score >= (atom.content.passing_score || 80) && handleMarkComplete()} />;
      case 'flashcard':
        return <FlashcardDeck cards={atom.content.cards} onComplete={handleMarkComplete} />;
      case 'task':
        return <TaskAtom instruction={atom.content.instructions_html} resources={atom.content.resources} onComplete={handleMarkComplete} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%', y: '100%' }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: '100%', y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={clsx(
              'fixed right-0 bottom-0 z-50 overflow-hidden flex flex-col',
              'w-full h-[90vh] rounded-t-3xl border-t border-white/10',
              'lg:w-[460px] lg:h-screen lg:rounded-none lg:border-l lg:border-t-0',
              'glass-morphism shadow-2xl'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <div>
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Atom Details</p>
                <h2 className="text-xl font-bold text-white line-clamp-1">
                  {atom.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
              
              {!activePlayer ? (
                <div className="space-y-8">
                  {/* Meta Info */}
                  <div className="space-y-4">
                    <p className="text-white/70 leading-relaxed text-sm">
                      {atom.description}
                    </p>
                    
                    <div className="flex gap-2">
                      <span className={clsx(
                        'px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider',
                        localStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 
                        localStatus === 'in_progress' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'bg-white/5 text-white/40 border border-white/5'
                      )}>
                        {localStatus.replace('_', ' ')}
                      </span>
                      {atom.type && (
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/20">
                          {atom.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActivePlayer(true)}
                      className="flex flex-col items-start p-4 rounded-2xl glass-morphism border border-white/5 hover:border-violet-500/50 hover:bg-white/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-violet-400" />
                      </div>
                      <span className="text-xs font-bold text-white mb-1">Start Content</span>
                      <span className="text-[10px] text-white/40">Launch specialized player</span>
                    </button>
                    
                    <button className="flex flex-col items-start p-4 rounded-2xl glass-morphism border border-white/5 hover:border-cyan-500/50 hover:bg-white/5 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-xs font-bold text-white mb-1">Discussion</span>
                      <span className="text-[10px] text-white/40">24 active learners</span>
                    </button>
                  </div>

                  {/* Completion Card if already done */}
                  {localStatus === 'completed' && (
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Atom Mastered</h4>
                        <p className="text-[11px] text-emerald-400/80">Completed on {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col"
                >
                   <button 
                    onClick={() => setActivePlayer(false)}
                    className="mb-6 flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    <X className="w-3 h-3" /> Back to Overview
                  </button>
                  
                  {renderPlayer()}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
              <button 
                onClick={handleMarkComplete}
                disabled={isMarkingComplete || localStatus === 'completed'}
                className={clsx(
                  "w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                  localStatus === 'completed' 
                    ? "bg-emerald-500 cursor-default" 
                    : "bg-gradient-to-r from-violet-600 to-cyan-600 hover:shadow-violet-500/40 disabled:opacity-50"
                )}
              >
                {isMarkingComplete ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : localStatus === 'completed' ? (
                  <><CheckCircle className="w-5 h-5" /> Completed</>
                ) : (
                  "Mark as Completed"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AtomDrawer;
