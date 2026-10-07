import fs from 'fs';

async function main() {
  const all: any[] = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(
      `https://abdesai.mu/wp-json/wc/store/products?tag=359&per_page=100&page=${page}`
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
  }

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

  function detectSeries(name: string, tags: any[]): string {
    const tagList = (tags || []).map((t) => String(t.name).toLowerCase());
    const n = name.toLowerCase();
    if (n.includes('skytrac') || tagList.includes('skytrac')) return 'Skytrac';
    if (n.includes('dashway') || tagList.includes('dashway')) return 'Dashway';
    if (n.includes('dash pop') || n.includes('dashpop') || tagList.includes('dashpop'))
      return 'Dash Pop';
    if (n.includes('jamaica') || tagList.includes('jamaica')) return 'Jamaica';
    if (n.includes('duncan') || tagList.includes('duncan')) return 'Duncan';
    if (n.includes('bricklane') || tagList.includes('bricklane')) return 'Bricklane';
    if (n.includes('novastream') || tagList.includes('novastream')) return 'Novastream';
    if (n.includes('gemina') || tagList.includes('gemina')) return 'Gemina Pro';
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
    if (n.includes('cosmo') || n.includes('duffle')) return 'Duffle & Cabin Bags';
    if (
      n.includes('backpack') ||
      n.includes('sest') ||
      n.includes('mate') ||
      n.includes('zork') ||
      n.includes('segno')
    )
      return 'Backpacks';
    return 'American Tourister';
  }

  function detectSizeCategory(name: string): string {
    const n = name.toLowerCase();
    if (/set\s*of\s*3|set3|3\s*pcs/i.test(n)) return 'Set of 3';
    if (/cabin\s*\+\s*large|cabin\s*\+\s*medium|2\s*units|buy\s*one/i.test(n))
      return 'Combo / 2-Pack';
    if (/xlarge|x-large|80cm|79cm|78cm|77cm|\blarge\b|\s+l\s+/i.test(n))
      return 'Large / X-Large';
    if (/medium|68cm|67cm|69cm|\s+m\s+/i.test(n)) return 'Medium';
    if (/cabin|55cm|56cm|57cm/i.test(n)) return 'Cabin';
    if (/backpack|duffle/i.test(n)) return 'Backpack & Duffle';
    return 'Individual Suitcase';
  }

  function extractPromoBadge(
    name: string,
    onSale: boolean,
    regularPriceRs: number | undefined,
    priceRs: number
  ): string | undefined {
    const n = name;
    if (/buy one get one free/i.test(n)) return 'Buy 1 Get 1 Free (2 Units)';
    if (/half price/i.test(n)) return '2nd at Half Price (50% Off)';
    if (/2 sets of 3pcs/i.test(n)) return 'Promo: 2 Sets of 3 Pcs';
    if (/free .* copper bottle/i.test(n)) return 'Free Copper Bottle (Worth Rs 1,395)';
    if (/free .* rice cooker/i.test(n)) return 'Free Travel Rice Cooker (Worth Rs 1,390)';
    if (/cabin\s*\+\s*large/i.test(n)) return 'Cabin + Large Combo Deal';
    if (/cabin\s*\+\s*medium/i.test(n)) return 'Cabin + Medium Combo Deal';
    if (regularPriceRs && regularPriceRs > priceRs) {
      return `Save Rs ${(regularPriceRs - priceRs).toLocaleString('en-MU')}`;
    }
    if (onSale) return 'Special Promo';
    return undefined;
  }

  const normalized = all.map((p) => {
    const name = decodeEntities(p.name);
    const pPrice = Number(p.prices?.price || 0) / 100;
    const pReg = Number(p.prices?.regular_price || 0) / 100;
    const pSale = Number(p.prices?.sale_price || 0) / 100;

    const effectivePrice = pSale > 0 && pSale < pPrice ? pSale : pPrice;
    const effectiveRegular = Math.max(pReg, pPrice);
    const hasDiscount = effectiveRegular > effectivePrice;
    const series = detectSeries(name, p.tags);
    const sizeCategory = detectSizeCategory(name);
    const promoBadge = extractPromoBadge(
      name,
      p.on_sale,
      hasDiscount ? effectiveRegular : undefined,
      effectivePrice
    );

    const rawDesc = (p.description || p.short_description || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\* customers are requested.*$/i, '')
      .trim();

    return {
      id: p.id,
      name,
      slug: p.slug,
      sku: p.sku || `AT-${p.id}`,
      series,
      sizeCategory,
      priceRs: effectivePrice,
      regularPriceRs: hasDiscount ? effectiveRegular : undefined,
      hasPromo: Boolean(promoBadge || hasDiscount),
      promoBadge,
      inStock: Boolean(p.is_in_stock),
      permalink: p.permalink,
      image: p.images?.[0]?.src || '',
      gallery: (p.images || []).map((i: any) => i.src).filter(Boolean),
      specsText:
        rawDesc.slice(0, 260) ||
        'Official American Tourister luggage with 3-Year Global Warranty in 120+ countries.',
    };
  });

  normalized.sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    if (a.hasPromo !== b.hasPromo) return a.hasPromo ? -1 : 1;
    return b.id - a.id;
  });

  const tsContent = `// AUTO-GENERATED & LIVE-SYNCED WITH https://abdesai.mu/wp-json/wc/store/products?tag=359
export type SizeCategoryFilter =
  | 'All'
  | 'Set of 3'
  | 'Combo / 2-Pack'
  | 'Large / X-Large'
  | 'Medium'
  | 'Cabin'
  | 'Backpack & Duffle';

export interface AbDesaiATProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  series: string;
  sizeCategory: string;
  priceRs: number;
  regularPriceRs?: number;
  hasPromo: boolean;
  promoBadge?: string;
  inStock: boolean;
  permalink: string;
  image: string;
  gallery: string[];
  specsText: string;
}

export interface ShowroomLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  note: string;
}

export const SHOWROOMS: ShowroomLocation[] = [
  {
    id: 'port-louis',
    name: 'Port Louis Flagship & After-Sales',
    address: '9, Corderie Street, Port Louis, Mauritius',
    phone: '+230 211 4114',
    hours: 'Mon–Fri: 09:30–16:30 · Sat: 09:30–14:00',
    note: 'Official American Tourister Warranty & After-Sales Service (2nd Floor)',
  },
  {
    id: 'tribeca',
    name: 'Tribeca Mall Showroom',
    address: 'First Floor, Tribeca Mall, Trianon 72261',
    phone: '+230 5466 4114',
    hours: 'Mon–Sat: 10:00–20:00 · Sun & Public Holidays: 10:00–15:00',
    note: 'Full American Tourister Luggage & Promo Sets Gallery',
  },
  {
    id: 'trianon',
    name: 'La City Trianon Boutique',
    address: 'La City Trianon Shopping Park, Trianon',
    phone: '+230 463 7591',
    hours: 'Mon–Sat: 09:30–19:30 · Sun: 09:30–15:00',
    note: 'Same-day Click & Collect pickup available',
  },
  {
    id: 'rose-hill',
    name: 'Rose Hill Magic Lantern',
    address: 'First Floor, Magic Lantern Complex, Royal Road, Rose Hill',
    phone: '+230 463 1582',
    hours: 'Mon–Sat: 09:30–17:30 · Sun: Closed',
    note: 'American Tourister Sets, Combos & Cabin Specials',
  },
];

export const INITIAL_ABDESAI_PRODUCTS: AbDesaiATProduct[] = ${JSON.stringify(
    normalized,
    null,
    2
  )};

export function formatRs(amount: number): string {
  return \`Rs \${amount.toLocaleString('en-MU')}\`;
}
`;

  fs.writeFileSync('./src/data/luggageCatalog.ts', tsContent);
  console.log('Successfully generated src/data/luggageCatalog.ts with', normalized.length, 'items.');
}

main();
