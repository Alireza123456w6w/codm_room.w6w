import React, { useState, useEffect } from 'react';
import { MetaWeapon } from '../types';
import { AudioFX } from '../services/audio';
import { ApiService } from '../services/api';
import { DEFAULT_META_WEAPONS } from '../data/defaultMeta';

interface MetaLoadoutsProps {
  lang: 'fa' | 'en';
  onToast: (msg: string, type?: 'info' | 'ok' | 'err' | 'warn') => void;
}

export const MetaLoadouts: React.FC<MetaLoadoutsProps> = ({ lang, onToast }) => {
  const [weapons, setWeapons] = useState<MetaWeapon[]>(DEFAULT_META_WEAPONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const isEn = lang === 'en';

  useEffect(() => {
    try {
      const cached = localStorage.getItem('codm_meta_weapons');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWeapons(parsed);
        }
      }
    } catch (e) {}

    setLoading(true);
    ApiService.getMetaWeapons()
      .then((res) => {
        if (res && Array.isArray(res.weapons) && res.weapons.length > 0) {
          setWeapons(res.weapons);
          localStorage.setItem('codm_meta_weapons', JSON.stringify(res.weapons));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'all', nameFa: 'همه اسلحه‌ها', nameEn: 'All Weapons' },
    { id: 'ar', nameFa: 'تفنگ تهاجمی (AR)', nameEn: 'Assault Rifles' },
    { id: 'sniper', nameFa: 'تک‌تیرانداز (Sniper)', nameEn: 'Snipers' },
    { id: 'smg', nameFa: 'مسلسل سبک (SMG)', nameEn: 'SMGs' },
    { id: 'shotgun', nameFa: 'شاتگان (Shotgun)', nameEn: 'Shotguns' }
  ];

  const filteredWeapons = weapons.filter((w) => {
    if (selectedCategory === 'all') return true;
    const typeStr = (w.type + ' ' + (w.typeEn || '') + ' ' + w.id + ' ' + w.name).toLowerCase();
    if (selectedCategory === 'ar') return typeStr.includes('ar') || typeStr.includes('assault') || typeStr.includes('تهاجمی') || typeStr.includes('رایفل');
    if (selectedCategory === 'sniper') return typeStr.includes('sniper') || typeStr.includes('تک‌تیر') || typeStr.includes('اسنایپر');
    if (selectedCategory === 'smg') return typeStr.includes('smg') || typeStr.includes('مسلسل') || typeStr.includes('submachine');
    if (selectedCategory === 'shotgun') return typeStr.includes('shotgun') || typeStr.includes('شاتگان');
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

      {loading && weapons.length === 0 ? (
        <div className="loadwrap">
          <div className="spinner" />
          <p>{isEn ? 'Loading weapon attachments...' : 'در حال بارگذاری لوداوت‌های فصل...'}</p>
        </div>
      ) : (
        <div className="meta-grid">
          {filteredWeapons.map((w) => (
            <div key={w.id} className="meta-card">
              <div className="meta-card-top">
                <div className="meta-badge-box">
                  <span className="badge-tier">{w.tier}</span>
                  <span className="badge-season">{w.seasonMeta}</span>
                </div>
                <div className={`meta-camo-indicator ${w.camo || 'camo-damascus'}`} />
              </div>

              <div className="meta-card-hero">
                <div className="meta-gun-title">
                  <h2>{w.name}</h2>
                  <span className="meta-gun-type">{isEn ? (w.typeEn || w.type) : w.type}</span>
                </div>
                <p className="meta-gun-role">{w.role}</p>
              </div>

              {/* Stats Bar */}
              <div className="meta-stats-grid">
                <div className="stat-row">
                  <span>{isEn ? 'Damage' : 'قدرت دمیج'}</span>
                  <div className="stat-track">
                    <div className="stat-fill" style={{ width: `${w.stats.damage}%` }} />
                  </div>
                  <b>{w.stats.damage}</b>
                </div>
                <div className="stat-row">
                  <span>{isEn ? 'Fire Rate' : 'سرعت شلیک'}</span>
                  <div className="stat-track">
                    <div className="stat-fill" style={{ width: `${w.stats.fireRate}%` }} />
                  </div>
                  <b>{w.stats.fireRate}</b>
                </div>
                <div className="stat-row">
                  <span>{isEn ? 'Accuracy' : 'دقت تیراندازی'}</span>
                  <div className="stat-track">
                    <div className="stat-fill" style={{ width: `${w.stats.accuracy}%` }} />
                  </div>
                  <b>{w.stats.accuracy}</b>
                </div>
                <div className="stat-row">
                  <span>{isEn ? 'Mobility' : 'سرعت موومنت'}</span>
                  <div className="stat-track">
                    <div className="stat-fill" style={{ width: `${w.stats.mobility}%` }} />
                  </div>
                  <b>{w.stats.mobility}</b>
                </div>
                <div className="stat-row">
                  <span>{isEn ? 'Range' : 'بُرد موثر'}</span>
                  <div className="stat-track">
                    <div className="stat-fill" style={{ width: `${w.stats.range}%` }} />
                  </div>
                  <b>{w.stats.range}</b>
                </div>
                <div className="stat-row">
                  <span>{isEn ? 'Control' : 'کنترل لگد'}</span>
                  <div className="stat-track">
                    <div className="stat-fill" style={{ width: `${w.stats.control}%` }} />
                  </div>
                  <b>{w.stats.control}</b>
                </div>
              </div>

              {/* Attachments Blueprint */}
              <div className="meta-att-list">
                <h4>🛠️ {isEn ? 'Gunsmith Attachments' : 'اتچمنت‌های اختصاصی'}</h4>
                <div className="att-items">
                  {w.attachments.map((att, idx) => (
                    <div key={idx} className="att-item">
                      <span className="att-slot">{isEn ? (att.slotEn || att.slot) : att.slot}:</span>
                      <span className="att-name">{att.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gunsmith Share Code */}
              <div className="meta-code-box">
                <div className="code-label">{isEn ? 'CODM Share Code:' : 'کد اشتراک در بازی:'}</div>
                <div className="code-val">
                  <code>{w.code}</code>
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => handleCopyCode(w.code)}
                    title={isEn ? 'Copy Gunsmith Code' : 'کپی کد گان‌اسمیت'}
                  >
                    📋 {isEn ? 'Copy' : 'کپی کد'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
