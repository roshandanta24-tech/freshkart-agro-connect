export const GENERATED_IMAGES = {
  hero: '/src/assets/images/hero_odisha_farm_1795091338219.jpg',
  tomato: '/src/assets/images/produce_tomato_1795091214056.jpg',
  potato: '/src/assets/images/produce_potato_1795091335112.jpg',
  onion: '/src/assets/images/produce_onion_1795091336316.jpg',
  greenChilli: '/src/assets/images/produce_green_chilli_1795091215513.jpg',
  cauliflower: '/src/assets/images/produce_cauliflower_1795091226831.jpg',
  brinjal: '/src/assets/images/produce_brinjal_1795091214951.jpg',
  cabbage: '/src/assets/images/produce_cabbage_1795091335150.jpg',
  rice: '/src/assets/images/produce_rice_1795091215748.jpg',
  mango: '/src/assets/images/produce_mango_1795091341049.jpg',
  banana: '/src/assets/images/produce_banana_1795091340395.jpg',
} as const;

export const PRESET_PRODUCE_IMAGES: { label: string; url: string }[] = [
  { label: 'Fresh Tomatoes', url: GENERATED_IMAGES.tomato },
  { label: 'Farm Potatoes', url: GENERATED_IMAGES.potato },
  { label: 'Red Onions', url: GENERATED_IMAGES.onion },
  { label: 'Green Chilli', url: GENERATED_IMAGES.greenChilli },
  { label: 'Cauliflower', url: GENERATED_IMAGES.cauliflower },
  { label: 'Purple Brinjal', url: GENERATED_IMAGES.brinjal },
  { label: 'Green Cabbage', url: GENERATED_IMAGES.cabbage },
  { label: 'Western Odisha Rice', url: GENERATED_IMAGES.rice },
  { label: 'Ripe Mangoes', url: GENERATED_IMAGES.mango },
  { label: 'Farm Bananas', url: GENERATED_IMAGES.banana },
];

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatQuantity(qty: number, unit: string): string {
  return `${new Intl.NumberFormat('en-IN').format(qty)} ${unit}`;
}
