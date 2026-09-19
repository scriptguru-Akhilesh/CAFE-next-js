'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerOrderPage } from '@/components/CustomerOrderPage';

function OrderPageContent() {
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
    router.replace(`/order?table=${encodeURIComponent(newTable)}`);
  };

  const handleBackToQR = () => {
    router.push(`/?table=${encodeURIComponent(tableNumber)}`);
  };

  return (
    <CustomerOrderPage
      tableNumber={tableNumber}
      onTableChange={handleTableChange}
      onBackToQR={handleBackToQR}
      showAdminNavigation={false}
    />
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-500">Loading digital menu...</div>}>
      <OrderPageContent />
    </Suspense>
  );
}
