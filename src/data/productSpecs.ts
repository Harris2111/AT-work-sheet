import { AbDesaiATProduct } from './luggageCatalog';

export type LuggageSizeClass =
  | 'Cabin'
  | 'Medium'
  | 'Large'
  | 'X-Large'
  | 'Set of 3'
  | 'Combo / 2-Pack'
  | 'Backpack & Duffle';

export interface ProductSpecData {
  sizeClass: LuggageSizeClass;
  sizeHeaderBadge: string; // e.g. "CABIN (55CM)", "MEDIUM (69CM)", "LARGE (80CM)", "X-LARGE (81CM)"
  dimensionsCm: string; // e.g. "55 × 36 × 24 cm"
  volumeLitres: string; // e.g. "35 L" or "77 / 85 L (Exp)"
  weightKg: string; // e.g. "3.1 kg"
  material: string; // e.g. "Hard-Side Polypropylene (PP)"
  wheels: string; // e.g. "360° Double Spinner Wheels"
  lock: string; // e.g. "Recessed TSA Combination Lock"
  warranty: string; // e.g. "3-Year Global Warranty (120+ Countries)"
  availableColours: string[]; // All colours available in this series for this size
}

// Determines the specific size label (Cabin / Medium / Large / X-Large / Set of 3 / Combo / Backpack & Duffle)
export function getExactSizeClass(item: AbDesaiATProduct): LuggageSizeClass {
  const n = item.name.toLowerCase();
  const s = item.series.toLowerCase();

  if (
    item.sizeCategory === 'Set of 3' ||
    /set\s*of\s*3|set\s*3|set3|\b3\s*pcs\b|\b3\s*units\b/i.test(n)
  ) {
    return 'Set of 3';
  }
  if (
    item.sizeCategory === 'Combo / 2-Pack' ||
    /cabin\s*\+\s*(?:medium|large)|buy\s*one\s*get\s*one|get\s*the\s*second\s*one/i.test(
      n
    )
  ) {
    return 'Combo / 2-Pack';
  }
  if (
    item.sizeCategory === 'Backpack & Duffle' ||
    s.includes('backpack') ||
    s.includes('duffle') ||
    /backpack|briefcase|tote|dbag|duffle/i.test(n)
  ) {
    return 'Backpack & Duffle';
  }

  // Distinguish X-Large vs Large explicitly as requested ("cabin, medium, large or xlarge")
  if (/\bx-?large\b|\bxl\b|81\s*cm|82\s*cm/i.test(n)) {
    return 'X-Large';
  }
  if (/\blarge\b|\bl\b|80\s*cm|79\s*cm|78\s*cm|77\s*cm|75\s*cm/i.test(n)) {
    return 'Large';
  }
  if (/\bmedium\b|\bm\b|69\s*cm|68\s*cm|67\s*cm|66\s*cm/i.test(n)) {
    return 'Medium';
  }
  if (/\bcabin\b|\bc\b|55\s*cm|56\s*cm|57\s*cm|58\s*cm|59\s*cm|50\s*cm/i.test(n)) {
    return 'Cabin';
  }

  if (item.sizeCategory === 'Cabin') return 'Cabin';
  if (item.sizeCategory === 'Medium') return 'Medium';
  return 'Large';
}

interface SeriesSizeTable {
  material: string;
  wheels: string;
  lock: string;
  Cabin?: { dim: string; vol: string; wt: string; badge: string };
  Medium?: { dim: string; vol: string; wt: string; badge: string };
  Large?: { dim: string; vol: string; wt: string; badge: string };
  'X-Large'?: { dim: string; vol: string; wt: string; badge: string };
  'Set of 3'?: { dim: string; vol: string; wt: string; badge: string };
  'Combo / 2-Pack'?: { dim: string; vol: string; wt: string; badge: string };
}

const SERIES_SPECS_DB: Record<string, SeriesSizeTable> = {
  Bricklane: {
    material: 'Hard-Side ABS / Polycarbonate Shell',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Fixed 3-Digit Combination Lock',
    Cabin: {
      dim: '55 × 36 × 24 cm',
      vol: '35 L',
      wt: '3.1 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '69 × 46 × 31 cm',
      vol: '72 L',
      wt: '3.9 kg',
      badge: 'MEDIUM SIZE (69CM)',
    },
    Large: {
      dim: '80 × 53 × 35 cm',
      vol: '113 L',
      wt: '4.7 kg',
      badge: 'LARGE SIZE (80CM)',
    },
    'X-Large': {
      dim: '80 × 53 × 35 cm',
      vol: '113 L',
      wt: '4.7 kg',
      badge: 'LARGE / XL SIZE (80CM)',
    },
  },
  Skytrac: {
    material: 'Hard-Side High-Strength ABS (Vacuum)',
    wheels: '360° Multi-Directional Spinner Wheels',
    lock: 'Fixed 3-Dial Combination Lock',
    Cabin: {
      dim: '55 × 36 × 24 cm',
      vol: '32 L',
      wt: '2.7 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '68 × 46 × 29 cm',
      vol: '68 L',
      wt: '3.6 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
    Large: {
      dim: '79 × 54 × 33 cm',
      vol: '102 L',
      wt: '4.8 kg',
      badge: 'LARGE SIZE (79CM)',
    },
    'Set of 3': {
      dim: '55cm + 68cm + 79cm (3 Sizes)',
      vol: '202 L Total (32L+68L+102L)',
      wt: '2.7 / 3.6 / 4.8 kg',
      badge: 'SET OF 3 (55+68+79CM)',
    },
  },
  Jamaica: {
    material: 'High-Density Tear-Resistant Polyester',
    wheels: '360° Smooth Spinner Wheels',
    lock: 'TSA 3-Dial Combination Lock',
    Cabin: {
      dim: '57 × 36 × 24 cm (Exp)',
      vol: '42 / 46 L (Exp)',
      wt: '2.1 kg',
      badge: 'CABIN SIZE (57CM)',
    },
    Medium: {
      dim: '69 × 46 × 33 cm (Exp)',
      vol: '78 / 85 L (Exp)',
      wt: '2.9 kg',
      badge: 'MEDIUM SIZE (69CM)',
    },
    'X-Large': {
      dim: '80 × 49 × 34 cm (Exp)',
      vol: '118 / 126 L (Exp)',
      wt: '3.9 kg',
      badge: 'X-LARGE SIZE (80CM)',
    },
    Large: {
      dim: '80 × 49 × 34 cm (Exp)',
      vol: '118 / 126 L (Exp)',
      wt: '3.9 kg',
      badge: 'X-LARGE SIZE (80CM)',
    },
    'Set of 3': {
      dim: '3 × 69 × 46 × 33 cm (Exp)',
      vol: '234/255 L (3×85L)',
      wt: '2.9 kg × 3',
      badge: 'SET OF 3 MEDIUM (3 × 69CM)',
    },
    'Combo / 2-Pack': {
      dim: '57cm Cabin + 80cm X-Large',
      vol: '42L + 118L (160L Total)',
      wt: '2.1 kg + 3.9 kg',
      badge: 'CABIN + X-LARGE COMBO',
    },
  },
  'Dash Pop': {
    material: '100% Polypropylene (HS Injection + rPET)',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Recessed TSA Combination Lock',
    Cabin: {
      dim: '55 × 40 × 20/23 cm (Exp)',
      vol: '41 / 47 L (Exp)',
      wt: '2.5 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '67 × 45 × 28/32 cm (Exp)',
      vol: '76 / 84 L (Exp)',
      wt: '3.3 kg',
      badge: 'MEDIUM SIZE (67CM)',
    },
    Large: {
      dim: '77 × 50 × 30/33 cm (Exp)',
      vol: '104 / 121 L (Exp)',
      wt: '3.7 kg',
      badge: 'LARGE SIZE (77CM)',
    },
    'Combo / 2-Pack': {
      dim: '55cm Cabin + 67cm Medium',
      vol: '41/47L + 76/84L (Exp)',
      wt: '2.5 kg + 3.3 kg',
      badge: 'CABIN + MEDIUM 2-PC SET',
    },
  },
  Dashway: {
    material: 'High-Density Softside Polyester (Expandable)',
    wheels: '8-Wheel 360° Double Spinner System',
    lock: 'Recessed 3-Dial Combination Lock',
    Cabin: {
      dim: '58 × 40 × 23 cm (Exp)',
      vol: '44 / 49 L (Exp)',
      wt: '2.5 kg',
      badge: 'CABIN SIZE (58CM)',
    },
    Medium: {
      dim: '70 × 46 × 25 cm (Exp)',
      vol: '76 / 84 L (Exp)',
      wt: '3.6 kg',
      badge: 'MEDIUM SIZE (70CM)',
    },
    'X-Large': {
      dim: '82 × 50 × 32 cm (Exp)',
      vol: '118 / 128 L (Exp)',
      wt: '4.3 kg',
      badge: 'X-LARGE SIZE (82CM)',
    },
    Large: {
      dim: '82 × 50 × 32 cm (Exp)',
      vol: '118 / 128 L (Exp)',
      wt: '4.3 kg',
      badge: 'X-LARGE SIZE (82CM)',
    },
    'Set of 3': {
      dim: '58cm + 70cm + 82cm (3 Sizes)',
      vol: '238 L Total (44L+76L+118L)',
      wt: '2.5 / 3.6 / 4.3 kg',
      badge: 'SET OF 3 (58+70+82CM)',
    },
  },
  Maxplus: {
    material: '100% Impact-Resistant Polypropylene + rPET',
    wheels: '360° Multidirectional Double Wheels',
    lock: 'Standard TSA Combination Lock',
    Cabin: {
      dim: '55 × 37 × 23 cm',
      vol: '31 L',
      wt: '2.7 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '69 × 47 × 29 cm',
      vol: '68 L',
      wt: '3.5 kg',
      badge: 'MEDIUM SIZE (69CM)',
    },
    Large: {
      dim: '79 × 56 × 34 cm',
      vol: '112 L',
      wt: '4.5 kg',
      badge: 'LARGE SIZE (79CM)',
    },
    'Set of 3': {
      dim: '55cm + 69cm + 79cm (3 Sizes)',
      vol: '211 L Total (31L+68L+112L)',
      wt: '2.7 / 3.5 / 4.5 kg',
      badge: 'SET OF 3 (55+69+79CM)',
    },
  },
  Mystic: {
    material: 'Lightweight Durable Softside Polyester',
    wheels: '360° Smooth Spinner Wheels',
    lock: 'Fixed 3-Dial Combination Lock',
    Cabin: {
      dim: '56 × 36 × 23 cm (Exp)',
      vol: '40 / 45 L (Exp)',
      wt: '2.2 kg',
      badge: 'CABIN SIZE (56CM)',
    },
    Medium: {
      dim: '68 × 43 × 28 cm (Exp)',
      vol: '72 / 79 L (Exp)',
      wt: '2.9 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
    Large: {
      dim: '79 × 48 × 32 cm (Exp)',
      vol: '110 / 120 L (Exp)',
      wt: '3.7 kg',
      badge: 'LARGE SIZE (79CM)',
    },
    'Set of 3': {
      dim: '56cm + 68cm + 79cm (3 Sizes)',
      vol: '222 L Total (40L+72L+110L)',
      wt: '2.2 / 2.9 / 3.7 kg',
      badge: 'SET OF 3 (56+68+79CM)',
    },
  },
  'Gemina Pro': {
    material: '100% Polycarbonate · Duosaf™ Zipper · Cup Holder',
    wheels: 'Optimov™ Shock-Absorbing + StePause™ Stopper',
    lock: 'TSA 008 Combi Lock (USB A/C on Cabin)',
    Cabin: {
      dim: '55 × 36 × 24/27 cm (Exp)',
      vol: '38 / 44 L (Exp)',
      wt: '2.8 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '67 × 46 × 28/31 cm (Exp)',
      vol: '73 / 82 L (Exp)',
      wt: '3.7 kg',
      badge: 'MEDIUM SIZE (67CM)',
    },
    Large: {
      dim: '75 × 52 × 32/35 cm (Exp)',
      vol: '108 / 120 L (Exp)',
      wt: '4.5 kg',
      badge: 'LARGE SIZE (75CM)',
    },
  },
  Duncan: {
    material: 'Rich Cozy Polyester Fabric with Dobby Trims',
    wheels: '360° Smooth Rolling Spinner Wheels',
    lock: 'Fixed 3-Dial Combination Lock',
    Cabin: {
      dim: '55 × 36 × 24 cm (Exp)',
      vol: '56 L (Exp)',
      wt: '2.1 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '68 × 42 × 30 cm (Exp)',
      vol: '85 L (Exp)',
      wt: '3.0 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
    'X-Large': {
      dim: '81 × 49 × 34 cm (Exp)',
      vol: '128 L (Exp)',
      wt: '3.9 kg',
      badge: 'X-LARGE SIZE (81CM)',
    },
    Large: {
      dim: '81 × 49 × 34 cm (Exp)',
      vol: '128 L (Exp)',
      wt: '3.9 kg',
      badge: 'X-LARGE SIZE (81CM)',
    },
    'Set of 3': {
      dim: '55cm + 68cm + 81cm (3 Sizes)',
      vol: '269 L Total (56L+85L+128L)',
      wt: '2.1 / 3.0 / 3.9 kg',
      badge: 'SET OF 3 (55+68+81CM)',
    },
  },
  Hundo: {
    material: '100% Polypropylene + Microban® rPET Lining',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Recessed TSA Combination Lock',
    Cabin: {
      dim: '55 × 36 × 24 cm',
      vol: '36 L',
      wt: '2.6 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '68 × 46 × 29/32 cm (Exp)',
      vol: '73 / 81 L (Exp)',
      wt: '3.6 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
    'X-Large': {
      dim: '79 × 53 × 32/35 cm (Exp)',
      vol: '110 / 122 L (Exp)',
      wt: '4.5 kg',
      badge: 'X-LARGE SIZE (79CM)',
    },
    Large: {
      dim: '79 × 53 × 32/35 cm (Exp)',
      vol: '110 / 122 L (Exp)',
      wt: '4.5 kg',
      badge: 'X-LARGE SIZE (79CM)',
    },
    'Set of 3': {
      dim: '55cm + 68cm + 79cm (3 Sizes)',
      vol: '219 L Total (36L+73L+110L)',
      wt: '2.6 / 3.6 / 4.5 kg',
      badge: 'SET OF 3 (55+68+79CM)',
    },
  },
  Aerospin: {
    material: '100% Polyester Softside + Recycled rPET Lining',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Recessed TSA Combination Lock',
    Cabin: {
      dim: '55 × 40 × 25 cm (Exp)',
      vol: '47 / 51 L (Exp)',
      wt: '1.9 kg (Ultra-Light)',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '69 × 43 × 29/32 cm (Exp)',
      vol: '71 / 80 L (Exp)',
      wt: '2.5 kg (Ultra-Light)',
      badge: 'MEDIUM SIZE (69CM)',
    },
    'X-Large': {
      dim: '80 × 48 × 33 cm (Exp)',
      vol: '106 / 116 L (Exp)',
      wt: '2.8 kg (Ultra-Light)',
      badge: 'X-LARGE SIZE (80CM)',
    },
    Large: {
      dim: '80 × 48 × 33 cm (Exp)',
      vol: '106 / 116 L (Exp)',
      wt: '2.8 kg (Ultra-Light)',
      badge: 'X-LARGE SIZE (80CM)',
    },
  },
  Novastream: {
    material: '100% Polycarbonate + Microban® rPET Lining',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Recessed TSA 008 Lock (USB on Cabin)',
    Cabin: {
      dim: '55 × 40 × 20/23 cm (Exp)',
      vol: '36 / 41 L (Exp)',
      wt: '2.6 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '67 × 45 × 25.5/29.5 cm (Exp)',
      vol: '64 / 73 L (Exp)',
      wt: '3.6 kg',
      badge: 'MEDIUM SIZE (67CM)',
    },
    Large: {
      dim: '77 × 51.5 × 29.5/34 cm (Exp)',
      vol: '103 / 121 L (Exp)',
      wt: '4.3 kg',
      badge: 'LARGE SIZE (77CM)',
    },
  },
  Skylette: {
    material: 'Scratch-Resistant Hard-Side ABS · PlentiVol™ 20:80',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Recessed TSA Combination Lock',
    Cabin: {
      dim: '50 × 40 × 25 cm',
      vol: '35 L',
      wt: '3.1 kg',
      badge: 'CABIN SIZE (50CM)',
    },
    Medium: {
      dim: '68 × 45 × 29.5 cm',
      vol: '58 L',
      wt: '4.0 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
    'X-Large': {
      dim: '81 × 53 × 32.5 cm',
      vol: '115 L',
      wt: '4.8 kg',
      badge: 'X-LARGE SIZE (81CM)',
    },
    Large: {
      dim: '81 × 53 × 32.5 cm',
      vol: '115 L',
      wt: '4.8 kg',
      badge: 'X-LARGE SIZE (81CM)',
    },
    'Set of 3': {
      dim: '50cm + 68cm + 81cm (3 Sizes)',
      vol: '208 L Total (35L+58L+115L)',
      wt: '3.1 / 4.0 / 4.8 kg',
      badge: 'SET OF 3 (50+68+81CM)',
    },
  },
  Senna: {
    material: 'Textured Hard-Side ABS / Polycarbonate Shell',
    wheels: '360° Smooth Spinner Wheels',
    lock: 'Recessed 3-Dial Combination Lock',
    Cabin: {
      dim: '55 × 36 × 24 cm',
      vol: '36 L',
      wt: '2.8 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '69 × 47 × 31/34 cm (Exp)',
      vol: '77 / 85 L (Exp)',
      wt: '4.0 kg',
      badge: 'MEDIUM SIZE (69CM)',
    },
    Large: {
      dim: '79 × 53 × 35/38 cm (Exp)',
      vol: '125 / 136 L (Exp)',
      wt: '4.9 kg',
      badge: 'LARGE SIZE (79CM)',
    },
  },
  Ellipso: {
    material: '100% Polypropylene · Duosaf™ Zipper · Hidden Pocket',
    wheels: '360° Durable Spinner Wheels',
    lock: 'Mounted TSA Combination Lock',
    Cabin: {
      dim: '55 × 36.5 × 25.5 cm',
      vol: '31 L',
      wt: '2.7 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '68 × 46.5 × 29.5 cm',
      vol: '68 L',
      wt: '3.5 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
    Large: {
      dim: '79 × 54.5 × 34.5 cm',
      vol: '112 L',
      wt: '4.5 kg',
      badge: 'LARGE SIZE (79CM)',
    },
    'Set of 3': {
      dim: '55cm + 68cm + 79cm (3 Sizes)',
      vol: '211 L Total (31L+68L+112L)',
      wt: '2.7 / 3.5 / 4.5 kg',
      badge: 'SET OF 3 (55+68+79CM)',
    },
  },
  Majoris: {
    material: '100% High-Denier Polyester (Expandable)',
    wheels: '360° Sturdy Spinner Wheels',
    lock: 'Recessed TSA Combination Lock',
    Cabin: {
      dim: '59 × 41 × 26/28.5 cm (Exp)',
      vol: '42 / 47 L (Exp)',
      wt: '3.3 kg',
      badge: 'CABIN SIZE (59CM)',
    },
    'X-Large': {
      dim: '81 × 51 × 34/38 cm (Exp)',
      vol: '116 / 126 L (Exp)',
      wt: '4.7 kg',
      badge: 'X-LARGE SIZE (81CM)',
    },
    Large: {
      dim: '81 × 51 × 34/38 cm (Exp)',
      vol: '116 / 126 L (Exp)',
      wt: '4.7 kg',
      badge: 'X-LARGE SIZE (81CM)',
    },
  },
  Curio: {
    material: 'HS Polypropylene · Iconic Vinyl Concentric Design',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Recessed TSA Combination Lock',
    Medium: {
      dim: '68 × 45 × 31/36 cm (Exp)',
      vol: '75 / 81 L (Exp)',
      wt: '3.9 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
    Large: {
      dim: '75 × 50 × 33/38 cm (Exp)',
      vol: '98 / 111 L (Exp)',
      wt: '4.2 kg',
      badge: 'LARGE SIZE (75CM)',
    },
  },
  Frontec: {
    material: '100% Polycarbonate · Front Book-Opening · PlentiVol™',
    wheels: 'Optimov™ Shock-Absorbing + StePause™ Brake',
    lock: 'TSA Combination Lock',
    Medium: {
      dim: '68 × 46 × 31/35 cm (Exp)',
      vol: '77 / 88 L (Exp)',
      wt: '4.2 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
  },
  Skypark: {
    material: '100% Scratch & Impact-Resistant ABS',
    wheels: '360° Smooth Spinner Wheels',
    lock: 'Fixed 3-Dial Combination Lock',
    Medium: {
      dim: '66 × 45 × 28 cm',
      vol: '77 L',
      wt: '3.5 kg',
      badge: 'MEDIUM SIZE (66CM)',
    },
  },
  Circurity: {
    material: '100% Polypropylene · 3-Point Frame Lock System',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: '3-Point TSA Frame Lock',
    Large: {
      dim: '77 × 50.5 × 31 cm',
      vol: '95 L',
      wt: '4.8 kg',
      badge: 'LARGE SIZE (77CM)',
    },
  },
  Portland: {
    material: 'High-Strength Travel Fabric + Internal Organizer',
    wheels: '4 Multi-Direction 360° Spinner Wheels',
    lock: 'TSA Combination Lock',
    Cabin: {
      dim: '55 × 36 × 23 cm',
      vol: '48 L',
      wt: '3.2 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '68 × 48 × 29 cm',
      vol: '68 L',
      wt: '3.9 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
  },
  Robotech: {
    material: '100% Polycarbonate · PlentiVol™ + Duosaf™ Zipper',
    wheels: '360° Double Spinner Wheels',
    lock: 'Recessed TSA Combi Lock',
    Medium: {
      dim: '67 × 45 × 29 cm',
      vol: '74 L',
      wt: '4.0 kg',
      badge: 'MEDIUM SIZE (67CM)',
    },
  },
  Trento: {
    material: 'High-Grade Lightweight Polycarbonate (Expandable)',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Recessed TSA Combination Lock',
    Cabin: {
      dim: '55 × 36 × 24 cm (Exp)',
      vol: '36 / 42 L (Exp)',
      wt: '2.7 kg',
      badge: 'CABIN SIZE (55CM)',
    },
    Medium: {
      dim: '68 × 46 × 29 cm (Exp)',
      vol: '72 / 80 L (Exp)',
      wt: '3.7 kg',
      badge: 'MEDIUM SIZE (68CM)',
    },
  },
  Aerojoy: {
    material: 'Hard-Side Rigid ABS Shell + Multi-Pocket Divider',
    wheels: '360° Smooth Double Spinner Wheels',
    lock: 'Recessed Combination Lock',
    'Set of 3': {
      dim: '55cm + 68cm + 79cm (3 Sizes)',
      vol: '210 L Total (35L+68L+107L)',
      wt: '2.8 / 3.6 / 4.5 kg',
      badge: 'SET OF 3 (55+68+79CM)',
    },
  },
  Seville: {
    material: 'High-Density Polyester Softside',
    wheels: '360° Spinner Wheels',
    lock: '3-Dial Combination Lock',
    'Combo / 2-Pack': {
      dim: '55cm Cabin + 68cm Medium',
      vol: '40L + 72L (112L Total)',
      wt: '2.3 kg + 3.1 kg',
      badge: 'CABIN + MEDIUM 2-PC COMBO',
    },
  },
};

export function getProductStyleKey(item: AbDesaiATProduct): string {
  const n = item.name.toLowerCase();
  const sizeClass = getExactSizeClass(item);
  const isOffer = /offer/i.test(n) ? 'offer' : 'single';
  const isTwoSets = /2\s*sets/i.test(n) ? '2sets' : '1set';

  // Duffle & Cabin Bags — keep each distinct model separate (e.g., Cosmo Duffle vs Grid DBag)
  if (item.series === 'Duffle & Cabin Bags') {
    if (/cosmo\s+duffle/i.test(n)) return 'Duffle::Cosmo Duffle 55cm';
    if (/grid\s+dbag/i.test(n)) return 'Duffle::Grid DBag Duffle';
    return `Duffle::Item-${item.id}`;
  }

  // Backpacks & Briefcases — keep each distinct backpack/briefcase/tote model separate
  if (item.series === 'Backpacks & Briefcases') {
    if (/sest\s*2\.0/i.test(n)) return 'Backpack::Sest 2.0 Backpack';
    if (/mate\s*2\.0/i.test(n)) return 'Backpack::Mate 2.0 Backpack';
    if (/slate\s+navy/i.test(n)) return 'Backpack::Swagpack Slate Navy';
    if (/segno\s+briefcase/i.test(n)) return 'Briefcase::Segno Briefcase';
    if (/zork\s+briefcase/i.test(n)) return 'Briefcase::Zork Briefcase';
    if (/bass\s+rolling\s+tote/i.test(n)) return 'Tote::Bass Rolling Tote';
    return `Backpack::Item-${item.id}`;
  }

  // Generic American Tourister series — keep Marina, Paxtra, etc. separate
  if (item.series === 'American Tourister') {
    if (/marina/i.test(n)) return `AT::Marina::${sizeClass}`;
    if (/paxtra/i.test(n)) return `AT::Paxtra::${sizeClass}`;
    return `AT::Item-${item.id}`;
  }

  // Standard luggage series: group only same Series + same Size Class + same Offer/Bundle type
  return `Series::${item.series}::${sizeClass}::${isOffer}::${isTwoSets}`;
}

export function extractColourName(item: AbDesaiATProduct): string {
  const n = item.name
    .replace(/^AMERICAN TOURISTER\s+/i, '')
    .replace(/\s*\(\s*Get 1 Cabin[\s\S]*$/i, '')
    .replace(/\s*with Free 950Ml[\s\S]*$/i, '')
    .replace(/\s*\+\s*Free RICO[\s\S]*$/i, '')
    .replace(/\s*As Per Colour Available[\s\S]*$/i, '')
    .replace(/\s*offer\s*,\s*Buy one[\s\S]*$/i, '')
    .replace(/\s*\(\s*Price of one unit[\s\S]*$/i, '')
    .replace(/\s*\(\s*2 sets of 3pcs\s*\)/i, '')
    .replace(/\s*HZ9[\s\S]*$/i, '')
    .replace(/\s*FL8[\s\S]*$/i, '')
    .replace(/\s*T16[\s\S]*$/i, '')
    .replace(/\s*HD1[\s\S]*$/i, '')
    .replace(/\s*AY1[\s\S]*$/i, '')
    .replace(/\s*–\s*Mate[\s\S]*$/i, '')
    .trim();

  // Specific clean colour extraction for Duffle Bags, Backpacks, Briefcases, Marina, Paxtra
  if (/cosmo\s+duffle/i.test(n)) {
    return n
      .replace(/cosmo\s+duffle\s+bag(\s+with\s+wheels)?/i, '')
      .replace(/\b55cm\b/i, '')
      .trim() || 'Black';
  }
  if (/grid\s+dbag/i.test(n)) {
    return n
      .replace(/grid\s+dbag/i, '')
      .replace(/duffle\s+bag/i, '')
      .trim() || 'Grey';
  }
  if (/backpack\s+sest\s*2\.0/i.test(n)) {
    return n.replace(/backpack\s+sest\s*2\.0/i, '').trim() || 'Black';
  }
  if (/backpack\s+mate\s*2\.0/i.test(n)) {
    return n.replace(/backpack\s+mate\s*2\.0/i, '').trim() || 'Gold Yellow';
  }
  if (/backpack\s+slate\s+navy/i.test(n)) {
    return 'Slate Navy';
  }
  if (/segno\s+briefcase|zork\s+briefcase|bass\s+rolling\s+tote/i.test(n)) {
    return 'Black';
  }
  if (/^marina\s+/i.test(n)) {
    return n.replace(/^marina\s+(cabin|medium|large)\s+/i, '').trim() || 'Red';
  }
  if (/^paxtra\s+/i.test(n)) {
    return n.replace(/^paxtra\s+(cabin|medium|large)\s+/i, '').trim() || 'Grey';
  }

  // Remove series & size words to isolate colour
  const cleaned = n
    .replace(new RegExp(`^${item.series}\\s+`, 'i'), '')
    .replace(/^Gemina\s+PRO\s+/i, '')
    .replace(
      /\b(Cabin\s*\+\s*Large|Cabin\s*\+\s*Medium|Set\s*of\s*3|Set\s*3pcs|Set3pcs|Set3|3\s*pcs|3\s*units|X-Large|XLarge|Large|Medium|Cabin|XL|L|M|C|55cm|68cm|69cm|77cm|79cm|80cm|\(55\+68\+79cm\))\b/gi,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Assorted Colours';
}

export function getProductSpecifications(
  item: AbDesaiATProduct,
  allProducts: AbDesaiATProduct[]
): ProductSpecData {
  const sizeClass = getExactSizeClass(item);
  const n = item.name.toLowerCase();

  // Find all available colours for this exact style & sizeClass
  const styleKey = getProductStyleKey(item);
  const peers = allProducts.filter((p) => getProductStyleKey(p) === styleKey);
  const colourSet = new Set<string>();
  for (const peer of peers) {
    const c = extractColourName(peer);
    if (c && c.length > 1) colourSet.add(c);
  }
  const availableColours =
    colourSet.size > 0 ? Array.from(colourSet) : [extractColourName(item)];

  // Special handling for Senna BOGO where sizeCategory is Combo / 2-Pack but item is Large or Medium
  if (item.series === 'Senna') {
    const isLarge = /large/i.test(n);
    const sennaEntry = isLarge
      ? SERIES_SPECS_DB.Senna.Large!
      : SERIES_SPECS_DB.Senna.Medium!;
    return {
      sizeClass: isLarge ? 'Large' : 'Medium',
      sizeHeaderBadge: sennaEntry.badge,
      dimensionsCm: sennaEntry.dim,
      volumeLitres: sennaEntry.vol,
      weightKg: sennaEntry.wt,
      material: SERIES_SPECS_DB.Senna.material,
      wheels: SERIES_SPECS_DB.Senna.wheels,
      lock: SERIES_SPECS_DB.Senna.lock,
      warranty: '3-Year Global Warranty (120+ Countries)',
      availableColours: ['Assorted Showroom Colours'],
    };
  }

  // Special handling for Skytrac 2-Pack offers (Cabin / Medium / Large)
  if (item.series === 'Skytrac' && /offer/i.test(n)) {
    const subSize = /large/i.test(n)
      ? 'Large'
      : /medium/i.test(n)
        ? 'Medium'
        : 'Cabin';
    const spec = SERIES_SPECS_DB.Skytrac[subSize]!;
    return {
      sizeClass: subSize,
      sizeHeaderBadge: `${spec.badge} · 2-PACK OFFER`,
      dimensionsCm: `${spec.dim} (Each)`,
      volumeLitres: `${spec.vol} × 2 Units`,
      weightKg: `${spec.wt} (Each)`,
      material: SERIES_SPECS_DB.Skytrac.material,
      wheels: SERIES_SPECS_DB.Skytrac.wheels,
      lock: SERIES_SPECS_DB.Skytrac.lock,
      warranty: '3-Year Global Warranty',
      availableColours: ['Black', 'Navy', 'Steel Grey', 'Sunshine Yellow'],
    };
  }

  // Special items (Cosmo Duffle, Grid DBag, Paxtra, Marina, Backpacks, Briefcases)
  if (/cosmo\s+duffle/i.test(n)) {
    return {
      sizeClass: 'Backpack & Duffle',
      sizeHeaderBadge: 'WHEELED DUFFLE (55CM)',
      dimensionsCm: '57 × 35 × 31 cm',
      volumeLitres: '60 L',
      weightKg: '2.1 kg',
      material: 'Heavy-Duty Travel Polyester',
      wheels: '2 Corner-Mounted Skate Wheels + Trolley',
      lock: 'Lockable Main Zippers',
      warranty: '3-Year Global Warranty',
      availableColours: ['Black', 'Red'],
    };
  }
  if (/grid\s+dbag/i.test(n)) {
    return {
      sizeClass: 'Backpack & Duffle',
      sizeHeaderBadge: 'TRAVEL DUFFLE BAG',
      dimensionsCm: '53 × 30 × 28 cm',
      volumeLitres: '45 L',
      weightKg: '0.9 kg',
      material: 'Durable Water-Resistant Polyester',
      wheels: 'Padded Shoulder Strap & Top Carry Handles',
      lock: 'Dual-Zip Main Compartment',
      warranty: '3-Year Global Warranty',
      availableColours: ['Grey', 'Blue'],
    };
  }
  if (/paxtra/i.test(n)) {
    return {
      sizeClass: 'Large',
      sizeHeaderBadge: 'LARGE SIZE (78CM)',
      dimensionsCm: '78 × 49 × 31 cm (Exp)',
      volumeLitres: '108 / 118 L (Exp)',
      weightKg: '3.8 kg',
      material: 'High-Density Softside Polyester',
      wheels: '360° Smooth Spinner Wheels',
      lock: 'Recessed TSA Combination Lock',
      warranty: '3-Year Global Warranty',
      availableColours: ['Grey'],
    };
  }
  if (/marina/i.test(n)) {
    return {
      sizeClass: 'Cabin',
      sizeHeaderBadge: 'CABIN SIZE (57CM)',
      dimensionsCm: '57 × 40 × 25 cm (Exp)',
      volumeLitres: '44 L (Exp)',
      weightKg: '2.7 kg',
      material: 'High-Density Softside Polyester',
      wheels: '360° Smooth Spinner Wheels',
      lock: 'TSA Combination Lock',
      warranty: '3-Year Global Warranty',
      availableColours: ['Red'],
    };
  }
  if (/sest\s*2\.0/i.test(n)) {
    return {
      sizeClass: 'Backpack & Duffle',
      sizeHeaderBadge: 'BACKPACK (28L)',
      dimensionsCm: '46.5 × 30.5 × 22 cm',
      volumeLitres: '28 L (3 Compartments)',
      weightKg: '0.41 kg (Ultra-Light)',
      material: 'Dobby Polyester Recyclex™',
      wheels: 'Ergo-on-the-Go Padded Back & Straps',
      lock: 'Front Organizer + Bottle Pocket',
      warranty: '1-Year International Warranty',
      availableColours: ['Orange', 'Black'],
    };
  }
  if (/mate\s*2\.0/i.test(n)) {
    return {
      sizeClass: 'Backpack & Duffle',
      sizeHeaderBadge: 'BACKPACK (30L)',
      dimensionsCm: '48 × 33 × 22 cm',
      volumeLitres: '30 L + Rain Cover',
      weightKg: '0.50 kg',
      material: '100% Durable Polyester',
      wheels: 'Padded Back & Ergonomic Shoulder Straps',
      lock: '3 Compartments + Built-in Rain Cover',
      warranty: '1-Year International Warranty',
      availableColours: ['Gold Yellow'],
    };
  }
  if (/slate\s+navy/i.test(n)) {
    return {
      sizeClass: 'Backpack & Duffle',
      sizeHeaderBadge: 'BACKPACK (34L)',
      dimensionsCm: '47 × 32 × 23 cm',
      volumeLitres: '34 L',
      weightKg: '0.50 kg',
      material: '100% Durable Polyester',
      wheels: 'Mesh Padded Shoulder Straps',
      lock: 'Multi-Compartment + Name Tag',
      warranty: '1-Year International Warranty',
      availableColours: ['Slate Navy'],
    };
  }
  if (/bass\s+rolling\s+tote/i.test(n)) {
    return {
      sizeClass: 'Backpack & Duffle',
      sizeHeaderBadge: 'ROLLING CABIN TOTE',
      dimensionsCm: '45 × 41 × 23 cm',
      volumeLitres: '32 L (Laptop 15.6")',
      weightKg: '2.4 kg',
      material: '1680D Ballistic Polyester',
      wheels: 'Smooth Rolling Business Wheels + Trolley',
      lock: 'Padded Laptop Compartment',
      warranty: '3-Year Global Warranty',
      availableColours: ['Black'],
    };
  }
  if (/segno\s+briefcase|zork\s+briefcase/i.test(n)) {
    return {
      sizeClass: 'Backpack & Duffle',
      sizeHeaderBadge: 'LAPTOP BRIEFCASE (15.6")',
      dimensionsCm: '42 × 31 × 13 cm (Exp)',
      volumeLitres: '18 / 21 L (Exp)',
      weightKg: '0.95 kg',
      material: 'High-Density Water-Repellent Polyester',
      wheels: 'Smart Sleeve for Suitcase Trolley + Strap',
      lock: 'Padded Laptop & Tablet Section',
      warranty: '3-Year Global Warranty',
      availableColours: ['Black'],
    };
  }

  const seriesTable = SERIES_SPECS_DB[item.series];
  if (seriesTable) {
    // Special guard: if abdesai.mu product title explicitly says "Medium 3 pcs" or "3 Medium",
    // never use a generic C+M+L Set of 3 entry even if another series adds a 3-Medium bundle in future.
    if (sizeClass === 'Set of 3' && /medium\s*3\s*pcs|3\s*medium/i.test(n)) {
      const medEntry = seriesTable.Medium;
      if (medEntry) {
        return {
          sizeClass: 'Set of 3',
          sizeHeaderBadge: `SET OF 3 MEDIUM (3 × ${medEntry.dim.split(' ')[0]}CM)`,
          dimensionsCm: `3 × Medium ${medEntry.dim}`,
          volumeLitres: `${medEntry.vol} × 3 Units`,
          weightKg: `${medEntry.wt} × 3 Units`,
          material: seriesTable.material,
          wheels: seriesTable.wheels,
          lock: seriesTable.lock,
          warranty: '3-Year Global Warranty',
          availableColours,
        };
      }
    }

    const entry =
      seriesTable[sizeClass as keyof SeriesSizeTable] ||
      seriesTable.Large ||
      seriesTable.Medium ||
      seriesTable.Cabin;

    if (entry && typeof entry === 'object') {
      return {
        sizeClass,
        sizeHeaderBadge: entry.badge,
        dimensionsCm: entry.dim,
        volumeLitres: entry.vol,
        weightKg: entry.wt,
        material: seriesTable.material,
        wheels: seriesTable.wheels,
        lock: seriesTable.lock,
        warranty: '3-Year Global Warranty',
        availableColours,
      };
    }
  }

  // Live abdesai.mu description parser for any newly added products on abdesai.mu
  const liveText = `${item.name} ${item.specsText || ''}`;
  const dimMatch = liveText.match(
    /(\d+(?:\.\d+)?)\s*(?:cm)?\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:cm)?\s*[xX×]\s*(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)\s*(?:cm)?/i
  );
  const volMatch = liveText.match(
    /(?:vol(?:ume)?\s*:?\s*)?(\d+(?:\s*\/\s*(?:expanded\s*)?\d+)?)\s*L(?:itres?)?\b/i
  );
  const wtMatch = liveText.match(
    /(?:weight\s*:?\s*)?(\d+(?:\.\d+)?)\s*kg\b/i
  );

  const parsedDim = dimMatch
    ? `${dimMatch[1]} × ${dimMatch[2]} × ${dimMatch[3]} cm`
    : sizeClass === 'Cabin'
      ? '55 × 36 × 24 cm'
      : sizeClass === 'Medium'
        ? '68 × 46 × 29 cm'
        : '79 × 53 × 33 cm';

  const parsedVol = volMatch
    ? `${volMatch[1].replace(/expanded/i, '').trim()} L`
    : sizeClass === 'Cabin'
      ? '36 L'
      : sizeClass === 'Medium'
        ? '72 L'
        : '110 L';

  const parsedWt = wtMatch
    ? `${wtMatch[1]} kg`
    : sizeClass === 'Cabin'
      ? '2.7 kg'
      : sizeClass === 'Medium'
        ? '3.6 kg'
        : '4.5 kg';

  const parsedMaterial = /polycarbonate/i.test(liveText)
    ? '100% Polycarbonate Shell'
    : /polypropylene|\bpp\b/i.test(liveText)
      ? '100% Polypropylene Shell'
      : /\babs\b/i.test(liveText)
        ? 'Scratch-Resistant Hard-Side ABS'
        : /polyester|fabric|softside/i.test(liveText)
          ? 'High-Density Softside Polyester'
          : 'Authentic American Tourister Shell';

  const parsedLock = /3-point/i.test(liveText)
    ? '3-Point TSA Combination Lock'
    : /tsa/i.test(liveText)
      ? 'Recessed TSA Combination Lock'
      : 'Fixed 3-Digit Combination Lock';

  const parsedWheels = /optimov|shock/i.test(liveText)
    ? 'Optimov™ Shock-Absorbing Spinner Wheels'
    : /double\s+wheels|8\s+wheels/i.test(liveText)
      ? '360° Smooth Double Spinner Wheels'
      : '360° Smooth Spinner Wheels';

  return {
    sizeClass,
    sizeHeaderBadge: `${sizeClass.toUpperCase()} SIZE`,
    dimensionsCm: parsedDim,
    volumeLitres: parsedVol,
    weightKg: parsedWt,
    material: parsedMaterial,
    wheels: parsedWheels,
    lock: parsedLock,
    warranty: /1\s*year/i.test(liveText)
      ? '1-Year International Warranty'
      : '3-Year Global Warranty',
    availableColours,
  };
}

export interface SeriesSizeRow {
  sizeLabel: string; // e.g. "CABIN (55cm)", "MEDIUM (69cm)", "LARGE (80cm)", "SET OF 3"
  shortSize: string; // "Cabin" | "Medium" | "Large" | "X-Large" | "Set of 3" | "2-Pack"
  dimensionsCm: string;
  volumeLitres: string;
  weightKg: string;
  priceRs: number;
  regularPriceRs?: number;
  subPriceBadge?: string; // e.g. "CABIN + XL: Rs 9,000" right below X-Large Rs 7,500
  promoNote?: string;
  image: string;
  productId: number;
}

export interface CompleteSeriesLineup {
  seriesName: string;
  tagline: string;
  material: string;
  wheels: string;
  lock: string;
  colours: string[];
  heroPromoBanner: string;
  bottomPromoCallout: string;
  rows: SeriesSizeRow[];
}

export const ALL_DISPLAY_SERIES_ORDER = [
  'Bricklane',
  'Skytrac',
  'Jamaica',
  'Dashway',
  'Duncan',
  'Senna',
  'Gemina Pro',
  'Novastream',
  'Skylette',
  'Mystic',
  'Hundo',
  'Aerospin',
  'Dash Pop',
  'Maxplus',
  'Curio',
  'Majoris',
  'Trento',
  'Portland',
  'Robotech',
  'Frontec',
  'Skypark',
  'Circurity',
  'Aerojoy',
  'Duffle & Cabin Bags',
  'Backpacks & Briefcases',
];

export function getCompleteSeriesLineup(
  seriesName: string,
  allProducts: AbDesaiATProduct[]
): CompleteSeriesLineup {
  const seriesProducts = allProducts.filter(
    (p) => p.series === seriesName && p.priceRs > 0
  );
  const fallbackProducts =
    seriesProducts.length > 0
      ? seriesProducts
      : allProducts.filter((p) => p.series === seriesName);

  const sampleProd = fallbackProducts[0] || allProducts[0];
  const sampleSpec = getProductSpecifications(sampleProd, allProducts);

  // Gather all distinct colours across the whole series
  const colourSet = new Set<string>();
  for (const p of fallbackProducts) {
    const c = extractColourName(p);
    if (c && c.length > 1 && c !== 'Assorted Colours') colourSet.add(c);
  }
  const colours =
    colourSet.size > 0 ? Array.from(colourSet) : ['Black', 'Navy', 'Assorted'];

  // Group by sizeClass to build the at-a-glance rows (Cabin -> Medium -> Large -> X-Large -> Set of 3 / Combo)
  // Note: For Jamaica, put 'Set of 3' (Set of 3 Medium at Rs 11,990) as the 4th slot right after Cabin, Medium, and X-Large!
  const sizeOrder: LuggageSizeClass[] = [
    'Cabin',
    'Medium',
    'Large',
    'X-Large',
    'Set of 3',
    'Combo / 2-Pack',
    'Backpack & Duffle',
  ];

  const seriesFallbackImg =
    fallbackProducts.find((p) => p.image && p.image.trim().length > 0)?.image ||
    'https://abdesai.mu/wp-content/uploads/2024/11/Senna-med-blue-main.jpg';

  const rows: SeriesSizeRow[] = [];
  for (const sc of sizeOrder) {
    // Prefer in-stock items for that size
    const matching = fallbackProducts.filter((p) => getExactSizeClass(p) === sc);
    if (matching.length === 0) continue;

    // For Skytrac, separate standard single unit vs 2-pack offer if both exist
    if (seriesName === 'Skytrac' && ['Cabin', 'Medium', 'Large'].includes(sc)) {
      const singleUnit = matching.find((m) => !/offer/i.test(m.name));
      const offerPair = matching.find((m) => /offer/i.test(m.name));
      const chosen = singleUnit || offerPair || matching[0];
      const sp = getProductSpecifications(chosen, allProducts);
      const heightMatch = sp.dimensionsCm.match(/^(\d+(?:\.\d+)?)/);
      const cmTag = heightMatch ? ` (${heightMatch[1]}cm)` : '';
      rows.push({
        sizeLabel: `${sc.toUpperCase()}${cmTag}`,
        shortSize: sc,
        dimensionsCm: sp.dimensionsCm.replace(' (Each)', ''),
        volumeLitres: sp.volumeLitres.replace(' × 2 Units', ''),
        weightKg: sp.weightKg.replace(' (Each)', ''),
        priceRs: singleUnit ? singleUnit.priceRs : chosen.priceRs,
        regularPriceRs: singleUnit?.regularPriceRs,
        subPriceBadge: offerPair
          ? `2 FOR Rs ${offerPair.priceRs.toLocaleString('en-MU')}`
          : undefined,
        promoNote: offerPair
          ? `2 FOR Rs ${offerPair.priceRs.toLocaleString('en-MU')} (2nd -50%)`
          : undefined,
        image: chosen.image || seriesFallbackImg,
        productId: chosen.id,
      });
      continue;
    }

    const rep =
      matching.find((m) => m.inStock && m.image) ||
      matching.find((m) => m.inStock) ||
      matching.find((m) => m.image) ||
      matching[0];
    const sp = getProductSpecifications(rep, allProducts);
    const heightMatch = sp.dimensionsCm.match(/^(\d+(?:\.\d+)?)/);
    const cmTag =
      heightMatch && !['Set of 3', 'Combo / 2-Pack'].includes(sc)
        ? ` (${heightMatch[1]}cm)`
        : '';

    let promoNote: string | undefined;
    let subPriceBadge: string | undefined;
    if (seriesName === 'Bricklane' && (sc === 'Medium' || sc === 'Large')) {
      promoNote = '+55cm Cabin @ Rs 2,250 (-50%)';
      subPriceBadge = '+CABIN: Rs 2,250';
    } else if (seriesName === 'Jamaica' && sc === 'X-Large') {
      promoNote = 'ADD +RS 1,500 FOR CABIN · CABIN + XL @ RS 9,000';
      subPriceBadge = 'CABIN + XL: Rs 9,000';
    } else if (seriesName === 'Gemina Pro' && sc === 'Large') {
      promoNote = '+FREE 950ml Copper Bottle';
    } else if (
      seriesName === 'Novastream' &&
      (sc === 'Medium' || sc === 'Large')
    ) {
      promoNote = '+FREE Travel Rice Cooker';
    } else if (seriesName === 'Aerospin' && sc === 'X-Large') {
      promoNote = '+FREE Baseus Powerbank (Stone Basalt)';
    } else if (seriesName === 'Senna' && rep.hasPromo) {
      promoNote = rep.promoBadge;
    } else if (
      seriesName === 'Jamaica' &&
      sc === 'Set of 3' &&
      /medium\s*3\s*pcs|3\s*medium/i.test(rep.name)
    ) {
      promoNote = '3 × MEDIUM (69CM) · SAVE Rs 5,980';
    } else if (rep.regularPriceRs && rep.regularPriceRs > rep.priceRs) {
      promoNote = `SAVE Rs ${(rep.regularPriceRs - rep.priceRs).toLocaleString('en-MU')}`;
    } else if (rep.promoBadge) {
      promoNote = rep.promoBadge;
    }

    const hasXLInSeries = fallbackProducts.some(
      (fp) => getExactSizeClass(fp) === 'X-Large'
    );

    rows.push({
      sizeLabel:
        sc === 'Set of 3'
          ? /medium\s*3\s*pcs|3\s*medium/i.test(rep.name)
            ? 'SET OF 3 MEDIUM (3×69CM)'
            : hasXLInSeries
              ? 'SET OF 3 (C+M+XL)'
              : 'SET OF 3 (C+M+L)'
          : sc === 'Combo / 2-Pack'
            ? /cabin\s*\+\s*large/i.test(rep.name)
              ? 'CABIN + X-LARGE'
              : /cabin\s*\+\s*medium/i.test(rep.name)
                ? 'CABIN + MEDIUM'
                : '2-PC COMBO'
            : `${sc.toUpperCase()}${cmTag}`,
      shortSize:
        sc === 'Set of 3' && /medium\s*3\s*pcs|3\s*medium/i.test(rep.name)
          ? '3× Medium Set'
          : sc === 'Combo / 2-Pack'
            ? '2-Pack'
            : sc,
      dimensionsCm: sp.dimensionsCm,
      volumeLitres: sp.volumeLitres,
      weightKg: sp.weightKg,
      priceRs: rep.priceRs,
      regularPriceRs: rep.regularPriceRs,
      subPriceBadge,
      promoNote,
      image: rep.image || seriesFallbackImg,
      productId: rep.id,
    });
  }

  // Fallback if series has multiple distinct items under the same sizeClass (e.g. Backpacks & Briefcases, Duffle & Cabin Bags)
  if (
    rows.length === 1 &&
    fallbackProducts.length > 1 &&
    (seriesName === 'Backpacks & Briefcases' ||
      seriesName === 'Duffle & Cabin Bags' ||
      seriesName === 'American Tourister')
  ) {
    rows.length = 0;
    const seenNames = new Set<string>();
    for (const p of fallbackProducts) {
      const sp = getProductSpecifications(p, allProducts);
      const shortN = p.name
        .replace(/^AMERICAN TOURISTER\s+/i, '')
        .split(' ')
        .slice(0, 3)
        .join(' ');
      if (seenNames.has(shortN)) continue;
      seenNames.add(shortN);
      rows.push({
        sizeLabel: shortN.toUpperCase(),
        shortSize: shortN,
        dimensionsCm: sp.dimensionsCm,
        volumeLitres: sp.volumeLitres,
        weightKg: sp.weightKg,
        priceRs: p.priceRs,
        regularPriceRs: p.regularPriceRs,
        promoNote: p.promoBadge,
        image: p.image || seriesFallbackImg,
        productId: p.id,
      });
      if (rows.length >= 4) break;
    }
  }

  // Series-level headline & promo callout
  let heroPromoBanner = `ALL SIZES, SPECS & PRICES AT A GLANCE`;
  let bottomPromoCallout = `CONFIRM AVAILABILITY BEFORE PAYMENT · DELIVERY UP TO 10 DAYS`;

  if (seriesName === 'Bricklane') {
    heroPromoBanner = `BUY MEDIUM OR LARGE → GET CABIN AT 50% OFF!`;
    bottomPromoCallout = `ADD 55CM CABIN FOR ONLY RS 2,250 (WAS RS 4,500) WITH 69CM / 80CM!`;
  } else if (seriesName === 'Skytrac') {
    heroPromoBanner = `2ND SAME-SIZE SUITCASE AT 50% OFF · SET RS 15,990!`;
    bottomPromoCallout = `2 CABIN: RS 8,250 · 2 MEDIUM: RS 10,500 · 2 LARGE: RS 12,000!`;
  } else if (seriesName === 'Jamaica') {
    heroPromoBanner = `SET OF 3 MEDIUM RS 11,990 · CABIN + XL RS 9,000!`;
    bottomPromoCallout = `CABIN + XL: RS 9,000 (SAVE RS 3,300) · 3× MED: RS 11,990!`;
  } else if (seriesName === 'Dashway') {
    heroPromoBanner = `COMPLETE 3-PIECE SET ON SALE AT RS 16,500!`;
    bottomPromoCallout = `SAVE RS 1,790 ON THE 3-PC SET (CABIN + MEDIUM + X-LARGE)!`;
  } else if (seriesName === 'Duncan') {
    heroPromoBanner = `COMPLETE 3-PIECE SET ON SALE AT RS 16,500!`;
    bottomPromoCallout = `SAVE RS 1,790 ON THE 3-PC SET (55CM + 68CM + 81CM = 269L)!`;
  } else if (seriesName === 'Gemina Pro') {
    heroPromoBanner = `LARGE ON SALE RS 9,495 + FREE COPPER BOTTLE!`;
    bottomPromoCallout = `SAVE RS 2,495 ON LARGE + FREE 950ML COPPER BOTTLE (RS 1,395)!`;
  } else if (seriesName === 'Novastream') {
    heroPromoBanner = `FREE RICO TRAVEL RICE COOKER WITH MED / LARGE!`;
    bottomPromoCallout = `FREE TRAVEL RICE COOKER (WORTH RS 1,390) WITH MEDIUM OR LARGE!`;
  } else if (seriesName === 'Aerospin') {
    heroPromoBanner = `ULTRA-LIGHT SOFTSIDE · FREE POWERBANK ON XL!`;
    bottomPromoCallout = `FREE BASEUS POWERBANK (WORTH RS 1,290) ON XL STONE BASALT!`;
  } else if (seriesName === 'Skylette') {
    heroPromoBanner = `3-PC SET FLASH SALE RS 16,990 (SAVE RS 9,490)!`;
    bottomPromoCallout = `CABIN + MEDIUM + X-LARGE SET FOR RS 16,990 (WAS RS 26,480)!`;
  } else if (seriesName === 'Mystic') {
    heroPromoBanner = `3-PC SET SPECIAL OFFER RS 14,990 (SAVE RS 2,010)!`;
    bottomPromoCallout = `COMPLETE 3-PC SET (CABIN + MEDIUM + LARGE) FOR ONLY RS 14,990!`;
  } else if (seriesName === 'Senna') {
    heroPromoBanner = `EXPANDABLE HARD-SIDE MEDIUM (69CM · 77–85L)!`;
    bottomPromoCallout = `CONFIRM AVAILABILITY BEFORE PAYMENT · DELIVERY UP TO 10 DAYS`;
  } else if (seriesName === 'Dash Pop') {
    heroPromoBanner = `EUROPEAN EXPANDABLE PP · CABIN+MED RS 15,990!`;
    bottomPromoCallout = `100% POLYPROPYLENE · EXPANDABLE IN ALL SIZES · DOUBLE WHEELS`;
  } else if (seriesName === 'Maxplus') {
    heroPromoBanner = `100% POLYPROPYLENE 3-PC SET FROM RS 16,990!`;
    bottomPromoCallout = `NAVY SET OF 3: RS 16,990 · BLACK SET OF 3: RS 17,990 · TSA LOCK`;
  }

  return {
    seriesName,
    tagline: `${sampleSpec.material} · ${sampleSpec.wheels}`,
    material: sampleSpec.material,
    wheels: sampleSpec.wheels,
    lock: sampleSpec.lock,
    colours,
    heroPromoBanner,
    bottomPromoCallout,
    rows,
  };
}

