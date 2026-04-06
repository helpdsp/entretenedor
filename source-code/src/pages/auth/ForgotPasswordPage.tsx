import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LucideKeyRound, LucideMail, LucideLoader2, LucideArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
              <LucideKeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            Enter your email to receive a password reset link
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-6 border border-green-200 dark:border-green-800 text-center">
            <p className="text-sm text-green-800 dark:text-green-400 font-medium">
              We've sent a password reset link to your email.
            </p>
            <Link
              to="/auth/login"
              className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              <LucideArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Email
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LucideMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="block w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-10 pr-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <LucideLoader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              Send Reset Link
            </button>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-400">
              <Link to="/auth/login" className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">
                <LucideArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
