'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TableQRScreen } from '@/components/TableQRScreen';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tableNumber, setTableNumber] = useState<string>('5');

  useEffect(() => {
    const tableParam = searchParams.get('table') || searchParams.get('t');
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, [searchParams]);

  const handleTableChange = (newTable: string) => {
    setTableNumber(newTable);
    router.replace(`/?table=${encodeURIComponent(newTable)}`);
  };

  const handleOpenMenu = () => {
    router.push(`/order?table=${encodeURIComponent(tableNumber)}`);
  };

  return (
    <TableQRScreen
      tableNumber={tableNumber}
      onTableChange={handleTableChange}
      onOpenMenu={handleOpenMenu}
      showAdminNavigation={false}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-500">Loading Corner Roastery...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
