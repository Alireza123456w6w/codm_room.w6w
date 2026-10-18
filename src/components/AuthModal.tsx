import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { AudioFX } from '../services/audio';
import { User } from '../types';

interface AuthModalProps {
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
  lang: 'fa' | 'en';
  onToast: (msg: string, type?: 'info' | 'ok' | 'err' | 'warn') => void;
}

function cleanDigits(s: string): string {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  return String(s || '')
    .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)))
    .trim();
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialTab = 'login',
  onClose,
  onSuccess,
  lang,
  onToast
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const isEn = lang === 'en';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = cleanDigits(password);

    if (!cleanUser || !cleanPass) {
      setError(isEn ? 'Please fill in username and password' : 'لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    if (cleanPass.length < 4) {
      setError(isEn ? 'Password must be at least 4 characters' : 'رمز عبور باید حداقل ۴ کاراکتر باشد');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        const res = await ApiService.login(cleanUser, cleanPass);
        AudioFX.play('lock');
        onToast(isEn ? `Welcome back, Soldier ${res.user.display_name || res.user.username}!` : `خوش آمدی سرباز ${res.user.display_name || res.user.username} 🪖`, 'ok');
        onSuccess(res.user);
        onClose();
      } else {
        const res = await ApiService.register(cleanUser, cleanPass, displayName.trim(), adminSecret.trim());
        AudioFX.play('lock');
        if (res.is_first_admin) {
          onToast(isEn ? '👑 You are the first recruit — granted Admin Chief role!' : '👑 شما اولین کاربر هستید — مدیر کل شدید!', 'ok');
        } else {
          onToast(isEn ? 'Account successfully recruited!' : 'حساب کاربری با موفقیت ساخته شد!', 'ok');
        }
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      AudioFX.play('reload');
      setError(err.message || (isEn ? 'Authentication failed' : 'نام کاربری یا رمز عبور اشتباه است'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-ov" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="mclose" onClick={onClose} aria-label="بستن">✕</button>

        {/* Tab selection */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--line2)', paddingBottom: '10px' }}>
          <button
            type="button"
            className={`btn ${tab === 'login' ? 'primary' : 'blk'}`}
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
            onClick={() => { setTab('login'); setError(''); }}
          >
            🔐 {isEn ? 'Sign In' : 'ورود به حساب'}
          </button>
          <button
            type="button"
            className={`btn ${tab === 'register' ? 'primary' : 'blk'}`}
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
            onClick={() => { setTab('register'); setError(''); }}
          >
            🪖 {isEn ? 'Recruit Account' : 'ثبت‌نام'}
          </button>
        </div>

        <h3>
          {tab === 'login'
            ? (isEn ? '🔐 Soldier Sign In' : '🔐 ورود به حساب کاربری')
            : (isEn ? '🪖 Recruit New Soldier' : '🪖 ساخت حساب کاربری')}
        </h3>

        <p className="msub">
          {tab === 'login'
            ? (isEn ? 'Welcome back to the battlefield arena, soldier!' : 'به میدان نبرد خوش برگشتی، سرباز!')
            : (isEn ? 'Create your profile to book tournament slots and claim prize pools.' : 'حساب بساز، جایگاهت را در روم رزرو کن و جوایز نقدی ببر.')}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{isEn ? 'Username (English characters only)' : 'نام کاربری (انگلیسی)'}</label>
            <input
              className="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alireza123456w6w"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label>{isEn ? 'Password' : 'رمز عبور'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                required
                style={{ width: '100%', paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--mut)',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
                title={showPass ? 'مخفی کردن' : 'نمایش رمز'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <>
              <div className="field">
                <label>{isEn ? 'In-Game Tag / Display Name (Optional)' : 'نام نمایشی یا آیدی گیمری (اختیاری)'}</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Simon Ghost"
                />
              </div>

              <div className="field">
                <label>{isEn ? 'Admin Secret Key (Optional)' : 'کد مدیر (اختیاری — فقط برای مدیریت)'}</label>
                <input
                  className="ltr"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Admin Secret"
                />
              </div>
            </>
          )}

          {error && <div className="malert err" style={{ marginBottom: '14px' }}>{error}</div>}

          <button
            type="submit"
            className="btn blk lg"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading
              ? (isEn ? 'Verifying...' : 'در حال بررسی...')
              : tab === 'login'
              ? (isEn ? '🔓 Deploy Sign In' : '🔓 ورود به حساب')
              : (isEn ? '⚔️ Create Soldier ID' : '⚔️ ثبت‌نام')}
          </button>
        </form>

        <p className="msub" style={{ textAlign: 'center', marginTop: '18px' }}>
          {tab === 'login'
            ? (isEn ? "Don't have a soldier profile yet?" : 'هنوز حساب نداری؟')
            : (isEn ? 'Already enlisted?' : 'قبلاً ثبت‌نام کرده‌ای؟')}{' '}
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--acc)',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: 0
            }}
            onClick={() => {
              AudioFX.play('click');
              setError('');
              setTab(tab === 'login' ? 'register' : 'login');
            }}
          >
            {tab === 'login'
              ? (isEn ? 'Recruit Now' : 'ثبت‌نام کن')
              : (isEn ? 'Sign In' : 'وارد شو')}
          </button>
        </p>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <small style={{ color: 'var(--mut)', fontSize: '11.5px', lineHeight: 1.6, display: 'block' }}>
            {isEn
              ? '💡 For security, password change is only accessible inside your profile after logging in, or via Telegram/Bale bot (/password).'
              : '💡 برای امنیت، تغییر رمز عبور در سایت تنها پس از ورود به حساب کاربری در بخش پروفایل، یا از طریق ربات بله/تلگرام با دستور /password امکان‌پذیر است.'}
          </small>
        </div>
      </div>
    </div>
  );
};
