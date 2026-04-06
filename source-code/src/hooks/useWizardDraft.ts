import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface WizardState {
  id?: string;
  step: number;
  file: File | null;
  fragmentation: any[];
  config: {
    title: string;
    description: string;
    thumbnail: string | null;
    tags: string[];
    language: string;
    visibility: string;
  };
  reutilization: any[];
  generation: {
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress: number;
  };
  editing: any[];
  publish: {
    previewUrl: string | null;
    checklist: string[];
  };
}

const STORAGE_KEY = 'vision-wizard-draft';

const initialState: WizardState = {
  step: 1,
  file: null,
  fragmentation: [],
  config: {
    title: '',
    description: '',
    thumbnail: null,
    tags: [],
    language: 'en',
    visibility: 'public',
  },
  reutilization: [],
  generation: {
    status: 'idle',
    progress: 0,
  },
  editing: [],
  publish: {
    previewUrl: null,
    checklist: [],
  },
};

export const useWizardDraft = () => {
  const { user } = useAuth();
  const [state, setState] = useState<WizardState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialState;
  });

  // Sync to localStorage
  useEffect(() => {
    const { file, ...serializable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  }, [state]);

  // Periodic sync to Supabase (Autosave T-005)
  useEffect(() => {
    if (!user) return;

    const autosave = async () => {
      const { file, ...serializable } = state;
      
      const payload = {
        user_id: user.id,
        title: state.config.title,
        description: state.config.description,
        language: state.config.language,
        visibility: state.config.visibility,
        current_step: state.step,
        steps_data: serializable
      };

      if (state.id) {
        await supabase
          .from('track_drafts')
          .update(payload)
          .eq('id', state.id);
      } else {
        const { data } = await supabase
          .from('track_drafts')
          .insert(payload)
          .select()
          .single();
        
        if (data) setState(prev => ({ ...prev, id: data.id }));
      }
    };

    const timer = setTimeout(autosave, 5000); // Debounced autosave
    return () => clearTimeout(timer);
  }, [state, user]);

  const setStep = (step: number) => setState(prev => ({ ...prev, step }));
  
  const updateConfig = (config: Partial<WizardState['config']>) => 
    setState(prev => ({ ...prev, config: { ...prev.config, ...config } }));

  const setFile = (file: File | null) => setState(prev => ({ ...prev, file }));

  const reset = () => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    state,
    setStep,
    updateConfig,
    setFile,
    reset,
    setState
  };
};
