'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Search, CheckCircle2,
  X, Coffee, Sparkles, AlertCircle, ArrowLeft,
  UtensilsCrossed, ShoppingBag, Eye, RefreshCw, Layers,
  QrCode, Users, MapPin
} from 'lucide-react';
import { SimpleMenuItem, CafeTable } from '../types';
import { STATIC_MENU } from '../data/simpleMenu';
import { ThemeToggle } from './ThemeToggle';
import { TableManagement } from './TableManagement';
import { tableStorage } from '../utils/tableStorage';
import { menuStorage } from '../utils/menuStorage';

interface MenuManagementProps {
  onBackToMenu: (table?: string) => void;
  onSwitchToKitchen: () => void;
  onOpenQRStand?: (table?: string) => void;
  onMenuUpdated?: (menu: SimpleMenuItem[]) => void;
  initialTab?: 'menu' | 'tables';
}

// Curated high-quality image presets for quick selection
const IMAGE_PRESETS = [
  { name: 'Espresso', category: 'Coffee', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80' },
  { name: 'Latte / Cappuccino', category: 'Coffee', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80' },
  { name: 'Iced Coffee', category: 'Iced & Tea', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80' },
  { name: 'Caramel Macchiato', category: 'Iced & Tea', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80' },
  { name: 'Masala Chai', category: 'Iced & Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' },
  { name: 'Matcha Latte', category: 'Iced & Tea', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Croissant', category: 'Bakery & Food', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Chocolate Pastry', category: 'Bakery & Food', url: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=600&q=80' },
  { name: 'Avocado Toast', category: 'Bakery & Food', url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sandwich / Burger', category: 'Bakery & Food', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80' },
  { name: 'Cheesecake', category: 'Bakery & Food', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fries / Snack', category: 'Bakery & Food', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80' },
];

export const MenuManagement: React.FC<MenuManagementProps> = ({
  onBackToMenu,
  onSwitchToKitchen,
  onOpenQRStand,
  onMenuUpdated,
  initialTab = 'menu',
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'tables'>(initialTab);
  const [tables, setTables] = useState<CafeTable[]>(() => tableStorage.getTables());

  const [menu, setMenu] = useState<SimpleMenuItem[]>(() => {
    const storageMenu = menuStorage.getMenu();
    if (storageMenu.length > 0) return storageMenu;

    const saved = typeof window !== 'undefined' ? localStorage.getItem('corner_roastery_menu') : null;
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return STATIC_MENU;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Subscribe to table changes
  useEffect(() => {
    const unsub = tableStorage.subscribe((updated) => {
      setTables(updated);
    });
    return unsub;
  }, []);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SimpleMenuItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Coffee',
    customCategory: '',
    description: '',
    image: IMAGE_PRESETS[0].url,
    badge: '',
    prepTime: '3-5 min',
    available: true,
    isVeg: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(false);
    const unsubscribe = menuStorage.subscribe((updated) => {
      setMenu(updated);
      onMenuUpdated?.(updated);
    });
    return unsubscribe;
  }, [onMenuUpdated]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const refreshLocalMenu = () => {
    const currentMenu = menuStorage.getMenu();
    setMenu(currentMenu);
    onMenuUpdated?.(currentMenu);
    showToast('Menu refreshed');
  };

  // Derive unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    menu.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [menu]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      price: '',
      category: categories[0] || 'Coffee',
      customCategory: '',
      description: '',
      image: IMAGE_PRESETS[0].url,
      badge: '',
      prepTime: '3-5 min',
      available: true,
      isVeg: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: SimpleMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: String(item.price),
      category: item.category || 'Coffee',
      customCategory: '',
      description: item.description || '',
      image: item.image || IMAGE_PRESETS[0].url,
      badge: item.badge || '',
      prepTime: item.prepTime || '3-5 min',
      available: item.available !== false,
      isVeg: item.isVeg !== false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Please enter an item name');
      return;
    }
    const parsedPrice = Number(formData.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Please enter a valid price in ₹ (INR)');
      return;
    }

    const finalCategory = formData.customCategory.trim() ? formData.customCategory.trim() : formData.category;

    const payload = {
      name: formData.name.trim(),
      price: Math.round(parsedPrice),
      category: finalCategory,
      description: formData.description.trim(),
      image: formData.image.trim(),
      badge: formData.badge.trim() || undefined,
      prepTime: formData.prepTime.trim(),
      available: formData.available,
      isVeg: formData.isVeg,
    };

    try {
      if (editingItem) {
        const updated = menu.map((m) => m.id === editingItem.id ? { ...m, ...payload } : m);
        menuStorage.setMenu(updated);
        setMenu(updated);
        localStorage.setItem('corner_roastery_menu', JSON.stringify(updated));
        onMenuUpdated?.(updated);
        showToast(`Updated "${payload.name}" successfully`);
      } else {
        const newItem: SimpleMenuItem = {
          id: `item-${Date.now()}`,
          ...payload,
        };
        const updated = [newItem, ...menu];
        menuStorage.setMenu(updated);
        setMenu(updated);
        localStorage.setItem('corner_roastery_menu', JSON.stringify(updated));
        onMenuUpdated?.(updated);
        showToast(`Added "${payload.name}" to menu!`);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save menu item:', err);
      setFormError('Failed to save item locally. Please try again.');
    }
  };

  // Toggle in-stock / out-of-stock
  const handleToggleStock = async (itemId: string, currentAvailable?: boolean) => {
    const newStatus = currentAvailable === false ? true : false;

    const updated = menu.map((m) => m.id === itemId ? { ...m, available: newStatus } : m);
    menuStorage.setMenu(updated);
    setMenu(updated);
    localStorage.setItem('corner_roastery_menu', JSON.stringify(updated));
    onMenuUpdated?.(updated);
    showToast(newStatus ? 'Item marked In Stock' : 'Item marked Sold Out');
  };

  // Delete menu item
  const handleDeleteItem = async (item: SimpleMenuItem) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from the menu?`)) {
      return;
    }

    const updated = menu.filter((m) => m.id !== item.id);
    menuStorage.setMenu(updated);
    setMenu(updated);
    localStorage.setItem('corner_roastery_menu', JSON.stringify(updated));
    onMenuUpdated?.(updated);
    showToast(`Removed "${item.name}" from menu`);
  };

  // Filtered menu list
  const filteredList = useMemo(() => {
    return menu.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'in_stock' && item.available !== false) ||
        (stockFilter === 'out_of_stock' && item.available === false);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [menu, searchQuery, selectedCategory, stockFilter]);

  const inStockCount = menu.filter((m) => m.available !== false).length;
  const outOfStockCount = menu.length - inStockCount;

  return (
    <div id="menu-management-view" className="min-h-screen bg-stone-100/70 text-stone-900 dark:bg-stone-950 dark:text-stone-100 pb-20 transition-colors duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-stone-900 dark:bg-stone-800 px-4 py-3 text-xs font-bold text-white shadow-2xl border border-stone-700 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md px-4 py-3.5 shadow-2xs transition-colors">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-stone-950 font-black shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                  Menu Management
                </h1>
                <span className="rounded-md bg-stone-900 dark:bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-amber-300 dark:text-stone-950 uppercase tracking-wide">
                  Owner Portal
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Add new dishes, update prices in ₹, and toggle stock availability in real time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-menu-btn"
              onClick={refreshLocalMenu}
              disabled={isLoading}
              title="Refresh Menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="owner-add-item-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 px-4 py-2 text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Menu Item</span>
            </button>

            <button
              id="owner-view-menu-btn"
              onClick={() => onBackToMenu()}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-3 py-2 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              <span className="hidden sm:inline">Customer Menu</span>
            </button>

            <button
              id="owner-view-kitchen-btn"
              onClick={onSwitchToKitchen}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-3 py-2 text-xs font-semibold shadow-2xs transition-colors"
            >
              <UtensilsCrossed className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              <span className="hidden sm:inline">Kitchen</span>
            </button>

            <ThemeToggle className="dark:bg-stone-900 dark:border-stone-800" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 pt-4 space-y-4">
        {/* Owner Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            id="owner-tab-menu-items"
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] whitespace-nowrap ${activeTab === 'menu'
                ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
          >
            <Layers className="h-4 w-4" />
            <span>Dish Catalog ({menu.length})</span>
          </button>

          <button
            id="owner-tab-tables-qr"
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] whitespace-nowrap ${activeTab === 'tables'
                ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Tables & QR Stands ({tables.length})</span>
          </button>
        </div>

        {activeTab === 'tables' ? (
          <TableManagement
            onSelectTableForPreview={(tbl) => onBackToMenu(tbl)}
            onOpenQRStandForTable={onOpenQRStand}
          />
        ) : (
          <>
            {/* KPI Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 shadow-2xs">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Total Items</span>
                <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white mt-0.5">{menu.length}</div>
              </div>
              <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 shadow-2xs">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">In Stock</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">{inStockCount}</div>
              </div>
              <div className="rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/30 p-3.5 shadow-2xs">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Sold Out</span>
                <div className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 mt-0.5">{outOfStockCount}</div>
              </div>
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 shadow-2xs">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Categories</span>
                <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white mt-0.5">{categories.length}</div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 sm:p-4 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
                  <input
                    id="owner-search-input"
                    type="text"
                    placeholder="Search dish name, category, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-600 focus:bg-white dark:focus:bg-stone-900 transition-colors"
                  />
                </div>

                {/* Stock Filter */}
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setStockFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${stockFilter === 'all' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                      }`}
                  >
                    All ({menu.length})
                  </button>
                  <button
                    onClick={() => setStockFilter('in_stock')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${stockFilter === 'in_stock' ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-2xs font-bold' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                      }`}
                  >
                    In Stock ({inStockCount})
                  </button>
                  <button
                    onClick={() => setStockFilter('out_of_stock')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${stockFilter === 'out_of_stock' ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 shadow-2xs font-bold' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                      }`}
                  >
                    Sold Out ({outOfStockCount})
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === 'All'
                      ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-700'
                    }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                        ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-700'
                      }`}
                  >
                    {cat} ({menu.filter((m) => m.category === cat).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400 px-1">
                <span>Showing {filteredList.length} menu items</span>
                <span>Tap "In Stock" to toggle sold-out status</span>
              </div>

              {filteredList.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-12 text-center space-y-3">
                  <Coffee className="h-10 w-10 text-stone-300 dark:text-stone-600 mx-auto" />
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No menu items found</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                    No items match your filter criteria. Try clearing the search or adding a new menu item.
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 dark:bg-amber-500 px-4 py-2 text-xs font-bold text-white dark:text-stone-950 shadow-sm hover:bg-stone-800 dark:hover:bg-amber-400"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredList.map((item) => {
                    const isAvailable = item.available !== false;
                    return (
                      <div
                        key={item.id}
                        id={`owner-item-${item.id}`}
                        className={`rounded-2xl border bg-white dark:bg-stone-900 p-3.5 flex flex-col justify-between transition-all shadow-2xs ${!isAvailable
                            ? 'border-stone-200/70 dark:border-stone-800/70 bg-stone-50/70 dark:bg-stone-950/70 opacity-80'
                            : 'border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                          }`}
                      >
                        <div className="flex gap-3">
                          {/* Image Thumbnail */}
                          <div className="relative h-22 w-22 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className={`h-full w-full object-cover ${!isAvailable ? 'grayscale-[60%]' : ''}`}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-stone-400 dark:text-stone-500">
                                <Coffee className="h-6 w-6" />
                              </div>
                            )}

                            {/* Veg / Non-veg indicator dot */}
                            <div
                              title={item.isVeg !== false ? 'Vegetarian' : 'Non-Vegetarian'}
                              className={`absolute bottom-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded bg-white/95 dark:bg-stone-950/95 p-0.5 shadow-2xs border ${item.isVeg !== false ? 'border-emerald-600' : 'border-rose-600'
                                }`}
                            >
                              <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg !== false ? 'bg-emerald-600' : 'bg-rose-600'
                                }`} />
                            </div>

                            {item.badge && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-stone-900/90 dark:bg-amber-500 dark:text-stone-950 text-white font-bold text-[8px] uppercase tracking-wider backdrop-blur-xs">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {/* Content Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-snug truncate">
                                  {item.name}
                                </h3>
                                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-500/30 inline-block mt-0.5">
                                  {item.category || 'General'}
                                </span>
                              </div>

                              {/* Price in INR */}
                              <div className="text-right shrink-0">
                                <span className="font-mono text-base font-extrabold text-stone-900 dark:text-amber-400 block">
                                  ₹{item.price}
                                </span>
                                {item.prepTime && (
                                  <span className="text-[10px] text-stone-400 dark:text-stone-500 block font-medium">
                                    {item.prepTime}
                                  </span>
                                )}
                              </div>
                            </div>

                            {item.description && (
                              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1.5 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom Action Strip */}
                        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                          {/* Availability Toggle Switch */}
                          <button
                            id={`toggle-stock-${item.id}`}
                            onClick={() => handleToggleStock(item.id, item.available)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${isAvailable
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700 hover:bg-stone-300/80'
                              }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            <span>{isAvailable ? 'In Stock' : 'Sold Out'}</span>
                          </button>

                          {/* Edit and Delete Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`edit-item-${item.id}`}
                              onClick={() => handleOpenEditModal(item)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-semibold shadow-2xs transition-colors"
                            >
                              <Edit2 className="h-3 w-3 text-stone-500 dark:text-stone-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              id={`delete-item-${item.id}`}
                              onClick={() => handleDeleteItem(item)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold shadow-2xs transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ========================================================= */}
      {/* ADD / EDIT ITEM MODAL */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div
          id="menu-item-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 my-8 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-semibold mb-1 border border-amber-200/50 dark:border-amber-500/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                <span>{editingItem ? 'Edit Item' : 'New Dish / Beverage'}</span>
              </div>
              <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight">
                {editingItem ? `Edit "${editingItem.name}"` : 'Add Menu Item'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Changes update your live customer QR menu immediately in INR (₹).
              </p>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Item Name *
                </label>
                <input
                  id="form-item-name"
                  type="text"
                  required
                  placeholder="e.g. Masala Chai, Filter Coffee, Paneer Roll"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-500"
                />
              </div>

              {/* Price & Category in row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Price in INR */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Price in INR (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500 dark:text-stone-400 text-sm">
                      ₹
                    </span>
                    <input
                      id="form-item-price"
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="e.g. 180"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 pl-8 pr-3 py-2 text-sm text-stone-900 dark:text-stone-100 font-mono font-bold focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-500"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Category
                  </label>
                  <select
                    id="form-item-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-white dark:bg-stone-900">{c}</option>
                    ))}
                    <option value="custom" className="bg-white dark:bg-stone-900">+ Add New Category...</option>
                  </select>
                </div>
              </div>

              {/* If "Add New Category" selected */}
              {formData.category === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    New Category Name
                  </label>
                  <input
                    id="form-custom-category"
                    type="text"
                    placeholder="e.g. Quick Bites, Smoothies, Mocktails"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-500"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Description
                </label>
                <textarea
                  id="form-item-desc"
                  rows={2}
                  placeholder="Ingredients, preparation notes, flavors..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-500"
                />
              </div>

              {/* Prep Time, Badge, Diet in grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Prep Time
                  </label>
                  <input
                    id="form-item-preptime"
                    type="text"
                    placeholder="e.g. 3-5 min, Ready"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Badge / Tag
                  </label>
                  <input
                    id="form-item-badge"
                    type="text"
                    placeholder="e.g. Bestseller, New"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-500"
                  />
                </div>

                {/* Dietary Flag: Veg / Non-Veg */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Dietary Type
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVeg: true })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition-all ${formData.isVeg
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVeg: false })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition-all ${!formData.isVeg
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-rose-600" />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Image URL & Preset Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Item Photo
                </label>
                <input
                  id="form-item-image"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400 dark:focus:border-stone-500 font-mono mb-2"
                />

                {/* Quick Presets Picker */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                    Or pick a preset photo:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-28 overflow-y-auto p-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl">
                    {IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image: preset.url })}
                        className={`relative rounded-lg overflow-hidden border transition-all ${formData.image === preset.url
                            ? 'border-amber-500 ring-2 ring-amber-500 scale-95'
                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
                          }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-12 w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold py-0.5 truncate px-1 text-center">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Availability Toggle in Form */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">Available In Stock</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    If toggled off, customers cannot order this item
                  </span>
                </div>
                <input
                  id="form-item-available"
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  id="save-item-submit-btn"
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold text-sm hover:bg-stone-800 dark:hover:bg-amber-400 active:scale-98 transition-all shadow-md"
                >
                  {editingItem ? 'Update Menu Item' : 'Add to Menu (₹)'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
