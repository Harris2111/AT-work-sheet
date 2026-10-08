import React, { useState, useRef, useEffect } from 'react';
import {
  Move,
  Maximize2,
  Type,
  Image as ImageIcon,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Printer,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  ArrowUp,
  ArrowDown,
  Upload,
  Check,
  QrCode,
  Sparkles,
  Grid,
  Bold,
  Lock,
  Unlock,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { AbDesaiATProduct, formatRs } from '../data/luggageCatalog';
import {
  getCompleteSeriesLineup,
  getProductSpecifications,
  extractColourName,
  ALL_DISPLAY_SERIES_ORDER,
} from '../data/productSpecs';
import { ProductImage, loadCorsSafeCanvasImage } from './ProductImage';
import QRCode from 'qrcode';

export type BuilderElementType = 'text' | 'image' | 'box' | 'qr';

export interface BuilderElement {
  id: string;
  type: BuilderElementType;
  label: string;
  // Percentage coordinates (0 to 100) relative to card width/height
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked?: boolean;
  // Text properties
  text?: string;
  fontSize?: number; // Base font size on a 620px-wide canvas
  fontWeight?: '600' | '700' | '800' | '900';
  fontFamily?: 'sans' | 'mono' | 'display';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  // Box / Background / Border properties
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  // Image / QR properties
  imageSrc?: string;
  qrUrl?: string;
  objectFit?: 'contain' | 'cover';
}

interface CustomTemplateBuilderProps {
  products: AbDesaiATProduct[];
  initialSeries?: string;
  initialProductId?: number | null;
}

const qrCache = new Map<string, string>();
async function generateQrDataUrl(url: string): Promise<string> {
  if (qrCache.has(url)) return qrCache.get(url)!;
  try {
    const data = await QRCode.toDataURL(url, {
      margin: 1,
      width: 240,
      color: { dark: '#0F2942', light: '#FFFFFF' },
    });
    qrCache.set(url, data);
    return data;
  } catch {
    return '';
  }
}

export function buildSeriesDefaultElements(
  seriesName: string,
  allProducts: AbDesaiATProduct[]
): BuilderElement[] {
  const lineup = getCompleteSeriesLineup(seriesName, allProducts);
  const rows = lineup.rows.slice(0, 4);
  const repProd = allProducts.find((p) => p.series === seriesName && p.permalink);
  const qrUrl =
    repProd?.permalink ||
    `https://abdesai.mu/product-tag/american-tourister/?s=${encodeURIComponent(
      seriesName
    )}`;

  const elements: BuilderElement[] = [
    // Outer frame
    {
      id: 'frame-border',
      type: 'box',
      label: 'Card Outer Border',
      x: 0.8,
      y: 0.6,
      w: 98.4,
      h: 98.8,
      zIndex: 1,
      bgColor: '#FFFFFF',
      borderColor: '#141413',
      borderWidth: 4,
      borderRadius: 0,
    },
    // Top Navy Header Box
    {
      id: 'header-bg',
      type: 'box',
      label: 'Top Navy Header Box',
      x: 1.5,
      y: 1.0,
      w: 97.0,
      h: 6.8,
      zIndex: 2,
      bgColor: '#0F2942',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
    },
    {
      id: 'header-title',
      type: 'text',
      label: 'Series Title',
      x: 3.2,
      y: 1.6,
      w: 58,
      h: 3.4,
      zIndex: 5,
      text: `${seriesName.toUpperCase()} SERIES`,
      fontSize: 25,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'left',
      color: '#FFFFFF',
      bgColor: 'transparent',
    },
    {
      id: 'header-subtitle',
      type: 'text',
      label: 'Header Subtitle',
      x: 3.2,
      y: 4.9,
      w: 58,
      h: 2.4,
      zIndex: 5,
      text: 'ALL SIZES, SPECS & PRICES AT A GLANCE',
      fontSize: 13,
      fontWeight: '800',
      fontFamily: 'sans',
      textAlign: 'left',
      color: '#FFD166',
      bgColor: 'transparent',
    },
    {
      id: 'header-brand-right',
      type: 'text',
      label: 'Brand Right Text',
      x: 61,
      y: 1.8,
      w: 35.5,
      h: 5.2,
      zIndex: 5,
      text: 'AMERICAN TOURISTER\nA.B. DESAI MAURITIUS',
      fontSize: 13,
      fontWeight: '800',
      fontFamily: 'mono',
      textAlign: 'right',
      color: '#FFD166',
      bgColor: 'transparent',
    },
    // Red Promo Banner
    {
      id: 'promo-strip',
      type: 'text',
      label: 'Top Red Promo Banner',
      x: 1.5,
      y: 7.8,
      w: 97.0,
      h: 5.2,
      zIndex: 4,
      text: lineup.heroPromoBanner,
      fontSize: 19,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'center',
      color: '#FFD166',
      bgColor: '#B81D24',
      padding: 6,
    },
    // Photo Strip Container
    {
      id: 'photo-strip-bg',
      type: 'box',
      label: 'Photo Strip Box',
      x: 2.4,
      y: 13.6,
      w: 95.2,
      h: 21.0,
      zIndex: 2,
      bgColor: '#F9F9F8',
      borderColor: '#141413',
      borderWidth: 2,
      borderRadius: 6,
    },
  ];

  // Add each size image + badge + price tag in the photo strip
  const colCount = Math.max(1, rows.length);
  const slotW = 92.8 / colCount;
  rows.forEach((r, idx) => {
    const sx = 3.6 + idx * slotW;
    const sw = slotW - 1.2;
    elements.push(
      {
        id: `photo-card-bg-${idx}`,
        type: 'box',
        label: `Photo Slot #${idx + 1} Box (${r.shortSize})`,
        x: Number(sx.toFixed(1)),
        y: 14.4,
        w: Number(sw.toFixed(1)),
        h: 19.4,
        zIndex: 3,
        bgColor: '#FFFFFF',
        borderColor: '#C9C6BC',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        id: `photo-badge-${idx}`,
        type: 'text',
        label: `Photo #${idx + 1} Top Label`,
        x: Number(sx.toFixed(1)),
        y: 14.4,
        w: Number(sw.toFixed(1)),
        h: 2.8,
        zIndex: 6,
        text: r.shortSize.toUpperCase(),
        fontSize: 13,
        fontWeight: '900',
        fontFamily: 'sans',
        textAlign: 'center',
        color: '#FFFFFF',
        bgColor: '#0F2942',
      },
      {
        id: `photo-img-${idx}`,
        type: 'image',
        label: `Suitcase Image #${idx + 1} (${r.shortSize})`,
        x: Number((sx + 0.6).toFixed(1)),
        y: 17.5,
        w: Number((sw - 1.2).toFixed(1)),
        h: 13.0,
        zIndex: 5,
        imageSrc: r.image,
        objectFit: 'contain',
      },
      {
        id: `photo-price-${idx}`,
        type: 'text',
        label: `Photo #${idx + 1} Price Tag`,
        x: Number(sx.toFixed(1)),
        y: 30.7,
        w: Number(sw.toFixed(1)),
        h: 3.1,
        zIndex: 6,
        text: formatRs(r.priceRs),
        fontSize: 16,
        fontWeight: '900',
        fontFamily: 'mono',
        textAlign: 'center',
        color: '#B81D24',
        bgColor: '#FFFDF7',
      }
    );
  });

  // Table Header Bar
  elements.push({
    id: 'table-header',
    type: 'text',
    label: 'Specs Table Header Bar',
    x: 2.4,
    y: 35.3,
    w: 95.2,
    h: 3.2,
    zIndex: 4,
    text: 'SIZE & SPECIFICATIONS (CM · LITRES · KG)                     SHOWROOM PRICE',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'sans',
    textAlign: 'center',
    color: '#FFD166',
    bgColor: '#0F2942',
  });

  // Spec Rows
  const availTableH = 39.5;
  const rowH = availTableH / Math.max(1, rows.length);
  rows.forEach((r, idx) => {
    const ry = 38.6 + idx * rowH;
    const cleanDim = r.dimensionsCm.replace(' (Exp)', '').replace(' (3 Sizes)', '');
    const cleanVol = r.volumeLitres.replace(' (Exp)', '').replace(' Total', '');
    const cleanWt = r.weightKg.replace(' (Ultra-Light)', '');

    elements.push(
      {
        id: `row-bg-${idx}`,
        type: 'box',
        label: `Row #${idx + 1} Background (${r.shortSize})`,
        x: 2.4,
        y: Number(ry.toFixed(1)),
        w: 95.2,
        h: Number(rowH.toFixed(1)),
        zIndex: 2,
        bgColor: idx % 2 === 0 ? '#FFFFFF' : '#F4F1EA',
        borderColor: '#141413',
        borderWidth: 2,
      },
      {
        id: `row-title-${idx}`,
        type: 'text',
        label: `Row #${idx + 1} Size Name`,
        x: 3.8,
        y: Number((ry + 0.7).toFixed(1)),
        w: 62,
        h: Number((rowH * 0.42).toFixed(1)),
        zIndex: 5,
        text: r.sizeLabel,
        fontSize: 21,
        fontWeight: '900',
        fontFamily: 'sans',
        textAlign: 'left',
        color: '#0F2942',
        bgColor: 'transparent',
      },
      {
        id: `row-specs-${idx}`,
        type: 'text',
        label: `Row #${idx + 1} Technical Specs`,
        x: 3.8,
        y: Number((ry + rowH * 0.46).toFixed(1)),
        w: 62,
        h: Number((rowH * 0.48).toFixed(1)),
        zIndex: 5,
        text: r.promoNote
          ? `${cleanDim} · ${cleanVol} · ${cleanWt}\n★ ${r.promoNote.toUpperCase()}`
          : `${cleanDim}   ·   ${cleanVol}   ·   ${cleanWt}`,
        fontSize: 14,
        fontWeight: '800',
        fontFamily: 'mono',
        textAlign: 'left',
        color: r.promoNote ? '#B81D24' : '#141413',
        bgColor: 'transparent',
      },
      {
        id: `row-price-${idx}`,
        type: 'text',
        label: `Row #${idx + 1} Price Callout`,
        x: 66,
        y: Number((ry + 1.0).toFixed(1)),
        w: 30,
        h: Number((rowH - 2.0).toFixed(1)),
        zIndex: 6,
        text:
          r.regularPriceRs && r.regularPriceRs > r.priceRs
            ? `${formatRs(r.priceRs)}\nWas ${formatRs(r.regularPriceRs)}`
            : r.subPriceBadge
              ? `${formatRs(r.priceRs)}\n${r.subPriceBadge}`
              : formatRs(r.priceRs),
        fontSize: 28,
        fontWeight: '900',
        fontFamily: 'mono',
        textAlign: 'right',
        color: '#B81D24',
        bgColor: 'transparent',
      }
    );
  });

  // Bottom Features & Callout Box
  elements.push(
    {
      id: 'bottom-features-box',
      type: 'box',
      label: 'Bottom Features Box',
      x: 2.4,
      y: 78.8,
      w: 95.2,
      h: 13.0,
      zIndex: 2,
      bgColor: '#FFFDF7',
      borderColor: '#0F2942',
      borderWidth: 2,
      borderRadius: 6,
    },
    {
      id: 'bottom-features-text',
      type: 'text',
      label: 'Construction & Colours Text',
      x: 4.0,
      y: 79.4,
      w: 92.0,
      h: 5.5,
      zIndex: 5,
      text: `✓ ${lineup.material} · ${lineup.wheels}\n✓ ${lineup.lock} · Colours: ${lineup.colours.slice(0, 5).join(', ')}`,
      fontSize: 14,
      fontWeight: '800',
      fontFamily: 'sans',
      textAlign: 'left',
      color: '#141413',
      bgColor: 'transparent',
    },
    {
      id: 'bottom-red-callout',
      type: 'text',
      label: 'Bottom Red Promo Callout',
      x: 4.0,
      y: 85.4,
      w: 92.0,
      h: 5.6,
      zIndex: 6,
      text: lineup.bottomPromoCallout,
      fontSize: 17,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'center',
      color: '#FFFFFF',
      bgColor: '#B81D24',
      borderRadius: 6,
      padding: 6,
    },
    // Footer
    {
      id: 'footer-bg',
      type: 'box',
      label: 'Bottom Showroom Strip',
      x: 1.5,
      y: 92.4,
      w: 97.0,
      h: 6.4,
      zIndex: 3,
      bgColor: '#141413',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    {
      id: 'footer-text',
      type: 'text',
      label: 'Showroom & WhatsApp Text',
      x: 2.5,
      y: 93.0,
      w: 78.0,
      h: 5.4,
      zIndex: 6,
      text: 'PORT-LOUIS · TRIBECA · TRIANON · BAGATELLE · CASCAVELLE · ROSE-BELLE\n3-YR WARRANTY · abdesai.mu · WhatsApp: +230 5979 7960',
      fontSize: 12,
      fontWeight: '800',
      fontFamily: 'sans',
      textAlign: 'center',
      color: '#FFD166',
      bgColor: 'transparent',
    },
    {
      id: 'footer-qr',
      type: 'qr',
      label: 'Order QR Code',
      x: 82.0,
      y: 92.8,
      w: 15.5,
      h: 5.6,
      zIndex: 7,
      qrUrl,
      bgColor: '#FFFFFF',
    }
  );

  return elements;
}

export function buildSingleProductDefaultElements(
  item: AbDesaiATProduct,
  allProducts: AbDesaiATProduct[]
): BuilderElement[] {
  const specs = getProductSpecifications(item, allProducts);
  const colour = extractColourName(item);
  const savings =
    item.regularPriceRs && item.regularPriceRs > item.priceRs
      ? item.regularPriceRs - item.priceRs
      : 0;
  const qrUrl =
    item.permalink ||
    `https://abdesai.mu/product-tag/american-tourister/?s=${encodeURIComponent(
      item.sku || item.series
    )}`;

  const cleanTitle = item.name
    .replace(/^AMERICAN TOURISTER\s+/i, '')
    .replace(/\s*\(\s*Get 1 Cabin[\s\S]*$/i, '')
    .replace(/\s*with Free 950Ml[\s\S]*$/i, '')
    .replace(/\s*\+\s*Free RICO[\s\S]*$/i, '')
    .trim();

  return [
    {
      id: 'frame-border',
      type: 'box',
      label: 'Card Outer Border',
      x: 0.8,
      y: 0.6,
      w: 98.4,
      h: 98.8,
      zIndex: 1,
      bgColor: '#FFFFFF',
      borderColor: '#141413',
      borderWidth: 4,
    },
    {
      id: 'header-bg',
      type: 'box',
      label: 'Top Navy Header Box',
      x: 1.5,
      y: 1.0,
      w: 97.0,
      h: 6.8,
      zIndex: 2,
      bgColor: '#0F2942',
    },
    {
      id: 'header-title',
      type: 'text',
      label: 'Brand Header Title',
      x: 3.2,
      y: 1.6,
      w: 60,
      h: 3.2,
      zIndex: 5,
      text: 'AMERICAN TOURISTER',
      fontSize: 22,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'left',
      color: '#FFFFFF',
      bgColor: 'transparent',
    },
    {
      id: 'header-sub',
      type: 'text',
      label: 'Series & Size Subtitle',
      x: 3.2,
      y: 4.8,
      w: 60,
      h: 2.5,
      zIndex: 5,
      text: `${item.series.toUpperCase()} SERIES · ${specs.sizeClass.toUpperCase()}`,
      fontSize: 14,
      fontWeight: '800',
      fontFamily: 'sans',
      textAlign: 'left',
      color: '#FFD166',
      bgColor: 'transparent',
    },
    {
      id: 'header-right',
      type: 'text',
      label: 'A.B. Desai Tag',
      x: 62,
      y: 2.5,
      w: 34,
      h: 3.5,
      zIndex: 5,
      text: 'A.B. DESAI MAURITIUS',
      fontSize: 14,
      fontWeight: '800',
      fontFamily: 'mono',
      textAlign: 'right',
      color: '#FFFFFF',
      bgColor: 'transparent',
    },
    {
      id: 'promo-headline',
      type: 'text',
      label: 'Red Headline Banner',
      x: 1.5,
      y: 7.8,
      w: 97.0,
      h: 5.4,
      zIndex: 4,
      text:
        savings > 0
          ? `${specs.sizeHeaderBadge} — SAVE ${formatRs(savings)} NOW!`
          : `${item.series.toUpperCase()} ${specs.sizeHeaderBadge} · OFFICIAL SPEC!`,
      fontSize: 20,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'center',
      color: '#FFD166',
      bgColor: '#B81D24',
    },
    {
      id: 'hero-image-box',
      type: 'box',
      label: 'Product Photo Box',
      x: 3.0,
      y: 14.0,
      w: 94.0,
      h: 29.0,
      zIndex: 2,
      bgColor: '#F9F9F8',
      borderColor: '#141413',
      borderWidth: 2,
      borderRadius: 8,
    },
    {
      id: 'hero-product-img',
      type: 'image',
      label: 'Main Suitcase Image',
      x: 6.0,
      y: 15.0,
      w: 88.0,
      h: 27.0,
      zIndex: 5,
      imageSrc: item.image,
      objectFit: 'contain',
    },
    {
      id: 'specs-bar',
      type: 'text',
      label: '3-Column Specs Bar (Size / Vol / Weight)',
      x: 3.0,
      y: 44.0,
      w: 94.0,
      h: 9.5,
      zIndex: 5,
      text: `SIZE: ${specs.dimensionsCm.replace(' (Exp)', '')}   |   VOLUME: ${specs.volumeLitres.replace(' (Exp)', '')}   |   WEIGHT: ${specs.weightKg.replace(' (Ultra-Light)', '')}\n${specs.sizeClass.toUpperCase()} · OFFICIAL AMERICAN TOURISTER SPECIFICATION`,
      fontSize: 16,
      fontWeight: '900',
      fontFamily: 'mono',
      textAlign: 'center',
      color: '#FFFFFF',
      bgColor: '#0F2942',
      borderColor: '#141413',
      borderWidth: 2,
      borderRadius: 6,
      padding: 8,
    },
    {
      id: 'product-title',
      type: 'text',
      label: 'Product Title',
      x: 3.5,
      y: 54.5,
      w: 93.0,
      h: 4.5,
      zIndex: 5,
      text: cleanTitle,
      fontSize: 21,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'left',
      color: '#0F2942',
      bgColor: 'transparent',
    },
    {
      id: 'product-bullets',
      type: 'text',
      label: 'Key Features List',
      x: 3.5,
      y: 59.2,
      w: 93.0,
      h: 8.5,
      zIndex: 5,
      text: `✓ ${specs.material} · ${specs.wheels}\n✓ ${specs.lock} · Colour: ${colour}`,
      fontSize: 15,
      fontWeight: '800',
      fontFamily: 'sans',
      textAlign: 'left',
      color: '#141413',
      bgColor: 'transparent',
    },
    {
      id: 'price-box',
      type: 'box',
      label: 'Bottom Price & Callout Box',
      x: 3.0,
      y: 68.5,
      w: 94.0,
      h: 22.5,
      zIndex: 2,
      bgColor: '#FFFDF7',
      borderColor: '#0F2942',
      borderWidth: 2,
      borderRadius: 8,
    },
    {
      id: 'price-label',
      type: 'text',
      label: 'Retail Price Header Label',
      x: 5.0,
      y: 69.5,
      w: 90.0,
      h: 2.5,
      zIndex: 5,
      text: item.hasPromo
        ? 'SPECIAL PROMO PRICE (INCL. VAT):'
        : 'SHOWROOM RETAIL PRICE (INCL. VAT):',
      fontSize: 12,
      fontWeight: '800',
      fontFamily: 'sans',
      textAlign: 'left',
      color: '#65645E',
      bgColor: 'transparent',
    },
    {
      id: 'price-main',
      type: 'text',
      label: 'Main Price Callout',
      x: 5.0,
      y: 72.0,
      w: 90.0,
      h: 7.5,
      zIndex: 6,
      text:
        item.regularPriceRs && item.regularPriceRs > item.priceRs
          ? `${formatRs(item.priceRs)}   (Was ${formatRs(item.regularPriceRs)})`
          : formatRs(item.priceRs),
      fontSize: 38,
      fontWeight: '900',
      fontFamily: 'mono',
      textAlign: 'left',
      color: '#B81D24',
      bgColor: 'transparent',
    },
    {
      id: 'save-banner',
      type: 'text',
      label: 'Red Savings / Spec Banner',
      x: 5.0,
      y: 80.2,
      w: 90.0,
      h: 5.6,
      zIndex: 6,
      text:
        savings > 0
          ? `YOU SAVE ${formatRs(savings)} TODAY!`
          : `${specs.sizeClass.toUpperCase()}: ${specs.dimensionsCm} · ${specs.volumeLitres} · ${specs.weightKg}`,
      fontSize: 18,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'center',
      color: '#FFFFFF',
      bgColor: item.hasPromo ? '#B81D24' : '#0F2942',
      borderRadius: 6,
    },
    {
      id: 'urgency-subtext',
      type: 'text',
      label: 'Delivery & Confirmation Note',
      x: 5.0,
      y: 86.8,
      w: 90.0,
      h: 3.2,
      zIndex: 6,
      text: 'CONFIRM AVAILABILITY BEFORE PAYMENT · HOME DELIVERY UP TO 10 DAYS',
      fontSize: 11,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'center',
      color: '#141413',
      bgColor: 'transparent',
    },
    {
      id: 'footer-bg',
      type: 'box',
      label: 'Bottom Showroom Strip',
      x: 1.5,
      y: 92.4,
      w: 97.0,
      h: 6.4,
      zIndex: 3,
      bgColor: '#141413',
    },
    {
      id: 'footer-text',
      type: 'text',
      label: 'Showroom & WhatsApp Text',
      x: 2.5,
      y: 93.0,
      w: 78.0,
      h: 5.4,
      zIndex: 6,
      text: 'PORT-LOUIS · TRIBECA · TRIANON · BAGATELLE · CASCAVELLE · ROSE-BELLE\n3-YR WARRANTY · abdesai.mu · WhatsApp: +230 5979 7960',
      fontSize: 12,
      fontWeight: '800',
      fontFamily: 'sans',
      textAlign: 'center',
      color: '#FFD166',
      bgColor: 'transparent',
    },
    {
      id: 'footer-qr',
      type: 'qr',
      label: 'Order QR Code',
      x: 82.0,
      y: 92.8,
      w: 15.5,
      h: 5.6,
      zIndex: 7,
      qrUrl,
      bgColor: '#FFFFFF',
    },
  ];
}

export const CustomTemplateBuilder: React.FC<CustomTemplateBuilderProps> = ({
  products,
  initialSeries = 'Bricklane',
  initialProductId,
}) => {
  const [importMode, setImportMode] = useState<'series' | 'product'>(
    initialProductId ? 'product' : 'series'
  );
  const [selectedSeries, setSelectedSeries] = useState<string>(initialSeries);
  const [selectedProductId, setSelectedProductId] = useState<number>(
    initialProductId || products[0]?.id || 22450
  );

  const getStorageKey = (mode: 'series' | 'product', sName: string, pId: number) =>
    mode === 'series'
      ? `abdesai_custom_talker_series_${sName}`
      : `abdesai_custom_talker_product_${pId}`;

  const loadInitialElements = (
    mode: 'series' | 'product',
    sName: string,
    pId: number
  ): { els: BuilderElement[]; lockedDone: boolean } => {
    try {
      const savedRaw = localStorage.getItem(getStorageKey(mode, sName, pId));
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed.elements) && parsed.elements.length > 0) {
          return {
            els: parsed.elements,
            lockedDone: Boolean(parsed.isCanvasLocked),
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    if (mode === 'product') {
      const prod = products.find((p) => p.id === pId) || products[0];
      if (prod) {
        return {
          els: buildSingleProductDefaultElements(prod, products),
          lockedDone: false,
        };
      }
    }
    return {
      els: buildSeriesDefaultElements(sName, products),
      lockedDone: false,
    };
  };

  const initialLoad = loadInitialElements(
    initialProductId ? 'product' : 'series',
    initialSeries,
    initialProductId || products[0]?.id || 22450
  );

  const [elements, setElements] = useState<BuilderElement[]>(initialLoad.els);
  const [isCanvasLocked, setIsCanvasLocked] = useState<boolean>(
    initialLoad.lockedDone
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLoad.lockedDone ? null : 'header-title'
  );
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [printFormat, setPrintFormat] = useState<'1xA4' | '4xA6'>('1xA4');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [qrDataMap, setQrDataMap] = useState<Record<string, string>>({});

  // Persist custom layout and locked status automatically
  useEffect(() => {
    try {
      const key = getStorageKey(importMode, selectedSeries, selectedProductId);
      localStorage.setItem(
        key,
        JSON.stringify({ elements, isCanvasLocked, updatedAt: Date.now() })
      );
    } catch {
      // ignore quota errors
    }
  }, [elements, isCanvasLocked, importMode, selectedSeries, selectedProductId]);

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Drag / Resize tracking ref
  const interactionRef = useRef<{
    mode: 'drag' | 'resize';
    handle?: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
    id: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  // Generate QR codes for any qr elements
  useEffect(() => {
    elements.forEach((el) => {
      if (el.type === 'qr' && el.qrUrl && !qrDataMap[el.qrUrl]) {
        generateQrDataUrl(el.qrUrl).then((url) => {
          if (url) {
            setQrDataMap((prev) => ({ ...prev, [el.qrUrl!]: url }));
          }
        });
      }
    });
  }, [elements, qrDataMap]);

  const availableSeries = React.useMemo(() => {
    const present = new Set(
      products.filter((p) => p.priceRs > 0).map((p) => p.series)
    );
    return ALL_DISPLAY_SERIES_ORDER.filter((s) => present.has(s));
  }, [products]);

  const handleImportSeries = (seriesName: string, forceReset = false) => {
    setSelectedSeries(seriesName);
    setImportMode('series');
    if (!forceReset) {
      const loaded = loadInitialElements('series', seriesName, selectedProductId);
      setElements(loaded.els);
      setIsCanvasLocked(loaded.lockedDone);
      setSelectedId(loaded.lockedDone ? null : 'header-title');
      return;
    }
    try {
      localStorage.removeItem(
        getStorageKey('series', seriesName, selectedProductId)
      );
    } catch {
      // ignore
    }
    const next = buildSeriesDefaultElements(seriesName, products);
    setElements(next);
    setIsCanvasLocked(false);
    setSelectedId('header-title');
  };

  const handleImportProduct = (prodId: number, forceReset = false) => {
    setSelectedProductId(prodId);
    setImportMode('product');
    if (!forceReset) {
      const loaded = loadInitialElements('product', selectedSeries, prodId);
      setElements(loaded.els);
      setIsCanvasLocked(loaded.lockedDone);
      setSelectedId(loaded.lockedDone ? null : 'product-title');
      return;
    }
    try {
      localStorage.removeItem(getStorageKey('product', selectedSeries, prodId));
    } catch {
      // ignore
    }
    const prod = products.find((p) => p.id === prodId) || products[0];
    if (prod) {
      const next = buildSingleProductDefaultElements(prod, products);
      setElements(next);
      setIsCanvasLocked(false);
      setSelectedId('product-title');
    }
  };

  const handleLockAllAsDone = () => {
    setIsCanvasLocked(true);
    setSelectedId(null);
    interactionRef.current = null;
  };

  const handleUnlockToEdit = () => {
    setIsCanvasLocked(false);
  };

  const selectedElement = elements.find((e) => e.id === selectedId) || null;

  const updateElement = (id: string, patch: Partial<BuilderElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...patch } : el))
    );
  };

  // Pointer Move / Up handlers for smooth dragging & resizing
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isCanvasLocked) return;
      const act = interactionRef.current;
      const container = canvasContainerRef.current;
      if (!act || !container) return;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = ((e.clientX - act.startClientX) / rect.width) * 100;
      const dyPct = ((e.clientY - act.startClientY) / rect.height) * 100;

      const snap = (val: number) =>
        snapToGrid ? Math.round(val * 2) / 2 : Number(val.toFixed(2));

      if (act.mode === 'drag') {
        const nextX = Math.max(-20, Math.min(98, snap(act.startX + dxPct)));
        const nextY = Math.max(-20, Math.min(98, snap(act.startY + dyPct)));
        updateElement(act.id, { x: nextX, y: nextY });
      } else if (act.mode === 'resize') {
        const h = act.handle || 'se';
        let newX = act.startX;
        let newY = act.startY;
        let newW = act.startW;
        let newH = act.startH;

        if (h.includes('e')) {
          newW = Math.max(3, Math.min(100 - newX, snap(act.startW + dxPct)));
        }
        if (h.includes('s')) {
          newH = Math.max(2, Math.min(100 - newY, snap(act.startH + dyPct)));
        }
        if (h.includes('w')) {
          const proposedX = snap(act.startX + dxPct);
          const proposedW = snap(act.startW - dxPct);
          if (proposedW >= 3) {
            newX = proposedX;
            newW = proposedW;
          }
        }
        if (h.includes('n')) {
          const proposedY = snap(act.startY + dyPct);
          const proposedH = snap(act.startH - dyPct);
          if (proposedH >= 2) {
            newY = proposedY;
            newH = proposedH;
          }
        }
        updateElement(act.id, { x: newX, y: newY, w: newW, h: newH });
      }
    };

    const handlePointerUp = () => {
      interactionRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [snapToGrid, isCanvasLocked]);

  const startDrag = (e: React.PointerEvent, el: BuilderElement) => {
    if (isCanvasLocked) return;
    e.stopPropagation();
    setSelectedId(el.id);
    if (el.locked) return;
    interactionRef.current = {
      mode: 'drag',
      id: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: el.x,
      startY: el.y,
      startW: el.w,
      startH: el.h,
    };
  };

  const startResize = (
    e: React.PointerEvent,
    el: BuilderElement,
    handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  ) => {
    if (isCanvasLocked || el.locked) return;
    e.stopPropagation();
    setSelectedId(el.id);
    interactionRef.current = {
      mode: 'resize',
      handle,
      id: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: el.x,
      startY: el.y,
      startW: el.w,
      startH: el.h,
    };
  };

  const handleAddTextBlock = () => {
    const newId = `custom-text-${Date.now()}`;
    const newEl: BuilderElement = {
      id: newId,
      type: 'text',
      label: 'Custom Text Block',
      x: 15,
      y: 42,
      w: 70,
      h: 7,
      zIndex: 10,
      text: 'NEW PROMO TEXT · EDIT OR DRAG ME',
      fontSize: 22,
      fontWeight: '900',
      fontFamily: 'sans',
      textAlign: 'center',
      color: '#FFFFFF',
      bgColor: '#B81D24',
      borderRadius: 6,
      padding: 6,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newId);
  };

  const handleAddImageBlock = (src: string, label = 'Custom Image') => {
    const newId = `custom-img-${Date.now()}`;
    const newEl: BuilderElement = {
      id: newId,
      type: 'image',
      label,
      x: 25,
      y: 25,
      w: 50,
      h: 25,
      zIndex: 9,
      imageSrc: src,
      objectFit: 'contain',
      bgColor: 'transparent',
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newId);
  };

  const handleUploadCustomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (selectedElement && selectedElement.type === 'image') {
          updateElement(selectedElement.id, { imageSrc: reader.result });
        } else {
          handleAddImageBlock(reader.result, file.name);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDuplicateSelected = () => {
    if (!selectedElement) return;
    const newId = `${selectedElement.id}-copy-${Date.now()}`;
    const copy: BuilderElement = {
      ...selectedElement,
      id: newId,
      label: `${selectedElement.label} (Copy)`,
      x: Math.min(90, selectedElement.x + 3),
      y: Math.min(90, selectedElement.y + 3),
      zIndex: selectedElement.zIndex + 1,
    };
    setElements((prev) => [...prev, copy]);
    setSelectedId(newId);
  };

  const handleDeleteSelected = () => {
    if (!selectedElement) return;
    setElements((prev) => prev.filter((e) => e.id !== selectedElement.id));
    setSelectedId(null);
  };

  // High-res 300 DPI Canvas Renderer for Custom Template
  const renderCustomCardToCanvasRegion = async (
    ctx: CanvasRenderingContext2D,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ) => {
    const scaleFactor = rw / 620; // Our interactive canvas reference width is 620px
    ctx.save();
    ctx.translate(rx, ry);

    // Base white card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rw, rh);

    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sorted) {
      const bx = (el.x / 100) * rw;
      const by = (el.y / 100) * rh;
      const bw = (el.w / 100) * rw;
      const bh = (el.h / 100) * rh;

      ctx.save();

      // Background fill & border
      if (el.bgColor && el.bgColor !== 'transparent') {
        ctx.fillStyle = el.bgColor;
        if (el.borderRadius && el.borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, el.borderRadius * scaleFactor);
          ctx.fill();
        } else {
          ctx.fillRect(bx, by, bw, bh);
        }
      }

      if (
        el.borderWidth &&
        el.borderWidth > 0 &&
        el.borderColor &&
        el.borderColor !== 'transparent'
      ) {
        ctx.strokeStyle = el.borderColor;
        ctx.lineWidth = el.borderWidth * scaleFactor;
        if (el.borderRadius && el.borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, el.borderRadius * scaleFactor);
          ctx.stroke();
        } else {
          ctx.strokeRect(bx, by, bw, bh);
        }
      }

      if (el.type === 'image' && el.imageSrc) {
        const img = await loadCorsSafeCanvasImage(el.imageSrc);
        if (img) {
          const pad = (el.padding || 2) * scaleFactor;
          const availW = Math.max(4, bw - pad * 2);
          const availH = Math.max(4, bh - pad * 2);
          const iw = img.naturalWidth || img.width || 1;
          const ih = img.naturalHeight || img.height || 1;
          const ratio =
            el.objectFit === 'cover'
              ? Math.max(availW / iw, availH / ih)
              : Math.min(availW / iw, availH / ih);
          const dw = iw * ratio;
          const dh = ih * ratio;
          const dx = bx + (bw - dw) / 2;
          const dy = by + (bh - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
        }
      } else if (el.type === 'qr' && el.qrUrl) {
        const dataUrl = await generateQrDataUrl(el.qrUrl);
        if (dataUrl) {
          const qrImg = await loadCorsSafeCanvasImage(dataUrl);
          if (qrImg) {
            const qSize = Math.min(bw * 0.44, bh - 6 * scaleFactor);
            ctx.drawImage(
              qrImg,
              bx + 4 * scaleFactor,
              by + (bh - qSize) / 2,
              qSize,
              qSize
            );
            ctx.fillStyle = '#0F2942';
            ctx.font = `900 ${Math.round(10 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(
              'SCAN QR',
              bx + qSize + 8 * scaleFactor,
              by + bh * 0.42
            );
            ctx.fillStyle = '#B81D24';
            ctx.font = `900 ${Math.round(9 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillText(
              'TO ORDER',
              bx + qSize + 8 * scaleFactor,
              by + bh * 0.76
            );
          }
        }
      } else if (el.type === 'text' && el.text) {
        const fontFam =
          el.fontFamily === 'mono'
            ? '"JetBrains Mono", monospace'
            : el.fontFamily === 'display'
              ? '"Space Grotesk", sans-serif'
              : '"Plus Jakarta Sans", sans-serif';
        const px = Math.max(8, (el.fontSize || 16) * scaleFactor);
        ctx.font = `${el.fontWeight || '800'} ${Math.round(px)}px ${fontFam}`;
        ctx.fillStyle = el.color || '#141413';
        ctx.textBaseline = 'middle';

        const lines = el.text.split('\n');
        const lineHeight = px * 1.22;
        const totalTextH = lines.length * lineHeight;
        const startY = by + (bh - totalTextH) / 2 + lineHeight / 2;
        const padX = (el.padding || 6) * scaleFactor;

        lines.forEach((line, lIdx) => {
          let tx = bx + padX;
          if (el.textAlign === 'center') {
            ctx.textAlign = 'center';
            tx = bx + bw / 2;
          } else if (el.textAlign === 'right') {
            ctx.textAlign = 'right';
            tx = bx + bw - padX;
          } else {
            ctx.textAlign = 'left';
            tx = bx + padX;
          }
          ctx.fillText(line, tx, startY + lIdx * lineHeight, bw - padX * 2);
        });
      }

      ctx.restore();
    }

    ctx.restore();
  };

  const handleDownloadCustomPng = async (mode: 'single' | '4up-a4') => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      if (mode === 'single') {
        canvas.width = 1240;
        canvas.height = 1754;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await renderCustomCardToCanvasRegion(ctx, 0, 0, 1240, 1754);
      } else {
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
        for (const pos of positions) {
          await renderCustomCardToCanvasRegion(ctx, pos.x, pos.y, 1200, 1714);
        }
        // Dashed cut lines
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
          a.download = `custom-shelf-talker-${
            importMode === 'series' ? selectedSeries.toLowerCase() : selectedProductId
          }-${mode}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        },
        'image/png',
        0.98
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Render a non-interactive replica of the custom card for the 4xA6 print sheet
  const renderStaticCardPreview = (scaleFactor: number) => {
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    return (
      <div className="relative w-full h-full bg-white overflow-hidden select-none">
        {sorted.map((el) => {
          const fontFamClass =
            el.fontFamily === 'mono'
              ? 'font-mono-tabular'
              : el.fontFamily === 'display'
                ? 'font-display'
                : 'font-sans';
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.w}%`,
                height: `${el.h}%`,
                zIndex: el.zIndex,
                backgroundColor: el.bgColor || 'transparent',
                borderColor: el.borderColor || 'transparent',
                borderWidth: el.borderWidth ? `${el.borderWidth * scaleFactor}px` : 0,
                borderStyle: el.borderWidth ? 'solid' : 'none',
                borderRadius: el.borderRadius
                  ? `${el.borderRadius * scaleFactor}px`
                  : 0,
                color: el.color || '#141413',
                fontSize: el.fontSize ? `${el.fontSize * scaleFactor}px` : undefined,
                fontWeight: el.fontWeight || '800',
                textAlign: el.textAlign || 'left',
                padding: el.padding ? `${el.padding * scaleFactor}px` : '2px',
              }}
              className={`flex flex-col justify-center overflow-hidden ${fontFamClass}`}
            >
              {el.type === 'text' && (
                <div className="whitespace-pre-line leading-tight w-full">
                  {el.text}
                </div>
              )}
              {el.type === 'image' && el.imageSrc && (
                <ProductImage
                  src={el.imageSrc}
                  alt={el.label}
                  series={selectedSeries}
                  title={el.label}
                  eager
                  useProxy
                  className={`w-full h-full ${
                    el.objectFit === 'cover' ? 'object-cover' : 'object-contain'
                  }`}
                />
              )}
              {el.type === 'qr' && el.qrUrl && qrDataMap[el.qrUrl] && (
                <div className="flex items-center gap-1 w-full h-full px-1">
                  <img
                    src={qrDataMap[el.qrUrl]}
                    alt="QR"
                    className="h-[88%] object-contain"
                  />
                  <div className="leading-none text-left">
                    <div
                      style={{ fontSize: `${9 * scaleFactor}px` }}
                      className="font-black text-[#0F2942]"
                    >
                      SCAN QR
                    </div>
                    <div
                      style={{ fontSize: `${8 * scaleFactor}px` }}
                      className="font-extrabold text-[#B81D24]"
                    >
                      TO ORDER
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* HIDDEN FILE INPUT FOR CUSTOM IMAGE UPLOAD */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadCustomImage}
        className="hidden"
      />

      {/* TOP IMPORT & PRESET BAR (Hidden when printing) */}
      <div className="no-print bg-white border border-black/12 rounded-xl p-4 mb-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#B81D24]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Drag, Resize & Placement Studio</span>
            </div>
            <h3 className="font-display text-lg font-bold text-[#141413]">
              Import Any Series or Suitcase — Drag & Resize Images, Prices & Text Freely
            </h3>
            <p className="text-xs text-[#65645E]">
              Click any suitcase photo, price tag, specification row, or banner on the canvas to drag it anywhere, pull its corner handles to resize, or adjust font size & colours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCanvasLocked ? (
              <button
                type="button"
                onClick={handleUnlockToEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-[#FFD166] text-[#141413] border-2 border-[#141413] rounded-lg hover:bg-[#f5c44f] cursor-pointer shadow-xs"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Template to Edit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLockAllAsDone}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-[#141413] text-[#FFD166] border-2 border-[#FFD166] rounded-lg hover:bg-[#2a2a28] cursor-pointer shadow-xs"
              >
                <Lock className="w-4 h-4" />
                <span>Lock & Mark as Done</span>
              </button>
            )}

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleDownloadCustomPng('single')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting ? 'Saving PNG...' : 'Download Custom Card (PNG)'}
              </span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleDownloadCustomPng('4up-a4')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Download 4×A6 Sheet (PNG)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#B81D24] text-white rounded-lg hover:bg-[#96151B] cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Custom Template</span>
            </button>
          </div>
        </div>

        {/* Locked Done Status Banner */}
        {isCanvasLocked && (
          <div className="bg-[#1B5E3A]/10 border-2 border-[#1B5E3A] rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B5E3A]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                TEMPLATE LOCKED AS DONE — All images, prices, and text placements are locked in place and saved. Ready to Print or Download PNG!
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnlockToEdit}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-white text-[#141413] border border-black/20 rounded-md hover:bg-[#EFECE6] cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              <span>Unlock to Make Changes</span>
            </button>
          </div>
        )}

        {/* Step 1: Choose what to import into the canvas */}
        <div className="pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#0F2942]">
              1. Import All Data From:
            </span>
            <div className="inline-flex p-0.5 bg-[#EFECE6] rounded-lg">
              <button
                type="button"
                onClick={() => handleImportSeries(selectedSeries)}
                className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  importMode === 'series'
                    ? 'bg-[#0F2942] text-white'
                    : 'text-[#65645E] hover:text-[#141413]'
                }`}
              >
                Whole Series Lineup
              </button>
              <button
                type="button"
                onClick={() => handleImportProduct(selectedProductId)}
                className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  importMode === 'product'
                    ? 'bg-[#0F2942] text-white'
                    : 'text-[#65645E] hover:text-[#141413]'
                }`}
              >
                Single Suitcase / Promo
              </button>
            </div>

            {importMode === 'series' ? (
              <select
                value={selectedSeries}
                onChange={(e) => handleImportSeries(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-[#F9F9F8] border border-[#0F2942]/30 rounded-lg text-[#141413]"
              >
                {availableSeries.map((s) => (
                  <option key={s} value={s}>
                    {s} Series (All Sizes, Images & Prices)
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => handleImportProduct(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold bg-[#F9F9F8] border border-[#0F2942]/30 rounded-lg text-[#141413] max-w-xs sm:max-w-md truncate"
              >
                {products
                  .filter((p) => p.priceRs > 0)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.series} — {p.name.replace(/^AMERICAN TOURISTER\s+/i, '')} ({formatRs(p.priceRs)})
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Quick Add & Canvas Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            {!isCanvasLocked && (
              <>
                <button
                  type="button"
                  onClick={handleAddTextBlock}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[#FFD166] text-[#141413] border border-black/20 rounded-lg hover:bg-[#f5c44f] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <Type className="w-3.5 h-3.5" />
                  <span>Add Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white text-[#0F2942] border border-[#0F2942]/30 rounded-lg hover:bg-[#EFECE6] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload / Replace Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGridLines((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border rounded-lg cursor-pointer ${
                    showGridLines
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : 'bg-white text-[#65645E] border-black/15'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Guides</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapToGrid((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border rounded-lg cursor-pointer ${
                    snapToGrid
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : 'bg-white text-[#65645E] border-black/15'
                  }`}
                >
                  <span>Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() =>
                importMode === 'series'
                  ? handleImportSeries(selectedSeries, true)
                  : handleImportProduct(selectedProductId, true)
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white text-[#B81D24] border border-[#B81D24]/30 rounded-lg hover:bg-[#B81D24]/5 cursor-pointer"
              title="Reset layout to default positions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Layout</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE: LEFT INTERACTIVE CANVAS + RIGHT INSPECTOR PANEL */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: INTERACTIVE DRAG & RESIZE CANVAS */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[620px] mb-2 flex items-center justify-between text-xs text-[#65645E] px-1">
            {isCanvasLocked ? (
              <span className="font-bold text-[#1B5E3A] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Locked Final Preview — Nothing will move accidentally
              </span>
            ) : (
              <span className="font-semibold text-[#0F2942] flex items-center gap-1">
                <Move className="w-3.5 h-3.5" />
                Drag any item to move · Drag blue corner handles to resize
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span>Print Sheet Mode:</span>
              <button
                type="button"
                onClick={() => setPrintFormat('1xA4')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  printFormat === '1xA4'
                    ? 'bg-[#0F2942] text-white'
                    : 'bg-white border border-black/15 text-[#141413]'
                }`}
              >
                1 Full A4
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('4xA6')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  printFormat === '4xA6'
                    ? 'bg-[#0F2942] text-white'
                    : 'bg-white border border-black/15 text-[#141413]'
                }`}
              >
                4×A6 on A4
              </button>
            </div>
          </div>

          {/* 620 x 877 (Exact A4/A6 1 : 1.4142 aspect ratio) Interactive Canvas */}
          <div
            ref={canvasContainerRef}
            onPointerDown={() => setSelectedId(null)}
            className={`relative w-full max-w-[620px] aspect-[1/1.4142] bg-white shadow-2xl border-2 overflow-hidden select-none touch-none ${
              isCanvasLocked ? 'border-[#1B5E3A]' : 'border-[#0F2942]'
            }`}
            style={
              !isCanvasLocked && showGridLines
                ? {
                    backgroundImage:
                      'linear-gradient(to right, rgba(15,41,66,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,41,66,0.06) 1px, transparent 1px)',
                    backgroundSize: '5% 5%',
                  }
                : undefined
            }
          >
            {[...elements]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => {
                const isSelected = !isCanvasLocked && el.id === selectedId;
                const fontFamClass =
                  el.fontFamily === 'mono'
                    ? 'font-mono-tabular'
                    : el.fontFamily === 'display'
                      ? 'font-display'
                      : 'font-sans';

                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => startDrag(e, el)}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.w}%`,
                      height: `${el.h}%`,
                      zIndex: el.zIndex,
                      backgroundColor: el.bgColor || 'transparent',
                      borderColor: el.borderColor || 'transparent',
                      borderWidth: el.borderWidth ? `${el.borderWidth}px` : 0,
                      borderStyle: el.borderWidth ? 'solid' : 'none',
                      borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                      color: el.color || '#141413',
                      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                      fontWeight: el.fontWeight || '800',
                      textAlign: el.textAlign || 'left',
                      padding: el.padding ? `${el.padding}px` : '2px',
                    }}
                    className={`group flex flex-col justify-center transition-shadow ${fontFamClass} ${
                      isCanvasLocked
                        ? 'cursor-default'
                        : el.locked
                          ? 'cursor-not-allowed'
                          : 'cursor-move'
                    } ${
                      isSelected
                        ? el.locked
                          ? 'ring-2 ring-[#B81D24] shadow-lg'
                          : 'ring-2 ring-[#2563EB] shadow-lg'
                        : !isCanvasLocked
                          ? 'hover:ring-1 hover:ring-[#2563EB]/60'
                          : ''
                    }`}
                  >
                    {/* Element Content */}
                    {el.type === 'text' && (
                      <div className="whitespace-pre-line leading-tight w-full overflow-hidden pointer-events-none">
                        {el.text}
                      </div>
                    )}

                    {el.type === 'image' && el.imageSrc && (
                      <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
                        <ProductImage
                          src={el.imageSrc}
                          alt={el.label}
                          series={selectedSeries}
                          title={el.label}
                          eager
                          useProxy
                          className={`w-full h-full ${
                            el.objectFit === 'cover'
                              ? 'object-cover'
                              : 'object-contain'
                          }`}
                        />
                      </div>
                    )}

                    {el.type === 'qr' && el.qrUrl && (
                      <div className="w-full h-full flex items-center gap-1 px-1 pointer-events-none">
                        {qrDataMap[el.qrUrl] ? (
                          <img
                            src={qrDataMap[el.qrUrl]}
                            alt="QR Code"
                            className="h-[88%] object-contain"
                          />
                        ) : (
                          <QrCode className="w-6 h-6 text-[#0F2942]" />
                        )}
                        <div className="leading-none text-left">
                          <div className="text-[9px] font-black text-[#0F2942]">
                            SCAN QR
                          </div>
                          <div className="text-[8px] font-extrabold text-[#B81D24] mt-0.5">
                            TO ORDER
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Floating Label Pill & 8 Resize Handles when selected */}
                    {isSelected && (
                      <>
                        <div
                          className={`absolute -top-5 left-0 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-t whitespace-nowrap pointer-events-none shadow-xs ${
                            el.locked ? 'bg-[#B81D24]' : 'bg-[#2563EB]'
                          }`}
                        >
                          {el.locked ? '🔒 LOCKED · ' : ''}
                          {el.label} ({Math.round(el.w)}% × {Math.round(el.h)}%)
                        </div>

                        {!el.locked && (
                          <>
                            {/* Corner Handles */}
                            <div
                              onPointerDown={(e) => startResize(e, el, 'nw')}
                              className="w-3 h-3 bg-white border-2 border-[#2563EB] rounded-full absolute -top-1.5 -left-1.5 cursor-nwse-resize z-30"
                            />
                            <div
                              onPointerDown={(e) => startResize(e, el, 'ne')}
                              className="w-3 h-3 bg-white border-2 border-[#2563EB] rounded-full absolute -top-1.5 -right-1.5 cursor-nesw-resize z-30"
                            />
                            <div
                              onPointerDown={(e) => startResize(e, el, 'sw')}
                              className="w-3 h-3 bg-white border-2 border-[#2563EB] rounded-full absolute -bottom-1.5 -left-1.5 cursor-nesw-resize z-30"
                            />
                            <div
                              onPointerDown={(e) => startResize(e, el, 'se')}
                              className="w-3 h-3 bg-white border-2 border-[#2563EB] rounded-full absolute -bottom-1.5 -right-1.5 cursor-nwse-resize z-30"
                            />

                            {/* Side Handles */}
                            <div
                              onPointerDown={(e) => startResize(e, el, 'n')}
                              className="w-4 h-2 bg-[#2563EB] rounded absolute -top-1 left-1/2 -translate-x-1/2 cursor-ns-resize z-30"
                            />
                            <div
                              onPointerDown={(e) => startResize(e, el, 's')}
                              className="w-4 h-2 bg-[#2563EB] rounded absolute -bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize z-30"
                            />
                            <div
                              onPointerDown={(e) => startResize(e, el, 'w')}
                              className="w-2 h-4 bg-[#2563EB] rounded absolute top-1/2 -translate-y-1/2 -left-1 cursor-ew-resize z-30"
                            />
                            <div
                              onPointerDown={(e) => startResize(e, el, 'e')}
                              className="w-2 h-4 bg-[#2563EB] rounded absolute top-1/2 -translate-y-1/2 -right-1 cursor-ew-resize z-30"
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* RIGHT 5 COLS: ELEMENT INSPECTOR & CATALOG IMAGE SWATCHES */}
        <div className="lg:col-span-5 space-y-4">
          {isCanvasLocked ? (
            <div className="bg-white border-2 border-[#1B5E3A] rounded-xl p-6 shadow-xs space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1B5E3A]/15 text-[#1B5E3A] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#1B5E3A] text-white rounded-full">
                  Locked & Saved as Done
                </span>
                <h4 className="font-display text-lg font-bold text-[#141413]">
                  Your Custom Shelf Talker is Finalized!
                </h4>
                <p className="text-xs text-[#65645E]">
                  All suitcase photos, specifications, prices, and banners are locked in place so nothing shifts while printing or downloading.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadCustomPng('single')}
                  className="w-full py-2.5 px-4 text-xs font-extrabold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isExporting
                      ? 'Generating 300-DPI PNG...'
                      : 'Download Final Card (300-DPI PNG)'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadCustomPng('4up-a4')}
                  className="w-full py-2.5 px-4 text-xs font-extrabold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download 4×A6 Sheet on 1 A4 Page (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2.5 px-4 text-xs font-extrabold bg-[#B81D24] text-white rounded-lg hover:bg-[#96151B] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Finalized Shelf Talker</span>
                </button>
              </div>

              <div className="pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={handleUnlockToEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#FFD166] text-[#141413] border border-black/25 rounded-lg hover:bg-[#f5c44f] cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Template to Adjust Sizes or Placement</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Lock & Finish Callout Bar */}
              <div className="bg-[#0F2942] text-white rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="text-xs font-extrabold text-[#FFD166] uppercase">
                    Finished adjusting sizes & placement?
                  </div>
                  <div className="text-[11px] text-white/90">
                    Lock everything in place so nothing moves accidentally.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLockAllAsDone}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold bg-[#FFD166] text-[#141413] rounded-lg hover:bg-[#f5c44f] shrink-0 cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock as Done</span>
                </button>
              </div>

              {/* Selected Element Controls */}
              <div className="bg-white border border-black/12 rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B81D24]">
                      Selected Element Inspector
                    </span>
                    <h4 className="font-display text-sm font-bold text-[#141413]">
                      {selectedElement
                        ? selectedElement.label
                        : 'Click any image, price, or text on the canvas'}
                    </h4>
                  </div>

                  {selectedElement && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            locked: !selectedElement.locked,
                          })
                        }
                        className={`px-2 py-1 text-[10px] font-bold flex items-center gap-1 rounded border cursor-pointer ${
                          selectedElement.locked
                            ? 'bg-[#B81D24] text-white border-[#B81D24]'
                            : 'bg-[#F9F9F8] hover:bg-[#EFECE6] text-[#141413] border-black/15'
                        }`}
                        title={
                          selectedElement.locked
                            ? 'Unlock this item'
                            : 'Lock this item in place'
                        }
                      >
                        {selectedElement.locked ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Lock Item</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            zIndex: selectedElement.zIndex + 1,
                          })
                        }
                        className="p-1.5 text-xs bg-[#F9F9F8] hover:bg-[#EFECE6] border border-black/15 rounded cursor-pointer"
                        title="Bring Forward"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            zIndex: Math.max(1, selectedElement.zIndex - 1),
                          })
                        }
                        className="p-1.5 text-xs bg-[#F9F9F8] hover:bg-[#EFECE6] border border-black/15 rounded cursor-pointer"
                        title="Send Backward"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDuplicateSelected}
                        className="p-1.5 text-xs bg-[#F9F9F8] hover:bg-[#EFECE6] border border-black/15 rounded cursor-pointer"
                        title="Duplicate Element"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="p-1.5 text-xs bg-[#B81D24]/10 hover:bg-[#B81D24] text-[#B81D24] hover:text-white border border-[#B81D24]/30 rounded cursor-pointer"
                        title="Delete Element"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

            {selectedElement ? (
              <div className="space-y-3.5">
                {/* Position & Size Sliders / Inputs */}
                <div className="grid grid-cols-4 gap-2 bg-[#F9F9F8] p-2.5 rounded-lg border border-black/8">
                  <div>
                    <label className="block text-[10px] font-bold text-[#65645E]">
                      Left X (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedElement.x}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          x: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-mono-tabular font-bold bg-white border border-black/15 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#65645E]">
                      Top Y (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedElement.y}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          y: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-mono-tabular font-bold bg-white border border-black/15 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#0F2942]">
                      Width (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedElement.w}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          w: Math.max(2, Number(e.target.value)),
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-mono-tabular font-bold bg-white border border-[#0F2942]/30 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#0F2942]">
                      Height (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedElement.h}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          h: Math.max(2, Number(e.target.value)),
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-mono-tabular font-bold bg-white border border-[#0F2942]/30 rounded mt-0.5"
                    />
                  </div>
                </div>

                {/* TEXT SPECIFIC CONTROLS */}
                {selectedElement.type === 'text' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#141413] mb-1">
                        Text Content (Supports multi-line Enter)
                      </label>
                      <textarea
                        rows={2}
                        value={selectedElement.text || ''}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            text: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-semibold bg-[#F9F9F8] border border-black/20 rounded-lg focus:outline-none focus:border-[#0F2942]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0F2942] mb-1">
                          Font Size: {selectedElement.fontSize || 16}px
                        </label>
                        <input
                          type="range"
                          min={9}
                          max={64}
                          value={selectedElement.fontSize || 16}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              fontSize: Number(e.target.value),
                            })
                          }
                          className="w-full accent-[#0F2942] cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#141413] mb-1">
                          Alignment & Font Style
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, {
                                textAlign: 'left',
                              })
                            }
                            className={`p-1.5 rounded border cursor-pointer ${
                              selectedElement.textAlign === 'left'
                                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                : 'bg-white text-[#65645E] border-black/15'
                            }`}
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, {
                                textAlign: 'center',
                              })
                            }
                            className={`p-1.5 rounded border cursor-pointer ${
                              selectedElement.textAlign === 'center'
                                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                : 'bg-white text-[#65645E] border-black/15'
                            }`}
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, {
                                textAlign: 'right',
                              })
                            }
                            className={`p-1.5 rounded border cursor-pointer ${
                              selectedElement.textAlign === 'right'
                                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                : 'bg-white text-[#65645E] border-black/15'
                            }`}
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, {
                                fontFamily:
                                  selectedElement.fontFamily === 'mono'
                                    ? 'sans'
                                    : 'mono',
                              })
                            }
                            className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer ${
                              selectedElement.fontFamily === 'mono'
                                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                : 'bg-white text-[#141413] border-black/15'
                            }`}
                          >
                            MONO
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* IMAGE SPECIFIC CONTROLS */}
                {selectedElement.type === 'image' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0F2942]">
                          Image Scaling Mode
                        </label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, {
                                objectFit: 'contain',
                              })
                            }
                            className={`px-2.5 py-1 text-xs font-semibold rounded border cursor-pointer ${
                              selectedElement.objectFit !== 'cover'
                                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                : 'bg-white text-[#141413] border-black/15'
                            }`}
                          >
                            Fit Full Suitcase (Contain)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, {
                                objectFit: 'cover',
                              })
                            }
                            className={`px-2.5 py-1 text-xs font-semibold rounded border cursor-pointer ${
                              selectedElement.objectFit === 'cover'
                                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                : 'bg-white text-[#141413] border-black/15'
                            }`}
                          >
                            Fill Box (Cover)
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#FFD166] text-[#141413] rounded-lg border border-black/20 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#65645E] mb-1">
                        Or Paste Image URL
                      </label>
                      <input
                        type="text"
                        value={selectedElement.imageSrc || ''}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            imageSrc: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1 text-xs bg-[#F9F9F8] border border-black/15 rounded"
                      />
                    </div>
                  </div>
                )}

                {/* COLOURS & BORDER CONTROLS */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/10">
                  {selectedElement.type === 'text' && (
                    <div>
                      <label className="block text-[10px] font-bold text-[#65645E] mb-1">
                        Text Colour
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={selectedElement.color || '#141413'}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              color: e.target.value,
                            })
                          }
                          className="w-7 h-7 rounded border border-black/20 cursor-pointer"
                        />
                        <div className="flex flex-wrap gap-1">
                          {['#141413', '#0F2942', '#B81D24', '#FFFFFF', '#FFD166'].map(
                            (c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  updateElement(selectedElement.id, { color: c })
                                }
                                style={{ backgroundColor: c }}
                                className="w-4 h-4 rounded-full border border-black/30 cursor-pointer"
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-[#65645E] mb-1">
                      Box Background
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={
                          selectedElement.bgColor &&
                          selectedElement.bgColor !== 'transparent'
                            ? selectedElement.bgColor
                            : '#FFFFFF'
                        }
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            bgColor: e.target.value,
                          })
                        }
                        className="w-7 h-7 rounded border border-black/20 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            bgColor: 'transparent',
                          })
                        }
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-[#F9F9F8] border border-black/20 rounded cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#65645E] mb-1">
                      Border Width (px)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={selectedElement.borderWidth || 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          borderWidth: Number(e.target.value),
                          borderColor:
                            selectedElement.borderColor &&
                            selectedElement.borderColor !== 'transparent'
                              ? selectedElement.borderColor
                              : '#141413',
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-mono-tabular bg-[#F9F9F8] border border-black/15 rounded"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#65645E] py-4 text-center bg-[#F9F9F8] rounded-lg border border-dashed border-black/15">
                Click any element on the Shelf Talker canvas on the left to adjust its placement, size, text, or image.
              </div>
            )}
          </div>

          {/* CATALOG SUITCASE IMAGE PICKER (One-click add or swap any suitcase photo from catalog) */}
          <div className="bg-white border border-black/12 rounded-xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#B81D24]" />
                <span>Catalog Suitcase Images (Click to Insert or Swap)</span>
              </div>
              <span className="text-[10px] text-[#65645E]">
                {selectedElement?.type === 'image'
                  ? 'Replaces selected photo'
                  : 'Adds new photo layer'}
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-[#F9F9F8] rounded-lg border border-black/8">
              {products
                .filter((p) => p.image && p.priceRs > 0)
                .slice(0, 36)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (selectedElement && selectedElement.type === 'image') {
                        updateElement(selectedElement.id, {
                          imageSrc: p.image,
                          label: `${p.series} Photo`,
                        });
                      } else {
                        handleAddImageBlock(p.image, `${p.series} Photo`);
                      }
                    }}
                    className="p-1 bg-white rounded border border-black/10 hover:border-[#0F2942] flex flex-col items-center gap-0.5 cursor-pointer group"
                    title={`Use ${p.name} image`}
                  >
                    <ProductImage
                      src={p.image}
                      alt={p.series}
                      series={p.series}
                      eager
                      useProxy
                      className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[8.5px] font-bold text-[#141413] truncate w-full text-center">
                      {p.series}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* LAYER LIST (Quick select any element on the card) */}
          <div className="bg-white border border-black/12 rounded-xl p-4 shadow-xs space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>All Imported Elements ({elements.length}) — Click to Select</span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-black/6 border border-black/8 rounded-lg bg-[#F9F9F8]">
              {[...elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer ${
                      el.id === selectedId
                        ? 'bg-[#2563EB] text-white font-bold'
                        : 'hover:bg-black/5 text-[#141413]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(el.id, { locked: !el.locked });
                        }}
                        className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                        title={el.locked ? 'Unlock item' : 'Lock item in place'}
                      >
                        {el.locked ? (
                          <Lock className="w-3 h-3 text-[#B81D24]" />
                        ) : (
                          <Unlock className="w-3 h-3 opacity-60" />
                        )}
                      </button>
                      <span className="truncate">{el.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono-tabular ${
                        el.id === selectedId ? 'text-white/90' : 'text-[#65645E]'
                      }`}
                    >
                      {Math.round(el.w)}%×{Math.round(el.h)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* PRINTABLE A4 SHEET FOR WHEN USER CLICKS PRINT */}
      <div className="hidden print:flex flex-col items-center">
        <div className="a4-print-sheet bg-white w-[210mm] h-[297mm] p-[6mm] box-border">
          {printFormat === '1xA4' ? (
            <div className="w-full h-full">{renderStaticCardPreview(1.2)}</div>
          ) : (
            <div className="grid grid-cols-2 grid-rows-2 gap-[4mm] w-full h-full">
              {renderStaticCardPreview(0.62)}
              {renderStaticCardPreview(0.62)}
              {renderStaticCardPreview(0.62)}
              {renderStaticCardPreview(0.62)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
