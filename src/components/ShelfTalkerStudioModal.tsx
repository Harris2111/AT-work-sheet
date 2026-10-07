import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  CheckSquare,
  Square,
  Tag,
  Search,
  CheckCircle2,
  Layers,
  Sparkles,
  Ruler,
  Scale,
  Box,
  LayoutGrid,
  FileSpreadsheet,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { AbDesaiATProduct, formatRs } from '../data/luggageCatalog';
import {
  getProductSpecifications,
  getExactSizeClass,
  extractColourName,
  LuggageSizeClass,
  ALL_DISPLAY_SERIES_ORDER,
  getCompleteSeriesLineup,
  CompleteSeriesLineup,
} from '../data/productSpecs';
import { ProductImage } from './ProductImage';

interface ShelfTalkerStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AbDesaiATProduct[];
  initialProductId?: number | null;
  onOpenPriceList?: () => void;
}

export interface SeriesRowOverride {
  sizeLabel?: string;
  shortSize?: string;
  dimensionsCm?: string;
  volumeLitres?: string;
  weightKg?: string;
  priceRs?: number;
  regularPriceRs?: number;
  subPriceBadge?: string;
  promoNote?: string;
}

export interface SeriesCardOverride {
  seriesTitle?: string;
  heroPromoBanner?: string;
  materialAndWheels?: string;
  lockAndColours?: string;
  bottomPromoCallout?: string;
  rows?: Record<number, SeriesRowOverride>;
}

export interface ItemCardOverride {
  shortTitle?: string;
  hookHeadline?: string;
  dimensionsCm?: string;
  volumeLitres?: string;
  weightKg?: string;
  bullet1?: string;
  bullet2?: string;
  priceRs?: number;
  regularPriceRs?: number;
  saveBannerText?: string;
  urgencySubtext?: string;
  companionTitle?: string;
  companionBadge?: string;
  companionPriceNote?: string;
}

function applySeriesOverride(
  seriesName: string,
  base: CompleteSeriesLineup,
  ov?: SeriesCardOverride
): CompleteSeriesLineup & {
  displaySeriesTitle: string;
  materialAndWheelsLine: string;
  lockAndColoursLine: string;
} {
  const defaultMatLine = `${base.material} · ${base.wheels}`;
  const defaultLockLine = `${base.lock} · Colours: ${base.colours.slice(0, 5).join(', ')}`;
  if (!ov) {
    return {
      ...base,
      displaySeriesTitle: `${seriesName.toUpperCase()} SERIES`,
      materialAndWheelsLine: defaultMatLine,
      lockAndColoursLine: defaultLockLine,
    };
  }
  const mergedRows = base.rows.map((r, idx) => {
    const rOv = ov.rows?.[idx];
    if (!rOv) return r;
    return {
      ...r,
      sizeLabel: rOv.sizeLabel !== undefined ? rOv.sizeLabel : r.sizeLabel,
      shortSize: rOv.shortSize !== undefined ? rOv.shortSize : r.shortSize,
      dimensionsCm:
        rOv.dimensionsCm !== undefined ? rOv.dimensionsCm : r.dimensionsCm,
      volumeLitres:
        rOv.volumeLitres !== undefined ? rOv.volumeLitres : r.volumeLitres,
      weightKg: rOv.weightKg !== undefined ? rOv.weightKg : r.weightKg,
      priceRs: rOv.priceRs !== undefined ? rOv.priceRs : r.priceRs,
      regularPriceRs:
        rOv.regularPriceRs !== undefined ? rOv.regularPriceRs : r.regularPriceRs,
      subPriceBadge:
        rOv.subPriceBadge !== undefined ? rOv.subPriceBadge : r.subPriceBadge,
      promoNote: rOv.promoNote !== undefined ? rOv.promoNote : r.promoNote,
    };
  });

  return {
    ...base,
    heroPromoBanner:
      ov.heroPromoBanner !== undefined
        ? ov.heroPromoBanner
        : base.heroPromoBanner,
    bottomPromoCallout:
      ov.bottomPromoCallout !== undefined
        ? ov.bottomPromoCallout
        : base.bottomPromoCallout,
    rows: mergedRows,
    displaySeriesTitle:
      ov.seriesTitle !== undefined
        ? ov.seriesTitle
        : `${seriesName.toUpperCase()} SERIES`,
    materialAndWheelsLine:
      ov.materialAndWheels !== undefined ? ov.materialAndWheels : defaultMatLine,
    lockAndColoursLine:
      ov.lockAndColours !== undefined ? ov.lockAndColours : defaultLockLine,
  };
}

interface CompanionVisual {
  type:
    | 'half-price-cabin'
    | 'bogo-free-unit'
    | 'free-gift'
    | 'combo-pair'
    | 'none';
  companionImage?: string;
  companionTitle?: string;
  companionBadge?: string;
  companionPriceNote?: string;
}

interface RetailCopy {
  shortTitle: string;
  hookHeadline: string;
  bullets: [string, string];
  saveBannerText: string;
  urgencySubtext: string;
}

function getPromoCompanionVisual(
  item: AbDesaiATProduct,
  allProducts: AbDesaiATProduct[]
): CompanionVisual {
  const n = item.name.toLowerCase();

  if (
    item.series === 'Bricklane' &&
    /get 1 cabin worth rs 4500 at half price/i.test(n)
  ) {
    let cabinId = 22450;
    if (n.includes('dark shadow')) cabinId = 47810;
    else if (n.includes('dark forest')) cabinId = 47807;
    else if (n.includes('oxford blue')) cabinId = 41102;

    const cabinProd = allProducts.find((p) => p.id === cabinId);
    return {
      type: 'half-price-cabin',
      companionImage:
        cabinProd?.image ||
        'https://abdesai.mu/wp-content/uploads/2024/11/ATB228-Bricklane-55cm-Black-main.webp',
      companionTitle: 'Bricklane 55cm Cabin',
      companionBadge: '50% OFF CABIN!',
      companionPriceNote: 'PAY ONLY RS 2,250!',
    };
  }

  if (item.series === 'Senna' && /buy one get one free/i.test(n)) {
    return {
      type: 'bogo-free-unit',
      companionImage: item.image,
      companionTitle: item.name.includes('LARGE')
        ? '2nd Senna Large'
        : '2nd Senna Medium',
      companionBadge: '2ND SUITCASE FREE!',
      companionPriceNote: `2 FOR ${formatRs(item.priceRs)}!`,
    };
  }

  if (/free\s+950ml\s+copper\s+bottle/i.test(n)) {
    return {
      type: 'free-gift',
      companionImage: 'https://abdesai.mu/wp-content/uploads/2026/09/Dv30.webp',
      companionTitle: '950ml Copper Bottle',
      companionBadge: 'FREE GIFT (RS 1,395)!',
      companionPriceNote: 'INCLUDED 100% FREE!',
    };
  }

  if (/free\s+rico.*rice\s+cooker/i.test(n)) {
    return {
      type: 'free-gift',
      companionImage:
        'https://abdesai.mu/wp-content/uploads/2026/09/RC2607-4.jpg',
      companionTitle: 'RICO Travel Rice Cooker',
      companionBadge: 'FREE GIFT (RS 1,390)!',
      companionPriceNote: 'INCLUDED 100% FREE!',
    };
  }

  if (item.series === 'Skytrac' && /get the second one .* at half price/i.test(n)) {
    const secondImg =
      item.gallery && item.gallery.length > 1 ? item.gallery[1] : item.image;
    return {
      type: 'half-price-cabin',
      companionImage: secondImg,
      companionTitle: '2nd Skytrac (Any Colour)',
      companionBadge: '2ND AT 50% OFF!',
      companionPriceNote: `2 FOR ${formatRs(item.priceRs)}!`,
    };
  }

  if (item.series === 'Dash Pop' && /cabin\s*\+\s*medium/i.test(n)) {
    const secondImg =
      item.gallery && item.gallery.length > 1 ? item.gallery[1] : item.image;
    return {
      type: 'combo-pair',
      companionImage: secondImg,
      companionTitle: 'Cabin + Medium Pair',
      companionBadge: '2-PC COMBO!',
      companionPriceNote: `BOTH: ${formatRs(item.priceRs)}`,
    };
  }

  return { type: 'none' };
}

function buildHighImpactRetailCopy(
  item: AbDesaiATProduct,
  allProducts: AbDesaiATProduct[]
): RetailCopy {
  const n = item.name;
  const specs = getProductSpecifications(item, allProducts);
  const colour = extractColourName(item);
  const savings =
    item.regularPriceRs && item.regularPriceRs > item.priceRs
      ? item.regularPriceRs - item.priceRs
      : 0;

  const shortTitle = n
    .replace(/^AMERICAN TOURISTER\s+/i, '')
    .replace(/\s*\(\s*Get 1 Cabin[\s\S]*$/i, '')
    .replace(/\s*with Free 950Ml[\s\S]*$/i, '')
    .replace(/\s*\+\s*Free RICO[\s\S]*$/i, '')
    .replace(
      /\s*As Per Colour Available[\s\S]*$/i,
      /buy one get one free/i.test(n) ? ' (2-Unit BOGO Pack)' : ''
    )
    .replace(/\s*offer\s*,\s*Buy one[\s\S]*$/i, ' (2-Unit Promo Pack)')
    .replace(/\s*\(\s*Price of one unit[\s\S]*$/i, '')
    .replace(/\s*HZ9[\s\S]*$/i, '')
    .replace(/\s*FL8[\s\S]*$/i, '')
    .replace(/\s*T16[\s\S]*$/i, '')
    .replace(/\s*HD1[\s\S]*$/i, '')
    .replace(/\s*AY1[\s\S]*$/i, '')
    .replace(/\s*–\s*Mate[\s\S]*$/i, '')
    .trim();

  if (item.series === 'Bricklane' && /half price/i.test(n)) {
    const is80 = n.includes('80cm');
    return {
      shortTitle,
      hookHeadline: `${specs.sizeHeaderBadge} · 50% OFF 55CM CABIN!`,
      bullets: [
        `Buy this ${is80 ? '80cm Large (Rs 8,000)' : '69cm Medium (Rs 7,500)'} & claim a 55cm Cabin for ONLY Rs 2,250!`,
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText: `ADD 55CM CABIN FOR ONLY RS 2,250!`,
      urgencySubtext: `BOTH SUITCASES FOR ONLY ${formatRs(item.priceRs + 2250)} · SAVE RS 2,250 ON CABIN!`,
    };
  }

  if (item.series === 'Senna' && /buy one get one free/i.test(n)) {
    const isLarge = /large/i.test(n);
    return {
      shortTitle: `Senna ${isLarge ? 'Large 79cm' : 'Medium 69cm'} — 2 Suitcases Pack`,
      hookHeadline: 'BUY 1 GET 1 COMPLETELY FREE — 2 FOR 1!',
      bullets: [
        `Take HOME 2 ${isLarge ? 'Large' : 'Medium'} Suitcases for the price of 1 (${formatRs(item.priceRs)})!`,
        `Mix & Match any colour in store · ${specs.wheels} · 3-Yr Global Warranty`,
      ],
      saveBannerText: `YOU SAVE ${formatRs(item.priceRs)} (2ND UNIT FREE!)`,
      urgencySubtext: `ONLY ${formatRs(item.priceRs / 2)} PER SUITCASE WHEN YOU BUY THE PAIR!`,
    };
  }

  if (item.series === 'Skytrac' && /half price/i.test(n)) {
    return {
      shortTitle,
      hookHeadline: `${specs.sizeHeaderBadge} · 2ND AT 50% OFF!`,
      bullets: [
        `Buy 1 Skytrac & grab your 2nd same-size Skytrac (any colour) at HALF PRICE!`,
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText: `INSTANT SAVINGS: ${formatRs(savings)} ON THE PAIR!`,
      urgencySubtext: `TOTAL FOR BOTH SUITCASES: ${formatRs(item.priceRs)} · MIX ANY COLOUR!`,
    };
  }

  if (/free\s+950ml\s+copper\s+bottle/i.test(n)) {
    return {
      shortTitle,
      hookHeadline: `${specs.sizeHeaderBadge} · SAVE RS 2,495 + FREE GIFT!`,
      bullets: [
        `Includes FREE DrCopper 950ml Pure Copper Bottle (Worth Rs 1,395)!`,
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText: `TOTAL VALUE SAVED: RS 3,890!`,
      urgencySubtext: `RS 2,495 OFF + FREE RS 1,395 COPPER BOTTLE WHILE STOCKS LAST!`,
    };
  }

  if (/free\s+rico.*rice\s+cooker/i.test(n)) {
    return {
      shortTitle,
      hookHeadline: `${specs.sizeHeaderBadge} · FREE RICE COOKER (RS 1,390)!`,
      bullets: [
        `Take home a FREE RICO RC2607 Travel Rice Cooker (Worth Rs 1,390)!`,
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText: `FREE RS 1,390 TRAVEL RICE COOKER!`,
      urgencySubtext: `COMPLIMENTARY RICO TRAVEL RICE COOKER WITH EVERY PURCHASE!`,
    };
  }

  if (/baseus\s+powerbank/i.test(`${n} ${item.specsText || ''} ${item.promoBadge || ''}`)) {
    return {
      shortTitle,
      hookHeadline: `${specs.sizeHeaderBadge} · FREE POWERBANK (RS 1,290)!`,
      bullets: [
        `Includes FREE Baseus Powerbank (Worth Rs 1,290) as listed on abdesai.mu!`,
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText: `FREE RS 1,290 BASEUS POWERBANK!`,
      urgencySubtext: `ULTRA-LIGHT 2.8KG XL + FREE BASEUS POWERBANK WHILE STOCKS LAST!`,
    };
  }

  if (item.series === 'Jamaica' && /medium\s*3\s*pcs|3\s*medium/i.test(n)) {
    return {
      shortTitle: 'Jamaica Set of 3 Medium (3 × 69cm)',
      hookHeadline: 'SET OF 3 MEDIUM SUITCASES — ONLY RS 11,990!',
      bullets: [
        'Get 3 × Medium 69cm Expandable Suitcases (78/85L Each = 255L Total)!',
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText: 'YOU SAVE RS 5,980 ON 3 MEDIUMS!',
      urgencySubtext: 'ALL 3 MEDIUM SUITCASES FOR RS 11,990 (WAS RS 17,970 · ONLY RS 3,997 EACH)!',
    };
  }

  if (item.series === 'Jamaica' && /cabin\s*\+\s*large/i.test(n)) {
    return {
      shortTitle,
      hookHeadline: 'UNBEATABLE CABIN + X-LARGE COMBO DEAL!',
      bullets: [
        `Get BOTH Cabin 57cm (Rs 4,800) + X-Large 80cm (Rs 7,500) Together!`,
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText: `YOU SAVE RS 3,300 INSTANTLY!`,
      urgencySubtext: `BOTH SUITCASES FOR ONLY RS 9,000 (WAS RS 12,300)!`,
    };
  }

  if (item.series === 'Skylette' && /set/i.test(n)) {
    return {
      shortTitle,
      hookHeadline: 'MEGA FLASH SALE — SAVE RS 9,490 ON 3 PCS!',
      bullets: [
        `Complete 3-Piece Set: Cabin (50cm) + Medium (68cm) + X-Large (81cm)!`,
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText: `YOU SAVE RS 9,490 TODAY!`,
      urgencySubtext: `ALL 3 SUITCASES FOR ONLY RS 16,990 — ONLY RS 5,663 PER BAG!`,
    };
  }

  if (/set\s*of\s*3|set3/i.test(n)) {
    return {
      shortTitle,
      hookHeadline:
        savings > 0
          ? `3-PC SET (${specs.dimensionsCm.replace(' (3 Sizes)', '')}) — SAVE ${formatRs(savings)}!`
          : `COMPLETE 3-PC SET · ${specs.sizeHeaderBadge}!`,
      bullets: [
        `Includes All 3 Sizes (${specs.dimensionsCm}) · Total Volume ${specs.volumeLitres}`,
        `${specs.material} · ${specs.wheels} · ${specs.lock}`,
      ],
      saveBannerText:
        savings > 0
          ? `YOU SAVE ${formatRs(savings)} INSTANTLY!`
          : `ALL 3 SIZES FOR ${formatRs(item.priceRs)}!`,
      urgencySubtext: `ONLY ${formatRs(Math.round(item.priceRs / 3))} PER SUITCASE IN THIS 3-PC BUNDLE!`,
    };
  }

  const coloursNote =
    specs.availableColours.length > 1
      ? `Colours: ${specs.availableColours.slice(0, 4).join(', ')}`
      : `Colour: ${colour}`;

  return {
    shortTitle,
    hookHeadline:
      savings > 0
        ? `${specs.sizeHeaderBadge} — SAVE ${formatRs(savings)} NOW!`
        : `${item.series.toUpperCase()} ${specs.sizeHeaderBadge} · OFFICIAL SPEC!`,
    bullets: [
      `${specs.material} · ${specs.wheels}`,
      `${specs.lock} · ${coloursNote}`,
    ],
    saveBannerText:
      savings > 0
        ? `YOU SAVE ${formatRs(savings)} TODAY!`
        : `${specs.sizeClass.toUpperCase()}: ${specs.dimensionsCm} · ${specs.volumeLitres} · ${specs.weightKg}`,
    urgencySubtext:
      item.priceRs > 0
        ? `3-YEAR GLOBAL WARRANTY · FREE DELIVERY IN MAURITIUS (> RS 3,000)`
        : `OFFICIAL AMERICAN TOURISTER SPECIFICATION CARD · A.B. DESAI`,
  };
}

const DEFAULT_FOUR_SERIES_NAMES = [
  'Bricklane',
  'Skytrac',
  'Jamaica',
  'Dashway',
];

const DEFAULT_BRICKLANE_SERIES_IDS = [
  22450,
  22451,
  22452,
  41100,
];

const DEFAULT_FOUR_PROMO_A6_IDS = [
  56981,
  56513,
  47808,
  55861,
];

const CORE_16_PROMO_IDS = [
  56981,
  56513,
  47808,
  55861,
  55867,
  50396,
  52138,
  56583,
  56584,
  56582,
  41100,
  41101,
  55872,
  47874,
  47851,
  41271,
];

function loadProxiedImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src.startsWith('https://abdesai.mu/')
      ? `/api/proxy-image?url=${encodeURIComponent(src)}`
      : src;
  });
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  padding = 12
) {
  const availW = boxW - padding * 2;
  const availH = boxH - padding * 2;
  const scale = Math.min(availW / img.width, availH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = boxY + (boxH - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

// Automatically shrinks font size if a string exceeds maxWidth so big bold fonts never clip or overflow
function fillFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  weight: string | number,
  initialPx: number,
  minPx: number,
  fontFamily = '"Plus Jakarta Sans", sans-serif'
) {
  let px = initialPx;
  while (px >= minPx) {
    ctx.font = `${weight} ${Math.round(px)}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  ctx.fillText(text, x, y);
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = (text || '').split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

const qrDataUrlCache = new Map<string, string>();

async function getQrDataUrl(targetUrl: string): Promise<string> {
  const cached = qrDataUrlCache.get(targetUrl);
  if (cached) return cached;
  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#0F2942',
        light: '#FFFFFF',
      },
    });
    qrDataUrlCache.set(targetUrl, dataUrl);
    return dataUrl;
  } catch {
    return '';
  }
}

async function loadQrImage(targetUrl: string): Promise<HTMLImageElement | null> {
  const dataUrl = await getQrDataUrl(targetUrl);
  if (!dataUrl) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

const TalkerQrCodeBox: React.FC<{ url: string; isFullA4: boolean }> = ({
  url,
  isFullA4,
}) => {
  const [dataUrl, setDataUrl] = useState<string>(
    () => qrDataUrlCache.get(url) || ''
  );

  useEffect(() => {
    let active = true;
    getQrDataUrl(url).then((res) => {
      if (active && res) setDataUrl(res);
    });
    return () => {
      active = false;
    };
  }, [url]);

  if (!dataUrl) return null;

  return (
    <div
      className={`bg-white rounded flex items-center gap-1 shrink-0 border border-[#FFD166] ${
        isFullA4 ? 'p-1 pr-2' : 'p-0.5 pr-1'
      }`}
      title={`Scan QR to view & order on abdesai.mu (${url})`}
    >
      <img
        src={dataUrl}
        alt="Scan QR to Order"
        className={`object-contain ${
          isFullA4 ? 'w-11 h-11' : 'w-6 h-6'
        }`}
      />
      <div className="text-left leading-none">
        <div
          className={`font-black text-[#0F2942] uppercase ${
            isFullA4 ? 'text-[10px]' : 'text-[6.5px]'
          }`}
        >
          SCAN QR
        </div>
        <div
          className={`font-extrabold text-[#B81D24] uppercase ${
            isFullA4 ? 'text-[9px] mt-0.5' : 'text-[6px]'
          }`}
        >
          TO ORDER
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CANVAS RENDERER 1: ALL-IN-ONE SERIES LINEUP CARD (Zero Blank Space & Oversized Bold Fonts!)
// ============================================================================
async function renderSeriesAllInOneCardToRegion(
  ctx: CanvasRenderingContext2D,
  seriesName: string,
  allProducts: AbDesaiATProduct[],
  x: number,
  y: number,
  w: number,
  h: number,
  seriesOverride?: SeriesCardOverride
) {
  const s = w / 1240; // 1240 x 1754 base coordinate space
  const baseLineup = getCompleteSeriesLineup(seriesName, allProducts);
  const lineup = applySeriesOverride(seriesName, baseLineup, seriesOverride);

  ctx.save();
  ctx.translate(x, y);

  // Outer card background & bold border
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = Math.max(4, 10 * s);
  ctx.strokeRect(5 * s, 5 * s, w - 10 * s, h - 10 * s);

  // 1. Top Navy Brand Header (Bigger Font!)
  const headerH = 112 * s;
  ctx.fillStyle = '#0F2942';
  ctx.fillRect(10 * s, 10 * s, w - 20 * s, headerH);

  ctx.fillStyle = '#FFFFFF';
  fillFittedText(
    ctx,
    lineup.displaySeriesTitle,
    32 * s,
    60 * s,
    720 * s,
    900,
    52 * s,
    34 * s
  );

  ctx.fillStyle = '#FFD166';
  ctx.font = `900 ${Math.round(27 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('ALL SIZES, SPECS & PRICES AT A GLANCE', 32 * s, 102 * s);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${Math.round(28 * s)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.fillText('AMERICAN TOURISTER', w - 32 * s, 54 * s);
  ctx.fillStyle = '#D4B886';
  ctx.font = `800 ${Math.round(25 * s)}px "JetBrains Mono", monospace`;
  ctx.fillText('A.B. DESAI MAURITIUS', w - 32 * s, 96 * s);
  ctx.textAlign = 'left';

  // 2. Giant Eye-Catching Red Clickbait / Series Promo Strip
  const promoY = 10 * s + headerH;
  const promoH = 92 * s;
  ctx.fillStyle = '#B81D24';
  ctx.fillRect(10 * s, promoY, w - 20 * s, promoH);

  ctx.fillStyle = '#FFD166';
  ctx.textAlign = 'center';
  fillFittedText(
    ctx,
    lineup.heroPromoBanner,
    w / 2,
    promoY + 62 * s,
    w - 60 * s,
    900,
    42 * s,
    26 * s
  );
  ctx.textAlign = 'left';

  // 3. Visual Lineup Photo Strip (Kept exactly as requested!)
  const imgBoxY = promoY + promoH + 10 * s;
  const imgBoxH = 365 * s;
  const imgBoxX = 20 * s;
  const imgBoxW = w - 40 * s;

  ctx.fillStyle = '#F9F9F8';
  ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = Math.max(2, 4 * s);
  ctx.strokeRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);

  const displayRows = lineup.rows.slice(0, 4);
  const colCount = Math.max(1, displayRows.length);
  const slotW = (imgBoxW - 20 * s) / colCount;

  for (let i = 0; i < displayRows.length; i++) {
    const r = displayRows[i];
    const sx = imgBoxX + 10 * s + i * slotW;
    const sy = imgBoxY + 8 * s;
    const sw = slotW - 8 * s;
    const sh = imgBoxH - 16 * s;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#C9C6BC';
    ctx.lineWidth = Math.max(1.5, 2.5 * s);
    ctx.strokeRect(sx, sy, sw, sh);

    // Top size badge inside photo card (Bigger font!)
    ctx.fillStyle = '#0F2942';
    ctx.fillRect(sx, sy, sw, 48 * s);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    fillFittedText(
      ctx,
      r.shortSize.toUpperCase(),
      sx + sw / 2,
      sy + 34 * s,
      sw - 12 * s,
      900,
      27 * s,
      18 * s
    );

    const img = await loadProxiedImage(r.image);
    if (img) {
      drawContainedImage(
        ctx,
        img,
        sx + 6 * s,
        sy + 50 * s,
        sw - 12 * s,
        sh - 110 * s,
        4 * s
      );
    }

    // Bottom price bar inside photo card (Bigger font!)
    ctx.fillStyle = '#FFFDF7';
    ctx.fillRect(sx + 2 * s, sy + sh - 56 * s, sw - 4 * s, 54 * s);
    ctx.fillStyle = '#B81D24';
    fillFittedText(
      ctx,
      formatRs(r.priceRs),
      sx + sw / 2,
      sy + sh - 16 * s,
      sw - 10 * s,
      900,
      36 * s,
      22 * s,
      '"JetBrains Mono", monospace'
    );
    ctx.textAlign = 'left';
  }

  // 4. FULL-HEIGHT STACKED AT-A-GLANCE SIZE & PRICE ROWS (Fills all middle space with HUGE readable text!)
  const tableY = imgBoxY + imgBoxH + 10 * s;
  const tableX = 20 * s;
  const tableW = w - 40 * s;
  const tableHeaderH = 56 * s;

  ctx.fillStyle = '#0F2942';
  ctx.fillRect(tableX, tableY, tableW, tableHeaderH);

  ctx.fillStyle = '#FFD166';
  ctx.font = `900 ${Math.round(25 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(
    'SIZE & TECHNICAL SPECIFICATIONS (CM · LITRES · KG)',
    tableX + 22 * s,
    tableY + 38 * s
  );
  ctx.textAlign = 'right';
  ctx.fillText('SHOWROOM PRICE', tableX + tableW - 22 * s, tableY + 38 * s);
  ctx.textAlign = 'left';

  const footerH = 112 * s;
  const bottomBoxH = 228 * s;
  const availTableBodyH =
    h - footerH - bottomBoxH - (tableY + tableHeaderH) - 28 * s;
  const rowCount = Math.max(1, displayRows.length);
  const rowH = availTableBodyH / rowCount;

  displayRows.forEach((r, idx) => {
    const ry = tableY + tableHeaderH + idx * rowH;
    ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F4F1EA';
    ctx.fillRect(tableX, ry, tableW, rowH);
    ctx.strokeStyle = '#141413';
    ctx.lineWidth = Math.max(2, 3.5 * s);
    ctx.strokeRect(tableX, ry, tableW, rowH);

    const leftMaxW = tableW - 395 * s;
    const cleanDim = r.dimensionsCm
      .replace(' (Exp)', '')
      .replace(' (3 Sizes)', '');
    const cleanVol = r.volumeLitres
      .replace(' (Exp)', '')
      .replace(' Total', '');
    const cleanWt = r.weightKg.replace(' (Ultra-Light)', '');

    if (r.promoNote) {
      // 3-Tier Stacked Left Side: Giant Size Name + Huge Specs Pill + Bold Red Promo Tag
      ctx.fillStyle = '#0F2942';
      fillFittedText(
        ctx,
        r.sizeLabel,
        tableX + 22 * s,
        ry + rowH * 0.33,
        leftMaxW,
        900,
        46 * s,
        28 * s
      );

      ctx.fillStyle = '#141413';
      fillFittedText(
        ctx,
        `${cleanDim}   ·   ${cleanVol}   ·   ${cleanWt}`,
        tableX + 22 * s,
        ry + rowH * 0.65,
        leftMaxW,
        800,
        32 * s,
        20 * s,
        '"JetBrains Mono", monospace'
      );

      // Red Promo Pill Badge
      ctx.fillStyle = '#B81D24';
      fillFittedText(
        ctx,
        `★ ${r.promoNote.toUpperCase()}`,
        tableX + 22 * s,
        ry + rowH * 0.91,
        leftMaxW,
        900,
        29 * s,
        18 * s
      );
    } else {
      // 2-Tier Stacked Left Side: Giant Size Name + Huge Specs Line
      ctx.fillStyle = '#0F2942';
      fillFittedText(
        ctx,
        r.sizeLabel,
        tableX + 22 * s,
        ry + rowH * 0.44,
        leftMaxW,
        900,
        50 * s,
        30 * s
      );

      ctx.fillStyle = '#141413';
      fillFittedText(
        ctx,
        `${cleanDim}   ·   ${cleanVol}   ·   ${cleanWt}`,
        tableX + 22 * s,
        ry + rowH * 0.82,
        leftMaxW,
        800,
        34 * s,
        20 * s,
        '"JetBrains Mono", monospace'
      );
    }

    // Right Side: MASSIVE PRICE CALLOUT (Readable from across the store!)
    const hasSubLine = Boolean(
      (r.regularPriceRs && r.regularPriceRs > r.priceRs) || r.subPriceBadge
    );
    ctx.textAlign = 'right';
    ctx.fillStyle = '#B81D24';
    fillFittedText(
      ctx,
      formatRs(r.priceRs),
      tableX + tableW - 22 * s,
      hasSubLine ? ry + rowH * 0.54 : ry + rowH * 0.66,
      365 * s,
      900,
      68 * s,
      42 * s,
      '"JetBrains Mono", monospace'
    );

    if (r.regularPriceRs && r.regularPriceRs > r.priceRs) {
      const wasStr = `Was ${formatRs(r.regularPriceRs)}`;
      ctx.fillStyle = '#65645E';
      ctx.font = `800 ${Math.round(29 * s)}px "JetBrains Mono", monospace`;
      const wasY = ry + rowH * 0.87;
      ctx.fillText(wasStr, tableX + tableW - 22 * s, wasY);
      const wasW = ctx.measureText(wasStr).width;
      ctx.strokeStyle = '#B81D24';
      ctx.lineWidth = Math.max(2.5, 4 * s);
      ctx.beginPath();
      ctx.moveTo(tableX + tableW - 22 * s - wasW, wasY - 10 * s);
      ctx.lineTo(tableX + tableW - 22 * s, wasY - 10 * s);
      ctx.stroke();
    } else if (r.subPriceBadge) {
      ctx.fillStyle = '#0F2942';
      fillFittedText(
        ctx,
        r.subPriceBadge.toUpperCase(),
        tableX + tableW - 22 * s,
        ry + rowH * 0.88,
        365 * s,
        900,
        27 * s,
        18 * s,
        '"JetBrains Mono", monospace'
      );
    }
    ctx.textAlign = 'left';
  });

  // 5. Series Construction & Colours Highlight Box + Giant Callout Bar (Bigger text!)
  const bottomBoxY = tableY + tableHeaderH + availTableBodyH + 10 * s;

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(20 * s, bottomBoxY, w - 40 * s, bottomBoxH);
  ctx.strokeStyle = '#0F2942';
  ctx.lineWidth = Math.max(2.5, 5 * s);
  ctx.strokeRect(20 * s, bottomBoxY, w - 40 * s, bottomBoxH);

  ctx.fillStyle = '#141413';
  fillFittedText(
    ctx,
    `✓ ${lineup.materialAndWheelsLine}`,
    40 * s,
    bottomBoxY + 46 * s,
    w - 80 * s,
    800,
    31 * s,
    21 * s
  );

  ctx.fillStyle = '#0F2942';
  fillFittedText(
    ctx,
    `✓ ${lineup.lockAndColoursLine}`,
    40 * s,
    bottomBoxY + 90 * s,
    w - 80 * s,
    800,
    30 * s,
    20 * s
  );

  // Giant Red Promo / Value Callout Bar inside bottom box
  const callBarX = 34 * s;
  const callBarY = bottomBoxY + 112 * s;
  const callBarW = w - 68 * s;
  const callBarH = bottomBoxH - 126 * s;

  ctx.fillStyle = '#B81D24';
  ctx.beginPath();
  ctx.roundRect(callBarX, callBarY, callBarW, callBarH, 12 * s);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  fillFittedText(
    ctx,
    lineup.bottomPromoCallout,
    w / 2,
    callBarY + callBarH / 2 + 13 * s,
    callBarW - 28 * s,
    900,
    37 * s,
    23 * s
  );
  ctx.textAlign = 'left';

  // 6. Bottom Showroom & Contact Strip + Scannable QR Code!
  const footerY = h - footerH - 8 * s;
  ctx.fillStyle = '#141413';
  ctx.fillRect(10 * s, footerY, w - 20 * s, footerH);

  const repProd = allProducts.find((p) => p.series === seriesName && p.permalink);
  const seriesQrUrl =
    repProd?.permalink ||
    `https://abdesai.mu/product-tag/american-tourister/?s=${encodeURIComponent(
      seriesName
    )}`;
  const qrImg = await loadQrImage(seriesQrUrl);
  const qrBoxW = qrImg ? 205 * s : 0;

  if (qrImg) {
    const qx = w - 18 * s - qrBoxW;
    const qy = footerY + 10 * s;
    const qh = footerH - 20 * s;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qx, qy, qrBoxW, qh, 8 * s);
    ctx.fill();

    ctx.drawImage(qrImg, qx + 6 * s, qy + 4 * s, qh - 8 * s, qh - 8 * s);

    ctx.fillStyle = '#0F2942';
    ctx.textAlign = 'left';
    ctx.font = `900 ${Math.round(21 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('SCAN QR', qx + qh + 2 * s, qy + 38 * s);
    ctx.fillStyle = '#B81D24';
    ctx.font = `900 ${Math.round(19 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('TO ORDER', qx + qh + 2 * s, qy + 68 * s);
  }

  const textAvailW = w - 40 * s - qrBoxW;
  const textCenterX = 20 * s + textAvailW / 2;

  ctx.fillStyle = '#FFD166';
  ctx.textAlign = 'center';
  fillFittedText(
    ctx,
    'PORT-LOUIS · TRIBECA · TRIANON · BAGATELLE · CASCAVELLE · ROSE-BELLE',
    textCenterX,
    footerY + 46 * s,
    textAvailW - 16 * s,
    900,
    25 * s,
    16 * s
  );

  ctx.fillStyle = '#FFFFFF';
  fillFittedText(
    ctx,
    '3-YR GLOBAL WARRANTY · abdesai.mu · WhatsApp: +230 5498 8887',
    textCenterX,
    footerY + 88 * s,
    textAvailW - 16 * s,
    800,
    25 * s,
    16 * s,
    '"JetBrains Mono", monospace'
  );
  ctx.textAlign = 'left';

  ctx.restore();
}

// ============================================================================
// CANVAS RENDERER 2: INDIVIDUAL ITEM / PROMO VERTICAL CARD (Maximised Text & Zero Blank Space!)
// ============================================================================
async function renderVerticalShelfTalkerToRegion(
  ctx: CanvasRenderingContext2D,
  rawItem: AbDesaiATProduct,
  allProducts: AbDesaiATProduct[],
  x: number,
  y: number,
  w: number,
  h: number,
  itemOverride?: ItemCardOverride
) {
  const s = w / 1240;
  const item: AbDesaiATProduct = {
    ...rawItem,
    priceRs:
      itemOverride?.priceRs !== undefined
        ? itemOverride.priceRs
        : rawItem.priceRs,
    regularPriceRs:
      itemOverride?.regularPriceRs !== undefined
        ? itemOverride.regularPriceRs
        : rawItem.regularPriceRs,
  };
  const baseCompanion = getPromoCompanionVisual(item, allProducts);
  const companion: CompanionVisual = {
    ...baseCompanion,
    companionTitle:
      itemOverride?.companionTitle !== undefined
        ? itemOverride.companionTitle
        : baseCompanion.companionTitle,
    companionBadge:
      itemOverride?.companionBadge !== undefined
        ? itemOverride.companionBadge
        : baseCompanion.companionBadge,
    companionPriceNote:
      itemOverride?.companionPriceNote !== undefined
        ? itemOverride.companionPriceNote
        : baseCompanion.companionPriceNote,
  };
  const baseCopy = buildHighImpactRetailCopy(item, allProducts);
  const copy: RetailCopy = {
    shortTitle:
      itemOverride?.shortTitle !== undefined
        ? itemOverride.shortTitle
        : baseCopy.shortTitle,
    hookHeadline:
      itemOverride?.hookHeadline !== undefined
        ? itemOverride.hookHeadline
        : baseCopy.hookHeadline,
    bullets: [
      itemOverride?.bullet1 !== undefined
        ? itemOverride.bullet1
        : baseCopy.bullets[0],
      itemOverride?.bullet2 !== undefined
        ? itemOverride.bullet2
        : baseCopy.bullets[1],
    ],
    saveBannerText:
      itemOverride?.saveBannerText !== undefined
        ? itemOverride.saveBannerText
        : baseCopy.saveBannerText,
    urgencySubtext:
      itemOverride?.urgencySubtext !== undefined
        ? itemOverride.urgencySubtext
        : baseCopy.urgencySubtext,
  };
  const baseSpecs = getProductSpecifications(item, allProducts);
  const specs = {
    ...baseSpecs,
    dimensionsCm:
      itemOverride?.dimensionsCm !== undefined
        ? itemOverride.dimensionsCm
        : baseSpecs.dimensionsCm,
    volumeLitres:
      itemOverride?.volumeLitres !== undefined
        ? itemOverride.volumeLitres
        : baseSpecs.volumeLitres,
    weightKg:
      itemOverride?.weightKg !== undefined
        ? itemOverride.weightKg
        : baseSpecs.weightKg,
  };

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = Math.max(4, 10 * s);
  ctx.strokeRect(5 * s, 5 * s, w - 10 * s, h - 10 * s);

  // 1. Top Navy Brand Header (Bigger Font!)
  const headerH = 108 * s;
  ctx.fillStyle = '#0F2942';
  ctx.fillRect(10 * s, 10 * s, w - 20 * s, headerH);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${Math.round(38 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('AMERICAN TOURISTER', 32 * s, 54 * s);

  ctx.fillStyle = '#FFD166';
  ctx.font = `800 ${Math.round(27 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(
    `${item.series.toUpperCase()} SERIES · ${specs.sizeClass.toUpperCase()}`,
    32 * s,
    96 * s
  );

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${Math.round(27 * s)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.fillText('A.B. DESAI MAURITIUS', w - 32 * s, 58 * s);
  ctx.textAlign = 'left';

  // 2. Giant Red Clickbait Headline Strip
  const promoY = 10 * s + headerH;
  const promoH = 92 * s;
  ctx.fillStyle = '#B81D24';
  ctx.fillRect(10 * s, promoY, w - 20 * s, promoH);

  ctx.fillStyle = '#FFD166';
  ctx.textAlign = 'center';
  fillFittedText(
    ctx,
    copy.hookHeadline,
    w / 2,
    promoY + 62 * s,
    w - 50 * s,
    900,
    42 * s,
    26 * s
  );
  ctx.textAlign = 'left';

  // 3. Image Box (Kept intact!)
  const imgBoxY = promoY + promoH + 10 * s;
  const imgBoxH = 475 * s;
  const imgBoxX = 24 * s;
  const imgBoxW = w - 48 * s;

  ctx.fillStyle = '#F9F9F8';
  ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = Math.max(2, 3.5 * s);
  ctx.strokeRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);

  const mainImg = await loadProxiedImage(item.image);

  if (companion.type !== 'none' && companion.companionImage) {
    const compImg = await loadProxiedImage(companion.companionImage);

    const leftX = imgBoxX + 14 * s;
    const leftY = imgBoxY + 12 * s;
    const cardW = (imgBoxW - 92 * s) / 2;
    const cardH = imgBoxH - 24 * s;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(leftX, leftY, cardW, cardH);
    ctx.strokeStyle = '#C9C6BC';
    ctx.strokeRect(leftX, leftY, cardW, cardH);

    if (mainImg) {
      drawContainedImage(
        ctx,
        mainImg,
        leftX,
        leftY + 8 * s,
        cardW,
        cardH - 115 * s,
        10 * s
      );
    }

    ctx.fillStyle = '#141413';
    ctx.font = `800 ${Math.round(27 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(
      `${item.series} ${specs.sizeClass}`,
      leftX + cardW / 2,
      leftY + cardH - 64 * s
    );
    ctx.fillStyle = '#0F2942';
    ctx.font = `900 ${Math.round(36 * s)}px "JetBrains Mono", monospace`;
    ctx.fillText(
      item.priceRs > 0 ? formatRs(item.priceRs) : 'Official Spec',
      leftX + cardW / 2,
      leftY + cardH - 18 * s
    );

    const centerX = imgBoxX + imgBoxW / 2;
    const centerY = imgBoxY + imgBoxH / 2;
    ctx.fillStyle = '#B81D24';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${Math.round(42 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('+', centerX, centerY + 14 * s);

    const rightX = leftX + cardW + 64 * s;
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(rightX, leftY, cardW, cardH);
    ctx.strokeStyle = '#B81D24';
    ctx.lineWidth = Math.max(3, 5 * s);
    ctx.strokeRect(rightX, leftY, cardW, cardH);

    ctx.fillStyle = '#B81D24';
    ctx.fillRect(rightX, leftY, cardW, 56 * s);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${Math.round(28 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(
      companion.companionBadge || '50% OFF!',
      rightX + cardW / 2,
      leftY + 39 * s
    );

    if (compImg) {
      drawContainedImage(
        ctx,
        compImg,
        rightX,
        leftY + 60 * s,
        cardW,
        cardH - 172 * s,
        10 * s
      );
    }

    ctx.fillStyle = '#141413';
    ctx.font = `800 ${Math.round(26 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(
      companion.companionTitle || '',
      rightX + cardW / 2,
      leftY + cardH - 64 * s
    );
    ctx.fillStyle = '#B81D24';
    ctx.font = `900 ${Math.round(30 * s)}px "JetBrains Mono", monospace`;
    ctx.fillText(
      companion.companionPriceNote || '',
      rightX + cardW / 2,
      leftY + cardH - 18 * s
    );
    ctx.textAlign = 'left';
  } else if (mainImg) {
    drawContainedImage(
      ctx,
      mainImg,
      imgBoxX + 20 * s,
      imgBoxY + 10 * s,
      imgBoxW - 40 * s,
      imgBoxH - 20 * s,
      10 * s
    );
  }

  // 4. OVERSIZED 3-COLUMN TECHNICAL SPECIFICATION BAR (SIZE | VOLUME | WEIGHT)
  const specBoxY = imgBoxY + imgBoxH + 10 * s;
  const specBoxH = 185 * s;
  const specBoxX = 24 * s;
  const specBoxW = w - 48 * s;

  ctx.fillStyle = '#0F2942';
  ctx.fillRect(specBoxX, specBoxY, specBoxW, specBoxH);
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = Math.max(2.5, 4 * s);
  ctx.strokeRect(specBoxX, specBoxY, specBoxW, specBoxH);

  const colW = specBoxW / 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = Math.max(2, 3.5 * s);
  ctx.beginPath();
  ctx.moveTo(specBoxX + colW, specBoxY + 14 * s);
  ctx.lineTo(specBoxX + colW, specBoxY + specBoxH - 14 * s);
  ctx.moveTo(specBoxX + colW * 2, specBoxY + 14 * s);
  ctx.lineTo(specBoxX + colW * 2, specBoxY + specBoxH - 14 * s);
  ctx.stroke();

  const specCols = [
    {
      label: 'SIZE (CM)',
      value: specs.dimensionsCm.replace(' (Exp)', ''),
      sub: specs.sizeClass.toUpperCase(),
    },
    {
      label: 'VOLUME (L)',
      value: specs.volumeLitres.replace(' (Exp)', ''),
      sub: 'PACKING CAPACITY',
    },
    {
      label: 'WEIGHT (KG)',
      value: specs.weightKg.replace(' (Ultra-Light)', ''),
      sub: 'LIGHTWEIGHT SHELL',
    },
  ];

  ctx.textAlign = 'center';
  specCols.forEach((col, idx) => {
    const cx = specBoxX + colW * idx + colW / 2;
    ctx.fillStyle = '#D4B886';
    ctx.font = `900 ${Math.round(24 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(col.label, cx, specBoxY + 42 * s);

    ctx.fillStyle = '#FFFFFF';
    fillFittedText(
      ctx,
      col.value,
      cx,
      specBoxY + 112 * s,
      colW - 20 * s,
      900,
      44 * s,
      26 * s,
      '"JetBrains Mono", monospace'
    );

    ctx.fillStyle = '#FFD166';
    ctx.font = `800 ${Math.round(23 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(col.sub, cx, specBoxY + 158 * s);
  });
  ctx.textAlign = 'left';

  // 5. Giant Product Title + Bold High-Visibility Feature Bullets
  let curY = specBoxY + specBoxH + 54 * s;
  ctx.fillStyle = '#0F2942';
  fillFittedText(
    ctx,
    copy.shortTitle,
    28 * s,
    curY,
    w - 56 * s,
    900,
    52 * s,
    32 * s
  );
  curY += 56 * s;

  for (const bullet of copy.bullets) {
    ctx.fillStyle = '#B81D24';
    ctx.font = `900 ${Math.round(36 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('✓', 28 * s, curY);

    ctx.fillStyle = '#141413';
    ctx.font = `800 ${Math.round(33 * s)}px "Plus Jakarta Sans", sans-serif`;
    const bLines = wrapTextLines(ctx, bullet, w - 105 * s, 2);
    for (const bl of bLines) {
      ctx.fillText(bl, 72 * s, curY);
      curY += 42 * s;
    }
    curY += 8 * s;
  }

  // 6. MASSIVE PRICE & "YOU SAVE" CALLOUT BLOCK (Fills lower card completely!)
  const footerH = 112 * s;
  const priceBoxH = 345 * s;
  const priceBoxY = h - footerH - priceBoxH - 14 * s;

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(24 * s, priceBoxY, w - 48 * s, priceBoxH);
  ctx.strokeStyle = '#0F2942';
  ctx.lineWidth = Math.max(3, 6 * s);
  ctx.strokeRect(24 * s, priceBoxY, w - 48 * s, priceBoxH);

  ctx.fillStyle = '#65645E';
  ctx.font = `900 ${Math.round(26 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(
    item.hasPromo
      ? 'SPECIAL IN-STORE PROMO PRICE (INCL. VAT):'
      : 'OFFICIAL SHOWROOM RETAIL PRICE (INCL. VAT):',
    46 * s,
    priceBoxY + 46 * s
  );

  ctx.fillStyle = '#B81D24';
  const mainPriceText =
    item.priceRs > 0 ? formatRs(item.priceRs) : 'See In-Store';
  ctx.font = `900 ${Math.round(104 * s)}px "JetBrains Mono", monospace`;
  ctx.fillText(mainPriceText, 46 * s, priceBoxY + 150 * s);

  if (item.regularPriceRs && item.regularPriceRs > item.priceRs) {
    const mainW = ctx.measureText(mainPriceText).width;
    const oldText = `Was ${formatRs(item.regularPriceRs)}`;
    ctx.fillStyle = '#65645E';
    ctx.font = `800 ${Math.round(46 * s)}px "JetBrains Mono", monospace`;
    const oldX = 46 * s + mainW + 28 * s;
    const oldY = priceBoxY + 138 * s;
    ctx.fillText(oldText, oldX, oldY);
    const oldW = ctx.measureText(oldText).width;
    ctx.strokeStyle = '#B81D24';
    ctx.lineWidth = Math.max(3.5, 6 * s);
    ctx.beginPath();
    ctx.moveTo(oldX, oldY - 15 * s);
    ctx.lineTo(oldX + oldW, oldY - 15 * s);
    ctx.stroke();
  }

  const saveBarX = 42 * s;
  const saveBarY = priceBoxY + 175 * s;
  const saveBarW = w - 84 * s;
  const saveBarH = 104 * s;

  ctx.fillStyle = item.hasPromo ? '#B81D24' : '#0F2942';
  ctx.beginPath();
  ctx.roundRect(saveBarX, saveBarY, saveBarW, saveBarH, 12 * s);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  fillFittedText(
    ctx,
    copy.saveBannerText,
    w / 2,
    saveBarY + 68 * s,
    saveBarW - 30 * s,
    900,
    44 * s,
    26 * s
  );

  ctx.fillStyle = '#141413';
  fillFittedText(
    ctx,
    copy.urgencySubtext,
    w / 2,
    priceBoxY + 320 * s,
    w - 80 * s,
    900,
    27 * s,
    19 * s
  );
  ctx.textAlign = 'left';

  // 7. Bottom Showroom Strip + Scannable QR Code!
  const footerY = h - footerH - 8 * s;
  ctx.fillStyle = '#141413';
  ctx.fillRect(10 * s, footerY, w - 20 * s, footerH);

  const itemQrUrl =
    item.permalink ||
    `https://abdesai.mu/product-tag/american-tourister/?s=${encodeURIComponent(
      item.sku || item.series
    )}`;
  const qrImg = await loadQrImage(itemQrUrl);
  const qrBoxW = qrImg ? 205 * s : 0;

  if (qrImg) {
    const qx = w - 18 * s - qrBoxW;
    const qy = footerY + 10 * s;
    const qh = footerH - 20 * s;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qx, qy, qrBoxW, qh, 8 * s);
    ctx.fill();

    ctx.drawImage(qrImg, qx + 6 * s, qy + 4 * s, qh - 8 * s, qh - 8 * s);

    ctx.fillStyle = '#0F2942';
    ctx.textAlign = 'left';
    ctx.font = `900 ${Math.round(21 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('SCAN QR', qx + qh + 2 * s, qy + 38 * s);
    ctx.fillStyle = '#B81D24';
    ctx.font = `900 ${Math.round(19 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('TO ORDER', qx + qh + 2 * s, qy + 68 * s);
  }

  const textAvailW = w - 40 * s - qrBoxW;
  const textCenterX = 20 * s + textAvailW / 2;

  ctx.fillStyle = '#FFD166';
  ctx.textAlign = 'center';
  fillFittedText(
    ctx,
    'PORT-LOUIS · TRIBECA · TRIANON · BAGATELLE · CASCAVELLE · ROSE-BELLE',
    textCenterX,
    footerY + 46 * s,
    textAvailW - 16 * s,
    900,
    25 * s,
    16 * s
  );

  ctx.fillStyle = '#FFFFFF';
  fillFittedText(
    ctx,
    '3-YR GLOBAL WARRANTY · abdesai.mu · WhatsApp: +230 5498 8887',
    textCenterX,
    footerY + 88 * s,
    textAvailW - 16 * s,
    800,
    25 * s,
    16 * s,
    '"JetBrains Mono", monospace'
  );
  ctx.textAlign = 'left';

  ctx.restore();
}

const SIZE_FILTER_TABS: ('All' | LuggageSizeClass)[] = [
  'All',
  'Cabin',
  'Medium',
  'Large',
  'X-Large',
  'Set of 3',
  'Combo / 2-Pack',
  'Backpack & Duffle',
];

export const ShelfTalkerStudioModal: React.FC<ShelfTalkerStudioModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  onOpenPriceList,
}) => {
  const [talkerStyle, setTalkerStyle] = useState<
    'series-all-in-one' | 'per-item-specs' | 'promos-only'
  >('series-all-in-one');
  // Default to 'a4-single' when viewing All-in-One Series so the whole series fills the entire page with big text, and user can toggle 4xA6 anytime
  const [layoutMode, setLayoutMode] = useState<'a6-4up' | 'a4-single'>(
    'a6-4up'
  );

  const [selectedSeriesNames, setSelectedSeriesNames] = useState<string[]>(
    DEFAULT_FOUR_SERIES_NAMES
  );

  const [selectedIds, setSelectedIds] = useState<number[]>(
    DEFAULT_BRICKLANE_SERIES_IDS
  );
  const [seriesFilter, setSeriesFilter] = useState<string>('Bricklane');
  const [sizeClassFilter, setSizeClassFilter] = useState<
    'All' | LuggageSizeClass
  >('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Custom editable overrides per Series Card and per Individual Item Card
  const [seriesOverrides, setSeriesOverrides] = useState<
    Record<string, SeriesCardOverride>
  >({});
  const [itemOverrides, setItemOverrides] = useState<
    Record<number, ItemCardOverride>
  >({});
  const [editingTarget, setEditingTarget] = useState<
    | { mode: 'series'; seriesName: string }
    | { mode: 'item'; productId: number }
    | null
  >(null);

  const updateSeriesField = (
    seriesName: string,
    patch: Partial<SeriesCardOverride>
  ) => {
    setSeriesOverrides((prev) => ({
      ...prev,
      [seriesName]: {
        ...(prev[seriesName] || {}),
        ...patch,
      },
    }));
  };

  const updateSeriesRowField = (
    seriesName: string,
    rowIndex: number,
    patch: Partial<SeriesRowOverride>
  ) => {
    setSeriesOverrides((prev) => {
      const current = prev[seriesName] || {};
      const currentRows = current.rows || {};
      return {
        ...prev,
        [seriesName]: {
          ...current,
          rows: {
            ...currentRows,
            [rowIndex]: {
              ...(currentRows[rowIndex] || {}),
              ...patch,
            },
          },
        },
      };
    });
  };

  const resetSeriesOverride = (seriesName: string) => {
    setSeriesOverrides((prev) => {
      const next = { ...prev };
      delete next[seriesName];
      return next;
    });
  };

  const updateItemField = (
    productId: number,
    patch: Partial<ItemCardOverride>
  ) => {
    setItemOverrides((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        ...patch,
      },
    }));
  };

  const resetItemOverride = (productId: number) => {
    setItemOverrides((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  React.useEffect(() => {
    if (isOpen && initialProductId) {
      const targetProd = products.find((p) => p.id === initialProductId);
      if (targetProd) {
        setSelectedSeriesNames((prev) =>
          prev.includes(targetProd.series)
            ? prev
            : [targetProd.series, ...prev.slice(0, 3)]
        );
        setSeriesFilter(targetProd.series);
        const seriesItems = products.filter(
          (p) => p.series === targetProd.series && p.priceRs > 0
        );
        const sizeOrder: Record<string, number> = {
          Cabin: 1,
          Medium: 2,
          Large: 3,
          'X-Large': 4,
          'Set of 3': 5,
          'Combo / 2-Pack': 6,
        };
        const sortedSeries = [...seriesItems].sort(
          (a, b) =>
            (sizeOrder[getExactSizeClass(a)] || 9) -
            (sizeOrder[getExactSizeClass(b)] || 9)
        );
        const picked: number[] = [initialProductId];
        const seenSizes = new Set<string>([getExactSizeClass(targetProd)]);
        for (const sp of sortedSeries) {
          const sc = getExactSizeClass(sp);
          if (!seenSizes.has(sc) && picked.length < 4) {
            seenSizes.add(sc);
            picked.push(sp.id);
          }
        }
        for (const sp of sortedSeries) {
          if (!picked.includes(sp.id) && picked.length < 4) {
            picked.push(sp.id);
          }
        }
        setSelectedIds(picked);
      }
    }
  }, [isOpen, initialProductId, products]);

  const availableSeriesNames = useMemo(() => {
    const present = new Set(
      products.filter((p) => p.priceRs > 0).map((p) => p.series)
    );
    const orderedKnown = ALL_DISPLAY_SERIES_ORDER.filter((s) => present.has(s));
    const newlyDiscovered = Array.from(present).filter(
      (s) => !orderedKnown.includes(s)
    );
    return [...orderedKnown, ...newlyDiscovered];
  }, [products]);

  const baseCatalog = useMemo(() => {
    const valid = products.filter((p) => p.priceRs > 0);
    if (talkerStyle === 'promos-only') {
      return valid.filter((p) => p.hasPromo && p.inStock);
    }
    return valid;
  }, [products, talkerStyle]);

  const seriesList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of baseCatalog) {
      counts.set(p.series, (counts.get(p.series) || 0) + 1);
    }
    return ['All', ...Array.from(counts.keys())];
  }, [baseCatalog]);

  const filteredSelectorList = useMemo(() => {
    return baseCatalog.filter((p) => {
      if (seriesFilter !== 'All' && p.series !== seriesFilter) return false;
      if (
        sizeClassFilter !== 'All' &&
        getExactSizeClass(p) !== sizeClassFilter
      ) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const spec = getProductSpecifications(p, products);
        return (
          p.name.toLowerCase().includes(q) ||
          p.series.toLowerCase().includes(q) ||
          spec.sizeClass.toLowerCase().includes(q) ||
          spec.dimensionsCm.toLowerCase().includes(q) ||
          spec.volumeLitres.toLowerCase().includes(q) ||
          spec.weightKg.toLowerCase().includes(q) ||
          (p.promoBadge || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [baseCatalog, seriesFilter, sizeClassFilter, searchTerm, products]);

  const handleSelectSeriesSizes = (seriesName: string) => {
    const targetSeries = seriesName === 'All' ? 'Bricklane' : seriesName;
    setSeriesFilter(targetSeries);
    const itemsInSeries = products.filter(
      (p) => p.series === targetSeries && p.priceRs > 0
    );
    const sizePriority: LuggageSizeClass[] = [
      'Cabin',
      'Medium',
      'Large',
      'X-Large',
      'Set of 3',
      'Combo / 2-Pack',
      'Backpack & Duffle',
    ];
    const chosenIds: number[] = [];
    for (const sz of sizePriority) {
      const match = itemsInSeries.find(
        (p) => getExactSizeClass(p) === sz && p.inStock
      );
      if (match && !chosenIds.includes(match.id)) {
        chosenIds.push(match.id);
      }
    }
    for (const item of itemsInSeries) {
      if (chosenIds.length >= 4) break;
      if (!chosenIds.includes(item.id) && item.inStock) {
        chosenIds.push(item.id);
      }
    }
    setSelectedIds(chosenIds);
    setLayoutMode('a6-4up');
  };

  const handleSelectAllInActiveSeries = () => {
    const ids = filteredSelectorList.map((p) => p.id);
    setSelectedIds(ids);
    setLayoutMode('a6-4up');
  };

  if (!isOpen) return null;

  const itemsPerSheet = layoutMode === 'a6-4up' ? 4 : 1;

  const seriesSheets: string[][] = [];
  if (talkerStyle === 'series-all-in-one') {
    for (let i = 0; i < selectedSeriesNames.length; i += itemsPerSheet) {
      seriesSheets.push(selectedSeriesNames.slice(i, i + itemsPerSheet));
    }
  }

  const selectedTalkers = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is AbDesaiATProduct => Boolean(p));

  const productSheets: AbDesaiATProduct[][] = [];
  if (talkerStyle !== 'series-all-in-one') {
    for (let i = 0; i < selectedTalkers.length; i += itemsPerSheet) {
      productSheets.push(selectedTalkers.slice(i, i + itemsPerSheet));
    }
  }

  const totalSheetsCount =
    talkerStyle === 'series-all-in-one'
      ? seriesSheets.length
      : productSheets.length;

  const toggleSeriesName = (sName: string) => {
    setSelectedSeriesNames((prev) =>
      prev.includes(sName) ? prev.filter((x) => x !== sName) : [...prev, sName]
    );
  };

  const toggleId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDownloadSingleSeriesCard = async (seriesName: string) => {
    setDownloadingKey(`series-card-${seriesName}`);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1240;
      canvas.height = 1754;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await renderSeriesAllInOneCardToRegion(
        ctx,
        seriesName,
        products,
        0,
        0,
        1240,
        1754,
        seriesOverrides[seriesName]
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `series-all-in-one-${seriesName.toLowerCase()}-prices-specs.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        },
        'image/png',
        0.98
      );
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDownloadSingleCard = async (item: AbDesaiATProduct) => {
    setDownloadingKey(`card-${item.id}`);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1240;
      canvas.height = 1754;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await renderVerticalShelfTalkerToRegion(
        ctx,
        item,
        products,
        0,
        0,
        1240,
        1754,
        itemOverrides[item.id]
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `shelf-talker-A6-${item.series.toLowerCase()}-${getExactSizeClass(
            item
          ).toLowerCase()}-${item.slug}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        },
        'image/png',
        0.98
      );
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDownloadA4SheetByIndex = async (sheetIndex: number) => {
    setDownloadingKey(`sheet-${sheetIndex}`);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 2480;
      canvas.height = 3508;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 2480, 3508);

      const positions = [
        { x: 30, y: 30 },
        { x: 1250, y: 30 },
        { x: 30, y: 1764 },
        { x: 1250, y: 1764 },
      ];

      if (talkerStyle === 'series-all-in-one') {
        const sNames = seriesSheets[sheetIndex] || [];
        if (layoutMode === 'a4-single' && sNames[0]) {
          await renderSeriesAllInOneCardToRegion(
            ctx,
            sNames[0],
            products,
            40,
            40,
            2400,
            3428,
            seriesOverrides[sNames[0]]
          );
        } else {
          for (let idx = 0; idx < sNames.length; idx++) {
            const pos = positions[idx];
            await renderSeriesAllInOneCardToRegion(
              ctx,
              sNames[idx],
              products,
              pos.x,
              pos.y,
              1200,
              1714,
              seriesOverrides[sNames[idx]]
            );
          }
        }
      } else {
        const sheetItems = productSheets[sheetIndex] || [];
        if (layoutMode === 'a4-single' && sheetItems[0]) {
          await renderVerticalShelfTalkerToRegion(
            ctx,
            sheetItems[0],
            products,
            40,
            40,
            2400,
            3428,
            itemOverrides[sheetItems[0].id]
          );
        } else {
          for (let idx = 0; idx < sheetItems.length; idx++) {
            const pos = positions[idx];
            await renderVerticalShelfTalkerToRegion(
              ctx,
              sheetItems[idx],
              products,
              pos.x,
              pos.y,
              1200,
              1714,
              itemOverrides[sheetItems[idx].id]
            );
          }
        }
      }

      if (layoutMode === 'a6-4up') {
        ctx.save();
        ctx.strokeStyle = '#9E9D95';
        ctx.lineWidth = 2;
        ctx.setLineDash([16, 16]);
        ctx.beginPath();
        ctx.moveTo(1240, 0);
        ctx.lineTo(1240, 3508);
        ctx.moveTo(0, 1754);
        ctx.lineTo(2480, 1754);
        ctx.stroke();
        ctx.restore();
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `abdesai-a4-portrait-${talkerStyle}-${
            layoutMode === 'a6-4up' ? '4xA6' : '1xA4'
          }-sheet-${sheetIndex + 1}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        },
        'image/png',
        0.98
      );
    } finally {
      setDownloadingKey(null);
    }
  };

  // ==========================================================================
  // REACT CARD 1: ALL-IN-ONE SERIES LINEUP CARD (Zero Blank Space & Oversized Bold Fonts!)
  // ==========================================================================
  const renderReactSeriesAllInOneCard = (
    seriesName: string,
    isFullA4: boolean
  ) => {
    const baseLineup = getCompleteSeriesLineup(seriesName, products);
    const lineup = applySeriesOverride(
      seriesName,
      baseLineup,
      seriesOverrides[seriesName]
    );
    const displayRows = lineup.rows.slice(0, 4);
    const hasCustomEdits = Boolean(seriesOverrides[seriesName]);

    return (
      <div
        key={seriesName}
        className="shelf-talker-card relative bg-white border-[3px] border-[#141413] flex flex-col justify-between overflow-hidden h-full"
      >
        {/* Quick Edit & Download Single Card Overlay Buttons (Hidden when printing) */}
        <div className="no-print absolute top-2 right-2 z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditingTarget({ mode: 'series', seriesName })}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded border shadow-xs cursor-pointer ${
              hasCustomEdits
                ? 'bg-[#B81D24] text-white border-[#B81D24]'
                : 'bg-[#FFD166] text-[#141413] border-black/30 hover:bg-[#f5c44f]'
            }`}
            title="Edit prices, specs, promo banner, or titles on this card before downloading"
          >
            <Pencil className="w-3 h-3" />
            <span>{hasCustomEdits ? 'Edited · Edit Card' : 'Edit Card'}</span>
          </button>
          <button
            type="button"
            disabled={downloadingKey === `series-card-${seriesName}`}
            onClick={() => handleDownloadSingleSeriesCard(seriesName)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-white/95 text-[#0F2942] border border-black/20 rounded shadow-xs hover:bg-[#EFECE6] cursor-pointer"
            title="Download this All-in-One Series Shelf Talker as high-res PNG"
          >
            <Download className="w-3 h-3" />
            <span>
              {downloadingKey === `series-card-${seriesName}`
                ? 'Saving...'
                : 'Download Card PNG'}
            </span>
          </button>
        </div>

        {/* 1. Top Brand & Collection Header (Bigger Font!) */}
        <div>
          <div
            className={`bg-[#0F2942] text-white flex items-center justify-between ${
              isFullA4 ? 'px-5 py-3' : 'px-2.5 py-1.5'
            }`}
          >
            <div className="min-w-0">
              <div
                className={`font-black tracking-tight uppercase leading-none truncate ${
                  isFullA4 ? 'text-3xl' : 'text-[15px]'
                }`}
              >
                {lineup.displaySeriesTitle}
              </div>
              <div
                className={`text-[#FFD166] font-extrabold uppercase tracking-wide ${
                  isFullA4 ? 'text-sm mt-1' : 'text-[9px] mt-0.5'
                }`}
              >
                ALL SIZES, SPECS & PRICES AT A GLANCE
              </div>
            </div>
            <div className="text-right shrink-0 pl-2">
              <div
                className={`font-mono-tabular font-extrabold text-white leading-tight ${
                  isFullA4 ? 'text-base' : 'text-[9.5px]'
                }`}
              >
                AMERICAN TOURISTER
              </div>
              <div
                className={`font-mono-tabular font-bold text-[#D4B886] leading-tight ${
                  isFullA4 ? 'text-sm' : 'text-[8.5px]'
                }`}
              >
                A.B. DESAI MAURITIUS
              </div>
            </div>
          </div>

          {/* Giant Red + Gold Clickbait Promo Strip */}
          <div
            className={`bg-[#B81D24] text-[#FFD166] text-center font-black tracking-tight uppercase truncate ${
              isFullA4
                ? 'px-4 py-2.5 text-2xl'
                : 'px-1.5 py-1 text-[11.5px] leading-tight'
            }`}
          >
            {lineup.heroPromoBanner}
          </div>
        </div>

        {/* 2. Middle Content: Image Strip (Kept as-is) + Full-Height Stacked Big-Font Rows + Bottom Callout */}
        <div
          className={`flex-1 flex flex-col justify-between min-h-0 ${
            isFullA4 ? 'p-3.5 gap-2.5' : 'p-1.5 gap-1'
          }`}
        >
          {/* Side-by-Side Visual Lineup (Kept intact!) */}
          <div
            className={`w-full shrink-0 bg-[#F9F9F8] border-2 border-[#141413] rounded-md grid ${
              displayRows.length === 1
                ? 'grid-cols-1'
                : displayRows.length === 2
                  ? 'grid-cols-2'
                  : displayRows.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-4'
            } ${isFullA4 ? 'gap-2 p-2 h-[200px]' : 'gap-1 p-1 h-[98px]'}`}
          >
            {displayRows.map((r) => (
              <div
                key={r.sizeLabel}
                className="bg-white rounded border border-black/15 flex flex-col items-center justify-between overflow-hidden text-center"
              >
                <div
                  className={`w-full bg-[#0F2942] text-white font-black uppercase truncate px-1 ${
                    isFullA4 ? 'text-sm py-1' : 'text-[8.5px] py-0.5'
                  }`}
                >
                  {r.shortSize}
                </div>
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-0.5">
                  <ProductImage
                    src={r.image}
                    alt={`${seriesName} ${r.shortSize}`}
                    series={seriesName}
                    title={`${seriesName} ${r.shortSize}`}
                    className={`object-contain ${
                      isFullA4 ? 'max-h-28' : 'max-h-13'
                    }`}
                  />
                </div>
                <div
                  className={`w-full font-mono-tabular font-black text-[#B81D24] bg-[#FFFDF7] border-t border-black/10 truncate ${
                    isFullA4 ? 'text-base py-0.5' : 'text-[10px] py-0.5'
                  }`}
                >
                  {formatRs(r.priceRs)}
                </div>
              </div>
            ))}
          </div>

          {/* FULL-HEIGHT STACKED AT-A-GLANCE SPECIFICATION & PRICE ROWS (Zero Dead Space & Huge Fonts!) */}
          <div className="flex-1 flex flex-col border-2 border-[#141413] rounded-md overflow-hidden min-h-0">
            {/* Subheader */}
            <div
              className={`bg-[#0F2942] text-[#FFD166] font-black uppercase flex items-center justify-between shrink-0 ${
                isFullA4
                  ? 'px-3.5 py-1.5 text-sm'
                  : 'px-2 py-0.5 text-[8.5px]'
              }`}
            >
              <span>SIZE & SPECIFICATIONS (CM · VOL · WEIGHT)</span>
              <span>SHOWROOM PRICE</span>
            </div>

            {/* Equal-Height Flex Rows that stretch to fill 100% of available vertical space */}
            <div className="flex-1 flex flex-col divide-y-2 divide-[#141413] min-h-0">
              {displayRows.map((r, idx) => {
                const cleanDim = r.dimensionsCm
                  .replace(' (Exp)', '')
                  .replace(' (3 Sizes)', '');
                const cleanVol = r.volumeLitres
                  .replace(' (Exp)', '')
                  .replace(' Total', '');
                const cleanWt = r.weightKg.replace(' (Ultra-Light)', '');

                return (
                  <div
                    key={r.sizeLabel}
                    className={`flex-1 flex items-center justify-between gap-1.5 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#F4F1EA]'
                    } ${isFullA4 ? 'px-3.5 py-2' : 'px-2 py-1'}`}
                  >
                    {/* Left: Giant Size Label + Bold Specs Line + Promo Tag */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <div
                        className={`font-black text-[#0F2942] uppercase leading-none truncate ${
                          isFullA4 ? 'text-2xl' : 'text-[13px]'
                        }`}
                      >
                        {r.sizeLabel}
                      </div>
                      <div
                        className={`font-mono-tabular font-extrabold text-[#141413] leading-tight truncate ${
                          isFullA4 ? 'text-base mt-1' : 'text-[9.5px] mt-0.5'
                        }`}
                      >
                        {cleanDim} · {cleanVol} · {cleanWt}
                      </div>
                      {r.promoNote && (
                        <div
                          className={`font-black text-[#B81D24] uppercase leading-tight truncate ${
                            isFullA4 ? 'text-sm mt-0.5' : 'text-[9px] mt-0.5'
                          }`}
                        >
                          ★ {r.promoNote}
                        </div>
                      )}
                    </div>

                    {/* Right: MASSIVE PRICE CALLOUT */}
                    <div className="text-right shrink-0 flex flex-col justify-center">
                      <div
                        className={`font-mono-tabular font-black text-[#B81D24] leading-none ${
                          isFullA4 ? 'text-4xl' : 'text-[19px]'
                        }`}
                      >
                        {formatRs(r.priceRs)}
                      </div>
                      {r.regularPriceRs && r.regularPriceRs > r.priceRs ? (
                        <div
                          className={`font-mono-tabular font-extrabold text-[#65645E] line-through decoration-[#B81D24] decoration-2 leading-tight ${
                            isFullA4 ? 'text-sm mt-0.5' : 'text-[8.5px]'
                          }`}
                        >
                          Was {formatRs(r.regularPriceRs)}
                        </div>
                      ) : r.subPriceBadge ? (
                        <div
                          className={`font-mono-tabular font-black text-[#0F2942] bg-[#FFD166]/45 px-1 rounded leading-tight ${
                            isFullA4 ? 'text-xs mt-1' : 'text-[8.5px] mt-0.5'
                          }`}
                        >
                          {r.subPriceBadge}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Series Features & Giant Bottom Promo Callout (Bigger Fonts!) */}
          <div
            className={`shrink-0 bg-[#FFFDF7] border-2 border-[#0F2942] rounded-md ${
              isFullA4 ? 'p-3 space-y-1.5' : 'p-1.5 space-y-1'
            }`}
          >
            <div
              className={`font-extrabold text-[#141413] leading-tight truncate ${
                isFullA4 ? 'text-base' : 'text-[10px]'
              }`}
            >
              ✓ {lineup.materialAndWheelsLine}
            </div>
            <div
              className={`font-extrabold text-[#0F2942] leading-tight truncate ${
                isFullA4 ? 'text-base' : 'text-[10px]'
              }`}
            >
              ✓ {lineup.lockAndColoursLine}
            </div>
            <div
              className={`w-full bg-[#B81D24] text-white font-black text-center uppercase rounded tracking-tight truncate ${
                isFullA4
                  ? 'py-2 px-3 text-xl'
                  : 'py-1 px-1.5 text-[10.5px] leading-tight'
              }`}
            >
              {lineup.bottomPromoCallout}
            </div>
          </div>
        </div>

        {/* 3. Bottom Showroom & Warranty Strip + Scannable QR Code! */}
        <div
          className={`bg-[#141413] text-white shrink-0 flex items-center justify-between gap-2 ${
            isFullA4 ? 'px-4 py-2 text-sm' : 'px-1.5 py-1 text-[8.5px]'
          }`}
        >
          <div className="min-w-0 flex-1 text-center">
            <div className="font-extrabold text-[#FFD166] truncate">
              PORT-LOUIS · TRIBECA · TRIANON · BAGATELLE · CASCAVELLE · ROSE-BELLE
            </div>
            <div className="font-mono-tabular font-bold text-white mt-0.5 truncate">
              3-YR GLOBAL WARRANTY · abdesai.mu · WhatsApp: +230 5498 8887
            </div>
          </div>
          <TalkerQrCodeBox
            url={
              products.find((p) => p.series === seriesName && p.permalink)
                ?.permalink ||
              `https://abdesai.mu/product-tag/american-tourister/?s=${encodeURIComponent(
                seriesName
              )}`
            }
            isFullA4={isFullA4}
          />
        </div>
      </div>
    );
  };

  // ==========================================================================
  // REACT CARD 2: INDIVIDUAL ITEM / PROMO CARD (Maximised Text & Zero Blank Space!)
  // ==========================================================================
  const renderReactVerticalCard = (
    rawItem: AbDesaiATProduct,
    isFullA4: boolean
  ) => {
    const itemOv = itemOverrides[rawItem.id];
    const item: AbDesaiATProduct = {
      ...rawItem,
      priceRs:
        itemOv?.priceRs !== undefined ? itemOv.priceRs : rawItem.priceRs,
      regularPriceRs:
        itemOv?.regularPriceRs !== undefined
          ? itemOv.regularPriceRs
          : rawItem.regularPriceRs,
    };
    const baseCompanion = getPromoCompanionVisual(item, products);
    const companion: CompanionVisual = {
      ...baseCompanion,
      companionTitle:
        itemOv?.companionTitle !== undefined
          ? itemOv.companionTitle
          : baseCompanion.companionTitle,
      companionBadge:
        itemOv?.companionBadge !== undefined
          ? itemOv.companionBadge
          : baseCompanion.companionBadge,
      companionPriceNote:
        itemOv?.companionPriceNote !== undefined
          ? itemOv.companionPriceNote
          : baseCompanion.companionPriceNote,
    };
    const baseCopy = buildHighImpactRetailCopy(item, products);
    const copy: RetailCopy = {
      shortTitle:
        itemOv?.shortTitle !== undefined
          ? itemOv.shortTitle
          : baseCopy.shortTitle,
      hookHeadline:
        itemOv?.hookHeadline !== undefined
          ? itemOv.hookHeadline
          : baseCopy.hookHeadline,
      bullets: [
        itemOv?.bullet1 !== undefined ? itemOv.bullet1 : baseCopy.bullets[0],
        itemOv?.bullet2 !== undefined ? itemOv.bullet2 : baseCopy.bullets[1],
      ],
      saveBannerText:
        itemOv?.saveBannerText !== undefined
          ? itemOv.saveBannerText
          : baseCopy.saveBannerText,
      urgencySubtext:
        itemOv?.urgencySubtext !== undefined
          ? itemOv.urgencySubtext
          : baseCopy.urgencySubtext,
    };
    const baseSpecs = getProductSpecifications(item, products);
    const specs = {
      ...baseSpecs,
      dimensionsCm:
        itemOv?.dimensionsCm !== undefined
          ? itemOv.dimensionsCm
          : baseSpecs.dimensionsCm,
      volumeLitres:
        itemOv?.volumeLitres !== undefined
          ? itemOv.volumeLitres
          : baseSpecs.volumeLitres,
      weightKg:
        itemOv?.weightKg !== undefined ? itemOv.weightKg : baseSpecs.weightKg,
    };
    const hasCustomEdits = Boolean(itemOv);

    return (
      <div
        key={item.id}
        className="shelf-talker-card relative bg-white border-[3px] border-[#141413] flex flex-col justify-between overflow-hidden h-full"
      >
        <div className="no-print absolute top-2 right-2 z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setEditingTarget({ mode: 'item', productId: rawItem.id })
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded border shadow-xs cursor-pointer ${
              hasCustomEdits
                ? 'bg-[#B81D24] text-white border-[#B81D24]'
                : 'bg-[#FFD166] text-[#141413] border-black/30 hover:bg-[#f5c44f]'
            }`}
            title="Edit headline, price, specs, or promo text on this card before downloading"
          >
            <Pencil className="w-3 h-3" />
            <span>{hasCustomEdits ? 'Edited · Edit Card' : 'Edit Card'}</span>
          </button>
          <button
            type="button"
            disabled={downloadingKey === `card-${item.id}`}
            onClick={() => handleDownloadSingleCard(rawItem)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-white/95 text-[#0F2942] border border-black/20 rounded shadow-xs hover:bg-[#EFECE6] cursor-pointer"
            title="Download this vertical A6 shelf talker as high-res PNG"
          >
            <Download className="w-3 h-3" />
            <span>
              {downloadingKey === `card-${item.id}`
                ? 'Saving...'
                : 'Download Card PNG'}
            </span>
          </button>
        </div>

        <div>
          <div
            className={`bg-[#0F2942] text-white flex items-center justify-between ${
              isFullA4 ? 'px-5 py-3' : 'px-2.5 py-1.5'
            }`}
          >
            <div>
              <div
                className={`font-black tracking-wider uppercase leading-none ${
                  isFullA4 ? 'text-2xl' : 'text-[12px]'
                }`}
              >
                AMERICAN TOURISTER
              </div>
              <div
                className={`text-[#FFD166] font-extrabold ${
                  isFullA4 ? 'text-sm mt-1' : 'text-[9.5px] mt-0.5'
                }`}
              >
                {item.series.toUpperCase()} SERIES ·{' '}
                {specs.sizeClass.toUpperCase()}
              </div>
            </div>
            <span
              className={`font-mono-tabular font-extrabold text-white ${
                isFullA4 ? 'text-base' : 'text-[9.5px]'
              }`}
            >
              A.B. DESAI MAURITIUS
            </span>
          </div>

          <div
            className={`bg-[#B81D24] text-[#FFD166] text-center font-black tracking-tight uppercase truncate ${
              isFullA4
                ? 'px-4 py-2.5 text-2xl'
                : 'px-1.5 py-1 text-[11.5px] leading-tight'
            }`}
          >
            {copy.hookHeadline}
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col justify-between min-h-0 ${
            isFullA4 ? 'p-4 gap-2.5' : 'p-2 gap-1'
          }`}
        >
          {/* Image Box (Kept intact!) */}
          <div
            className={`w-full shrink-0 bg-[#F9F9F8] border-2 border-[#141413] rounded-lg flex items-center justify-center ${
              isFullA4 ? 'p-3 h-[255px]' : 'p-1 h-[126px]'
            }`}
          >
            {companion.type !== 'none' && companion.companionImage ? (
              <div className="grid grid-cols-11 gap-1 items-center w-full h-full">
                <div className="col-span-5 h-full bg-white rounded border border-black/15 p-1 flex flex-col items-center justify-between text-center">
                  <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                    <ProductImage
                      src={item.image}
                      alt={copy.shortTitle}
                      series={item.series}
                      title={copy.shortTitle}
                      className={`object-contain ${
                        isFullA4 ? 'max-h-38' : 'max-h-17'
                      }`}
                    />
                  </div>
                  <div className="w-full pt-0.5">
                    <div
                      className={`font-extrabold text-[#141413] truncate ${
                        isFullA4 ? 'text-sm' : 'text-[9.5px]'
                      }`}
                    >
                      {item.series} {specs.sizeClass}
                    </div>
                    <div
                      className={`font-mono-tabular font-black text-[#0F2942] ${
                        isFullA4 ? 'text-base' : 'text-[11px]'
                      }`}
                    >
                      {formatRs(item.priceRs)}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <span
                    className={`rounded-full bg-[#B81D24] text-white font-black flex items-center justify-center shadow-2xs ${
                      isFullA4 ? 'w-8 h-8 text-lg' : 'w-4 h-4 text-[10px]'
                    }`}
                  >
                    +
                  </span>
                </div>

                <div className="col-span-5 h-full bg-[#FFFDF9] rounded border-2 border-[#B81D24] p-1 flex flex-col items-center justify-between text-center">
                  <div
                    className={`w-full bg-[#B81D24] text-white font-black uppercase rounded-2xs ${
                      isFullA4 ? 'text-xs py-0.5' : 'text-[8px] py-0.5'
                    }`}
                  >
                    {companion.companionBadge}
                  </div>
                  <div className="flex-1 w-full flex items-center justify-center overflow-hidden py-0.5">
                    <ProductImage
                      src={companion.companionImage}
                      alt={companion.companionTitle || 'Companion Offer'}
                      series={item.series}
                      title={companion.companionTitle || 'Promo'}
                      className={`object-contain ${
                        isFullA4 ? 'max-h-34' : 'max-h-15'
                      }`}
                    />
                  </div>
                  <div className="w-full">
                    <div
                      className={`font-extrabold text-[#141413] truncate ${
                        isFullA4 ? 'text-xs' : 'text-[8.5px]'
                      }`}
                    >
                      {companion.companionTitle}
                    </div>
                    <div
                      className={`font-mono-tabular font-black text-[#B81D24] truncate ${
                        isFullA4 ? 'text-sm' : 'text-[10px]'
                      }`}
                    >
                      {companion.companionPriceNote}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ProductImage
                src={item.image}
                alt={copy.shortTitle}
                series={item.series}
                title={copy.shortTitle}
                className={`object-contain ${
                  isFullA4 ? 'max-h-52' : 'max-h-26'
                }`}
              />
            )}
          </div>

          {/* OVERSIZED 3-COLUMN TECHNICAL SPECIFICATION BAR */}
          <div
            className={`w-full shrink-0 bg-[#0F2942] text-white rounded-md border-2 border-[#141413] grid grid-cols-3 divide-x-2 divide-white/25 text-center ${
              isFullA4 ? 'py-3 px-2' : 'py-1.5 px-1'
            }`}
          >
            <div className="px-1 flex flex-col items-center justify-center">
              <div
                className={`font-extrabold uppercase tracking-wider text-[#D4B886] flex items-center gap-0.5 ${
                  isFullA4 ? 'text-xs' : 'text-[8.5px]'
                }`}
              >
                <Ruler className={isFullA4 ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} />
                <span>SIZE (CM)</span>
              </div>
              <div
                className={`font-mono-tabular font-black text-white leading-tight truncate max-w-full ${
                  isFullA4 ? 'text-lg mt-0.5' : 'text-[11px]'
                }`}
              >
                {specs.dimensionsCm.replace(' (Exp)', '')}
              </div>
              <div
                className={`font-extrabold text-[#FFD166] uppercase leading-none ${
                  isFullA4 ? 'text-xs mt-0.5' : 'text-[8px]'
                }`}
              >
                {specs.sizeClass}
              </div>
            </div>

            <div className="px-1 flex flex-col items-center justify-center">
              <div
                className={`font-extrabold uppercase tracking-wider text-[#D4B886] flex items-center gap-0.5 ${
                  isFullA4 ? 'text-xs' : 'text-[8.5px]'
                }`}
              >
                <Box className={isFullA4 ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} />
                <span>VOLUME</span>
              </div>
              <div
                className={`font-mono-tabular font-black text-white leading-tight truncate max-w-full ${
                  isFullA4 ? 'text-xl mt-0.5' : 'text-[12px]'
                }`}
              >
                {specs.volumeLitres.replace(' (Exp)', '')}
              </div>
              <div
                className={`font-extrabold text-[#FFD166] uppercase leading-none ${
                  isFullA4 ? 'text-xs mt-0.5' : 'text-[8px]'
                }`}
              >
                CAPACITY
              </div>
            </div>

            <div className="px-1 flex flex-col items-center justify-center">
              <div
                className={`font-extrabold uppercase tracking-wider text-[#D4B886] flex items-center gap-0.5 ${
                  isFullA4 ? 'text-xs' : 'text-[8.5px]'
                }`}
              >
                <Scale className={isFullA4 ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} />
                <span>WEIGHT</span>
              </div>
              <div
                className={`font-mono-tabular font-black text-white leading-tight truncate max-w-full ${
                  isFullA4 ? 'text-xl mt-0.5' : 'text-[12px]'
                }`}
              >
                {specs.weightKg.replace(' (Ultra-Light)', '')}
              </div>
              <div
                className={`font-extrabold text-[#FFD166] uppercase leading-none ${
                  isFullA4 ? 'text-xs mt-0.5' : 'text-[8px]'
                }`}
              >
                NET WEIGHT
              </div>
            </div>
          </div>

          {/* Bigger Product Title + Bold Feature Bullets */}
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <h3
              className={`font-black text-[#0F2942] leading-tight truncate ${
                isFullA4 ? 'text-2xl mb-1.5' : 'text-[14.5px] mb-0.5'
              }`}
            >
              {copy.shortTitle}
            </h3>

            <ul className={isFullA4 ? 'space-y-1.5' : 'space-y-0.5'}>
              {copy.bullets.map((b, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-1.5 font-extrabold text-[#141413] leading-snug ${
                    isFullA4 ? 'text-base' : 'text-[10.5px]'
                  }`}
                >
                  <CheckCircle2
                    className={`text-[#B81D24] shrink-0 ${
                      isFullA4 ? 'w-5 h-5 mt-0.5' : 'w-3 h-3 mt-0.5'
                    }`}
                  />
                  <span className="line-clamp-2">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Giant Retail Price + Massive Callout Bar */}
          <div
            className={`shrink-0 bg-[#FFFDF7] border-2 border-[#0F2942] rounded-lg ${
              isFullA4 ? 'p-4 space-y-2' : 'p-2 space-y-1'
            }`}
          >
            <div>
              <div
                className={`font-extrabold uppercase tracking-wider text-[#65645E] ${
                  isFullA4 ? 'text-xs' : 'text-[8.5px]'
                }`}
              >
                {item.hasPromo
                  ? 'SPECIAL PROMO PRICE (INCL. VAT):'
                  : 'SHOWROOM RETAIL PRICE (INCL. VAT):'}
              </div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span
                  className={`font-mono-tabular font-black text-[#B81D24] leading-none ${
                    isFullA4 ? 'text-5xl' : 'text-2xl'
                  }`}
                >
                  {item.priceRs > 0
                    ? formatRs(item.priceRs)
                    : 'See Showroom'}
                </span>
                {item.regularPriceRs &&
                  item.regularPriceRs > item.priceRs && (
                    <span
                      className={`font-mono-tabular font-extrabold text-[#65645E] line-through decoration-[#B81D24] decoration-2 ${
                        isFullA4 ? 'text-xl' : 'text-xs'
                      }`}
                    >
                      Was {formatRs(item.regularPriceRs)}
                    </span>
                  )}
              </div>
            </div>

            <div
              className={`w-full ${
                item.hasPromo ? 'bg-[#B81D24]' : 'bg-[#0F2942]'
              } text-white font-black text-center uppercase rounded tracking-tight shadow-2xs truncate ${
                isFullA4
                  ? 'py-2.5 px-3 text-xl'
                  : 'py-1 px-1.5 text-[11.5px] leading-tight'
              }`}
            >
              {copy.saveBannerText}
            </div>

            <div
              className={`text-center font-black text-[#141413] uppercase tracking-tight truncate ${
                isFullA4 ? 'text-xs' : 'text-[9px]'
              }`}
            >
              {copy.urgencySubtext}
            </div>
          </div>
        </div>

        <div
          className={`bg-[#141413] text-white shrink-0 flex items-center justify-between gap-2 ${
            isFullA4 ? 'px-4 py-2 text-sm' : 'px-1.5 py-1 text-[8.5px]'
          }`}
        >
          <div className="min-w-0 flex-1 text-center">
            <div className="font-extrabold text-[#FFD166] truncate">
              PORT-LOUIS · TRIBECA · TRIANON · BAGATELLE · CASCAVELLE · ROSE-BELLE
            </div>
            <div className="font-mono-tabular font-bold text-white mt-0.5 truncate">
              3-YR GLOBAL WARRANTY · abdesai.mu · WhatsApp: +230 5498 8887
            </div>
          </div>
          <TalkerQrCodeBox
            url={
              item.permalink ||
              `https://abdesai.mu/product-tag/american-tourister/?s=${encodeURIComponent(
                item.sku || item.series
              )}`
            }
            isFullA4={isFullA4}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#EBE9E2] overflow-y-auto print:static print:bg-white print:overflow-visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelf-talker-title"
    >
      {/* Top Action & Selection Bar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-black/10 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#0F2942] font-semibold">
              <Tag className="w-3.5 h-3.5" />
              <span>
                ALL-IN-ONE SERIES & PER-ITEM A6 SHELF TALKER STUDIO · A.B. DESAI
              </span>
            </div>
            <h2
              id="shelf-talker-title"
              className="font-display text-xl sm:text-2xl font-semibold text-[#141413] mt-0.5"
            >
              {talkerStyle === 'series-all-in-one'
                ? `Whole Series At-A-Glance Shelf Talkers (${selectedSeriesNames.length} Series Selected)`
                : `Individual Per-Size & Promo Shelf Talkers (${selectedTalkers.length} Selected)`}
            </h2>
            <p className="text-xs text-[#65645E]">
              {talkerStyle === 'series-all-in-one' ? (
                <>
                  <strong>All-in-One Series Card:</strong> Oversized bold text &
                  zero blank space — shows{' '}
                  <strong>Cabin, Medium, Large, X-Large & Set</strong> prices,
                  dimensions (cm), volume (L) & weight (kg) at one glance!
                </>
              ) : (
                <>
                  <strong>Individual Per-Size Cards:</strong> 1 vertical A6 card
                  per size (Cabin, Medium, Large, X-Large) with oversized
                  Weight, Volume & Dimensions bar.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 3-Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-lg">
              <button
                type="button"
                onClick={() => setTalkerStyle('series-all-in-one')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  talkerStyle === 'series-all-in-one'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-[#65645E] hover:text-[#141413]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Whole Series on 1 Card (Prices at 1 Glance)</span>
              </button>
              <button
                type="button"
                onClick={() => setTalkerStyle('per-item-specs')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  talkerStyle === 'per-item-specs'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-[#65645E] hover:text-[#141413]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Per-Item Size Cards (Cabin/Med/Large)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTalkerStyle('promos-only');
                  setSeriesFilter('All');
                  if (selectedIds.length === 0) {
                    setSelectedIds(DEFAULT_FOUR_PROMO_A6_IDS);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  talkerStyle === 'promos-only'
                    ? 'bg-[#B81D24] text-white shadow-2xs'
                    : 'text-[#65645E] hover:text-[#141413]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Promo Talkers</span>
              </button>
            </div>

            {/* Orientation / Size Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-lg">
              <button
                type="button"
                onClick={() => setLayoutMode('a6-4up')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  layoutMode === 'a6-4up'
                    ? 'bg-white text-[#0F2942] shadow-2xs'
                    : 'text-[#65645E]'
                }`}
              >
                4 Vertical A6 / A4 Page
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('a4-single')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  layoutMode === 'a4-single'
                    ? 'bg-white text-[#0F2942] shadow-2xs'
                    : 'text-[#65645E]'
                }`}
              >
                1 Full Vertical A4 Page
              </button>
            </div>

            {totalSheetsCount > 0 && (
              <button
                type="button"
                disabled={downloadingKey === 'sheet-0'}
                onClick={() => handleDownloadA4SheetByIndex(0)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingKey === 'sheet-0'
                    ? 'Rendering 300 DPI PNG...'
                    : 'Download A4 Sheet (PNG)'}
                </span>
              </button>
            )}

            {onOpenPriceList && (
              <button
                type="button"
                onClick={onOpenPriceList}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-[#0F2942] text-[#0F2942] rounded-lg hover:bg-[#EFECE6] transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#B81D24]" />
                <span>Master Price List</span>
              </button>
            )}

            <button
              type="button"
              disabled={totalSheetsCount === 0}
              onClick={() => window.print()}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                totalSheetsCount > 0
                  ? 'bg-[#0F2942] text-white hover:bg-[#091A2B] cursor-pointer'
                  : 'bg-black/15 text-[#65645E] cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Print {totalSheetsCount} A4 Page(s)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#65645E] hover:text-[#141413] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Close shelf talker studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELECTOR PANEL FOR MODE 1: WHOLE SERIES ON 1 CARD */}
        {talkerStyle === 'series-all-in-one' ? (
          <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-black/8 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#141413]">
                Select Series to Print (Each card shows all Cabin, Medium,
                Large/X-Large & Set prices + specs at one glance):
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeriesNames(['Bricklane']);
                    setLayoutMode('a4-single');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#0F2942] text-white rounded-md hover:bg-[#091A2B] cursor-pointer whitespace-nowrap"
                >
                  Bricklane All-in-One on 1 Full A4 Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeriesNames(DEFAULT_FOUR_SERIES_NAMES);
                    setLayoutMode('a6-4up');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 text-[#141413] rounded-md hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
                >
                  Select 4 Top Series (4×A6 on 1 A4 Page)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeriesNames(availableSeriesNames.slice(0, 12));
                    setLayoutMode('a6-4up');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 text-[#141413] rounded-md hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
                >
                  Select 12 Major Series (3 A4 Pages)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeriesNames(availableSeriesNames);
                    setLayoutMode('a6-4up');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 text-[#141413] rounded-md hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
                >
                  Select All {availableSeriesNames.length} Series
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSeriesNames([])}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 text-[#B81D24] rounded-md hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 bg-[#F9F9F8] rounded-lg border border-black/8">
              {availableSeriesNames.map((sName) => {
                const checked = selectedSeriesNames.includes(sName);
                const lineup = getCompleteSeriesLineup(sName, products);
                const firstImg = lineup.rows[0]?.image || '';
                const summaryPrices = lineup.rows
                  .slice(0, 3)
                  .map((r) => `${r.shortSize}: ${formatRs(r.priceRs)}`)
                  .join(' · ');

                return (
                  <div
                    key={sName}
                    onClick={() => toggleSeriesName(sName)}
                    className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      checked
                        ? 'border-[#0F2942] bg-[#0F2942]/8'
                        : 'border-black/8 bg-white hover:bg-[#EFECE6]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-[#0F2942] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#65645E] shrink-0" />
                      )}
                      {firstImg && (
                        <img
                          src={firstImg}
                          alt={sName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 object-contain rounded bg-white border border-black/6 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#141413] truncate">
                          {sName} Series ({lineup.rows.length} Sizes)
                        </div>
                        <div className="text-[9.5px] font-mono-tabular text-[#0F2942] font-bold truncate">
                          {summaryPrices}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTarget({ mode: 'series', seriesName: sName });
                        }}
                        className="p-1.5 text-[10px] font-semibold bg-[#FFD166] border border-black/25 text-[#141413] rounded hover:bg-[#f5c44f] cursor-pointer"
                        title="Edit this Series Shelf Talker before downloading"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSingleSeriesCard(sName);
                        }}
                        className="p-1.5 text-[10px] font-semibold bg-white border border-black/15 text-[#0F2942] rounded hover:bg-[#EFECE6] cursor-pointer"
                        title="Download All-in-One Series PNG Card"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSeriesNames([sName]);
                          setLayoutMode('a4-single');
                        }}
                        className="px-1.5 py-1 text-[9.5px] font-semibold bg-[#0F2942] text-white rounded hover:bg-[#091A2B] cursor-pointer"
                        title="View this whole series on 1 Full A4 Page"
                      >
                        1×A4
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* SELECTOR PANEL FOR MODE 2 & 3: PER-ITEM SIZE CARDS & PROMO CARDS */
          <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-black/8 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <span className="text-xs font-semibold text-[#65645E] mr-1 shrink-0">
                  1. Choose Series:
                </span>
                {seriesList.map((series) => (
                  <button
                    key={series}
                    type="button"
                    onClick={() => {
                      setSeriesFilter(series);
                      if (series !== 'All') {
                        handleSelectSeriesSizes(series);
                      }
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                      seriesFilter === series
                        ? 'border-[#0F2942] bg-[#0F2942] text-white'
                        : 'border-black/10 bg-white text-[#65645E] hover:text-[#141413]'
                    }`}
                  >
                    {series}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                <span className="text-xs font-semibold text-[#65645E] mr-1 shrink-0">
                  2. Filter Size:
                </span>
                {SIZE_FILTER_TABS.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSizeClassFilter(sz)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors cursor-pointer whitespace-nowrap ${
                      sizeClassFilter === sz
                        ? 'border-[#B81D24] bg-[#B81D24] text-white'
                        : 'border-black/10 bg-[#F9F9F8] text-[#65645E] hover:text-[#141413]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {seriesFilter !== 'All' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectSeriesSizes(seriesFilter)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#0F2942]/10 text-[#0F2942] border border-[#0F2942]/25 rounded-md hover:bg-[#0F2942] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Load 4 {seriesFilter} Sizes (1 A4 Page)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllInActiveSeries}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white text-[#141413] border border-black/15 rounded-md hover:bg-[#EFECE6] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Select All {filteredSelectorList.length} {seriesFilter}{' '}
                      Items
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSeriesFilter('Bricklane');
                    setSelectedIds(DEFAULT_BRICKLANE_SERIES_IDS);
                    setLayoutMode('a6-4up');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 text-[#141413] rounded-md hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
                >
                  Bricklane Cabin/Med/Large (4×A6)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedIds(DEFAULT_FOUR_PROMO_A6_IDS);
                    setLayoutMode('a6-4up');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 text-[#141413] rounded-md hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
                >
                  4 Flagship Promos
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds(CORE_16_PROMO_IDS)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 text-[#141413] rounded-md hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
                >
                  16 Core Promos
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 text-[#B81D24] rounded-md hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
                >
                  Clear
                </button>

                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-[#65645E] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search series, size, cm, L, kg..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#F9F9F8] border border-black/15 rounded-md focus:outline-none focus:border-[#0F2942]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 bg-[#F9F9F8] rounded-lg border border-black/8">
              {filteredSelectorList.map((p) => {
                const checked = selectedIds.includes(p.id);
                const specs = getProductSpecifications(p, products);
                const shortName = p.name
                  .replace(/^AMERICAN TOURISTER\s+/i, '')
                  .replace(/\s*\(\s*Get 1 Cabin[\s\S]*$/i, '')
                  .replace(/\s*with Free 950Ml[\s\S]*$/i, '')
                  .replace(/\s*\+\s*Free RICO[\s\S]*$/i, '');

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleId(p.id)}
                    className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      checked
                        ? 'border-[#0F2942] bg-[#0F2942]/8'
                        : 'border-black/8 bg-white hover:bg-[#EFECE6]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-[#0F2942] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#65645E] shrink-0" />
                      )}
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={shortName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 object-contain rounded bg-white border border-black/6 shrink-0"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-[#0F2942] text-white rounded-2xs shrink-0">
                            {specs.sizeClass}
                          </span>
                          <span className="text-[11px] font-semibold text-[#141413] truncate">
                            {shortName}
                          </span>
                        </div>
                        <div className="text-[9.5px] font-mono-tabular text-[#65645E] truncate mt-0.5">
                          {specs.dimensionsCm} · {specs.volumeLitres} ·{' '}
                          {specs.weightKg}
                        </div>
                        <div className="text-[10px] font-mono-tabular text-[#0F2942] font-bold">
                          {formatRs(p.priceRs)}
                          {p.hasPromo && (
                            <span className="ml-1 text-[#B81D24]">· PROMO</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTarget({ mode: 'item', productId: p.id });
                        }}
                        className="p-1.5 text-[10px] font-semibold bg-[#FFD166] border border-black/25 text-[#141413] rounded hover:bg-[#f5c44f] cursor-pointer"
                        title="Edit this Shelf Talker before downloading"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSingleCard(p);
                        }}
                        className="p-1.5 text-[10px] font-semibold bg-white border border-black/15 text-[#0F2942] rounded hover:bg-[#EFECE6] cursor-pointer"
                        title="Download Vertical A6 PNG Card"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds([p.id]);
                          setLayoutMode('a4-single');
                        }}
                        className="px-1.5 py-1 text-[9.5px] font-semibold bg-[#0F2942] text-white rounded hover:bg-[#091A2B] cursor-pointer"
                        title="Preview as 1 Vertical A4 Poster"
                      >
                        1×A4
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Printable A4 Portrait Sheets Preview Area */}
      <div className="py-8 px-4 print:p-0 flex flex-col items-center gap-8 print:gap-0">
        {totalSheetsCount === 0 ? (
          <div className="no-print bg-white border border-black/10 rounded-xl p-12 text-center space-y-3 max-w-lg">
            <p className="text-base font-semibold text-[#141413]">
              No shelf talkers selected yet.
            </p>
            <p className="text-xs text-[#65645E]">
              Select any Series above to generate an{' '}
              <strong>All-in-One Series Shelf Talker</strong> (showing Cabin,
              Medium, Large & X-Large prices + specs on 1 card), or switch to{' '}
              <strong>Per-Item Size Cards</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTalkerStyle('series-all-in-one');
                  setSelectedSeriesNames(DEFAULT_FOUR_SERIES_NAMES);
                  setLayoutMode('a6-4up');
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#0F2942] text-white rounded-lg cursor-pointer"
              >
                Load 4 All-in-One Series Cards (Bricklane, Skytrac, Jamaica,
                Dashway)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTalkerStyle('per-item-specs');
                  setSeriesFilter('Bricklane');
                  setSelectedIds(DEFAULT_BRICKLANE_SERIES_IDS);
                  setLayoutMode('a6-4up');
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#B81D24] text-white rounded-lg cursor-pointer"
              >
                Load Bricklane Individual Size Cards
              </button>
            </div>
          </div>
        ) : talkerStyle === 'series-all-in-one' ? (
          seriesSheets.map((sNames, sheetIdx) => (
            <div key={sheetIdx} className="flex flex-col items-center">
              <div className="no-print w-full max-w-[210mm] mb-2 flex items-center justify-between text-xs text-[#141413] bg-white px-4 py-2 rounded-lg border border-black/10 shadow-2xs">
                <span className="font-semibold">
                  A4 Portrait Sheet #{sheetIdx + 1} —{' '}
                  {layoutMode === 'a6-4up'
                    ? `${sNames.length} of 4 All-in-One Series Cards (${sNames.join(', ')})`
                    : `1 Full A4 All-in-One Series Display (${sNames[0]})`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={downloadingKey === `sheet-${sheetIdx}`}
                    onClick={() => handleDownloadA4SheetByIndex(sheetIdx)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#1B5E3A] text-white rounded-md hover:bg-[#14492D] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadingKey === `sheet-${sheetIdx}`
                        ? 'Generating 300 DPI PNG...'
                        : `Download Sheet #${sheetIdx + 1} (PNG)`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#0F2942] text-white rounded-md hover:bg-[#091A2B] cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                </div>
              </div>

              <div className="a4-print-sheet bg-white shadow-xl border border-black/15 w-[210mm] h-[297mm] p-[6mm] box-border">
                {layoutMode === 'a4-single' ? (
                  <div className="w-full h-full">
                    {renderReactSeriesAllInOneCard(sNames[0], true)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 grid-rows-2 gap-[4mm] w-full h-full">
                    {sNames.map((sName) =>
                      renderReactSeriesAllInOneCard(sName, false)
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          productSheets.map((sheetItems, sheetIdx) => (
            <div key={sheetIdx} className="flex flex-col items-center">
              <div className="no-print w-full max-w-[210mm] mb-2 flex items-center justify-between text-xs text-[#141413] bg-white px-4 py-2 rounded-lg border border-black/10 shadow-2xs">
                <span className="font-semibold">
                  A4 Portrait Sheet #{sheetIdx + 1} —{' '}
                  {layoutMode === 'a6-4up'
                    ? `${sheetItems.length} of 4 Vertical A6 Spec Cards (105×148mm each)`
                    : '1 Full Vertical A4 Display Poster (210×297mm)'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={downloadingKey === `sheet-${sheetIdx}`}
                    onClick={() => handleDownloadA4SheetByIndex(sheetIdx)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#1B5E3A] text-white rounded-md hover:bg-[#14492D] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadingKey === `sheet-${sheetIdx}`
                        ? 'Generating 300 DPI PNG...'
                        : `Download Sheet #${sheetIdx + 1} (PNG)`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#0F2942] text-white rounded-md hover:bg-[#091A2B] cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                </div>
              </div>

              <div className="a4-print-sheet bg-white shadow-xl border border-black/15 w-[210mm] h-[297mm] p-[6mm] box-border">
                {layoutMode === 'a4-single' ? (
                  <div className="w-full h-full">
                    {renderReactVerticalCard(sheetItems[0], true)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 grid-rows-2 gap-[4mm] w-full h-full">
                    {sheetItems.map((item) =>
                      renderReactVerticalCard(item, false)
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ====================================================================
          LIVE SHELF TALKER EDITOR MODAL (Edit Any Text, Price, Spec, or Promo Before Downloading!)
          ==================================================================== */}
      {editingTarget && (
        <div className="no-print fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border-2 border-[#0F2942] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#0F2942] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#FFD166] text-[#141413] flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold leading-tight">
                    {editingTarget.mode === 'series'
                      ? `Edit "${editingTarget.seriesName} Series" All-in-One Shelf Talker`
                      : `Edit Individual Size / Promo Shelf Talker`}
                  </h3>
                  <p className="text-[11px] text-[#FFD166] font-medium">
                    All edits update the live preview, Print A4 Page, and 300-DPI PNG Download immediately.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingTarget.mode === 'series' ? (
                  <button
                    type="button"
                    onClick={() => resetSeriesOverride(editingTarget.seriesName)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Default</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => resetItemOverride(editingTarget.productId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Default</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  aria-label="Close editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[#F9F9F8]">
              {editingTarget.mode === 'series' ? (
                (() => {
                  const sName = editingTarget.seriesName;
                  const baseLineup = getCompleteSeriesLineup(sName, products);
                  const merged = applySeriesOverride(
                    sName,
                    baseLineup,
                    seriesOverrides[sName]
                  );

                  return (
                    <>
                      {/* Section 1: Headlines & Promo Banner */}
                      <div className="bg-white p-4 rounded-lg border border-black/10 space-y-3">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-[#0F2942]">
                          1. Top Series Header & Promo Banner
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#141413] mb-1">
                              Series Main Title
                            </label>
                            <input
                              type="text"
                              value={merged.displaySeriesTitle}
                              onChange={(e) =>
                                updateSeriesField(sName, {
                                  seriesTitle: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 text-xs font-bold bg-[#F9F9F8] border border-black/20 rounded-md focus:outline-none focus:border-[#0F2942]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#B81D24] mb-1">
                              Top Red Clickbait / Promo Strip
                            </label>
                            <input
                              type="text"
                              value={merged.heroPromoBanner}
                              onChange={(e) =>
                                updateSeriesField(sName, {
                                  heroPromoBanner: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 text-xs font-bold bg-[#FFFDF7] border border-[#B81D24]/40 rounded-md focus:outline-none focus:border-[#B81D24]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Each Size Row (Cabin, Medium, Large, Set, etc.) */}
                      <div className="bg-white p-4 rounded-lg border border-black/10 space-y-3">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-[#0F2942]">
                          2. Size Rows — Prices, Dimensions (cm), Volume (L), Weight (kg) & Promo Notes
                        </div>
                        <div className="space-y-3">
                          {merged.rows.slice(0, 4).map((r, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-3 rounded-lg bg-[#F4F1EA] border border-black/10 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#0F2942] uppercase">
                                  Row #{rIdx + 1}: {r.shortSize}
                                </span>
                                <span className="text-xs font-mono-tabular font-black text-[#B81D24]">
                                  Active: {formatRs(r.priceRs)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-[10px] font-semibold text-[#65645E]">
                                    Photo Badge Title
                                  </label>
                                  <input
                                    type="text"
                                    value={r.shortSize}
                                    onChange={(e) =>
                                      updateSeriesRowField(sName, rIdx, {
                                        shortSize: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-xs font-semibold bg-white border border-black/15 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-[#65645E]">
                                    Table Row Size Label
                                  </label>
                                  <input
                                    type="text"
                                    value={r.sizeLabel}
                                    onChange={(e) =>
                                      updateSeriesRowField(sName, rIdx, {
                                        sizeLabel: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-xs font-semibold bg-white border border-black/15 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-[#B81D24]">
                                    Active Price (Rs)
                                  </label>
                                  <input
                                    type="number"
                                    value={r.priceRs}
                                    onChange={(e) =>
                                      updateSeriesRowField(sName, rIdx, {
                                        priceRs: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-xs font-mono-tabular font-bold bg-white border border-[#B81D24]/40 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-[#65645E]">
                                    Was / Regular Price (Rs)
                                  </label>
                                  <input
                                    type="number"
                                    value={r.regularPriceRs || ''}
                                    placeholder="Optional"
                                    onChange={(e) => {
                                      const val = e.target.value.trim();
                                      updateSeriesRowField(sName, rIdx, {
                                        regularPriceRs: val
                                          ? Number(val)
                                          : undefined,
                                      });
                                    }}
                                    className="w-full px-2.5 py-1 text-xs font-mono-tabular bg-white border border-black/15 rounded"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-[10px] font-semibold text-[#65645E]">
                                    Dimensions (cm)
                                  </label>
                                  <input
                                    type="text"
                                    value={r.dimensionsCm}
                                    onChange={(e) =>
                                      updateSeriesRowField(sName, rIdx, {
                                        dimensionsCm: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-xs font-mono-tabular bg-white border border-black/15 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-[#65645E]">
                                    Volume (L)
                                  </label>
                                  <input
                                    type="text"
                                    value={r.volumeLitres}
                                    onChange={(e) =>
                                      updateSeriesRowField(sName, rIdx, {
                                        volumeLitres: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-xs font-mono-tabular bg-white border border-black/15 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-[#65645E]">
                                    Weight (kg)
                                  </label>
                                  <input
                                    type="text"
                                    value={r.weightKg}
                                    onChange={(e) =>
                                      updateSeriesRowField(sName, rIdx, {
                                        weightKg: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-xs font-mono-tabular bg-white border border-black/15 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-[#B81D24]">
                                    Row Promo Tag (Red ★)
                                  </label>
                                  <input
                                    type="text"
                                    value={r.promoNote || ''}
                                    placeholder="e.g. +55cm Cabin at Rs 2,250!"
                                    onChange={(e) =>
                                      updateSeriesRowField(sName, rIdx, {
                                        promoNote: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-xs font-semibold bg-white border border-black/15 rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Features & Bottom Callout Bar */}
                      <div className="bg-white p-4 rounded-lg border border-black/10 space-y-3">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-[#0F2942]">
                          3. Bottom Specs & Red Value Callout Bar
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#141413] mb-1">
                              Bullet Line 1 (Material & Wheels)
                            </label>
                            <input
                              type="text"
                              value={merged.materialAndWheelsLine}
                              onChange={(e) =>
                                updateSeriesField(sName, {
                                  materialAndWheels: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 text-xs bg-[#F9F9F8] border border-black/20 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#141413] mb-1">
                              Bullet Line 2 (Lock & Colours)
                            </label>
                            <input
                              type="text"
                              value={merged.lockAndColoursLine}
                              onChange={(e) =>
                                updateSeriesField(sName, {
                                  lockAndColours: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 text-xs bg-[#F9F9F8] border border-black/20 rounded-md"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#B81D24] mb-1">
                            Bottom Red Value / Savings Callout Banner
                          </label>
                          <input
                            type="text"
                            value={merged.bottomPromoCallout}
                            onChange={(e) =>
                              updateSeriesField(sName, {
                                bottomPromoCallout: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs font-bold bg-[#FFFDF7] border border-[#B81D24]/40 rounded-md"
                          />
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                (() => {
                  const rawItem = products.find(
                    (p) => p.id === editingTarget.productId
                  );
                  if (!rawItem) return null;
                  const itemOv = itemOverrides[rawItem.id];
                  const effectiveItem: AbDesaiATProduct = {
                    ...rawItem,
                    priceRs:
                      itemOv?.priceRs !== undefined
                        ? itemOv.priceRs
                        : rawItem.priceRs,
                    regularPriceRs:
                      itemOv?.regularPriceRs !== undefined
                        ? itemOv.regularPriceRs
                        : rawItem.regularPriceRs,
                  };
                  const baseCopy = buildHighImpactRetailCopy(
                    effectiveItem,
                    products
                  );
                  const baseSpecs = getProductSpecifications(
                    effectiveItem,
                    products
                  );
                  const baseComp = getPromoCompanionVisual(
                    effectiveItem,
                    products
                  );

                  const shortTitle =
                    itemOv?.shortTitle !== undefined
                      ? itemOv.shortTitle
                      : baseCopy.shortTitle;
                  const hookHeadline =
                    itemOv?.hookHeadline !== undefined
                      ? itemOv.hookHeadline
                      : baseCopy.hookHeadline;
                  const dimensionsCm =
                    itemOv?.dimensionsCm !== undefined
                      ? itemOv.dimensionsCm
                      : baseSpecs.dimensionsCm;
                  const volumeLitres =
                    itemOv?.volumeLitres !== undefined
                      ? itemOv.volumeLitres
                      : baseSpecs.volumeLitres;
                  const weightKg =
                    itemOv?.weightKg !== undefined
                      ? itemOv.weightKg
                      : baseSpecs.weightKg;
                  const bullet1 =
                    itemOv?.bullet1 !== undefined
                      ? itemOv.bullet1
                      : baseCopy.bullets[0];
                  const bullet2 =
                    itemOv?.bullet2 !== undefined
                      ? itemOv.bullet2
                      : baseCopy.bullets[1];
                  const saveBannerText =
                    itemOv?.saveBannerText !== undefined
                      ? itemOv.saveBannerText
                      : baseCopy.saveBannerText;
                  const urgencySubtext =
                    itemOv?.urgencySubtext !== undefined
                      ? itemOv.urgencySubtext
                      : baseCopy.urgencySubtext;

                  return (
                    <div className="bg-white p-4 rounded-lg border border-black/10 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#141413] mb-1">
                            Product Title on Card
                          </label>
                          <input
                            type="text"
                            value={shortTitle}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                shortTitle: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs font-bold bg-[#F9F9F8] border border-black/20 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#B81D24] mb-1">
                            Top Red Clickbait Headline Strip
                          </label>
                          <input
                            type="text"
                            value={hookHeadline}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                hookHeadline: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs font-bold bg-[#FFFDF7] border border-[#B81D24]/40 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[#B81D24] mb-1">
                            Active Price (Rs)
                          </label>
                          <input
                            type="number"
                            value={effectiveItem.priceRs}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                priceRs: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono-tabular font-bold bg-[#FFFDF7] border border-[#B81D24]/40 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#65645E] mb-1">
                            Regular / Was Price (Rs)
                          </label>
                          <input
                            type="number"
                            value={effectiveItem.regularPriceRs || ''}
                            placeholder="Optional"
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              updateItemField(rawItem.id, {
                                regularPriceRs: val ? Number(val) : undefined,
                              });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#F9F9F8] border border-black/20 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#0F2942] mb-1">
                            Size (cm)
                          </label>
                          <input
                            type="text"
                            value={dimensionsCm}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                dimensionsCm: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#F9F9F8] border border-black/20 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#0F2942] mb-1">
                            Volume (L)
                          </label>
                          <input
                            type="text"
                            value={volumeLitres}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                volumeLitres: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#F9F9F8] border border-black/20 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#0F2942] mb-1">
                            Weight (kg)
                          </label>
                          <input
                            type="text"
                            value={weightKg}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                weightKg: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#F9F9F8] border border-black/20 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#141413] mb-1">
                            Feature Bullet #1
                          </label>
                          <input
                            type="text"
                            value={bullet1}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                bullet1: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-[#F9F9F8] border border-black/20 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#141413] mb-1">
                            Feature Bullet #2
                          </label>
                          <input
                            type="text"
                            value={bullet2}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                bullet2: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-[#F9F9F8] border border-black/20 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#B81D24] mb-1">
                            Main Save / Promo Banner Text
                          </label>
                          <input
                            type="text"
                            value={saveBannerText}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                saveBannerText: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs font-bold bg-[#FFFDF7] border border-[#B81D24]/40 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#141413] mb-1">
                            Bottom Urgency Subtext
                          </label>
                          <input
                            type="text"
                            value={urgencySubtext}
                            onChange={(e) =>
                              updateItemField(rawItem.id, {
                                urgencySubtext: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-[#F9F9F8] border border-black/20 rounded-md"
                          />
                        </div>
                      </div>

                      {baseComp.type !== 'none' && (
                        <div className="pt-2 border-t border-black/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-[#B81D24] mb-1">
                              Companion Promo Badge
                            </label>
                            <input
                              type="text"
                              value={
                                itemOv?.companionBadge !== undefined
                                  ? itemOv.companionBadge
                                  : baseComp.companionBadge || ''
                              }
                              onChange={(e) =>
                                updateItemField(rawItem.id, {
                                  companionBadge: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1 text-xs bg-[#FFFDF7] border border-black/20 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#141413] mb-1">
                              Companion Item Title
                            </label>
                            <input
                              type="text"
                              value={
                                itemOv?.companionTitle !== undefined
                                  ? itemOv.companionTitle
                                  : baseComp.companionTitle || ''
                              }
                              onChange={(e) =>
                                updateItemField(rawItem.id, {
                                  companionTitle: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1 text-xs bg-[#F9F9F8] border border-black/20 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#B81D24] mb-1">
                              Companion Price Note
                            </label>
                            <input
                              type="text"
                              value={
                                itemOv?.companionPriceNote !== undefined
                                  ? itemOv.companionPriceNote
                                  : baseComp.companionPriceNote || ''
                              }
                              onChange={(e) =>
                                updateItemField(rawItem.id, {
                                  companionPriceNote: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1 text-xs bg-[#FFFDF7] border border-black/20 rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer with Instant Download & Done Buttons */}
            <div className="bg-white border-t border-black/10 px-5 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="text-xs text-[#65645E]">
                Changes are automatically applied to the preview and high-res PNG downloads.
              </div>
              <div className="flex items-center gap-2">
                {editingTarget.mode === 'series' ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadSingleSeriesCard(editingTarget.seriesName)
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Edited Series Card (PNG)</span>
                  </button>
                ) : (
                  (() => {
                    const prod = products.find(
                      (p) => p.id === editingTarget.productId
                    );
                    if (!prod) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleCard(prod)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Edited Card (PNG)</span>
                      </button>
                    );
                  })()
                )}
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-5 py-2 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] cursor-pointer"
                >
                  Done & Preview Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
