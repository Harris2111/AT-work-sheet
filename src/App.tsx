import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Share2,
  Search,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
  ArrowUpRight,
  Check,
  X,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Bell,
  BellRing,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_ABDESAI_PRODUCTS,
  SHOWROOMS,
  AbDesaiATProduct,
  formatRs,
} from './data/luggageCatalog';
import {
  getProductSpecifications,
  getExactSizeClass,
  getProductStyleKey,
  extractColourName,
} from './data/productSpecs';
import { ProductImage } from './components/ProductImage';
import { SocialShareModal } from './components/SocialShareModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { ShelfTalkerStudioModal } from './components/ShelfTalkerStudioModal';
import { PriceListModal } from './components/PriceListModal';
import {
  CatalogAlertCenterModal,
  CatalogChangeEvent,
  buildWhatsAppAlertUrl,
} from './components/CatalogAlertCenterModal';

function resolveSwatchHex(colourName: string): string {
  const c = colourName.toLowerCase();
  if (c.includes('black') || c.includes('shadow') || c.includes('onyx'))
    return '#1E1E1E';
  if (c.includes('navy') || c.includes('oxford') || c.includes('cobalt'))
    return '#152A4A';
  if (c.includes('blue') || c.includes('cyan') || c.includes('denim'))
    return '#2563EB';
  if (c.includes('teal') || c.includes('turquoise') || c.includes('aqua'))
    return '#0D9488';
  if (c.includes('green') || c.includes('forest') || c.includes('sage') || c.includes('olive') || c.includes('khakhi') || c.includes('khaki'))
    return '#2F6F4E';
  if (c.includes('red') || c.includes('crimson') || c.includes('burgundy') || c.includes('wine') || c.includes('coral'))
    return '#B81D24';
  if (c.includes('yellow') || c.includes('gold') || c.includes('mustard') || c.includes('sun'))
    return '#EAB308';
  if (c.includes('pink') || c.includes('rose') || c.includes('magenta') || c.includes('blush'))
    return '#EC4899';
  if (c.includes('purple') || c.includes('lilac') || c.includes('lavender') || c.includes('violet'))
    return '#8B5CF6';
  if (c.includes('grey') || c.includes('gray') || c.includes('silver') || c.includes('graphite'))
    return '#6B7280';
  if (c.includes('brown') || c.includes('bronze') || c.includes('copper') || c.includes('sand') || c.includes('beige'))
    return '#92400E';
  return '#0F2942';
}

function playAlertChime() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Two-tone pleasant retail chime (A5 -> E6)
    const freqs = [880, 1318.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.38);
    });
  } catch {
    // ignore audio block
  }
}

const POPULAR_SERIES = [
  'All',
  'Skytrac',
  'Jamaica',
  'Dashway',
  'Dash Pop',
  'Duncan',
  'Bricklane',
  'Senna',
  'Novastream',
  'Gemina Pro',
  'Mystic',
  'Maxplus',
  'Ellipso',
  'Skylette',
  'Hundo',
  'Aerospin',
  'Trento',
  'Circurity',
  'Backpacks',
];

const SIZE_TABS = [
  'All',
  'Promos & Bundles',
  'Set of 3',
  'Combo / 2-Pack',
  'Large / X-Large',
  'Medium',
  'Cabin',
  'Backpack & Duffle',
];

export default function App() {
  const [products, setProducts] = useState<AbDesaiATProduct[]>(
    INITIAL_ABDESAI_PRODUCTS
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Verified Live Snapshot');
  const [priceUpdatesCount, setPriceUpdatesCount] = useState<number>(0);

  const [seriesFilter, setSeriesFilter] = useState<string>('All');
  const [sizeFilter, setSizeFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock'>('instock');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [promoDismissed, setPromoDismissed] = useState(false);

  const [justAddedId, setJustAddedId] = useState<number | null>(null);
  const [cardColourOverrides, setCardColourOverrides] = useState<
    Record<number, number>
  >({});
  const [groupCardsBySize, setGroupCardsBySize] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<AbDesaiATProduct | null>(
    null
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      key: String(INITIAL_ABDESAI_PRODUCTS[0].id),
      product: INITIAL_ABDESAI_PRODUCTS[0],
      quantity: 1,
    },
  ]);

  const [shareProduct, setShareProduct] = useState<AbDesaiATProduct | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShelfTalkerOpen, setIsShelfTalkerOpen] = useState(false);
  const [initialShelfTalkerId, setInitialShelfTalkerId] = useState<number | null>(
    null
  );
  const [isPriceListOpen, setIsPriceListOpen] = useState(false);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15);

  // Live abdesai.mu Change Monitor & Notification State
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState(false);
  const [changeEvents, setChangeEvents] = useState<CatalogChangeEvent[]>([]);
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('abdesai_seen_alert_ids');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // ignore
    }
    return new Set<string>();
  });
  const [activeToastEvents, setActiveToastEvents] = useState<
    CatalogChangeEvent[]
  >([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [browserNotifPermission, setBrowserNotifPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const markEventIdsSeen = useCallback((ids: string[]) => {
    setSeenEventIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      try {
        localStorage.setItem(
          'abdesai_seen_alert_ids',
          JSON.stringify(Array.from(next).slice(-400))
        );
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const triggerAlertNotifications = useCallback(
    (incomingEvents: CatalogChangeEvent[]) => {
      if (incomingEvents.length === 0) return;

      // 1. Show prominent in-app toast banner
      setActiveToastEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const fresh = incomingEvents.filter((e) => !existingIds.has(e.id));
        return [...fresh, ...prev].slice(0, 6);
      });

      // 2. Play chime if enabled
      if (soundEnabled) {
        playAlertChime();
      }

      // 3. Fire native browser desktop notification if granted
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const first = incomingEvents[0];
        const title =
          incomingEvents.length === 1
            ? `abdesai.mu Update: ${first.series} (${first.sizeCategory})`
            : `${incomingEvents.length} New Updates on abdesai.mu!`;
        try {
          new Notification(title, {
            body: first.summary,
            icon: first.image || undefined,
          });
        } catch {
          // ignore notification error in restricted frames
        }
      }
    },
    [soundEnabled]
  );

  const handleRequestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setBrowserNotifPermission(perm);
    } catch {
      // ignore
    }
  };

  const handleTriggerTestAlert = useCallback(() => {
    const sampleProd = products[0] || INITIAL_ABDESAI_PRODUCTS[0];
    const testEvent: CatalogChangeEvent = {
      id: `test-alert-${Date.now()}`,
      detectedAt: new Date().toISOString(),
      type: 'new_product',
      productId: sampleProd.id,
      productName: `${sampleProd.name}`,
      series: sampleProd.series,
      sizeCategory: sampleProd.sizeCategory,
      sku: sampleProd.sku,
      image: sampleProd.image,
      permalink: sampleProd.permalink,
      newPriceRs: sampleProd.priceRs,
      newRegularPriceRs: sampleProd.regularPriceRs,
      newPromoBadge: sampleProd.promoBadge || 'New Arrival in American Tourister',
      newInStock: true,
      summary: `[TEST NOTIFICATION] New American Tourister luggage / price update detected on abdesai.mu: ${sampleProd.name} at ${formatRs(
        sampleProd.priceRs
      )}`,
    };
    setChangeEvents((prev) => [testEvent, ...prev]);
    triggerAlertNotifications([testEvent]);
  }, [products, triggerAlertNotifications]);

  // Live Price, New Product & Stock Synchronization with abdesai.mu
  const syncWithAbDesai = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/abdesai-sync');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.products) && data.products.length > 0) {
          // Check client-side diff in addition to server-side history
          const clientDetected: CatalogChangeEvent[] = [];
          setProducts((prev) => {
            const prevMap = new Map<number, AbDesaiATProduct>(
              prev.map((item) => [item.id, item])
            );
            const nowIso = data.syncedAt || new Date().toISOString();

            for (const nextItem of data.products as AbDesaiATProduct[]) {
              const old = prevMap.get(nextItem.id);
              if (!old) {
                clientDetected.push({
                  id: `client-new-${nextItem.id}-${nextItem.priceRs}`,
                  detectedAt: nowIso,
                  type: 'new_product',
                  productId: nextItem.id,
                  productName: nextItem.name,
                  series: nextItem.series,
                  sizeCategory: nextItem.sizeCategory,
                  sku: nextItem.sku,
                  image: nextItem.image,
                  permalink: nextItem.permalink,
                  newPriceRs: nextItem.priceRs,
                  newRegularPriceRs: nextItem.regularPriceRs,
                  newPromoBadge: nextItem.promoBadge,
                  newInStock: nextItem.inStock,
                  summary: `NEW PRODUCT ADDED on abdesai.mu: ${nextItem.name} (${nextItem.series} · ${nextItem.sizeCategory}) at ${formatRs(
                    nextItem.priceRs
                  )}`,
                });
              } else if (old.priceRs !== nextItem.priceRs && nextItem.priceRs > 0) {
                const isDrop = nextItem.priceRs < old.priceRs;
                clientDetected.push({
                  id: `client-price-${nextItem.id}-${old.priceRs}-${nextItem.priceRs}`,
                  detectedAt: nowIso,
                  type: isDrop ? 'price_drop' : 'price_increase',
                  productId: nextItem.id,
                  productName: nextItem.name,
                  series: nextItem.series,
                  sizeCategory: nextItem.sizeCategory,
                  sku: nextItem.sku,
                  image: nextItem.image,
                  permalink: nextItem.permalink,
                  oldPriceRs: old.priceRs,
                  newPriceRs: nextItem.priceRs,
                  summary: `${
                    isDrop ? 'PRICE DROP' : 'PRICE UPDATE'
                  } on abdesai.mu: ${nextItem.name} changed from ${formatRs(
                    old.priceRs
                  )} → ${formatRs(nextItem.priceRs)}`,
                });
              } else if (old.inStock !== nextItem.inStock) {
                clientDetected.push({
                  id: `client-stock-${nextItem.id}-${nextItem.inStock}`,
                  detectedAt: nowIso,
                  type: nextItem.inStock ? 'stock_restocked' : 'stock_out',
                  productId: nextItem.id,
                  productName: nextItem.name,
                  series: nextItem.series,
                  sizeCategory: nextItem.sizeCategory,
                  sku: nextItem.sku,
                  image: nextItem.image,
                  permalink: nextItem.permalink,
                  oldPriceRs: old.priceRs,
                  newPriceRs: nextItem.priceRs,
                  oldInStock: old.inStock,
                  newInStock: nextItem.inStock,
                  summary: `${
                    nextItem.inStock ? 'BACK IN STOCK' : 'OUT OF STOCK'
                  } on abdesai.mu: ${nextItem.name}`,
                });
              }
            }
            if (clientDetected.length > 0) {
              setPriceUpdatesCount((c) => c + clientDetected.length);
            }
            return data.products;
          });

          // Merge server changeHistory + any newly detected events
          const serverHistory: CatalogChangeEvent[] = Array.isArray(
            data.changeHistory
          )
            ? data.changeHistory
            : [];
          const serverNew: CatalogChangeEvent[] = Array.isArray(data.newEvents)
            ? data.newEvents
            : [];

          setChangeEvents((prevEvents) => {
            const combined = [
              ...serverNew,
              ...clientDetected,
              ...serverHistory,
              ...prevEvents,
            ];
            const unique: CatalogChangeEvent[] = [];
            const seenKey = new Set<string>();
            for (const ev of combined) {
              const dedupeKey = `${ev.type}-${ev.productId}-${ev.oldPriceRs ?? ''}-${ev.newPriceRs ?? ''}-${ev.newInStock ?? ''}-${ev.id.startsWith('test-') ? ev.id : ''}`;
              if (!seenKey.has(dedupeKey)) {
                seenKey.add(dedupeKey);
                unique.push(ev);
              }
            }
            return unique.slice(0, 200);
          });

          const brandNewAlerts = [...serverNew, ...clientDetected];
          if (brandNewAlerts.length > 0) {
            triggerAlertNotifications(brandNewAlerts);
          }

          // Also keep cart item prices synced if any price changed on abdesai.mu
          const freshMap = new Map<number, AbDesaiATProduct>(
            (data.products as AbDesaiATProduct[]).map((p) => [p.id, p])
          );
          setCartItems((prevCart) =>
            prevCart.map((ci) => {
              const updatedProd = freshMap.get(ci.product.id);
              return updatedProd ? { ...ci, product: updatedProd } : ci;
            })
          );

          const timeStr = new Date(data.syncedAt || Date.now()).toLocaleTimeString(
            [],
            { hour: '2-digit', minute: '2-digit', second: '2-digit' }
          );
          setLastSyncedAt(`Live Checked abdesai.mu at ${timeStr}`);
        }
      }
    } catch {
      // Fallback to embedded verified snapshot silently
    } finally {
      setIsSyncing(false);
    }
  }, [triggerAlertNotifications]);

  // Sync on initial page load & every 60 seconds automatically for real-time change notifications
  useEffect(() => {
    syncWithAbDesai();
    const interval = setInterval(syncWithAbDesai, 60 * 1000);
    return () => clearInterval(interval);
  }, [syncWithAbDesai]);

  // Handle deep link query parameter (?product=slug)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const productSlug = params.get('product');
    if (productSlug) {
      const found = products.find(
        (p) => p.slug === productSlug || String(p.id) === productSlug
      );
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, [products]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleLimit(24);
  }, [seriesFilter, sizeFilter, stockFilter, searchQuery]);

  const dynamicSeriesTabs = useMemo(() => {
    const present = new Set(products.map((p) => p.series));
    const base = POPULAR_SERIES.filter(
      (s) => s === 'All' || present.has(s) || s === 'Backpacks'
    );
    const extras = Array.from(present).filter(
      (s) =>
        !base.includes(s) &&
        s !== 'Backpacks & Briefcases' &&
        s !== 'Duffle & Cabin Bags'
    );
    return [...base, ...extras];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const matched = products.filter((p) => {
      if (stockFilter === 'instock' && !p.inStock) return false;
      if (seriesFilter !== 'All') {
        if (seriesFilter === 'Backpacks') {
          if (
            p.series !== 'Backpacks & Briefcases' &&
            p.series !== 'Duffle & Cabin Bags'
          )
            return false;
        } else if (p.series !== seriesFilter) {
          return false;
        }
      }
      if (sizeFilter === 'Promos & Bundles') {
        if (!p.hasPromo) return false;
      } else if (sizeFilter !== 'All') {
        if (p.sizeCategory !== sizeFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSeries = p.series.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchPromo = (p.promoBadge || '').toLowerCase().includes(q);
        if (!matchName && !matchSeries && !matchSku && !matchPromo) return false;
      }
      return true;
    });

    if (!groupCardsBySize) return matched;

    // Group by exact Product Style + Size so we show 1 card/image per style+size and mention the other colours right below it, while keeping different Duffle Bags, Backpacks, and Briefcases separate
    const seenKeys = new Set<string>();
    const uniqueByStyle: AbDesaiATProduct[] = [];
    for (const item of matched) {
      const groupKey = getProductStyleKey(item);
      if (!seenKeys.has(groupKey)) {
        seenKeys.add(groupKey);
        uniqueByStyle.push(item);
      }
    }
    return uniqueByStyle;
  }, [products, seriesFilter, sizeFilter, stockFilter, searchQuery, groupCardsBySize]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit]
  );

  // All Featured Promo Slides from abdesai.mu (Rotates automatically every 15 seconds)
  const heroPromoItems = useMemo(() => {
    const curatedPromoIds = [
      56981, // Jamaica Medium 3 pcs (3 × Medium at Rs 11,990, Was Rs 17,970)
      56513, // Jamaica Cabin + Large Navy Blue (Rs 9,000, Was Rs 12,300)
      56583, // Skytrac Large Offer (2 Units at Rs 12,000)
      56584, // Skytrac Medium Offer (2 Units at Rs 10,500)
      56582, // Skytrac Cabin Offer (2 Units at Rs 8,250)
      41271, // Skytrac Set of 3 Navy (Rs 15,990)
      50400, // Skylette Set 3pcs Navy Blue (Rs 16,990)
      55860, // Dashway Set 3 Grey Black (Rs 16,500)
      50787, // Duncan Set of 3 Navy Blue (Rs 16,500)
      56265, // Mystic Set of 3 Blue (Rs 14,990)
      55872, // Gemina PRO L Black + Free Copper Bottle (Rs 9,495)
      47874, // Novastream Medium + Free RICO Rice Cooker (Rs 10,990)
      47808, // Bricklane 80cm + Get 1 Cabin at Half Price (Rs 8,000)
      52138, // Aerospin XL Stone Basalt + Free Baseus Powerbank (Rs 9,000)
    ];
    const matched = curatedPromoIds
      .map((id) => products.find((p) => p.id === id && p.hasPromo))
      .filter((p): p is AbDesaiATProduct => Boolean(p));
    return matched.length > 0 ? matched : products.filter((p) => p.hasPromo);
  }, [products]);

  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const currentHeroProduct =
    heroPromoItems[activeHeroIdx] || products[0];

  // Auto-advance the changing promo banner every 15 seconds
  useEffect(() => {
    if (isBannerPaused || heroPromoItems.length <= 1) return;
    const ticker = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setActiveHeroIdx((idx) => (idx + 1) % heroPromoItems.length);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [isBannerPaused, heroPromoItems.length]);

  const relatedSeriesProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products.filter((p) => p.series === selectedProduct.series);
  }, [products, selectedProduct]);

  const handleAddToCart = (product: AbDesaiATProduct) => {
    const key = String(product.id);
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.key === key);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { key, product, quantity: 1 }];
    });
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1400);
  };

  const handleUpdateCartQuantity = (key: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (key: string) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  const totalBagCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F8] text-[#141413]">
      {/* Slim Dismissible Top Promotional Banner (<= 40px) */}
      {!promoDismissed && (
        <div
          className={`bg-[#141413] text-white px-4 h-9 flex items-center justify-between text-xs ${
            isShelfTalkerOpen || isPriceListOpen ? 'no-print' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <p className="truncate">
              <span>Official A.B. Desai American Tourister Store (abdesai.mu)</span>
              <span className="mx-2 text-white/40" aria-hidden="true">·</span>
              <span className="text-[#D4B886]">
                WhatsApp: +230 5979 7960 · Customers Must Confirm Availability Before Payment · Home Deliveries Up to 10 Days
              </span>
            </p>
            <button
              type="button"
              onClick={() => setPromoDismissed(true)}
              className="text-white/60 hover:text-white ml-3 shrink-0 cursor-pointer"
              aria-label="Dismiss promotional banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Strict 3-Zone Top Bar Contract */}
      <header
        className={`sticky top-0 z-30 bg-[#F9F9F8]/95 backdrop-blur-xs border-b border-black/8 ${
          isShelfTalkerOpen || isPriceListOpen ? 'no-print' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setSeriesFilter('All');
              setSizeFilter('All');
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-xl lg:text-2xl font-semibold tracking-tight text-[#141413] whitespace-nowrap shrink-0"
          >
            A.B. Desai · American Tourister
          </a>

          {/* Zone 2: Clean store navigation links (no duplicates of action buttons) */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-[#65645E]">
            <a
              href="#collection"
              onClick={() => {
                setSeriesFilter('All');
                setSizeFilter('All');
              }}
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              All {products.length} Products
            </a>
            <a
              href="#collection"
              onClick={() => {
                setSeriesFilter('All');
                setSizeFilter('Promos & Bundles');
              }}
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Promos & BOGO
            </a>
            <a
              href="#showrooms"
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              6 Showrooms
            </a>
          </nav>

          {/* Zone 3: Primary actions — Live Alerts, Shelf Talkers, Master Price List, Share Store & Bag */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAlertCenterOpen(true)}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                changeEvents.some((e) => !seenEventIds.has(e.id))
                  ? 'bg-[#FFD166] text-[#141413] border-[#B81D24] shadow-xs'
                  : 'bg-white text-[#0F2942] border-black/15 hover:bg-[#EFECE6]'
              }`}
              title="Live abdesai.mu Change Monitor & Notifications (New Products, Price Changes & Stock Alerts)"
            >
              <span className="relative flex items-center">
                {changeEvents.some((e) => !seenEventIds.has(e.id)) ? (
                  <BellRing className="w-3.5 h-3.5 text-[#B81D24] animate-bounce" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-[#0F2942]" />
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5" />
              </span>
              <span className="hidden md:inline">Live Alerts</span>
              {changeEvents.filter((e) => !seenEventIds.has(e.id)).length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono-tabular font-black bg-[#B81D24] text-white rounded-full">
                  {changeEvents.filter((e) => !seenEventIds.has(e.id)).length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setInitialShelfTalkerId(null);
                setIsShelfTalkerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#141413] bg-[#FFD166] border border-black/20 rounded-lg hover:bg-[#f5c44f] transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              title="Open Printable A6 & A4 Showroom Shelf Talker Studio"
            >
              <Printer className="w-3.5 h-3.5 text-[#B81D24]" />
              <span>Shelf Talkers</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPriceListOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#B81D24] rounded-lg hover:bg-[#96161C] transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Master Price List</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShareProduct(null);
                setIsShareOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-white bg-[#1B5E3A] rounded-lg hover:bg-[#14492D] transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              title="Generate 9:16 WhatsApp Status Posters & Share Store Link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Status / Share</span>
              <span className="sm:hidden">Status</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#091A2B] transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag ({totalBagCount})</span>
            </button>
          </div>
        </div>
      </header>

      <main
        className={`flex-1 ${
          isShelfTalkerOpen || isPriceListOpen ? 'no-print' : ''
        }`}
      >
        {/* SECTION 1: Storefront Hero featuring Official abdesai.mu Promo Spotlight */}
        <section id="top" className="border-b border-black/8 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Copy & Focal CTA */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#65645E]">
                <span className="font-semibold text-[#0F2942]">
                  Official Mauritius Distributor · A.B. Desai
                </span>
                <span aria-hidden="true">·</span>
                <span>{lastSyncedAt}</span>
                <button
                  type="button"
                  onClick={syncWithAbDesai}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 text-[#0F2942] font-semibold hover:underline cursor-pointer"
                  title="Check abdesai.mu for live price changes"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Prices Now'}</span>
                </button>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#141413] leading-[1.12] tracking-tight">
                Authentic American Tourister Luggage & Mauritian Promos.
              </h1>

              <p className="text-base text-[#65645E] leading-relaxed max-w-xl">
                Every suitcase, 3-piece set, combo bundle, and price is verified and live-synced with{' '}
                <strong>abdesai.mu</strong>. Shop Jamaica 3× Medium Sets & Cabin + XL Combos, Skytrac (2nd at 50% off), Bricklane (Cabin at 50% off), Dashway, Duncan, Novastream, and Gemina Pro with official images and 3-Year Global Warranty.
              </p>

              {/* Single Focal CTA + Printable Shelf Talkers + Social Share */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href="#collection"
                  onClick={() => {
                    setSeriesFilter('All');
                    setSizeFilter('Promos & Bundles');
                  }}
                  className="px-5 py-3 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#091A2B] transition-colors whitespace-nowrap"
                >
                  Shop Active Promos & BOGO Deals
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setInitialShelfTalkerId(null);
                    setIsShelfTalkerOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#141413] bg-[#EFECE6] hover:bg-[#E2DDD3] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5 text-[#0F2942]" />
                  <span>Print Shop Shelf Talkers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPriceListOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#141413] bg-white border border-black/15 hover:bg-[#EFECE6] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F2942]" />
                  <span>Updated Price & Promo List</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShareProduct(null);
                    setIsShareOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492D] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Status Poster</span>
                </button>
              </div>

              {/* Quantitative Highlights */}
              <div className="pt-4 border-t border-black/8 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="font-mono-tabular font-semibold text-sm text-[#141413]">
                    {products.length} Verified Items
                  </div>
                  <div className="text-[#65645E] mt-0.5">
                    Live Price Sync with abdesai.mu
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular font-semibold text-sm text-[#141413]">
                    Free Delivery
                  </div>
                  <div className="text-[#65645E] mt-0.5">
                    Orders from Rs 3,000 in Mauritius
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular font-semibold text-sm text-[#141413]">
                    6 Island Outlets
                  </div>
                  <div className="text-[#65645E] mt-0.5">
                    Port-Louis · Tribeca · Trianon · Bagatelle · Cascavelle · Rose-Belle
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive 15-Second Changing Promo Banner */}
            <div className="lg:col-span-6">
              {currentHeroProduct && (
                <div className="bg-[#F9F9F8] rounded-xl border border-black/12 p-5 space-y-4 shadow-sm">
                  {/* Top Banner Header with 15s Auto-Change Controls */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono-tabular font-semibold text-[#0F2942]">
                        PROMO {activeHeroIdx + 1}/{heroPromoItems.length}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#9E2A2B] truncate">
                        {currentHeroProduct.promoBadge || 'Featured Offer'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-mono-tabular text-[#65645E]">
                        {isBannerPaused ? 'Paused' : `Next in ${secondsRemaining}s`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBannerPaused((p) => !p)}
                        className="p-1.5 rounded-md bg-white border border-black/10 text-[#141413] hover:bg-[#EFECE6] cursor-pointer"
                        title={isBannerPaused ? 'Resume 15s rotation' : 'Pause 15s rotation'}
                        aria-label={isBannerPaused ? 'Resume rotation' : 'Pause rotation'}
                      >
                        {isBannerPaused ? (
                          <Play className="w-3 h-3" />
                        ) : (
                          <Pause className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeroIdx(
                            (idx) =>
                              (idx - 1 + heroPromoItems.length) %
                              heroPromoItems.length
                          );
                          setSecondsRemaining(15);
                        }}
                        className="p-1.5 rounded-md bg-white border border-black/10 text-[#141413] hover:bg-[#EFECE6] cursor-pointer"
                        aria-label="Previous promo"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeroIdx(
                            (idx) => (idx + 1) % heroPromoItems.length
                          );
                          setSecondsRemaining(15);
                        }}
                        className="p-1.5 rounded-md bg-white border border-black/10 text-[#141413] hover:bg-[#EFECE6] cursor-pointer"
                        aria-label="Next promo"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Changing Promo Image Showcase */}
                  <div
                    onClick={() => setSelectedProduct(currentHeroProduct)}
                    className="relative aspect-16/10 w-full bg-white rounded-lg border border-black/8 p-4 flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    <ProductImage
                      key={currentHeroProduct.id}
                      src={currentHeroProduct.image}
                      alt={currentHeroProduct.name}
                      series={currentHeroProduct.series}
                      title={currentHeroProduct.name}
                      className="max-h-full max-w-full object-contain transition-all duration-300 hover:scale-103"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <h2
                        onClick={() => setSelectedProduct(currentHeroProduct)}
                        className="font-display text-2xl font-semibold text-[#141413] hover:text-[#0F2942] cursor-pointer line-clamp-2 leading-snug"
                      >
                        {currentHeroProduct.name}
                      </h2>
                      <div className="flex items-baseline gap-2.5 mt-1">
                        <span className="font-mono-tabular text-2xl font-bold text-[#0F2942]">
                          {formatRs(currentHeroProduct.priceRs)}
                        </span>
                        {currentHeroProduct.regularPriceRs && (
                          <span className="font-mono-tabular text-xs text-[#65645E] line-through">
                            Was {formatRs(currentHeroProduct.regularPriceRs)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(currentHeroProduct)}
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#091A2B] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Add Promo to Bag
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Promo Thumbnail Strip */}
                  <div className="pt-3 border-t border-black/8 flex items-center gap-2 overflow-x-auto pb-1">
                    {heroPromoItems.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveHeroIdx(idx);
                          setSecondsRemaining(15);
                        }}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer shrink-0 min-w-[125px] ${
                          activeHeroIdx === idx
                            ? 'border-[#0F2942] bg-white shadow-2xs'
                            : 'border-black/8 bg-white/50 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="text-[11px] font-semibold text-[#141413] truncate">
                          {item.series} ({item.sizeCategory})
                        </div>
                        <div className="text-[11px] font-mono-tabular text-[#0F2942] font-semibold">
                          {formatRs(item.priceRs)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: Complete American Tourister Catalogue & Live Filter Controls */}
        <section id="collection" className="max-w-7xl mx-auto px-6 py-12 space-y-7">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/8 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#65645E]">
                <span>01. Verified AB Desai American Tourister Catalogue</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  Showing {filteredProducts.length} of {products.length} Products
                </span>
                {priceUpdatesCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-800 font-semibold">
                      {priceUpdatesCount} Live Price Updates Synced
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-display text-3xl font-semibold text-[#141413] mt-1">
                American Tourister Mauritius — All Collections & Promos
              </h2>
            </div>

            {/* Search & Stock Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#65645E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Skytrac, Jamaica, Bricklane, Dashway..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-black/15 rounded-lg focus:outline-none focus:border-[#0F2942]"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-lg">
                <button
                  type="button"
                  onClick={() => setStockFilter('instock')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    stockFilter === 'instock'
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#65645E]'
                  }`}
                >
                  In Stock ({products.filter((p) => p.inStock).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    stockFilter === 'all'
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#65645E]'
                  }`}
                >
                  All ({products.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setGroupCardsBySize((prev) => !prev)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  groupCardsBySize
                    ? 'bg-[#0F2942] text-white border-[#0F2942]'
                    : 'bg-white text-[#141413] border-black/15 hover:bg-[#EFECE6]'
                }`}
                title="Show 1 image per size and mention the other colours right below it"
              >
                {groupCardsBySize
                  ? '✓ 1 Image per Size (+ Other Colours Listed)'
                  : 'Show All Colour Cards Separately'}
              </button>
            </div>
          </div>

          {/* Size / Promo Filter Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 p-1 bg-[#EFECE6] rounded-lg overflow-x-auto">
              {SIZE_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSizeFilter(tab)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    sizeFilter === tab
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#65645E] hover:text-[#141413]'
                  }`}
                >
                  {tab === 'All' ? 'All Categories' : tab}
                </button>
              ))}
            </div>

            {/* Series Filter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-[#65645E] mr-1 shrink-0">
                Collection:
              </span>
              {dynamicSeriesTabs.map((series) => (
                <button
                  key={series}
                  type="button"
                  onClick={() => setSeriesFilter(series)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                    seriesFilter === series
                      ? 'border-[#0F2942] bg-[#0F2942] text-white'
                      : 'border-black/10 bg-white text-[#65645E] hover:text-[#141413]'
                  }`}
                >
                  {series === 'All' ? 'All Series' : series}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Product Grid with Official abdesai.mu Images & Verified Prices */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-black/8 rounded-xl p-12 text-center space-y-3">
              <p className="text-base font-semibold text-[#141413]">
                No American Tourister items match your current filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSeriesFilter('All');
                  setSizeFilter('All');
                  setStockFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#0F2942] text-white rounded-lg cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {visibleProducts.map((rawCardProduct) => {
                  const activeOverrideId =
                    cardColourOverrides[rawCardProduct.id];
                  const product =
                    (activeOverrideId &&
                      products.find((p) => p.id === activeOverrideId)) ||
                    rawCardProduct;

                  const isAdded = justAddedId === product.id;
                  const savings =
                    product.regularPriceRs && product.regularPriceRs > product.priceRs
                      ? product.regularPriceRs - product.priceRs
                      : 0;
                  const itemSpecs = getProductSpecifications(product, products);

                  // Find sibling colour variants of the exact same Product Style & Size
                  const rawStyleKey = getProductStyleKey(rawCardProduct);
                  const colourSiblings = products.filter(
                    (p) =>
                      getProductStyleKey(p) === rawStyleKey && p.priceRs > 0
                  );

                  return (
                    <article
                      key={rawCardProduct.id}
                      className="group bg-white rounded-xl border border-black/8 overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div>
                        {/* Official Product Photo from abdesai.mu */}
                        <div
                          onClick={() => setSelectedProduct(product)}
                          className="relative aspect-4/3 w-full bg-white border-b border-black/6 p-5 flex items-center justify-center cursor-pointer overflow-hidden"
                        >
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            series={product.series}
                            title={product.name}
                            className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-105"
                          />

                          {/* Share & Print A6 Shelf Talker Buttons (Available on ALL items!) */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInitialShelfTalkerId(product.id);
                                setIsShelfTalkerOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFD166] hover:bg-[#f5c44f] text-[#141413] text-[11px] font-bold border border-black/15 shadow-xs transition-colors cursor-pointer"
                              aria-label={`Print A6 Specification Shelf Talker for ${product.name}`}
                              title="Edit & Print Vertical A6 Specification & Price Shelf Talker"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#B81D24]" />
                              <span>Shelf Talker</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareProduct(product);
                                setIsShareOpen(true);
                              }}
                              className="p-2 rounded-lg bg-[#F9F9F8] hover:bg-[#EFECE6] text-[#141413] border border-black/8 transition-colors cursor-pointer"
                              aria-label={`Share ${product.name}`}
                              title="Share on WhatsApp / Instagram / Facebook"
                            >
                              <Share2 className="w-3.5 h-3.5 text-[#0F2942]" />
                            </button>
                          </div>
                        </div>

                        {/* Directly below the 1 image: Mention the shown colour and the other available colours */}
                        {colourSiblings.length > 1 && (
                          <div className="px-5 py-2.5 bg-[#F4F2ED]/80 border-b border-black/6 text-xs">
                            <div className="text-[#141413] leading-snug">
                              <span className="font-bold text-[#0F2942]">
                                Shown: {extractColourName(product)}
                              </span>
                              <span className="mx-1.5 text-[#65645E]">·</span>
                              <span className="font-semibold text-[#141413]">
                                Also available in:{' '}
                              </span>
                              <span className="text-[#65645E] font-medium">
                                {Array.from(
                                  new Set(
                                    colourSiblings
                                      .map((s) => extractColourName(s))
                                      .filter(
                                        (c) => c !== extractColourName(product)
                                      )
                                  )
                                ).join(', ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              {colourSiblings.map((sib) => {
                                const cName = extractColourName(sib);
                                const isCurrent = sib.id === product.id;
                                return (
                                  <button
                                    key={sib.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCardColourOverrides((prev) => ({
                                        ...prev,
                                        [rawCardProduct.id]: sib.id,
                                      }));
                                    }}
                                    title={`Preview ${cName} (${formatRs(sib.priceRs)})`}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                                      isCurrent
                                        ? 'border-[#0F2942] bg-[#0F2942] text-white font-bold shadow-2xs'
                                        : 'border-black/12 bg-white text-[#141413] hover:border-[#0F2942]'
                                    }`}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full border border-white/40 shrink-0"
                                      style={{
                                        backgroundColor: resolveSwatchHex(cName),
                                      }}
                                    />
                                    <span className="max-w-[72px] truncate">
                                      {cName}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Card Body */}
                        <div className="p-5 space-y-2.5">
                          {/* Unboxed Metadata Line (Zero Pill Discipline) */}
                          <div className="flex items-center justify-between gap-2 text-xs text-[#65645E]">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-semibold text-[#141413]">
                                {product.series}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{itemSpecs.sizeClass}</span>
                            </div>
                            {product.promoBadge && (
                              <span className="text-[#8C6D3F] font-semibold truncate">
                                {product.promoBadge}
                              </span>
                            )}
                          </div>

                          {/* Exact Product Title from abdesai.mu */}
                          <h3
                            onClick={() => setSelectedProduct(product)}
                            className="text-base font-semibold text-[#141413] hover:text-[#0F2942] cursor-pointer transition-colors line-clamp-2 min-h-[3rem] leading-snug"
                          >
                            {product.name}
                          </h3>

                          {/* Technical Specs Line: Dimensions · Volume · Weight */}
                          <div className="text-xs font-mono-tabular text-[#0F2942] font-semibold">
                            {itemSpecs.dimensionsCm} · {itemSpecs.volumeLitres} · {itemSpecs.weightKg}
                          </div>

                          {/* Specs & SKU */}
                          <p className="text-xs text-[#65645E] line-clamp-2 leading-relaxed">
                            {product.specsText}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer: Verified Mauritian Rupee Price & Actions */}
                      <div className="px-5 pb-5 pt-3 border-t border-black/6 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono-tabular text-lg font-semibold text-[#141413]">
                              {formatRs(product.priceRs)}
                            </span>
                            {product.regularPriceRs && (
                              <span className="font-mono-tabular text-xs text-[#65645E] line-through">
                                {formatRs(product.regularPriceRs)}
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-[#65645E]">
                            {savings > 0
                              ? `Save ${formatRs(savings)} · In Stock`
                              : product.inStock
                              ? `SKU: ${product.sku}`
                              : 'Out of Stock'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            className="px-3 py-2 text-xs font-semibold text-[#141413] bg-[#F4F2ED] hover:bg-[#E2DDD3] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            disabled={!product.inStock}
                            onClick={() => handleAddToCart(product)}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1 ${
                              product.inStock
                                ? 'text-white bg-[#0F2942] hover:bg-[#091A2B] cursor-pointer'
                                : 'text-[#65645E] bg-black/10 cursor-not-allowed'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added</span>
                              </>
                            ) : (
                              <span>{product.inStock ? 'Add to Bag' : 'Sold Out'}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Load More Button if there are more items */}
              {visibleLimit < filteredProducts.length && (
                <div className="pt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((prev) => prev + 24)}
                    className="px-6 py-3 text-xs font-semibold text-[#141413] bg-white border border-black/15 rounded-lg hover:bg-[#EFECE6] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Load More Products ({filteredProducts.length - visibleLimit} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* SECTION 3: AB Desai 6 Showrooms, Official Contacts & Live Price Sync */}
        <section id="showrooms" className="border-t border-black/8 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-14 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#65645E]">
                  <span>02. Official Mauritian Showrooms & After-Sales</span>
                  <span aria-hidden="true">·</span>
                  <span>Dandiwalla Co Ltd (A.B. Desai) · Online WhatsApp: +230 5979 7960</span>
                </div>
                <h2 className="font-display text-3xl font-semibold text-[#141413] mt-1">
                  6 Showrooms Across Mauritius & Direct Contact Numbers
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsShelfTalkerOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2942] hover:underline cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print In-Shop Promo Shelf Talkers</span>
                </button>
                <a
                  href="https://abdesai.mu/contact-us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2942] hover:underline whitespace-nowrap"
                >
                  <span>Official Contact Page</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SHOWROOMS.map((showroom) => (
                <div
                  key={showroom.id}
                  className="p-5 rounded-xl bg-[#F9F9F8] border border-black/8 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#141413]">
                      {showroom.name}
                    </h3>
                    <p className="text-xs text-[#65645E] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0F2942] shrink-0 mt-0.5" />
                      <span>{showroom.address}</span>
                    </p>
                    <p className="text-xs text-[#65645E]">{showroom.hours}</p>
                    <p className="text-xs text-[#8C6D3F] font-medium pt-1">
                      {showroom.note}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/6 space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={`tel:${showroom.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 font-mono-tabular font-semibold text-[#0F2942] hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{showroom.phone}</span>
                      </a>
                      {showroom.secondaryPhone && (
                        <span className="font-mono-tabular text-[11px] text-[#65645E]">
                          {showroom.secondaryPhone}
                        </span>
                      )}
                    </div>
                    <a
                      href={`mailto:${showroom.email}`}
                      className="inline-flex items-center gap-1.5 text-[11px] text-[#65645E] hover:text-[#141413]"
                    >
                      <Mail className="w-3 h-3 text-[#0F2942]" />
                      <span>{showroom.email}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-black/8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-[#0F2942] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#141413]">
                    Automatic Live Price & Image Synchronization
                  </h4>
                  <p className="text-[#65645E] mt-0.5 leading-relaxed">
                    Connected directly to the official <strong>abdesai.mu</strong> WooCommerce Store API. Any price change, new promotional bundle, or stock update on abdesai.mu automatically updates here.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#0F2942] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#141413]">
                    Home Delivery (Up to 10 Days) & Availability Before Payment
                  </h4>
                  <p className="text-[#65645E] mt-0.5 leading-relaxed">
                    Customers must confirm stock & colour availability on WhatsApp (<strong>+230 5979 7960</strong>) before payment. Free home delivery across Mauritius from Rs 3,000 (home deliveries can take <strong>up to 10 days</strong>), or choose Showroom Click & Collect.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0F2942] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#141413]">
                    3-Year Global Warranty & Local After-Sales
                  </h4>
                  <p className="text-[#65645E] mt-0.5 leading-relaxed">
                    All American Tourister suitcases carry a 3-Year Global Warranty in 120+ countries, backed by AB Desai’s dedicated service center on the 2nd Floor of 9, Corderie Street, Port Louis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 4: Footer */}
      <footer
        className={`bg-[#141413] text-white/80 border-t border-black/15 ${
          isShelfTalkerOpen || isPriceListOpen ? 'no-print' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs">
          <div className="space-y-1">
            <div className="font-display text-lg font-semibold text-white">
              A.B. Desai Travel — Official American Tourister Store Mauritius
            </div>
            <p className="text-white/60">
              Operated by Dandiwalla Co Ltd · 9, Corderie Street, Port Louis · Tel: +230 211 4114 · WhatsApp: +230 5979 7960 · info@abdesai.mu · Please confirm availability before payment · Home deliveries can take up to 10 days
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-white/70">
            <a href="#collection" className="hover:text-white transition-colors">
              All 193 Products
            </a>
            <button
              type="button"
              onClick={syncWithAbDesai}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Sync Prices Now
            </button>
            <button
              type="button"
              onClick={() => {
                setShareProduct(null);
                setIsShareOpen(true);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Share Storefront
            </button>
            <a
              href="https://abdesai.mu/product-tag/american-tourister/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              abdesai.mu
            </a>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        relatedSeriesProducts={relatedSeriesProducts}
        onSelectProduct={(prod) => setSelectedProduct(prod)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onOpenShare={(prod) => {
          setSelectedProduct(null);
          setShareProduct(prod);
          setIsShareOpen(true);
        }}
      />

      <SocialShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        product={shareProduct}
        allProducts={products}
        onSelectProduct={(prod) => setShareProduct(prod)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
      />

      <ShelfTalkerStudioModal
        isOpen={isShelfTalkerOpen}
        onClose={() => {
          setIsShelfTalkerOpen(false);
          setInitialShelfTalkerId(null);
        }}
        products={products}
        initialProductId={initialShelfTalkerId}
        onOpenPriceList={() => {
          setIsShelfTalkerOpen(false);
          setIsPriceListOpen(true);
        }}
      />

      <PriceListModal
        isOpen={isPriceListOpen}
        onClose={() => setIsPriceListOpen(false)}
        products={products}
        lastSyncedAt={lastSyncedAt}
        isSyncing={isSyncing}
        onSyncNow={syncWithAbDesai}
        onOpenShelfTalkerForProduct={(prodId) => {
          setIsPriceListOpen(false);
          setInitialShelfTalkerId(prodId);
          setIsShelfTalkerOpen(true);
        }}
        onOpenAlertCenter={() => {
          setIsPriceListOpen(false);
          setIsAlertCenterOpen(true);
        }}
        unreadAlertsCount={
          changeEvents.filter((e) => !seenEventIds.has(e.id)).length
        }
      />

      {/* Live abdesai.mu Change Monitor & Alert Center Modal */}
      <CatalogAlertCenterModal
        isOpen={isAlertCenterOpen}
        onClose={() => {
          setIsAlertCenterOpen(false);
          markEventIdsSeen(changeEvents.map((e) => e.id));
        }}
        events={changeEvents}
        seenIds={seenEventIds}
        onMarkAllRead={() => markEventIdsSeen(changeEvents.map((e) => e.id))}
        onClearHistory={async () => {
          setChangeEvents([]);
          setActiveToastEvents([]);
          try {
            await fetch('/api/abdesai-alerts-clear', { method: 'POST' });
          } catch {
            // ignore
          }
        }}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        onCheckNow={syncWithAbDesai}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        browserNotifPermission={browserNotifPermission}
        onRequestBrowserPermission={handleRequestBrowserPermission}
        onTriggerTestAlert={handleTriggerTestAlert}
        onOpenProduct={(prodId) => {
          const found = products.find((p) => p.id === prodId);
          if (found) setSelectedProduct(found);
        }}
        onOpenShelfTalker={(prodId) => {
          setInitialShelfTalkerId(prodId);
          setIsShelfTalkerOpen(true);
        }}
        totalCatalogCount={products.length}
      />

      {/* Instant Pop-Up Toast Notification Banner whenever a new product or price change is detected on abdesai.mu */}
      {activeToastEvents.length > 0 && (
        <div
          className="no-print fixed bottom-5 right-5 z-50 w-full max-w-md bg-[#0F2942] text-white rounded-xl border-2 border-[#FFD166] shadow-2xl p-4 space-y-3"
          role="alert"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#B81D24] text-[#FFD166] flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 animate-bounce" />
              </span>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#FFD166]">
                  Live abdesai.mu Change Detected ({activeToastEvents.length})
                </div>
                <div className="text-[11px] text-white/80">
                  American Tourister Mauritius Catalog Updated
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                markEventIdsSeen(activeToastEvents.map((e) => e.id));
                setActiveToastEvents([]);
              }}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activeToastEvents.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-lg bg-white/10 border border-white/15 flex items-center gap-2.5"
              >
                {ev.image ? (
                  <img
                    src={ev.image}
                    alt={ev.productName}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded bg-white object-contain p-0.5 shrink-0"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-extrabold uppercase text-[#FFD166]">
                    {ev.type === 'new_product'
                      ? '★ NEW PRODUCT ADDED'
                      : ev.type === 'price_drop'
                        ? '↓ PRICE DROP'
                        : ev.type === 'price_increase'
                          ? '↑ PRICE UPDATED'
                          : ev.type === 'promo_change'
                            ? '★ PROMO OFFER UPDATED'
                            : 'STOCK STATUS CHANGED'}
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {ev.productName}
                  </div>
                  <div className="text-[11px] font-mono-tabular text-white/90 truncate">
                    {ev.oldPriceRs && ev.newPriceRs && ev.oldPriceRs !== ev.newPriceRs
                      ? `${formatRs(ev.oldPriceRs)} → ${formatRs(ev.newPriceRs)}`
                      : ev.newPriceRs
                        ? formatRs(ev.newPriceRs)
                        : ev.summary}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                const firstId = activeToastEvents[0]?.productId;
                markEventIdsSeen(activeToastEvents.map((e) => e.id));
                setActiveToastEvents([]);
                if (firstId) {
                  setInitialShelfTalkerId(firstId);
                  setIsShelfTalkerOpen(true);
                }
              }}
              className="flex-1 py-2 px-2.5 text-xs font-bold bg-[#FFD166] text-[#141413] rounded-lg hover:bg-[#f5c44f] text-center cursor-pointer"
            >
              Print Talker
            </button>
            <a
              href={buildWhatsAppAlertUrl(activeToastEvents)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2.5 text-xs font-bold bg-[#1B5E3A] hover:bg-[#14492D] text-white rounded-lg cursor-pointer whitespace-nowrap"
              title="Forward this live change alert to WhatsApp (+230 5979 7960)"
            >
              WhatsApp Alert
            </a>
            <button
              type="button"
              onClick={() => {
                setActiveToastEvents([]);
                setIsAlertCenterOpen(true);
              }}
              className="py-2 px-2.5 text-xs font-bold bg-white/15 hover:bg-white/25 text-white rounded-lg cursor-pointer whitespace-nowrap"
            >
              All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
