'use client';

import React from 'react';
import {
  X, Plus, Minus, Trash2, ShoppingBag,
  StickyNote, ChevronRight, ShieldCheck, UtensilsCrossed
} from 'lucide-react';
import { SimpleOrderItem } from '../types';

interface CartReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: SimpleOrderItem[];
  tableNumber: string;
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: () => void;
  isSubmitting: boolean;
}

export const CartReviewDrawer: React.FC<CartReviewDrawerProps> = ({
  isOpen,
  onClose,
  items,
  tableNumber,
  orderNotes,
  onOrderNotesChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + gstAmount;

  return (
    <div
      id="cart-review-drawer-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-stone-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="cart-review-drawer-panel"
        className="relative flex h-full w-full max-w-md flex-col bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xl border-l border-stone-200 dark:border-stone-800 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 p-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                  Your Table {tableNumber} Cart
                </h2>
                <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-[11px] font-bold text-stone-600 dark:text-stone-300">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Corner Roastery • Direct to Table {tableNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                id="cart-clear-all-btn"
                onClick={onClearCart}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors mr-1"
              >
                Clear
              </button>
            )}
            <button
              id="cart-close-btn"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cart Itemized List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-100 dark:divide-stone-800/60">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-stone-100 dark:bg-stone-800 mx-auto flex items-center justify-center text-stone-400">
                <UtensilsCrossed className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">Your cart is empty</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Select items from the menu to build your table order.
              </p>
              <button
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 px-4 py-2 text-xs font-bold"
              >
                <span>Browse Menu</span>
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                {/* Thumbnail */}
                <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-stone-400">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-stone-900 dark:text-amber-400">
                      ₹{item.price}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      × {item.quantity} = ₹{item.price * item.quantity}
                    </span>
                  </div>
                </div>

                {/* Stepper + Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease item"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 shadow-2xs hover:bg-stone-100 active:scale-95 transition-all"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono text-xs font-bold w-5 text-center text-stone-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase item"
                      className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 shadow-2xs hover:bg-stone-800 dark:hover:bg-amber-400 active:scale-95 transition-all"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    aria-label="Remove item"
                    title="Remove item"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Special Instructions & Bill Summary Section */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 p-4 space-y-3 shrink-0">
            {/* Notes Input */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                <span>Special Cooking Instructions (Kitchen)</span>
              </div>
              <input
                id="drawer-order-notes-input"
                type="text"
                value={orderNotes}
                onChange={(e) => onOrderNotesChange(e.target.value)}
                placeholder="e.g. Less ice, oat milk, allergy notes..."
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 min-h-[38px]"
              />
            </div>

            {/* Bill Calculations */}
            <div className="space-y-1.5 pt-2 border-t border-stone-200/80 dark:border-stone-800 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Subtotal ({totalItemCount} items)</span>
                <span className="font-mono font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>GST (5% Restaurant)</span>
                <span className="font-mono font-medium">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-stone-900 dark:text-white pt-1 border-t border-dashed border-stone-200 dark:border-stone-800">
                <span>Grand Total</span>
                <span className="font-mono text-base text-stone-900 dark:text-amber-400">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              id="confirm-place-order-drawer-btn"
              onClick={onPlaceOrder}
              disabled={isSubmitting || items.length === 0}
              className="w-full min-h-[48px] rounded-2xl bg-stone-900 dark:bg-amber-500 py-3.5 px-5 font-black text-sm text-white dark:text-stone-950 shadow-xl hover:bg-stone-800 dark:hover:bg-amber-400 active:scale-98 transition-all flex items-center justify-between disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Sending to Kitchen Queue...' : 'Confirm & Place Order'}</span>
              <div className="flex items-center gap-1.5 font-mono font-black">
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-medium text-center">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>Instant KDS ticket transmission • Table {tableNumber}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
