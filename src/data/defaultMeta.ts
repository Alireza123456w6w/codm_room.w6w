import { MetaWeapon } from '../types';

export const DEFAULT_META_WEAPONS: MetaWeapon[] = [
  {
    id: 'grau',
    name: 'GRAU 5.56',
    type: 'تفنگ تهاجمی (Assault Rifle)',
    typeEn: 'Assault Rifle',
    tier: 'TIER S+',
    camo: 'camo-damascus',
    role: 'متای اصلی سیزن — صفر لگد و دقت ماورایی در مسافت‌های دور',
    seasonMeta: 'Season #1 Universal Meta Pick',
    stats: {
      damage: 82,
      fireRate: 73,
      accuracy: 88,
      mobility: 76,
      range: 85,
      control: 92
    },
    attachments: [
      { slot: 'لوله', slotEn: 'Barrel', name: 'Tempus 26.4" Archangel' },
      { slot: 'قنداق', slotEn: 'Stock', name: 'No Stock (سرعت موومنت)' },
      { slot: 'خشاب', slotEn: 'Ammunition', name: '50 Round Mags' },
      { slot: 'دستگیره زیرین', slotEn: 'Underbarrel', name: 'Cronen Shark II' },
      { slot: 'دستگیره عقب', slotEn: 'Rear Grip', name: 'FTAC R-89 Rubber' }
    ],
    code: 'GRAU-556-2A4B8C1D9E'
  },
  {
    id: 'dlq',
    name: 'DL Q33',
    type: 'تفنگ تک‌تیرانداز (Sniper Rifle)',
    typeEn: 'Sniper Rifle',
    tier: 'TIER GOD',
    camo: 'camo-diamond',
    role: 'سلطان بی‌رقیب تک‌تیراندازها — وان‌شات تضمینی تا قفسه سینه',
    seasonMeta: 'Elite Competitive Sniper Meta',
    stats: {
      damage: 96,
      fireRate: 28,
      accuracy: 94,
      mobility: 55,
      range: 98,
      control: 70
    },
    attachments: [
      { slot: 'لوله', slotEn: 'Barrel', name: 'MIP Light' },
      { slot: 'قنداق', slotEn: 'Stock', name: 'YKM Combat Stock' },
      { slot: 'لیزر', slotEn: 'Laser', name: 'OWC Laser - Tactical' },
      { slot: 'دستگیره عقب', slotEn: 'Rear Grip', name: 'Granulated Grip Tape' },
      { slot: 'پِرک', slotEn: 'Perk', name: 'Disable (کاهش سرعت دشمن)' }
    ],
    code: 'DLQ-33-1A7B9C3D5F'
  },
  {
    id: 'switchblade',
    name: 'SWITCHBLADE X9',
    type: 'مسلسل سبک (SMG)',
    typeEn: 'Submachine Gun',
    tier: 'TIER S',
    camo: 'camo-darkmatter',
    role: 'شاه نبردهای نزدیک — فایر ریت وحشتناک و سرعت ای دی اس فوق‌العاده',
    seasonMeta: 'Close-Quarters Rusher Meta',
    stats: {
      damage: 78,
      fireRate: 91,
      accuracy: 74,
      mobility: 98,
      range: 65,
      control: 80
    },
    attachments: [
      { slot: 'شعله‌پوش', slotEn: 'Muzzle', name: 'Monolithic Suppressor' },
      { slot: 'لوله', slotEn: 'Barrel', name: 'MIP Extended Light' },
      { slot: 'قنداق', slotEn: 'Stock', name: 'YKM Light Stock' },
      { slot: 'لیزر', slotEn: 'Laser', name: 'OWC Laser - Tactical' },
      { slot: 'خشاب', slotEn: 'Ammunition', name: 'Extended Mag A' }
    ],
    code: 'SWX-9-4A2B6C8D1K'
  },
  {
    id: 'krm',
    name: 'KRM-262',
    type: 'شاتگان (Shotgun)',
    typeEn: 'Shotgun',
    tier: 'TIER S',
    camo: 'camo-gold',
    role: 'اسنایپر دستی بتل رویال و مولتی — وان‌تپ قطعی در فاصله نزدیک',
    seasonMeta: 'Battle Royale & S&D Meta Breaker',
    stats: {
      damage: 98,
      fireRate: 35,
      accuracy: 68,
      mobility: 84,
      range: 58,
      control: 52
    },
    attachments: [
      { slot: 'دهانه', slotEn: 'Muzzle', name: 'Marauder Suppressor' },
      { slot: 'لوله', slotEn: 'Barrel', name: 'Extended Barrel (+2)' },
      { slot: 'قنداق', slotEn: 'Stock', name: 'No Stock' },
      { slot: 'لیزر', slotEn: 'Laser', name: 'MIP Laser 5mW' },
      { slot: 'دستگیره عقب', slotEn: 'Rear Grip', name: 'Stippled Grip Tape' }
    ],
    code: 'KRM-262-8F3A1C9B7E'
  },
  {
    id: 'oden',
    name: 'ODEN',
    type: 'تفنگ تهاجمی سنگین (Heavy AR)',
    typeEn: 'Heavy Assault Rifle',
    tier: 'TIER S',
    camo: 'camo-damascus',
    role: '۲ تیر برای کشتن — بیشترین دمیج در بین تفنگ‌های رایفل اتوماتیک',
    seasonMeta: 'High-Damage Two-Tap Specialist',
    stats: {
      damage: 92,
      fireRate: 52,
      accuracy: 86,
      mobility: 64,
      range: 92,
      control: 78
    },
    attachments: [
      { slot: 'دهانه', slotEn: 'Muzzle', name: 'Colossus Suppressor' },
      { slot: 'لوله', slotEn: 'Barrel', name: 'OWC Marksman' },
      { slot: 'قنداق', slotEn: 'Stock', name: 'YKM Combat Stock' },
      { slot: 'لیزر', slotEn: 'Laser', name: 'OWC Laser - Tactical' },
      { slot: 'خشاب', slotEn: 'Ammunition', name: 'Duplex Ammo (دو تیر)' }
    ],
    code: 'ODEN-12-7K4M9N2P8Q'
  },
  {
    id: 'cx9',
    name: 'CX-9',
    type: 'مسلسل سرعتی (Burst/Rapid SMG)',
    typeEn: 'Rapid SMG',
    tier: 'TIER A+',
    camo: 'camo-diamond',
    role: 'خشاب ۱۲ تیری هالوپوینت با دمیج برست مرگبار در هدشات',
    seasonMeta: 'Agile Mid-Range Flex SMG',
    stats: {
      damage: 80,
      fireRate: 95,
      accuracy: 72,
      mobility: 94,
      range: 62,
      control: 74
    },
    attachments: [
      { slot: 'لوله', slotEn: 'Barrel', name: 'CX-38S یکپارچه' },
      { slot: 'قنداق', slotEn: 'Stock', name: 'CX-FR بدون قنداق' },
      { slot: 'خشاب', slotEn: 'Ammunition', name: '12-Round Hollow Point' },
      { slot: 'دستگیره عقب', slotEn: 'Rear Grip', name: 'Ace Grip' },
      { slot: 'پِرک', slotEn: 'Perk', name: 'Sleight of Hand' }
    ],
    code: 'CX9-5B3C7D1E9A'
  }
];
