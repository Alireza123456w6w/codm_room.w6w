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
    <nav className="mob-bottom-nav" aria-label="ناوبری موبایل">
      <button
        className={`mob-nav-item ${currentTab === 'home' ? 'on' : ''}`}
        onClick={() => handleNav('home')}
      >
        <span className="mob-nav-icon">🏠</span>
        <span className="mob-nav-label">{t.mobHome}</span>
      </button>

      <button
        className={`mob-nav-item ${currentTab === 'rooms' ? 'on' : ''}`}
        onClick={() => handleNav('rooms')}
      >
        <span className="mob-nav-icon">🎮</span>
        <span className="mob-nav-label">{t.mobRooms}</span>
      </button>

      <button
        className={`mob-nav-item ${currentTab === 'meta' ? 'on' : ''}`}
        onClick={() => handleNav('meta')}
      >
        <span className="mob-nav-icon">🔫</span>
        <span className="mob-nav-label">{t.mobMeta}</span>
      </button>

      <button
        className={`mob-nav-item ${currentTab === 'dogtag' ? 'on' : ''}`}
        onClick={() => handleNav('dogtag')}
      >
        <span className="mob-nav-icon">🎖️</span>
        <span className="mob-nav-label">{t.mobDogtag}</span>
      </button>

      <button
        className={`mob-nav-item ${currentTab === 'profile' ? 'on' : ''}`}
        onClick={() => handleNav('profile')}
      >
        <span className="mob-nav-icon">👤</span>
        <span className="mob-nav-label">{t.mobProfile}</span>
      </button>
    </nav>
  );
};
