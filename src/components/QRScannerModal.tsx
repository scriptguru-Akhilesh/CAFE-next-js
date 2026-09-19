'use client';

import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, X, QrCode, Sparkles } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  tableNumber: string;
  onClose: () => void;
  onScanSuccess: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  tableNumber,
  onClose,
  onScanSuccess,
}) => {
  const [scanStep, setScanStep] = useState<'scanning' | 'detected'>('scanning');

  // Play a quick subtle scanner success beep
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio context might be restricted
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setScanStep('scanning');
      return;
    }

    // After 1000ms: QR is detected & verified
    const t1 = setTimeout(() => {
      setScanStep('detected');
      playScanBeep();
    }, 1000);

    // After 1700ms: Auto-redirect to menu
    const t2 = setTimeout(() => {
      onScanSuccess();
    }, 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div id="qr-scanner-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="qr-scanner-container"
        className="relative w-full max-w-sm rounded-3xl bg-stone-900 text-white p-6 shadow-2xl border border-stone-800 text-center"
      >
        {/* Close Button */}
        <button
          id="qr-scanner-close-btn"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-semibold mb-1.5">
            <Camera className="h-3.5 w-3.5" />
            <span>Camera Scanner</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {scanStep === 'detected' ? `Table ${tableNumber} QR Detected!` : 'Scanning Table QR Code...'}
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            {scanStep === 'detected' 
              ? 'Opening your digital menu automatically...' 
              : 'Hold steady over the table stand QR code'}
          </p>
        </div>

        {/* Viewfinder with scan laser line */}
        <div className="relative mx-auto aspect-square w-56 overflow-hidden rounded-2xl bg-black border-2 border-stone-700 flex items-center justify-center shadow-inner">
          {/* Corner Guides */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-400 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-400 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-400 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-400 rounded-br-sm pointer-events-none" />

          {scanStep === 'scanning' ? (
            <div className="relative flex flex-col items-center justify-center">
              <div className="h-32 w-32 rounded-xl bg-stone-800/80 p-3 shadow-md flex items-center justify-center border border-stone-700">
                <QrCode className="h-full w-full text-stone-300 animate-pulse" />
              </div>

              {/* Animated laser scanning line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-lg shadow-amber-400/50 animate-[bounce_1.5s_infinite]" />
            </div>
          ) : (
            <div className="flex flex-col items-center text-white space-y-2 animate-in zoom-in-95 duration-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="text-center">
                <span className="text-sm font-bold text-emerald-300 block">
                  Table {tableNumber} Verified
                </span>
                <span className="text-[11px] text-stone-400">
                  Redirecting now...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Instant redirect action */}
        <div className="mt-5 flex gap-2">
          <button
            id="instant-scan-btn"
            onClick={onScanSuccess}
            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-colors shadow-sm"
          >
            Open Menu Now →
          </button>
          <button
            id="cancel-scan-btn"
            onClick={onClose}
            className="rounded-xl border border-stone-800 bg-stone-800/80 px-4 py-2.5 text-xs font-medium text-stone-400 hover:text-stone-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
