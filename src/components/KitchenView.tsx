'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  CheckCircle2, Clock, UtensilsCrossed, Bell, BellOff,
  ArrowLeft, RefreshCw, ChefHat, Layers,
  Flame, CheckCheck, Trash2, StickyNote,
  Search, LayoutGrid, ListFilter, AlertCircle,
  Volume2
} from 'lucide-react';
import { KitchenOrder, OrderStatus } from '../types';
import { orderStorage } from '../utils/orderStorage';
import { ThemeToggle } from './ThemeToggle';

interface KitchenViewProps {
  onSwitchToCustomer: (table?: string) => void;
  onSwitchToMenuManagement?: () => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  onSwitchToCustomer,
  onSwitchToMenuManagement,
}) => {
  // Always initialize from orderStorage (instant load, never blank)
  const [orders, setOrders] = useState<KitchenOrder[]>(() => orderStorage.getOrders());
  const [loading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'ALL_ACTIVE' | OrderStatus>('ALL_ACTIVE');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  const prevOrdersCountRef = useRef<number>(orders.length);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize/unlock Web Audio on user touch for mobile browsers (iOS Safari/Android)
  const unlockAudio = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioUnlocked(true);
    } catch {
      // Audio autoplay policy catch
    }
  }, []);

  // Synthesize pleasant kitchen order alert chime
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
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {
      // Audio autoplay policy ignored
    }
  }, [soundEnabled, unlockAudio]);

  // Keep live elapsed time fresh every 30s
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Real-time browser storage subscription
  useEffect(() => {
    const initialOrders = orderStorage.getOrders();
    setOrders(initialOrders);
    prevOrdersCountRef.current = initialOrders.length;

    const unsubscribe = orderStorage.subscribe((updatedOrders) => {
      setOrders(updatedOrders);
      setLastUpdated(new Date());
      if (updatedOrders.length > prevOrdersCountRef.current && prevOrdersCountRef.current > 0) {
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

  // Update order status (Pending -> Preparing -> Ready -> Served)
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    unlockAudio();
    setUpdatingId(orderId);

    orderStorage.updateStatus(orderId, newStatus);
    setOrders(orderStorage.getOrders());
    setUpdatingId(null);
  };

  // Remove / archive order
  const handleDismissOrder = async (orderId: string) => {
    unlockAudio();
    setUpdatingId(orderId);

    orderStorage.dismissOrder(orderId);
    setOrders(orderStorage.getOrders());
    prevOrdersCountRef.current = Math.max(0, prevOrdersCountRef.current - 1);
    setUpdatingId(null);
  };

  // Stage counts for badges
  const counts = useMemo(() => {
    const p = orders.filter((o) => (o.status || 'Pending') === 'Pending').length;
    const prep = orders.filter((o) => o.status === 'Preparing').length;
    const r = orders.filter((o) => o.status === 'Ready').length;
    const s = orders.filter((o) => o.status === 'Served').length;
    const active = p + prep + r;
    return { p, prep, r, s, active };
  }, [orders]);

  // Available unique table numbers
  const uniqueTables = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.tableNumber) set.add(o.tableNumber);
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [orders]);

  // Filtered orders according to stage tab, table filter, and search text
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status: OrderStatus = order.status || 'Pending';

      // Stage filter
      if (activeTab === 'ALL_ACTIVE' && status === 'Served') return false;
      if (activeTab !== 'ALL_ACTIVE' && status !== activeTab) return false;

      // Table filter
      if (tableFilter !== 'ALL' && order.tableNumber !== tableFilter) return false;

      // Search query (table number, order id, item name, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTable = `table ${order.tableNumber}`.toLowerCase().includes(q) || order.tableNumber.includes(q);
        const matchId = order.id.toLowerCase().includes(q);
        const matchNotes = order.notes ? order.notes.toLowerCase().includes(q) : false;
        const matchItem = order.items.some((it) => it.name.toLowerCase().includes(q));
        if (!matchTable && !matchId && !matchNotes && !matchItem) return false;
      }

      return true;
    });
  }, [orders, activeTab, tableFilter, searchQuery]);

  // Helper for calculating elapsed waiting minutes
  const getElapsedInfo = (order: KitchenOrder) => {
    const created = order.createdAt || Date.now();
    const minutes = Math.max(0, Math.floor((nowTime - created) / 60000));
    const isUrgent = minutes >= 15 && order.status !== 'Served';
    const isWarning = minutes >= 8 && minutes < 15 && order.status !== 'Served';
    return {
      minutes,
      label: minutes < 1 ? 'Just now' : `${minutes}m ago`,
      isUrgent,
      isWarning,
    };
  };

  return (
    <div
      id="kitchen-view-page"
      onClick={unlockAudio}
      className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-900 dark:text-stone-100 pb-28 select-none touch-manipulation transition-colors duration-200"
    >
      {/* Kitchen Display Top Header - Mobile Optimized */}
      <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-md transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">

          {/* Brand & Live indicator */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
              <ChefHat className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-stone-900 dark:text-stone-900 dark:text-white truncate">
                  <span className="hidden xs:inline sm:inline">Kitchen Display</span>
                  <span className="xs:hidden sm:hidden">KDS</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{counts.active} Active</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden md:block">
                Staff updates: Pending → Preparing → Ready → Served
              </p>
            </div>
          </div>

          {/* Action buttons (Touch-Friendly) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* View Mode Toggle: Cards vs Compact */}
            <button
              id="kitchen-view-mode-toggle"
              onClick={() => setViewMode(viewMode === 'cards' ? 'compact' : 'cards')}
              title={viewMode === 'cards' ? 'Switch to Compact View' : 'Switch to Cards View'}
              className="flex items-center justify-center h-9 sm:h-10 px-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors min-h-[38px]"
            >
              {viewMode === 'cards' ? (
                <ListFilter className="h-4 w-4 text-amber-400" />
              ) : (
                <LayoutGrid className="h-4 w-4 text-amber-400" />
              )}
              <span className="hidden lg:inline ml-1.5 text-xs font-semibold">
                {viewMode === 'cards' ? 'Compact' : 'Cards'}
              </span>
            </button>

            {/* Chime toggle */}
            <button
              id="kitchen-sound-toggle-btn"
              onClick={() => {
                unlockAudio();
                setSoundEnabled(!soundEnabled);
              }}
              title={soundEnabled ? 'Order sound alert ON' : 'Order sound alert OFF'}
              className={`flex items-center justify-center h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition-all min-h-[38px] ${soundEnabled
                ? 'border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
            >
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              <span className="hidden md:inline ml-1.5">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            {/* Owner Menu Management */}
            {onSwitchToMenuManagement && (
              <button
                id="kitchen-manage-menu-btn"
                onClick={onSwitchToMenuManagement}
                title="Manage cafe menu items"
                className="flex items-center justify-center h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors min-h-[38px]"
              >
                <Layers className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline ml-1.5">Menu</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Kitchen Display Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">

        {/* Mobile Audio Warning Banner (if browser blocked sound autoplay) */}
        {!audioUnlocked && soundEnabled && (
          <div
            onClick={unlockAudio}
            className="mb-4 flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Volume2 className="h-4 w-4 shrink-0 text-amber-400 animate-bounce" />
              <span className="truncate">Tap here to enable audible order chimes for mobile</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[11px] font-bold shrink-0">
              Enable Sound
            </span>
          </div>
        )}

        {/* Stage Filter Navigation Tabs - Horizontally Scrollable on Mobile */}
        <div className="pb-3 sm:pb-4 border-b border-stone-200 dark:border-stone-800 space-y-3 mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-2">

            {/* Scrollable Stage Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 w-full max-w-full">
              {/* ALL ACTIVE */}
              <button
                id="tab-all-active"
                onClick={() => setActiveTab('ALL_ACTIVE')}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${activeTab === 'ALL_ACTIVE'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                  : 'bg-stone-200 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
              >
                <span>Active</span>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${activeTab === 'ALL_ACTIVE'
                    ? 'bg-stone-300 text-stone-900 dark:bg-stone-700 dark:text-stone-200'
                    : 'bg-stone-300 text-stone-600 dark:bg-stone-700 dark:text-stone-300'
                    }`}
                >
                  {counts.active}
                </span>
              </button>

              {/* PENDING */}
              <button
                id="tab-pending"
                onClick={() => setActiveTab('Pending')}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${activeTab === 'Pending'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-200 dark:bg-stone-800/80 text-amber-700 dark:text-amber-300 hover:bg-stone-300 dark:hover:bg-stone-800 hover:text-amber-800 dark:hover:text-amber-200'
                  }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Pending</span>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${activeTab === 'Pending'
                    ? 'bg-stone-900 text-amber-400 dark:bg-stone-950 dark:text-amber-400'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                >
                  {counts.p}
                </span>
              </button>

              {/* PREPARING */}
              <button
                id="tab-preparing"
                onClick={() => setActiveTab('Preparing')}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${activeTab === 'Preparing'
                  ? 'bg-sky-500 text-stone-950 shadow-sm'
                  : 'bg-stone-200 dark:bg-stone-800/80 text-sky-700 dark:text-sky-300 hover:bg-stone-300 dark:hover:bg-stone-800 hover:text-sky-800 dark:hover:text-sky-200'
                  }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Preparing</span>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${activeTab === 'Preparing'
                    ? 'bg-stone-900 text-sky-400 dark:bg-stone-950 dark:text-sky-400'
                    : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                    }`}
                >
                  {counts.prep}
                </span>
              </button>

              {/* READY */}
              <button
                id="tab-ready"
                onClick={() => setActiveTab('Ready')}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${activeTab === 'Ready'
                  ? 'bg-emerald-500 text-stone-950 shadow-sm'
                  : 'bg-stone-200 dark:bg-stone-800/80 text-emerald-700 dark:text-emerald-300 hover:bg-stone-300 dark:hover:bg-stone-800 hover:text-emerald-800 dark:hover:text-emerald-200'
                  }`}
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Ready</span>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${activeTab === 'Ready'
                    ? 'bg-stone-900 text-emerald-400 dark:bg-stone-950 dark:text-emerald-400'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    }`}
                >
                  {counts.r}
                </span>
              </button>

              {/* SERVED */}
              <button
                id="tab-served"
                onClick={() => setActiveTab('Served')}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${activeTab === 'Served'
                  ? 'bg-purple-500 text-stone-950 shadow-sm'
                  : 'bg-stone-200 dark:bg-stone-800/80 text-purple-700 dark:text-purple-300 hover:bg-stone-300 dark:hover:bg-stone-800 hover:text-purple-800 dark:hover:text-purple-200'
                  }`}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Served</span>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${activeTab === 'Served'
                    ? 'bg-stone-900 text-purple-400 dark:bg-stone-950 dark:text-purple-400'
                    : 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                    }`}
                >
                  {counts.s}
                </span>
              </button>
            </div>

            {/* Quick Refresh Status */}
            <button
              onClick={refreshOrders}
              className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-900 dark:text-white transition-colors shrink-0 p-1.5"
              title="Tap to refresh orders"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">
                Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>
          </div>

          {/* Quick Filter Strip: Search and Table Numbers on Mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 dark:text-stone-400 dark:text-stone-500" />
              <input
                id="kds-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search table, item, or note..."
                className="w-full bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 dark:text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-400/60 transition-colors min-h-[38px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-900 dark:text-white text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Table Number Filter Pills */}
            {uniqueTables.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setTableFilter('ALL')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap min-h-[36px] ${tableFilter === 'ALL'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-stone-200 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-800 border border-transparent'
                    }`}
                >
                  All Tables
                </button>
                {uniqueTables.map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => setTableFilter(tbl)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap min-h-[36px] ${tableFilter === tbl
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'bg-stone-200 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 border border-transparent'
                      }`}
                  >
                    T-{tbl}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-500 dark:text-stone-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-sm">Connecting to live kitchen feed...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div
            id="kitchen-empty-state"
            className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-stone-200 dark:border-stone-800/80 bg-white/70 dark:bg-stone-950/40 transition-colors"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-900 dark:text-white tracking-tight">
              {searchQuery || tableFilter !== 'ALL'
                ? 'No orders match this filter'
                : activeTab === 'ALL_ACTIVE'
                  ? 'No active orders in kitchen queue'
                  : `No ${activeTab} orders`}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mt-1.5">
              {searchQuery || tableFilter !== 'ALL'
                ? 'Try resetting the search or table filter.'
                : 'When a customer places an order from their table QR, it will appear here instantly.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {(searchQuery || tableFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTableFilter('ALL');
                  }}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => onSwitchToCustomer('5')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-colors shadow-sm min-h-[42px]"
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
                <span>Simulate Order (Table 5)</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'compact' ? (
          /* Compact Expedite List View for High-Volume Mobile Screens */
          <div id="kitchen-compact-list" className="space-y-3">
            {filteredOrders.map((order) => {
              const status: OrderStatus = order.status || 'Pending';
              const isUpdating = updatingId === order.id;
              const elapsed = getElapsedInfo(order);

              return (
                <div
                  key={order.id}
                  id={`kitchen-order-compact-${order.id}`}
                  className={`rounded-2xl border bg-white dark:bg-white dark:bg-stone-900/95 p-3.5 sm:p-4 shadow-md transition-all ${status === 'Pending'
                    ? 'border-amber-500/60 ring-1 ring-amber-500/20'
                    : status === 'Preparing'
                      ? 'border-sky-500/60 ring-1 ring-sky-500/20'
                      : status === 'Ready'
                        ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                        : 'border-stone-200 dark:border-stone-700/80 opacity-80'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-200 dark:border-stone-700/60">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-900 dark:text-white">
                          Table {order.tableNumber}
                        </span>
                        <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                          #{order.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${elapsed.isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : elapsed.isWarning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                          }`}>
                          <Clock className="inline h-3 w-3 mr-1" />
                          {elapsed.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      {/* Status Tag */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'Pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : status === 'Preparing'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : status === 'Ready'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        }`}>
                        {status}
                      </span>

                      <span className="font-mono text-sm font-bold text-stone-900 dark:text-stone-900 dark:text-white">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Customer Instructions */}
                  {order.notes && (
                    <div className="my-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-200">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Note: </span>
                        <span>{order.notes}</span>
                      </div>
                    </div>
                  )}

                  {/* Condensed Items */}
                  <div className="py-2 flex flex-wrap gap-1.5">
                    {order.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80 px-2 py-1 rounded-lg text-xs"
                      >
                        <span className="font-mono font-bold text-amber-400">{it.quantity}×</span>
                        <span className="text-stone-700 dark:text-stone-700 dark:text-stone-200">{it.name}</span>
                      </span>
                    ))}
                  </div>

                  {/* Compact Quick Actions */}
                  <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center gap-2">
                    {status === 'Pending' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                        disabled={isUpdating}
                        className="flex-1 min-h-[46px] flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 font-bold text-xs sm:text-sm  dark:text-white hover:bg-sky-500 active:scale-98"
                      >
                        <Flame className="h-4 w-4" />
                        <span>Start Preparing</span>
                      </button>
                    )}
                    {status === 'Preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Ready')}
                        disabled={isUpdating}
                        className="flex-1 min-h-[46px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-xs sm:text-sm text-stone-900 dark:text-white hover:bg-emerald-500 active:scale-98"
                      >
                        <Bell className="h-4 w-4" />
                        <span>Mark Ready</span>
                      </button>
                    )}
                    {status === 'Ready' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Served')}
                        disabled={isUpdating}
                        className="flex-1 min-h-[46px] flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 font-bold text-xs sm:text-sm text-stone-900 dark:text-white hover:bg-purple-500 active:scale-98"
                      >
                        <CheckCheck className="h-4 w-4" />
                        <span>Mark Served</span>
                      </button>
                    )}
                    {status === 'Served' && (
                      <button
                        onClick={() => handleDismissOrder(order.id)}
                        disabled={isUpdating}
                        className="flex-1 min-h-[46px] flex items-center justify-center gap-1.5 rounded-xl bg-stone-200 dark:bg-stone-700 px-4 py-2.5 font-bold text-xs text-stone-800 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 active:scale-98"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Dismiss</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Cards View - Fully Responsive Grid */
          <div
            id="kitchen-orders-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5"
          >
            {filteredOrders.map((order) => {
              const status: OrderStatus = order.status || 'Pending';
              const isUpdating = updatingId === order.id;
              const elapsed = getElapsedInfo(order);

              return (
                <div
                  key={order.id}
                  id={`kitchen-order-${order.id}`}
                  className={`flex flex-col justify-between rounded-2xl border bg-white  dark:bg-stone-900/95 p-4 sm:p-5 shadow-xl transition-colors duration-200 transition-all relative overflow-hidden ${status === 'Pending'
                    ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                    : status === 'Preparing'
                      ? 'border-sky-500/60 ring-1 ring-sky-500/30'
                      : status === 'Ready'
                        ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'border-stone-200 dark:border-stone-700/80 opacity-85'
                    }`}
                >
                  {/* Top Bar: Table Number, Wait Timer & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-700/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-900 dark:text-white">
                            Table {order.tableNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">
                          <span>Order #{order.id}</span>
                          <span>•</span>
                          <span>{order.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Elapsed Timer Tag */}
                        <div className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg border font-semibold ${elapsed.isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : elapsed.isWarning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                          }`}>
                          <Clock className="h-3 w-3" />
                          <span>{elapsed.label}</span>
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'Pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : status === 'Preparing'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : status === 'Ready'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status === 'Pending'
                            ? 'bg-amber-400 animate-pulse'
                            : status === 'Preparing'
                              ? 'bg-sky-400 animate-pulse'
                              : status === 'Ready'
                                ? 'bg-emerald-400'
                                : 'bg-purple-400'
                            }`} />
                          <span>{status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Instructions / Allergies Alert */}
                    {order.notes && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-200">
                        <StickyNote className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-300">Customer Note: </span>
                          <span className="font-medium text-amber-100">{order.notes}</span>
                        </div>
                      </div>
                    )}

                    {/* Order Items List (High Legibility for Mobile) */}
                    <div className="py-3 space-y-2.5">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm py-1 border-b border-stone-200 dark:border-stone-200 dark:border-stone-700/30 last:border-0"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover border border-stone-200 dark:border-stone-300 dark:border-stone-700 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-stone-200 dark:bg-stone-200 dark:bg-stone-700/90 text-stone-900 dark:text-stone-900 dark:text-white font-mono font-black text-xs sm:text-sm">
                              {item.quantity}×
                            </span>
                            <span className="font-bold text-stone-900 dark:text-stone-100 truncate text-sm">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-stone-500 dark:text-stone-400 shrink-0">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Multi-Stage Controls (Mobile Touch Optimized) */}
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-700/60 space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-stone-500 dark:text-stone-400">Total Bill</span>
                      <span className="text-sm sm:text-base font-black text-stone-900 dark:text-stone-900 dark:text-white">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Stage Progression Primary Button (Minimum 48px Touch Target) */}
                    {status === 'Pending' && (
                      <button
                        id={`btn-prep-${order.id}`}
                        onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                        disabled={isUpdating}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 text-white font-black text-sm hover:bg-sky-500 active:scale-98 transition-all shadow-md hover:shadow-sky-600/20 disabled:opacity-50"
                      >
                        <Flame className="h-4 w-4" />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {status === 'Preparing' && (
                      <button
                        id={`btn-ready-${order.id}`}
                        onClick={() => handleUpdateStatus(order.id, 'Ready')}
                        disabled={isUpdating}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-stone-900 dark:text-white font-black text-sm hover:bg-emerald-500 active:scale-98 transition-all shadow-md hover:shadow-emerald-600/20 disabled:opacity-50"
                      >
                        <Bell className="h-4 w-4" />
                        <span>Mark as Ready</span>
                      </button>
                    )}

                    {status === 'Ready' && (
                      <button
                        id={`btn-served-${order.id}`}
                        onClick={() => handleUpdateStatus(order.id, 'Served')}
                        disabled={isUpdating}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 text-stone-900 dark:text-white font-black text-sm hover:bg-purple-500 active:scale-98 transition-all shadow-md hover:shadow-purple-600/20 disabled:opacity-50"
                      >
                        <CheckCheck className="h-4 w-4" />
                        <span>Mark as Served</span>
                      </button>
                    )}

                    {status === 'Served' && (
                      <button
                        id={`btn-dismiss-${order.id}`}
                        onClick={() => handleDismissOrder(order.id)}
                        disabled={isUpdating}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-700 dark:text-stone-200 font-bold text-sm hover:bg-stone-300 dark:hover:bg-stone-600 active:scale-98 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                        <span>Archive / Dismiss</span>
                      </button>
                    )}

                    {/* Segmented Stage Quick-Jump Bar for Mobile Fingers */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-0.5">
                        <span>Direct Status Jump:</span>
                        <span>{status}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                        {(['Pending', 'Preparing', 'Ready', 'Served'] as OrderStatus[]).map((st) => {
                          const isActive = status === st;
                          return (
                            <button
                              key={st}
                              id={`quick-jump-${order.id}-${st.toLowerCase()}`}
                              onClick={() => handleUpdateStatus(order.id, st)}
                              disabled={isUpdating || isActive}
                              className={`min-h-[38px] py-1 px-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center ${isActive
                                ? 'bg-stone-900 dark:bg-stone-200 text-stone-900 text-white dark:text-black font-black shadow-xs cursor-default'
                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800'
                                }`}
                            >
                              <span>{st}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
