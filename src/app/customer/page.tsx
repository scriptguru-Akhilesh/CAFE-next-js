'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CustomerRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const table = searchParams.get('table') || '5';
    router.replace(`/order?table=${encodeURIComponent(table)}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-500">
      Redirecting to Customer Order...
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-500">Loading...</div>}>
      <CustomerRedirectContent />
    </Suspense>
  );
}
