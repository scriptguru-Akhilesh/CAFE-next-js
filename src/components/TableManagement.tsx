'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Plus, Edit2, Trash2, Search, QrCode, 
  ArrowRight, Printer, Check, Copy, CheckCircle2,
  X
} from 'lucide-react';
import { CafeTable, KitchenOrder } from '../types';
import { tableStorage } from '../utils/tableStorage';
import { orderStorage } from '../utils/orderStorage';

interface TableManagementProps {
  onSelectTableForPreview?: (tableNumber: string) => void;
  onOpenQRStandForTable?: (tableNumber: string) => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  onSelectTableForPreview,
  onOpenQRStandForTable,
}) => {
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

  // Check if a table has active unserved kitchen orders
  const hasActiveOrder = (tableNum: string) => {
    return activeOrders.some((o) => o.tableNumber === tableNum && o.status !== 'Served');
  };

  return (
    <div id="table-management-panel" className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 rounded-2xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 px-4 py-3 shadow-2xl flex items-center gap-2 border border-stone-700 dark:border-amber-400 animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-stone-950" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Bar: Search and Simple Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs">
        {/* Search by Name */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
          <input
            id="search-tables-input"
            type="text"
            placeholder="Search tables by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-amber-500 transition-colors min-h-[40px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Add Table CTA */}
        <button
          id="create-new-table-btn"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 px-4 py-2.5 text-xs sm:text-sm font-black shadow-md transition-all min-h-[42px] shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Table</span>
        </button>
      </div>

      {/* Tables List / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTables.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 space-y-3">
            <QrCode className="h-10 w-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No tables found</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Add a table to generate its QR stand for customers.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold shadow-sm hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              <span>Add Table</span>
            </button>
          </div>
        ) : (
          filteredTables.map((table) => {
            const active = hasActiveOrder(table.number);

            return (
              <div
                key={table.id}
                id={`table-card-${table.number}`}
                className={`flex flex-col justify-between rounded-2xl border bg-white dark:bg-stone-900 p-4 shadow-2xs transition-all hover:shadow-md ${
                  active
                    ? 'border-emerald-500/80 dark:border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {/* Top Info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-stone-950 dark:bg-stone-800 text-white border border-stone-800 dark:border-stone-700 shadow-2xs shrink-0">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400 leading-none">TBL</span>
                      <span className="text-sm font-black leading-tight truncate max-w-[36px]">{table.number}</span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-black text-stone-900 dark:text-white leading-tight truncate">
                        {table.name}
                      </h3>
                      {active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Order</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Ready for scan</span>
                      )}
                    </div>
                  </div>

                  {/* Edit & Delete Quick Icons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      id={`edit-table-btn-${table.number}`}
                      onClick={() => handleOpenEditModal(table)}
                      className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Edit table name"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      id={`delete-table-btn-${table.number}`}
                      onClick={() => handleDeleteTable(table)}
                      className="p-2 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete table"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Actions Row */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                  {/* View QR Stand */}
                  <button
                    id={`inspect-qr-table-${table.number}`}
                    onClick={() => handleInspectQR(table)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 px-2.5 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 transition-colors min-h-[38px]"
                  >
                    <QrCode className="h-3.5 w-3.5 text-amber-500" />
                    <span>QR Stand</span>
                  </button>

                  {/* Test Menu */}
                  <button
                    id={`preview-menu-table-${table.number}`}
                    onClick={() => onSelectTableForPreview?.(table.number)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 dark:bg-amber-500 hover:bg-stone-800 dark:hover:bg-amber-400 text-white dark:text-stone-950 px-2.5 py-2 text-xs font-bold transition-colors min-h-[38px] shadow-2xs"
                  >
                    <span>Test Menu</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

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
