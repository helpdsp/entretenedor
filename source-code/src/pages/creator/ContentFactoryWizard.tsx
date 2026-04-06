import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Send, Edit3, Trash2 } from 'lucide-react';
import { useWizardDraft } from '../../hooks/useWizardDraft';
import { motion, AnimatePresence } from 'framer-motion';

// Step components (placeholders for now)
const Step1FileUpload = ({ file, setFile }: any) => (
  <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-12">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-black text-foreground tracking-tighter">UPLOAD CONTENT</h2>
      <p className="text-muted-foreground text-lg font-medium">We support PDF, DOCX, and Markdown files up to 50MB.</p>
    </div>
    <div className="w-full h-80 border-2 border-dashed border-border rounded-[40px] bg-card/5 hover:bg-accent/5 hover:border-accent/50 transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden">
      <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="w-20 h-20 bg-accent/10 text-accent rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform rotate-3 group-hover:rotate-0">
        <Loader2 size={40} className={file ? 'animate-spin' : ''} />
      </div>
      <p className="text-foreground font-black tracking-widest uppercase">{file ? file.name : 'Drop file or click to browse'}</p>
      <p className="text-muted-foreground text-xs mt-2 uppercase tracking-tighter font-bold">Max size: 50MB</p>
      <input 
        type="file" 
        className="hidden" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
    </div>
  </div>
);

const Step2Fragmentation = ({ fragmentation }: any) => (
  <div className="flex flex-col h-full space-y-8">
    <div className="flex justify-between items-center bg-card/30 p-6 rounded-3xl border border-border">
      <div>
        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">AI Fragmentation</h2>
        <p className="text-muted-foreground font-medium">Our AI has identified the following cells and atoms.</p>
      </div>
      <button className="flex items-center gap-2 bg-accent/10 text-accent px-6 py-3 rounded-2xl border border-accent/20 font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
        <Sparkles size={18} />
        Regenerate
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-4 custom-scrollbar pb-10">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-card border border-border rounded-[32px] p-8 group hover:border-accent transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
            <div className="flex gap-2">
              <button className="p-2 bg-muted hover:bg-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"><Edit3 size={16} /></button>
              <button className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">Cell 0{i}</span>
          </div>
          <h4 className="font-black text-xl text-foreground mb-3 leading-tight uppercase tracking-tight">Introduction to Core Concepts</h4>
          <p className="text-sm text-muted-foreground font-medium line-clamp-3 leading-relaxed">This cell covers the fundamental principles and architectural overview of the system, ensuring a solid foundation.</p>
          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-2">
            {[1, 2, 3].map(j => (
              <span key={j} className="text-[10px] font-bold bg-muted text-muted-foreground px-3 py-1.5 rounded-lg border border-border/50 uppercase tracking-tighter">Atom 0{j}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Step3Configuration = ({ config, updateConfig }: any) => (
  <div className="flex flex-col h-full max-w-4xl mx-auto space-y-12">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-black text-foreground tracking-tighter uppercase">Configuration</h2>
      <p className="text-muted-foreground text-lg font-medium">Set the metadata and visual identity for this track.</p>
    </div>
    <div className="space-y-8 bg-card border border-border rounded-[40px] p-10 backdrop-blur-sm shadow-2xl shadow-black/10">
      <div className="space-y-3">
        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Track Title</label>
        <input 
          type="text" 
          className="w-full bg-muted border border-border rounded-2xl px-6 py-4 text-foreground font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-muted-foreground/30"
          placeholder="e.g. MASTER REACT HOOKS"
          value={config.title}
          onChange={e => updateConfig({ title: e.target.value })}
        />
      </div>
      <div className="space-y-3">
        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Description</label>
        <textarea 
          rows={4}
          className="w-full bg-muted border border-border rounded-2xl px-6 py-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none placeholder:text-muted-foreground/30"
          placeholder="What will learners achieve with this track?"
          value={config.description}
          onChange={e => updateConfig({ description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Thumbnail</label>
          <div className="w-full aspect-video bg-muted border border-border border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-accent/5 hover:border-accent/50 transition-all group">
            <div className="p-4 bg-background rounded-2xl mb-2 group-hover:scale-110 transition-transform">
               <Edit3 className="text-muted-foreground" size={20} />
            </div>
            <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Upload Image</span>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Visibility</label>
          <div className="grid grid-cols-2 gap-2 bg-muted p-2 rounded-2xl border border-border">
            <button className="bg-accent text-accent-foreground text-xs font-black uppercase tracking-widest py-3 px-4 rounded-xl shadow-lg shadow-accent/20">Public</button>
            <button className="text-muted-foreground text-xs font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-border transition-colors">Internal</button>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium px-2">Public tracks are visible to everyone on the platform.</p>
        </div>
      </div>
    </div>
  </div>
);

const Step4Reutilization = ({ reutilization }: any) => (
  <div className="flex flex-col h-full space-y-8">
    <div className="flex justify-between items-center bg-card/30 p-6 rounded-3xl border border-border">
      <div>
        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">Reutilization Check</h2>
        <p className="text-muted-foreground font-medium">We found similar content in the platform. Reuse them to save credits.</p>
      </div>
    </div>
    <div className="space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="bg-card border border-accent/20 rounded-3xl p-6 flex justify-between items-center group hover:bg-accent/5 transition-all">
          <div className="flex gap-6 items-center">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center font-black">9{i}%</div>
            <div>
              <h4 className="font-black text-lg text-foreground uppercase tracking-tight">Introduction to Core Concepts (Existing)</h4>
              <p className="text-sm text-muted-foreground font-medium">Used in "Fullstack Masterclass" • Created by Vision Team</p>
            </div>
          </div>
          <button className="bg-accent text-accent-foreground px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 hover:scale-105 transition-transform">
            Reuse Atom
          </button>
        </div>
      ))}
      <div className="pt-4">
        <button className="text-muted-foreground font-bold text-sm uppercase tracking-widest hover:text-foreground transition-colors underline decoration-accent/30 underline-offset-4">
          Ignore and generate new content
        </button>
      </div>
    </div>
  </div>
);

const Step5Generation = ({ generation }: any) => (
  <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-12">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-black text-foreground tracking-tighter uppercase">Generating Content</h2>
      <p className="text-muted-foreground text-lg font-medium">Our AI is building your atoms. This usually takes 30-60 seconds.</p>
    </div>
    <div className="w-full space-y-4">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-accent">
        <span>Processing Atoms...</span>
        <span>65%</span>
      </div>
      <div className="w-full h-4 bg-muted rounded-full overflow-hidden border border-border p-1">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '65%' }}
          className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        ></motion.div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 rounded-full ${i <= 3 ? 'bg-accent' : 'bg-muted'}`}></div>
        ))}
      </div>
    </div>
  </div>
);

const Step6Copilot = ({ editing }: any) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi Alex! I\'ve finished generating the content for your track. How can I help you refine it today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sure thing! I am updating the cell "Introduction to Core Concepts" based on your request. One moment...' }]);
    }, 1000);
  };

  return (
    <div className="flex h-full gap-8">
      <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar pb-10">
        <div className="bg-card border border-border rounded-[40px] p-10 shadow-xl">
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-6 border-b border-border pb-6">Preview: Introduction to Core Concepts</h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed text-lg font-medium">
              In this cell, we explore the fundamental principles that govern our system. 
              Understanding these core concepts is essential for mastering the more advanced 
              features we will encounter later in the track.
            </p>
            <div className="mt-10 p-8 bg-accent/5 rounded-[32px] border border-accent/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="text-accent opacity-20 group-hover:opacity-100 transition-opacity" size={24} />
              </div>
              <h4 className="text-accent font-black uppercase tracking-widest text-xs mb-4">Atom 01: System Overview</h4>
              <p className="text-foreground font-medium leading-relaxed">The architecture is designed to be highly modular and scalable, allowing for rapid development and deployment of new features without compromising system integrity.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[400px] flex flex-col bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
        <div className="p-8 border-b border-border bg-card relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent text-accent-foreground rounded-[20px] flex items-center justify-center font-black shadow-lg shadow-accent/20">AI</div>
            <div>
              <h4 className="font-black text-base uppercase tracking-widest">Vision Copilot</h4>
              <p className="text-[10px] text-accent font-black uppercase tracking-widest opacity-70">RF-13: Advanced Editing</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar relative z-10">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-5 rounded-[24px] text-sm font-bold leading-relaxed ${
                m.role === 'user' ? 'bg-accent text-accent-foreground rounded-br-none shadow-lg shadow-accent/10' : 'bg-muted text-foreground rounded-bl-none border border-border shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 border-t border-border bg-card relative z-10">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ask Copilot to refactor..."
              className="w-full bg-muted border border-border rounded-2xl pl-5 pr-14 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold placeholder:text-muted-foreground/30"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3 bg-accent text-accent-foreground rounded-xl hover:scale-110 transition-transform shadow-lg shadow-accent/20 active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Step7Publish = ({ publish }: any) => (
  <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-12">
    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[32px] flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
      <Check size={48} />
    </div>
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-black text-foreground tracking-tighter uppercase">Ready to Publish</h2>
      <p className="text-muted-foreground text-lg font-medium">Your track "Mastering React Hooks" is complete and verified.</p>
    </div>
    <div className="w-full grid grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center space-y-2">
        <span className="text-3xl font-black">12</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Atoms</span>
      </div>
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center space-y-2">
        <span className="text-3xl font-black">45m</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Est. Time</span>
      </div>
    </div>
  </div>
);

const steps = [
  { id: 1, title: 'Upload', component: Step1FileUpload },
  { id: 2, title: 'Fragment', component: Step2Fragmentation },
  { id: 3, title: 'Config', component: Step3Configuration },
  { id: 4, title: 'Reuse', component: Step4Reutilization },
  { id: 5, title: 'Generate', component: Step5Generation },
  { id: 6, title: 'Copilot', component: Step6Copilot },
  { id: 7, title: 'Publish', component: Step7Publish },
];

export const ContentFactoryWizard: React.FC = () => {
  const navigate = useNavigate();
  const { state, setStep, updateConfig, setFile, reset } = useWizardDraft();
  
  const currentStep = steps.find(s => s.id === state.step);
  const StepComponent = currentStep?.component || Step1FileUpload;

  const handleNext = () => {
    if (state.step < steps.length) {
      setStep(state.step + 1);
    } else {
      // Finalize
      navigate('/creator/dashboard');
      reset();
    }
  };

  const handleBack = () => {
    if (state.step > 1) setStep(state.step - 1);
  };

  return (
    <div className="fixed inset-0 bg-background text-foreground z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-card/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/creator/dashboard')}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
          <div className="h-6 w-px bg-border"></div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Content Factory Wizard</h1>
            <p className="text-[10px] text-accent font-black tracking-widest uppercase">RF-13: Smart Transformation</p>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="hidden lg:flex items-center gap-3">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                  state.step === s.id ? 'bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20' : 
                  state.step > s.id ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  state.step >= s.id ? 'bg-white/20' : 'bg-black/10'
                }`}>
                  {state.step > s.id ? <Check size={12} /> : s.id}
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className="w-4 h-px bg-border"></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Save Draft</button>
          <div className="h-6 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=creator" alt="Avatar" />
              </div>
            </div>
            <span className="text-sm font-bold">Alex Creator</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-background/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full p-8 lg:p-12 overflow-y-auto"
          >
            <StepComponent 
              file={state.file} 
              setFile={setFile} 
              fragmentation={state.fragmentation}
              config={state.config}
              updateConfig={updateConfig}
              reutilization={state.reutilization}
              generation={state.generation}
              editing={state.editing}
              publish={state.publish}
            />
          </motion.div>
        </AnimatePresence>

        {/* Floating AI Status Indicator (Step 2, 4, 5, 6) */}
        {[2, 4, 5, 6].includes(state.step) && (
          <div className="absolute bottom-8 right-8 bg-card/80 backdrop-blur-md border border-accent/20 rounded-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="relative">
              <Loader2 size={24} className="text-accent animate-spin" />
              <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="text-[10px] font-black text-accent uppercase tracking-widest">AI Status</p>
              <p className="text-sm text-foreground font-bold">Fragmenting document structure...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="h-24 border-t border-border flex items-center justify-between px-8 bg-card/40 backdrop-blur-xl shrink-0">
        <button 
          onClick={handleBack}
          disabled={state.step === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl border border-border font-bold transition-all ${
            state.step === 1 ? 'opacity-0 cursor-not-allowed' : 'bg-muted hover:bg-border text-foreground'
          }`}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex gap-4">
          <button 
            onClick={handleNext}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl ${
              state.step === steps.length ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' : 
              'bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent/20'
            }`}
          >
            {state.step === steps.length ? (
              <>
                <Send size={20} />
                Publish Track
              </>
            ) : (
              <>
                Next Step
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
