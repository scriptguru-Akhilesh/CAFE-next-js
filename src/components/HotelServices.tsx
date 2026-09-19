import React, { useState } from 'react';
import { 
  ArrowLeft, Wifi, Copy, Check, Phone, MessageSquare, 
  Clock, Coffee, Bell, Sparkles
} from 'lucide-react';
import { CAFE_INFO, TABLE_SERVICES, CAFE_FACILITIES } from '../data/cafeData';

interface CafeServicesProps {
  onBackToMenu: () => void;
  onOpenCart?: () => void;
}

export const HotelServices: React.FC<CafeServicesProps> = ({
  onBackToMenu,
}) => {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [serviceRequests, setServiceRequests] = useState(TABLE_SERVICES);
  const [activeCallModal, setActiveCallModal] = useState<string | null>(null);

  const handleCopyWifi = () => {
    navigator.clipboard?.writeText(CAFE_INFO.wifi.password);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const handleRequestService = (serviceId: string) => {
    setServiceRequests(prev => 
      prev.map(item => 
        item.id === serviceId ? { ...item, status: 'confirmed' } : item
      )
    );
  };

  return (
    <div id="cafe-services-page" className="min-h-screen bg-stone-50 text-stone-900 pb-20">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Sub-navigation bar */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-stone-200/80">
          <button
            id="back-to-menu-btn"
            onClick={onBackToMenu}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shrink-0 shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Menu</span>
          </button>

          <div className="text-right">
            <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200/80 rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{CAFE_INFO.tableNumber} Active</span>
            </span>
          </div>
        </div>

        {/* Wi-Fi Card */}
        <section id="wifi-card" className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-800">
                <Wifi className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                  Complimentary High-Speed Café Wi-Fi
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {CAFE_INFO.wifi.speed} • Work-friendly with charging sockets across all booths.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs">
                <span className="text-[10px] text-stone-400 block">Network</span>
                <span className="font-mono font-medium text-stone-800">{CAFE_INFO.wifi.ssid}</span>
              </div>
              <div className="flex-1 flex items-center justify-between gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block">Password</span>
                  <span className="font-mono font-medium text-stone-800">{CAFE_INFO.wifi.password}</span>
                </div>
                <button
                  id="copy-wifi-password-btn"
                  onClick={handleCopyWifi}
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 active:scale-95 transition-all"
                  title="Copy password"
                >
                  {copiedWifi ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
          {copiedWifi && (
            <p className="mt-2 text-xs text-emerald-700 font-medium">
              ✓ Password copied to clipboard!
            </p>
          )}
        </section>

        {/* 1-Tap Table Assistance */}
        <section id="table-assistance-section" className="space-y-3">
          <div>
            <h3 className="font-cinzel text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>1-Tap Table Assistance</span>
            </h3>
            <p className="text-xs text-stone-500">
              Tap any request to notify our barista or floor team to attend {CAFE_INFO.tableNumber}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceRequests.map((srv) => (
              <div
                key={srv.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-3.5 sm:p-4 shadow-xs hover:border-stone-300 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-semibold text-stone-900">
                    {srv.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-stone-500 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400">Complimentary</span>
                  <button
                    onClick={() => handleRequestService(srv.id)}
                    disabled={srv.status === 'confirmed'}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${
                      srv.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {srv.status === 'confirmed' ? 'Attending to Table ✓' : 'Call to Table'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Counter / Barista */}
        <section id="contact-counter-section" className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-stone-900">
                Direct Café & Floor Contacts
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Have questions regarding bean roasts, allergens, or reservations?
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="call-counter-btn"
                onClick={() => setActiveCallModal('Floor Manager')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call Counter</span>
              </button>

              <button
                id="whatsapp-barista-btn"
                onClick={() => setActiveCallModal('Barista Lead')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp Barista</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-stone-400 block text-[10px]">Opening Hours</span>
              <strong className="text-stone-800 font-medium text-xs">{CAFE_INFO.timings.hours}</strong>
            </div>
            <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-stone-400 block text-[10px]">Fresh Bakes</span>
              <strong className="text-stone-800 font-medium text-xs">{CAFE_INFO.timings.bakeryFresh}</strong>
            </div>
            <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-stone-400 block text-[10px]">Instagram</span>
              <strong className="text-stone-800 font-mono text-xs">{CAFE_INFO.contacts.instagram}</strong>
            </div>
            <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-stone-400 block text-[10px]">Telephone</span>
              <strong className="text-stone-800 font-mono text-xs">{CAFE_INFO.contacts.phone}</strong>
            </div>
          </div>
        </section>

        {/* Roastery & Space Features */}
        <section id="cafe-facilities-section" className="space-y-3">
          <h3 className="font-cinzel text-base font-bold text-stone-900 flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            <span>About Our Roastery & Space</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CAFE_FACILITIES.map((facility) => (
              <div
                key={facility.id}
                className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel text-xs sm:text-sm font-bold text-stone-900">
                    {facility.name}
                  </h4>
                  <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                    {facility.timing}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed pt-1">
                  {facility.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cafe Story */}
        <section id="about-cafe-section" className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs text-xs text-stone-600 leading-relaxed space-y-2">
          <h3 className="font-cinzel text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Our Coffee Philosophy</span>
          </h3>
          <p>
            At {CAFE_INFO.name}, we believe in transparent sourcing, micro-batch roasting, and precision brewing. Every espresso is weighed to 0.1g, and every pour-over is hand-crafted with temperature-controlled kettle flows to bring out terroir sweetness.
          </p>
          <p className="text-stone-400 text-[11px]">
            Located at {CAFE_INFO.address}.
          </p>
        </section>

      </div>

      {/* Simulated Call Modal */}
      {activeCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center text-stone-900 shadow-xl border border-stone-200">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-800 mb-2">
              <Phone className="h-5 w-5" />
            </div>
            <h4 className="font-cinzel text-base font-bold">
              Calling {activeCallModal}
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Connecting from {CAFE_INFO.tableNumber}...
            </p>
            <button
              onClick={() => setActiveCallModal(null)}
              className="mt-4 w-full rounded-xl bg-stone-900 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
