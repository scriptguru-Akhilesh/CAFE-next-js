'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MenuManagement } from '@/components/MenuManagement';

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="py-2">
      <MenuManagement
        onBackToMenu={(table) => {
          router.push(table ? `/order?table=${encodeURIComponent(table)}` : '/order');
        }}
        onSwitchToKitchen={() => {
          router.push('/admin/kitchen');
        }}
        onOpenQRStand={(table) => {
          router.push(table ? `/?table=${encodeURIComponent(table)}` : '/');
        }}
        initialTab="menu"
      />
    </div>
  );
}
