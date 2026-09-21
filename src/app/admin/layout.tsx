'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Coffee, Layers, QrCode, UtensilsCrossed,
  LogOut, ExternalLink,
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

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isLoginPage) {
        router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (isAuthenticated && user?.role === 'platform' && !isLoginPage) {
        router.replace('/platform/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, isLoginPage, pathname, router, user]);

  if (isLoginPage) {
    return <>{children}</>;
  }

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
      label: 'Tables & QR',
      href: '/admin/tables',
      icon: QrCode,
      isActive: pathname === '/admin/tables',
    },
    {
      label: 'Kitchen (KDS)',
      href: '/admin/kitchen',
      icon: UtensilsCrossed,
      isActive: pathname === '/admin/kitchen',
    },
  ];

  return (
    <div id="admin-portal" className="min-h-screen bg-stone-100/80 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-2.5 min-h-[56px]">
            <Link href="/admin" className="flex items-center gap-2.5 group shrink-0 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500 text-amber-100 dark:text-stone-950 shadow-sm group-hover:scale-105 transition-transform">
                <Coffee className="h-4 w-4" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-stone-900 dark:text-white tracking-tight truncate">
                    Corner Roastery
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                    Admin
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 block font-medium truncate">
                  {user?.email || 'Management Hub'}
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 bg-stone-100 dark:bg-stone-950 p-1 rounded-2xl border border-stone-200 dark:border-stone-800 shrink-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${link.isActive
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-amber-400 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-900'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                href="/qr"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Open table QR stand"
              >
                <QrCode className="h-3.5 w-3.5 text-stone-400" />
                <span>QR Stand</span>
              </Link>

              <Link
                href="/order"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Open customer menu in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                <span className="hidden sm:inline">Customer Menu</span>
              </Link>

              <ThemeToggle className="dark:bg-stone-900 dark:border-stone-800" />

              <button
                id="admin-logout-btn"
                onClick={logout}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                title="Sign out of admin portal"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          <nav className="flex lg:hidden items-center justify-between gap-1 pb-2.5 border-t border-stone-100 dark:border-stone-800 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition-all min-w-0 ${link.isActive
                      ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950'
                      : 'text-stone-600 dark:text-stone-400'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{link.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full min-w-0">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
