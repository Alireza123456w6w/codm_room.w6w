import React, { useState, useEffect } from 'react';
import { User } from './types';
import { ApiService } from './services/api';
import { AudioFX } from './services/audio';

import { Header } from './components/Header';
import { Ticker } from './components/Ticker';
import { Reticle } from './components/Reticle';
import { CanvasFx } from './components/CanvasFx';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthModal } from './components/AuthModal';
import { SoundboardModal } from './components/SoundboardModal';
import { Toast, ToastMessage } from './components/Toast';

import { Home } from './pages/Home';
import { Rooms } from './pages/Rooms';
import { RoomDetail } from './pages/RoomDetail';
import { MetaLoadouts } from './pages/MetaLoadouts';
import { DogtagStudio } from './pages/DogtagStudio';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { Help } from './pages/Help';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<'fa' | 'en'>(
    (localStorage.getItem('codm_lang') as 'fa' | 'en') || 'fa'
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [soundboardOpen, setSoundboardOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add toast notification
  const addToast = (msg: string, type: 'info' | 'ok' | 'err' | 'warn' = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Language change effect
  const handleSetLang = (l: 'fa' | 'en') => {
    setLang(l);
    localStorage.setItem('codm_lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'en' ? 'ltr' : 'rtl';
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';

    // Verify existing user session
    if (ApiService.getToken()) {
      ApiService.getMe()
        .then((res) => {
          if (res.user) setUser(res.user);
        })
        .catch(() => {
          // Token expired or invalid
          ApiService.setToken('');
        });
    }
  }, []);

  // Hash change routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (!hash || hash === '') {
        setCurrentTab('home');
      } else if (hash.startsWith('rooms/')) {
        const id = parseInt(hash.replace('rooms/', ''), 10);
        if (id) {
          setSelectedRoomId(id);
          setCurrentTab('room_detail');
        } else {
          setCurrentTab('rooms');
        }
      } else {
        setCurrentTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'home') window.location.hash = '#/';
    else window.location.hash = `#/${tab}`;
  };

  const handleSelectRoom = (roomId: number) => {
    setSelectedRoomId(roomId);
    setCurrentTab('room_detail');
    window.location.hash = `#/rooms/${roomId}`;
  };

  const handleLogout = () => {
    ApiService.setToken('');
    setUser(null);
    AudioFX.play('click');
    addToast(lang === 'en' ? 'Logged out successfully' : 'با موفقیت از حساب خارج شدید', 'info');
    handleNav('home');
  };

  return (
    <div className="app-container">
      {/* ── مکان‌نمای رتیکل تاکتیکال ── */}
      <Reticle />

      {/* ── افکت‌های سینمایی پس‌زمینه (ذرات و جرقه) ── */}
      <CanvasFx />

      {/* ── هدر ناوبری اصلی ── */}
      <Header
        currentTab={currentTab}
        setCurrentTab={handleNav}
        user={user}
        onOpenAuth={(tab?: 'login' | 'register') => {
          setAuthModalTab(tab || 'login');
          setAuthModalOpen(true);
        }}
        lang={lang}
        setLang={handleSetLang}
        onLogout={handleLogout}
      />

      {/* ── تیکر اخبار تاکتیکال ── */}
      <Ticker lang={lang} />

      {/* ── محتوای اصلی صفحات ── */}
      <main id="app">
        {currentTab === 'home' && (
          <Home
            user={user}
            onOpenAuth={(tab?: 'login' | 'register') => {
              setAuthModalTab(tab || 'login');
              setAuthModalOpen(true);
            }}
            setCurrentTab={handleNav}
            lang={lang}
          />
        )}

        {currentTab === 'rooms' && (
          <Rooms
            onSelectRoom={handleSelectRoom}
            lang={lang}
          />
        )}

        {currentTab === 'room_detail' && selectedRoomId && (
          <RoomDetail
            roomId={selectedRoomId}
            user={user}
            onOpenAuth={() => {
              setAuthModalTab('login');
              setAuthModalOpen(true);
            }}
            onBack={() => handleNav('rooms')}
            lang={lang}
            onToast={addToast}
            onUserUpdate={setUser}
          />
        )}

        {currentTab === 'meta' && (
          <MetaLoadouts
            lang={lang}
            onToast={addToast}
          />
        )}

        {currentTab === 'dogtag' && (
          <DogtagStudio
            user={user}
            lang={lang}
            onToast={addToast}
          />
        )}

        {currentTab === 'profile' && (
          <Profile
            user={user}
            onOpenAuth={() => {
              setAuthModalTab('login');
              setAuthModalOpen(true);
            }}
            lang={lang}
            onToast={addToast}
            onUserUpdate={setUser}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {currentTab === 'admin' && (
          user?.role === 'admin' ? (
            <Admin
              user={user}
              lang={lang}
              onToast={addToast}
              onSelectRoom={handleSelectRoom}
            />
          ) : (
            <div className="sec empty">
              <div className="big">⛔️</div>
              <h2>{lang === 'en' ? 'Access Denied: Admin Clearance Required' : 'دسترسی غیرمجاز: دسترسی ادمین الزامی است'}</h2>
            </div>
          )
        )}

        {currentTab === 'help' && (
          <Help lang={lang} />
        )}
      </main>

      {/* ── فوتر تاکتیکال ── */}
      <Footer
        lang={lang}
        setCurrentTab={handleNav}
        onOpenSoundboard={() => setSoundboardOpen(true)}
      />

      {/* ── ناوبری پایین صفحه مخصوص موبایل ── */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={handleNav}
        lang={lang}
      />

      {/* ── مودال احراز هویت (ورود / ثبت‌نام) ── */}
      {authModalOpen && (
        <AuthModal
          initialTab={authModalTab}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(u) => setUser(u)}
          lang={lang}
          onToast={addToast}
        />
      )}

      {/* ── مودال بیسیم و دیالوگ‌های معروف کالاف ── */}
      {soundboardOpen && (
        <SoundboardModal
          onClose={() => setSoundboardOpen(false)}
          lang={lang}
        />
      )}

      {/* ── اعلان‌های تاکتیکال (Toast) ── */}
      <Toast toasts={toasts} />
    </div>
  );
};
export default App;
