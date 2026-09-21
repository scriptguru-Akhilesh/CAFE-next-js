'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, CheckCircle2, Plus, Minus, Coffee,
  UtensilsCrossed, Sparkles, QrCode, Search, Clock, ChevronRight,
  Layers, StickyNote, X, Leaf, Flame, Star
} from 'lucide-react';
import { SimpleOrderItem, SimpleMenuItem, OrderStatus, KitchenOrder, CafeTable } from '../types';
import { OrderStatusTracker } from './OrderStatusTracker';
import { DishDetailSheet } from './DishDetailSheet';
import { CartReviewDrawer } from './CartReviewDrawer';
import { menuStorage } from '../utils/menuStorage';
import { orderStorage } from '../utils/orderStorage';
import { tableStorage } from '../utils/tableStorage';
import { ThemeToggle } from './ThemeToggle';

interface CustomerOrderPageProps {
  tableNumber: string;
  onTableChange: (newTable: string) => void;
  onSwitchToKitchen?: () => void;
  onBackToQR?: () => void;
  onSwitchToMenuManagement?: () => void;
  showAdminNavigation?: boolean;
}

export const CustomerOrderPage: React.FC<CustomerOrderPageProps> = ({
  tableNumber,
  onTableChange,
  onSwitchToKitchen,
  onBackToQR,
  onSwitchToMenuManagement,
  showAdminNavigation = false,
}) => {
  // Menu items loaded dynamically from local static seed + browser storage
  const [menuList, setMenuList] = useState<SimpleMenuItem[]>(() => menuStorage.getMenu());
  const [tables, setTables] = useState<CafeTable[]>(() => tableStorage.getTables());

  // Cart state: map of item id -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg' | 'bestseller'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [showNotesInput, setShowNotesInput] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedDishDetail, setSelectedDishDetail] = useState<SimpleMenuItem | null>(null);

  const [orderConfirmed, setOrderConfirmed] = useState<{
    orderId: string;
    items: SimpleOrderItem[];
    total: number;
    timestamp: string;
    table: string;
    notes?: string;
    status: OrderStatus;
  } | null>(null);

  // Check if this table has an active order in progress
  const [tableActiveOrder, setTableActiveOrder] = useState<KitchenOrder | null>(() => {
    const orders = orderStorage.getOrders();
    return orders.find((o) => o.tableNumber === tableNumber && o.status !== 'Served') || null;
  });

  // Subscribe to dynamic tables
  useEffect(() => {
    const unsub = tableStorage.subscribe((allTables) => {
      setTables(allTables);
    });
    return unsub;
  }, []);

  // Sync menu and orders from local browser storage
  useEffect(() => {
    const unsubscribeMenu = menuStorage.subscribe((updated) => {
      setMenuList(updated);
    });

    const unsubscribeOrders = orderStorage.subscribe((allOrders) => {
      const active = allOrders.find((o) => o.tableNumber === tableNumber && o.status !== 'Served');
      setTableActiveOrder(active || null);
    });

    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
    };
  }, [tableNumber]);

  // Add 1 to cart
  const handleAddItem = (item: SimpleMenuItem) => {
    if (item.available === false) return;
    setCart((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  // Remove 1 from cart
  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: current - 1,
      };
    });
  };

  const handleUpdateCartQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
    } else {
      setCart((prev) => ({
        ...prev,
        [itemId]: newQty,
      }));
    }
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Detailed Modal add handler
  const handleAddToCartFromModal = (item: SimpleMenuItem, quantity: number, customNotes?: string) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + quantity,
    }));
    if (customNotes) {
      setOrderNotes((prev) => (prev ? `${prev}; ${item.name}: ${customNotes}` : `${item.name}: ${customNotes}`));
    }
  };

  // Compute cart items & running total
  const cartItems: SimpleOrderItem[] = useMemo(() => {
    return Object.entries(cart)
      .map(([itemId, qty]): SimpleOrderItem | null => {
        const menuItem = menuList.find((m) => m.id === itemId);
        if (!menuItem) return null;
        return {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: Number(qty),
          image: menuItem.image,
        };
      })
      .filter((item): item is SimpleOrderItem => item !== null);
  }, [cart, menuList]);

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const runningTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Dynamic Categories from current menu list
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuList.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ['All', ...Array.from(set)];
  }, [menuList]);

  const filteredMenuItems = useMemo(() => {
    return menuList.filter((item) => {
      // Category filter
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      // Dietary filter
      let matchesDietary = true;
      if (dietaryFilter === 'veg') {
        matchesDietary = item.isVeg === true;
      } else if (dietaryFilter === 'non-veg') {
        matchesDietary = item.isVeg === false;
      } else if (dietaryFilter === 'bestseller') {
        matchesDietary = Boolean(item.badge && item.badge.toLowerCase().includes('best') || item.badge?.toLowerCase().includes('popular') || item.badge?.toLowerCase().includes('special'));
      }

      // Search filter
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesDietary && matchesSearch;
    });
  }, [menuList, selectedCategory, dietaryFilter, searchQuery]);

  // Place Order handler
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const trimmedNotes = orderNotes.trim() || undefined;

    const localSavedOrder = orderStorage.addOrder({
      tableNumber,
      items: cartItems,
      total: runningTotal,
      timestamp: formattedTime,
      notes: trimmedNotes,
    });

    setOrderConfirmed({
      orderId: localSavedOrder.id,
      items: cartItems,
      total: runningTotal,
      timestamp: formattedTime,
      table: tableNumber,
      notes: trimmedNotes,
      status: 'Pending',
    });
    setCart({});
    setOrderNotes('');
    setShowNotesInput(false);
    setIsCartDrawerOpen(false);
    setIsSubmitting(false);
  };

  // 1. Order Confirmed Screen - Live Status Tracker (Pending -> Preparing -> Ready -> Served)
  if (orderConfirmed) {
    return (
      <OrderStatusTracker
        orderId={orderConfirmed.orderId}
        tableNumber={orderConfirmed.table}
        items={orderConfirmed.items}
        total={orderConfirmed.total}
        timestamp={orderConfirmed.timestamp}
        notes={orderConfirmed.notes}
        initialStatus={orderConfirmed.status}
        onOrderMore={() => setOrderConfirmed(null)}
        onBackToQR={onBackToQR}
        onSwitchToKitchen={onSwitchToKitchen}
      />
    );
  }

  return (
    <div id="customer-order-page" className="min-h-screen bg-stone-100/70 text-stone-900 dark:bg-stone-950 dark:text-stone-100 pb-36 transition-colors duration-200">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md px-3.5 sm:px-6 py-2.5 sm:py-3.5 shadow-2xs transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500 text-amber-100 dark:text-stone-950 shadow-sm shrink-0">
              <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-stone-900 dark:text-white tracking-tight leading-tight truncate">
                Corner Roastery
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">Table {tableNumber}</span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <select
                  aria-label="Change table number"
                  value={tableNumber}
                  onChange={(e) => onTableChange(e.target.value)}
                  className="bg-transparent font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 underline text-xs cursor-pointer focus:outline-hidden"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.number} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {showAdminNavigation && onSwitchToMenuManagement && (
              <button
                id="header-menu-manager-btn"
                onClick={onSwitchToMenuManagement}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-2xs min-h-[38px]"
                title="Open Owner Menu Management"
              >
                <Layers className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Manage Menu</span>
                <span className="sm:hidden">Menu</span>
              </button>
            )}

            {onBackToQR && (
              <button
                id="header-view-qr-btn"
                onClick={onBackToQR}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-2xs min-h-[38px]"
                title="View Table QR Stand"
              >
                <QrCode className="h-3.5 w-3.5 text-stone-600 dark:text-stone-400" />
                <span className="hidden sm:inline">QR Stand</span>
              </button>
            )}

            {showAdminNavigation && onSwitchToKitchen && (
              <button
                id="nav-kitchen-view-btn"
                onClick={onSwitchToKitchen}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-500/20 transition-colors min-h-[38px]"
              >
                <UtensilsCrossed className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                <span className="hidden sm:inline">Kitchen Display</span>
                <span className="sm:hidden">KDS</span>
              </button>
            )}

            <ThemeToggle className="dark:bg-stone-900 dark:border-stone-800" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-3.5 space-y-3.5">
        {/* Active Order in Progress Banner */}
        {tableActiveOrder && (
          <div
            id="active-table-order-banner"
            onClick={() => {
              setOrderConfirmed({
                orderId: tableActiveOrder.id,
                items: tableActiveOrder.items,
                total: tableActiveOrder.total,
                timestamp: tableActiveOrder.timestamp,
                table: tableActiveOrder.tableNumber,
                notes: tableActiveOrder.notes,
                status: tableActiveOrder.status,
              });
            }}
            className="rounded-2xl border border-emerald-500/50 bg-stone-900 dark:bg-stone-900/90 p-3 sm:p-3.5 text-white flex items-center justify-between gap-3 shadow-lg cursor-pointer hover:bg-stone-850 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Clock className="h-4 w-4 animate-spin" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">
                    Order #{tableActiveOrder.id} in Progress
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {tableActiveOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate">
                  {tableActiveOrder.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                </p>
              </div>
            </div>

            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-stone-950 text-xs font-black hover:bg-emerald-400 shrink-0 shadow-xs"
            >
              <span>Track Live</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Welcome Notice */}
        <div className="rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/30 p-3 sm:p-3.5 flex items-center justify-between gap-3 text-amber-950 dark:text-amber-200 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-amber-200/60 dark:bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-800 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-xs leading-snug">
              Ordering directly to <strong>Table {tableNumber}</strong>. Tap any dish for rich details or tap <span className="font-bold">+</span> to add.
            </p>
          </div>
          {onBackToQR && (
            <button
              onClick={onBackToQR}
              className="text-[11px] font-bold text-amber-900 dark:text-amber-300 underline whitespace-nowrap shrink-0 hover:text-amber-700 dark:hover:text-amber-200 p-1"
            >
              Table QR
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
          <input
            id="menu-search-input"
            type="text"
            placeholder="Search espresso, cold brew, bakery, sourdough..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-700 focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-700 shadow-2xs min-h-[42px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dietary Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setDietaryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${dietaryFilter === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
          >
            <span>All Dishes</span>
          </button>
          <button
            onClick={() => setDietaryFilter('veg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${dietaryFilter === 'veg'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
          >
            <Leaf className="h-3 w-3" />
            <span>Veg Only 🌱</span>
          </button>
          <button
            onClick={() => setDietaryFilter('non-veg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${dietaryFilter === 'non-veg'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
          >
            <Flame className="h-3 w-3" />
            <span>Non-Veg 🍗</span>
          </button>
          <button
            onClick={() => setDietaryFilter('bestseller')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${dietaryFilter === 'bestseller'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
          >
            <Star className="h-3 w-3" />
            <span>Chef's Bestsellers ⭐</span>
          </button>
        </div>

        {/* Category Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const count = cat === 'All'
              ? menuList.length
              : menuList.filter((m) => m.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[38px] ${isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                  }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected
                    ? 'bg-stone-950/20 text-stone-950 font-bold'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Menu Items Grid */}
        <div id="menu-items-list" className="space-y-3 pt-1">
          {filteredMenuItems.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
              <Coffee className="h-8 w-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No menu items match your filter</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Try resetting search or dietary filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredMenuItems.map((item) => {
                const qty = cart[item.id] || 0;
                const isAvailable = item.available !== false;
                return (
                  <div
                    key={item.id}
                    id={`menu-item-${item.id}`}
                    className={`flex items-stretch rounded-2xl border bg-white dark:bg-stone-900 p-3 sm:p-3.5 transition-all ${!isAvailable
                        ? 'border-stone-200/70 dark:border-stone-800/70 bg-stone-50/70 dark:bg-stone-950/70 opacity-75'
                        : qty > 0
                          ? 'border-stone-900 dark:border-amber-500 ring-1 ring-stone-900 dark:ring-amber-500 shadow-md'
                          : 'border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-xs'
                      }`}
                  >
                    {/* Item Image with Click-to-Inspect */}
                    <div
                      onClick={() => setSelectedDishDetail(item)}
                      className="relative h-24 w-24 sm:h-26 sm:w-26 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200/80 dark:border-stone-700/80 cursor-pointer group"
                      title="Tap to see item details"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isAvailable ? '' : 'grayscale-[60%]'}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-stone-400 dark:text-stone-500">
                          <Coffee className="h-6 w-6" />
                        </div>
                      )}

                      {/* Veg / Non-veg indicator dot */}
                      {item.isVeg !== undefined && (
                        <div
                          title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          className={`absolute bottom-1 left-1 flex h-3.5 w-3.5 items-center justify-center rounded bg-white/95 dark:bg-stone-950/95 p-0.5 shadow-2xs border ${item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`} />
                        </div>
                      )}

                      {/* Sold Out or Badge */}
                      {!isAvailable ? (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-stone-800/95 text-stone-200 font-bold text-[9px] uppercase tracking-wider backdrop-blur-xs">
                          Sold Out
                        </span>
                      ) : item.badge ? (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-stone-900/90 dark:bg-amber-500 dark:text-stone-950 text-white font-bold text-[9px] uppercase tracking-wider backdrop-blur-xs">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>

                    {/* Details & Controls */}
                    <div className="ml-3 sm:ml-3.5 flex flex-col justify-between flex-1 min-w-0">
                      <div
                        onClick={() => setSelectedDishDetail(item)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-snug truncate hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                            {item.name}
                          </h3>
                          <span className="font-mono text-sm font-extrabold text-stone-900 dark:text-amber-400 shrink-0">
                            ₹{item.price}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-auto">
                        {item.prepTime ? (
                          <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                            <Clock className="h-3 w-3" />
                            <span>{item.prepTime}</span>
                          </div>
                        ) : <div />}

                        {/* Stepper / Add button / Sold Out */}
                        <div className="ml-auto">
                          {!isAvailable ? (
                            <span className="text-[11px] font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 inline-block">
                              Sold Out
                            </span>
                          ) : qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-300 dark:border-stone-700">
                              <button
                                id={`item-${item.id}-minus`}
                                onClick={() => handleRemoveItem(item.id)}
                                aria-label={`Decrease ${item.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 shadow-2xs hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-95 transition-all"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="font-mono text-xs font-bold w-5 text-center text-stone-900 dark:text-white">
                                {qty}
                              </span>
                              <button
                                id={`item-${item.id}-plus`}
                                onClick={() => handleAddItem(item)}
                                aria-label={`Increase ${item.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 shadow-2xs hover:bg-stone-800 dark:hover:bg-amber-400 active:scale-95 transition-all"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`item-${item.id}-add`}
                              onClick={() => handleAddItem(item)}
                              className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-900 hover:text-white dark:hover:bg-amber-500 dark:hover:text-stone-950 hover:border-stone-900 dark:hover:border-amber-500 transition-all shadow-2xs active:scale-95 min-h-[38px]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Running Cart Bar */}
      {totalItemCount > 0 && (
        <div
          id="running-cart-bar"
          className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-t from-stone-900/50 via-stone-900/20 to-transparent pointer-events-none"
        >
          <div className="max-w-5xl mx-auto bg-stone-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-stone-800 space-y-2.5 pointer-events-auto animate-in slide-in-from-bottom-3 duration-200">

            {/* Expandable Notes Input */}
            {showNotesInput && (
              <div className="bg-stone-900/90 rounded-xl p-2.5 border border-stone-800 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between text-xs text-stone-300 font-semibold mb-1.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <StickyNote className="h-3.5 w-3.5 text-amber-400" />
                    <span>Special Instructions / Cooking Notes</span>
                  </div>
                  <button
                    onClick={() => setShowNotesInput(false)}
                    className="text-stone-400 hover:text-white p-1"
                    aria-label="Close notes"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  id="order-notes-input"
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Less ice, oat milk, extra sugar, allergies..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 min-h-[38px]"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {/* Cart summary & click-to-expand drawer */}
              <div
                onClick={() => setIsCartDrawerOpen(true)}
                className="flex items-center gap-2.5 sm:gap-3 min-w-0 pl-1 cursor-pointer group"
                title="Tap to review cart items"
              >
                <div className="flex -space-x-2 overflow-hidden shrink-0">
                  {cartItems.slice(0, 3).map((it) => (
                    it.image ? (
                      <img
                        key={it.id}
                        src={it.image}
                        alt={it.name}
                        className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-stone-900 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : null
                  ))}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs text-stone-400 font-medium group-hover:text-amber-300 transition-colors">
                      {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} • Table {tableNumber} (Review)
                    </span>
                    {!showNotesInput && (
                      <button
                        id="toggle-notes-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowNotesInput(true);
                        }}
                        className={`text-[11px] px-1.5 py-0.5 rounded border transition-colors flex items-center gap-1 ${orderNotes.trim()
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                          }`}
                        title="Add instructions for kitchen"
                      >
                        <StickyNote className="h-2.5 w-2.5" />
                        <span>{orderNotes.trim() ? 'Notes Added' : '+ Note'}</span>
                      </button>
                    )}
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                    Total: ₹{runningTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* One-Tap Place Order Button */}
              <button
                id="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 sm:px-6 py-2.5 sm:py-3 font-black text-stone-950 hover:bg-amber-400 transition-all shadow-md active:scale-98 disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap shrink-0 min-h-[44px]"
              >
                {isSubmitting ? (
                  <span>Sending to Kitchen...</span>
                ) : (
                  <>
                    <span>Place Order</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dish Details Modal Sheet */}
      {selectedDishDetail && (
        <DishDetailSheet
          item={selectedDishDetail}
          isOpen={Boolean(selectedDishDetail)}
          onClose={() => setSelectedDishDetail(null)}
          currentQuantity={cart[selectedDishDetail.id] || 1}
          onAddToCart={handleAddToCartFromModal}
        />
      )}

      {/* Cart Review Drawer */}
      <CartReviewDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cartItems}
        tableNumber={tableNumber}
        orderNotes={orderNotes}
        onOrderNotesChange={setOrderNotes}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
