'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KitchenView } from '@/components/KitchenView';

export default function AdminKitchenPage() {
  const router = useRouter();

  return (
    <KitchenView
      variant="admin"
      onSwitchToCustomer={(table) => {
        router.push(table ? `/order?table=${encodeURIComponent(table)}` : '/order');
      }}
      onSwitchToMenuManagement={() => {
        router.push('/admin');
      }}
    />
  );
}
