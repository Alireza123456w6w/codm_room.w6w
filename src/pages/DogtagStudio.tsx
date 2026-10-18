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
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

  // Render high-DPI holographic card to Canvas (1200x700)
  const generateCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const w = 1200;
    const h = 700;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // Helper for rounded rect
    const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // 1. Base dark battlefield background
    ctx.fillStyle = '#07090d';
    ctx.fillRect(0, 0, w, h);

    // 2. Card background based on camo
    const cardX = 35;
    const cardY = 35;
    const cardW = w - 70;
    const cardH = h - 70;
    const r = 26;

    roundRect(cardX, cardY, cardW, cardH, r);
    ctx.save();
    ctx.clip();

    // Camo gradients & high-tech foils
    if (camo === 'camo-damascus') {
      const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      grad.addColorStop(0, '#0c1024');
      grad.addColorStop(0.3, '#191230');
      grad.addColorStop(0.6, '#28122c');
      grad.addColorStop(1, '#0b1626');
      ctx.fillStyle = grad;
      ctx.fillRect(cardX, cardY, cardW, cardH);

      // Damascus holographic curves
      ctx.lineWidth = 16;
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      for (let i = -200; i < w + 200; i += 75) {
        ctx.beginPath();
        ctx.moveTo(i, cardY);
        ctx.bezierCurveTo(i + 130, cardY + 230, i - 130, cardY + 450, i + 90, cardY + cardH);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255, 65, 120, 0.18)';
      for (let i = -150; i < w + 200; i += 75) {
        ctx.beginPath();
        ctx.moveTo(i, cardY);
        ctx.bezierCurveTo(i - 90, cardY + 210, i + 150, cardY + 420, i, cardY + cardH);
        ctx.stroke();
      }
    } else if (camo === 'camo-gold') {
      const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      grad.addColorStop(0, '#261b07');
      grad.addColorStop(0.35, '#42310d');
      grad.addColorStop(0.7, '#1f1504');
      grad.addColorStop(1, '#362409');
      ctx.fillStyle = grad;
      ctx.fillRect(cardX, cardY, cardW, cardH);

      // Golden metallic brush
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.14)';
      for (let i = 0; i < cardH; i += 12) {
        ctx.beginPath();
        ctx.moveTo(cardX, cardY + i);
        ctx.lineTo(cardX + cardW, cardY + i);
        ctx.stroke();
      }
    } else if (camo === 'camo-diamond') {
      const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      grad.addColorStop(0, '#101622');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(cardX, cardY, cardW, cardH);

      // Diamond mesh pattern
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.12)';
      ctx.lineWidth = 1.5;
      const size = 36;
      for (let x = cardX; x < cardX + cardW + size; x += size) {
        for (let y = cardY; y < cardY + cardH + size; y += size) {
          ctx.beginPath();
          ctx.moveTo(x, y - size / 2);
          ctx.lineTo(x + size / 2, y);
          ctx.lineTo(x, y + size / 2);
          ctx.lineTo(x - size / 2, y);
          ctx.closePath();
          ctx.stroke();
        }
      }
    } else {
      // Dark Matter
      const grad = ctx.createRadialGradient(cardX + cardW / 2, cardY + cardH / 2, 50, cardX + cardW / 2, cardY + cardH / 2, cardW / 1.4);
      grad.addColorStop(0, '#430873');
      grad.addColorStop(0.5, '#1c0330');
      grad.addColorStop(1, '#07090d');
      ctx.fillStyle = grad;
      ctx.fillRect(cardX, cardY, cardW, cardH);
    }

    // Tech Grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = cardX; x < cardX + cardW; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, cardY);
      ctx.lineTo(x, cardY + cardH);
      ctx.stroke();
    }
    for (let y = cardY; y < cardY + cardH; y += 45) {
      ctx.beginPath();
      ctx.moveTo(cardX, y);
      ctx.lineTo(cardX + cardW, y);
      ctx.stroke();
    }

    ctx.restore();

    // 3. Holographic Border
    roundRect(cardX, cardY, cardW, cardH, r);
    ctx.lineWidth = 3.5;
    const bGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    bGrad.addColorStop(0, '#ff851b');
    bGrad.addColorStop(0.5, '#00e5ff');
    bGrad.addColorStop(1, '#ffd166');
    ctx.strokeStyle = bGrad;
    ctx.stroke();

    // 4. Header Bar
    ctx.fillStyle = '#ff851b';
    ctx.font = 'bold 28px "Russo One", Rajdhani, "Vazirmatn", sans-serif';
    ctx.fillText('🎯 CODM DOGTAG', cardX + 45, cardY + 65);
    ctx.fillStyle = '#8b9bb4';
    ctx.font = '700 16px "Rajdhani", "Vazirmatn", sans-serif';
    ctx.fillText('W6W COMPETITIVE TOURNAMENT ARENA // OPERATOR IDENTIFICATION', cardX + 270, cardY + 63);

    // Rank Badge Pill (Right)
    const rankPillW = 230;
    const rankPillH = 44;
    const rankPillX = cardX + cardW - rankPillW - 45;
    const rankPillY = cardY + 36;

    roundRect(rankPillX, rankPillY, rankPillW, rankPillH, 10);
    ctx.fillStyle = 'rgba(255, 107, 0, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#ff851b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffcf70';
    ctx.font = 'bold 18px "Russo One", Rajdhani, "Vazirmatn", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`★ ${rank} ★`, rankPillX + rankPillW / 2, rankPillY + 29);
    ctx.textAlign = 'start';

    // 5. Soldier Details
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px "Russo One", Rajdhani, "Vazirmatn", sans-serif';
    ctx.fillText(`${clanTag} ${soldierName}`, cardX + 45, cardY + 165);

    ctx.fillStyle = '#ff851b';
    ctx.font = 'bold 17px monospace, "Vazirmatn"';
    ctx.fillText('UID: 67429188049210941  •  SOLDIER CLEARANCE: TACTICAL-01  •  PLATFORM: W6W', cardX + 47, cardY + 205);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 20px "Rajdhani", "Vazirmatn", sans-serif';
    ctx.fillText(`⚡ COMBAT ROLE: ${role}`, cardX + 47, cardY + 252);

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 20px "Rajdhani", "Vazirmatn", sans-serif';
    ctx.fillText(`🔫 SIGNATURE WEAPON: ${weapon}`, cardX + 380, cardY + 252);

    // 6. Stats Boxes
    const boxW = 280;
    const boxH = 130;
    const boxY = cardY + 305;

    // Box 1: K/D Ratio
    roundRect(cardX + 45, boxY, boxW, boxH, 14);
    ctx.fillStyle = 'rgba(14, 18, 26, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 52px "Russo One", Rajdhani, sans-serif';
    ctx.fillText(kdRatio, cardX + 75, boxY + 72);
    ctx.fillStyle = '#8b9bb4';
    ctx.font = 'bold 16px "Rajdhani", "Vazirmatn", sans-serif';
    ctx.fillText('KILL / DEATH RATIO', cardX + 75, boxY + 106);

    // Box 2: Tournaments Won
    roundRect(cardX + 45 + boxW + 28, boxY, boxW, boxH, 14);
    ctx.fillStyle = 'rgba(14, 18, 26, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 107, 0, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ff851b';
    ctx.font = 'bold 52px "Russo One", Rajdhani, sans-serif';
    ctx.fillText(tournamentsWon, cardX + 45 + boxW + 28 + 30, boxY + 72);
    ctx.fillStyle = '#8b9bb4';
    ctx.font = 'bold 16px "Rajdhani", "Vazirmatn", sans-serif';
    ctx.fillText('TOURNAMENT VICTORIES', cardX + 45 + boxW + 28 + 30, boxY + 106);

    // Box 3: Verification Stamp
    const stampW = cardW - (boxW + 28) * 2 - 90;
    roundRect(cardX + 45 + (boxW + 28) * 2, boxY, stampW, boxH, 14);
    ctx.fillStyle = 'rgba(14, 18, 26, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 18px "Russo One", Rajdhani, "Vazirmatn", sans-serif';
    ctx.fillText('OFFICIAL COMPETITOR DOGTAG', cardX + 45 + (boxW + 28) * 2 + 28, boxY + 46);
    ctx.fillStyle = '#8b9bb4';
    ctx.font = '14px monospace, "Vazirmatn"';
    ctx.fillText('VERIFIED VIA CODM ROOMS BOT', cardX + 45 + (boxW + 28) * 2 + 28, boxY + 76);
    ctx.fillText('SECURE CYBER METADATA EMBEDDED', cardX + 45 + (boxW + 28) * 2 + 28, boxY + 102);

    // 7. Barcode Bottom
    ctx.fillStyle = '#64748b';
    ctx.font = '15px monospace';
    ctx.letterSpacing = '6px';
    ctx.fillText('* C O D M - W 6 W - C O M P E T I T I V E - S E C U R E *', cardX + 47, cardY + cardH - 40);

    // Alternating barcode lines
    ctx.fillStyle = '#8b9bb4';
    const bcX = cardX + cardW - 320;
    const bcY = cardY + cardH - 58;
    for (let i = 0; i < 280; i += 7) {
      const lw = (i % 14 === 0 || i % 21 === 0) ? 3.5 : 1.8;
      ctx.fillRect(bcX + i, bcY, lw, 34);
    }

    return canvas;
  };

  // Render high-DPI holographic card to Canvas and download as PNG
  const handleDownloadPng = () => {
    setDownloading(true);
    AudioFX.play('lock');

    try {
      const canvas = generateCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);

      // Modern download via blob for mobile and desktop stability
      canvas.toBlob((blob) => {
        if (!blob) {
          const fallbackLink = document.createElement('a');
          fallbackLink.download = `CODM_DOGTAG_${soldierName.replace(/\s+/g, '_')}.png`;
          fallbackLink.href = dataUrl;
          fallbackLink.click();
        } else {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `CODM_DOGTAG_${soldierName.replace(/\s+/g, '_')}.png`;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 3000);
        }
      }, 'image/png');

      onToast(isEn ? 'Gamer Dogtag card downloaded as high-res PNG! 📥' : 'کارت گیمری به صورت تصویر باکیفیت PNG دانلود شد! 📥', 'ok');
    } catch (err: any) {
      console.error('Download PNG failed:', err);
      onToast(isEn ? 'Failed to generate PNG' : 'خطا در ایجاد فایل PNG', 'err');
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenPreview = () => {
    AudioFX.play('click');
    try {
      const canvas = generateCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);
      setShowPreviewModal(true);
    } catch (err) {
      onToast(isEn ? 'Failed to preview image' : 'خطا در ساخت پیش‌نمایش تصویر', 'err');
    }
  };

  return (
    <div className="dogtag-studio">
      <div className="meta-header">
        <h1>
          🎖️ <span>{isEn ? '3D HOLOGRAPHIC GAMER DOGTAG' : 'استودیو ساخت داگ‌تگ و کارت گیمری ۳D'}</span>
        </h1>
        <p>
          {isEn
            ? 'Personalize your Call of Duty Mobile competitor card with ranks, dynamic 3D foil holographic camos, and clan stats — then download it as high-res PNG!'
            : 'کارت گیمری ۳ بعدی و اختصاصی خودت را شخصی‌سازی کن، رنک و آمار اسکواد را تنظیم کن و کارت را به صورت فایل عکس PNG باکیفیت دانلود کن.'}
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

          <div style={{ marginTop: '22px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn primary lg"
              onClick={handleDownloadPng}
              disabled={downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                fontSize: '15px',
                fontWeight: 800,
                boxShadow: '0 4px 18px rgba(255, 107, 0, 0.4)'
              }}
            >
              📥 {downloading ? (isEn ? 'Generating HD PNG...' : 'در حال ساخت فایل PNG...') : (isEn ? 'Download Dogtag (PNG)' : 'دانلود مستقیم کارت (PNG)')}
            </button>

            <button
              type="button"
              className="btn blk lg"
              onClick={handleOpenPreview}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                fontSize: '14.5px',
                fontWeight: 700
              }}
            >
              🖼️ {isEn ? 'Preview / Save' : 'پیش‌نمایش و ذخیره عکس'}
            </button>

            <button
              type="button"
              className="btn lg"
              onClick={handleCopyBadge}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px', fontSize: '14px' }}
            >
              📋 {isEn ? 'Copy Badge Text' : 'کپی نشان و متن کارت'}
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
                <option value="DL Q33">🎯 DL Q33 (Sniper)</option>
                <option value="GRAU 5.56">🔫 GRAU 5.56 (Assault)</option>
                <option value="SWITCHBLADE X9">⚡ SWITCHBLADE X9 (SMG)</option>
                <option value="KRM-262">💥 KRM-262 (Shotgun)</option>
                <option value="HS0405">💥 HS0405 (Lever Shotgun)</option>
                <option value="ODEN">🔥 ODEN (Heavy AR)</option>
                <option value="LOCUS">🎯 LOCUS (Sniper)</option>
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

      {/* ── مودال پیش‌نمایش و دانلود تصویر کارت گیمری ── */}
      {showPreviewModal && previewUrl && (
        <div className="modal-ov" onClick={(e) => { if (e.target === e.currentTarget) setShowPreviewModal(false); }}>
          <div className="modal wide" style={{ maxWidth: '820px', textAlign: 'center' }}>
            <button className="mclose" onClick={() => setShowPreviewModal(false)}>✕</button>

            <h3 style={{ marginBottom: '6px' }}>
              🖼️ {isEn ? '3D Gamer Dogtag Image' : 'تصویر کارت گیمری ۳D (کیفیت بالا PNG)'}
            </h3>
            <p className="msub" style={{ marginBottom: '16px' }}>
              {isEn
                ? 'Your high-res Call of Duty gamer card is ready! Long-press on mobile to save to gallery, or use the direct download button.'
                : 'کارت گیمری باکیفیت شما آماده است! در گوشی با نگه داشتن انگشت روی عکس گزینه Save Image را بزنید یا از دکمه دانلود مستقیم زیر استفاده کنید.'}
            </p>

            <div style={{ borderRadius: '14px', overflow: 'hidden', border: '2px solid var(--line2)', boxShadow: '0 8px 30px rgba(0,0,0,0.7)', marginBottom: '18px' }}>
              <img
                src={previewUrl}
                alt="CODM Gamer Dogtag"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={previewUrl}
                download={`CODM_DOGTAG_${soldierName.replace(/\s+/g, '_')}.png`}
                className="btn primary lg"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: 800
                }}
                onClick={() => AudioFX.play('lock')}
              >
                📥 {isEn ? 'Download PNG File' : 'دانلود مستقیم فایل PNG'}
              </a>

              <button
                type="button"
                className="btn lg"
                onClick={() => setShowPreviewModal(false)}
              >
                {isEn ? 'Close Window' : 'بستن پنجره'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
