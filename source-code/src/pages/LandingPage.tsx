import { Link } from 'react-router-dom';
import { LucideZap, LucideBox, LucideLayers, LucideCheckCircle2, LucideGlobe, LucideMoon, LucideShieldCheck, LucideUserPlus, LucideBuilding2, LucideArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import WaitlistForm from '@/components/ui/WaitlistForm';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-zinc-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-600 p-1.5 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <LucideZap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">FastTrack AI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-cyan-400 transition-colors">Methodology</a>
              <a href="#benefits" className="text-sm font-medium hover:text-cyan-400 transition-colors">Benefits</a>
              <a href="#waitlist" className="text-sm font-medium hover:text-cyan-400 transition-colors">Join Beta</a>
            </div>

            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              {user ? (
                <Link
                  to="/dashboard"
                  className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/25"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="hidden sm:block text-sm font-semibold hover:text-cyan-400 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/25"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center rounded-full border border-violet-900/50 bg-violet-900/20 px-3 py-1 text-sm font-medium text-violet-400 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 mr-2 animate-pulse"></span>
            Atomic Learning Engine v1.0
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-violet-400 to-cyan-400 bg-clip-text text-transparent pb-2">
            Master Any Skill with <br className="hidden md:block" /> Atomic Learning
          </h1>
          <p className="mx-auto max-w-2xl text-lg lg:text-xl text-zinc-400 mb-10 leading-relaxed">
            FastTrack AI decomposes complex knowledge into fundamental Atoms. 
            Build your path to mastery through interactive Cells and Tracks powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/signup"
              className="w-full sm:w-auto rounded-full bg-violet-600 px-8 py-4 text-base font-bold text-white hover:bg-violet-500 transition-all shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2"
            >
              Start Learning Now <LucideArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto rounded-full border border-zinc-800 bg-zinc-900 px-8 py-4 text-base font-bold hover:bg-zinc-800 transition-all text-zinc-300"
            >
              Explore Methodology
            </a>
          </div>
        </div>
        
        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-violet-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute top-1/2 -right-1/4 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[150px]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>
      </section>

      {/* Atomic Methodology Section */}
      <section id="features" className="py-24 bg-zinc-900/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">The Atomic Methodology</h2>
            <p className="text-zinc-400 text-lg">Precision-engineered learning for the AI era.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <LucideBox className="h-8 w-8 text-cyan-400" />,
                title: "Atoms",
                description: "Single, indivisible units of knowledge. Definitions, formulas, or core concepts that take minutes to master.",
                accent: "border-cyan-500/20"
              },
              {
                icon: <LucideLayers className="h-8 w-8 text-violet-400" />,
                title: "Cells",
                description: "Connected groups of Atoms that form a coherent sub-topic. The building blocks of your understanding.",
                accent: "border-violet-500/20"
              },
              {
                icon: <LucideZap className="h-8 w-8 text-amber-400" />,
                title: "Tracks",
                description: "Curated learning paths that take you from beginner to expert through a sequence of Cells.",
                accent: "border-amber-500/20"
              }
            ].map((item, i) => (
              <div key={i} className={`bg-zinc-900/50 p-8 rounded-2xl border ${item.accent} backdrop-blur-sm hover:translate-y-[-4px] transition-all duration-300`}>
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - T-004 */}
      <section id="benefits" className="py-24 border-y border-zinc-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Engineered for Success</h2>
            <p className="text-zinc-400 text-lg">Different roles, one unified mission: Mastery.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Learners */}
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-xl bg-cyan-900/30 flex items-center justify-center text-cyan-400">
                <LucideUserPlus className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">For Learners</h3>
              <ul className="space-y-4">
                {[
                  "Personalized AI-driven learning paths",
                  "Micro-sessions that fit your schedule",
                  "Gamified progress tracking (Streaks)",
                  "Verified skill atoms for your profile"
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-400">
                    <LucideCheckCircle2 className="h-5 w-5 text-cyan-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Creators */}
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-xl bg-violet-900/30 flex items-center justify-center text-violet-400">
                <LucideZap className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">For Creators</h3>
              <ul className="space-y-4">
                {[
                  "AI-assisted content decomposition",
                  "Monetize individual learning Atoms",
                  "Deep analytics on student engagement",
                  "Collaborative track building tools"
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-400">
                    <LucideCheckCircle2 className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admins */}
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-100">
                <LucideBuilding2 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">For Organizations</h3>
              <ul className="space-y-4">
                {[
                  "Enterprise-grade skill mapping",
                  "Automatic compliance tracking",
                  "Internal talent marketplace",
                  "SSO & Custom domain support"
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-400">
                    <LucideCheckCircle2 className="h-5 w-5 text-zinc-100 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="py-24 bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto glass-morphism p-12 lg:p-16 rounded-[2.5rem] relative overflow-hidden">
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white">Join the Atomic Revolution</h2>
                <p className="text-zinc-400 text-lg mb-8">
                  We are currently in invite-only beta. Join the waitlist to be among the first to experience the future of education.
                </p>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span className="flex items-center gap-2"><LucideShieldCheck className="h-4 w-4" /> Secure access</span>
                  <span className="flex items-center gap-2"><LucideZap className="h-4 w-4" /> Priority onboarding</span>
                </div>
              </div>
              <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
                <WaitlistForm />
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]"></div>
          </div>
        </div>
      </section>

      {/* Footer - T-005 */}
      <footer className="border-t border-zinc-900 py-16 bg-[#050505]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <LucideZap className="h-6 w-6 text-violet-500" />
                <span className="text-xl font-bold tracking-tight text-white">FastTrack AI</span>
              </div>
              <p className="text-zinc-500 max-w-sm mb-6">
                Redefining knowledge acquisition through the power of AI and atomic decomposition. Join us in building the world's most efficient learning engine.
              </p>
              <div className="flex items-center gap-6">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-zinc-500 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Methodology</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Tracks</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Creators</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-zinc-500 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-600">
            <p>&copy; 2026 FastTrack AI. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

