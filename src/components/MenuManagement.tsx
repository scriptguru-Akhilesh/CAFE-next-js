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
  /** When used inside /admin layout — hides duplicate chrome (header, tabs, theme). */
  variant?: 'standalone' | 'admin';
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
  variant = 'standalone',
}) => {
  const isAdminShell = variant === 'admin';
  const [activeTab, setActiveTab] = useState<'menu' | 'tables'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
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

  const pageTitle = activeTab === 'tables' ? 'Tables & QR Stands' : 'Dish Catalog';
  const pageSubtitle =
    activeTab === 'tables'
      ? 'Assign table numbers, print QR stands, and preview the guest ordering flow.'
      : 'Manage dishes, prices, and live stock availability.';

  return (
    <div
      id="menu-management-view"
      className={
        isAdminShell
          ? 'text-stone-900 dark:text-stone-100 pb-8 transition-colors duration-200'
          : 'min-h-screen bg-[#f7f5f1] text-stone-900 dark:bg-stone-950 dark:text-stone-100 pb-16 transition-colors duration-200'
      }
    >
      {/* Toast */}
      {successToast && (
        <div
          className={`fixed right-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-xs font-bold text-white shadow-2xl dark:bg-stone-800 ${isAdminShell ? 'top-20' : 'top-4'}`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="truncate">{successToast}</span>
        </div>
      )}

      {isAdminShell && (
        <div className="mb-6 flex flex-col gap-4 border-b border-stone-200/80 pb-5 dark:border-stone-800 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-black tracking-tight text-stone-900 dark:text-white sm:text-2xl">
              {pageTitle}
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-stone-500 dark:text-stone-400 sm:text-sm">
              {pageSubtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {activeTab === 'menu' && (
              <>
                <button
                  id="refresh-menu-btn"
                  onClick={refreshLocalMenu}
                  disabled={isLoading}
                  title="Refresh Menu"
                  aria-label="Refresh menu"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  id="owner-add-item-btn"
                  onClick={handleOpenAddModal}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-stone-900 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.98] dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4" />
                  Add Menu Item
                </button>
              </>
            )}
            {activeTab === 'tables' && onOpenQRStand && (
              <button
                type="button"
                id="admin-open-qr-lounge-btn"
                onClick={() => onOpenQRStand()}
                className="flex h-10 items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-4 text-xs font-bold text-amber-950 shadow-sm transition-all hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
              >
                <QrCode className="h-4 w-4" />
                Open QR Lounge
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header — standalone only (admin uses layout shell) */}
      {!isAdminShell && (
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90 sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-amber-400 shadow-sm dark:bg-amber-500 dark:text-stone-950">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-black tracking-tight text-stone-900 dark:text-white sm:text-lg">
                  Menu Management
                </h1>
                <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-300 sm:inline-flex">
                  Owner Portal
                </span>
              </div>
              <p className="hidden text-[11px] text-stone-500 dark:text-stone-400 sm:block">
                Manage dishes, prices and live stock availability
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              id="refresh-menu-btn"
              onClick={refreshLocalMenu}
              disabled={isLoading}
              title="Refresh Menu"
              aria-label="Refresh menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="owner-add-item-btn"
              onClick={handleOpenAddModal}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.98] dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 sm:h-10 sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New Menu Item</span>
              <span className="sm:hidden">Add Item</span>
            </button>

            <button
              id="owner-view-menu-btn"
              onClick={() => onBackToMenu()}
              title="Customer Menu"
              aria-label="Customer Menu"
              className="hidden h-9 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 md:flex"
            >
              <Eye className="h-3.5 w-3.5" />
              Customer Menu
            </button>

            <button
              id="owner-view-kitchen-btn"
              onClick={onSwitchToKitchen}
              title="Kitchen"
              aria-label="Kitchen"
              className="hidden h-9 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 lg:flex"
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Kitchen
            </button>

            <ThemeToggle className="dark:border-stone-800 dark:bg-stone-900" />
          </div>
        </div>
      </header>
      )}

      {/* Main */}
      <main
        className={
          isAdminShell
            ? 'space-y-5'
            : 'mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-5'
        }
      >
        {/* Tabs — standalone only */}
        {!isAdminShell && (
        <div className="inline-flex w-full max-w-fit items-center gap-1 rounded-2xl border border-stone-200 bg-white p-1 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <button
            id="owner-tab-menu-items"
            onClick={() => setActiveTab('menu')}
            className={`flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all sm:px-4 sm:text-sm ${activeTab === 'menu'
              ? 'bg-stone-900 text-white shadow-sm dark:bg-amber-500 dark:text-stone-950'
              : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
              }`}
          >
            <Layers className="h-4 w-4" />
            <span>Dish Catalog ({menu.length})</span>
          </button>

          <button
            id="owner-tab-tables-qr"
            onClick={() => setActiveTab('tables')}
            className={`flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all sm:px-4 sm:text-sm ${activeTab === 'tables'
              ? 'bg-stone-900 text-white shadow-sm dark:bg-amber-500 dark:text-stone-950'
              : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
              }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Tables & QR ({tables.length})</span>
          </button>
        </div>
        )}

        {activeTab === 'tables' ? (
          <TableManagement
            variant={isAdminShell ? 'admin' : 'default'}
            onSelectTableForPreview={(tbl) => onBackToMenu(tbl)}
            onOpenQRStandForTable={onOpenQRStand}
          />
        ) : (
          <>
            {/* Summary cards */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    Total Items
                  </span>
                  <ShoppingBag className="h-4 w-4 text-stone-400 dark:text-stone-500" />
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-stone-900 dark:text-white">
                  {menu.length}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    In Stock
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-emerald-900 dark:text-emerald-200">
                  {inStockCount}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Sold Out
                  </span>
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-amber-900 dark:text-amber-200">
                  {outOfStockCount}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    Categories
                  </span>
                  <Layers className="h-4 w-4 text-stone-400 dark:text-stone-500" />
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-stone-900 dark:text-white">
                  {categories.length}
                </div>
              </div>
            </section>

            {/* Search / filters */}
            <section className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                  <input
                    id="owner-search-input"
                    type="text"
                    placeholder="Search dish, category or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:bg-stone-900"
                  />
                </div>

                <div className="flex w-full overflow-x-auto rounded-xl bg-stone-100 p-1 dark:bg-stone-800 lg:w-auto">
                  {([
                    ['all', `All (${menu.length})`],
                    ['in_stock', `In Stock (${inStockCount})`],
                    ['out_of_stock', `Sold Out (${outOfStockCount})`],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setStockFilter(value)}
                      className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold transition-all ${stockFilter === value
                        ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-white'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex gap-1.5 overflow-x-auto border-t border-stone-100 pt-3 no-scrollbar dark:border-stone-800">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${selectedCategory === 'All'
                    ? 'bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                    }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${selectedCategory === cat
                      ? 'bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                      }`}
                  >
                    {cat} ({menu.filter((m) => m.category === cat).length})
                  </button>
                ))}
              </div>
            </section>

            {/* List heading */}
            <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black text-stone-900 dark:text-white">Menu Items</h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Showing {filteredList.length} of {menu.length} items
                </p>
              </div>
              <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                Tap stock status to mark an item sold out
              </span>
            </div>

            {/* Menu list */}
            {filteredList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center shadow-sm dark:border-stone-700 dark:bg-stone-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
                  <Coffee className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-sm font-black text-stone-800 dark:text-stone-200">No menu items found</h3>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                  Try changing your search or filters, or add a new item to the menu.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-stone-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {filteredList.map((item) => {
                  const isAvailable = item.available !== false;

                  return (
                    <article
                      key={item.id}
                      id={`owner-item-${item.id}`}
                      className={`group rounded-3xl border p-3.5 sm:p-4 transition-all ${isAvailable
                        ? 'border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700'
                        : 'border-stone-200/80 bg-stone-50/80 opacity-80 dark:border-stone-800 dark:bg-stone-950/70'
                        }`}
                    >
                      <div className="flex gap-3.5">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800 sm:h-28 sm:w-28">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${!isAvailable ? 'grayscale' : ''
                                }`}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-stone-500">
                              <Coffee className="h-7 w-7" />
                            </div>
                          )}

                          {item.badge && (
                            <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-md bg-stone-900/90 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white backdrop-blur-sm dark:bg-amber-500 dark:text-stone-950">
                              {item.badge}
                            </span>
                          )}

                          <div
                            title={item.isVeg !== false ? 'Vegetarian' : 'Non-Vegetarian'}
                            className={`absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-md border bg-white/95 p-0.5 shadow-sm dark:bg-stone-950/95 ${item.isVeg !== false ? 'border-emerald-600' : 'border-rose-600'
                              }`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${item.isVeg !== false ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-black leading-tight text-stone-900 dark:text-white">
                                {item.name}
                              </h3>
                              <div className="mt-1 inline-flex max-w-full rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-300">
                                <span className="truncate">{item.category || 'General'}</span>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-base font-black tracking-tight text-stone-900 dark:text-amber-400">
                                ₹{item.price}
                              </div>
                              {item.prepTime && (
                                <div className="mt-0.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                                  {item.prepTime}
                                </div>
                              )}
                            </div>
                          </div>

                          {item.description && (
                            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
                        <button
                          id={`toggle-stock-${item.id}`}
                          onClick={() => handleToggleStock(item.id, item.available)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${isAvailable
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60'
                            : 'border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                            }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          {isAvailable ? 'In Stock' : 'Sold Out'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            id={`edit-item-${item.id}`}
                            onClick={() => handleOpenEditModal(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] font-bold text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            id={`delete-item-${item.id}`}
                            onClick={() => handleDeleteItem(item)}
                            title="Remove item"
                            aria-label={`Delete ${item.name}`}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white p-2 text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/20 dark:bg-stone-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          id="menu-item-modal-overlay"
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 p-3 backdrop-blur-sm sm:p-5"
        >
          <div className="flex min-h-full items-center justify-center py-4 sm:py-8">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
              <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close modal"
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="pr-12">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    {editingItem ? 'Edit Item' : 'New Dish / Beverage'}
                  </div>
                  <h2 className="mt-2 text-lg font-black tracking-tight text-stone-900 dark:text-white">
                    {editingItem ? `Edit "${editingItem.name}"` : 'Add Menu Item'}
                  </h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Keep your customer QR menu updated with the latest dish details and pricing.
                  </p>
                </div>
              </div>

              <div className="max-h-[calc(100vh-7rem)] overflow-y-auto px-5 py-5 sm:px-6">
                {formError && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveItem} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="form-item-name" className="mb-1.5 block text-xs font-bold text-stone-800 dark:text-stone-200">
                        Item Name *
                      </label>
                      <input
                        id="form-item-name"
                        type="text"
                        required
                        placeholder="e.g. Masala Chai, Filter Coffee, Paneer Roll"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="form-item-price" className="mb-1.5 block text-xs font-bold text-stone-800 dark:text-stone-200">
                        Price in INR (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-500 dark:text-stone-400">₹</span>
                        <input
                          id="form-item-price"
                          type="number"
                          required
                          min="0"
                          step="1"
                          placeholder="180"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-8 pr-3 text-sm font-mono font-bold text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="form-item-category" className="mb-1.5 block text-xs font-bold text-stone-800 dark:text-stone-200">
                        Category
                      </label>
                      <select
                        id="form-item-category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 outline-none transition-colors focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-900"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="custom">+ Add New Category...</option>
                      </select>
                    </div>
                  </div>

                  {formData.category === 'custom' && (
                    <div>
                      <label htmlFor="form-custom-category" className="mb-1.5 block text-xs font-bold text-stone-800 dark:text-stone-200">
                        New Category Name
                      </label>
                      <input
                        id="form-custom-category"
                        type="text"
                        placeholder="e.g. Quick Bites, Smoothies, Mocktails"
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-900"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="form-item-desc" className="mb-1.5 block text-xs font-bold text-stone-800 dark:text-stone-200">
                      Description
                    </label>
                    <textarea
                      id="form-item-desc"
                      rows={3}
                      placeholder="Ingredients, preparation notes, flavors..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs leading-relaxed text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-900"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="form-item-preptime" className="mb-1.5 block text-xs font-bold text-stone-800 dark:text-stone-200">
                        Prep Time
                      </label>
                      <input
                        id="form-item-preptime"
                        type="text"
                        placeholder="3-5 min"
                        value={formData.prepTime}
                        onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                        className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="form-item-badge" className="mb-1.5 block text-xs font-bold text-stone-800 dark:text-stone-200">
                        Badge / Tag
                      </label>
                      <input
                        id="form-item-badge"
                        type="text"
                        placeholder="Bestseller, New"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-900"
                      />
                    </div>

                    <div>
                      <span className="mb-1.5 block text-xs font-bold text-stone-800 dark:text-stone-200">Dietary Type</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isVeg: true })}
                          className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all ${formData.isVeg
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-stone-200 bg-stone-50 text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400'
                            }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          Veg
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isVeg: false })}
                          className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all ${!formData.isVeg
                            ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'border-stone-200 bg-stone-50 text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400'
                            }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-rose-600" />
                          Non-Veg
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label htmlFor="form-item-image" className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        Item Photo
                      </label>
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">URL or preset</span>
                    </div>
                    <input
                      id="form-item-image"
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-mono text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-900"
                    />

                    <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700">
                      <div className="flex items-center justify-between bg-stone-50 px-3 py-2 dark:bg-stone-800">
                        <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300">Quick preset photos</span>
                        <span className="text-[10px] text-stone-400">Select one</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6">
                        {IMAGE_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData({ ...formData, image: preset.url })}
                            title={preset.name}
                            className={`relative overflow-hidden rounded-xl border transition-all ${formData.image === preset.url
                              ? 'border-amber-500 ring-2 ring-amber-500/30'
                              : 'border-stone-200 hover:border-stone-400 dark:border-stone-700 dark:hover:border-stone-500'
                              }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="h-14 w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-1 text-center text-[8px] font-bold text-white">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-700 dark:bg-stone-800">
                    <div>
                      <span className="block text-xs font-black text-stone-900 dark:text-white">Available In Stock</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                        Customers can order this item while it is enabled.
                      </span>
                    </div>
                    <input
                      id="form-item-available"
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="h-5 w-5 shrink-0 cursor-pointer rounded border-stone-300 text-amber-600 focus:ring-amber-500 dark:border-stone-600"
                    />
                  </label>

                  <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="h-11 rounded-xl border border-stone-200 bg-white px-5 text-xs font-bold text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      id="save-item-submit-btn"
                      type="submit"
                      className="h-11 flex-1 rounded-xl bg-stone-900 px-5 text-sm font-black text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.99] dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
                    >
                      {editingItem ? 'Update Menu Item' : 'Add to Menu (₹)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
