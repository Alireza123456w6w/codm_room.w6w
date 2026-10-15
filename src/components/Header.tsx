import React, { useState } from 'react';
import { User } from '../types';
import { I18N, money, fa } from '../i18n/translations';
import { AudioFX } from '../services/audio';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  lang: 'fa' | 'en';
  setLang: (lang: 'fa' | 'en') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenAuth,
  lang,
  setLang,
  onLogout
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sfxOn, setSfxOn] = useState(AudioFX.isEnabled());
  const t = I18N[lang];
  const isEn = lang === 'en';

  const handleToggleSfx = () => {
    const next = AudioFX.toggle();
    setSfxOn(next);
  };

  const handleToggleLang = () => {
    AudioFX.play('click');
    const next = lang === 'fa' ? 'en' : 'fa';
    setLang(next);
  };

  const handleNav = (tab: string) => {
    AudioFX.play('click');
    setCurrentTab(tab);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="topbar">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => handleNav('home')}>
        <span className="brand-emblem">🎯</span>
        <span className="brand-text">
          <b>CODM <i>ROOMS</i></b>
          <small>W6W PLATFORM</small>
        </span>
      </div>

      <nav className={`mainnav ${menuOpen ? 'openm' : ''}`} id="mainnav">
        <a
          href="#/"
          className={currentTab === 'home' ? 'on' : ''}
          onClick={(e) => { e.preventDefault(); handleNav('home'); }}
        >
          {t.navHome}
        </a>
        <a
          href="#/rooms"
          className={currentTab === 'rooms' ? 'on' : ''}
          onClick={(e) => { e.preventDefault(); handleNav('rooms'); }}
        >
          {t.navRooms}
        </a>
        <a
          href="#/meta"
          className={currentTab === 'meta' ? 'on' : ''}
          onClick={(e) => { e.preventDefault(); handleNav('meta'); }}
        >
          {t.navMeta}
        </a>
        <a
          href="#/dogtag"
          className={currentTab === 'dogtag' ? 'on' : ''}
          onClick={(e) => { e.preventDefault(); handleNav('dogtag'); }}
        >
          {t.navDogtag}
        </a>
        <a
          href="#/help"
          className={currentTab === 'help' ? 'on' : ''}
          onClick={(e) => { e.preventDefault(); handleNav('help'); }}
        >
          {t.navHelp}
        </a>

        {/* Mobile menu user actions */}
        <div className="mainnav-mob-actions">
          {user ? (
            <>
              <div className="mob-user-summary">
                <b>🪖 {user.display_name || user.username}</b>
                <span style={{ color: 'var(--acc2)', fontWeight: 800 }}>
                  {isEn ? `${money(user.wallet)} T` : `${fa(money(user.wallet))} ت`}
                </span>
              </div>
              <button
                className="mob-nav-act-btn"
                onClick={() => handleNav('profile')}
              >
                👤 {isEn ? 'My Profile & Wallet' : 'حساب من و کیف پول'}
              </button>
              {user.role === 'admin' && (
                <button
                  className="mob-nav-act-btn adm"
                  onClick={() => handleNav('admin')}
                >
                  🛡 {isEn ? 'Admin Headquarters' : 'پنل مدیریت'}
                </button>
              )}
              <button
                className="mob-nav-act-btn bad"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                🚪 {isEn ? 'Log Out' : 'خروج از حساب'}
              </button>
            </>
          ) : (
            <>
              <button
                className="mob-nav-act-btn primary"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAuth('login');
                }}
              >
                🔐 {isEn ? 'Sign In / Register' : 'ورود به حساب / ثبت‌نام'}
              </button>
              <a
                href="https://ble.ir/codm_room_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="mob-nav-act-btn bale"
              >
                💬 {isEn ? 'Bale Bot (Receipts)' : 'ربات بله (ارسال فیش)'}
              </a>
              <a
                href="https://t.me/codm_room_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="mob-nav-act-btn tg"
              >
                📱 {isEn ? 'Telegram Bot' : 'ربات تلگرام'}
              </a>
            </>
          )}
        </div>
      </nav>

      <div className="topbar-actions">
        {user ? (
          <>
            {user.role === 'admin' && (
              <button
                className={`btn ghost sm ${currentTab === 'admin' ? 'good' : ''}`}
                onClick={() => handleNav('admin')}
                title={isEn ? 'Admin Panel' : 'پنل مدیریت'}
              >
                🛡 {t.adminPanel}
              </button>
            )}
            <div
              className="userchip"
              onClick={() => handleNav('profile')}
              title={isEn ? 'My Profile' : 'حساب من'}
            >
              <span className="nm">{user.display_name || user.username}</span>
              <span className="wal">
                {isEn ? `${money(user.wallet)} T` : `${fa(money(user.wallet))} ت`}
              </span>
            </div>
          </>
        ) : (
          <button
            className="btn sm pulse-btn"
            onClick={() => onOpenAuth('login')}
          >
            {t.loginRegister}
          </button>
        )}
      </div>

      <div className="topbar-controls">
        <button
          className={`tctrl-btn ${sfxOn ? 'active' : ''}`}
          onClick={handleToggleSfx}
          title={isEn ? 'Tactical Audio SFX' : 'افکت‌های صوتی تاکتیکال'}
        >
          <span className="sfx-icon">{sfxOn ? '🔊' : '🔇'}</span>
          <span className="sfx-txt">{sfxOn ? 'SFX ON' : 'SFX OFF'}</span>
        </button>
        <button
          className="tctrl-btn lang-btn"
          onClick={handleToggleLang}
          title={isEn ? 'تغییر به زبان فارسی' : 'Switch to English'}
        >
          <span className="lang-flag">🌐</span>
          <span className="lang-txt">{lang === 'fa' ? 'EN' : 'FA'}</span>
        </button>
      </div>

      <button
        className="burger"
        aria-label="منو"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>
    </header>
  );
};
