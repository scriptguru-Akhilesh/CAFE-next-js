'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MenuManagement } from '@/components/MenuManagement';

export default function AdminTablesPage() {
  const router = useRouter();

  return (
    <MenuManagement
      variant="admin"
      onBackToMenu={(table) => {
        router.push(table ? `/order?table=${encodeURIComponent(table)}` : '/order');
      }}
      onSwitchToKitchen={() => {
        router.push('/admin/kitchen');
      }}
      onOpenQRStand={(table) => {
        router.push(table ? `/qr?table=${encodeURIComponent(table)}` : '/qr');
      }}
      initialTab="tables"
    />
  );
}
