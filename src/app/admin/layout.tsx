'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Coffee, Layers, QrCode, UtensilsCrossed, 
  LogOut, ExternalLink, ShieldCheck, User 
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, logout } = useAdminAuth();

  const isLoginPage = pathname === '/admin/login';

  // Protect all admin routes from unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, isLoginPage, pathname, router]);

  // For the login page, render child without the protected admin shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading spinner while determining auth state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center space-y-3">
        <div className="h-9 w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center animate-pulse">
          <Coffee className="h-5 w-5" />
        </div>
        <p className="text-xs text-stone-400 font-mono">Verifying admin session...</p>
      </div>
    );
  }

  const navLinks = [
    {
      label: 'Dish Catalog',
      href: '/admin',
      icon: Layers,
      isActive: pathname === '/admin' || pathname === '/admin/',
    },
    {
      label: 'Tables & QR Stands',
      href: '/admin/tables',
      icon: QrCode,
      isActive: pathname === '/admin/tables',
    },
    {
      label: 'Kitchen Display (KDS)',
      href: '/admin/kitchen',
      icon: UtensilsCrossed,
      isActive: pathname === '/admin/kitchen',
    },
  ];

  return (
    <div id="admin-portal" className="min-h-screen bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500 text-amber-100 dark:text-stone-950 shadow-sm group-hover:scale-105 transition-transform">
                <Coffee className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-stone-900 dark:text-white tracking-tight">
                    Corner Roastery
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-wide">
                    Admin
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 block font-medium">Management Hub</span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Tabs for Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100 dark:bg-stone-950 p-1 rounded-2xl border border-stone-200 dark:border-stone-800">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    link.isActive
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-amber-400 shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Live Customer Preview link in new tab */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Open customer menu view in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              <span className="hidden sm:inline">Customer Menu</span>
            </Link>

            <ThemeToggle className="dark:bg-stone-900 dark:border-stone-800" />

            {/* Logout button */}
            <button
              id="admin-logout-btn"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
              title="Sign out of admin portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="flex md:hidden items-center justify-around pt-2 mt-2 border-t border-stone-200 dark:border-stone-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  link.isActive
                    ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px]">{link.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Admin Content Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
