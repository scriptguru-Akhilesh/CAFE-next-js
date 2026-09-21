
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Coffee,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated, login, isLoading } = useAdminAuth();

  const [identifier, setIdentifier] = useState(
    'admin@cornerroastery.com'
  );
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to admin dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/admin';
      router.replace(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email or username');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsSubmitting(true);

    const result = await login(identifier, password);

    setIsSubmitting(false);

    if (result.success) {
      if (result.user?.role === 'platform') {
        router.replace('/platform/dashboard');
      } else {
        const redirect = searchParams.get('redirect') || '/admin';
        router.replace(redirect);
      }
    } else {
      setErrorMsg(
        result.error || 'Invalid credentials. Please try again.'
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-stone-100/80 dark:bg-stone-950 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 font-sans overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent dark:from-amber-950/30"
      />

      {/* Top Header */}
      <header className="relative z-10 max-w-md mx-auto w-full flex items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500 text-amber-100 dark:text-stone-950 shadow-sm group-hover:scale-105 transition-transform">
            <Coffee className="h-4 w-4" />
          </div>

          <div>
            <span className="text-sm font-extrabold text-stone-900 dark:text-white tracking-tight">
              Corner Roastery
            </span>

            <span className="block text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              Admin Portal
            </span>
          </div>
        </Link>

        <ThemeToggle className="dark:bg-stone-900 dark:border-stone-800" />
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 max-w-sm mx-auto w-full my-auto py-6">
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xl shadow-stone-900/5 dark:shadow-black/20 space-y-6">

          {/* Login Heading */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              Portal Login
            </h1>

            <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              Sign in as a Cafe Owner or Super Admin to manage your portal.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email / Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold text-stone-700 dark:text-stone-300"
              >
                Email or Username
              </label>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />

                <input
                  id="admin-email"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@cornerroastery.com"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 py-2.5 pl-10 pr-3.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-stone-700 dark:text-stone-300"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />

                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 py-2.5 pl-10 pr-10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3 py-2.5 text-[11px] text-stone-600 dark:text-stone-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  Demo Credentials
                </span>

                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                  DEMO
                </span>
              </div>

              <div className="flex gap-4">
                <div className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                  <div className="font-bold text-stone-800 dark:text-stone-200 mb-1">Super Admin:</div>
                  <div>User: <span className="text-amber-600 dark:text-amber-400 font-bold">platform</span></div>
                  <div>Pass: <span className="text-amber-600 dark:text-amber-400 font-bold">platform123</span></div>
                </div>

                <div className="font-mono text-[10px] text-stone-500 dark:text-stone-400 border-l pl-4 border-stone-200 dark:border-stone-800">
                  <div className="font-bold text-stone-800 dark:text-stone-200 mb-1">Cafe Owner:</div>
                  <div>User: <span className="text-amber-600 dark:text-amber-400 font-bold">admin</span></div>
                  <div>Pass: <span className="text-amber-600 dark:text-amber-400 font-bold">admin123</span></div>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 dark:bg-amber-500 py-3 px-4 text-xs font-extrabold text-white dark:text-stone-950 shadow-md shadow-stone-900/10 dark:shadow-amber-500/10 hover:bg-stone-800 dark:hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>
                {isSubmitting ? 'Verifying...' : 'Sign In to Dashboard'}
              </span>

              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Back Link */}
          <div className="pt-2 text-center border-t border-stone-100 dark:border-stone-800">
            <Link
              href="/order"
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors inline-flex items-center gap-1"
            >
              ← Back to Customer Menu
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-stone-400 dark:text-stone-600 pb-1">
        Corner Roastery • Secure Admin Area
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-950 text-stone-500">
          Loading admin portal...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
