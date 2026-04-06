import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LucideUserPlus, LucideMail, LucideLock, LucideUser, LucideLoader2 } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export const SignupPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      });

      if (error) throw error;
      
      if (data.user) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <LucideMail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            We've sent a verification link to your email address. Please check your inbox to activate your account.
          </p>
          <div className="mt-6">
            <Link
              to="/auth/login"
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
              <LucideUserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            Join FastTrack AI and start your atomic learning journey
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LucideUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('fullName')}
                  className="block w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-10 pr-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName.message}</p>}
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LucideLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-10 pr-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>}
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
            Sign Up
          </button>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-400">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
