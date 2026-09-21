import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, Minus, Check, Coffee } from 'lucide-react';
import { MenuItem } from '../types';

interface DishDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    notes?: string,
    milk?: string,
    temp?: string,
    sugar?: string
  ) => void;
  currentCartQty?: number;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  item,
  onClose,
  onAddToCart,
  currentCartQty = 0,
}) => {
  const [quantity, setQuantity] = useState(currentCartQty > 0 ? currentCartQty : 1);
  const [selectedTemp, setSelectedTemp] = useState<string>('Hot');
  const [selectedMilk, setSelectedMilk] = useState<string>('Whole Milk');
  const [selectedSugar, setSelectedSugar] = useState<string>('Regular Sweet');
  const [baristaNotes, setBaristaNotes] = useState('');
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  useEffect(() => {
    if (!item) return;
    setQuantity(currentCartQty > 0 ? currentCartQty : 1);
    setBaristaNotes('');
    setIsAddedRecently(false);
    if (item.options?.temperature?.length) {
      setSelectedTemp(item.options.temperature[0]);
    } else {
      setSelectedTemp('Hot');
    }
    if (item.options?.milkChoices?.length) {
      setSelectedMilk(item.options.milkChoices[0]);
    } else {
      setSelectedMilk('Whole Milk');
    }
    if (item.options?.sugarLevel?.length) {
      setSelectedSugar(item.options.sugarLevel[0]);
    } else {
      setSelectedSugar('Regular Sweet');
    }
  }, [item, currentCartQty]);

  if (!item) return null;

  const handleAdd = () => {
    const extraPrice = selectedMilk.includes('+₹40') ? 40 : 0;
    const modifiedItem = {
      ...item,
      price: item.price + extraPrice,
    };

    onAddToCart(
      modifiedItem,
      quantity,
      baristaNotes.trim(),
      item.options?.milkChoices ? selectedMilk : undefined,
      item.options?.temperature ? selectedTemp : undefined,
      item.options?.sugarLevel ? selectedSugar : undefined
    );

    setIsAddedRecently(true);
    setTimeout(() => {
      setIsAddedRecently(false);
      onClose();
    }, 500);
  };

  const calculatedUnitPrice = item.price + (selectedMilk.includes('+₹40') ? 40 : 0);

  return (
    <div id="dish-detail-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div
        id="dish-detail-card"
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-2xl pb-safe"
      >
        {/* Close */}
        <button
          id="close-dish-modal-btn"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm hover:bg-white hover:text-stone-900 active:scale-95 transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-stone-100">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div
            className={`absolute top-3.5 left-3.5 flex h-5 w-5 items-center justify-center rounded border bg-white/95 p-0.5 shadow-2xs ${item.isVeg ? 'border-emerald-600' : 'border-rose-600'
              }`}
          >
            <div className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="font-cinzel text-lg font-bold text-stone-900">
                {item.name}
              </h3>
              <span className="font-cinzel text-base font-bold text-stone-900 ml-2">
                ₹{calculatedUnitPrice}
              </span>
            </div>
            {item.subName && (
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {item.subName}
              </p>
            )}
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Roast / Prep metadata */}
          <div className="flex flex-wrap items-center gap-3 py-2 border-y border-stone-100 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              {item.prepTime}
            </span>
            {item.roastProfile && (
              <span className="flex items-center gap-1">
                <Coffee className="h-3.5 w-3.5 text-stone-400" />
                {item.roastProfile}
              </span>
            )}
          </div>

          {/* Temperature Choice (Hot / Iced) */}
          {item.options?.temperature && item.options.temperature.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                Temperature
              </label>
              <div className="grid grid-cols-2 gap-2">
                {item.options.temperature.map((temp) => (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setSelectedTemp(temp)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-colors ${selectedTemp === temp
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milk Options */}
          {item.options?.milkChoices && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                Choice of Milk
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {item.options.milkChoices.map((milk) => (
                  <button
                    key={milk}
                    type="button"
                    onClick={() => setSelectedMilk(milk)}
                    className={`rounded-xl border p-2 text-left text-xs transition-colors ${selectedMilk === milk
                        ? 'border-stone-900 bg-stone-50 text-stone-900 font-semibold'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    {milk}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sugar Options */}
          {item.options?.sugarLevel && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                Sweetness Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {item.options.sugarLevel.map((sugar) => (
                  <button
                    key={sugar}
                    type="button"
                    onClick={() => setSelectedSugar(sugar)}
                    className={`rounded-xl border p-1.5 text-center text-xs transition-colors ${selectedSugar === sugar
                        ? 'border-stone-900 bg-stone-50 text-stone-900 font-semibold'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    {sugar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barista notes */}
          <div>
            <label className="text-xs font-medium text-stone-700 block mb-1">Special Instructions</label>
            <input
              id="dish-notes-input"
              type="text"
              value={baristaNotes}
              onChange={(e) => setBaristaNotes(e.target.value)}
              placeholder="Note for barista (e.g. extra hot, half shot, separate plate)"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center text-stone-600 hover:text-stone-900 active:bg-stone-200 rounded-lg transition-colors"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-stone-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="flex h-9 w-9 items-center justify-center text-stone-600 hover:text-stone-900 active:bg-stone-200 rounded-lg transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            id="confirm-add-to-cart-btn"
            type="button"
            onClick={handleAdd}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 active:scale-95 transition-all shadow-xs"
          >
            {isAddedRecently ? (
              <>
                <Check className="h-4 w-4" />
                <span>Added to Order!</span>
              </>
            ) : (
              <>
                <span>Add to Order</span>
                <span>•</span>
                <span className="font-bold">₹{calculatedUnitPrice * quantity}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
