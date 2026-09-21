'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-100 dark:bg-stone-950 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 dark:bg-amber-500 text-amber-100 dark:text-stone-950 shadow-lg animate-pulse">
        <Coffee className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-stone-800 dark:text-stone-200">Corner Roastery</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">Opening admin dashboard…</p>
      </div>
    </div>
  );
}
