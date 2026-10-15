import React, { useState } from 'react';
import { User } from '../types';
import { AudioFX } from '../services/audio';

interface DogtagStudioProps {
  user: User | null;
  lang: 'fa' | 'en';
  onToast: (msg: string, type?: 'info' | 'ok' | 'err' | 'warn') => void;
}

export const DogtagStudio: React.FC<DogtagStudioProps> = ({ user, lang, onToast }) => {
  const isEn = lang === 'en';

  const [soldierName, setSoldierName] = useState(user?.display_name || user?.username || 'GHOST_OPERATOR');
  const [clanTag, setClanTag] = useState('[W6W]');
  const [rank, setRank] = useState('LEGENDARY');
  const [camo, setCamo] = useState('camo-damascus');
  const [role, setRole] = useState('SNIPER / IGL');
  const [weapon, setWeapon] = useState('DL Q33');
  const [kdRatio, setKdRatio] = useState('3.85');
  const [tournamentsWon, setTournamentsWon] = useState('14');
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y - rect.height / 2) / rect.height) * -22;
    const ry = ((x - rect.width / 2) / rect.width) * 22;
    setTilt({ rx, ry });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const handleCopyBadge = () => {
    AudioFX.play('lock');
    const badgeText = `🪖 CODM SOLDIER DOGTAG: ${clanTag} ${soldierName} | Rank: ${rank} | Weapon: ${weapon} | Role: ${role} | Platform: https://codmrooms.w6w`;
    navigator.clipboard.writeText(badgeText);
    onToast(isEn ? '3D Gamer Dogtag badge copied to clipboard!' : 'کارت و آیدی گیمری در کلیپ‌بورد کپی شد!', 'ok');
  };

  return (
    <div className="dogtag-studio">
      <div className="meta-header">
        <h1>
          🎖️ <span>{isEn ? '3D HOLOGRAPHIC GAMER DOGTAG' : 'استودیو ساخت داگ‌تگ و کارت گیمری ۳D'}</span>
        </h1>
        <p>
          {isEn
            ? 'Personalize your Call of Duty Mobile competitor card with ranks, dynamic 3D foil holographic camos, and clan stats.'
            : 'کارت گیمری ۳ بعدی و اختصاصی خودت را شخصی‌سازی کن، رنک و آمار اسکواد را تنظیم کن و برای کلن خودت خروجی بگیر.'}
        </p>
      </div>

      <div className="dogtag-grid">
        <div className="dogtag-preview-wrap">
          <div
            className={`dogtag-card ${camo}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            }}
          >
            <div className="dogtag-holo-foil" />

            <div className="dogtag-top">
              <div className="dogtag-brand-tag">
                <span>🎯</span>
                <span>CODM <i>DOGTAG</i></span>
              </div>
              <div className="dogtag-rank-badge">
                ★ {rank} ★
              </div>
            </div>

            <div className="dogtag-body">
              <div className="dogtag-soldier-info">
                <h2>{clanTag} {soldierName}</h2>
                <div className="dogtag-uid">UID: 67429188049210941</div>
                <div className="dogtag-clan-role">
                  ⚡ ROLE: <b>{role}</b> • 🔫 <b>{weapon}</b>
                </div>
              </div>

              <div className="dogtag-stats-box">
                <div className="dt-stat">
                  <span className="dt-stat-v">{kdRatio}</span>
                  <span className="dt-stat-l">K/D RATIO</span>
                </div>
                <div className="dt-stat">
                  <span className="dt-stat-v">{tournamentsWon}</span>
                  <span className="dt-stat-l">VICTORIES</span>
                </div>
              </div>
            </div>

            <div className="dogtag-barcode">
              *CODM-W6W-PLATFORM*
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              className="btn lg"
              onClick={handleCopyBadge}
            >
              📋 {isEn ? 'Copy Gamer Dogtag Badge' : 'کپی نشان و کارت گیمری'}
            </button>
          </div>
        </div>

        <div className="dogtag-form">
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--acc)' }}>
            ⚙️ {isEn ? 'Customization Controls' : 'تنظیمات مشخصات سرباز'}
          </h3>

          <div className="form-grid-2">
            <div className="field">
              <label>{isEn ? 'Soldier In-Game Tag' : 'نام سرباز / گیمرتگ'}</label>
              <input
                value={soldierName}
                onChange={(e) => setSoldierName(e.target.value.toUpperCase())}
                placeholder="e.g. GHOST"
              />
            </div>

            <div className="field">
              <label>{isEn ? 'Clan Prefix' : 'پیشوند کلن'}</label>
              <input
                value={clanTag}
                onChange={(e) => setClanTag(e.target.value)}
                placeholder="[TAG]"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label>{isEn ? 'Military Rank' : 'رنک بتل / مولتی'}</label>
              <select
                value={rank}
                onChange={(e) => {
                  AudioFX.play('lock');
                  setRank(e.target.value);
                }}
              >
                <option value="LEGENDARY">🏆 LEGENDARY (لجندری)</option>
                <option value="GRAND MASTER">🎖️ GRAND MASTER (گرند مستر)</option>
                <option value="MASTER">⭐ MASTER (مستر)</option>
                <option value="PRO">⚔️ PRO (پرو)</option>
                <option value="ELITE">🔥 ELITE (الیت)</option>
              </select>
            </div>

            <div className="field">
              <label>{isEn ? 'Holographic Camo Foil' : 'پوسته متالیک هولوگرام'}</label>
              <select
                value={camo}
                onChange={(e) => {
                  AudioFX.play('click');
                  setCamo(e.target.value);
                }}
              >
                <option value="camo-damascus">🌈 Damascus (دمشق رنگین‌کمانی)</option>
                <option value="camo-diamond">💎 Diamond (الماسی کریستال)</option>
                <option value="camo-darkmatter">🌌 Dark Matter (دارک متر بنفش)</option>
                <option value="camo-gold">👑 Gold Plated (طلایی خالص)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label>{isEn ? 'Squad Combat Role' : 'نقش در اسکواد'}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="SNIPER / IGL">🎯 SNIPER / IGL (تک‌تیرانداز و فرمانده)</option>
                <option value="ENTRY RUSHER">⚡ ENTRY RUSHER (راشر نفوذی)</option>
                <option value="ASSAULT FRAGGER">🔥 ASSAULT FRAGGER (مهاجم تهاجمی)</option>
                <option value="SUPPORT / MEDIC">🛡️ SUPPORT (پشتیبان اسکواد)</option>
              </select>
            </div>

            <div className="field">
              <label>{isEn ? 'Signature Weapon' : 'اسلحه تخصصی'}</label>
              <select
                value={weapon}
                onChange={(e) => setWeapon(e.target.value)}
              >
                <option value="DL Q33">🎯 DL Q33</option>
                <option value="GRAU 5.56">🔫 GRAU 5.56</option>
                <option value="SWITCHBLADE X9">⚡ SWITCHBLADE X9</option>
                <option value="KRM-262">💥 KRM-262</option>
                <option value="ODEN">🔥 ODEN</option>
                <option value="LOCUS">🎯 LOCUS</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label>{isEn ? 'Kill/Death Ratio' : 'نسبت K/D'}</label>
              <input
                value={kdRatio}
                onChange={(e) => setKdRatio(e.target.value)}
                placeholder="3.85"
              />
            </div>

            <div className="field">
              <label>{isEn ? 'Tournaments Won' : 'تعداد قهرمانی‌ها'}</label>
              <input
                value={tournamentsWon}
                onChange={(e) => setTournamentsWon(e.target.value)}
                placeholder="14"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
