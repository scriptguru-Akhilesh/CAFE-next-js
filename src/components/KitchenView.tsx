'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Bell,
  BellOff,
  RefreshCw,
  ChefHat,
  Layers,
  Flame,
  CheckCheck,
  Trash2,
  StickyNote,
  Search,
  LayoutGrid,
  ListFilter,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { KitchenOrder, OrderStatus } from '../types';
import { orderStorage } from '../utils/orderStorage';

interface KitchenViewProps {
  onSwitchToCustomer: (table?: string) => void;
  onSwitchToMenuManagement?: () => void;
  variant?: 'standalone' | 'admin';
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  onSwitchToCustomer,
  onSwitchToMenuManagement,
  variant = 'standalone',
}) => {
  const isAdminShell = variant === 'admin';

  const [orders, setOrders] = useState<KitchenOrder[]>(() => orderStorage.getOrders());
  const [loading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'ALL_ACTIVE' | OrderStatus>('ALL_ACTIVE');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const prevOrdersCountRef = useRef<number>(orders.length);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const unlockAudio = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }

      setAudioUnlocked(true);
    } catch {
      // Browser audio policy can prevent autoplay.
    }
  }, []);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;

    try {
      unlockAudio();

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {
      // Ignore browser audio errors.
    }
  }, [soundEnabled, unlockAudio]);

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initialOrders = orderStorage.getOrders();

    setOrders(initialOrders);
    prevOrdersCountRef.current = initialOrders.length;

    const unsubscribe = orderStorage.subscribe((updatedOrders) => {
      setOrders(updatedOrders);
      setLastUpdated(new Date());

      if (
        updatedOrders.length > prevOrdersCountRef.current &&
        prevOrdersCountRef.current > 0
      ) {
        playChime();
      }

      prevOrdersCountRef.current = updatedOrders.length;
    });

    return () => {
      unsubscribe();
    };
  }, [playChime]);

  const refreshOrders = useCallback(() => {
    setOrders(orderStorage.getOrders());
    setLastUpdated(new Date());
  }, []);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    unlockAudio();
    setUpdatingId(orderId);

    orderStorage.updateStatus(orderId, newStatus);
    setOrders(orderStorage.getOrders());
    setUpdatingId(null);
  };

  const handleDismissOrder = async (orderId: string) => {
    unlockAudio();
    setUpdatingId(orderId);

    orderStorage.dismissOrder(orderId);
    setOrders(orderStorage.getOrders());
    prevOrdersCountRef.current = Math.max(
      0,
      prevOrdersCountRef.current - 1,
    );
    setUpdatingId(null);
  };

  const counts = useMemo(() => {
    const p = orders.filter(
      (o) => (o.status || 'Pending') === 'Pending',
    ).length;
    const prep = orders.filter(
      (o) => o.status === 'Preparing',
    ).length;
    const r = orders.filter((o) => o.status === 'Ready').length;
    const s = orders.filter((o) => o.status === 'Served').length;
    const active = p + prep + r;

    return { p, prep, r, s, active };
  }, [orders]);

  const uniqueTables = useMemo(() => {
    const set = new Set<string>();

    orders.forEach((o) => {
      if (o.tableNumber) set.add(o.tableNumber);
    });

    return Array.from(set).sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }

      return a.localeCompare(b);
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status: OrderStatus = order.status || 'Pending';

      if (activeTab === 'ALL_ACTIVE' && status === 'Served') {
        return false;
      }

      if (activeTab !== 'ALL_ACTIVE' && status !== activeTab) {
        return false;
      }

      if (
        tableFilter !== 'ALL' &&
        order.tableNumber !== tableFilter
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();

        const matchTable =
          `table ${order.tableNumber}`.toLowerCase().includes(q) ||
          order.tableNumber.includes(q);

        const matchId = order.id.toLowerCase().includes(q);
        const matchNotes = order.notes
          ? order.notes.toLowerCase().includes(q)
          : false;
        const matchItem = order.items.some((item) =>
          item.name.toLowerCase().includes(q),
        );

        if (!matchTable && !matchId && !matchNotes && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, tableFilter, searchQuery]);

  const getElapsedInfo = (order: KitchenOrder) => {
    const created = order.createdAt || Date.now();
    const minutes = Math.max(
      0,
      Math.floor((nowTime - created) / 60000),
    );
    const isUrgent =
      minutes >= 15 && order.status !== 'Served';
    const isWarning =
      minutes >= 8 &&
      minutes < 15 &&
      order.status !== 'Served';

    return {
      minutes,
      label: minutes < 1 ? 'Just now' : `${minutes}m ago`,
      isUrgent,
      isWarning,
    };
  };

  const statusStyles = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return {
          dot: 'bg-amber-500',
          text: 'text-amber-700 dark:text-amber-400',
          badge:
            'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
          action:
            'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100',
          icon: 'text-amber-600 dark:text-amber-400',
        };
      case 'Preparing':
        return {
          dot: 'bg-zinc-500',
          text: 'text-zinc-700 dark:text-zinc-300',
          badge:
            'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
          action:
            'bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-950 dark:hover:bg-white',
          icon: 'text-zinc-600 dark:text-zinc-300',
        };
      case 'Ready':
        return {
          dot: 'bg-emerald-500',
          text: 'text-emerald-700 dark:text-emerald-400',
          badge:
            'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
          action:
            'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100',
          icon: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'Served':
      default:
        return {
          dot: 'bg-zinc-400',
          text: 'text-zinc-500 dark:text-zinc-400',
          badge:
            'border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
          action:
            'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
          icon: 'text-zinc-500',
        };
    }
  };

  const kitchenToolbarButtons = (
    <>
      <button
        id="kitchen-view-mode-toggle"
        type="button"
        onClick={() =>
          setViewMode(viewMode === 'cards' ? 'compact' : 'cards')
        }
        title={
          viewMode === 'cards'
            ? 'Switch to Compact View'
            : 'Switch to Cards View'
        }
        className="inline-flex h-9 min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-zinc-600 transition-all hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white sm:h-10"
      >
        {viewMode === 'cards' ? (
          <ListFilter className="h-4 w-4" />
        ) : (
          <LayoutGrid className="h-4 w-4" />
        )}
        <span className="hidden text-xs font-bold md:inline">
          {viewMode === 'cards' ? 'Compact' : 'Cards'}
        </span>
      </button>

      <button
        id="kitchen-sound-toggle-btn"
        type="button"
        onClick={() => {
          unlockAudio();
          setSoundEnabled(!soundEnabled);
        }}
        title={
          soundEnabled
            ? 'Order sound alert ON'
            : 'Order sound alert OFF'
        }
        className={`inline-flex h-9 min-h-[38px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all sm:h-10 ${soundEnabled
            ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15'
            : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
      >
        {soundEnabled ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
        <span className="hidden md:inline">
          {soundEnabled ? 'Chime On' : 'Muted'}
        </span>
      </button>

      {!isAdminShell && onSwitchToMenuManagement && (
        <button
          id="kitchen-manage-menu-btn"
          type="button"
          onClick={onSwitchToMenuManagement}
          title="Manage cafe menu items"
          className="inline-flex h-9 min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white sm:h-10"
        >
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">Menu</span>
        </button>
      )}
    </>
  );

  return (
    <div
      id="kitchen-view-page"
      onClick={unlockAudio}
      className={
        isAdminShell
          ? 'select-none pb-6 text-zinc-950 touch-manipulation dark:text-zinc-100'
          : 'min-h-screen select-none bg-zinc-50 pb-28 text-zinc-950 touch-manipulation dark:bg-zinc-950 dark:text-zinc-100'
      }
    >
      {/* Header */}
      <header
        className={
          isAdminShell
            ? 'mb-5 border-b border-zinc-200 pb-5 dark:border-zinc-800'
            : 'sticky top-0 z-30 border-b border-zinc-200 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6 sm:py-4'
        }
      >
        {isAdminShell ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                  Kitchen
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {counts.active} active
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                Kitchen Display
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
                Manage live orders from pending to served.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {kitchenToolbarButtons}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-amber-400 shadow-sm dark:bg-white dark:text-zinc-950">
                <ChefHat className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-black tracking-tight text-zinc-950 dark:text-white sm:text-base md:text-lg">
                    Kitchen Display
                  </h1>

                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {counts.active}
                  </span>
                </div>

                <p className="hidden text-[11px] text-zinc-500 dark:text-zinc-400 md:block">
                  Pending → Preparing → Ready → Served
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {kitchenToolbarButtons}
            </div>
          </div>
        )}
      </header>

      <main
        className={
          isAdminShell
            ? 'space-y-4'
            : 'mx-auto max-w-7xl space-y-5 px-3 pt-4 sm:px-6 sm:pt-6'
        }
      >
        {/* Audio warning */}
        {!audioUnlocked && soundEnabled && (
          <button
            type="button"
            onClick={unlockAudio}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-left text-xs text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Volume2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">
                Enable order chimes on this device.
              </span>
            </span>

            <span className="shrink-0 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-800 dark:text-amber-300">
              Enable
            </span>
          </button>
        )}

        {/* Filters */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-zinc-100 px-2.5 py-2 no-scrollbar dark:border-zinc-900 sm:px-3">
            <button
              id="tab-all-active"
              type="button"
              onClick={() => setActiveTab('ALL_ACTIVE')}
              className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition-all ${activeTab === 'ALL_ACTIVE'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                }`}
            >
              Active
              <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                {counts.active}
              </span>
            </button>

            <button
              id="tab-pending"
              type="button"
              onClick={() => setActiveTab('Pending')}
              className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition-all ${activeTab === 'Pending'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Pending
              <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                {counts.p}
              </span>
            </button>

            <button
              id="tab-preparing"
              type="button"
              onClick={() => setActiveTab('Preparing')}
              className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition-all ${activeTab === 'Preparing'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-950'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Preparing
              <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                {counts.prep}
              </span>
            </button>

            <button
              id="tab-ready"
              type="button"
              onClick={() => setActiveTab('Ready')}
              className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition-all ${activeTab === 'Ready'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-950'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                }`}
            >
              <Bell className="h-3.5 w-3.5" />
              Ready
              <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                {counts.r}
              </span>
            </button>

            <button
              id="tab-served"
              type="button"
              onClick={() => setActiveTab('Served')}
              className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition-all ${activeTab === 'Served'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-950'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                }`}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Served
              <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                {counts.s}
              </span>
            </button>

            <button
              type="button"
              onClick={refreshOrders}
              className="ml-auto inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white"
              title="Refresh orders"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''
                  }`}
              />
              <span className="hidden sm:inline">
                Synced{' '}
                {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-3 p-3 sm:p-3.5 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                id="kds-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search table, order, item, or note..."
                className="min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-9 text-xs font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-900"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Table filters */}
            {uniqueTables.length > 0 && (
              <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setTableFilter('ALL')}
                  className={`min-h-[36px] shrink-0 rounded-lg border px-3 text-[10px] font-black transition-all ${tableFilter === 'ALL'
                      ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
                    }`}
                >
                  All Tables
                </button>

                {uniqueTables.map((table) => (
                  <button
                    key={table}
                    type="button"
                    onClick={() => setTableFilter(table)}
                    className={`min-h-[36px] shrink-0 rounded-lg border px-3 text-[10px] font-black transition-all ${tableFilter === table
                        ? 'border-amber-500 bg-amber-500 text-zinc-950'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
                      }`}
                  >
                    T-{table}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Loading */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-20 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <RefreshCw className="h-7 w-7 animate-spin text-amber-500" />
            <p className="mt-3 text-sm">
              Connecting to kitchen feed...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty */
          <div
            id="kitchen-empty-state"
            className="flex min-h-[340px] flex-col items-center justify-center rounded-[26px] border border-dashed border-zinc-300 bg-white px-5 text-center dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-black tracking-tight text-zinc-950 dark:text-white sm:text-xl">
              {searchQuery || tableFilter !== 'ALL'
                ? 'No orders match this filter'
                : activeTab === 'ALL_ACTIVE'
                  ? 'No active orders'
                  : `No ${activeTab} orders`}
            </h2>

            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">
              {searchQuery || tableFilter !== 'ALL'
                ? 'Try clearing the search or table filter.'
                : 'New customer orders will appear here automatically.'}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(searchQuery || tableFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTableFilter('ALL');
                  }}
                  className="min-h-[42px] rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Clear Filters
                </button>
              )}

              <button
                type="button"
                onClick={() => onSwitchToCustomer('5')}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-black text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Simulate Order
              </button>
            </div>
          </div>
        ) : viewMode === 'compact' ? (
          /* Compact list */
          <div id="kitchen-compact-list" className="space-y-3">
            {filteredOrders.map((order) => {
              const status: OrderStatus =
                order.status || 'Pending';
              const isUpdating = updatingId === order.id;
              const elapsed = getElapsedInfo(order);
              const palette = statusStyles(status);

              return (
                <div
                  key={order.id}
                  id={`kitchen-order-compact-${order.id}`}
                  className={`rounded-2xl border bg-white p-3.5 shadow-sm transition-all dark:bg-zinc-950 sm:p-4 ${status === 'Served'
                      ? 'border-zinc-200 opacity-75 dark:border-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                >
                  <div className="flex flex-col gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-lg font-black tracking-tight text-zinc-950 dark:text-white sm:text-xl">
                          Table {order.tableNumber}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400">
                          #{order.id}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-zinc-400" />
                        <span
                          className={`text-[10px] font-bold ${elapsed.isUrgent
                              ? 'text-rose-600 dark:text-rose-400'
                              : elapsed.isWarning
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-zinc-400'
                            }`}
                        >
                          {elapsed.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${palette.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${palette.dot}`}
                        />
                        {status}
                      </span>

                      <span className="font-mono text-sm font-black text-zinc-950 dark:text-white">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                      <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <div>
                        <span className="font-black text-zinc-800 dark:text-zinc-200">
                          Note:{' '}
                        </span>
                        <span>{order.notes}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 py-3">
                    {order.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                          {item.quantity}×
                        </span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {item.name}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(order.id, 'Preparing')
                        }
                        disabled={isUpdating}
                        className={`min-h-[44px] flex-1 rounded-xl px-4 text-xs font-black transition-all disabled:opacity-50 ${palette.action}`}
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Flame className="h-4 w-4" />
                          Start Preparing
                        </span>
                      </button>
                    )}

                    {status === 'Preparing' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(order.id, 'Ready')
                        }
                        disabled={isUpdating}
                        className={`min-h-[44px] flex-1 rounded-xl px-4 text-xs font-black transition-all disabled:opacity-50 ${palette.action}`}
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Bell className="h-4 w-4" />
                          Mark Ready
                        </span>
                      </button>
                    )}

                    {status === 'Ready' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(order.id, 'Served')
                        }
                        disabled={isUpdating}
                        className={`min-h-[44px] flex-1 rounded-xl px-4 text-xs font-black transition-all disabled:opacity-50 ${palette.action}`}
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <CheckCheck className="h-4 w-4" />
                          Mark Served
                        </span>
                      </button>
                    )}

                    {status === 'Served' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDismissOrder(order.id)
                        }
                        disabled={isUpdating}
                        className="min-h-[44px] flex-1 rounded-xl bg-zinc-100 px-4 text-xs font-black text-zinc-700 transition-all hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Trash2 className="h-3.5 w-3.5" />
                          Dismiss
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Cards */
          <div
            id="kitchen-orders-grid"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredOrders.map((order) => {
              const status: OrderStatus =
                order.status || 'Pending';
              const isUpdating = updatingId === order.id;
              const elapsed = getElapsedInfo(order);
              const palette = statusStyles(status);

              return (
                <article
                  key={order.id}
                  id={`kitchen-order-${order.id}`}
                  className={`group relative flex flex-col overflow-hidden rounded-[24px] border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-zinc-950 ${status === 'Served'
                      ? 'border-zinc-200 opacity-75 dark:border-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                >
                  {/* Minimal status accent */}
                  <div
                    className={`h-1 w-full ${status === 'Pending'
                        ? 'bg-amber-500'
                        : status === 'Ready'
                          ? 'bg-emerald-500'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                  />

                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    {/* Order top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                            Table {order.tableNumber}
                          </h2>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                          <span>Order #{order.id}</span>
                          <span>•</span>
                          <span>{order.timestamp}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[10px] font-bold ${elapsed.isUrgent
                              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                              : elapsed.isWarning
                                ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
                                : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                            }`}
                        >
                          <Clock className="h-3 w-3" />
                          {elapsed.label}
                        </div>

                        <div
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${palette.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${palette.dot}`}
                          />
                          {status}
                        </div>
                      </div>
                    </div>

                    {/* Note */}
                    {order.notes && (
                      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm dark:bg-zinc-950 dark:text-amber-400">
                          <StickyNote className="h-3.5 w-3.5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                            Customer note
                          </p>
                          <p className="mt-0.5 text-xs font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {order.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="mt-4 flex-1 space-y-1">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2.5 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-900"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-9 w-9 shrink-0 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-9 w-9 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
                          )}

                          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 px-1.5 text-[11px] font-black text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                            {item.quantity}×
                          </span>

                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            {item.name}
                          </span>

                          <span className="shrink-0 font-mono text-[10px] font-semibold text-zinc-400">
                            ₹
                            {(
                              item.price * item.quantity
                            ).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-900">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                        Total
                      </span>

                      <span className="font-mono text-base font-black text-zinc-950 dark:text-white">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Primary action */}
                    <div className="mt-3">
                      {status === 'Pending' && (
                        <button
                          id={`btn-prep-${order.id}`}
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(
                              order.id,
                              'Preparing',
                            )
                          }
                          disabled={isUpdating}
                          className={`flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl text-xs font-black shadow-sm transition-all hover:shadow-md active:scale-[0.99] disabled:opacity-50 ${palette.action}`}
                        >
                          <Flame className="h-4 w-4" />
                          Start Preparing
                        </button>
                      )}

                      {status === 'Preparing' && (
                        <button
                          id={`btn-ready-${order.id}`}
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(order.id, 'Ready')
                          }
                          disabled={isUpdating}
                          className={`flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl text-xs font-black shadow-sm transition-all hover:shadow-md active:scale-[0.99] disabled:opacity-50 ${palette.action}`}
                        >
                          <Bell className="h-4 w-4" />
                          Mark as Ready
                        </button>
                      )}

                      {status === 'Ready' && (
                        <button
                          id={`btn-served-${order.id}`}
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(
                              order.id,
                              'Served',
                            )
                          }
                          disabled={isUpdating}
                          className={`flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl text-xs font-black shadow-sm transition-all hover:shadow-md active:scale-[0.99] disabled:opacity-50 ${palette.action}`}
                        >
                          <CheckCheck className="h-4 w-4" />
                          Mark as Served
                        </button>
                      )}

                      {status === 'Served' && (
                        <button
                          id={`btn-dismiss-${order.id}`}
                          type="button"
                          onClick={() =>
                            handleDismissOrder(order.id)
                          }
                          disabled={isUpdating}
                          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-xs font-black text-zinc-700 transition-all hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <Trash2 className="h-4 w-4 text-zinc-400" />
                          Archive / Dismiss
                        </button>
                      )}
                    </div>

                    {/* Quick status jump */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between px-0.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">
                          Status
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wide ${palette.text}`}>
                          {status}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                        {(
                          [
                            'Pending',
                            'Preparing',
                            'Ready',
                            'Served',
                          ] as OrderStatus[]
                        ).map((stage) => {
                          const isActive = status === stage;

                          return (
                            <button
                              key={stage}
                              id={`quick-jump-${order.id}-${stage.toLowerCase()}`}
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(
                                  order.id,
                                  stage,
                                )
                              }
                              disabled={isUpdating || isActive}
                              className={`min-h-[34px] rounded-lg px-1 text-[9px] font-black transition-all ${isActive
                                  ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white'
                                  : 'text-zinc-400 hover:bg-white hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                                }`}
                            >
                              {stage}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
