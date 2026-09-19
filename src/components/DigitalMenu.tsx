import React, { useState, useMemo } from 'react';
import { 
  Search, X, Clock, Plus, Minus, ShoppingBag, 
  Info, QrCode, Coffee, ArrowRight
} from 'lucide-react';
import { MenuItem, CategoryId, CartItem } from '../types';
import { CAFE_INFO, CAFE_MENU_ITEMS } from '../data/cafeData';

interface DigitalMenuProps {
  onSelectItem: (item: MenuItem) => void;
  cartItems: CartItem[];
  onAddToCart: (item: MenuItem, quantity: number, notes?: string, milk?: string, temp?: string) => void;
  onUpdateCartQty: (itemId: string, newQty: number) => void;
  onOpenCart: () => void;
  onOpenServices: () => void;
  onOpenQRScanner: () => void;
  onBackToWelcome: () => void;
  activeCategory?: CategoryId;
  onSelectCategory?: (category: CategoryId) => void;
}

export const DigitalMenu: React.FC<DigitalMenuProps> = ({
  onSelectItem,
  cartItems,
  onAddToCart,
  onUpdateCartQty,
  onOpenCart,
  onOpenServices,
  onBackToWelcome,
  activeCategory,
  onSelectCategory,
}) => {
  const [internalCategory, setInternalCategory] = useState<CategoryId>('all');
  const selectedCategory = activeCategory ?? internalCategory;
  const setSelectedCategory = onSelectCategory ?? setInternalCategory;
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyVeg, setOnlyVeg] = useState(false);

  const categories = [
    { id: 'all' as CategoryId, label: 'All Items' },
    { id: 'coffee' as CategoryId, label: 'Specialty Coffee' },
    { id: 'brews' as CategoryId, label: 'Manual Brews' },
    { id: 'teas-beverages' as CategoryId, label: 'Teas & Coolers' },
    { id: 'breakfast-toasts' as CategoryId, label: 'Toasts & Eggs' },
    { id: 'sandwiches-mains' as CategoryId, label: 'Sandwiches' },
    { id: 'bakery-desserts' as CategoryId, label: 'Bakery & Treats' },
  ];

  const getItemCartQty = (itemId: string) => {
    const found = cartItems.find((i) => i.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  // Category counts based on current veg filter
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    CAFE_MENU_ITEMS.forEach((item) => {
      if (onlyVeg && !item.isVeg) return;
      counts.all = (counts.all || 0) + 1;
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [onlyVeg]);

  const filteredItems = useMemo(() => {
    return CAFE_MENU_ITEMS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      if (onlyVeg && !item.isVeg) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesSub = item.subName ? item.subName.toLowerCase().includes(q) : false;
        const matchesRoast = item.roastProfile ? item.roastProfile.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesDesc && !matchesSub && !matchesRoast) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, searchQuery, onlyVeg]);

  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);

  return (
    <div id="digital-menu-container" className="min-h-screen bg-stone-50 text-stone-900 pb-36 sm:pb-28">
      {/* Cover Header Banner */}
      <div className="relative h-36 sm:h-48 md:h-56 w-full overflow-hidden bg-stone-950">
        <img
          src={CAFE_INFO.coverImage}
          alt={CAFE_INFO.name}
          className="h-full w-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-6 sm:right-6 max-w-6xl mx-auto text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-amber-300">
              {CAFE_INFO.tableNumber} • Table Order
            </span>
            <span className="text-stone-400">•</span>
            <span className="text-[10px] sm:text-[11px] text-stone-300">
              Fresh Kitchen & Barista
            </span>
          </div>
          <h2 className="font-cinzel text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">
            Artisanal Roastery & Kitchen
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-0.5 max-w-xl line-clamp-1 sm:line-clamp-2">
            Specialty coffees, slow pourovers, fresh sourdough toasts, and hand-crafted breakfast plates.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 sm:px-6 pt-3 sm:pt-4 space-y-3">
        
        {/* Search & Vegetarian Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              id="menu-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coffee, brews, toasts, bakes..."
              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-9 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-800 focus:outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Vegetarian Filter Button */}
          <button
            id="filter-veg-toggle"
            onClick={() => setOnlyVeg(!onlyVeg)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all shadow-2xs shrink-0 active:scale-95 ${
              onlyVeg
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded border border-emerald-600 p-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${onlyVeg ? 'bg-emerald-600' : 'bg-transparent'}`} />
            </span>
            <span>Vegetarian Only</span>
          </button>
        </div>

        {/* Sticky Category Bar with Count Badges */}
        <div className="sticky top-14 z-20 bg-stone-50/95 backdrop-blur-md py-2 -mx-3 px-3 sm:-mx-6 sm:px-6 border-b border-stone-200/60 shadow-2xs">
          <div className="overflow-x-auto no-scrollbar touch-pan-x flex items-center gap-1.5 sm:gap-2 min-w-max">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? 'bg-stone-900 text-white font-semibold shadow-xs'
                      : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 shadow-2xs'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Result Meta */}
        <div className="flex items-center justify-between text-xs text-stone-500 px-1 pt-1">
          <span>Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</span>
          {(searchQuery || onlyVeg || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setOnlyVeg(false);
                setSelectedCategory('all');
              }}
              className="text-stone-800 font-semibold underline text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Cafe Menu Dishes List - Responsive Grid (1 col on mobile, 2 col on tablet, 3 col on desktop) */}
        <div className="pt-1">
          {filteredItems.length === 0 ? (
            <div id="no-dishes-found" className="py-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
              <Coffee className="mx-auto h-8 w-8 text-stone-400 mb-2" />
              <p className="text-xs font-semibold text-stone-800">No items match your search or filter.</p>
              <p className="text-[11px] text-stone-400 mt-1">Try clearing your search query or toggling off the vegetarian filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setOnlyVeg(false);
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs text-stone-900 underline font-semibold"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const currentQty = getItemCartQty(item.id);

                return (
                  <div
                    key={item.id}
                    id={`dish-card-${item.id}`}
                    className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-3 sm:p-3.5 shadow-xs hover:border-stone-300 hover:shadow-sm transition-all"
                  >
                    <div 
                      onClick={() => onSelectItem(item)}
                      className="flex gap-3 cursor-pointer group"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div 
                          className={`absolute top-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded border bg-white/95 p-0.5 shadow-2xs ${
                            item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-stone-900 leading-snug line-clamp-1 group-hover:text-amber-900 transition-colors">
                          {item.name}
                        </h3>

                        {item.subName && (
                          <p className="text-[10px] text-stone-400 font-medium line-clamp-1">
                            {item.subName}
                          </p>
                        )}

                        <p className="mt-1 text-[11px] text-stone-500 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-stone-400">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {item.prepTime}
                          </span>
                          {item.isPopular && (
                            <span className="text-amber-700 font-medium truncate">
                              • Popular Pick
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-cinzel text-sm sm:text-base font-bold text-stone-900">
                          ₹{item.price}
                        </span>
                        {item.customizable && (
                          <span className="inline-block text-[9px] text-amber-700 font-medium ml-1.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                            Customizable
                          </span>
                        )}
                      </div>

                      <div className="shrink-0">
                        {currentQty === 0 ? (
                          <button
                            id={`add-btn-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(item, 1);
                            }}
                            className="flex items-center gap-1 rounded-xl bg-stone-900 px-3.5 py-1.5 min-h-[38px] text-xs font-semibold text-white hover:bg-stone-800 active:scale-95 transition-all shadow-2xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className="flex items-center rounded-lg border border-stone-300 bg-stone-50 p-0.5 shadow-2xs">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateCartQty(item.id, currentQty - 1);
                              }}
                              className="flex h-7 w-7 items-center justify-center text-stone-600 hover:text-stone-900 active:bg-stone-200 rounded"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-stone-900">
                              {currentQty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateCartQty(item.id, currentQty + 1);
                              }}
                              className="flex h-7 w-7 items-center justify-center text-stone-600 hover:text-stone-900 active:bg-stone-200 rounded"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar (Positioned above the mobile bottom nav without overlap) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-[68px] sm:bottom-5 inset-x-3 sm:inset-x-4 z-30 max-w-lg mx-auto">
          <div className="flex items-center justify-between rounded-2xl bg-stone-900 px-4 py-3 text-white shadow-xl border border-stone-800">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-medium text-stone-300 block truncate">
                {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} • Table 07
              </span>
              <span className="font-cinzel text-sm sm:text-base font-bold text-white">
                ₹{totalCartAmount} <span className="text-[10px] font-normal text-stone-400">+ GST</span>
              </span>
            </div>

            <button
              id="view-cart-bottom-bar-btn"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-stone-900 hover:bg-stone-100 active:scale-95 transition-all shrink-0"
            >
              <span>View Order</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
