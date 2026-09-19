'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CheckCircle2, Clock, Flame, Bell, CheckCheck,
  Coffee, ArrowLeft, UtensilsCrossed, QrCode, StickyNote, RefreshCw,
  Receipt, Download, Star, Heart, Sparkles, Plus,
  Send, Volume2, VolumeX, Check, Copy, AlertCircle, Share2, Printer,
  CreditCard, Smartphone, Banknote, ShieldCheck, CheckCircle, Lock, ArrowRight, X
} from 'lucide-react';
import { SimpleOrderItem, OrderStatus, KitchenOrder } from '../types';
import { orderStorage } from '../utils/orderStorage';
import { menuStorage } from '../utils/menuStorage';

interface OrderStatusTrackerProps {
  orderId: string;
  tableNumber: string;
  items: SimpleOrderItem[];
  total: number;
  timestamp: string;
  notes?: string;
  initialStatus?: OrderStatus;
  onOrderMore: () => void;
  onBackToQR: () => void;
  onSwitchToKitchen: () => void;
}

const STAGES: {
  key: OrderStatus;
  label: string;
  title: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  estTime: string;
}[] = [
    {
      key: 'Pending',
      label: 'Received',
      title: 'Order Received',
      desc: 'Ticket sent to kitchen display queue',
      icon: Clock,
      color: 'amber',
      estTime: '10-14 mins',
    },
    {
      key: 'Preparing',
      label: 'Preparing',
      title: 'Barista & Kitchen Brewing',
      desc: 'Espresso extraction & food crafting in progress',
      icon: Flame,
      color: 'sky',
      estTime: '5-8 mins',
    },
    {
      key: 'Ready',
      label: 'Ready',
      title: 'Order is Fresh & Ready!',
      desc: 'Plated & warm! Staff is delivering to table',
      icon: Bell,
      color: 'emerald',
      estTime: '1-2 mins',
    },
    {
      key: 'Served',
      label: 'Served',
      title: 'Delivered to Table',
      desc: 'Served fresh at your table. Enjoy your meal!',
      icon: CheckCheck,
      color: 'purple',
      estTime: 'Delivered',
    },
  ];

// Quick addon picks for 1-tap adding while waiting
const QUICK_ADDONS: { id: string; name: string; price: number; category: string; image: string }[] = [
  {
    id: '10',
    name: 'Butter Croissant',
    price: 160,
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '11',
    name: 'Choco Fudge Brownie',
    price: 180,
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '4',
    name: 'Classic Cold Brew',
    price: 190,
    category: 'Cold Brew',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '14',
    name: 'Garlic Herb Sourdough',
    price: 160,
    category: 'Quick Bite',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
  },
];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  orderId,
  tableNumber,
  items: initialItems,
  total: initialTotal,
  timestamp,
  notes,
  initialStatus = 'Pending',
  onOrderMore,
  onBackToQR,
  onSwitchToKitchen,
}) => {
  // Live items and status initialized from orderStorage
  const [currentOrder, setCurrentOrder] = useState<KitchenOrder | null>(() => {
    const existing = orderStorage.getOrderById(orderId);
    if (existing) return existing;
    return {
      id: orderId,
      tableNumber,
      items: initialItems,
      total: initialTotal,
      timestamp,
      createdAt: Date.now(),
      status: initialStatus,
      notes,
    };
  });

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(() => {
    return currentOrder?.status || initialStatus;
  });

  const [items, setItems] = useState<SimpleOrderItem[]>(() => {
    return currentOrder?.items || initialItems;
  });

  const [total, setTotal] = useState<number>(() => {
    return currentOrder?.total || initialTotal;
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [serviceRequestSent, setServiceRequestSent] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [selectedFeedbackTags, setSelectedFeedbackTags] = useState<string[]>([]);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);

  // Payment Gateway & Settlement States
  const [isPaid, setIsPaid] = useState<boolean>(() => {
    return Boolean(currentOrder?.isPaid);
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'qr'>('gpay');
  const [transactionId, setTransactionId] = useState<string>('TXN' + Math.floor(100000 + Math.random() * 900000));
  const [paidTimestamp, setPaidTimestamp] = useState<string>('');
  const [customUpiId, setCustomUpiId] = useState('customer@okhdfcbank');

  const prevStatusRef = useRef<OrderStatus>(currentStatus);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Auto dismiss initial confetti banner after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Play audio chime when status advances
  const playStatusChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Friendly 3-tone chime (C5 -> E5 -> G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
      gain2.gain.setValueAtTime(0.2, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.38);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(783.99, now + 0.24); // G5
      gain3.gain.setValueAtTime(0.25, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.65);
    } catch {
      // Audio autoplay catch
    }
  };

  // Sync real-time updates from local browser storage
  useEffect(() => {
    const existing = orderStorage.getOrderById(orderId);
    if (existing) {
      setCurrentOrder(existing);
      setItems(existing.items);
      setTotal(existing.total);
      if (existing.status && existing.status !== currentStatus) {
        setCurrentStatus(existing.status);
      }
    }

    const unsubscribe = orderStorage.subscribe((allOrders) => {
      const found = allOrders.find((o) => o.id === orderId);
      if (found) {
        setCurrentOrder(found);
        setItems(found.items);
        setTotal(found.total);
        if (found.status && found.status !== prevStatusRef.current) {
          playStatusChime();
          prevStatusRef.current = found.status;
          setCurrentStatus(found.status);
        }
        setLastSync(new Date());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  // Stage calculation
  const stageIndex = STAGES.findIndex((s) => s.key === currentStatus);
  const activeIndex = stageIndex >= 0 ? stageIndex : 0;
  const progressPercent = ((activeIndex + 1) / STAGES.length) * 100;
  const currentStageConfig = STAGES[activeIndex] || STAGES[0];

  // 1-Tap Quick Add extra item to order
  const handleQuickAdd = (addon: typeof QUICK_ADDONS[0]) => {
    const extraItem: SimpleOrderItem = {
      id: addon.id,
      name: addon.name,
      price: addon.price,
      quantity: 1,
      image: addon.image,
    };

    const updated = orderStorage.appendItemsToOrder(orderId, [extraItem]);
    if (updated) {
      setCurrentOrder(updated);
      setItems(updated.items);
      setTotal(updated.total);
      setAddedItemNotice(`Added +1 ${addon.name} to Table ${tableNumber}!`);
      setTimeout(() => setAddedItemNotice(null), 3500);

    }
  };

  // Table Service Assistance Action
  const handleServiceRequest = (type: string) => {
    setServiceRequestSent(type);
    setTimeout(() => setServiceRequestSent(null), 4000);
  };

  // Process Simulated Payment
  const handleProcessPayment = (methodName?: string) => {
    setPaymentProcessing(true);
    const method = methodName || (paymentMethod === 'upi' ? `UPI (${selectedUpiApp.toUpperCase()})` : paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash at Counter');

    setTimeout(() => {
      const txId = 'TXN' + Math.floor(100000 + Math.random() * 900000);
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTransactionId(txId);
      setPaidTimestamp(timeStr);
      setPaymentProcessing(false);
      setShowPaymentModal(false);
      setPaymentSuccessModal(true);
      setIsPaid(true);

      // Persist in orderStorage
      const updated = orderStorage.markOrderAsPaid(orderId, method);
      if (updated) {
        setCurrentOrder(updated);
      }
      playStatusChime();
    }, 1100);
  };

  // Feedback tag toggle
  const toggleFeedbackTag = (tag: string) => {
    setSelectedFeedbackTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Tax calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [items]);
  const gst = Math.round(subtotal * 0.05); // 5% Cafe GST
  const grandTotal = total + tipAmount;

  return (
    <div id="order-status-tracker-view" className="min-h-screen bg-stone-900 text-stone-100 pb-28 select-none">

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 border-b border-stone-800 bg-stone-950/95 backdrop-blur-md px-3.5 sm:px-6 py-3 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onOrderMore}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors shrink-0"
              title="Return to Menu"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight truncate">
                Corner Roastery
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Table Tracker</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Table Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Table {tableNumber}
            </span>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playStatusChime();
              }}
              title={soundEnabled ? 'Order Sound Alert ON' : 'Muted'}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${soundEnabled
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-stone-800 bg-stone-900 text-stone-500'
                }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-3.5 sm:px-5 pt-4 sm:pt-6 space-y-4 sm:space-y-5">

        {/* Confetti / Success Toast Banner */}
        {showConfetti && (
          <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-500/30 text-amber-200 text-xs shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 animate-spin" />
              <span className="font-semibold truncate">
                🎉 Order #{orderId} placed! Kitchen is notified.
              </span>
            </div>
            <button
              onClick={() => setShowConfetti(false)}
              className="text-stone-400 hover:text-white px-2 py-0.5 rounded text-[11px]"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Added Item Toast */}
        {addedItemNotice && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-bounce">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{addedItemNotice}</span>
          </div>
        )}

        {/* Live Active Status Hero Card */}
        <div
          id="status-hero-card"
          className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-2xl transition-all ${currentStatus === 'Pending'
            ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/40 via-stone-900 to-stone-900 text-amber-100'
            : currentStatus === 'Preparing'
              ? 'border-sky-500/50 bg-gradient-to-b from-sky-950/40 via-stone-900 to-stone-900 text-sky-100'
              : currentStatus === 'Ready'
                ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 via-stone-900 to-stone-900 text-emerald-100'
                : 'border-purple-500/50 bg-gradient-to-b from-purple-950/40 via-stone-900 to-stone-900 text-purple-100'
            }`}
        >
          {/* Header of Card */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-stone-400">
                Order #{orderId}
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-xs text-stone-400 font-mono">{timestamp}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-stone-950/80 border border-stone-800">
              <Clock className="h-3 w-3 text-amber-400" />
              <span>Est: {currentStageConfig.estTime}</span>
            </div>
          </div>

          {/* Hero Icon & Title */}
          <div className="pt-5 pb-3 text-center">
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-stone-950/80 border border-stone-800 shadow-xl mb-3 relative">
              {currentStatus === 'Pending' && (
                <>
                  <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400 animate-ping" />
                </>
              )}
              {currentStatus === 'Preparing' && (
                <>
                  <Flame className="h-8 w-8 sm:h-10 sm:w-10 text-sky-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-sky-400 animate-ping" />
                </>
              )}
              {currentStatus === 'Ready' && (
                <>
                  <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400 animate-bounce" />
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 animate-ping" />
                </>
              )}
              {currentStatus === 'Served' && (
                <CheckCheck className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
              )}
            </div>

            <div className="inline-block px-3 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-stone-950/80 border border-stone-800 mb-1.5">
              Stage {activeIndex + 1} of 4: {currentStatus}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {currentStageConfig.title}
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 max-w-sm mx-auto mt-1 leading-snug">
              {currentStageConfig.desc}
            </p>
          </div>

          {/* Stepper Timeline & Progress Bar */}
          <div className="pt-4 space-y-2">
            <div className="h-2 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800/80">
              <div
                className={`h-full transition-all duration-700 rounded-full ${currentStatus === 'Pending'
                  ? 'bg-amber-500'
                  : currentStatus === 'Preparing'
                    ? 'bg-sky-500'
                    : currentStatus === 'Ready'
                      ? 'bg-emerald-500'
                      : 'bg-purple-500'
                  }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Stepper Node Labels */}
            <div className="grid grid-cols-4 gap-1 pt-1.5 text-center">
              {STAGES.map((stage, idx) => {
                const isPast = idx < activeIndex;
                const isCurrent = idx === activeIndex;
                const IconComp = stage.icon;

                return (
                  <div key={stage.key} className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl text-xs font-black transition-all ${isCurrent
                        ? 'bg-white text-stone-950 ring-2 ring-amber-400/80 scale-105 shadow-md'
                        : isPast
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-stone-950 text-stone-600 border border-stone-800'
                        }`}
                    >
                      {isPast ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <IconComp className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] sm:text-[11px] font-bold leading-tight ${isCurrent
                        ? 'text-white font-black'
                        : isPast
                          ? 'text-emerald-400'
                          : 'text-stone-500'
                        }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Order Details & Items Summary Card */}
        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Order Items ({items.reduce((s, it) => s + it.quantity, 0)})
              </h3>
            </div>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
            >
              Tax Invoice
            </button>
          </div>

          {notes && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-200">
              <StickyNote className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Kitchen Note: </span>
                <span>{notes}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs sm:text-sm py-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-black text-amber-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
                    {it.quantity}×
                  </span>
                  <span className="text-stone-200 truncate font-medium">{it.name}</span>
                </div>
                <span className="font-mono text-white font-bold shrink-0">
                  ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2.5 border-t border-stone-800 flex justify-between items-center text-xs font-mono">
            <span className="text-stone-400">Total Order Amount</span>
            <span className="text-base sm:text-lg font-black text-white">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Customer Rating & Tip Card (Especially useful when Served) */}
        {currentStatus === 'Served' && !ratingSubmitted && (
          <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-purple-300">
              <Star className="h-4 w-4 text-purple-400 fill-purple-400" />
              <h3 className="text-xs font-black uppercase tracking-wider">
                How was your meal & coffee?
              </h3>
            </div>

            {/* 5-Star Rating Buttons */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`h-7 w-7 ${star <= rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-stone-600'
                      }`}
                  />
                </button>
              ))}
            </div>

            {/* Feedback Tags */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {['Piping Hot', 'Amazing Espresso', 'Lightning Fast', 'Polite Barista', 'Great Ambience'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFeedbackTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selectedFeedbackTags.includes(tag)
                    ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Optional Tip Barista */}
            <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Tip our Barista & Chef (Optional):</span>
                {tipAmount > 0 && <span className="font-bold text-amber-400 font-mono">+₹{tipAmount}</span>}
              </div>
              <div className="flex gap-2">
                {[0, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTipAmount(amt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${tipAmount === amt
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-800'
                      }`}
                  >
                    {amt === 0 ? 'No Tip' : `₹${amt}`}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setRatingSubmitted(true)}
              disabled={rating === 0}
              className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-500 disabled:opacity-40 transition-all min-h-[42px]"
            >
              Submit Feedback & Thank You
            </button>
          </div>
        )}

        {ratingSubmitted && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-center space-y-1">
            <Heart className="h-6 w-6 text-emerald-400 mx-auto fill-emerald-400" />
            <h4 className="text-sm font-bold text-white">Thank you for dining with us!</h4>
            <p className="text-xs text-stone-400">Your feedback inspires our baristas and kitchen team.</p>
          </div>
        )}




        {/* Live sync footer */}
        <div className="text-center text-[10px] text-stone-500 font-mono pt-2">
          Sync active • Connected to Kitchen Display • {lastSync.toLocaleTimeString()}
        </div>
      </main>

    </div>
  );
};
