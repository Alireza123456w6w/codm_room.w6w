import React, { useEffect, useState } from 'react';
import { User, Transaction, Prize } from '../types';
import { money, fa } from '../i18n/translations';
import { ApiService } from '../services/api';
import { AudioFX } from '../services/audio';

interface ProfileProps {
  user: User | null;
  onOpenAuth: () => void;
  lang: 'fa' | 'en';
  onToast: (msg: string, type?: 'info' | 'ok' | 'err' | 'warn') => void;
  onUserUpdate: (u: User) => void;
  onSelectRoom: (roomId: number) => void;
}

export const Profile: React.FC<ProfileProps> = ({
  user,
  onOpenAuth,
  lang,
  onToast,
  onUserUpdate,
  onSelectRoom
}) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [referral, setReferral] = useState<{ uses: number; earned: number }>({ uses: 0, earned: 0 });
  const [loading, setLoading] = useState(true);

  // Profile Edit
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [codmId, setCodmId] = useState(user?.codm_id || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Dedicated Password Change System
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);

  // Topup Modal & Proof Submission
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('50000');
  const [topupRef, setTopupRef] = useState('');
  const [topupCardData, setTopupCardData] = useState<{ number: string; name: string; bank: string } | null>(null);
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupPaymentId, setTopupPaymentId] = useState<number | null>(null);
  const [topupBotLink, setTopupBotLink] = useState('');
  const [topupReceiptImage, setTopupReceiptImage] = useState('');
  const [topupReceiptUploading, setTopupReceiptUploading] = useState(false);

  // Bot Link Code
  const [linkCode, setLinkCode] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const isEn = lang === 'en';

  const loadData = () => {
    if (!user) return;
    setLoading(true);
    ApiService.getMe()
      .then((res) => {
        onUserUpdate(res.user);
        setEntries(res.entries || []);
        setTransactions(res.transactions || []);
        setPrizes(res.prizes || []);
        if (res.referral) setReferral(res.referral);
        setDisplayName(res.user.display_name || '');
        setCodmId(res.user.codm_id || '');
      })
      .catch((err) => {
        onToast(err.message || 'خطا در بارگذاری اطلاعات حساب', 'err');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="sec empty">
        <div className="big">🔐</div>
        <h2>{isEn ? 'Soldier Profile Locked' : 'پروفایل قفل است'}</h2>
        <p className="mut" style={{ marginTop: '8px', marginBottom: '20px' }}>
          {isEn
            ? 'Sign in to access your wallet, tournament credentials, and referral bounty.'
            : 'برای مشاهده کیف پول، بلیت‌های روم‌ها و آمار معرف وارد حساب خود شوید.'}
        </p>
        <button className="btn lg" onClick={onOpenAuth}>
          {isEn ? 'Sign In / Register' : 'ورود / ثبت‌نام'}
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await ApiService.updateMe({
        display_name: displayName.trim(),
        codm_id: codmId.trim()
      });
      AudioFX.play('lock');
      onUserUpdate(res.user);
      onToast(isEn ? 'Profile updated successfully!' : 'اطلاعات پروفایل با موفقیت بروزرسانی شد!', 'ok');
    } catch (err: any) {
      onToast(err.message || 'خطا در ذخیره پروفایل', 'err');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩';
    const cleanDigits = (s: string) => String(s || '').replace(/[۰-۹]/g, (d) => String(fa.indexOf(d))).replace(/[٠-٩]/g, (d) => String(ar.indexOf(d))).trim();
    const cleanCurrent = cleanDigits(currentPassword);
    const cleanNew = cleanDigits(newPassword);
    const cleanConfirm = cleanDigits(confirmPassword);

    if (cleanNew.length < 4) {
      onToast(isEn ? 'New password must be at least 4 characters.' : 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.', 'warn');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      onToast(isEn ? 'New passwords do not match!' : 'تکرار رمز عبور جدید همخوانی ندارد!', 'err');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await ApiService.changePassword(cleanCurrent, cleanNew);
      AudioFX.play('lock');
      onUserUpdate(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassSuccess(true);
      setTimeout(() => setPassSuccess(false), 5000);
      onToast(isEn ? 'Password updated successfully! 🔐' : 'رمز عبور شما با موفقیت بروزرسانی شد! 🔐', 'ok');
    } catch (err: any) {
      onToast(err.message || (isEn ? 'Failed to update password' : 'خطا در تغییر رمز عبور'), 'err');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(topupAmount);
    if (!amount || amount < 10000) {
      onToast(isEn ? 'Minimum topup is 10,000 Toman' : 'حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است', 'warn');
      return;
    }
    setTopupSubmitting(true);
    try {
      const res = await ApiService.topup(amount, 'card', topupRef.trim());
      AudioFX.play('lock');
      if (res.card) {
        setTopupCardData(res.card);
      }
      if (res.payment_id) {
        setTopupPaymentId(res.payment_id);
      }
      if (res.bot_link) {
        setTopupBotLink(res.bot_link);
      } else if (res.payment_id) {
        setTopupBotLink(`https://ble.ir/codm_room_bot?start=pay_${res.payment_id}`);
      }
      onToast(isEn ? 'Top-up initiated. Please send receipt photo via Bale bot or attach here.' : 'درخواست شارژ ثبت شد. لطفاً عکس فیش را از طریق ربات بله ارسال یا در فرم پیوست فرمایید.', 'ok');
      loadData();
    } catch (err: any) {
      onToast(err.message || 'خطا در ثبت شارژ', 'err');
    } finally {
      setTopupSubmitting(false);
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onToast(isEn ? 'Image size must be less than 5MB' : 'حجم عکس فیش باید کمتر از ۵ مگابایت باشد', 'warn');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setTopupReceiptImage(reader.result as string);
      onToast(isEn ? 'Receipt photo selected! Click submit to confirm.' : 'عکس فیش انتخاب شد! دکمه ارسال عکس رسید را بزنید.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSendProofImage = async () => {
    if (!topupPaymentId) return;
    if (!topupReceiptImage) {
      onToast(isEn ? 'Receipt photo is required! Please attach image or send via Bale bot.' : 'ارسال تصویر یا عکس فیش رسید الزامی است! با کد پیگیری به تنهایی امکان تایید وجود ندارد.', 'warn');
      return;
    }
    setTopupReceiptUploading(true);
    try {
      await ApiService.submitPaymentRef(topupPaymentId, topupRef.trim(), topupReceiptImage);
      AudioFX.play('lock');
      onToast(isEn ? 'Payment receipt photo submitted! 📸' : 'عکس فیش با موفقیت ثبت شد و برای مدیریت ارسال گردید! 📸', 'ok');
      setTopupModal(false);
      setTopupPaymentId(null);
      setTopupCardData(null);
      setTopupReceiptImage('');
      setTopupRef('');
      loadData();
    } catch (err: any) {
      onToast(err.message || 'خطا در ثبت تصویر فیش', 'err');
    } finally {
      setTopupReceiptUploading(false);
    }
  };

  const handleLinkBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) return;
    setLinkSubmitting(true);
    try {
      const res = await ApiService.linkAccount(linkCode.trim());
      AudioFX.play('lock');
      onUserUpdate(res.user);
      setLinkCode('');
      onToast(isEn ? 'Bale / Telegram Bot account successfully synchronized!' : 'اکانت ربات بله / تلگرام با موفقیت به این حساب متصل شد! ✅', 'ok');
      loadData();
    } catch (err: any) {
      onToast(err.message || 'خطا در اتصال به ربات', 'err');
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleCopy = (txt: string, msg: string) => {
    AudioFX.play('click');
    navigator.clipboard.writeText(txt);
    onToast(msg, 'ok');
  };

  return (
    <div className="sec">
      {/* ── خلاصه سرباز و کیف پول ── */}
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          clipPath: 'var(--clip)',
          padding: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '32px',
              background: 'var(--grad)',
              clipPath: 'var(--clip-sm)'
            }}
          >
            🪖
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900 }}>
              {user.display_name || user.username}
            </h1>
            <div className="mut" style={{ fontSize: '13px', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span>@{user.username}</span>
              {user.codm_id && <span>CODM: <b>{user.codm_id}</b></span>}
              <span style={{ color: user.role === 'admin' ? '#ff8b96' : 'var(--acc2)', fontWeight: 800 }}>
                {user.role === 'admin' ? (isEn ? '🛡️ HEAD ADMIN' : '🛡️ مدیر کل پلتفرم') : (isEn ? 'SOLDIER' : 'سرباز میدان')}
              </span>
            </div>
          </div>
        </div>

        {/* جعبه کیف پول */}
        <div
          style={{
            background: 'rgba(255,107,0,0.1)',
            border: '1px solid rgba(255,159,26,0.4)',
            borderRadius: '12px',
            padding: '16px 22px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--mut)', fontWeight: 700 }}>
            {isEn ? 'AVAILABLE WALLET BALANCE' : 'موجودی کیف پول شما'}
          </div>
          <div style={{ fontSize: '26px', fontFamily: 'Russo One', color: 'var(--acc2)' }}>
            {isEn ? `${money(user.wallet)} Toman` : `${fa(money(user.wallet))} تومان`}
          </div>
          <button
            className="btn sm"
            onClick={() => setTopupModal(true)}
          >
            💳 {isEn ? 'Top Up Wallet' : 'افزایش موجودی'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* ── بلیت‌های من و اطلاعات روم‌ها ── */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '22px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎫</span>
            <span>{isEn ? 'My Active Tournaments & Tickets' : 'بلیت‌ها و روم‌های رزرو شده من'}</span>
          </h3>

          {entries.length === 0 ? (
            <p className="mut" style={{ fontSize: '13px', lineHeight: 1.8 }}>
              {isEn
                ? 'You have not reserved any tournament slots yet. Check out the Rooms tab to deploy!'
                : 'در حال حاضر در هیچ رومی ثبت‌نام نکرده‌اید. برای شرکت، به بخش روم‌ها بروید.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {entries.map((entry) => (
                <div
                  key={entry.slot_id}
                  style={{
                    background: 'var(--panel2)',
                    border: '1px solid var(--line2)',
                    borderRadius: '8px',
                    padding: '14px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectRoom(entry.room_id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <b style={{ fontSize: '14px' }}>{entry.title}</b>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '100px',
                        fontWeight: 800,
                        background: entry.status === 'paid' ? 'rgba(46,204,113,0.2)' : 'rgba(255,192,72,0.2)',
                        color: entry.status === 'paid' ? 'var(--good)' : 'var(--warn)'
                      }}
                    >
                      {entry.status === 'paid' ? (isEn ? 'CONFIRMED' : 'قطعی شد') : (isEn ? 'PENDING' : 'در انتظار تایید')}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--mut)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>📍 {entry.team_label || (isEn ? 'Team' : 'تیم')} — {isEn ? `Seat #${entry.slot_no}` : `جایگاه #${fa(entry.slot_no)}`}</span>
                    {entry.code_id && (
                      <span style={{ color: 'var(--good)', fontWeight: 800 }}>
                        🔓 Room ID: {entry.code_id} {entry.code_pass ? `| Pass: ${entry.code_pass}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── سیستم کد معرف و پاداش ── */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '22px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎁</span>
            <span>{isEn ? 'Referral Bounty Hub' : 'کد معرف و کسب درآمد'}</span>
          </h3>

          <p className="mut" style={{ fontSize: '13px', lineHeight: 1.8, marginBottom: '14px' }}>
            {isEn
              ? 'Share your unique invite code with friends. For every recruit that joins a paid tournament, you earn 10,000 Toman directly in your wallet!'
              : 'کد اختصاصی زیر را برای دوستانت بفرست؛ به ازای هر بار ثبت‌نام قطعی آن‌ها در روم‌های پولی، ۱۰,۰۰۰ تومان پاداش به کیف پولت اضافه می‌شود.'}
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
            <div
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--acc)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontFamily: 'Russo One',
                fontSize: '18px',
                color: 'var(--acc2)',
                textAlign: 'center',
                letterSpacing: '2px'
              }}
            >
              {user.referral_code || 'W6W-CODM'}
            </div>
            <button
              className="btn good"
              onClick={() => handleCopy(user.referral_code || 'W6W-CODM', isEn ? 'Referral code copied!' : 'کد معرف کپی شد!')}
            >
              📋 {isEn ? 'Copy' : 'کپی'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'var(--panel2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontFamily: 'Russo One', color: 'var(--acc)' }}>
                {isEn ? referral.uses : fa(referral.uses)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '4px' }}>
                {isEn ? 'Recruits Invited' : 'دوستان دعوت‌شده'}
              </div>
            </div>

            <div style={{ background: 'var(--panel2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontFamily: 'Russo One', color: 'var(--good)' }}>
                {isEn ? `${money(referral.earned)} T` : `${fa(money(referral.earned))} ت`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '4px' }}>
                {isEn ? 'Total Bounty Earned' : 'مجموع درآمد کسب‌شده'}
              </div>
            </div>
          </div>
        </div>

        {/* ── اتصال اکانت به ربات‌های بله و تلگرام ── */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '22px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔗</span>
            <span>{isEn ? 'Synchronize Bale & Telegram Bot' : 'اتصال اکانت به ربات بله و تلگرام'}</span>
          </h3>

          <p className="mut" style={{ fontSize: '13px', lineHeight: 1.8, marginBottom: '14px' }}>
            {isEn
              ? 'Send /link in @codm_room_bot, paste the 6-digit sync code here, and unite your site profile with the bot.'
              : 'در ربات بله یا تلگرام دستور /link را بفرست و کد دریافت شده را اینجا وارد کن تا اکانت سایت و ربات متصل شوند.'}
          </p>

          <form onSubmit={handleLinkBot} style={{ display: 'flex', gap: '10px' }}>
            <input
              className="ltr"
              placeholder="e.g. 849201"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              style={{ flex: 1 }}
              required
            />
            <button
              type="submit"
              className="btn"
              disabled={linkSubmitting}
            >
              {linkSubmitting ? '...' : (isEn ? 'Link Bot' : 'اتصال')}
            </button>
          </form>

          <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--mut)' }}>
            <div>💬 {isEn ? 'Bale ID:' : 'شناسه بله:'} <b>{user.bale_id ? `✅ متصل (${user.bale_id})` : '❌ متصل نیست'}</b></div>
            <div style={{ marginTop: '4px' }}>📱 {isEn ? 'Telegram ID:' : 'شناسه تلگرام:'} <b>{user.telegram_id ? `✅ متصل (${user.telegram_id})` : '❌ متصل نیست'}</b></div>
          </div>
        </div>

        {/* ── ویرایش مشخصات سرباز ── */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '22px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️</span>
            <span>{isEn ? 'Profile Settings' : 'ویرایش مشخصات سرباز'}</span>
          </h3>

          <form onSubmit={handleSaveProfile}>
            <div className="field">
              <label>{isEn ? 'Display Name / Gamer Tag' : 'نام نمایشی / آیدی گیمری'}</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ghost Sniper"
              />
            </div>

            <div className="field">
              <label>{isEn ? 'Call of Duty Mobile In-Game UID' : 'آیدی عددی کالاف دیوتی (CODM UID)'}</label>
              <input
                className="ltr"
                value={codmId}
                onChange={(e) => setCodmId(e.target.value)}
                placeholder="67491028301"
              />
            </div>

            <button
              type="submit"
              className="btn blk"
              disabled={savingProfile}
            >
              {savingProfile ? (isEn ? 'Saving...' : 'در حال ذخیره...') : (isEn ? 'Save Profile' : 'ذخیره مشخصات')}
            </button>
          </form>
        </div>

        {/* ── سیستم تغییر رمز عبور و امنیت حساب ── */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '22px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔐</span>
            <span>{isEn ? 'Change Password & Security' : 'سیستم تغییر رمز عبور و امنیت'}</span>
          </h3>

          <p className="mut" style={{ fontSize: '13px', lineHeight: 1.8, marginBottom: '16px' }}>
            {isEn
              ? 'Keep your soldier account secure. Passwords must be at least 4 characters.'
              : 'برای ورود به سایت و حفظ امنیت حساب، رمز عبور خود را بروزرسانی کنید (حداقل ۴ کاراکتر).'}
          </p>

          {passSuccess && (
            <div style={{
              background: 'rgba(46, 204, 113, 0.15)',
              border: '1px solid var(--good)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--good)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span>
              <span>{isEn ? 'Password changed successfully! You can now use it to sign in.' : 'رمز عبور با موفقیت تغییر کرد! از این پس با رمز جدید وارد شوید.'}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="field">
              <label>{isEn ? 'Current Password (if already set)' : 'رمز عبور فعلی (در صورت وجود)'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  className="ltr"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={isEn ? 'Enter current password...' : 'رمز فعلی حسابت را بنویس...'}
                  style={{ width: '100%', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
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
                  title={showCurrentPass ? 'مخفی کردن' : 'نمایش رمز'}
                >
                  {showCurrentPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="field">
              <label>{isEn ? 'New Password' : 'رمز عبور جدید'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  className="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isEn ? 'At least 4 characters...' : 'حداقل ۴ کاراکتر...'}
                  required
                  style={{ width: '100%', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
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
                  title={showNewPass ? 'مخفی کردن' : 'نمایش رمز'}
                >
                  {showNewPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="field">
              <label>{isEn ? 'Confirm New Password' : 'تکرار رمز عبور جدید'}</label>
              <input
                type={showNewPass ? 'text' : 'password'}
                className="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isEn ? 'Re-type new password...' : 'رمز عبور جدید را دوباره وارد کنید...'}
                required
              />
            </div>

            <button
              type="submit"
              className="btn blk"
              disabled={changingPassword || !newPassword}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>🔑</span>
              <span>{changingPassword ? (isEn ? 'Updating Password...' : 'در حال تغییر رمز...') : (isEn ? 'Update Password' : 'تغییر و ثبت رمز جدید')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* ── مودال افزایش شارژ کیف پول ── */}
      {topupModal && (
        <div className="modal-ov" onClick={(e) => { if (e.target === e.currentTarget) setTopupModal(false); }}>
          <div className="modal">
            <button className="mclose" onClick={() => setTopupModal(false)} aria-label="بستن">✕</button>

            <h3>💳 {isEn ? 'Top Up Tournament Wallet' : 'افزایش موجودی کیف پول مسابقاتی'}</h3>
            <p className="msub">
              {isEn
                ? 'Transfer via Card-to-Card and send the receipt photo directly in Bale Bot for instant verification.'
                : 'مبلغ مورد نظر را واریز کرده و جهت تایید فوری، عکس فیش را در ربات بله ارسال یا در فرم زیر پیوست کنید.'}
            </p>

            {!topupCardData ? (
              <form onSubmit={handleTopup}>
                <div className="field">
                  <label>{isEn ? 'Deposit Amount (Toman)' : 'مبلغ افزایش به تومان:'}</label>
                  <input
                    type="number"
                    className="ltr"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    min="10000"
                    step="5000"
                    required
                  />
                  <small style={{ color: 'var(--mut)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn primary lg"
                  disabled={topupSubmitting}
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {topupSubmitting ? '...' : (isEn ? 'Proceed to Payment Card & Receipt' : '💳 دریافت شماره کارت و ثبت رسید')}
                </button>
              </form>
            ) : (
              <div>
                {/* ── کارت اطلاعات حساب مقصد ── */}
                <div style={{ background: 'rgba(255,107,0,0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,159,26,0.4)', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <b style={{ color: 'var(--acc2)', fontSize: '14px' }}>🏦 اطلاعات شماره کارت جهت واریز:</b>
                    <span className="badge" style={{ background: 'rgba(46,204,113,0.2)', color: 'var(--good)' }}>پرداخت #{topupPaymentId}</span>
                  </div>
                  <div>🏦 بانک: <b>{topupCardData.bank || 'بانک سپه'}</b></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span>🔢 شماره کارت:</span>
                    <code style={{ color: 'var(--good)', fontSize: '16px', fontWeight: 800 }}>{topupCardData.number}</code>
                    <button
                      type="button"
                      className="btn sm"
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => {
                        navigator.clipboard.writeText(topupCardData.number);
                        onToast(isEn ? 'Card number copied!' : 'شماره کارت کپی شد! ✅', 'ok');
                      }}
                    >
                      📋 کپی
                    </button>
                  </div>
                  <div style={{ marginTop: '6px' }}>👤 به نام: <b>{topupCardData.name}</b></div>
                  <div style={{ marginTop: '6px', fontSize: '14px' }}>
                    💰 مبلغ دقیق واریز: <b style={{ color: 'var(--acc)' }}>{money(Number(topupAmount))} تومان</b>
                  </div>
                </div>

                {/* ── روش اصلی و رسمی: ارسال عکس رسید در ربات بله ── */}
                <div style={{ background: 'rgba(46, 204, 113, 0.12)', border: '2px solid var(--good)', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--good)', marginBottom: '6px' }}>
                    📸 {isEn ? 'Official Method: Submit Receipt Photo via Bale Bot' : 'روش اصلی و رسمی: ارسال عکس فیش در ربات بله (الزامی)'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--txt)', margin: '0 0 12px', lineHeight: 1.6 }}>
                    {isEn
                      ? '⚠️ Tracking transactions via text codes alone is not possible. You must send your receipt photo in Bale Bot for rapid automated balance credit.'
                      : '⚠️ توجه مهم: به دلیل غیرقابل پیگیری بودن کدهای متنی، تایید تراکنش‌ها و شارژ کیف پول منحصراً با ارسال تصویر فیش واریز در ربات بله انجام می‌شود. روی دکمه زیر بزنید و عکس رسید را در ربات بفرستید تا حسابتان فوراً شارژ شود.'}
                  </p>

                  <a
                    href={topupBotLink || `https://ble.ir/codm_room_bot?start=pay_${topupPaymentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn primary lg"
                    style={{
                      width: '100%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                      fontSize: '15px',
                      fontWeight: 800,
                      boxShadow: '0 4px 18px rgba(46, 204, 113, 0.4)'
                    }}
                    onClick={() => AudioFX.play('lock')}
                  >
                    💬 {isEn ? 'Open Bale Bot & Submit Receipt Photo' : '💬 ورود به ربات بله جهت ارسال عکس رسید'}
                  </a>
                </div>

                {/* ── روش دوم: پیوست مستقیم عکس رسید در سایت ── */}
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--txt)', marginBottom: '6px' }}>
                    📎 {isEn ? 'Or upload receipt image directly on website (Image Required):' : '📎 یا عکس فیش را همین‌جا بارگذاری کنید (عکس رسید الزامی است):'}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptFileChange}
                    style={{ fontSize: '12px', marginTop: '2px', width: '100%' }}
                  />

                  {topupReceiptImage ? (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <img
                        src={topupReceiptImage}
                        alt="Receipt preview"
                        style={{ maxHeight: '140px', borderRadius: '8px', border: '2px solid var(--good)', display: 'inline-block' }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--good)', marginTop: '4px', fontWeight: 700 }}>
                        ✅ {isEn ? 'Receipt photo attached' : 'عکس فیش پیوست شد و آماده ارسال است'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--warn)', marginTop: '6px' }}>
                      ⚠️ {isEn ? 'A receipt photo is strictly required' : 'انتخاب عکس یا اسکرین‌شات فیش الزامی است'}
                    </div>
                  )}

                  <div className="field" style={{ marginTop: '10px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11.5px' }}>{isEn ? 'Tracking number on receipt (Optional):' : 'کد پیگیری مندرج در فیش (اختیاری):'}</label>
                    <input
                      className="ltr"
                      placeholder="e.g. 98124501"
                      value={topupRef}
                      onChange={(e) => setTopupRef(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn sm"
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      background: topupReceiptImage ? 'var(--good)' : 'rgba(255,255,255,0.1)',
                      color: topupReceiptImage ? '#000' : 'var(--mut)',
                      fontWeight: 800,
                      cursor: topupReceiptImage ? 'pointer' : 'not-allowed'
                    }}
                    disabled={topupReceiptUploading || !topupReceiptImage}
                    onClick={handleSendProofImage}
                  >
                    {topupReceiptUploading ? 'در حال ثبت...' : (isEn ? '📤 Submit Receipt Photo on Website' : '📤 ثبت عکس رسید در سایت')}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn ghost sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setTopupCardData(null);
                      setTopupPaymentId(null);
                    }}
                  >
                    🔙 تغییر مبلغ
                  </button>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => setTopupModal(false)}
                  >
                    بستن
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
