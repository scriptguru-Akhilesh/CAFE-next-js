'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, Minus, Check, Coffee, Sparkles, ChefHat, Flame, Leaf } from 'lucide-react';
import { SimpleMenuItem } from '../types';

interface DishDetailSheetProps {
  item: SimpleMenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentQuantity: number;
  onAddToCart: (item: SimpleMenuItem, quantity: number, customNotes?: string) => void;
}

export const DishDetailSheet: React.FC<DishDetailSheetProps> = ({
  item,
  isOpen,
  onClose,
  currentQuantity,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState<number>(currentQuantity > 0 ? currentQuantity : 1);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setQuantity(currentQuantity > 0 ? currentQuantity : 1);
      setCustomNotes('');
      setIsAddedSuccess(false);
    }
  }, [item, currentQuantity]);

  if (!isOpen || !item) return null;

  const handleConfirmAdd = () => {
    onAddToCart(item, quantity, customNotes.trim() || undefined);
    setIsAddedSuccess(true);
    setTimeout(() => {
      setIsAddedSuccess(false);
      onClose();
    }, 400);
  };

  const isAvailable = item.available !== false;
  const totalPrice = item.price * quantity;

  return (
    <div
      id="dish-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/70 p-0 sm:p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="dish-detail-sheet-card"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xl pb-safe transition-all animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          id="close-dish-detail-sheet"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-stone-950/60 text-white shadow-md hover:bg-stone-950 hover:scale-105 active:scale-95 transition-all backdrop-blur-xs"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero Photo Banner */}
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className={`h-full w-full object-cover ${!isAvailable ? 'grayscale-[50%]' : ''}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-stone-500">
              <Coffee className="h-16 w-16" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/30" />

          {/* Badges Overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {item.isVeg !== undefined && (
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-xs ${item.isVeg
                    ? 'bg-emerald-950/85 text-emerald-300 border border-emerald-500/50'
                    : 'bg-rose-950/85 text-rose-300 border border-rose-500/50'
                  }`}>
                  <span className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>{item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                </span>
              )}

              {item.badge && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-stone-950 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-xs">
                  <Sparkles className="h-3 w-3" />
                  <span>{item.badge}</span>
                </span>
              )}
            </div>

            {item.prepTime && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-900/80 text-stone-200 text-xs font-semibold backdrop-blur-md border border-stone-700">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>{item.prepTime}</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {item.category || 'Specialty Item'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight leading-tight mt-0.5">
                  {item.name}
                </h2>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-xl sm:text-2xl font-black text-stone-900 dark:text-amber-400">
                  ₹{item.price}
                </span>
                <span className="block text-[11px] text-stone-400 font-medium">Incl. all taxes</span>
              </div>
            </div>

            {item.description && (
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed mt-2.5 pt-2.5 border-t border-stone-100 dark:border-stone-800">
                {item.description}
              </p>
            )}
          </div>

          {/* Quick Chef Preparation Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-2.5 flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-stone-400 block">Crafted</span>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate block">Made Fresh</span>
              </div>
            </div>
            <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-2.5 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-stone-400 block">Service</span>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate block">Table Delivery</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-2.5 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-stone-400 block">Quality</span>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate block">100% Artisan</span>
              </div>
            </div>
          </div>

          {/* Cooking Instructions / Special Requests */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
            <label htmlFor="detail-custom-notes" className="block text-xs font-bold text-stone-800 dark:text-stone-200">
              Special Instructions for Kitchen (Optional)
            </label>
            <input
              id="detail-custom-notes"
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Extra hot, no sugar, oat milk, less spicy, dressing on side..."
              className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-amber-500 transition-colors min-h-[40px]"
            />
          </div>

          {/* Stepper and Add to Order Bar */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 p-1">
              <button
                id="dish-detail-minus-qty"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 shadow-2xs hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-95 transition-all"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-mono text-sm font-extrabold w-7 text-center text-stone-900 dark:text-white">
                {quantity}
              </span>
              <button
                id="dish-detail-plus-qty"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 shadow-2xs hover:bg-stone-800 dark:hover:bg-amber-400 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Confirm Add Button */}
            <button
              id="dish-detail-add-confirm-btn"
              onClick={handleConfirmAdd}
              disabled={!isAvailable}
              className="flex-1 min-h-[48px] rounded-2xl bg-stone-900 dark:bg-amber-500 py-3 px-4 font-black text-xs sm:text-sm text-white dark:text-stone-950 shadow-lg hover:bg-stone-800 dark:hover:bg-amber-400 active:scale-98 transition-all flex items-center justify-between disabled:opacity-50"
            >
              <span>{isAddedSuccess ? '✓ Added to Order!' : 'Add to Order'}</span>
              <span className="font-mono font-extrabold">₹{totalPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
