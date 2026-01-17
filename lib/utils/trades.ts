import { Trade } from '../types';

export interface TradeConfig {
  name: string;
  defaultLabourRate: number;
  jobTypes: string[];
  materialCategories: string[];
  supplierCategories: string[];
  weatherSensitiveJobs: string[];
  aiContext: string;
}

export const tradeConfigs: Record<Trade, TradeConfig> = {
  electrician: {
    name: 'Electrician',
    defaultLabourRate: 95,
    jobTypes: [
      'Switchboard upgrade',
      'Power point installation',
      'Lighting installation',
      'Rewiring',
      'Safety inspection',
      'Solar installation',
      'EV charger installation',
      'Emergency repair',
    ],
    materialCategories: [
      'Cable & Wire',
      'Switchgear',
      'Lighting',
      'Power Points',
      'Safety Equipment',
      'Solar',
      'Conduit',
    ],
    supplierCategories: [
      'Electrical Wholesaler',
      'Lighting Specialist',
      'Solar Supplier',
    ],
    weatherSensitiveJobs: ['Solar installation', 'Outdoor lighting'],
    aiContext: 'Australian electrical trade, AS/NZS standards, safety-first approach',
  },
  plumber: {
    name: 'Plumber',
    defaultLabourRate: 90,
    jobTypes: [
      'Hot water system',
      'Blocked drain',
      'Tap repair',
      'Toilet repair',
      'Gas fitting',
      'Pipe replacement',
      'Bathroom renovation',
      'Emergency callout',
    ],
    materialCategories: [
      'Pipes & Fittings',
      'Valves',
      'Hot Water',
      'Drainage',
      'Gas Fittings',
      'Bathroom',
      'Tools',
    ],
    supplierCategories: [
      'Plumbing Wholesaler',
      'Hot Water Supplier',
      'Bathroom Specialist',
    ],
    weatherSensitiveJobs: ['Outdoor plumbing', 'Excavation work'],
    aiContext: 'Australian plumbing trade, licensed gas fitter, backflow prevention',
  },
  builder: {
    name: 'Builder',
    defaultLabourRate: 85,
    jobTypes: [
      'Home renovation',
      'Extension',
      'Deck construction',
      'Pergola',
      'Retaining wall',
      'Framing',
      'Fit-out',
      'Repairs',
    ],
    materialCategories: [
      'Timber',
      'Steel',
      'Concrete',
      'Fasteners',
      'Roofing',
      'Cladding',
      'Insulation',
    ],
    supplierCategories: [
      'Timber Merchant',
      'Steel Supplier',
      'Building Supplies',
      'Hardware Store',
    ],
    weatherSensitiveJobs: ['Concrete work', 'Roofing', 'External cladding'],
    aiContext: 'Australian building standards, BCA compliance, residential construction',
  },
  mechanic: {
    name: 'Mechanic',
    defaultLabourRate: 85,
    jobTypes: [
      'Service',
      'Brake repair',
      'Engine repair',
      'Transmission',
      'Suspension',
      'Electrical diagnosis',
      'Air conditioning',
      'Pre-purchase inspection',
    ],
    materialCategories: [
      'Filters',
      'Brakes',
      'Engine Parts',
      'Transmission',
      'Suspension',
      'Fluids',
      'Electrical',
    ],
    supplierCategories: [
      'Auto Parts',
      'Specialist Parts',
      'Fluids & Lubricants',
    ],
    weatherSensitiveJobs: [],
    aiContext: 'Automotive repair, MVRIA standards, diagnostic expertise',
  },
  carpenter: {
    name: 'Carpenter',
    defaultLabourRate: 80,
    jobTypes: [
      'Cabinetry',
      'Door installation',
      'Window installation',
      'Flooring',
      'Decking',
      'Built-in wardrobes',
      'Shelving',
      'Repairs',
    ],
    materialCategories: [
      'Timber',
      'Sheet Materials',
      'Hardware',
      'Doors',
      'Windows',
      'Flooring',
      'Finishes',
    ],
    supplierCategories: [
      'Timber Merchant',
      'Joinery Supplier',
      'Hardware Store',
    ],
    weatherSensitiveJobs: ['External joinery', 'Decking'],
    aiContext: 'Fine carpentry, joinery, Australian timber species',
  },
  hvac: {
    name: 'HVAC Technician',
    defaultLabourRate: 95,
    jobTypes: [
      'AC installation',
      'AC service',
      'AC repair',
      'Ducted system',
      'Split system',
      'Ventilation',
      'Refrigeration',
      'Heat pump',
    ],
    materialCategories: [
      'Units',
      'Refrigerant',
      'Ductwork',
      'Controls',
      'Filters',
      'Insulation',
      'Fittings',
    ],
    supplierCategories: [
      'HVAC Wholesaler',
      'Refrigeration Supplier',
      'Controls Specialist',
    ],
    weatherSensitiveJobs: ['Outdoor unit installation'],
    aiContext: 'HVAC systems, refrigerant handling, energy efficiency',
  },
  painter: {
    name: 'Painter',
    defaultLabourRate: 70,
    jobTypes: [
      'Interior painting',
      'Exterior painting',
      'Commercial painting',
      'Spray painting',
      'Wallpaper',
      'Feature wall',
      'Deck staining',
      'Touch-ups',
    ],
    materialCategories: [
      'Paint',
      'Primers',
      'Stains',
      'Wallpaper',
      'Preparation',
      'Tools',
      'Protection',
    ],
    supplierCategories: [
      'Paint Store',
      'Decorating Supplier',
      'Trade Paint',
    ],
    weatherSensitiveJobs: ['Exterior painting', 'Deck staining'],
    aiContext: 'Professional painting, surface preparation, colour consultation',
  },
  landscaper: {
    name: 'Landscaper',
    defaultLabourRate: 65,
    jobTypes: [
      'Garden design',
      'Lawn installation',
      'Paving',
      'Retaining wall',
      'Irrigation',
      'Tree removal',
      'Garden maintenance',
      'Fencing',
    ],
    materialCategories: [
      'Plants',
      'Soil & Mulch',
      'Pavers',
      'Stone',
      'Irrigation',
      'Timber',
      'Fencing',
    ],
    supplierCategories: [
      'Nursery',
      'Landscape Supplies',
      'Paving Supplier',
      'Irrigation Specialist',
    ],
    weatherSensitiveJobs: ['Planting', 'Concrete work', 'Paving'],
    aiContext: 'Landscaping design, plant knowledge, hardscaping',
  },
  roofer: {
    name: 'Roofer',
    defaultLabourRate: 85,
    jobTypes: [
      'Roof replacement',
      'Roof repair',
      'Tile replacement',
      'Metal roofing',
      'Gutter installation',
      'Gutter cleaning',
      'Flashing repair',
      'Roof inspection',
    ],
    materialCategories: [
      'Roofing Tiles',
      'Metal Sheets',
      'Gutters',
      'Flashing',
      'Underlays',
      'Fasteners',
      'Sealants',
    ],
    supplierCategories: [
      'Roofing Supplier',
      'Metal Supplier',
      'Building Supplies',
    ],
    weatherSensitiveJobs: ['Roof replacement', 'Roof repair', 'Metal roofing', 'Tile replacement'],
    aiContext: 'Australian roofing trade, roof safety, metal and tile roofing expertise',
  },
  tiler: {
    name: 'Tiler',
    defaultLabourRate: 80,
    jobTypes: [
      'Bathroom tiling',
      'Kitchen splashback',
      'Floor tiling',
      'Wall tiling',
      'Outdoor tiling',
      'Pool tiling',
      'Tile repair',
      'Waterproofing',
    ],
    materialCategories: [
      'Tiles',
      'Adhesives',
      'Grout',
      'Waterproofing',
      'Trims',
      'Spacers',
      'Tools',
    ],
    supplierCategories: [
      'Tile Store',
      'Building Supplies',
      'Waterproofing Specialist',
    ],
    weatherSensitiveJobs: ['Outdoor tiling', 'Pool tiling'],
    aiContext: 'Professional tiling, waterproofing, Australian standards compliance',
  },
  glazier: {
    name: 'Glazier',
    defaultLabourRate: 85,
    jobTypes: [
      'Window replacement',
      'Glass repair',
      'Shower screen',
      'Splashback',
      'Mirror installation',
      'Double glazing',
      'Balustrade',
      'Shopfront',
    ],
    materialCategories: [
      'Glass',
      'Mirrors',
      'Frames',
      'Seals',
      'Hardware',
      'Adhesives',
      'Safety Film',
    ],
    supplierCategories: [
      'Glass Supplier',
      'Window Supplier',
      'Hardware Store',
    ],
    weatherSensitiveJobs: ['External glazing'],
    aiContext: 'Glass installation, safety glass standards, window systems',
  },
  other: {
    name: 'Other',
    defaultLabourRate: 75,
    jobTypes: [
      'Handyman work',
      'Repairs',
      'Installation',
      'Assembly',
      'Maintenance',
      'Cleaning',
      'Moving',
      'General labour',
    ],
    materialCategories: [
      'General Hardware',
      'Fasteners',
      'Adhesives',
      'Tools',
      'Safety',
      'Cleaning',
      'Misc',
    ],
    supplierCategories: [
      'Hardware Store',
      'Building Supplies',
      'General Supplier',
    ],
    weatherSensitiveJobs: ['Outdoor work'],
    aiContext: 'General trades, multi-skilled, problem solving',
  },
};

export function getTradeConfig(trade: Trade): TradeConfig {
  return tradeConfigs[trade] || tradeConfigs.other;
}

export function getDefaultLabourRate(trade: Trade): number {
  return getTradeConfig(trade).defaultLabourRate;
}

export function getTradeJobTypes(trade: Trade): string[] {
  return getTradeConfig(trade).jobTypes;
}

export function getTradeMaterialCategories(trade: Trade): string[] {
  return getTradeConfig(trade).materialCategories;
}

export function getTradeSupplierCategories(trade: Trade): string[] {
  return getTradeConfig(trade).supplierCategories;
}

export const tradeOptions: { value: Trade; label: string }[] = [
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'builder', label: 'Builder' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'hvac', label: 'HVAC Technician' },
  { value: 'landscaper', label: 'Landscaper' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'tiler', label: 'Tiler' },
  { value: 'glazier', label: 'Glazier' },
  { value: 'other', label: 'Other' },
];
