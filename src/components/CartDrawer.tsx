import React, { useState } from 'react';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, CheckCircle2, 
  Clock, Coffee
} from 'lucide-react';
import { CartItem, ActiveOrder } from '../types';
import { CAFE_INFO } from '../data/cafeData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: ActiveOrder) => void;
  activeOrder: ActiveOrder | null;
  onExploreMenu: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  activeOrder,
  onExploreMenu,
}) => {
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + tax;

  const handlePlaceOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newOrder: ActiveOrder = {
        orderId: `CR-${Math.floor(100 + Math.random() * 900)}`,
        tableNumber: CAFE_INFO.tableNumber,
        items: [...items],
        subtotal,
        tax,
        total: grandTotal,
        specialInstructions: specialInstructions.trim(),
        placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Brewing at Bar',
        estimatedMinutes: 8,
      };

      onOrderPlaced(newOrder);
      onClearCart();
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div id="cart-drawer-overlay" className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div 
        id="cart-drawer-panel"
        className="relative flex h-full w-full max-w-md flex-col bg-white text-stone-900 shadow-xl border-l border-stone-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-800">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-cinzel text-base font-bold text-stone-900">
                {CAFE_INFO.tableNumber} Order
              </h2>
              <p className="text-[11px] text-stone-500">
                {CAFE_INFO.name} • {CAFE_INFO.tableArea}
              </p>
            </div>
          </div>
          <button
            id="close-cart-btn"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Order Banner */}
          {activeOrder && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Order #{activeOrder.orderId} Sent to Barista
                </span>
                <span className="text-stone-500">{activeOrder.placedAt}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Status: <strong>{activeOrder.status}</strong></span>
                <span className="flex items-center gap-1 text-emerald-800 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  ~{activeOrder.estimatedMinutes} mins to table
                </span>
              </div>
              <p className="text-[11px] text-stone-500 pt-1 border-t border-emerald-100">
                Total ₹{activeOrder.total} (Pay at table or counter when leaving).
              </p>
            </div>
          )}

          {/* Empty State */}
          {items.length === 0 && !activeOrder && (
            <div id="empty-cart-state" className="flex h-64 flex-col items-center justify-center text-center">
              <Coffee className="h-8 w-8 text-stone-300 mb-2" />
              <h3 className="font-cinzel text-sm font-bold text-stone-800">
                No items in order yet
              </h3>
              <p className="mt-1 text-xs text-stone-500 max-w-xs">
                Browse our coffee, brews, and bakery treats to add to your table order.
              </p>
              <button
                id="empty-cart-explore-btn"
                onClick={() => {
                  onClose();
                  onExploreMenu();
                }}
                className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
              >
                Explore Café Menu
              </button>
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <button onClick={onClearCart} className="hover:text-stone-900">
                  Clear
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {items.map((cartItem) => (
                  <div key={cartItem.menuItem.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          cartItem.menuItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`} />
                        <h4 className="text-xs font-semibold text-stone-900 truncate">
                          {cartItem.menuItem.name}
                        </h4>
                      </div>

                      {/* Customization pills */}
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {cartItem.selectedTemp && (
                          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {cartItem.selectedTemp}
                          </span>
                        )}
                        {cartItem.selectedMilk && (
                          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {cartItem.selectedMilk}
                          </span>
                        )}
                        {cartItem.selectedSugar && (
                          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {cartItem.selectedSugar}
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-medium text-stone-500 mt-1 block">
                        ₹{cartItem.menuItem.price} each
                      </span>
                      {cartItem.notes && (
                        <p className="text-[10px] text-stone-400 truncate">
                          Note: {cartItem.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                          className="flex h-5 w-5 items-center justify-center text-stone-600 hover:text-stone-900"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-stone-800">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                          className="flex h-5 w-5 items-center justify-center text-stone-600 hover:text-stone-900"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-stone-900 w-12 text-right">
                        ₹{cartItem.menuItem.price * cartItem.quantity}
                      </span>

                      <button
                        onClick={() => onRemoveItem(cartItem.menuItem.id)}
                        className="text-stone-300 hover:text-stone-600 p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special instructions */}
              <div className="pt-2">
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Notes for barista / kitchen (e.g. extra hot, no cutlery)"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-800 focus:outline-none"
                />
              </div>

              {/* Bill Details */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>GST (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="border-t border-stone-200 pt-1.5 flex justify-between font-bold text-stone-900">
                  <span>Total</span>
                  <span className="font-cinzel text-sm">₹{grandTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 p-4 pb-safe bg-white">
            <button
              id="place-table-order-btn"
              disabled={isSubmitting}
              onClick={handlePlaceOrder}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-3.5 px-4 min-h-[44px] text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 active:scale-[0.99] transition-all disabled:opacity-60 shadow-xs"
            >
              {isSubmitting ? (
                <span>Sending to Barista...</span>
              ) : (
                <>
                  <span>Send Order to Barista</span>
                  <span>•</span>
                  <span>₹{grandTotal}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
