import React from 'react';
import { AudioFX } from '../services/audio';

interface FooterProps {
  lang: 'fa' | 'en';
  setCurrentTab: (tab: string) => void;
  onOpenSoundboard: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  setCurrentTab,
  onOpenSoundboard
}) => {
  const isEn = lang === 'en';

  const handleNav = (tab: string) => {
    AudioFX.play('click');
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="foot-grid">
        <div className="foot-col">
          <div className="brand" style={{ cursor: 'pointer' }} onClick={() => handleNav('home')}>
            <span className="brand-emblem">🎯</span>
            <span className="brand-text">
              <b>CODM <i>ROOMS</i></b>
              <small>W6W PLATFORM</small>
            </span>
          </div>
          <p className="mut" id="footDesc" style={{ marginTop: '12px', lineHeight: 1.9 }}>
            {isEn
              ? 'Premier Call of Duty Mobile tournament platform — instant slot booking, squad seat maps, secure bot verification, and direct wallet cash prizes.'
              : 'مرجع مدیریت روم‌های کالاف دیوتی موبایل — ثبت‌نام آنلاین، انتخاب موقعیت، پرداخت امن و جوایز نقدی.'}
          </p>
          <div className="botids" id="botIds" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <a href="https://ble.ir/codm_room_bot" target="_blank" rel="noopener noreferrer" style={{ color: '#38a1ff', fontWeight: 600 }}>
              💬 {isEn ? 'Bale Bot: @codm_room_bot' : 'ربات بله: @codm_room_bot'}
            </a>
            <a href="https://t.me/codm_room_bot" target="_blank" rel="noopener noreferrer" style={{ color: '#229ed9', fontWeight: 600 }}>
              📱 {isEn ? 'Telegram Bot: @codm_room_bot' : 'ربات تلگرام: @codm_room_bot'}
            </a>
          </div>
        </div>

        <div className="foot-col">
          <h4>{isEn ? '⚔️ Quick Deploy' : '⚔️ دسترسی سریع'}</h4>
          <a href="#/rooms" onClick={(e) => { e.preventDefault(); handleNav('rooms'); }}>
            🎮 {isEn ? 'Tournament Rooms' : 'لیست روم‌ها'}
          </a>
          <a href="#/meta" onClick={(e) => { e.preventDefault(); handleNav('meta'); }}>
            🔫 {isEn ? 'Season Meta Loadouts' : 'لوداوت‌های متای سیزن'}
          </a>
          <a href="#/dogtag" onClick={(e) => { e.preventDefault(); handleNav('dogtag'); }}>
            🎖️ {isEn ? '3D Gamer Dogtag Studio' : 'کارت گیمری و داگ‌تگ ۳D'}
          </a>
          <a href="#/help" onClick={(e) => { e.preventDefault(); handleNav('help'); }}>
            📖 {isEn ? 'Tournament Field Manual' : 'راهنمای استفاده و قوانین'}
          </a>
          <a href="#/profile" onClick={(e) => { e.preventDefault(); handleNav('profile'); }}>
            👤 {isEn ? 'Soldier Profile & Wallet' : 'حساب کاربری من'}
          </a>
        </div>

        <div className="foot-col">
          <h4>{isEn ? '🛡 Support & Official Bots' : '🛡 پشتیبانی و کانال‌ها'}</h4>
          <a href="https://ble.ir/codm_room_bot" target="_blank" rel="noopener noreferrer">
            💬 {isEn ? 'Bale Receipt Bot' : 'ربات پرداخت بله'}
          </a>
          <a href="https://t.me/codm_room_bot" target="_blank" rel="noopener noreferrer">
            📱 {isEn ? 'Telegram Tournament Bot' : 'ربات روم تلگرام'}
          </a>
          <a href="https://t.me/offerspishnahadat_feedbackbot" target="_blank" rel="noopener noreferrer">
            🤖 {isEn ? 'Official Feedback Bot' : 'بات پشتیبانی پیشنهادات'}
          </a>
          <a href="https://t.me/offerspishnahadat_shop_bot" target="_blank" rel="noopener noreferrer">
            🛒 {isEn ? 'Channel Shop Bot' : 'ربات فروشگاه کانال'}
          </a>
          <a href="https://offers-pishnahadat.vercel.app" target="_blank" rel="noopener noreferrer">
            📣 {isEn ? 'Offers Website' : 'سایت کانال پیشنهادات'}
          </a>
          <a href="https://zaya.io/Offers_pishnahadat" target="_blank" rel="noopener noreferrer">
            🔗 {isEn ? 'Offers Hub Page' : 'صفحه‌های کانال پیشنهادات'}
          </a>
        </div>
      </div>

      <div className="foot-bottom">
        <div>
          © {new Date().getFullYear()} CODM ROOMS W6W —{' '}
          <span>{isEn ? 'Built with 🧡 for competitive mobile gamers' : 'ساخته شده با 🧡 برای گیمرها'}</span>{' '}
          <span className="apiver">v1.6.0 REACT</span>
        </div>
        <div className="foot-actions">
          <button
            type="button"
            className="fxreplay"
            onClick={onOpenSoundboard}
            title={isEn ? 'CODM Radio SFX & Dialogs' : 'بیسیم و دیالوگ‌های کالاف'}
          >
            📻 {isEn ? 'CODM Radio (Soundboard)' : 'بیسیم کالاف (Soundboard)'}
          </button>
          <button
            type="button"
            className="fxreplay"
            onClick={() => {
              AudioFX.play('lock');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title={isEn ? 'Return to Top' : 'بازگشت به بالای صفحه'}
          >
            🚀 {isEn ? 'Top of Battlefield' : 'بازگشت به بالا'}
          </button>
        </div>
      </div>
    </footer>
  );
};
