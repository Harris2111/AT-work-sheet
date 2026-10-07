import React, { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import {
  X,
  Printer,
  Download,
  RefreshCw,
  Search,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Layers,
  MessageCircle,
  Mail,
  BellRing,
} from 'lucide-react';
import { AbDesaiATProduct, formatRs } from '../data/luggageCatalog';
import { loadCorsSafeCanvasImage } from './ProductImage';
import {
  getProductSpecifications,
  getExactSizeClass,
  getProductStyleKey,
  extractColourName,
  ALL_DISPLAY_SERIES_ORDER,
  LuggageSizeClass,
} from '../data/productSpecs';

interface PriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AbDesaiATProduct[];
  lastSyncedAt: string;
  isSyncing: boolean;
  onSyncNow: () => void;
  onOpenShelfTalkerForProduct: (productId: number) => void;
  onOpenAlertCenter?: () => void;
  unreadAlertsCount?: number;
}

function buildPriceListWhatsAppUrl(
  title: string,
  items: AbDesaiATProduct[],
  allProducts: AbDesaiATProduct[]
): string {
  const lines = [
    `*A.B. DESAI MAURITIUS — ${title.toUpperCase()}*`,
    `Official American Tourister Price & Promo Update (${new Date().toLocaleDateString()})`,
    `-----------------------------------------`,
    ...items.slice(0, 18).map((item, idx) => {
      const specs = getProductSpecifications(item, allProducts);
      const styleKey = getProductStyleKey(item);
      const siblingColours = Array.from(
        new Set(
          allProducts
            .filter((p) => getProductStyleKey(p) === styleKey)
            .map((p) => extractColourName(p))
        )
      );
      const colourLabel =
        siblingColours.length > 1
          ? `Colours (${siblingColours.length}): ${siblingColours.join(', ')}`
          : extractColourName(item);
      const wasStr =
        item.regularPriceRs && item.regularPriceRs > item.priceRs
          ? ` (Was ${formatRs(item.regularPriceRs)})`
          : '';
      const promoStr = item.promoBadge ? `\n   ★ ${item.promoBadge}` : '';
      return `${idx + 1}. *${item.series} ${specs.sizeClass}* — ${colourLabel}\n   Price: *${formatRs(
        item.priceRs
      )}*${wasStr} · ${specs.dimensionsCm} · ${specs.volumeLitres}${promoStr}`;
    }),
    items.length > 18
      ? `...and ${items.length - 18} more verified American Tourister items.`
      : null,
    `-----------------------------------------`,
    `Showrooms: Port-Louis · Tribeca · Trianon · Bagatelle · Cascavelle · Rose-Belle`,
    `Important: Customers must confirm availability before payment · Home deliveries can take up to 10 days`,
    `Online: https://abdesai.mu | WhatsApp: +230 5979 7960`,
  ].filter(Boolean);

  return `https://wa.me/23059797960?text=${encodeURIComponent(
    lines.join('\n')
  )}`;
}

function buildPriceListEmailUrl(
  title: string,
  items: AbDesaiATProduct[],
  allProducts: AbDesaiATProduct[]
): string {
  const subject = `[AB Desai Price List] ${title} (${items.length} Items)`;
  const body = [
    `A.B. DESAI MAURITIUS — ${title.toUpperCase()}`,
    `Generated: ${new Date().toLocaleString()}`,
    `=========================================`,
    ...items.slice(0, 35).map((item, idx) => {
      const specs = getProductSpecifications(item, allProducts);
      const colour = extractColourName(item);
      return `${idx + 1}. ${item.series} | ${specs.sizeClass} | ${colour} (SKU: ${
        item.sku
      })\n   Active Price: ${formatRs(item.priceRs)}${
        item.regularPriceRs ? ` (Regular: ${formatRs(item.regularPriceRs)})` : ''
      }\n   Specs: ${specs.dimensionsCm} · ${specs.volumeLitres} · ${
        specs.weightKg
      }${item.promoBadge ? `\n   Promo: ${item.promoBadge}` : ''}\n   Link: ${
        item.permalink
      }`;
    }),
  ].join('\n\n');

  return `mailto:info@abdesai.mu?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

const SIZE_SORT_ORDER: Record<LuggageSizeClass, number> = {
  Cabin: 1,
  Medium: 2,
  Large: 3,
  'X-Large': 4,
  'Set of 3': 5,
  'Combo / 2-Pack': 6,
  'Backpack & Duffle': 7,
};

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
  if (
    c.includes('green') ||
    c.includes('forest') ||
    c.includes('sage') ||
    c.includes('olive') ||
    c.includes('khakhi') ||
    c.includes('khaki')
  )
    return '#2F6F4E';
  if (
    c.includes('red') ||
    c.includes('crimson') ||
    c.includes('burgundy') ||
    c.includes('wine') ||
    c.includes('coral')
  )
    return '#B81D24';
  if (
    c.includes('yellow') ||
    c.includes('gold') ||
    c.includes('mustard') ||
    c.includes('sun')
  )
    return '#EAB308';
  if (
    c.includes('pink') ||
    c.includes('rose') ||
    c.includes('magenta') ||
    c.includes('blush')
  )
    return '#EC4899';
  if (
    c.includes('purple') ||
    c.includes('lilac') ||
    c.includes('lavender') ||
    c.includes('violet')
  )
    return '#8B5CF6';
  if (
    c.includes('grey') ||
    c.includes('gray') ||
    c.includes('silver') ||
    c.includes('graphite')
  )
    return '#6B7280';
  if (
    c.includes('brown') ||
    c.includes('bronze') ||
    c.includes('copper') ||
    c.includes('sand') ||
    c.includes('beige')
  )
    return '#92400E';
  return '#0F2942';
}

function getSeriesSortRank(series: string): number {
  const idx = ALL_DISPLAY_SERIES_ORDER.indexOf(series);
  return idx === -1 ? 999 : idx;
}

/**
 * Loads a product photo through our local /api/proxy-image route,
 * draws it onto a clean 140x140 white square canvas, and returns
 * a base64 PNG data URL suitable for embedding directly inside Excel (.xlsx) cells.
 */
async function renderProductPhotoPngBase64(imageUrl: string): Promise<string | null> {
  if (!imageUrl || !imageUrl.trim()) return null;
  const img = await loadCorsSafeCanvasImage(imageUrl);
  if (!img) return null;

  try {
    const size = 140;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    const pad = 8;
    const maxW = size - pad * 2;
    const maxH = size - pad * 2;
    const scale = Math.min(
      maxW / (img.naturalWidth || 1),
      maxH / (img.naturalHeight || 1)
    );
    const drawW = (img.naturalWidth || size) * scale;
    const drawH = (img.naturalHeight || size) * scale;
    const drawX = (size - drawW) / 2;
    const drawY = (size - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export const PriceListModal: React.FC<PriceListModalProps> = ({
  isOpen,
  onClose,
  products,
  lastSyncedAt,
  isSyncing,
  onSyncNow,
  onOpenShelfTalkerForProduct,
  onOpenAlertCenter,
  unreadAlertsCount = 0,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'promos' | 'instock'>('all');
  const [seriesFilter, setSeriesFilter] = useState<string>('All');
  const [sizeClassFilter, setSizeClassFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [rowColourOverrides, setRowColourOverrides] = useState<
    Record<number, number>
  >({});
  const [groupColoursBySize, setGroupColoursBySize] = useState(true);

  // Ordered list of series with counts
  const seriesOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      map.set(p.series, (map.get(p.series) || 0) + 1);
    }
    const sortedNames = Array.from(map.keys()).sort(
      (a, b) => getSeriesSortRank(a) - getSeriesSortRank(b)
    );
    return sortedNames.map((name) => ({
      name,
      count: map.get(name) || 0,
    }));
  }, [products]);

  /**
   * Filter and sort products so every series is grouped together in one place,
   * and within each series items are ordered:
   *   1. Cabin -> 2. Medium -> 3. Large -> 4. X-Large -> 5. Set of 3 -> 6. Combo / 2-Pack -> 7. Backpack & Duffle
   * This ensures that for Bricklane (or any other collection), Cabin (55cm), Medium (69cm), and Large (80cm)
   * are always listed right next to each other.
   */
  const filteredList = useMemo(() => {
    const filtered = products.filter((p) => {
      const exactSize = getExactSizeClass(p);
      // Note: When 'promos' is selected, if a series has a series-wide promo (like Bricklane where buying Medium/Large gets Cabin at 50% off),
      // include Bricklane Cabin as well so the customer/staff can see the Cabin regular & half-price alongside Medium & Large!
      if (filterMode === 'promos') {
        const isBricklaneCompanionCabin =
          p.series === 'Bricklane' && exactSize === 'Cabin';
        if (!p.hasPromo && !isBricklaneCompanionCabin) return false;
      }
      if (filterMode === 'instock' && !p.inStock) return false;
      if (seriesFilter !== 'All' && p.series !== seriesFilter) return false;
      if (sizeClassFilter !== 'All' && exactSize !== sizeClassFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const specs = getProductSpecifications(p, products);
        return (
          p.name.toLowerCase().includes(q) ||
          p.series.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          exactSize.toLowerCase().includes(q) ||
          specs.dimensionsCm.toLowerCase().includes(q) ||
          (p.promoBadge || '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const rankA = getSeriesSortRank(a.series);
      const rankB = getSeriesSortRank(b.series);
      if (rankA !== rankB) return rankA - rankB;
      if (a.series !== b.series) return a.series.localeCompare(b.series);

      const sizeA = SIZE_SORT_ORDER[getExactSizeClass(a)] || 99;
      const sizeB = SIZE_SORT_ORDER[getExactSizeClass(b)] || 99;
      if (sizeA !== sizeB) return sizeA - sizeB;

      // Within the same size (e.g., Skytrac single unit vs Skytrac 2-Pack offer), show single unit first then offer
      const isOfferA = /offer/i.test(a.name) ? 1 : 0;
      const isOfferB = /offer/i.test(b.name) ? 1 : 0;
      if (isOfferA !== isOfferB) return isOfferA - isOfferB;

      // Sort by colour / name alphabetically
      return extractColourName(a).localeCompare(extractColourName(b));
    });
  }, [products, filterMode, seriesFilter, sizeClassFilter, searchQuery]);

  // Group filteredList by series so we can render clean Series Section Headers
  const groupedBySeries = useMemo(() => {
    const groups: {
      series: string;
      items: AbDesaiATProduct[];
      sizesSummary: string;
    }[] = [];

    for (const item of filteredList) {
      let lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.series !== item.series) {
        lastGroup = { series: item.series, items: [], sizesSummary: '' };
        groups.push(lastGroup);
      }
      if (groupColoursBySize) {
        const itemStyleKey = getProductStyleKey(item);
        const alreadyHasStyleVariant = lastGroup.items.some(
          (existing) => getProductStyleKey(existing) === itemStyleKey
        );
        if (!alreadyHasStyleVariant) {
          lastGroup.items.push(item);
        }
      } else {
        lastGroup.items.push(item);
      }
    }

    for (const g of groups) {
      const sizeCounts = new Map<string, number>();
      for (const it of g.items) {
        const sc = getExactSizeClass(it);
        sizeCounts.set(sc, (sizeCounts.get(sc) || 0) + 1);
      }
      g.sizesSummary = Array.from(sizeCounts.entries())
        .map(([sz, count]) => `${count} ${sz}`)
        .join(' · ');
    }

    return groups;
  }, [filteredList, groupColoursBySize]);

  if (!isOpen) return null;

  /**
   * Generates a real Microsoft Excel (.xlsx) workbook with embedded product photos,
   * organized by Series and ordered Cabin -> Medium -> Large -> X-Large -> Set of 3 -> Combo
   * with section headers so every size is immediately visible.
   */
  const handleDownloadExcelWithImages = async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    setExportProgressText('Preparing Excel workbook...');

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'A.B. Desai Mauritius · American Tourister';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Master Price List', {
        views: [{ state: 'frozen', ySplit: 4 }],
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
      });

      sheet.columns = [
        { key: 'photo', width: 13 }, // Col A: Embedded Product Photo
        { key: 'series', width: 17 }, // Col B: Series
        { key: 'sizeClass', width: 16 }, // Col C: Size Class (Cabin / Medium / Large / X-Large / Set)
        { key: 'colour', width: 18 }, // Col D: Colour
        { key: 'name', width: 40 }, // Col E: Product Name & SKU
        { key: 'specs', width: 32 }, // Col F: Specs (Dimensions · Vol · Weight)
        { key: 'promo', width: 40 }, // Col G: Active Promotion / Offer
        { key: 'regularPrice', width: 15 }, // Col H: Regular Price (MUR)
        { key: 'activePrice', width: 17 }, // Col I: Promo / Active Price (MUR)
        { key: 'savings', width: 15 }, // Col J: Savings (MUR)
        { key: 'stock', width: 13 }, // Col K: Stock Status
        { key: 'url', width: 32 }, // Col L: Official URL
      ];

      // Row 1: Title Banner
      sheet.mergeCells('A1:L1');
      const titleRow = sheet.getRow(1);
      titleRow.height = 30;
      const titleCell = sheet.getCell('A1');
      titleCell.value =
        'A.B. DESAI MAURITIUS — AMERICAN TOURISTER COMPLETE MASTER PRICE LIST & PROMOTIONS (ORDERED BY SERIES & SIZE)';
      titleCell.font = {
        name: 'Calibri',
        size: 14,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F2942' },
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      // Row 2: Showroom Contact Strip
      sheet.mergeCells('A2:L2');
      const subRow = sheet.getRow(2);
      subRow.height = 20;
      const subCell = sheet.getCell('A2');
      subCell.value = `Port-Louis (211 4114) · Tribeca Mall (5466 4114) · La City Trianon (463 7591) · Bagatelle Mall (471 1000) · Cascavelle Mall (452 4142) · Rose-Belle (5461 2224) · WhatsApp (+230 5979 7960) · Confirm Availability Before Payment · Home Deliveries Up to 10 Days · Total Listed: ${filteredList.length} Items`;
      subCell.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FF141413' },
      };
      subCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFECE6' },
      };
      subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      // Row 3: Blank spacer
      sheet.getRow(3).height = 8;

      // Row 4: Table Column Headers
      const headerLabels = [
        'PHOTO',
        'SERIES',
        'SIZE (C / M / L / XL)',
        'COLOUR',
        'PRODUCT NAME & SKU',
        'SPECS (SIZE · VOL · WEIGHT)',
        'ACTIVE PROMOTION / OFFER',
        'REGULAR PRICE',
        'ACTIVE PRICE',
        'SAVINGS',
        'STOCK',
        'OFFICIAL LINK',
      ];
      const headerRow = sheet.getRow(4);
      headerRow.values = headerLabels;
      headerRow.height = 26;
      headerRow.eachCell((cell, colNumber) => {
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F2942' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal:
            colNumber >= 8 && colNumber <= 10
              ? 'right'
              : colNumber === 1 || colNumber === 11
                ? 'center'
                : 'left',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF141413' } },
          bottom: { style: 'medium', color: { argb: 'FF141413' } },
          left: { style: 'thin', color: { argb: 'FF2A4766' } },
          right: { style: 'thin', color: { argb: 'FF2A4766' } },
        };
      });

      // Pre-fetch & convert unique product images in parallel batches
      const uniqueUrls = Array.from(
        new Set(filteredList.map((p) => p.image).filter(Boolean))
      );
      const imageIdByUrl = new Map<string, number>();

      const batchSize = 10;
      for (let i = 0; i < uniqueUrls.length; i += batchSize) {
        const batch = uniqueUrls.slice(i, i + batchSize);
        setExportProgressText(
          `Embedding photos (${Math.min(i + batch.length, uniqueUrls.length)}/${uniqueUrls.length})...`
        );
        await Promise.all(
          batch.map(async (url) => {
            const base64Png = await renderProductPhotoPngBase64(url);
            if (base64Png) {
              const imgId = workbook.addImage({
                base64: base64Png,
                extension: 'png',
              });
              imageIdByUrl.set(url, imgId);
            }
          })
        );
      }

      setExportProgressText('Writing grouped series & sizes...');

      let currentRowNum = 5;

      for (const group of groupedBySeries) {
        // Series Section Banner Row in Excel
        sheet.mergeCells(`A${currentRowNum}:L${currentRowNum}`);
        const groupRow = sheet.getRow(currentRowNum);
        groupRow.height = 24;
        const groupCell = sheet.getCell(`A${currentRowNum}`);
        groupCell.value = `■ ${group.series.toUpperCase()} SERIES — ${group.items.length} ITEMS (${group.sizesSummary})`;
        groupCell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: 'FF0F2942' },
        };
        groupCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E2D8' },
        };
        groupCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        groupCell.border = {
          top: { style: 'medium', color: { argb: 'FF0F2942' } },
          bottom: { style: 'thin', color: { argb: 'FF0F2942' } },
        };
        currentRowNum++;

        for (let idx = 0; idx < group.items.length; idx++) {
          const item = group.items[idx];
          const rowNumber = currentRowNum++;
          const cleanName = item.name.replace(/^AMERICAN TOURISTER\s+/i, '');
          const specs = getProductSpecifications(item, products);
          const itemStyleKey = getProductStyleKey(item);
          const siblingColourNames = Array.from(
            new Set(
              products
                .filter((p) => getProductStyleKey(p) === itemStyleKey)
                .map((p) => extractColourName(p))
            )
          );
          const mainColour = extractColourName(item);
          const otherColours = siblingColourNames.filter((c) => c !== mainColour);
          const colour =
            groupColoursBySize && otherColours.length > 0
              ? `${mainColour}\nOther Colours: ${otherColours.join(', ')}`
              : mainColour;
          const savings =
            item.regularPriceRs && item.regularPriceRs > item.priceRs
              ? item.regularPriceRs - item.priceRs
              : 0;

          let promoDescription = item.promoBadge || 'Standard Retail Price';
          if (item.series === 'Bricklane' && specs.sizeClass === 'Cabin') {
            promoDescription =
              'Rs 4,500 Standalone · OR Half Price (Rs 2,250) when bought with Bricklane 69cm Medium or 80cm Large';
          } else if (item.series === 'Bricklane' && /half price/i.test(item.name)) {
            promoDescription += `\n+ Add 55cm Cabin at Rs 2,250 (50% Off Rs 4,500) = Total ${formatRs(
              item.priceRs + 2250
            )}`;
          }

          const row = sheet.getRow(rowNumber);
          row.height = 66;

          row.values = [
            '', // Col 1: Photo
            item.series,
            specs.sizeHeaderBadge,
            colour,
            `${cleanName}\nSKU: ${item.sku} · ID #${item.id}`,
            `${specs.dimensionsCm}\nVol: ${specs.volumeLitres} · Wt: ${specs.weightKg}`,
            promoDescription,
            item.regularPriceRs ? formatRs(item.regularPriceRs) : '—',
            item.priceRs > 0 ? formatRs(item.priceRs) : 'Call Showroom',
            savings > 0 ? `Save ${formatRs(savings)}` : '—',
            item.inStock ? 'In Stock' : 'Sold Out',
            item.permalink,
          ];

          const rowBgArgb = item.hasPromo
            ? 'FFFDFBF7'
            : idx % 2 === 0
              ? 'FFFFFFFF'
              : 'FFF9F9F8';

          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowBgArgb },
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2DFD7' } },
              bottom: { style: 'thin', color: { argb: 'FFE2DFD7' } },
              left: { style: 'thin', color: { argb: 'FFE2DFD7' } },
              right: { style: 'thin', color: { argb: 'FFE2DFD7' } },
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal:
                colNumber >= 8 && colNumber <= 10
                  ? 'right'
                  : colNumber === 1 || colNumber === 11
                    ? 'center'
                    : 'left',
              wrapText: true,
            };
            cell.font = {
              name: 'Calibri',
              size: 10,
              color: { argb: 'FF141413' },
            };
          });

          row.getCell(2).font = {
            name: 'Calibri',
            size: 11,
            bold: true,
            color: { argb: 'FF141413' },
          };
          row.getCell(3).font = {
            name: 'Calibri',
            size: 10,
            bold: true,
            color: { argb: 'FF0F2942' },
          };
          row.getCell(4).font = {
            name: 'Calibri',
            size: 10,
            bold: true,
            color: { argb: 'FF141413' },
          };
          row.getCell(5).font = {
            name: 'Calibri',
            size: 9.5,
            bold: true,
            color: { argb: 'FF141413' },
          };
          row.getCell(6).font = {
            name: 'Consolas',
            size: 9.5,
            bold: true,
            color: { argb: 'FF0F2942' },
          };
          row.getCell(7).font = {
            name: 'Calibri',
            size: 10,
            bold: Boolean(item.promoBadge || item.series === 'Bricklane'),
            color: {
              argb:
                item.promoBadge || item.series === 'Bricklane'
                  ? 'FF9E2A2B'
                  : 'FF65645E',
            },
          };
          row.getCell(8).font = {
            name: 'Consolas',
            size: 10,
            strike: Boolean(item.regularPriceRs),
            color: { argb: 'FF65645E' },
          };
          row.getCell(9).font = {
            name: 'Consolas',
            size: 12,
            bold: true,
            color: { argb: 'FF0F2942' },
          };
          row.getCell(10).font = {
            name: 'Consolas',
            size: 10,
            bold: savings > 0,
            color: { argb: savings > 0 ? 'FF9E2A2B' : 'FF65645E' },
          };
          row.getCell(11).font = {
            name: 'Calibri',
            size: 10,
            bold: true,
            color: { argb: item.inStock ? 'FF065F46' : 'FF92400E' },
          };
          row.getCell(12).value = {
            text: item.permalink,
            hyperlink: item.permalink,
          };
          row.getCell(12).font = {
            name: 'Calibri',
            size: 9,
            underline: true,
            color: { argb: 'FF0F2942' },
          };

          const imgId = imageIdByUrl.get(item.image);
          if (imgId !== undefined) {
            sheet.addImage(imgId, {
              tl: { col: 0.12, row: rowNumber - 1 + 0.08 },
              ext: { width: 76, height: 76 },
            });
          }
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `abdesai-american-tourister-price-list-with-images-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setIsExportingExcel(false);
      setExportProgressText('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F9F9F8] overflow-y-auto print:static print:bg-white print:overflow-visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-list-title"
    >
      {/* Top Controls Bar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-black/10 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#0F2942] font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>
                OFFICIAL A.B. DESAI MAURITIUS MASTER PRICE & PROMO SCHEDULE (GROUPED BY SERIES & SIZE)
              </span>
              <span>·</span>
              <span className="text-[#65645E] font-normal">{lastSyncedAt}</span>
            </div>
            <h2
              id="price-list-title"
              className="font-display text-2xl font-semibold text-[#141413] mt-0.5"
            >
              American Tourister Complete Price List — Cabin, Medium, Large, X-Large & Sets ({filteredList.length} of {products.length} Items)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenAlertCenter && (
              <button
                type="button"
                onClick={onOpenAlertCenter}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#FFD166] text-[#141413] border border-black/20 rounded-lg hover:bg-[#f5c44f] cursor-pointer whitespace-nowrap"
                title="Open Live abdesai.mu Change Monitor & Notifications"
              >
                <BellRing className="w-3.5 h-3.5 text-[#B81D24]" />
                <span>Live Site Alerts</span>
                {unreadAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono-tabular font-black bg-[#B81D24] text-white rounded-full">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenShelfTalkerForProduct(filteredList[0]?.id || products[0]?.id || 0)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FFD166] text-[#141413] border border-black/20 rounded-lg hover:bg-[#f5c44f] cursor-pointer whitespace-nowrap shadow-2xs"
              title="Open Printable A6 & A4 Showroom Shelf Talker Studio"
            >
              <Printer className="w-3.5 h-3.5 text-[#B81D24]" />
              <span>Shelf Talker Studio</span>
            </button>

            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-black/15 text-[#141413] rounded-lg hover:bg-[#EFECE6] cursor-pointer whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#0F2942] ${
                  isSyncing ? 'animate-spin' : ''
                }`}
              />
              <span>{isSyncing ? 'Syncing abdesai.mu...' : 'Sync Live Prices'}</span>
            </button>

            <a
              href={buildPriceListWhatsAppUrl(
                seriesFilter !== 'All'
                  ? `${seriesFilter} Series Price List`
                  : filterMode === 'promos'
                    ? 'Active Promo & BOGO Price List'
                    : 'Master Price List',
                filteredList,
                products
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] transition-colors cursor-pointer whitespace-nowrap"
              title="Forward the currently filtered Price List to WhatsApp (+230 5979 7960) or Showroom Managers"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Price List</span>
            </a>

            <a
              href={buildPriceListEmailUrl(
                seriesFilter !== 'All'
                  ? `${seriesFilter} Series Price List`
                  : 'Master Price List',
                filteredList,
                products
              )}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-black/15 text-[#0F2942] rounded-lg hover:bg-[#EFECE6] transition-colors cursor-pointer whitespace-nowrap"
              title="Email the currently filtered Price List to info@abdesai.mu"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email List</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadExcelWithImages}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              {isExportingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#FFD166]" />
              )}
              <span>
                {isExportingExcel
                  ? exportProgressText || 'Building Excel with Images...'
                  : 'Download Excel (.xlsx) with Images'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#B81D24] text-white rounded-lg hover:bg-[#96161C] cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Price List</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#65645E] hover:text-[#141413] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Close price list"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-black/8 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-lg">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-white text-[#141413] shadow-2xs'
                      : 'text-[#65645E]'
                  }`}
                >
                  All Items ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('promos')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    filterMode === 'promos'
                      ? 'bg-white text-[#9E2A2B] shadow-2xs'
                      : 'text-[#65645E]'
                  }`}
                >
                  Promos & Offers ({products.filter((p) => p.hasPromo || (p.series === 'Bricklane' && getExactSizeClass(p) === 'Cabin')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('instock')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    filterMode === 'instock'
                      ? 'bg-white text-[#141413] shadow-2xs'
                      : 'text-[#65645E]'
                  }`}
                >
                  In Stock Only ({products.filter((p) => p.inStock).length})
                </button>
              </div>

              {/* Size Class Filter */}
              <select
                value={sizeClassFilter}
                onChange={(e) => setSizeClassFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-black/15 rounded-lg text-[#141413] font-semibold focus:outline-none"
              >
                <option value="All">All Sizes (Cabin / Med / Large / XL / Sets)</option>
                <option value="Cabin">Cabin Size Only (55–57cm)</option>
                <option value="Medium">Medium Size Only (67–69cm)</option>
                <option value="Large">Large Size Only (77–80cm)</option>
                <option value="X-Large">X-Large Size Only (79–82cm)</option>
                <option value="Set of 3">Set of 3 Only</option>
                <option value="Combo / 2-Pack">2-Pack / BOGO Combos Only</option>
                <option value="Backpack & Duffle">Backpacks & Duffles Only</option>
              </select>

              {/* Group Colours by Size Toggle */}
              <button
                type="button"
                onClick={() => setGroupColoursBySize((prev) => !prev)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  groupColoursBySize
                    ? 'bg-[#0F2942] text-white border-[#0F2942]'
                    : 'bg-white text-[#141413] border-black/15 hover:bg-[#EFECE6]'
                }`}
                title="Combine multiple colours of the same size into 1 row and switch colours using the interactive colour swatches"
              >
                {groupColoursBySize
                  ? '✓ Grouped by Size (1 Row / Size + Colour Swatches)'
                  : 'Group Colours by Size (Swatch Mode)'}
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#65645E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search series, Cabin, Medium, Large, SKU..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9F9F8] border border-black/15 rounded-lg focus:outline-none focus:border-[#0F2942]"
              />
            </div>
          </div>

          {/* Quick Jump / Filter Pills for Every Series (Bricklane is first so Cabin, Medium, Large are immediately at the top!) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-semibold text-[#65645E] shrink-0 mr-1">
              Jump to Series:
            </span>
            <button
              type="button"
              onClick={() => setSeriesFilter('All')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                seriesFilter === 'All'
                  ? 'border-[#0F2942] bg-[#0F2942] text-white'
                  : 'border-black/12 bg-white text-[#141413] hover:bg-[#EFECE6]'
              }`}
            >
              All {seriesOptions.length} Series ({products.length})
            </button>
            {seriesOptions.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setSeriesFilter(s.name)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  seriesFilter === s.name
                    ? 'border-[#0F2942] bg-[#0F2942] text-white'
                    : 'border-black/12 bg-white text-[#141413] hover:bg-[#EFECE6]'
                }`}
              >
                {s.name} ({s.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Master Price Table */}
      <div className="max-w-7xl mx-auto p-6 print:p-2 print:max-w-none">
        {/* Print Header */}
        <div className="mb-4 pb-3 border-b-2 border-[#141413] flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#141413]">
              A.B. DESAI MAURITIUS — AMERICAN TOURISTER OFFICIAL PRICE LIST & PROMOTIONS
            </h1>
            <p className="text-xs text-[#65645E]">
              Port-Louis (211 4114) · Tribeca Mall (5466 4114) · La City Trianon (463 7591) · Bagatelle Mall (471 1000) · Cascavelle Mall (452 4142) · Rose-Belle (5461 2224) · Online WhatsApp (+230 5979 7960) · Customers must confirm availability before payment · Home deliveries can take up to 10 days
            </p>
          </div>
          <div className="text-right text-xs font-mono-tabular text-[#141413]">
            <div>Source: abdesai.mu</div>
            <div>
              Items Listed: {filteredList.length} of {products.length}
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/12 rounded-xl overflow-hidden shadow-2xs print:border-black print:rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0F2942] text-white uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3">Photo</th>
                  <th className="py-2.5 px-3">Series & Size Class</th>
                  <th className="py-2.5 px-3">Colour & Product Name</th>
                  <th className="py-2.5 px-3">Specs (Dimensions · Vol · Weight)</th>
                  <th className="py-2.5 px-3">Active Promotion / Offer</th>
                  <th className="py-2.5 px-3 text-right">Regular Price</th>
                  <th className="py-2.5 px-3 text-right">Promo / Active Price</th>
                  <th className="py-2.5 px-3 text-center">Stock</th>
                  <th className="py-2.5 px-3 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/8">
                {groupedBySeries.map((group) => (
                  <React.Fragment key={group.series}>
                    {/* Series Section Banner Row */}
                    <tr className="bg-[#EFECE6] border-y-2 border-[#0F2942]/30">
                      <td colSpan={9} className="py-2 px-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#0F2942]" />
                            <span className="font-display text-base font-bold text-[#0F2942] uppercase tracking-wide">
                              {group.series} Series
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-mono-tabular font-bold bg-[#0F2942] text-white rounded">
                              {group.items.length} Items
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[11px] font-mono-tabular font-semibold text-[#141413]">
                              Sizes Included: {group.sizesSummary}
                            </span>
                            <a
                              href={buildPriceListWhatsAppUrl(
                                `${group.series} Series Prices (Cabin, Medium, Large & Sets)`,
                                group.items,
                                products
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="no-print inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold bg-[#1B5E3A] text-white rounded hover:bg-[#14492D] cursor-pointer"
                              title={`Forward all ${group.series} Series prices & specs to WhatsApp`}
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp {group.series} Prices</span>
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {group.items.map((rawRowItem) => {
                      const activeOverrideId = rowColourOverrides[rawRowItem.id];
                      const item =
                        (activeOverrideId &&
                          products.find((p) => p.id === activeOverrideId)) ||
                        rawRowItem;

                      const cleanName = item.name.replace(
                        /^AMERICAN TOURISTER\s+/i,
                        ''
                      );
                      const specs = getProductSpecifications(item, products);
                      const colour = extractColourName(item);
                      const savings =
                        item.regularPriceRs && item.regularPriceRs > item.priceRs
                          ? item.regularPriceRs - item.priceRs
                          : 0;

                      const rawStyleKey = getProductStyleKey(rawRowItem);
                      const siblingColours = products.filter(
                        (p) => getProductStyleKey(p) === rawStyleKey
                      );

                      const sizeBadgeColor =
                        specs.sizeClass === 'Cabin'
                          ? 'bg-[#0F2942] text-white'
                          : specs.sizeClass === 'Medium'
                            ? 'bg-[#1B5E3A] text-white'
                            : specs.sizeClass === 'Large' ||
                                specs.sizeClass === 'X-Large'
                              ? 'bg-[#9E2A2B] text-white'
                              : 'bg-[#8C6D3F] text-white';

                      return (
                        <tr
                          key={rawRowItem.id}
                          className={`hover:bg-[#F9F9F8] ${
                            item.hasPromo ? 'bg-[#FDFBF7]' : 'bg-white'
                          }`}
                        >
                          <td className="py-2.5 px-3 align-top w-40">
                            <div className="flex flex-col items-start gap-1.5">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={cleanName}
                                  referrerPolicy="no-referrer"
                                  className="w-14 h-14 object-contain rounded bg-white border border-black/10 p-0.5"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded bg-[#F4F2ED] border border-black/10 flex items-center justify-center text-[9px] font-bold text-[#0F2942]">
                                  AT
                                </div>
                              )}
                              {/* Mention the other colours right below the 1 image */}
                              {siblingColours.length > 1 ? (
                                <div className="text-[10px] leading-snug text-[#141413]">
                                  <span className="font-bold text-[#0F2942]">
                                    Shown: {colour}
                                  </span>
                                  <div className="text-[#65645E] mt-0.5">
                                    <span className="font-semibold text-[#141413]">
                                      Also in:{' '}
                                    </span>
                                    {Array.from(
                                      new Set(
                                        siblingColours
                                          .map((s) => extractColourName(s))
                                          .filter((c) => c !== colour)
                                      )
                                    ).join(', ')}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] font-semibold text-[#0F2942]">
                                  {colour}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap align-top">
                            <div className="font-bold text-[#141413]">
                              {item.series}
                            </div>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${sizeBadgeColor}`}
                            >
                              {specs.sizeHeaderBadge}
                            </span>
                            {siblingColours.length > 1 && (
                              <div className="text-[10px] font-semibold text-[#65645E] mt-1">
                                {siblingColours.length} Colours Available
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs align-top">
                            <div className="font-semibold text-[#141413] line-clamp-2">
                              {cleanName}
                            </div>
                            <div className="text-[10.5px] font-mono-tabular text-[#65645E] mt-0.5">
                              SKU: {item.sku} · ID #{item.id}
                            </div>

                            {/* Mention all colours & allow clicking any colour to preview its image */}
                            {siblingColours.length > 1 ? (
                              <div className="mt-1.5 pt-1.5 border-t border-black/8">
                                <div className="text-[10.5px] text-[#141413] leading-snug">
                                  <span className="font-bold text-[#0F2942]">
                                    All Colours ({siblingColours.length}):{' '}
                                  </span>
                                  <span>
                                    {Array.from(
                                      new Set(
                                        siblingColours.map((s) =>
                                          extractColourName(s)
                                        )
                                      )
                                    ).join(' · ')}
                                  </span>
                                </div>
                                <div className="no-print flex flex-wrap items-center gap-1 mt-1">
                                  {siblingColours.map((sib) => {
                                    const sibColour = extractColourName(sib);
                                    const isCurrent = sib.id === item.id;
                                    const swatchHex =
                                      resolveSwatchHex(sibColour);
                                    return (
                                      <button
                                        key={sib.id}
                                        type="button"
                                        onClick={() =>
                                          setRowColourOverrides((prev) => ({
                                            ...prev,
                                            [rawRowItem.id]: sib.id,
                                          }))
                                        }
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold border transition-all cursor-pointer ${
                                          isCurrent
                                            ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                            : 'bg-[#F9F9F8] text-[#141413] border-black/15 hover:border-[#0F2942]'
                                        }`}
                                        title={`Preview ${sibColour} photo`}
                                      >
                                        <span
                                          className="w-2 h-2 rounded-full border border-white/50 shrink-0"
                                          style={{ backgroundColor: swatchHex }}
                                        />
                                        <span className="truncate max-w-[75px]">
                                          {sibColour}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] font-bold text-[#0F2942] mt-1">
                                Colour: {colour}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono-tabular text-[11px]">
                            <div className="font-bold text-[#141413]">
                              Size: {specs.dimensionsCm}
                            </div>
                            <div className="text-[#0F2942] font-bold">
                              Vol: {specs.volumeLitres} · Wt: {specs.weightKg}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {item.promoBadge ? (
                              <div>
                                <span className="font-bold text-[#9E2A2B]">
                                  {item.promoBadge}
                                </span>
                                {item.series === 'Bricklane' &&
                                  /half price/i.test(item.name) && (
                                    <div className="text-[11px] text-[#0F2942] font-semibold mt-0.5">
                                      + 55cm Cabin at Rs 2,250 (Was Rs 4,500) =
                                      Total {formatRs(item.priceRs + 2250)}
                                    </div>
                                  )}
                              </div>
                            ) : item.series === 'Bricklane' &&
                              specs.sizeClass === 'Cabin' ? (
                              <div>
                                <span className="font-semibold text-[#141413]">
                                  Rs 4,500 Standalone
                                </span>
                                <div className="text-[11px] text-[#9E2A2B] font-bold mt-0.5">
                                  ★ Or Pay Rs 2,250 (50% OFF) when bought with
                                  Bricklane Medium (69cm) or Large (80cm)
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#65645E]">
                                Standard Retail
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono-tabular whitespace-nowrap">
                            {item.regularPriceRs ? (
                              <span className="text-[#65645E] line-through">
                                {formatRs(item.regularPriceRs)}
                              </span>
                            ) : (
                              <span className="text-[#65645E]">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono-tabular whitespace-nowrap">
                            <div className="text-sm font-bold text-[#0F2942]">
                              {item.priceRs > 0
                                ? formatRs(item.priceRs)
                                : 'Inquire'}
                            </div>
                            {savings > 0 && (
                              <div className="text-[10px] font-semibold text-[#9E2A2B]">
                                Save {formatRs(savings)}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span
                              className={`text-[11px] font-semibold ${
                                item.inStock
                                  ? 'text-emerald-800'
                                  : 'text-amber-800'
                              }`}
                            >
                              {item.inStock ? 'In Stock' : 'Sold Out'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap no-print">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenShelfTalkerForProduct(item.id)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-[#FFD166] hover:bg-[#f5c44f] text-[#141413] border border-black/15 rounded cursor-pointer"
                                title="Edit, Download & Print A6 / A4 Shelf Talker for this item"
                              >
                                <Printer className="w-3 h-3 text-[#B81D24]" />
                                <span>Shelf Talker</span>
                              </button>
                              <a
                                href={buildPriceListWhatsAppUrl(
                                  `${item.series} ${specs.sizeClass}`,
                                  [item],
                                  products
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-[#1B5E3A] text-white rounded hover:bg-[#14492D]"
                                title="Forward this item's price, specs & promo to WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                              <a
                                href={item.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-[#0F2942] hover:underline"
                                title="View on abdesai.mu"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
