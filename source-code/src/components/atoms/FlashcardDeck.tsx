import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ChevronLeft, ChevronRight, CheckCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

interface FlashcardDeckProps {
  cards: Flashcard[];
  onComplete: () => void;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set([0]));
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIdx];

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    if (currentIdx < cards.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setIsFlipped(false);
      setViewedCards(prev => new Set(prev).add(nextIdx));
    } else if (viewedCards.size === cards.length) {
      setIsFinished(true);
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setIsFlipped(false);
    }
  };

  const resetDeck = () => {
    setCurrentIdx(0);
    setIsFlipped(false);
    setViewedCards(new Set([0]));
    setIsFinished(false);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12 px-6 bg-slate-900/40 rounded-3xl border border-white/5 glass-morphism relative overflow-hidden h-[500px]">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-600/5 via-transparent to-cyan-500/5 pointer-events-none" />

      {/* Progress Counter */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-sm">
            {currentIdx + 1}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">Flashcard</span>
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-tighter">Total {cards.length}</span>
          </div>
        </div>
        
        <div className="flex gap-1.5">
          {cards.map((_, idx) => (
            <div 
              key={idx}
              className={clsx(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                idx === currentIdx ? "bg-violet-500 scale-150 shadow-[0_0_8px_rgba(139,92,246,0.5)]" : 
                viewedCards.has(idx) ? "bg-emerald-500/50" : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      {/* 3D Card Container */}
      <div className="relative w-full max-w-sm perspective-1000 aspect-[4/5]">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key={currentIdx}
              initial={{ rotateY: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: 90, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full h-full cursor-pointer group"
              onClick={handleFlip}
            >
              <div className="relative w-full h-full transform-style-3d transition-transform duration-700 ease-in-out shadow-2xl"
                   style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                
                {/* Front Face */}
                <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex flex-col items-center justify-center p-12 text-center group-hover:border-violet-500/30 transition-colors shadow-2xl">
                  <div className="absolute top-6 left-6 p-2 rounded-lg bg-white/5 border border-white/5">
                    <Info className="w-4 h-4 text-white/20" />
                  </div>
                  <h3 className="text-2xl font-bold text-white leading-snug drop-shadow-lg">
                    {currentCard.front}
                  </h3>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <div className="px-4 py-2 rounded-full bg-violet-600/10 border border-violet-500/20 text-[10px] font-bold text-violet-400 uppercase tracking-widest animate-pulse">
                      Tap to Reveal
                    </div>
                    {currentCard.hint && (
                      <p className="text-[11px] text-white/30 italic">Hint available</p>
                    )}
                  </div>
                </div>

                {/* Back Face */}
                <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-br from-violet-950/80 to-slate-900 border border-violet-500/30 flex flex-col items-center justify-center p-12 text-center shadow-2xl overflow-hidden"
                     style={{ transform: 'rotateY(180deg)' }}>
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="space-y-6">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block mb-4">The answer</span>
                    <p className="text-xl font-medium text-white/90 leading-relaxed">
                      {currentCard.back}
                    </p>
                    {currentCard.hint && (
                      <div className="mt-6 pt-6 border-t border-white/5">
                         <p className="text-xs text-white/50 italic font-light italic">
                           Note: {currentCard.hint}
                         </p>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      Understood
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Deck Mastery!</h3>
              <p className="text-white/60 text-sm mb-12 max-w-xs leading-relaxed">
                You've reviewed all flashcards in this set. Your conceptual knowledge is now synchronized.
              </p>
              <button 
                onClick={resetDeck}
                className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
              >
                <RefreshCcw className="w-4 h-4" /> Restart Deck
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      {!isFinished && (
        <div className="flex items-center gap-6 z-10">
          <button 
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className={clsx(
              "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all",
              currentIdx === 0 ? "bg-white/5 border-white/5 text-white/10" : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-violet-500/30"
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handleNext}
            className="w-20 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center text-white shadow-xl shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all group"
          >
            {currentIdx === cards.length - 1 ? <CheckCircle className="w-6 h-6" /> : <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      )}

      {/* Custom Styles for 3D Perspective */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
};

export default FlashcardDeck;
