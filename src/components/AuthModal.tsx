import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { AudioFX } from '../services/audio';
import { User } from '../types';

interface AuthModalProps {
  initialTab?: 'login' | 'register' | 'reset';
  onClose: () => void;
  onSuccess: (user: User) => void;
  lang: 'fa' | 'en';
  onToast: (msg: string, type?: 'info' | 'ok' | 'err' | 'warn') => void;
}

// Helper to convert Persian/Arabic digits to ASCII
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
  const [tab, setTab] = useState<'login' | 'register' | 'reset'>(initialTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [botId, setBotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const isEn = lang === 'en';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = cleanDigits(password);
    const cleanBot = cleanDigits(botId);

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
      } else if (tab === 'register') {
        const res = await ApiService.register(cleanUser, cleanPass, displayName.trim(), adminSecret.trim());
        AudioFX.play('lock');
        if (res.is_first_admin) {
          onToast(isEn ? '👑 You are the first recruit — granted Admin Chief role!' : '👑 شما اولین کاربر هستید — مدیر کل شدید!', 'ok');
        } else {
          onToast(isEn ? 'Account successfully recruited!' : 'حساب کاربری با موفقیت ساخته شد!', 'ok');
        }
        onSuccess(res.user);
        onClose();
      } else if (tab === 'reset') {
        if (!cleanBot) {
          setError(isEn ? 'Please enter your Telegram or Bale Chat ID' : 'لطفاً شناسه عددی ربات بله یا تلگرام خود را وارد کنید');
          setLoading(false);
          return;
        }
        const res = await ApiService.resetPassword(cleanUser, cleanBot, cleanPass);
        AudioFX.play('lock');
        onToast(isEn ? 'Password successfully changed! Logged in ✅' : 'رمز عبور با موفقیت تغییر یافت و وارد شدید ✅', 'ok');
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      AudioFX.play('reload');
      setError(err.message || (isEn ? 'Authentication failed' : 'خطا در احراز هویت'));
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
            🔐 {isEn ? 'Sign In' : 'ورود'}
          </button>
          <button
            type="button"
            className={`btn ${tab === 'register' ? 'primary' : 'blk'}`}
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
            onClick={() => { setTab('register'); setError(''); }}
          >
            🪖 {isEn ? 'Register' : 'ثبت‌نام'}
          </button>
          <button
            type="button"
            className={`btn ${tab === 'reset' ? 'primary' : 'blk'}`}
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
            onClick={() => { setTab('reset'); setError(''); }}
          >
            🔑 {isEn ? 'Reset Pass' : 'تغییر رمز'}
          </button>
        </div>

        <h3>
          {tab === 'login' && (isEn ? '🔐 Soldier Sign In' : '🔐 ورود به حساب کاربری')}
          {tab === 'register' && (isEn ? '🪖 Recruit New Soldier' : '🪖 ساخت حساب جدید')}
          {tab === 'reset' && (isEn ? '🔑 Reset / Change Password' : '🔑 بازیابی یا تغییر رمز عبور')}
        </h3>

        <p className="msub">
          {tab === 'login' && (isEn ? 'Welcome back to the battlefield arena, soldier!' : 'به میدان نبرد خوش برگشتی، سرباز!')}
          {tab === 'register' && (isEn ? 'Create your profile to book tournament slots and claim prize pools.' : 'حساب بساز، جایگاهت را در روم رزرو کن و جوایز نقدی ببر.')}
          {tab === 'reset' && (isEn ? 'Verify via your connected Telegram or Bale bot to change your password.' : 'با استفاده از شناسه ربات تلگرام یا بله متصل به حسابت، رمز جدید ثبت کن.')}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{isEn ? 'Username (English characters)' : 'نام کاربری (انگلیسی)'}</label>
            <input
              className="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alireza123456w6w"
              autoComplete="username"
              required
            />
          </div>

          {tab === 'reset' && (
            <div className="field">
              <label>
                {isEn ? 'Telegram or Bale Chat ID (Numeric)' : 'شناسه عددی ربات (Chat ID)'}
              </label>
              <input
                className="ltr"
                value={botId}
                onChange={(e) => setBotId(e.target.value)}
                placeholder={isEn ? 'e.g. 7359419988 or 498700399' : 'مثال: 7359419988 یا 498700399'}
                required
              />
              <small style={{ color: 'var(--mut)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                💡 {isEn ? 'Send /myid to @codm_room_bot on Telegram or Bale to get your ID' : 'برای دیدن شناسه خود، در ربات بله یا تلگرام دستور /myid را بفرستید.'}
              </small>
            </div>
          )}

          <div className="field">
            <label>
              {tab === 'reset'
                ? (isEn ? 'New Password' : 'رمز عبور جدید')
                : (isEn ? 'Password' : 'رمز عبور')}
            </label>
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
              : tab === 'register'
              ? (isEn ? '⚔️ Create Soldier ID' : '⚔️ ثبت‌نام')
              : (isEn ? '🔑 Set New Password & Sign In' : '🔑 ثبت رمز عبور جدید و ورود')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '14px' }}>
          {tab !== 'reset' && (
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--mut)',
                fontSize: '12.5px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              onClick={() => {
                AudioFX.play('click');
                setError('');
                setTab('reset');
              }}
            >
              🔑 {isEn ? 'Forgot or change password?' : 'رمز عبور خود را فراموش کرده‌اید یا می‌خواهید تغییر دهید؟'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
