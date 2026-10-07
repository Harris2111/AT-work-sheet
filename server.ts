import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ABDESAI_PRODUCTS } from './src/data/luggageCatalog.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function decodeEntities(str: string): string {
  return (str || '')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8243;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

function escapeHtmlAttr(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function detectSeries(name: string, tags: any[]): string {
  const tagList = (tags || []).map((t) => String(t.name).toLowerCase());
  const n = name.toLowerCase();
  if (n.includes('gemina')) return 'Gemina Pro';
  if (n.includes('skytrac') || tagList.includes('skytrac')) return 'Skytrac';
  if (n.includes('dashway') || tagList.includes('dashway')) return 'Dashway';
  if (n.includes('dash pop') || n.includes('dashpop') || tagList.includes('dashpop'))
    return 'Dash Pop';
  if (n.includes('jamaica') || tagList.includes('jamaica')) return 'Jamaica';
  if (n.includes('duncan') || tagList.includes('duncan')) return 'Duncan';
  if (n.includes('bricklane') || tagList.includes('bricklane')) return 'Bricklane';
  if (n.includes('novastream') || tagList.includes('novastream')) return 'Novastream';
  if (n.includes('mystic') || tagList.includes('mystic')) return 'Mystic';
  if (n.includes('senna') || tagList.includes('senna')) return 'Senna';
  if (n.includes('maxplus') || tagList.includes('maxplus')) return 'Maxplus';
  if (n.includes('ellipso') || tagList.includes('ellipso')) return 'Ellipso';
  if (n.includes('skylette') || tagList.includes('skylette')) return 'Skylette';
  if (n.includes('hundo') || tagList.includes('hundo')) return 'Hundo';
  if (n.includes('aerospin') || tagList.includes('aerospin')) return 'Aerospin';
  if (n.includes('trento') || tagList.includes('trento')) return 'Trento';
  if (n.includes('circurity') || tagList.includes('circurity')) return 'Circurity';
  if (n.includes('curio') || tagList.includes('curio')) return 'Curio';
  if (n.includes('majoris') || tagList.includes('majoris')) return 'Majoris';
  if (n.includes('robotech') || tagList.includes('robotech')) return 'Robotech';
  if (n.includes('portland') || tagList.includes('portland')) return 'Portland';
  if (n.includes('oliver') || tagList.includes('oliver')) return 'Oliver';
  if (n.includes('skypark') || tagList.includes('skypark')) return 'Skypark';
  if (n.includes('seville') || tagList.includes('seville')) return 'Seville';
  if (n.includes('frontec') || tagList.includes('frontec')) return 'Frontec';
  if (n.includes('aerojoy') || tagList.includes('aerojoy')) return 'Aerojoy';
  if (n.includes('cosmo') || n.includes('duffle') || n.includes('dbag'))
    return 'Duffle & Cabin Bags';
  if (
    n.includes('backpack') ||
    n.includes('sest') ||
    n.includes('mate') ||
    n.includes('zork') ||
    n.includes('segno') ||
    n.includes('bass')
  )
    return 'Backpacks & Briefcases';

  // Auto-detect any brand-new American Tourister series added on abdesai.mu
  const stripped = name
    .replace(/^AMERICAN\s+TOURISTER\s+/i, '')
    .replace(/^[A-Z]{2,3}\d+\s+/i, '')
    .trim();
  const firstToken = stripped.split(/\s+/)[0];
  if (
    firstToken &&
    firstToken.length >= 3 &&
    !/^(cabin|medium|large|xlarge|x-large|set|suitcase|trolley|luggage|offer)$/i.test(
      firstToken
    )
  ) {
    return (
      firstToken.charAt(0).toUpperCase() + firstToken.slice(1).toLowerCase()
    );
  }

  return 'American Tourister';
}

function detectSizeCategory(name: string): string {
  const n = name.toLowerCase();
  if (/set\s*of\s*3|set\s*3|set3|\b3\s*pcs\b|\b3\s*units\b/i.test(n)) return 'Set of 3';
  if (/cabin\s*\+\s*large|cabin\s*\+\s*medium|2\s*units|buy\s*one|offer/i.test(n))
    return 'Combo / 2-Pack';
  if (/xlarge|x-large|\bxl\b|80cm|79cm|78cm|77cm|\blarge\b|\s+l\s+/i.test(n))
    return 'Large / X-Large';
  if (/medium|68cm|67cm|69cm|\s+m\s+/i.test(n)) return 'Medium';
  if (/cabin|55cm|56cm|57cm|\s+c\s+/i.test(n)) return 'Cabin';
  if (/backpack|duffle|dbag|briefcase|tote/i.test(n)) return 'Backpack & Duffle';
  return 'Individual Suitcase';
}

function resolvePriceAndPromo(p: any, name: string, rawDesc = '') {
  const rawPriceRs = Number(p.prices?.price || 0) / 100;
  const rawRegularRs = Number(p.prices?.regular_price || 0) / 100;
  const rawSaleRs = Number(p.prices?.sale_price || 0) / 100;
  const combinedText = `${name} ${rawDesc}`;

  // 1. Buy One Get One Free (ONLY when actively on sale on abdesai.mu: p.on_sale === true)
  if (/buy\s*one\s*get\s*one\s*free/i.test(name)) {
    if (p.on_sale && rawRegularRs > rawPriceRs) {
      return {
        priceRs: rawPriceRs,
        regularPriceRs: rawRegularRs,
        onSale: true,
        hasPromo: true,
        promoBadge: 'Buy One Get One Free (Price for 2 Units)',
      };
    }
    return {
      priceRs: rawPriceRs,
      regularPriceRs: undefined,
      onSale: false,
      hasPromo: false,
      promoBadge: undefined,
    };
  }

  // 2. Skytrac "Buy one ... Get the second one in any colour same size at half price ... Total for 2 [Size] Rs X"
  if (/get\s+the\s+second\s+one\s+.*?\s+at\s+half\s+price/i.test(name)) {
    const saveMatch = name.match(/SAVE\s*Rs\s*([\d,]+)/i);
    return {
      priceRs: rawPriceRs,
      regularPriceRs: rawRegularRs > rawPriceRs ? rawRegularRs : undefined,
      onSale: true,
      hasPromo: true,
      promoBadge: saveMatch
        ? `Buy 1 Get 2nd at 50% Off (Price for 2 · Save Rs ${Number(
            saveMatch[1].replace(/,/g, '')
          ).toLocaleString('en-MU')})`
        : 'Buy 1 Get 2nd at 50% Off (Price for 2 Units)',
    };
  }

  // 3. Bricklane 69cm / 80cm ("Get 1 Cabin worth Rs 4500 at half price (Pay Rs 2250 for the Cabin)")
  if (/get\s+1\s+cabin\s+worth\s+rs\s*4500\s+at\s+half\s+price/i.test(name)) {
    return {
      priceRs: rawPriceRs,
      regularPriceRs: undefined,
      onSale: false,
      hasPromo: true,
      promoBadge: 'Promo: Get 1 Cabin at Half Price (+Rs 2,250)',
    };
  }

  // 4. Free 950ml Copper Bottle (Gemina PRO L)
  if (/free\s+950ml\s+copper\s+bottle/i.test(name)) {
    return {
      priceRs: rawPriceRs,
      regularPriceRs: p.on_sale && rawRegularRs > rawPriceRs ? rawRegularRs : undefined,
      onSale: Boolean(p.on_sale),
      hasPromo: true,
      promoBadge: 'Save Rs 2,495 + Free 950ml Copper Bottle',
    };
  }

  // 5. Free RICO Travel Rice Cooker (Novastream Medium & Large)
  if (/free\s+rico.*rice\s+cooker/i.test(name)) {
    return {
      priceRs: rawPriceRs,
      regularPriceRs: p.on_sale && rawRegularRs > rawPriceRs ? rawRegularRs : undefined,
      onSale: Boolean(p.on_sale),
      hasPromo: true,
      promoBadge: 'Free RICO Travel Rice Cooker (Worth Rs 1,390)',
    };
  }

  // 5b. Free Baseus Powerbank in description (e.g. Aerospin XL Stone Basalt on abdesai.mu)
  if (/free\s+baseus\s+powerbank\s+worth\s+rs\s*1290/i.test(combinedText)) {
    return {
      priceRs: rawPriceRs,
      regularPriceRs: p.on_sale && rawRegularRs > rawPriceRs ? rawRegularRs : undefined,
      onSale: Boolean(p.on_sale),
      hasPromo: true,
      promoBadge: 'Free Baseus Powerbank (Worth Rs 1,290)',
    };
  }

  // 6. 2 Sets of 3 Pcs (6 Suitcases bundle)
  if (/2\s*sets\s*of\s*3pcs/i.test(name)) {
    return {
      priceRs: rawPriceRs,
      regularPriceRs: p.on_sale && rawRegularRs > rawPriceRs ? rawRegularRs : undefined,
      onSale: Boolean(p.on_sale),
      hasPromo: true,
      promoBadge: 'Bundle: 2 Sets of 3 Pcs (6 Suitcases)',
    };
  }

  // 6b. Set of 3 Medium (e.g. Jamaica Medium 3 pcs at Rs 11,990)
  if (/medium\s*3\s*pcs|3\s*medium/i.test(name)) {
    const isActivelyOnSale = Boolean(p.on_sale && rawRegularRs > rawPriceRs);
    const diff = isActivelyOnSale ? rawRegularRs - rawPriceRs : 0;
    return {
      priceRs: rawPriceRs,
      regularPriceRs: isActivelyOnSale ? rawRegularRs : undefined,
      onSale: isActivelyOnSale,
      hasPromo: true,
      promoBadge:
        diff > 0
          ? `Set of 3 Medium (3 × 69cm) · Save Rs ${diff.toLocaleString('en-MU')}`
          : 'Set of 3 Medium (3 × 69cm)',
    };
  }

  // 7. Cabin + Large / Cabin + Medium 2-Piece Combos
  if (/cabin\s*\+\s*(large|medium)/i.test(name)) {
    const isActivelyOnSale = Boolean(p.on_sale && rawRegularRs > rawPriceRs);
    const diff = isActivelyOnSale ? rawRegularRs - rawPriceRs : 0;
    return {
      priceRs: rawPriceRs,
      regularPriceRs: isActivelyOnSale ? rawRegularRs : undefined,
      onSale: isActivelyOnSale,
      hasPromo: true,
      promoBadge:
        diff > 0
          ? `2-Piece Combo · Save Rs ${diff.toLocaleString('en-MU')}`
          : '2-Piece Combo (Price for 2)',
    };
  }

  // 8. Standard active WooCommerce sale (on_sale === true)
  if (p.on_sale && rawRegularRs > rawPriceRs) {
    const diff = rawRegularRs - rawPriceRs;
    return {
      priceRs: rawPriceRs,
      regularPriceRs: rawRegularRs,
      onSale: true,
      hasPromo: true,
      promoBadge: `On Sale · Save Rs ${diff.toLocaleString('en-MU')}`,
    };
  }

  return {
    priceRs: rawPriceRs,
    regularPriceRs: undefined,
    onSale: false,
    hasPromo: false,
    promoBadge: undefined,
  };
}

let cachedCatalog: any[] = INITIAL_ABDESAI_PRODUCTS;
let lastSyncIso: string | null = null;

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

const CHANGE_LOG_FILE = path.join(__dirname, '.abdesai-change-alerts.json');

function loadPersistedChanges(): CatalogChangeEvent[] {
  try {
    if (fs.existsSync(CHANGE_LOG_FILE)) {
      const raw = fs.readFileSync(CHANGE_LOG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt file
  }
  return [];
}

function savePersistedChanges(events: CatalogChangeEvent[]) {
  try {
    fs.writeFileSync(
      CHANGE_LOG_FILE,
      JSON.stringify(events.slice(0, 250), null, 2),
      'utf-8'
    );
  } catch {
    // ignore write failure
  }
}

let catalogChangeHistory: CatalogChangeEvent[] = loadPersistedChanges();

function diffCatalogSnapshots(
  prevList: any[],
  nextList: any[],
  detectedAtIso: string
): CatalogChangeEvent[] {
  const newEvents: CatalogChangeEvent[] = [];
  const prevMap = new Map<number, any>(prevList.map((p) => [Number(p.id), p]));
  const nextMap = new Map<number, any>(nextList.map((p) => [Number(p.id), p]));

  for (const nextItem of nextList) {
    const id = Number(nextItem.id);
    const oldItem = prevMap.get(id);

    if (!oldItem) {
      newEvents.push({
        id: `chg-${id}-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        detectedAt: detectedAtIso,
        type: 'new_product',
        productId: id,
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
        summary: `NEW PRODUCT ADDED on abdesai.mu: ${nextItem.name} (${nextItem.series} · ${nextItem.sizeCategory}) at Rs ${Number(
          nextItem.priceRs
        ).toLocaleString('en-MU')}`,
      });
      continue;
    }

    // 1. Price change check
    if (
      Number(oldItem.priceRs) !== Number(nextItem.priceRs) &&
      Number(nextItem.priceRs) > 0
    ) {
      const isDrop = Number(nextItem.priceRs) < Number(oldItem.priceRs);
      const diff = Math.abs(Number(nextItem.priceRs) - Number(oldItem.priceRs));
      newEvents.push({
        id: `chg-${id}-price-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        detectedAt: detectedAtIso,
        type: isDrop ? 'price_drop' : 'price_increase',
        productId: id,
        productName: nextItem.name,
        series: nextItem.series,
        sizeCategory: nextItem.sizeCategory,
        sku: nextItem.sku,
        image: nextItem.image,
        permalink: nextItem.permalink,
        oldPriceRs: oldItem.priceRs,
        newPriceRs: nextItem.priceRs,
        oldRegularPriceRs: oldItem.regularPriceRs,
        newRegularPriceRs: nextItem.regularPriceRs,
        summary: `${
          isDrop ? 'PRICE DROP' : 'PRICE UPDATE'
        } on abdesai.mu: ${nextItem.name} changed from Rs ${Number(
          oldItem.priceRs
        ).toLocaleString('en-MU')} → Rs ${Number(
          nextItem.priceRs
        ).toLocaleString('en-MU')} (${isDrop ? '-' : '+'}Rs ${diff.toLocaleString(
          'en-MU'
        )})`,
      });
    }

    // 2. Promo / Title offer change check
    const oldPromo = String(oldItem.promoBadge || '');
    const newPromo = String(nextItem.promoBadge || '');
    if (
      oldPromo !== newPromo &&
      Number(oldItem.priceRs) === Number(nextItem.priceRs)
    ) {
      newEvents.push({
        id: `chg-${id}-promo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        detectedAt: detectedAtIso,
        type: 'promo_change',
        productId: id,
        productName: nextItem.name,
        series: nextItem.series,
        sizeCategory: nextItem.sizeCategory,
        sku: nextItem.sku,
        image: nextItem.image,
        permalink: nextItem.permalink,
        oldPriceRs: oldItem.priceRs,
        newPriceRs: nextItem.priceRs,
        oldPromoBadge: oldPromo || 'Standard Retail',
        newPromoBadge: newPromo || 'Standard Retail',
        summary: `PROMO UPDATE on abdesai.mu: ${nextItem.name} — ${
          newPromo ? `New Offer: "${newPromo}"` : `Offer ended (was "${oldPromo}")`
        }`,
      });
    }

    // 3. Stock status change check
    if (Boolean(oldItem.inStock) !== Boolean(nextItem.inStock)) {
      const restocked = Boolean(nextItem.inStock);
      newEvents.push({
        id: `chg-${id}-stock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        detectedAt: detectedAtIso,
        type: restocked ? 'stock_restocked' : 'stock_out',
        productId: id,
        productName: nextItem.name,
        series: nextItem.series,
        sizeCategory: nextItem.sizeCategory,
        sku: nextItem.sku,
        image: nextItem.image,
        permalink: nextItem.permalink,
        oldPriceRs: oldItem.priceRs,
        newPriceRs: nextItem.priceRs,
        oldInStock: Boolean(oldItem.inStock),
        newInStock: Boolean(nextItem.inStock),
        summary: `${
          restocked ? 'BACK IN STOCK' : 'OUT OF STOCK'
        } on abdesai.mu: ${nextItem.name} (Rs ${Number(
          nextItem.priceRs
        ).toLocaleString('en-MU')})`,
      });
    }
  }

  // Check if any product was removed from the American Tourister category
  for (const oldItem of prevList) {
    const id = Number(oldItem.id);
    if (!nextMap.has(id)) {
      newEvents.push({
        id: `chg-${id}-removed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        detectedAt: detectedAtIso,
        type: 'removed_product',
        productId: id,
        productName: oldItem.name,
        series: oldItem.series,
        sizeCategory: oldItem.sizeCategory,
        sku: oldItem.sku,
        image: oldItem.image,
        permalink: oldItem.permalink,
        oldPriceRs: oldItem.priceRs,
        summary: `REMOVED FROM CATALOG on abdesai.mu: ${oldItem.name} (was Rs ${Number(
          oldItem.priceRs
        ).toLocaleString('en-MU')})`,
      });
    }
  }

  return newEvents;
}

async function fetchLiveAbDesaiCatalog() {
  const ts = Date.now();
  const byId = new Map<number, any>();
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://abdesai.mu/wp-json/wc/store/products?tag=359&per_page=100&page=${page}&_=${ts}`,
      {
        headers: {
          'User-Agent': 'ABDesai-Storefront-Sync/1.0',
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
      }
    );
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    for (const item of data) {
      byId.set(Number(item.id), item);
    }
    if (data.length < 100) break;
  }

  // Also query search="american tourister" so any new product published without tag=359 is still captured
  for (let page = 1; page <= 4; page++) {
    const res = await fetch(
      `https://abdesai.mu/wp-json/wc/store/products?search=american+tourister&per_page=100&page=${page}&_=${ts}`,
      {
        headers: {
          'User-Agent': 'ABDesai-Storefront-Sync/1.0',
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
      }
    );
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    for (const item of data) {
      if (/american\s+tourister/i.test(String(item.name || ''))) {
        byId.set(Number(item.id), item);
      }
    }
    if (data.length < 100) break;
  }

  // Filter out expired BOGO promo-only listings where WooCommerce on_sale has been turned off (e.g. Senna BOGO 55950)
  const all = Array.from(byId.values()).filter((p) => {
    const rawName = decodeEntities(p.name || '');
    if (/buy\s*one\s*get\s*one\s*free/i.test(rawName) && !p.on_sale) {
      return false;
    }
    return true;
  });
  if (all.length === 0) {
    throw new Error('Empty response from abdesai.mu WooCommerce API');
  }

  const normalized = all.map((p) => {
    const name = decodeEntities(p.name);
    const series = detectSeries(name, p.tags);
    const sizeCategory = detectSizeCategory(name);

    const rawDesc = decodeEntities(
      `${p.description || ''} ${p.short_description || ''}`
    )
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\*\s*customers are requested[\s\S]*$/i, '')
      .replace(/Product measurements published on this website[\s\S]*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    const { priceRs, regularPriceRs, onSale, hasPromo, promoBadge } =
      resolvePriceAndPromo(p, name, rawDesc);

    const initialMatch = INITIAL_ABDESAI_PRODUCTS.find((ip) => ip.id === p.id);
    const seriesPeerMatch = INITIAL_ABDESAI_PRODUCTS.find(
      (ip) => ip.series === series && ip.image
    );
    const primaryImage =
      p.images?.[0]?.src ||
      initialMatch?.image ||
      seriesPeerMatch?.image ||
      'https://abdesai.mu/wp-content/uploads/2026/10/Senna-generic.webp';
    const rawGallery = (p.images || []).map((i: any) => i.src).filter(Boolean);

    return {
      id: p.id,
      name,
      slug: p.slug,
      sku: p.sku || `AT-${p.id}`,
      series,
      sizeCategory,
      priceRs,
      regularPriceRs,
      onSale,
      hasPromo,
      promoBadge,
      inStock: Boolean(p.is_in_stock),
      permalink: p.permalink,
      image: primaryImage,
      gallery: rawGallery.length > 0 ? rawGallery : [primaryImage],
      specsText:
        rawDesc ||
        'Official American Tourister luggage with 3-Year Global Warranty in 120+ countries.',
    };
  });

  const nowIso = new Date().toISOString();
  const detectedEvents = diffCatalogSnapshots(
    cachedCatalog,
    normalized,
    nowIso
  );
  if (detectedEvents.length > 0) {
    catalogChangeHistory = [...detectedEvents, ...catalogChangeHistory].slice(
      0,
      250
    );
    savePersistedChanges(catalogChangeHistory);
  }

  cachedCatalog = normalized;
  lastSyncIso = nowIso;
  return {
    products: normalized,
    syncedAt: lastSyncIso,
    newEvents: detectedEvents,
    changeHistory: catalogChangeHistory,
  };
}

function injectDynamicOpenGraph(html: string, productSlug?: string): string {
  const prod = productSlug
    ? cachedCatalog.find(
        (p) => p.slug === productSlug || String(p.id) === productSlug
      )
    : null;

  if (!prod) {
    return html;
  }

  const priceFormatted = `Rs ${Number(prod.priceRs).toLocaleString('en-MU')}`;
  const title = `${prod.name} — ${priceFormatted} | Shop Now at AB Desai Mauritius`;
  const desc = `${
    prod.promoBadge ? `${prod.promoBadge} · ` : ''
  }Click to view & order ${prod.name} (${priceFormatted}) · WhatsApp +230 5979 7960 (Confirm availability before payment · Home deliveries up to 10 days).`;
  const imgUrl = prod.image || 'https://abdesai.mu/wp-content/uploads/2026/09/Sktrac-Large-offer.webp';

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlAttr(title)}</title>`)
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtmlAttr(title)}" />`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${escapeHtmlAttr(title)}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtmlAttr(desc)}" />`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${escapeHtmlAttr(desc)}" />`
    )
    .replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${escapeHtmlAttr(imgUrl)}" />`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${escapeHtmlAttr(imgUrl)}" />`
    );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory LRU-like cache for proxied product images so Shelf Talker & Excel exports are instant and never fail due to upstream rate limits
  const imageProxyCache = new Map<string, { contentType: string; buffer: Buffer }>();

  // Image proxy so HTML5 canvas & print sheets can render high-resolution cards with abdesai.mu product photos without CORS taint or hotlink blocks
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const rawUrl = String(req.query.url || '').trim();
      if (!/^https?:\/\/(?:www\.)?abdesai\.mu\//i.test(rawUrl)) {
        res.status(400).send('Invalid image URL');
        return;
      }
      const targetUrl = rawUrl.replace(/^http:\/\//i, 'https://');
      const cached = imageProxyCache.get(targetUrl);
      if (cached) {
        res.setHeader('Content-Type', cached.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(cached.buffer);
        return;
      }

      const upstream = await fetch(targetUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          Referer: 'https://abdesai.mu/',
        },
      });
      if (!upstream.ok) {
        res.status(upstream.status).send('Upstream image error');
        return;
      }
      const contentType = upstream.headers.get('content-type') || 'image/webp';
      const arrayBuffer = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (imageProxyCache.size > 300) {
        const oldestKey = imageProxyCache.keys().next().value;
        if (oldestKey) imageProxyCache.delete(oldestKey);
      }
      imageProxyCache.set(targetUrl, { contentType, buffer });

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch {
      res.status(500).send('Image proxy failed');
    }
  });

  app.get('/api/abdesai-sync', async (_req, res) => {
    try {
      const result = await fetchLiveAbDesaiCatalog();
      res.json({
        ok: true,
        source: 'https://abdesai.mu/wp-json/wc/store/products?tag=359',
        count: result.products.length,
        syncedAt: result.syncedAt,
        products: result.products,
        newEvents: result.newEvents,
        changeHistory: result.changeHistory,
      });
    } catch (err: any) {
      if (cachedCatalog) {
        res.json({
          ok: true,
          cached: true,
          source: 'https://abdesai.mu/wp-json/wc/store/products?tag=359',
          count: cachedCatalog.length,
          syncedAt: lastSyncIso,
          products: cachedCatalog,
          newEvents: [],
          changeHistory: catalogChangeHistory,
        });
      } else {
        res.status(502).json({
          ok: false,
          error: err?.message || 'Failed to sync from abdesai.mu',
        });
      }
    }
  });

  app.post('/api/abdesai-alerts-clear', (_req, res) => {
    catalogChangeHistory = [];
    savePersistedChanges([]);
    res.json({ ok: true, changeHistory: [] });
  });

  // Background automatic monitor every 2 minutes so changes on abdesai.mu are captured even if no browser tab is open
  setInterval(() => {
    fetchLiveAbDesaiCatalog().catch(() => {
      // ignore transient network errors
    });
  }, 2 * 60 * 1000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    // Inject dynamic OpenGraph tags when a shared link (?product=slug) is requested
    app.get('/', async (req, res, next) => {
      const productParam = typeof req.query.product === 'string' ? req.query.product : undefined;
      if (!productParam) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const html = injectDynamicOpenGraph(template, productParam);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
      const productParam = typeof req.query.product === 'string' ? req.query.product : undefined;
      const html = injectDynamicOpenGraph(template, productParam);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AB Desai American Tourister Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
