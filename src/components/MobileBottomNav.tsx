import React from 'react';
import { I18N } from '../i18n/translations';
import { AudioFX } from '../services/audio';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: 'fa' | 'en';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  lang
}) => {
  const t = I18N[lang];

  const handleNav = (tab: string) => {
    AudioFX.play('click');
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="mob-bottom-nav" aria-label="Tactical Navigation Bar">
      {/* 1. HQ / خانه */}
      <button
        type="button"
        className={`mob-nav-item ${currentTab === 'home' ? 'on' : ''}`}
        onClick={() => handleNav('home')}
        title={t.mobHome}
      >
        <span className="mob-icon-wrap">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mob-nav-svg"
            aria-hidden="true"
          >
            <path d="M3 10.5L12 3l9 7.5v9.5a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
            <polyline points="9 21 9 15 15 15 15 21" />
          </svg>
        </span>
        <span className="mob-nav-label">{t.mobHome}</span>
        <span className="mob-nav-dot" aria-hidden="true" />
      </button>

      {/* 2. تورنمنت‌ها و روم‌ها */}
      <button
        type="button"
        className={`mob-nav-item ${currentTab === 'rooms' || currentTab === 'room_detail' ? 'on' : ''}`}
        onClick={() => handleNav('rooms')}
        title={t.mobRooms}
      >
        <span className="mob-icon-wrap">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mob-nav-svg"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </span>
        <span className="mob-nav-label">{t.mobRooms}</span>
        <span className="mob-nav-dot" aria-hidden="true" />
      </button>

      {/* 3. لوداوت‌های متا و تسلیحات */}
      <button
        type="button"
        className={`mob-nav-item ${currentTab === 'meta' ? 'on' : ''}`}
        onClick={() => handleNav('meta')}
        title={t.mobMeta}
      >
        <span className="mob-icon-wrap">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mob-nav-svg"
            aria-hidden="true"
          >
            <path d="M2.5 13.5h5l2.5-3h9v2.5h2.5V9.5h-2.5V7.5L14 7.5l-2.2 3H8l-1.8 2H2.5v1z" />
            <path d="M6 14.5l-2 5.5h3.5l1.5-4" />
            <path d="M12.5 14.5l1 4h3l-.8-4" />
          </svg>
        </span>
        <span className="mob-nav-label">{t.mobMeta}</span>
        <span className="mob-nav-dot" aria-hidden="true" />
      </button>

      {/* 4. داگ‌تگ ۳D و کارت گیمری */}
      <button
        type="button"
        className={`mob-nav-item ${currentTab === 'dogtag' ? 'on' : ''}`}
        onClick={() => handleNav('dogtag')}
        title={t.mobDogtag}
      >
        <span className="mob-icon-wrap">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mob-nav-svg"
            aria-hidden="true"
          >
            <path d="M5 8.5C5 5.5 6.5 4 9.5 4h5c3 0 4.5 1.5 4.5 4.5v7c0 3-1.5 4.5-4.5 4.5h-5c-3 0-4.5-1.5-4.5-4.5v-7z" />
            <circle cx="9.5" cy="8" r="1.5" fill="currentColor" />
            <line x1="13" y1="7.5" x2="16.5" y2="7.5" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="8" y1="15.5" x2="14" y2="15.5" />
          </svg>
        </span>
        <span className="mob-nav-label">{t.mobDogtag}</span>
        <span className="mob-nav-dot" aria-hidden="true" />
      </button>

      {/* 5. حساب کاربری و سرباز */}
      <button
        type="button"
        className={`mob-nav-item ${currentTab === 'profile' ? 'on' : ''}`}
        onClick={() => handleNav('profile')}
        title={t.mobProfile}
      >
        <span className="mob-icon-wrap">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mob-nav-svg"
            aria-hidden="true"
          >
            <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
            <path d="M4 21v-1.5a6.5 6.5 0 0 1 13 0V21" />
            <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
            <line x1="9" y1="10" x2="15" y2="10" strokeWidth="2" />
          </svg>
        </span>
        <span className="mob-nav-label">{t.mobProfile}</span>
        <span className="mob-nav-dot" aria-hidden="true" />
      </button>
    </nav>
  );
};
