import React, { useState } from 'react';
import { MetaWeapon } from '../types';
import { AudioFX } from '../services/audio';

interface MetaLoadoutsProps {
  lang: 'fa' | 'en';
  onToast: (msg: string, type?: 'info' | 'ok' | 'err' | 'warn') => void;
}

const META_WEAPONS: MetaWeapon[] = [
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
      fireRate: 94,
      accuracy: 81,
      mobility: 95,
      range: 62,
      control: 82
    },
    attachments: [
      { slot: 'لوله', slotEn: 'Barrel', name: 'CX-38S Integrated Suppressor' },
      { slot: 'قنداق', slotEn: 'Stock', name: 'CX-FR Stock' },
      { slot: 'لیزر', slotEn: 'Laser', name: 'OWC Laser - Tactical' },
      { slot: 'خشاب', slotEn: 'Ammunition', name: '50 Round Drum' },
      { slot: 'پِرک', slotEn: 'Perk', name: 'Sleight of Hand' }
    ],
    code: 'CX-9-3X6Y8Z1W5V'
  }
];

export const MetaLoadouts: React.FC<MetaLoadoutsProps> = ({ lang, onToast }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isEn = lang === 'en';

  const categories = [
    { id: 'all', nameFa: 'همه اسلحه‌ها', nameEn: 'All Weapons' },
    { id: 'ar', nameFa: 'تفنگ تهاجمی (AR)', nameEn: 'Assault Rifles' },
    { id: 'sniper', nameFa: 'تک‌تیرانداز (Sniper)', nameEn: 'Snipers' },
    { id: 'smg', nameFa: 'مسلسل سبک (SMG)', nameEn: 'SMGs' },
    { id: 'shotgun', nameFa: 'شاتگان (Shotgun)', nameEn: 'Shotguns' }
  ];

  const filteredWeapons = META_WEAPONS.filter((w) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'ar') return w.id === 'grau' || w.id === 'oden';
    if (selectedCategory === 'sniper') return w.id === 'dlq';
    if (selectedCategory === 'smg') return w.id === 'switchblade' || w.id === 'cx9';
    if (selectedCategory === 'shotgun') return w.id === 'krm';
    return true;
  });

  const handleCopyCode = (code: string) => {
    AudioFX.play('click');
    navigator.clipboard.writeText(code);
    onToast(isEn ? `Gunsmith code [${code}] copied to clipboard!` : `کد گان‌اسمیت [${code}] کپی شد! در کالاف دیوتی Paste کنید.`, 'ok');
  };

  return (
    <div className="sec">
      <div className="meta-header">
        <h1>
          🔫 <span>{isEn ? 'SEASON META LOADOUTS' : 'لوداوت‌های متای سیزن کالاف دیوتی'}</span>
        </h1>
        <p>
          {isEn
            ? 'Pro competitive weapon attachments, damage radars, and one-click in-game Gunsmith share codes.'
            : 'بهترین گان‌اسمیت‌های مسابقاتی، تحلیل دمیج و رنج، به همراه کد اشتراک‌گذاری رسمی جهت کپی در بازی.'}
        </p>
      </div>

      <div className="meta-category-bar">
        {categories.map((c) => (
          <button
            key={c.id}
            className={`chip ${selectedCategory === c.id ? 'on' : ''}`}
            onClick={() => {
              AudioFX.play('click');
              setSelectedCategory(c.id);
            }}
          >
            {isEn ? c.nameEn : c.nameFa}
          </button>
        ))}
      </div>

      <div className="meta-gun-grid">
        {filteredWeapons.map((gun) => (
          <div key={gun.id} className="gun-card">
            <div className="gun-card-top">
              <div className="gun-meta-title">
                <h3>{gun.name}</h3>
                <div className="gun-meta-type">{isEn ? gun.typeEn : gun.type}</div>
              </div>
              <span className="gun-tier-badge">{gun.tier}</span>
            </div>

            <div className="gun-blueprint-area">
              <div className="gun-camo-preview">
                <span style={{ filter: 'drop-shadow(0 0 10px rgba(255,159,26,0.5))' }}>
                  {gun.id === 'dlq' ? '🎯' : gun.id === 'krm' ? '💥' : gun.id === 'switchblade' || gun.id === 'cx9' ? '⚡' : '🔥'}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#ffd08a', fontStyle: 'italic', textAlign: 'center' }}>
                {isEn ? gun.seasonMeta : gun.role}
              </div>

              <div className="gun-stats-radar">
                <div className="stat-row">
                  <span className="stat-name">{isEn ? 'Damage' : 'دمیج'}</span>
                  <div className="stat-meter">
                    <div className="stat-meter-fill" style={{ width: `${gun.stats.damage}%` }} />
                  </div>
                  <span className="stat-val">{gun.stats.damage}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-name">{isEn ? 'Fire Rate' : 'فایر ریت'}</span>
                  <div className="stat-meter">
                    <div className="stat-meter-fill" style={{ width: `${gun.stats.fireRate}%` }} />
                  </div>
                  <span className="stat-val">{gun.stats.fireRate}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-name">{isEn ? 'Accuracy' : 'دقت'}</span>
                  <div className="stat-meter">
                    <div className="stat-meter-fill" style={{ width: `${gun.stats.accuracy}%` }} />
                  </div>
                  <span className="stat-val">{gun.stats.accuracy}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-name">{isEn ? 'Mobility' : 'موومنت'}</span>
                  <div className="stat-meter">
                    <div className="stat-meter-fill" style={{ width: `${gun.stats.mobility}%` }} />
                  </div>
                  <span className="stat-val">{gun.stats.mobility}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-name">{isEn ? 'Range' : 'برد موثر'}</span>
                  <div className="stat-meter">
                    <div className="stat-meter-fill" style={{ width: `${gun.stats.range}%` }} />
                  </div>
                  <span className="stat-val">{gun.stats.range}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-name">{isEn ? 'Control' : 'کنترل لگد'}</span>
                  <div className="stat-meter">
                    <div className="stat-meter-fill" style={{ width: `${gun.stats.control}%` }} />
                  </div>
                  <span className="stat-val">{gun.stats.control}</span>
                </div>
              </div>
            </div>

            <div className="gun-attachments-list">
              <div className="gun-attachments-title">
                ⚙️ {isEn ? 'Gunsmith Attachments (5/5)' : 'اتچمنت‌های منتخب مسابقاتی (۵/۵):'}
              </div>
              {gun.attachments.map((att, idx) => (
                <div key={idx} className="attachment-item">
                  <span className="att-slot">{isEn ? att.slotEn : att.slot}</span>
                  <span className="att-name">{att.name}</span>
                </div>
              ))}
            </div>

            <div className="gun-card-bot">
              <div className="gun-code-wrap">
                <span className="gun-code-val">{gun.code}</span>
                <button
                  className="btn sm good"
                  onClick={() => handleCopyCode(gun.code)}
                >
                  📋 {isEn ? 'COPY' : 'کپی کد'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
