import React from 'react';
import { QrCode, ArrowRight, Coffee, Wifi, Bell } from 'lucide-react';
import { CAFE_INFO } from '../data/cafeData';

interface QRWelcomeScreenProps {
  onStartScan: () => void;
  onDirectEnter: () => void;
  tableNumber?: string;
}

export const QRWelcomeScreen: React.FC<QRWelcomeScreenProps> = ({
  onStartScan,
  onDirectEnter,
  tableNumber = CAFE_INFO.tableNumber,
}) => {
  return (
    <div
      id="qr-welcome-screen"
      className="relative min-h-[calc(100vh-60px)] w-full flex flex-col justify-between items-center bg-stone-50 text-stone-900 px-3 sm:px-6 py-6 sm:py-10 space-y-6"
    >
      {/* Top Header */}
      <header className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-2.5 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-stone-900 text-stone-100 shadow-xs">
          <Coffee className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h1 className="font-cinzel text-xl sm:text-2xl font-bold tracking-tight text-stone-900 uppercase">
          {CAFE_INFO.name}
        </h1>
        <p className="mt-0.5 text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 font-medium">
          {CAFE_INFO.tagline}
        </p>
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-stone-200/70 px-3 py-0.5 text-[11px] sm:text-xs text-stone-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span>{tableNumber} • {CAFE_INFO.tableArea}</span>
        </div>
      </header>

      {/* Main QR Card */}
      <main className="mx-auto my-auto w-full max-w-sm">
        <div
          id="qr-card"
          className="rounded-3xl border border-stone-200/80 bg-white p-5 sm:p-7 text-center shadow-xs"
        >
          <h2 className="font-cinzel text-lg sm:text-xl font-bold text-stone-900">
            Welcome to {CAFE_INFO.name}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 leading-relaxed">
            Scan the QR code to explore our menu and order straight to your table.
          </p>

          {/* Center QR Code Display */}
          <div className="my-5 flex justify-center">
            <div
              id="qr-code-box"
              className="rounded-2xl border border-stone-200 bg-white p-3 shadow-xs"
            >
              <div className="relative h-40 w-40 sm:h-48 sm:w-48">
                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full"
                  shapeRendering="crispEdges"
                >
                  <rect width="100" height="100" fill="#ffffff" />

                  {/* Finders */}
                  <rect x="6" y="6" width="24" height="24" fill="#1c1917" />
                  <rect x="9" y="9" width="18" height="18" fill="#ffffff" />
                  <rect x="12" y="12" width="12" height="12" fill="#1c1917" />

                  <rect x="70" y="6" width="24" height="24" fill="#1c1917" />
                  <rect x="73" y="9" width="18" height="18" fill="#ffffff" />
                  <rect x="76" y="12" width="12" height="12" fill="#1c1917" />

                  <rect x="6" y="70" width="24" height="24" fill="#1c1917" />
                  <rect x="9" y="73" width="18" height="18" fill="#ffffff" />
                  <rect x="12" y="76" width="12" height="12" fill="#1c1917" />

                  {/* Modules */}
                  <g fill="#1c1917">
                    <rect x="34" y="15" width="3" height="3" />
                    <rect x="42" y="15" width="3" height="3" />
                    <rect x="50" y="15" width="3" height="3" />
                    <rect x="58" y="15" width="3" height="3" />
                    <rect x="64" y="15" width="3" height="3" />
                    <rect x="15" y="34" width="3" height="3" />
                    <rect x="15" y="42" width="3" height="3" />
                    <rect x="15" y="50" width="3" height="3" />
                    <rect x="15" y="58" width="3" height="3" />

                    <rect x="36" y="8" width="5" height="4" />
                    <rect x="45" y="7" width="4" height="4" />
                    <rect x="53" y="9" width="4" height="4" />
                    <rect x="35" y="24" width="6" height="4" />
                    <rect x="44" y="22" width="4" height="6" />

                    <rect x="8" y="36" width="4" height="5" />
                    <rect x="7" y="45" width="5" height="4" />
                    <rect x="9" y="54" width="4" height="4" />
                    <rect x="23" y="35" width="5" height="4" />

                    <rect x="69" y="35" width="5" height="5" />
                    <rect x="78" y="36" width="6" height="4" />
                    <rect x="87" y="34" width="5" height="6" />
                    <rect x="70" y="44" width="4" height="5" />
                    <rect x="79" y="45" width="5" height="4" />
                    <rect x="68" y="55" width="5" height="5" />
                    <rect x="77" y="53" width="4" height="6" />

                    <rect x="69" y="68" width="5" height="5" />
                    <rect x="78" y="67" width="5" height="6" />
                    <rect x="86" y="69" width="6" height="5" />
                    <rect x="68" y="77" width="6" height="4" />
                    <rect x="78" y="76" width="4" height="5" />

                    <rect x="35" y="71" width="5" height="5" />
                    <rect x="44" y="69" width="4" height="6" />
                    <rect x="52" y="71" width="6" height="4" />
                    <rect x="34" y="80" width="6" height="4" />
                    <rect x="43" y="79" width="5" height="5" />
                  </g>

                  {/* Center Badge */}
                  <rect x="40" y="40" width="20" height="20" rx="3" fill="#1c1917" />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-cinzel text-[10px] font-bold text-white tracking-widest">
                    ROAST
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 mb-4">
            Scan with phone camera or tap button below
          </p>

          {/* Action Button with 44px min touch target */}
          <div className="space-y-2.5">
            <button
              id="scan-qr-code-button"
              onClick={onStartScan}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.99]"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan QR Code</span>
            </button>

            <button
              id="direct-open-menu-button"
              onClick={onDirectEnter}
              className="w-full min-h-[40px] flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              <span>Or open café menu directly</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Minimal Features Strip - Responsive 3-col */}
        <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs text-stone-600">
          <div className="rounded-xl border border-stone-200/80 bg-white/80 p-2 sm:p-2.5">
            <Coffee className="mx-auto h-4 w-4 text-stone-800 mb-1" />
            <span className="font-medium text-stone-800 block text-[10px] sm:text-[11px] leading-tight">Coffee</span>
            <span className="text-[9px] sm:text-[10px] text-stone-400">Fresh Roasted</span>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white/80 p-2 sm:p-2.5">
            <Bell className="mx-auto h-4 w-4 text-stone-800 mb-1" />
            <span className="font-medium text-stone-800 block text-[10px] sm:text-[11px] leading-tight">Service</span>
            <span className="text-[9px] sm:text-[10px] text-stone-400">1-Tap Requests</span>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white/80 p-2 sm:p-2.5">
            <Wifi className="mx-auto h-4 w-4 text-stone-800 mb-1" />
            <span className="font-medium text-stone-800 block text-[10px] sm:text-[11px] leading-tight">Wi-Fi</span>
            <span className="text-[9px] sm:text-[10px] text-stone-400">250 Mbps Fiber</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] sm:text-[11px] text-stone-400">
        Contactless Table Ordering & Specialty Coffee Experience
      </footer>
    </div>
  );
};
