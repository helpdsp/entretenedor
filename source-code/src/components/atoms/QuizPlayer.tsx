import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Award, RefreshCcw, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizPlayerProps {
  questions: Question[];
  onComplete: (score: number) => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ questions, onComplete }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentQuestionIdx];

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    
    if (idx === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      const finalScore = (score / questions.length) * 100;
      if (finalScore >= 80) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#06b6d4', '#10b981']
        });
      }
      onComplete(finalScore);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    const finalPercent = (score / questions.length) * 100;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-white/10 glass-morphism text-center space-y-8"
      >
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 flex items-center justify-center border-4 border-white/5">
            <Award className={clsx(
              "w-16 h-16 transition-all duration-500",
              finalPercent >= 80 ? "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" : "text-slate-400"
            )} />
          </div>
          <div className="absolute -top-4 -right-4 bg-violet-600 text-white text-xs font-black px-4 py-2 rounded-full rotate-12 shadow-xl border border-white/20">
            {Math.round(finalPercent)}%
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {finalPercent >= 80 ? "Knowledge Master!" : "Keep Practicing"}
          </h3>
          <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed">
            You got {score} out of {questions.length} questions correct. 
            {finalPercent >= 80 ? " You've successfully completed this atom's challenge." : " You need 80% to master this atom."}
          </p>
        </div>

        <div className="flex gap-4 w-full">
          <button 
            onClick={resetQuiz}
            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm font-bold text-white"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 bg-slate-900/40 rounded-3xl border border-white/10 glass-morphism relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Question {currentQuestionIdx + 1} of {questions.length}</span>
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <div 
                key={idx}
                className={clsx(
                  "h-1 rounded-full transition-all duration-300",
                  idx === currentQuestionIdx ? "w-8 bg-violet-500" : 
                  idx < currentQuestionIdx ? "w-4 bg-emerald-500/50" : "w-4 bg-white/10"
                )}
              />
            ))}
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
          STREAK: 0
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          className="space-y-8"
        >
          <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
            {currentQuestion.text}
          </h2>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              const showCheck = isAnswered && isCorrect;
              const showError = isAnswered && isSelected && !isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={clsx(
                    "group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300",
                    !isAnswered && "hover:bg-white/10 border-white/10 hover:border-violet-500/50 hover:scale-[1.01]",
                    isAnswered && !isSelected && !isCorrect && "opacity-40 border-white/5",
                    isSelected && !isAnswered && "bg-violet-600/10 border-violet-500",
                    showCheck && "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
                    showError && "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors",
                      showCheck ? "bg-emerald-500 text-white" :
                      showError ? "bg-rose-500 text-white" : "bg-white/5 text-white/40 group-hover:bg-violet-500 group-hover:text-white"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium text-sm text-left">{option}</span>
                  </div>
                  
                  {showCheck && <CheckCircle className="w-5 h-5" />}
                  {showError && <XCircle className="w-5 h-5" />}
                </button>
              );
            })}
          </div>

          {isAnswered && currentQuestion.explanation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-white/70 italic leading-relaxed"
            >
              <span className="font-bold text-violet-400 not-italic block mb-1 uppercase tracking-tighter">Did you know?</span>
              {currentQuestion.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pt-6">
        <button
          onClick={handleNext}
          disabled={!isAnswered}
          className={clsx(
            "w-full py-5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all",
            isAnswered 
              ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.02] active:scale-95" 
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
          )}
        >
          {currentQuestionIdx === questions.length - 1 ? "Finish" : "Next Question"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default QuizPlayer;
