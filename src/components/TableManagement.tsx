'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  QrCode,
  ArrowRight,
  Printer,
  Check,
  Copy,
  CheckCircle2,
  X,
  Users,
  Sparkles,
  ExternalLink,
  UtensilsCrossed,
  Activity,
} from 'lucide-react';
import { CafeTable, KitchenOrder } from '../types';
import { tableStorage } from '../utils/tableStorage';
import { orderStorage } from '../utils/orderStorage';

interface TableManagementProps {
  onSelectTableForPreview?: (tableNumber: string) => void;
  onOpenQRStandForTable?: (tableNumber: string) => void;
  variant?: 'default' | 'admin';
}

export const TableManagement: React.FC<TableManagementProps> = ({
  onSelectTableForPreview,
  onOpenQRStandForTable,
  variant = 'default',
}) => {
  const isAdminLayout = variant === 'admin';

  const [tables, setTables] = useState<CafeTable[]>(() => tableStorage.getTables());
  const [activeOrders, setActiveOrders] = useState<KitchenOrder[]>(() => orderStorage.getOrders());
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<CafeTable | null>(null);
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableNumberInput, setTableNumberInput] = useState('');

  const [isQRPreviewModalOpen, setIsQRPreviewModalOpen] = useState(false);
  const [selectedQRTable, setSelectedQRTable] = useState<CafeTable | null>(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const unsubTables = tableStorage.subscribe((updated) => setTables(updated));
    const unsubOrders = orderStorage.subscribe((orders) => setActiveOrders(orders));

    return () => {
      unsubTables();
      unsubOrders();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;

    const q = searchQuery.toLowerCase();
    return tables.filter(
      (table) =>
        table.name.toLowerCase().includes(q) ||
        table.number.toLowerCase().includes(q),
    );
  }, [tables, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingTable(null);

    const existingNums = tables
      .map((t) => parseInt(t.number, 10))
      .filter((n) => !isNaN(n));

    const nextNum =
      existingNums.length > 0
        ? Math.max(...existingNums) + 1
        : tables.length + 1;

    setTableNameInput(`Table ${nextNum}`);
    setTableNumberInput(String(nextNum));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (table: CafeTable) => {
    setEditingTable(table);
    setTableNameInput(table.name);
    setTableNumberInput(table.number);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = tableNameInput.trim();

    if (!finalName) {
      setFormError('Please enter a table name (e.g. Table 9, Patio Table)');
      return;
    }

    try {
      if (editingTable) {
        const updated = tableStorage.updateTable(
          editingTable.id,
          finalName,
          tableNumberInput,
        );

        if (updated) {
          showToast(`Updated "${finalName}"`);
        }
      } else {
        const created = tableStorage.addTable(
          finalName,
          tableNumberInput.trim() || undefined,
        );

        showToast(`Added "${created.name}" with QR stand`);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save table', err);
      setFormError('Failed to save table. Please try again.');
    }
  };

  const handleDeleteTable = (table: CafeTable) => {
    if (window.confirm(`Delete ${table.name}?`)) {
      tableStorage.deleteTable(table.id);
      showToast(`Removed ${table.name}`);
    }
  };

  const handleInspectQR = async (table: CafeTable) => {
    setSelectedQRTable(table);

    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';

    const orderUrl = `${origin}/order?table=${encodeURIComponent(
      table.number,
    )}`;

    try {
      const url = await QRCode.toDataURL(orderUrl, {
        width: 360,
        margin: 1.5,
        color: {
          dark: '#18181b',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      setGeneratedQRUrl(url);
      setIsQRPreviewModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR preview', err);
    }
  };

  const handleCopyTableLink = (tableNum: string) => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';

    const url = `${origin}/order?table=${encodeURIComponent(tableNum)}`;

    navigator.clipboard?.writeText(url);

    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);

    showToast(`Order URL copied for Table ${tableNum}`);
  };

  const activeTableOrderCount = useMemo(() => {
    const busy = new Set<string>();

    activeOrders.forEach((order) => {
      if (order.status !== 'Served') {
        busy.add(order.tableNumber);
      }
    });

    return busy.size;
  }, [activeOrders]);

  const idleTableCount = Math.max(
    0,
    tables.length - activeTableOrderCount,
  );

  const hasActiveOrder = (tableNum: string) =>
    activeOrders.some(
      (order) =>
        order.tableNumber === tableNum && order.status !== 'Served',
    );

  const toastPositionClass = isAdminLayout ? 'top-20' : 'top-5';

  return (
    <div
      id="table-management-panel"
      className={
        isAdminLayout
          ? 'min-h-full space-y-6'
          : 'min-h-full space-y-5'
      }
    >
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed right-4 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-xs font-bold text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3 duration-200 dark:border-amber-400/20 dark:bg-amber-500 dark:text-zinc-950 ${toastPositionClass}`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 dark:bg-zinc-950/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-zinc-950" />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <header
        className={
          isAdminLayout
            ? 'relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6'
            : 'rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6'
        }
      >
        {isAdminLayout && (
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
        )}

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-amber-400 shadow-lg dark:bg-amber-500 dark:text-zinc-950">
              <QrCode className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                  {isAdminLayout ? 'Operations' : 'Table setup'}
                </span>

                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {tables.length} {tables.length === 1 ? 'table' : 'tables'}
                </span>
              </div>

              <h1 className="truncate text-xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
                Tables & QR
              </h1>

              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">
                Manage table numbers, customer ordering links and printable QR stands from one place.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {onOpenQRStandForTable && tables[0] && (
              <button
                type="button"
                onClick={() => onOpenQRStandForTable(tables[0].number)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-black text-zinc-800 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <ExternalLink className="h-4 w-4 text-amber-500" />
                Preview Stand
              </button>
            )}

            <button
              id="create-new-table-btn"
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-xs font-black text-white shadow-lg shadow-zinc-950/10 transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Add Table
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
              Total Tables
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              {tables.length}
            </p>
            <span className="text-[10px] font-semibold text-zinc-400">
              QR enabled
            </span>
          </div>
        </div>

        <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
              Dining Now
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              {activeTableOrderCount}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
        </div>

        <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
              Available
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <QrCode className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              {idleTableCount}
            </p>
            <span className="text-[10px] font-semibold text-zinc-400">
              Ready for guests
            </span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div
        className={
          isAdminLayout
            ? 'grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]'
            : 'space-y-5'
        }
      >
        <main className="min-w-0 space-y-4">
          {/* Search Toolbar */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                <input
                  id="search-tables-input"
                  type="text"
                  placeholder="Search tables by name or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-10 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-900"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden h-8 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />

                <span className="whitespace-nowrap rounded-lg bg-zinc-100 px-3 py-2 text-[11px] font-bold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {filteredTables.length} results
                </span>

                {!isAdminLayout && (
                  <button
                    id="create-new-table-btn"
                    type="button"
                    onClick={handleOpenAddModal}
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-black text-zinc-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Cards */}
          {filteredTables.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white px-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <QrCode className="h-8 w-8" />
              </div>

              <h3 className="mt-4 text-base font-black text-zinc-900 dark:text-white">
                No tables found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {searchQuery.trim()
                  ? 'Try a different search term or clear the search.'
                  : 'Create your first table to generate a dedicated customer ordering QR.'}
              </p>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-black text-white transition-all hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                Add Table
              </button>
            </div>
          ) : (
            <div
              className={
                isAdminLayout
                  ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
                  : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
              }
            >
              {filteredTables.map((table) => {
                const active = hasActiveOrder(table.number);

                return (
                  <article
                    key={table.id}
                    id={`table-card-${table.number}`}
                    className={`group relative overflow-hidden rounded-[24px] border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-950 sm:p-5 ${active
                        ? 'border-emerald-300 ring-1 ring-emerald-500/20 dark:border-emerald-500/40'
                        : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                  >
                    {/* Accent line */}
                    <div
                      className={`absolute inset-x-0 top-0 h-1 ${active ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${active
                              ? 'bg-emerald-600'
                              : 'bg-zinc-950 dark:bg-zinc-800'
                            }`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-400">
                            TBL
                          </span>
                          <span className="absolute bottom-1 text-[11px] font-black">
                            {table.number}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-zinc-950 dark:text-white sm:text-base">
                            {table.name}
                          </h3>

                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${active
                                  ? 'animate-pulse bg-emerald-500'
                                  : 'bg-zinc-300 dark:bg-zinc-700'
                                }`}
                            />

                            <span
                              className={`text-[10px] font-bold ${active
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-zinc-400'
                                }`}
                            >
                              {active
                                ? 'Active kitchen order'
                                : 'Ready to scan'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          id={`edit-table-btn-${table.number}`}
                          onClick={() => handleOpenEditModal(table)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
                          title="Edit table"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          id={`delete-table-btn-${table.number}`}
                          onClick={() => handleDeleteTable(table)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                          title="Delete table"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* QR preview area */}
                    <div className="relative mt-4 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/70">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-950">
                        <QrCode className="h-6 w-6 text-zinc-800 dark:text-zinc-200" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          Customer link
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          /order?table={table.number}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-black ${active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                      >
                        {active ? 'BUSY' : 'READY'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id={`inspect-qr-table-${table.number}`}
                        onClick={() => handleInspectQR(table)}
                        className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-[11px] font-black text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        <QrCode className="h-3.5 w-3.5 text-amber-500" />
                        Quick QR
                      </button>

                      <button
                        type="button"
                        id={`preview-menu-table-${table.number}`}
                        onClick={() =>
                          onSelectTableForPreview?.(table.number)
                        }
                        className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-zinc-950 text-[11px] font-black text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                      >
                        Test Menu
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      {isAdminLayout &&
                        onOpenQRStandForTable && (
                          <button
                            type="button"
                            id={`full-qr-stand-table-${table.number}`}
                            onClick={() =>
                              onOpenQRStandForTable(table.number)
                            }
                            className="col-span-2 flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-[11px] font-black text-amber-900 transition-colors hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Full QR Stand
                          </button>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* Admin side panel */}
        {isAdminLayout && (
          <aside className="hidden space-y-4 xl:block">
            <div className="sticky top-5 space-y-4">
              <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Sparkles className="h-5 w-5" />
                </div>

                <h2 className="mt-4 text-sm font-black text-zinc-950 dark:text-white">
                  QR workflow
                </h2>

                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Each table gets a unique ordering link that opens directly on the customer menu.
                </p>

                <div className="mt-4 space-y-3">
                  {[
                    ['01', 'Create table', 'Add a name and table number.'],
                    ['02', 'Generate QR', 'Preview or open the full QR stand.'],
                    ['03', 'Place & scan', 'Guests scan and start ordering.'],
                  ].map(([number, title, description]) => (
                    <div key={number} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[9px] font-black text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        {number}
                      </span>

                      <div>
                        <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-200">
                          {title}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-400">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {onOpenQRStandForTable && tables[0] && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenQRStandForTable(tables[0].number)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-800 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  <QrCode className="h-4 w-4 text-amber-500" />
                  Preview first table
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div
          id="table-form-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            id="table-form-modal-card"
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-zinc-200 bg-white text-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-amber-500" />

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6">
              <div className="flex items-start gap-3 pr-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <QrCode className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
                    {editingTable ? 'Edit table' : 'Add new table'}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Set the table name and code used in its customer QR link.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveTable} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="form-table-name"
                    className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                  >
                    Table name *
                  </label>

                  <input
                    id="form-table-name"
                    type="text"
                    required
                    autoFocus
                    value={tableNameInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTableNameInput(val);

                      if (!editingTable) {
                        const match = val.match(/\d+/);
                        if (match) setTableNumberInput(match[0]);
                      }
                    }}
                    placeholder="e.g. Table 9 or Window Booth"
                    className="min-h-[46px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm font-semibold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="form-table-number"
                    className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                  >
                    Table number / code
                  </label>

                  <input
                    id="form-table-number"
                    type="text"
                    value={tableNumberInput}
                    onChange={(e) =>
                      setTableNumberInput(e.target.value)
                    }
                    placeholder="e.g. 9"
                    className="min-h-[46px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-900"
                  />

                  <p className="mt-1.5 text-[10px] text-zinc-400">
                    Customer URL: /order?table=
                    {tableNumberInput || '1'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="min-h-[42px] rounded-xl border border-zinc-200 px-4 text-xs font-black text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>

                  <button
                    id="submit-save-table-btn"
                    type="submit"
                    className="min-h-[42px] rounded-xl bg-zinc-950 px-5 text-xs font-black text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                  >
                    {editingTable ? 'Save changes' : 'Add table'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Preview modal */}
      {isQRPreviewModalOpen && selectedQRTable && (
        <div
          id="qr-inspect-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsQRPreviewModalOpen(false)}
        >
          <div
            id="qr-stand-preview-card"
            className="relative w-full max-w-sm overflow-hidden rounded-[30px] border border-zinc-200 bg-white p-6 text-center text-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />

            <button
              type="button"
              onClick={() => setIsQRPreviewModalOpen(false)}
              className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
              aria-label="Close QR preview"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pt-1">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <QrCode className="h-5 w-5" />
              </div>

              <h3 className="mt-3 text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                {selectedQRTable.name}
              </h3>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Scan with your phone camera to open the menu.
              </p>
            </div>

            <div className="mx-auto mt-5 w-fit rounded-[24px] border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-950/5 dark:border-zinc-700">
              <div className="relative">
                {generatedQRUrl ? (
                  <img
                    src={generatedQRUrl}
                    alt={`QR code for ${selectedQRTable.name}`}
                    className="h-52 w-52 object-contain sm:h-56 sm:w-56"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-52 w-52 items-center justify-center text-zinc-300 sm:h-56 sm:w-56">
                    <QrCode className="h-16 w-16 animate-pulse" />
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl border-2 border-white bg-zinc-950 text-white shadow-xl">
                    <span className="text-[6px] font-black uppercase tracking-[0.16em] text-amber-300">
                      TBL
                    </span>
                    <span className="text-xs font-black leading-tight">
                      {selectedQRTable.number}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                id="print-modal-stand-btn"
                type="button"
                onClick={() => window.print()}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-black text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
              >
                <Printer className="h-4 w-4" />
                Print QR stand
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopyTableLink(selectedQRTable.number)
                }
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-black text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {copiedLink ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedLink ? 'Link copied!' : 'Copy ordering link'}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-zinc-400">
              <Check className="h-3 w-3 text-emerald-500" />
              Table {selectedQRTable.number} is linked to this QR
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
