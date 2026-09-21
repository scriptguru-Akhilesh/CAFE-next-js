'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Plus, Edit2, Trash2, Search, QrCode,
  ArrowRight, Printer, Check, Copy, CheckCircle2,
  X, Users, Sparkles, ExternalLink, UtensilsCrossed,
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

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<CafeTable | null>(null);
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableNumberInput, setTableNumberInput] = useState('');

  // Modal State for QR Stand preview
  const [isQRPreviewModalOpen, setIsQRPreviewModalOpen] = useState(false);
  const [selectedQRTable, setSelectedQRTable] = useState<CafeTable | null>(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to table changes and order updates
  useEffect(() => {
    const unsubTables = tableStorage.subscribe((updated) => {
      setTables(updated);
    });
    const unsubOrders = orderStorage.subscribe((orders) => {
      setActiveOrders(orders);
    });

    return () => {
      unsubTables();
      unsubOrders();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered tables by name or number
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const q = searchQuery.toLowerCase();
    return tables.filter((table) => 
      table.name.toLowerCase().includes(q) || 
      table.number.toLowerCase().includes(q)
    );
  }, [tables, searchQuery]);

  // Open Create Modal
  const handleOpenAddModal = () => {
    setEditingTable(null);
    // Suggest next sequential table number
    const existingNums = tables.map((t) => parseInt(t.number, 10)).filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : tables.length + 1;

    setTableNameInput(`Table ${nextNum}`);
    setTableNumberInput(String(nextNum));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (table: CafeTable) => {
    setEditingTable(table);
    setTableNameInput(table.name);
    setTableNumberInput(table.number);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Table (Create or Update)
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = tableNameInput.trim();
    if (!finalName) {
      setFormError('Please enter a table name (e.g. Table 9, Patio Table)');
      return;
    }

    try {
      if (editingTable) {
        // Update
        const updated = tableStorage.updateTable(editingTable.id, finalName, tableNumberInput);
        if (updated) {
          showToast(`Updated "${finalName}"!`);
        }
      } else {
        const created = tableStorage.addTable(finalName, tableNumberInput.trim() || undefined);
        showToast(`Added "${created.name}" with QR stand!`);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save table', err);
      setFormError('Failed to save table. Please try again.');
    }
  };

  // Delete Table
  const handleDeleteTable = (table: CafeTable) => {
    if (window.confirm(`Delete ${table.name}?`)) {
      tableStorage.deleteTable(table.id);
      showToast(`Removed ${table.name}`);
    }
  };

  // Open QR Code Stand Inspector
  const handleInspectQR = async (table: CafeTable) => {
    setSelectedQRTable(table);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const orderUrl = `${origin}/order?table=${encodeURIComponent(table.number)}`;

    try {
      const url = await QRCode.toDataURL(orderUrl, {
        width: 360,
        margin: 1.5,
        color: {
          dark: '#1c1917',
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
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/order?table=${encodeURIComponent(tableNum)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(`Order URL copied for Table ${tableNum}!`);
  };

  const activeTableOrderCount = useMemo(() => {
    const busy = new Set<string>();
    activeOrders.forEach((o) => {
      if (o.status !== 'Served') busy.add(o.tableNumber);
    });
    return busy.size;
  }, [activeOrders]);

  const idleTableCount = Math.max(0, tables.length - activeTableOrderCount);

  // Check if a table has active unserved kitchen orders
  const hasActiveOrder = (tableNum: string) => {
    return activeOrders.some((o) => o.tableNumber === tableNum && o.status !== 'Served');
  };

  const toastPositionClass = isAdminLayout ? 'top-20' : 'top-14';

  const statsSection = isAdminLayout && (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm dark:border-amber-500/20 dark:from-amber-950/40 dark:to-stone-900">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-amber-800/80 dark:text-amber-300/90">
            Total Tables
          </span>
          <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="mt-2 text-3xl font-black tracking-tight text-stone-900 dark:text-white">
          {tables.length}
        </p>
        <p className="mt-1 text-[11px] text-amber-900/60 dark:text-amber-200/50">
          Each table gets its own scannable menu link
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/35 dark:to-stone-900">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-300/90">
            Dining Now
          </span>
          <UtensilsCrossed className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="mt-2 text-3xl font-black tracking-tight text-emerald-950 dark:text-emerald-100">
          {activeTableOrderCount}
        </p>
        <p className="mt-1 text-[11px] text-emerald-900/60 dark:text-emerald-200/50">
          Tables with open kitchen tickets
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Ready to Scan
          </span>
          <QrCode className="h-4 w-4 text-stone-400 dark:text-stone-500" />
        </div>
        <p className="mt-2 text-3xl font-black tracking-tight text-stone-900 dark:text-white">
          {idleTableCount}
        </p>
        <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
          Idle tables waiting for guests
        </p>
      </div>
    </section>
  );

  const toolbar = (
    <div
      className={
        isAdminLayout
          ? 'flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/90 sm:flex-row sm:items-center'
          : 'flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs dark:border-stone-800 dark:bg-stone-900 sm:flex-row sm:items-center sm:p-4'
      }
    >
      <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
        <input
          id="search-tables-input"
          type="text"
          placeholder="Search by table name or number…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-10 pr-8 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:bg-stone-900"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            ✕
          </button>
        )}
      </div>

      <button
        id="create-new-table-btn"
        type="button"
        onClick={handleOpenAddModal}
        className={
          isAdminLayout
            ? 'flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-5 text-sm font-bold text-white shadow-md transition-all hover:bg-stone-800 active:scale-[0.98] dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400'
            : 'flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-stone-950 shadow-md transition-all hover:bg-amber-400 active:scale-[0.98] sm:text-sm'
        }
      >
        <Plus className="h-4 w-4" />
        <span>Add Table</span>
      </button>
    </div>
  );

  const tablesGrid = (
      <div
        className={
          isAdminLayout
            ? 'grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'
            : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {filteredTables.length === 0 ? (
          <div
            className={`col-span-full space-y-3 p-10 text-center ${
              isAdminLayout
                ? 'rounded-3xl border border-dashed border-amber-200/80 bg-amber-50/40 dark:border-amber-500/25 dark:bg-amber-950/15'
                : 'rounded-3xl border border-dashed border-stone-300 bg-white dark:border-stone-800 dark:bg-stone-900'
            }`}
          >
            <QrCode className="mx-auto h-10 w-10 text-amber-400/70 dark:text-amber-500/60" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No tables found</h3>
            <p className="mx-auto max-w-sm text-xs text-stone-500 dark:text-stone-400">
              {searchQuery.trim()
                ? 'Try a different search term or clear the filter.'
                : 'Add a table to generate its QR stand for customers.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-stone-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              <span>Add Table</span>
            </button>
          </div>
        ) : (
          filteredTables.map((table) => {
            const active = hasActiveOrder(table.number);

            return (
              <article
                key={table.id}
                id={`table-card-${table.number}`}
                className={`flex flex-col justify-between overflow-hidden rounded-3xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
                  active
                    ? isAdminLayout
                      ? 'border-emerald-300/80 bg-gradient-to-br from-emerald-50/80 via-white to-white ring-1 ring-emerald-400/30 dark:border-emerald-500/40 dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-900'
                      : 'border-emerald-500/80 ring-1 ring-emerald-500/40 dark:border-emerald-500/60'
                    : isAdminLayout
                      ? 'border-stone-200/90 bg-gradient-to-br from-white via-white to-amber-50/40 dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-amber-950/20'
                      : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border shadow-sm ${
                        active
                          ? 'border-emerald-600/30 bg-emerald-900 text-emerald-50 dark:bg-emerald-950'
                          : 'border-stone-800 bg-stone-950 text-white dark:border-stone-700 dark:bg-stone-800'
                      }`}
                    >
                      <span className="text-[8px] font-bold uppercase leading-none tracking-widest text-amber-400">
                        TBL
                      </span>
                      <span className="max-w-[40px] truncate text-sm font-black leading-tight">
                        {table.number}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black leading-tight text-stone-900 dark:text-white">
                        {table.name}
                      </h3>
                      {active ? (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                          Active order in kitchen
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          QR ready · scan to open menu
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      id={`edit-table-btn-${table.number}`}
                      onClick={() => handleOpenEditModal(table)}
                      className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white"
                      title="Edit table"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`delete-table-btn-${table.number}`}
                      onClick={() => handleDeleteTable(table)}
                      className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                      title="Delete table"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  className={`mt-4 grid gap-2 border-t pt-4 dark:border-stone-800 ${
                    isAdminLayout ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'
                  }`}
                >
                  <button
                    type="button"
                    id={`inspect-qr-table-${table.number}`}
                    onClick={() => handleInspectQR(table)}
                    className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-xs font-bold text-stone-800 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    <QrCode className="h-3.5 w-3.5 text-amber-500" />
                    <span>Quick QR</span>
                  </button>

                  {isAdminLayout && onOpenQRStandForTable && (
                    <button
                      type="button"
                      id={`full-qr-stand-table-${table.number}`}
                      onClick={() => onOpenQRStandForTable(table.number)}
                      className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-950 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/55"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Full Stand</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id={`preview-menu-table-${table.number}`}
                    onClick={() => onSelectTableForPreview?.(table.number)}
                    className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold shadow-sm transition-colors ${
                      isAdminLayout
                        ? 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400'
                        : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400'
                    }`}
                  >
                    <span>Test Menu</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
  );

  const adminSidebar = isAdminLayout && (
    <aside className="hidden xl:flex xl:flex-col xl:gap-4">
      <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-b from-amber-50 to-white p-5 shadow-sm dark:border-amber-500/20 dark:from-amber-950/35 dark:to-stone-900">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-black text-stone-900 dark:text-white">QR workflow</h2>
        <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
          <li>
            <span className="font-bold text-stone-800 dark:text-stone-200">1.</span> Add or edit a table
            name and number.
          </li>
          <li>
            <span className="font-bold text-stone-800 dark:text-stone-200">2.</span> Open{' '}
            <strong>Full Stand</strong> to print the in-store QR display.
          </li>
          <li>
            <span className="font-bold text-stone-800 dark:text-stone-200">3.</span> Guests scan →{' '}
            <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px] dark:bg-stone-800">
              /order?table=
            </code>{' '}
            opens automatically.
          </li>
        </ol>
      </div>

      {onOpenQRStandForTable && tables[0] && (
        <button
          type="button"
          onClick={() => onOpenQRStandForTable(tables[0].number)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-bold text-stone-800 shadow-sm transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          <QrCode className="h-4 w-4 text-amber-500" />
          Preview first table stand
        </button>
      )}
    </aside>
  );

  return (
    <div
      id="table-management-panel"
      className={isAdminLayout ? 'space-y-6' : 'space-y-4'}
    >
      {toastMessage && (
        <div
          className={`fixed right-4 z-50 flex items-center gap-2 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-top-3 duration-200 dark:border-amber-400 dark:bg-amber-500 dark:text-stone-950 ${toastPositionClass}`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-stone-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {statsSection}

      {isAdminLayout ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-4">
            {toolbar}
            {tablesGrid}
          </div>
          {adminSidebar}
        </div>
      ) : (
        <>
          {toolbar}
          {tablesGrid}
        </>
      )}

      {/* Simple Modal: Add / Edit Table (Just Name) */}
      {isModalOpen && (
        <div
          id="table-form-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            id="table-form-modal-card"
            className="relative w-full max-w-sm rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-stone-900 dark:text-stone-100 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-black text-stone-900 dark:text-white">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Enter a table name to generate its dedicated QR stand.
              </p>
            </div>

            {formError && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/50 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTable} className="space-y-3.5">
              {/* Table Name Input */}
              <div>
                <label htmlFor="form-table-name" className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Table Name *
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
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm font-semibold text-stone-900 dark:text-white focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-amber-500 min-h-[42px]"
                />
              </div>

              {/* Table Number / Code */}
              <div>
                <label htmlFor="form-table-number" className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Table # / Code
                </label>
                <input
                  id="form-table-number"
                  type="text"
                  value={tableNumberInput}
                  onChange={(e) => setTableNumberInput(e.target.value)}
                  placeholder="e.g. 9"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm font-bold text-stone-900 dark:text-white focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-amber-500 min-h-[42px]"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Used in QR URL link (?table={tableNumberInput || '1'})
                </span>
              </div>

              {/* Footer CTA */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  id="submit-save-table-btn"
                  type="submit"
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 px-5 py-2.5 text-xs font-black shadow-md transition-all min-h-[40px]"
                >
                  {editingTable ? 'Save Changes' : 'Add Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple Modal: QR Code Stand & Printable View */}
      {isQRPreviewModalOpen && selectedQRTable && (
        <div
          id="qr-inspect-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsQRPreviewModalOpen(false)}
        >
          <div
            id="qr-stand-preview-card"
            className="relative w-full max-w-sm rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 text-stone-900 dark:text-stone-100 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQRPreviewModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-xl font-black text-stone-900 dark:text-white mt-1">
                {selectedQRTable.name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Scan with phone camera to order
              </p>
            </div>

            {/* QR Stand Display */}
            <div className="relative mx-auto rounded-2xl border-2 border-stone-900 dark:border-amber-500 p-4 bg-white shadow-lg inline-block">
              {generatedQRUrl ? (
                <img
                  src={generatedQRUrl}
                  alt={`QR code for ${selectedQRTable.name}`}
                  className="h-48 w-48 mx-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center text-stone-400">
                  <QrCode className="h-16 w-16 animate-pulse" />
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-10 w-10 rounded-xl bg-stone-950 border-2 border-white text-white flex flex-col items-center justify-center shadow-lg">
                  <span className="text-[7px] font-bold uppercase tracking-widest text-amber-300 leading-none">TBL</span>
                  <span className="text-xs font-black leading-tight">{selectedQRTable.number}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                id="print-modal-stand-btn"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 dark:bg-amber-500 py-2.5 px-4 text-xs font-bold text-white dark:text-stone-950 shadow-md hover:bg-stone-800 dark:hover:bg-amber-400 transition-all min-h-[42px]"
              >
                <Printer className="h-4 w-4" />
                <span>Print QR Stand</span>
              </button>

              <button
                onClick={() => {
                  handleCopyTableLink(selectedQRTable.number);
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 py-2.5 px-4 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-750 transition-colors min-h-[42px]"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Ordering Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
