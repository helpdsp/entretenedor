import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, CheckCircle, List } from 'lucide-react';
import { clsx } from 'clsx';

interface PlaybookReaderProps {
  content: string;
  onComplete: () => void;
}

const PlaybookReader: React.FC<PlaybookReaderProps> = ({ content, onComplete }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Extract H2 and H3 for the checklist
    const lines = content.split('\n');
    const extractedHeadings = lines
      .filter(line => line.startsWith('## ') || line.startsWith('### '))
      .map(line => ({
        id: line.replace(/^#+\s/, '').toLowerCase().replace(/\s+/g, '-'),
        text: line.replace(/^#+\s/, ''),
        level: line.startsWith('### ') ? 3 : 2
      }));
    setHeadings(extractedHeadings);
  }, [content]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(progress);
      
      if (progress > 95 && !completed) {
        setCompleted(true);
        onComplete();
      }
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden glass-morphism">
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-white/5 relative z-10">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-200" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 prose prose-invert prose-cyan max-w-none scroll-smooth"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {/* Sidebar Checklist (Desktop only or Drawer) */}
        <div className="hidden lg:block w-64 border-l border-white/5 p-6 bg-black/20 backdrop-blur-md overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <List className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest">Outline</h4>
          </div>
          
          <div className="space-y-4">
            {headings.map((heading, idx) => (
              <div 
                key={idx}
                className={clsx(
                  "flex items-start gap-2 group cursor-pointer",
                  heading.level === 3 ? "ml-4" : ""
                )}
              >
                <div className={clsx(
                  "mt-1 w-3 h-3 rounded-full border border-white/20 transition-colors flex items-center justify-center",
                  scrollProgress > (idx / headings.length) * 100 ? "bg-emerald-500/80 border-emerald-500" : ""
                )}>
                  {scrollProgress > (idx / headings.length) * 100 && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-white/50 group-hover:text-white transition-colors leading-tight">
                  {heading.text}
                </span>
              </div>
            ))}
          </div>

          {completed && (
            <div className="mt-12 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-in fade-in zoom-in">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-400">Content Read!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybookReader;
