'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { 
  QrCode, ArrowRight, Coffee, Camera, Wifi, 
  UtensilsCrossed, Sparkles, CheckCircle2, Layers,
  Copy, Check, Printer, Shield
} from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';
import { ThemeToggle } from './ThemeToggle';
import { CafeTable } from '../types';
import { tableStorage } from '../utils/tableStorage';

interface TableQRScreenProps {
  tableNumber: string;
  onTableChange: (newTable: string) => void;
  onOpenMenu: () => void;
  onSwitchToKitchen?: () => void;
  onSwitchToMenuManagement?: () => void;
  showAdminNavigation?: boolean;
}

export const TableQRScreen: React.FC<TableQRScreenProps> = ({
  tableNumber,
  onTableChange,
  onOpenMenu,
  onSwitchToKitchen,
  onSwitchToMenuManagement,
  showAdminNavigation = false,
}) => {
  const [tables, setTables] = useState<CafeTable[]>(() => tableStorage.getTables());
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isScanningQuick, setIsScanningQuick] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);

  // Subscribe to dynamic tables
  useEffect(() => {
    const unsub = tableStorage.subscribe((allTables) => {
      setTables(allTables);
    });
    return unsub;
  }, []);

  const currentTableObj = tables.find((t) => t.number === tableNumber) || {
    id: `tbl-${tableNumber}`,
    name: `Table ${tableNumber}`,
    number: tableNumber,
    createdAt: Date.now(),
  };

  // Generate actual scannable QR code linking to the live menu URL
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const orderUrl = `${origin}/order?table=${encodeURIComponent(tableNumber)}`;

    QRCode.toDataURL(orderUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
  }, [tableNumber]);

  // Handle quick scan when tapping the QR code directly
  const handleQuickTapScan = () => {
    setIsScanningQuick(true);
    setTimeout(() => {
      setIsScanningQuick(false);
      onOpenMenu();
    }, 700);
  };

  const handleScanSuccess = () => {
    setIsScannerOpen(false);
    onOpenMenu();
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/order?table=${encodeURIComponent(tableNumber)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWifi = () => {
    navigator.clipboard?.writeText('brewcoffee');
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2500);
  };

  return (
    <div id="table-qr-landing" className="min-h-screen bg-stone-100/70 text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col justify-between py-5 px-4 sm:px-6 transition-colors duration-200">
      {/* Top Customer Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500 text-amber-100 dark:text-stone-950 shadow-md">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-stone-900 dark:text-white tracking-tight leading-tight">
              Corner Roastery
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Specialty Coffee & Bakery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showAdminNavigation && onSwitchToMenuManagement && (
            <button
              id="qr-nav-menu-manager-btn"
              onClick={onSwitchToMenuManagement}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-2xs min-h-[36px]"
            >
              <Layers className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Manage</span>
            </button>
          )}

          {showAdminNavigation && onSwitchToKitchen && (
            <button
              id="qr-nav-kitchen-btn"
              onClick={onSwitchToKitchen}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-2xs min-h-[36px]"
            >
              <UtensilsCrossed className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              <span>Kitchen</span>
            </button>
          )}

          <ThemeToggle className="dark:bg-stone-900 dark:border-stone-800" />
        </div>
      </header>

      {/* Main Table QR Card */}
      <main className="max-w-sm mx-auto w-full my-auto py-4">
        <div 
          id="qr-stand-card"
          className="relative rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-7 text-center shadow-2xl space-y-4 transition-all duration-300"
        >
          {/* Table Stand Badge & Selector */}
          <div className="flex items-center justify-between gap-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-2 px-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Select Table:</span>
            </div>
            <select
              id="qr-table-selector"
              aria-label="Change table number"
              value={tableNumber}
              onChange={(e) => onTableChange(e.target.value)}
              className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 font-bold text-stone-900 dark:text-stone-100 rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:outline-hidden hover:border-stone-400 shadow-2xs max-w-[160px] truncate"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.number}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              {currentTableObj.name}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
              Scan with your phone camera or tap the QR code to open the digital cafe menu.
            </p>
          </div>

          {/* Scannable Real QR Code Container */}
          <div className="flex justify-center py-1">
            <button
              id="tap-qr-code-direct"
              onClick={handleQuickTapScan}
              title="Tap QR code to scan and open menu automatically"
              className="group relative rounded-2xl border-2 border-stone-900 dark:border-amber-500/60 bg-white p-3 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all active:scale-98"
            >
              <div className="relative h-48 w-48 sm:h-52 sm:w-52 flex items-center justify-center overflow-hidden rounded-xl bg-white">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Scannable QR Code for ${currentTableObj.name}`}
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400">
                    <QrCode className="h-20 w-20 animate-pulse" />
                    <span className="text-xs mt-2 font-mono">Generating QR...</span>
                  </div>
                )}

                {/* Center Badge: Table number overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-11 w-11 rounded-xl bg-stone-950 border-2 border-white text-white flex flex-col items-center justify-center shadow-lg">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-amber-300 leading-none">TBL</span>
                    <span className="text-sm font-black leading-tight truncate max-w-[36px]">{tableNumber}</span>
                  </div>
                </div>

                {/* Scanning Laser animation on tap */}
                {isScanningQuick && (
                  <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex flex-col items-center justify-center text-stone-900 animate-in fade-in duration-150">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold bg-white/95 px-2.5 py-1 rounded-md shadow-xs">
                      Scanned! Opening Menu...
                    </span>
                  </div>
                )}
              </div>

              {/* Tap feedback caption */}
              <div className="mt-2 text-[11px] font-medium text-stone-500 group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-amber-400 transition-colors flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Tap to simulate instant scan</span>
              </div>
            </button>
          </div>

          {/* Quick Share / Copy URL action row */}
          <div className="flex items-center justify-center gap-2">
            <button
              id="copy-menu-link-btn"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              id="print-stand-btn"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Stand</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              id="open-menu-direct-btn"
              onClick={onOpenMenu}
              className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-stone-900 dark:bg-amber-500 py-3 px-5 text-sm font-bold text-white dark:text-stone-950 shadow-md hover:bg-stone-800 dark:hover:bg-amber-400 active:scale-[0.99] transition-all"
            >
              <span>Open {currentTableObj.name} Menu</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              id="simulate-scan-btn"
              onClick={() => setIsScannerOpen(true)}
              className="w-full min-h-[42px] flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 py-2.5 px-4 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Camera className="h-4 w-4 text-stone-600 dark:text-stone-400" />
              <span>Camera QR Scanner (Auto-Redirect)</span>
            </button>
          </div>

          {/* Wi-Fi Credentials Badge */}
          <div 
            onClick={handleCopyWifi}
            className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono cursor-pointer hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            title="Click to copy Wi-Fi password"
          >
            <Wifi className="h-3.5 w-3.5 text-stone-400" />
            <span>Wi-Fi: CornerRoastery • Pass: brewcoffee</span>
            {copiedWifi && <span className="text-[10px] text-emerald-500 font-bold ml-1">✓ Copied</span>}
          </div>
        </div>
      </main>

      {/* Customer Footer with Discreet Staff Portal Link */}
      <footer className="text-center text-xs text-stone-500 dark:text-stone-400 pb-1 flex flex-col items-center gap-1.5">
        <div>Direct smartphone camera scanning supported • Auto-redirects to {currentTableObj.name}</div>
        <div className="text-[11px] text-stone-400 dark:text-stone-500">
          Staff / Management?{' '}
          <Link 
            href="/admin/login" 
            className="underline hover:text-amber-600 dark:hover:text-amber-400 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <Shield className="h-3 w-3" />
            Admin Login
          </Link>
        </div>
      </footer>

      {/* QR Camera Scanner Modal with Auto-Redirect */}
      {isScannerOpen && (
        <QRScannerModal
          isOpen={isScannerOpen}
          tableNumber={tableNumber}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
};
