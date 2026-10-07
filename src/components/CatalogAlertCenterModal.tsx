import React, { useState } from 'react';
import {
  Bell,
  X,
  RefreshCw,
  ExternalLink,
  Printer,
  Volume2,
  VolumeX,
  CheckCircle2,
  Trash2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  PackagePlus,
  PackageCheck,
  PackageX,
  AlertCircle,
  BellRing,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { formatRs } from '../data/luggageCatalog';

export function buildWhatsAppAlertUrl(events: CatalogChangeEvent[]): string {
  const lines = [
    `*A.B. DESAI MAURITIUS — LIVE ABDESAI.MU CATALOG ALERT*`,
    `Detected at: ${new Date().toLocaleString()}`,
    `-----------------------------------------`,
    ...events.slice(0, 10).map((ev, i) => {
      const priceText =
        ev.oldPriceRs !== undefined &&
        ev.newPriceRs !== undefined &&
        ev.oldPriceRs !== ev.newPriceRs
          ? `Price: ${formatRs(ev.oldPriceRs)} → *${formatRs(ev.newPriceRs)}*`
          : ev.newPriceRs !== undefined
            ? `Price: *${formatRs(ev.newPriceRs)}*`
            : '';
      return `${i + 1}. *[${ev.type.replace('_', ' ').toUpperCase()}]* ${
        ev.productName
      }\n   ${priceText}${ev.newPromoBadge ? ` · ${ev.newPromoBadge}` : ''}\n   ${
        ev.permalink || 'https://abdesai.mu'
      }`;
    }),
    `-----------------------------------------`,
    `Please update showroom price tags / Shelf Talkers across Port-Louis, Tribeca, Trianon, Bagatelle, Cascavelle & Rose-Belle.`,
  ];
  return `https://wa.me/23054988887?text=${encodeURIComponent(
    lines.join('\n')
  )}`;
}

export function buildEmailAlertUrl(events: CatalogChangeEvent[]): string {
  const subject = `[AB Desai Alert] ${events.length} American Tourister Update(s) on abdesai.mu`;
  const body = events
    .slice(0, 15)
    .map(
      (ev, i) =>
        `${i + 1}. [${ev.type.toUpperCase()}] ${ev.productName}\n   Summary: ${
          ev.summary
        }\n   Link: ${ev.permalink || 'https://abdesai.mu'}`
    )
    .join('\n\n');
  return `mailto:info@abdesai.mu?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

export interface CatalogChangeEvent {
  id: string;
  detectedAt: string;
  type:
    | 'new_product'
    | 'price_drop'
    | 'price_increase'
    | 'promo_change'
    | 'stock_restocked'
    | 'stock_out'
    | 'removed_product';
  productId: number;
  productName: string;
  series: string;
  sizeCategory: string;
  sku: string;
  image: string;
  permalink: string;
  oldPriceRs?: number;
  newPriceRs?: number;
  oldRegularPriceRs?: number;
  newRegularPriceRs?: number;
  oldPromoBadge?: string;
  newPromoBadge?: string;
  oldInStock?: boolean;
  newInStock?: boolean;
  summary: string;
}

interface CatalogAlertCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CatalogChangeEvent[];
  seenIds: Set<string>;
  onMarkAllRead: () => void;
  onClearHistory: () => void;
  isSyncing: boolean;
  lastSyncedAt: string;
  onCheckNow: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  browserNotifPermission: NotificationPermission | 'unsupported';
  onRequestBrowserPermission: () => void;
  onTriggerTestAlert: () => void;
  onOpenProduct: (productId: number) => void;
  onOpenShelfTalker: (productId: number) => void;
  totalCatalogCount: number;
}

export const CatalogAlertCenterModal: React.FC<CatalogAlertCenterModalProps> = ({
  isOpen,
  onClose,
  events,
  seenIds,
  onMarkAllRead,
  onClearHistory,
  isSyncing,
  lastSyncedAt,
  onCheckNow,
  soundEnabled,
  onToggleSound,
  browserNotifPermission,
  onRequestBrowserPermission,
  onTriggerTestAlert,
  onOpenProduct,
  onOpenShelfTalker,
  totalCatalogCount,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'all') return true;
    if (filterType === 'new_product') return ev.type === 'new_product';
    if (filterType === 'price')
      return ev.type === 'price_drop' || ev.type === 'price_increase';
    if (filterType === 'promo') return ev.type === 'promo_change';
    if (filterType === 'stock')
      return (
        ev.type === 'stock_restocked' ||
        ev.type === 'stock_out' ||
        ev.type === 'removed_product'
      );
    return true;
  });

  const unreadCount = events.filter((e) => !seenIds.has(e.id)).length;

  const renderBadge = (ev: CatalogChangeEvent) => {
    switch (ev.type) {
      case 'new_product':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-700 text-white rounded">
            <PackagePlus className="w-3 h-3" />
            <span>New Product Added</span>
          </span>
        );
      case 'price_drop':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-[#B81D24] text-white rounded">
            <TrendingDown className="w-3 h-3" />
            <span>Price Drop</span>
          </span>
        );
      case 'price_increase':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-700 text-white rounded">
            <TrendingUp className="w-3 h-3" />
            <span>Price Updated</span>
          </span>
        );
      case 'promo_change':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-[#0F2942] text-[#FFD166] rounded">
            <Sparkles className="w-3 h-3" />
            <span>Promo Offer Change</span>
          </span>
        );
      case 'stock_restocked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-teal-700 text-white rounded">
            <PackageCheck className="w-3 h-3" />
            <span>Back in Stock</span>
          </span>
        );
      case 'stock_out':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-stone-600 text-white rounded">
            <PackageX className="w-3 h-3" />
            <span>Out of Stock</span>
          </span>
        );
      case 'removed_product':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-stone-800 text-white rounded">
            <AlertCircle className="w-3 h-3" />
            <span>Removed from Site</span>
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-center-title"
    >
      <div className="bg-white rounded-xl border-2 border-[#0F2942] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#0F2942] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFD166] text-[#141413] flex items-center justify-center shrink-0 mt-0.5">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="alert-center-title"
                  className="font-display text-lg sm:text-xl font-bold leading-tight"
                >
                  Live abdesai.mu Change Monitor & Notifications
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono-tabular font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>MONITORING LIVE</span>
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Watching <strong>abdesai.mu</strong> American Tourister category ({totalCatalogCount} products) every 60 seconds for new luggage items, price changes, promo updates & stock status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onCheckNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FFD166] text-[#141413] rounded-lg hover:bg-[#f5c44f] transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              <span>{isSyncing ? 'Checking abdesai.mu...' : 'Check Site Now'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Settings & Quick Controls Bar */}
        <div className="bg-[#F4F1EA] border-b border-black/10 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sound Alert Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-[#0F2942] text-white border-[#0F2942]'
                  : 'bg-white text-[#65645E] border-black/15'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#FFD166]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>Sound Chime: {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Browser Desktop Notification Permission */}
            {browserNotifPermission !== 'unsupported' && (
              <button
                type="button"
                onClick={onRequestBrowserPermission}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
                  browserNotifPermission === 'granted'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-[#141413] border-black/20 hover:bg-[#EFECE6]'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {browserNotifPermission === 'granted'
                    ? 'Desktop Push Alerts: ENABLED'
                    : browserNotifPermission === 'denied'
                      ? 'Desktop Alerts Blocked by Browser'
                      : 'Enable Desktop Push Alerts'}
                </span>
              </button>
            )}

            {/* Test Notification Button */}
            <button
              type="button"
              onClick={onTriggerTestAlert}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-white border border-black/15 text-[#B81D24] hover:bg-[#EFECE6] transition-colors cursor-pointer"
              title="Simulate a new American Tourister product / price alert to verify sound and popup notifications"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Test Alert Notification</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#65645E]">
            <span>{lastSyncedAt}</span>
            {events.length > 0 && (
              <>
                <a
                  href={buildWhatsAppAlertUrl(events)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold bg-[#1B5E3A] text-white rounded hover:bg-[#14492D] cursor-pointer"
                  title="Forward change report to AB Desai WhatsApp (+230 5498 8887) or Showroom Managers"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Forward All to WhatsApp</span>
                </a>
                <a
                  href={buildEmailAlertUrl(events)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold bg-white border border-black/15 text-[#0F2942] rounded hover:bg-[#EFECE6] cursor-pointer"
                  title="Send email summary of detected changes to info@abdesai.mu"
                >
                  <Mail className="w-3 h-3" />
                  <span>Email Report</span>
                </a>
              </>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold bg-white border border-black/15 text-[#0F2942] rounded hover:bg-[#EFECE6] cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Mark {unreadCount} Read</span>
              </button>
            )}
            {events.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold bg-white border border-black/15 text-[#B81D24] rounded hover:bg-[#EFECE6] cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Log</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-2.5 bg-white border-b border-black/8 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {[
            { id: 'all', label: `All Changes (${events.length})` },
            {
              id: 'new_product',
              label: `New Products (${
                events.filter((e) => e.type === 'new_product').length
              })`,
            },
            {
              id: 'price',
              label: `Price Changes (${
                events.filter(
                  (e) =>
                    e.type === 'price_drop' || e.type === 'price_increase'
                ).length
              })`,
            },
            {
              id: 'promo',
              label: `Promo Updates (${
                events.filter((e) => e.type === 'promo_change').length
              })`,
            },
            {
              id: 'stock',
              label: `Stock / Removed (${
                events.filter(
                  (e) =>
                    e.type === 'stock_restocked' ||
                    e.type === 'stock_out' ||
                    e.type === 'removed_product'
                ).length
              })`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-[#0F2942] text-white'
                  : 'bg-[#F4F1EA] text-[#65645E] hover:text-[#141413]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Change Event Feed */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-[#F9F9F8]">
          {filteredEvents.length === 0 ? (
            <div className="bg-white border border-black/10 rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-base font-bold text-[#141413]">
                No catalog changes detected yet — All {totalCatalogCount} American Tourister items match live abdesai.mu
              </div>
              <p className="text-xs text-[#65645E] max-w-lg mx-auto leading-relaxed">
                As soon as a new American Tourister suitcase, backpack, or combo is added on{' '}
                <strong>abdesai.mu</strong>, or any price, promo, or stock status changes, an instant notification banner + sound chime will alert you here.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onCheckNow}
                  className="px-4 py-2 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] cursor-pointer"
                >
                  Poll abdesai.mu Right Now
                </button>
                <button
                  type="button"
                  onClick={onTriggerTestAlert}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-black/15 text-[#141413] rounded-lg hover:bg-[#EFECE6] cursor-pointer"
                >
                  Simulate Sample New Product Alert
                </button>
              </div>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isUnread = !seenIds.has(ev.id);
              const timeFormatted = new Date(ev.detectedAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={ev.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isUnread
                      ? 'bg-[#FFFDF7] border-2 border-[#B81D24] shadow-sm'
                      : 'bg-white border-black/10'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {ev.image ? (
                      <img
                        src={ev.image}
                        alt={ev.productName}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-contain rounded-lg bg-white border border-black/10 p-1 shrink-0"
                      />
                    ) : null}

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderBadge(ev)}
                        {isUnread && (
                          <span className="px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase bg-[#FFD166] text-[#141413] rounded">
                            NEW ALERT
                          </span>
                        )}
                        <span className="text-[11px] font-mono-tabular text-[#65645E]">
                          {timeFormatted}
                        </span>
                        <span className="text-[11px] font-semibold text-[#0F2942]">
                          · {ev.series} ({ev.sizeCategory})
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#141413] leading-snug">
                        {ev.productName}
                      </h4>

                      <p className="text-xs text-[#65645E] leading-relaxed">
                        {ev.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono-tabular">
                        {ev.oldPriceRs !== undefined &&
                        ev.newPriceRs !== undefined &&
                        ev.oldPriceRs !== ev.newPriceRs ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[#65645E] line-through">
                              Old: {formatRs(ev.oldPriceRs)}
                            </span>
                            <span className="font-extrabold text-[#B81D24]">
                              → New: {formatRs(ev.newPriceRs)}
                            </span>
                          </div>
                        ) : ev.newPriceRs !== undefined ? (
                          <span className="font-extrabold text-[#0F2942]">
                            Price: {formatRs(ev.newPriceRs)}
                          </span>
                        ) : null}

                        {ev.newPromoBadge && (
                          <span className="text-[#B81D24] font-bold">
                            ★ {ev.newPromoBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions on Detected Change */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-end gap-1.5 shrink-0">
                    {ev.type !== 'removed_product' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenShelfTalker(ev.productId);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] cursor-pointer whitespace-nowrap"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Updated Talker</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenProduct(ev.productId);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#F4F1EA] text-[#141413] rounded-lg hover:bg-[#E2DDD3] cursor-pointer whitespace-nowrap"
                        >
                          <span>View Item Details</span>
                        </button>
                      </>
                    )}
                    <a
                      href={buildWhatsAppAlertUrl([ev])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] cursor-pointer whitespace-nowrap"
                      title="Forward this change notification to WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Alert</span>
                    </a>
                    {ev.permalink && (
                      <a
                        href={ev.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0F2942] hover:underline whitespace-nowrap"
                      >
                        <span>View on abdesai.mu</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
