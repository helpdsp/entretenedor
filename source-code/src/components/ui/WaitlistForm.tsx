import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2 } from 'lucide-react';

const waitlistSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

const WaitlistForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('waitlist')
        .insert([{ name: data.name, email: data.email }]);

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          setError('This email is already on the waitlist.');
        } else {
          setError(supabaseError.message);
        }
        return;
      }

      setIsSuccess(true);
      reset();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-green-900/20 border border-green-500/50 rounded-lg animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold text-green-400">You're on the list!</h3>
        <p className="mt-2 text-green-300/80">
          Thanks for your interest. We'll send an invitation to your email as soon as a spot opens up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
          Full Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          placeholder="Jane Doe"
          className={`w-full bg-background border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
            errors.name ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
          Email Address
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          placeholder="jane@example.com"
          className={`w-full bg-background border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
            errors.email ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/50 rounded text-destructive text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Joining...
          </>
        ) : (
          'Join the Waitlist'
        )}
      </button>
    </form>
  );
};

export default WaitlistForm;
