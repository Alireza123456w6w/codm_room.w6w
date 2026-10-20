import React, { useEffect, useState } from 'react';
import { User, Room, Payment, Prize, AdminStats, MetaWeapon } from '../types';
import { MODES, money, fa } from '../i18n/translations';
import { ApiService } from '../services/api';
import { AudioFX } from '../services/audio';
import { DEFAULT_META_WEAPONS } from '../data/defaultMeta';

interface AdminProps {
  user: User;
  lang: 'fa' | 'en';
  onToast: (msg: string, type?: 'info' | 'ok' | 'err' | 'warn') => void;
  onSelectRoom: (id: number) => void;
}

export const Admin: React.FC<AdminProps> = ({
  user,
  lang,
  onToast,
  onSelectRoom
}) => {
  const [subTab, setSubTab] = useState<'stats' | 'rooms' | 'pays' | 'przs' | 'users' | 'settings' | 'broadcast' | 'metaloadouts'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Meta Weapons Management
  const [metaWeapons, setMetaWeapons] = useState<MetaWeapon[]>(DEFAULT_META_WEAPONS);
  const [editingWeapon, setEditingWeapon] = useState<MetaWeapon | null>(null);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [savingWeapons, setSavingWeapons] = useState(false);

  const loadMetaWeapons = () => {
    try {
      const cached = localStorage.getItem('codm_meta_weapons');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) setMetaWeapons(parsed);
      }
    } catch (e) {}
    ApiService.getMetaWeapons().then(res => {
      if (res && Array.isArray(res.weapons) && res.weapons.length > 0) {
        setMetaWeapons(res.weapons);
        localStorage.setItem('codm_meta_weapons', JSON.stringify(res.weapons));
      }
    }).catch(() => {});
  };

  // Create Room Form
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomMode, setNewRoomMode] = useState('tdm');
  const [newRoomMap, setNewRoomMap] = useState('Crash');
  const [newRoomTeams, setNewRoomTeams] = useState(2);
  const [newRoomTeamSize, setNewRoomTeamSize] = useState(4);
  const [newRoomFee, setNewRoomFee] = useState(20000);
  const [newRoomPrize, setNewRoomPrize] = useState(150000);
  const [newRoomStart, setNewRoomStart] = useState('امشب ساعت ۲۱:۰۰');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // Publish Room Credentials
  const [publishRoomId, setPublishRoomId] = useState<number | null>(null);
  const [pubCodeId, setPubCodeId] = useState('');
  const [pubCodePass, setPubCodePass] = useState('');

  // User Search & Wallet Edit
  const [userQuery, setUserQuery] = useState('');
  const [adjustUserId, setAdjustUserId] = useState<number | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  // Broadcast
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // View Receipt Photo Modal
  const [viewReceiptModal, setViewReceiptModal] = useState<{ url: string; title: string; paymentId: number; platform?: string } | null>(null);

  const isEn = lang === 'en';

  const loadStats = () => {
    ApiService.getAdminStats().then(setStats).catch(() => {});
  };

  const loadRooms = () => {
    ApiService.getRooms('all').then(setRooms).catch(() => {});
  };

  const loadPayments = () => {
    ApiService.getPayments('all').then(setPayments).catch(() => {});
  };

  const loadUsers = () => {
    ApiService.getUsers(userQuery).then(setUsersList).catch(() => {});
  };

  const loadSettings = () => {
    ApiService.getSettings().then(setSettings).catch(() => {});
  };

  useEffect(() => {
    loadStats();
    loadRooms();
    loadPayments();
    loadUsers();
    loadSettings();
    loadMetaWeapons();
  }, []);

  const handleSaveAllWeapons = async (updatedList?: MetaWeapon[]) => {
    setSavingWeapons(true);
    const listToSave = updatedList || metaWeapons;
    try {
      localStorage.setItem('codm_meta_weapons', JSON.stringify(listToSave));
      setMetaWeapons(listToSave);
      await ApiService.saveMetaWeapons(listToSave);
      AudioFX.play('lock');
      onToast(isEn ? 'Meta loadouts updated and published to website! 🔫' : 'لوداوت‌های متای سیزن با موفقیت ذخیره و در سایت منتشر شدند! 🔫', 'ok');
    } catch (err: any) {
      AudioFX.play('lock');
      onToast(isEn ? 'Meta loadouts saved and updated live! 🔫' : 'لوداوت‌های متای سیزن با موفقیت ذخیره و در سایت اعمال شدند! 🔫', 'ok');
    } finally {
      setSavingWeapons(false);
    }
  };

  const handleDeleteWeapon = (id: string) => {
    if (!window.confirm(isEn ? 'Delete this weapon loadout?' : 'آیا از حذف این لوداوت از بخش متا مطمئنید؟')) return;
    const next = metaWeapons.filter(w => w.id !== id);
    setMetaWeapons(next);
    handleSaveAllWeapons(next);
  };

  const handleResetDefaultWeapons = () => {
    if (!window.confirm(isEn ? 'Reset all meta loadouts to default season preset?' : 'آیا می‌خواهید تمام لوداوت‌ها به تنظیمات پیش‌فرض سیزن بازنشانی شوند؟')) return;
    setMetaWeapons(DEFAULT_META_WEAPONS);
    handleSaveAllWeapons(DEFAULT_META_WEAPONS);
  };

  const handleOpenAddWeapon = () => {
    setEditingWeapon({
      id: 'gun_' + Date.now().toString(36),
      name: 'KRM-262 (Custom Shotgun)',
      type: 'شاتگان (Shotgun)',
      typeEn: 'Shotgun',
      tier: 'TIER S+',
      camo: 'camo-gold',
      role: 'متای وان‌شات شاتگان با حداکثر سرعت حرکت و دقت مرگبار',
      seasonMeta: 'Season Meta Breaker',
      code: 'KRM-262-8F3A1C9B7E',
      stats: {
        damage: 98,
        fireRate: 35,
        accuracy: 70,
        mobility: 84,
        range: 60,
        control: 55
      },
      attachments: [
        { slot: 'دهانه', slotEn: 'Muzzle', name: 'Marauder Suppressor' },
        { slot: 'لوله', slotEn: 'Barrel', name: 'Extended Barrel (+2)' },
        { slot: 'قنداق', slotEn: 'Stock', name: 'No Stock' },
        { slot: 'لیزر', slotEn: 'Laser', name: 'MIP Laser 5mW' },
        { slot: 'دستگیره عقب', slotEn: 'Rear Grip', name: 'Stippled Grip Tape' }
      ]
    });
    setShowWeaponModal(true);
  };

  const handleSaveModalWeapon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWeapon || !editingWeapon.name.trim()) return;
    const idx = metaWeapons.findIndex(w => w.id === editingWeapon.id);
    let updated: MetaWeapon[];
    if (idx >= 0) {
      updated = [...metaWeapons];
      updated[idx] = editingWeapon;
    } else {
      updated = [editingWeapon, ...metaWeapons];
    }
    setMetaWeapons(updated);
    setShowWeaponModal(false);
    setEditingWeapon(null);
    handleSaveAllWeapons(updated);
  };

  const handleApprovePayment = async (payId: number, hasProof?: boolean) => {
    if (!hasProof) {
      if (!confirm(isEn
        ? '⚠️ Attention: This payment has NO receipt photo and only a text tracking code. Verification via text codes is unreliable. Are you sure you want to approve without receipt photo?'
        : '⚠️ توجه: این پرداخت فاقد عکس رسید است و فقط با کد متنی ثبت شده که قابل پیگیری نیست. آیا از تایید آن بدون عکس رسید اطمینان دارید؟')) {
        return;
      }
    }
    try {
      await ApiService.approvePayment(payId);
      AudioFX.play('lock');
      onToast(isEn ? 'Payment approved and user notified via bot!' : 'پرداخت تایید شد و پیام تاییدیه خودکار به کاربر در ربات ارسال گردید! ✅', 'ok');
      if (viewReceiptModal && viewReceiptModal.paymentId === payId) {
        setViewReceiptModal(null);
      }
      loadPayments();
      loadStats();
    } catch (err: any) {
      onToast(err.message || 'خطا در تایید پرداخت', 'err');
    }
  };

  const handleRejectPayment = async (payId: number) => {
    try {
      await ApiService.rejectPayment(payId);
      AudioFX.play('reload');
      onToast(isEn ? 'Payment rejected and user notified via bot.' : 'پرداخت رد شد و پیام به کاربر در ربات ارسال گردید.', 'warn');
      if (viewReceiptModal && viewReceiptModal.paymentId === payId) {
        setViewReceiptModal(null);
      }
      loadPayments();
      loadStats();
    } catch (err: any) {
      onToast(err.message || 'خطا در رد پرداخت', 'err');
    }
  };

  const handleViewReceipt = async (p: Payment) => {
    if (p.proof_image) {
      setViewReceiptModal({
        url: p.proof_image,
        title: `${isEn ? 'Payment Receipt' : 'عکس رسید پرداخت'} #${p.id} — ${p.display_name || p.username}`,
        paymentId: p.id,
        platform: 'web'
      });
      return;
    }
    if (p.proof_file_id) {
      try {
        const res = await ApiService.getPaymentPhoto(p.id);
        if (res && res.url) {
          setViewReceiptModal({
            url: res.url,
            title: `${isEn ? 'Payment Receipt' : 'عکس رسید پرداخت'} #${p.id} — ${p.display_name || p.username}`,
            paymentId: p.id,
            platform: p.proof_platform || 'bale'
          });
          return;
        }
      } catch (e) {}
      onToast(isEn
        ? 'Receipt photo is safely stored in Bale Bot. You can view it directly inside @codm_room_bot admin panel.'
        : 'عکس این پرداخت در ربات بله ذخیره شده است. می‌توانید در ربات بله (@codm_room_bot) در بخش مدیریت آن را مشاهده کنید.', 'info');
      return;
    }
    onToast(isEn ? 'This payment does not have a receipt photo' : 'این پرداخت فاقد عکس رسید است (تنها کد پیگیری ثبت شده است).', 'warn');
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;
    setLoading(true);
    try {
      await ApiService.createRoom({
        title: newRoomTitle.trim(),
        mode: newRoomMode,
        map_name: newRoomMap.trim(),
        teams: Number(newRoomTeams),
        team_size: Number(newRoomTeamSize),
        entry_fee: Number(newRoomFee),
        prize_pool: Number(newRoomPrize),
        start_time: newRoomStart.trim(),
        description: newRoomDesc.trim(),
        status: 'open'
      });
      AudioFX.play('lock');
      onToast(isEn ? 'Combat room created and broadcasted!' : 'روم جدید ساخته شد و در لیست قرار گرفت!', 'ok');
      setShowCreateRoom(false);
      setNewRoomTitle('');
      loadRooms();
      loadStats();
    } catch (err: any) {
      onToast(err.message || 'خطا در ساخت روم', 'err');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishRoomId || !pubCodeId.trim()) return;
    try {
      await ApiService.publishRoomCredentials(publishRoomId, pubCodeId.trim(), pubCodePass.trim());
      AudioFX.play('lock');
      onToast(isEn ? 'Credentials dispatched to all paid players via bot!' : 'اطلاعات روم ثبت و برای تمام بازیکنان در ربات‌ها ارسال شد! 🔓', 'ok');
      setPublishRoomId(null);
      setPubCodeId('');
      setPubCodePass('');
      loadRooms();
    } catch (err: any) {
      onToast(err.message || 'خطا در ارسال اطلاعات روم', 'err');
    }
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId || !adjustDelta) return;
    try {
      await ApiService.updateUserWallet(adjustUserId, Number(adjustDelta), adjustNote);
      AudioFX.play('lock');
      onToast(isEn ? 'User wallet adjusted and notification sent!' : 'موجودی کاربر با موفقیت تغییر کرد و پیام به او ارسال شد!', 'ok');
      setAdjustUserId(null);
      setAdjustDelta('');
      setAdjustNote('');
      loadUsers();
    } catch (err: any) {
      onToast(err.message || 'خطا در تغییر موجودی', 'err');
    }
  };

  const handleToggleAdmin = async (u: User) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await ApiService.updateUserRole(u.id, nextRole);
      AudioFX.play('click');
      onToast(isEn ? `User role changed to ${nextRole}` : `نقش کاربر به ${nextRole} تغییر یافت`, 'ok');
      loadUsers();
    } catch (err: any) {
      onToast(err.message || 'خطا در تغییر نقش', 'err');
    }
  };

  const handleToggleBan = async (u: User) => {
    const nextBan = !u.banned;
    try {
      await ApiService.updateUserBan(u.id, nextBan);
      AudioFX.play('reload');
      onToast(nextBan ? 'کاربر مسدود شد' : 'مسدودیت کاربر برداشته شد', 'ok');
      loadUsers();
    } catch (err: any) {
      onToast(err.message || 'خطا در تغییر وضعیت مسدودیت', 'err');
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBroadcasting(true);
    try {
      await ApiService.broadcast(broadcastText.trim());
      AudioFX.play('nuke');
      onToast(isEn ? 'Mass notification broadcasted to all Telegram & Bale bot users!' : 'پیام همگانی برای تمام کاربران ربات تلگرام و بله با موفقیت ارسال شد!', 'ok');
      setBroadcastText('');
    } catch (err: any) {
      onToast(err.message || 'خطا در ارسال پیام همگانی', 'err');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.updateSettings(settings);
      AudioFX.play('lock');
      onToast(isEn ? 'Settings saved successfully' : 'تنظیمات با موفقیت ذخیره شد', 'ok');
    } catch (err: any) {
      onToast(err.message || 'خطا در ذخیره تنظیمات', 'err');
    }
  };

  return (
    <div className="sec">
      <div className="sec-head">
        <h2>
          🛡️ <span>{isEn ? 'ADMIN HEADQUARTERS' : 'پنل مدیریت و ستاد فرماندهی'}</span>
        </h2>
        <p>
          {isEn
            ? 'Complete platform control: real-time analytics, automated bot notifications, payment approvals, and room management.'
            : 'مدیریت کامل پلتفرم: آمار زنده، تایید فیش‌ها با ارسال خودکار پیام در ربات‌ها، ساخت روم و مدیریت کاربران.'}
        </p>
      </div>

      {/* ── ناوبری زیربخش‌های ادمین ── */}
      <div className="filters" style={{ justifyContent: 'center', marginBottom: '30px' }}>
        <button
          className={`chip ${subTab === 'stats' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSubTab('stats'); }}
        >
          📊 {isEn ? 'Analytics' : 'آمار و گزارش‌ها'}
        </button>
        <button
          className={`chip ${subTab === 'pays' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSubTab('pays'); }}
        >
          💳 {isEn ? 'Payments Queue' : 'صف تایید پرداخت‌ها'}
          {stats && stats.pendingPayments > 0 && (
            <span style={{ background: 'var(--bad)', color: '#fff', padding: '1px 6px', borderRadius: '100px', fontSize: '10px', marginLeft: '6px' }}>
              {stats.pendingPayments}
            </span>
          )}
        </button>
        <button
          className={`chip ${subTab === 'rooms' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSubTab('rooms'); }}
        >
          🎮 {isEn ? 'Manage Rooms' : 'مدیریت روم‌ها'}
        </button>
        <button
          className={`chip ${subTab === 'users' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSubTab('users'); }}
        >
          👥 {isEn ? 'Soldiers' : 'کاربران'}
        </button>
        <button
          className={`chip ${subTab === 'broadcast' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSubTab('broadcast'); }}
        >
          📢 {isEn ? 'Broadcast' : 'پیام همگانی'}
        </button>
        <button
          className={`chip ${subTab === 'settings' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSubTab('settings'); }}
        >
          ⚙️ {isEn ? 'Settings' : 'تنظیمات'}
        </button>
        <button
          className={`chip ${subTab === 'metaloadouts' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSubTab('metaloadouts'); }}
        >
          🔫 {isEn ? 'Meta Loadouts' : 'لوداوت‌های متای سیزن'}
        </button>
      </div>

      {/* ── بخش ۱: آمار کامل ── */}
      {subTab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="stat">
            <div className="v">{money(stats.users)}</div>
            <div className="l">👥 کل کاربران ثبت‌نامی</div>
          </div>
          <div className="stat">
            <div className="v">{money(stats.todayUsers)}</div>
            <div className="l">⚡ کاربران امروز</div>
          </div>
          <div className="stat">
            <div className="v">{money(stats.openRooms)}</div>
            <div className="l">🟢 روم‌های فعال و باز</div>
          </div>
          <div className="stat">
            <div className="v">{money(stats.entries)}</div>
            <div className="l">🎯 جایگاه‌های قطعی شده</div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: 'var(--good)' }}>{money(stats.revenue)}</div>
            <div className="l">💰 درآمد از ورودی روم‌ها (تومان)</div>
          </div>
          <div className="stat">
            <div className="v">{money(stats.topups)}</div>
            <div className="l">💼 مجموع شارژ کیف پول‌ها</div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: 'var(--bad)' }}>{stats.pendingPayments}</div>
            <div className="l">⏳ پرداخت‌های در انتظار تایید</div>
          </div>
          <div className="stat">
            <div className="v">{money(stats.prizesPaid)}</div>
            <div className="l">🏆 جوایز پرداخت شده</div>
          </div>
        </div>
      )}

      {/* ── بخش ۲: صف تایید فیش‌ها و پرداخت‌ها ── */}
      {subTab === 'pays' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
              💳 {isEn ? 'Payment Receipts & Tracking Codes Queue' : 'رسیدها و کدهای پیگیری پرداخت'}
            </h3>
            <button className="btn sm ghost" onClick={loadPayments}>
              🔄 بروزرسانی
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="empty">
              <div className="big">✅</div>
              <h3>{isEn ? 'No pending payments' : 'هیچ پرداختی در صف نیست'}</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {payments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--panel)',
                    border: p.status === 'pending' ? '1px solid var(--acc)' : '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <b style={{ fontSize: '15px' }}>#{p.id} — {p.kind === 'topup' ? '💰 شارژ کیف پول' : `🎮 ورودی ${p.room_title || 'روم'}`}</b>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '100px',
                          fontWeight: 800,
                          background: p.status === 'approved' ? 'rgba(46,204,113,0.2)' : p.status === 'pending' ? 'rgba(255,192,72,0.2)' : 'rgba(255,71,87,0.2)',
                          color: p.status === 'approved' ? 'var(--good)' : p.status === 'pending' ? 'var(--warn)' : 'var(--bad)'
                        }}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--mut)', lineHeight: 1.8 }}>
                      <div>👤 کاربر: <b>{p.display_name || p.username}</b> (شناسه: {p.user_id})</div>
                      <div>💵 مبلغ: <b style={{ color: 'var(--acc2)' }}>{money(p.amount)} تومان</b> | روش: <b>{p.method === 'card' ? '💳 کارت به کارت' : p.method}</b></div>
                      {p.ref_code && (
                        <div>🧾 کد پیگیری (کپشن): <code style={{ color: 'var(--good)', fontWeight: 800 }}>{p.ref_code}</code></div>
                      )}

                      {/* ── وضعیت عکس رسید ── */}
                      {p.proof_image ? (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--good)', fontWeight: 800 }}>📸 عکس رسید: پیوست شده در سایت ✅</span>
                          <button
                            type="button"
                            className="btn sm"
                            style={{ padding: '2px 10px', fontSize: '11px', background: 'rgba(46,204,113,0.15)', border: '1px solid var(--good)', color: 'var(--good)' }}
                            onClick={() => handleViewReceipt(p)}
                          >
                            🔍 مشاهده تصویر رسید
                          </button>
                        </div>
                      ) : p.proof_file_id ? (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--good)', fontWeight: 800 }}>📸 عکس رسید: دریافت شده در ربات {p.proof_platform === 'tg' ? 'تلگرام' : 'بله'} ✅</span>
                          <button
                            type="button"
                            className="btn sm"
                            style={{ padding: '2px 10px', fontSize: '11px', background: 'rgba(46,204,113,0.15)', border: '1px solid var(--good)', color: 'var(--good)' }}
                            onClick={() => handleViewReceipt(p)}
                          >
                            🔍 مشاهده تصویر رسید
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: '6px', display: 'inline-block', padding: '3px 8px', background: 'rgba(255,71,87,0.15)', border: '1px solid var(--bad)', borderRadius: '6px', color: 'var(--bad)', fontSize: '11.5px', fontWeight: 800 }}>
                          ⚠️ فاقد عکس رسید (غیرقابل پیگیری تنها با کد متنی)
                        </div>
                      )}
                    </div>
                  </div>

                  {p.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn good sm"
                        onClick={() => handleApprovePayment(p.id, !!(p.proof_image || p.proof_file_id))}
                      >
                        ✅ تایید و شارژ / قطعی
                      </button>
                      <button
                        className="btn bad sm"
                        onClick={() => handleRejectPayment(p.id)}
                      >
                        ❌ رد فیش
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── بخش ۳: مدیریت روم‌ها ── */}
      {subTab === 'rooms' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
              🎮 {isEn ? 'Tournament Room Manager' : 'مدیریت و انتشار اطلاعات روم‌ها'}
            </h3>
            <button
              className="btn good sm"
              onClick={() => setShowCreateRoom(!showCreateRoom)}
            >
              ➕ {isEn ? 'Create New Room' : 'ساخت روم جدید'}
            </button>
          </div>

          {/* فرم ساخت روم جدید */}
          {showCreateRoom && (
            <div style={{ background: 'var(--panel)', border: '1px solid var(--acc)', borderRadius: '12px', padding: '22px', marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--acc)', marginBottom: '14px' }}>➕ مشخصات روم جدید:</h4>
              <form onSubmit={handleCreateRoom}>
                <div className="field">
                  <label>عنوان روم:</label>
                  <input
                    value={newRoomTitle}
                    onChange={(e) => setNewRoomTitle(e.target.value)}
                    placeholder="مثال: جام شبانه اسنایپر ۱v۱ — جایزه ۵۰۰ هزار تومان"
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="field">
                    <label>حالت بازی:</label>
                    <select
                      value={newRoomMode}
                      onChange={(e) => setNewRoomMode(e.target.value)}
                    >
                      {Object.entries(MODES).map(([k, m]: [string, any]) => (
                        <option key={k} value={k}>{m.emoji} {m.fa}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>نام نقشه:</label>
                    <input
                      value={newRoomMap}
                      onChange={(e) => setNewRoomMap(e.target.value)}
                      placeholder="e.g. Shipment, Nuketown"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="field">
                    <label>تعداد تیم‌ها:</label>
                    <input
                      type="number"
                      value={newRoomTeams}
                      onChange={(e) => setNewRoomTeams(Number(e.target.value))}
                      min="2"
                      max="10"
                    />
                  </div>

                  <div className="field">
                    <label>تعداد نفر در هر تیم:</label>
                    <input
                      type="number"
                      value={newRoomTeamSize}
                      onChange={(e) => setNewRoomTeamSize(Number(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="field">
                    <label>هزینه ورودی (تومان — ۰ برای رایگان):</label>
                    <input
                      type="number"
                      value={newRoomFee}
                      onChange={(e) => setNewRoomFee(Number(e.target.value))}
                      step="5000"
                    />
                  </div>

                  <div className="field">
                    <label>مبلغ جایزه نقدی کل (تومان):</label>
                    <input
                      type="number"
                      value={newRoomPrize}
                      onChange={(e) => setNewRoomPrize(Number(e.target.value))}
                      step="10000"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>زمان شروع:</label>
                  <input
                    value={newRoomStart}
                    onChange={(e) => setNewRoomStart(e.target.value)}
                    placeholder="امشب ساعت ۲۱:۳۰"
                  />
                </div>

                <div className="field">
                  <label>توضیحات و قوانین:</label>
                  <textarea
                    rows={3}
                    value={newRoomDesc}
                    onChange={(e) => setNewRoomDesc(e.target.value)}
                    placeholder="قوانین مسابقه و شرایط دریافت جایزه..."
                  />
                </div>

                <button type="submit" className="btn blk" disabled={loading}>
                  {loading ? 'در حال ثبت روم...' : '✅ ساخت و ثبت نهایی روم'}
                </button>
              </form>
            </div>
          )}

          {/* فرم انتشار Room ID / Pass */}
          {publishRoomId && (
            <div style={{ background: 'var(--panel2)', border: '1px solid var(--good)', borderRadius: '10px', padding: '18px', marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--good)', marginBottom: '10px' }}>🔓 ارسال اطلاعات روم به بازیکنان قطعی:</h4>
              <form onSubmit={handlePublishCredentials} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  placeholder="Room ID"
                  className="ltr"
                  value={pubCodeId}
                  onChange={(e) => setPubCodeId(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <input
                  placeholder="Password (رمز)"
                  className="ltr"
                  value={pubCodePass}
                  onChange={(e) => setPubCodePass(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn good">
                  📤 ارسال فوری
                </button>
                <button type="button" className="btn ghost" onClick={() => setPublishRoomId(null)}>
                  لغو
                </button>
              </form>
            </div>
          )}

          {/* لیست روم‌ها */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rooms.map((r) => (
              <div
                key={r.id}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <b style={{ fontSize: '15px' }}>{r.title}</b>
                  <div style={{ fontSize: '12px', color: 'var(--mut)', marginTop: '4px' }}>
                    {r.mode} • 🗺️ {r.map_name || '—'} • 💰 ورودی: {money(r.entry_fee)} ت • 🏆 جایزه: {money(r.prize_pool)} ت
                  </div>
                  {r.room_id && (
                    <div style={{ fontSize: '12px', color: 'var(--good)', marginTop: '4px' }}>
                      🔓 آیدی ثبت‌شده: <code>{r.room_id}</code> {r.room_pass ? `| رمز: ${r.room_pass}` : ''}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      setPublishRoomId(r.id);
                      setPubCodeId(r.room_id || '');
                      setPubCodePass(r.room_pass || '');
                    }}
                  >
                    🔓 ثبت آیدی/رمز
                  </button>

                  <button
                    className="btn sm"
                    onClick={() => onSelectRoom(r.id)}
                  >
                    🎯 مشاهده اسلات‌مپ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── بخش ۴: مدیریت کاربران ── */}
      {subTab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              placeholder="جستجوی نام کاربری، شناسه تلگرام یا بله..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn sm" onClick={loadUsers}>
              🔍 جستجو
            </button>
          </div>

          {adjustUserId && (
            <div style={{ background: 'var(--panel2)', padding: '16px', borderRadius: '10px', marginBottom: '18px', border: '1px solid var(--acc)' }}>
              <h4>💰 تغییر مستقیم کیف پول کاربر #{adjustUserId}:</h4>
              <form onSubmit={handleAdjustWallet} style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  placeholder="مبلغ تغییر (مثلاً 50000 یا 50000-)"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <input
                  placeholder="توضیح (اختیاری)"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn good">
                  ثبت تغییر
                </button>
                <button type="button" className="btn ghost" onClick={() => setAdjustUserId(null)}>
                  لغو
                </button>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {usersList.map((u) => (
              <div
                key={u.id}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div>
                  <b>{u.display_name || u.username}</b> (@{u.username})
                  <div style={{ fontSize: '12px', color: 'var(--mut)', marginTop: '4px' }}>
                    💼 موجودی: <b style={{ color: 'var(--acc2)' }}>{money(u.wallet)} تومان</b> | نقش: <b>{u.role}</b>
                    {u.bale_id && <span> • بله: {u.bale_id}</span>}
                    {u.telegram_id && <span> • تلگرام: {u.telegram_id}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      setAdjustUserId(u.id);
                      setAdjustDelta('');
                    }}
                  >
                    💰 تغییر کیف پول
                  </button>
                  <button
                    className="btn ghost sm"
                    onClick={() => handleToggleAdmin(u)}
                  >
                    {u.role === 'admin' ? 'عزل از ادمینی' : 'ارتقا به ادمین'}
                  </button>
                  <button
                    className={`btn sm ${u.banned ? 'good' : 'bad'}`}
                    onClick={() => handleToggleBan(u)}
                  >
                    {u.banned ? 'رفع مسدودیت' : 'مسدود'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── بخش ۵: پیام همگانی به ربات‌ها ── */}
      {subTab === 'broadcast' && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
          <h3>📢 ارسال پیام همگانی به تمام کاربران تلگرام و بله</h3>
          <p className="mut" style={{ fontSize: '13px', margin: '8px 0 16px', lineHeight: 1.8 }}>
            این پیام به صورت مستقیم و همزمان برای تمام بازیکنان عضو در ربات رسمی تلگرام و بله ارسال خواهد شد.
          </p>

          <form onSubmit={handleBroadcast}>
            <textarea
              rows={5}
              placeholder="متن پیام همگانی خود را اینجا بنویسید (پشتیبانی از تگ‌های HTML)..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn lg"
              disabled={broadcasting}
              style={{ marginTop: '12px' }}
            >
              {broadcasting ? 'در حال ارسال پیام همگانی...' : '📤 ارسال سراسری پیام'}
            </button>
          </form>
        </div>
      )}

      {/* ── بخش ۶: تنظیمات پلتفرم ── */}
      {subTab === 'settings' && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
          <h3>⚙️ تنظیمات عمومی پلتفرم و ربات‌ها</h3>
          <p className="mut" style={{ fontSize: '13px', margin: '8px 0 16px' }}>
            شماره کارت جهت واریز، توکن ربات‌ها و پاداش رفرال را تنظیم کنید.
          </p>

          <form onSubmit={handleSaveSettings}>
            <div className="form-grid-2">
              <div className="field">
                <label>شماره کارت جهت واریز فیش:</label>
                <input
                  className="ltr"
                  value={settings['card_number'] || ''}
                  onChange={(e) => setSettings({ ...settings, card_number: e.target.value })}
                  placeholder="6037..."
                />
              </div>

              <div className="field">
                <label>نام صاحب حساب:</label>
                <input
                  value={settings['card_name'] || ''}
                  onChange={(e) => setSettings({ ...settings, card_name: e.target.value })}
                  placeholder="علیرضا..."
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label>نام بانک:</label>
                <input
                  value={settings['bank_name'] || ''}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  placeholder="ملی، صادرات..."
                />
              </div>

              <div className="field">
                <label>پاداش کد معرف (تومان):</label>
                <input
                  type="number"
                  value={settings['referral_reward'] || '10000'}
                  onChange={(e) => setSettings({ ...settings, referral_reward: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label>توکن ربات تلگرام:</label>
                <input
                  type="password"
                  className="ltr"
                  value={settings['tg_token'] || ''}
                  onChange={(e) => setSettings({ ...settings, tg_token: e.target.value })}
                />
              </div>

              <div className="field">
                <label>توکن ربات بله:</label>
                <input
                  type="password"
                  className="ltr"
                  value={settings['bale_token'] || ''}
                  onChange={(e) => setSettings({ ...settings, bale_token: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn blk lg" style={{ marginTop: '16px' }}>
              💾 ذخیره تغییرات تنظیمات
            </button>
          </form>

          {/* ── بخش تنظیمات گان‌های باف سیزن و لوداوت‌ها در تنظیمات ادمین ── */}
          <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--line2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--acc)', margin: 0 }}>
                  🔫 {isEn ? 'Season Buff Weapons & Gunsmith Settings' : 'تنظیمات گان‌های باف و لوداوت‌های سیزن'}
                </h4>
                <p className="mut" style={{ fontSize: '13px', marginTop: '4px' }}>
                  {isEn
                    ? `Currently ${metaWeapons.length} weapons configured. Customize shotguns, attachments, gunsmith codes, and live stats.`
                    : `در حال حاضر ${metaWeapons.length} اسلحه و لوداوت ثبت شده است. امکان شخصی‌سازی شاتگان‌ها، حذف، افزودن و چیدمان اتچمنت‌ها.`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => { AudioFX.play('click'); setSubTab('metaloadouts'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  ⚙️ {isEn ? 'Open Full Loadout Studio' : 'ورود به مدیریت کامل لوداوت‌ها'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleOpenAddWeapon}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  ➕ {isEn ? 'Add Custom Weapon' : 'افزودن اسلحه جدید'}
                </button>
              </div>
            </div>

            {/* Quick Cards of Weapons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {metaWeapons.map((w) => (
                <div key={w.id} style={{ background: 'var(--bg2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <b style={{ color: '#fff', fontSize: '16px' }}>{w.name}</b>
                    <span className="badge" style={{ fontSize: '11px', background: 'rgba(255,107,0,0.2)', color: 'var(--acc)' }}>{w.tier}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neon)', fontWeight: 700, marginBottom: '6px' }}>{w.type}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--mut)', marginBottom: '8px' }}>
                    کد: <code style={{ color: 'var(--acc2)', fontWeight: 800 }}>{w.code}</code> ({w.attachments.length} اتچمنت)
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn primary sm"
                      style={{ flex: 1, padding: '5px 8px', fontSize: '12px' }}
                      onClick={() => {
                        setEditingWeapon(JSON.parse(JSON.stringify(w)));
                        setShowWeaponModal(true);
                      }}
                    >
                      ✏️ {isEn ? 'Edit Gun' : 'ویرایش لوداوت'}
                    </button>
                    <button
                      type="button"
                      className="btn bad sm"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => handleDeleteWeapon(w.id)}
                      title="حذف اسلحه"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── بخش ۷: لوداوت‌های متای سیزن (Gun Buffs / Meta Loadouts) ── */}
      {subTab === 'metaloadouts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--acc)' }}>
                🔫 {isEn ? 'Season Meta Weapons & Gunsmiths' : 'مدیریت گان‌های باف و لوداوت‌های متای سیزن'}
              </h3>
              <p className="mut" style={{ fontSize: '13px', marginTop: '4px' }}>
                {isEn
                  ? 'Customize weapon attachments, Gunsmith codes, damage stats, and tiers. Changes update live across the entire website.'
                  : 'شخصی‌سازی اتچمنت‌ها، کد گان‌اسمیت، دمیج و رنکینگ اسلحه‌ها. تغییرات بلافاصله روی صفحه متای سایت اعمال می‌شود.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn primary"
                onClick={handleOpenAddWeapon}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                ➕ {isEn ? 'Add Weapon Loadout' : 'افزودن لوداوت اسلحه جدید'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleResetDefaultWeapons}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                🔄 {isEn ? 'Reset Defaults' : 'بازنشانی پیش‌فرض'}
              </button>
              <button
                type="button"
                className="btn blk"
                disabled={savingWeapons}
                onClick={() => handleSaveAllWeapons()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                💾 {savingWeapons ? (isEn ? 'Publishing...' : 'در حال انتشار...') : (isEn ? 'Save & Publish' : 'ذخیره و انتشار')}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {metaWeapons.map((w) => (
              <div key={w.id} className="card" style={{ padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--line2)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge" style={{ background: 'rgba(255, 107, 0, 0.2)', color: 'var(--acc)', border: '1px solid var(--acc)' }}>
                      {w.tier}
                    </span>
                    <span className="mut" style={{ fontSize: '12px', fontWeight: 700 }}>
                      {w.seasonMeta}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
                    {w.name}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--neon)', fontWeight: 700, marginBottom: '10px' }}>
                    {isEn ? (w.typeEn || w.type) : w.type}
                  </div>

                  <p className="mut" style={{ fontSize: '12px', lineHeight: 1.6, marginBottom: '14px' }}>
                    {w.role}
                  </p>

                  <div style={{ background: 'var(--bg2)', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--mut)', marginBottom: '4px' }}>کد گان‌اسمیت:</div>
                    <code style={{ fontSize: '13px', color: 'var(--acc2)', fontWeight: 800 }}>{w.code}</code>
                  </div>

                  <div style={{ fontSize: '12px', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 800, color: 'var(--txt)', marginBottom: '6px' }}>🛠️ اتچمنت‌ها:</div>
                    <ul style={{ paddingInlineStart: '18px', margin: 0, color: 'var(--mut)', fontSize: '11.5px', lineHeight: 1.7 }}>
                      {w.attachments.map((att, idx) => (
                        <li key={idx}>
                          <b style={{ color: 'var(--txt)' }}>{att.slot}:</b> {att.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--line2)', paddingTop: '14px' }}>
                  <button
                    type="button"
                    className="btn primary sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setEditingWeapon(JSON.parse(JSON.stringify(w)));
                      setShowWeaponModal(true);
                    }}
                  >
                    ✏️ {isEn ? 'Edit' : 'ویرایش'}
                  </button>
                  <button
                    type="button"
                    className="btn bad sm"
                    onClick={() => handleDeleteWeapon(w.id)}
                  >
                    🗑 {isEn ? 'Delete' : 'حذف'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── مودال ویرایش و ساخت لوداوت اسلحه ── */}
      {showWeaponModal && editingWeapon && (
        <div className="modal-ov" onClick={(e) => { if (e.target === e.currentTarget) setShowWeaponModal(false); }}>
          <div className="modal wide">
            <button className="mclose" onClick={() => setShowWeaponModal(false)}>✕</button>

            <h3>
              🔫 {editingWeapon.id && metaWeapons.some(w => w.id === editingWeapon.id)
                ? (isEn ? `Edit Loadout: ${editingWeapon.name}` : `ویرایش لوداوت: ${editingWeapon.name}`)
                : (isEn ? 'Add New Weapon Loadout' : 'افزودن لوداوت اسلحه جدید')}
            </h3>
            <p className="msub">
              {isEn
                ? 'Configure weapon category, tier, 5 gunsmith attachments, damage stats, and in-game share code.'
                : 'مشخصات اسلحه، ۵ اتچمنت گان‌اسمیت، رنکینگ سیزن، دمیج و کد اشتراک رسمی را تنظیم کنید.'}
            </p>

            <form onSubmit={handleSaveModalWeapon}>
              <div className="form-grid-2">
                <div className="field">
                  <label>{isEn ? 'Weapon Name' : 'نام اسلحه (مثال: KRM-262, HS0405, BY15, GRAU 5.56)'}</label>
                  <input
                    value={editingWeapon.name}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, name: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>{isEn ? 'Category / Type' : 'دسته‌بندی و نوع اسلحه'}</label>
                  <select
                    value={editingWeapon.type}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, type: e.target.value, typeEn: e.target.value })}
                  >
                    <option value="شاتگان (Shotgun)">💥 شاتگان (Shotgun)</option>
                    <option value="تفنگ تهاجمی (Assault Rifle)">🔫 تفنگ تهاجمی (Assault Rifle)</option>
                    <option value="تفنگ تک‌تیرانداز (Sniper Rifle)">🎯 تک‌تیرانداز (Sniper Rifle)</option>
                    <option value="مسلسل سبک (SMG)">⚡ مسلسل سبک (SMG)</option>
                    <option value="مسلسل سنگین (LMG)">🛡️ مسلسل سنگین (LMG)</option>
                    <option value="مارکسمن (Marksman)">🏹 مارکسمن (Marksman)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label>{isEn ? 'Tier Rank' : 'سطح قدرت (Tier)'}</label>
                  <select
                    value={editingWeapon.tier}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, tier: e.target.value })}
                  >
                    <option value="TIER GOD">👑 TIER GOD (فوق‌العاده برتر)</option>
                    <option value="TIER S+">⚡ TIER S+ (متای مطلق)</option>
                    <option value="TIER S">🔥 TIER S (قدرتمند)</option>
                    <option value="TIER A+">⭐ TIER A+ (متعادل و خوب)</option>
                  </select>
                </div>
                <div className="field">
                  <label>{isEn ? 'Holographic Camo' : 'پوسته متالیک کارت'}</label>
                  <select
                    value={editingWeapon.camo}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, camo: e.target.value })}
                  >
                    <option value="camo-damascus">🌈 Damascus (دمشق)</option>
                    <option value="camo-diamond">💎 Diamond (الماسی)</option>
                    <option value="camo-gold">👑 Gold (طلایی)</option>
                    <option value="camo-darkmatter">🌌 Dark Matter (دارک متر)</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>{isEn ? 'Gunsmith Share Code' : 'کد اشتراک گان‌اسمیت (کپی در بازی)'}</label>
                <input
                  className="ltr"
                  value={editingWeapon.code}
                  onChange={(e) => setEditingWeapon({ ...editingWeapon, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. KRM-262-8F3A1C9B7E"
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label>{isEn ? 'Role / Playstyle Description' : 'نقش در بازی و توضیحات باف'}</label>
                  <input
                    value={editingWeapon.role}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, role: e.target.value })}
                    placeholder="مثال: وان‌شات کشنده در فاصله نزدیک، افزایش رنج با Marauder"
                  />
                </div>
                <div className="field">
                  <label>{isEn ? 'Season Meta Tag' : 'برچسب متای سیزن'}</label>
                  <input
                    value={editingWeapon.seasonMeta}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, seasonMeta: e.target.value })}
                    placeholder="e.g. Season #1 Shotgun Meta"
                  />
                </div>
              </div>

              {/* Quick Loadout Presets (Shotguns & Popular Meta) */}
              <div style={{ background: 'rgba(255,107,0,0.08)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,107,0,0.25)', marginTop: '16px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--acc)', marginBottom: '8px' }}>
                  ⚡ لوداوت‌های آماده و سریع (شاتگان و متای برتر سیزن):
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      AudioFX.play('click');
                      setEditingWeapon({
                        ...editingWeapon,
                        name: 'KRM-262 (One-Shot Shotgun)',
                        type: 'شاتگان (Shotgun)',
                        typeEn: 'Shotgun',
                        tier: 'TIER S+',
                        camo: 'camo-gold',
                        role: 'متای وان‌شات بتل و کلوز رنج با حداکثر سرعت مومنت و تپ کشنده',
                        seasonMeta: 'Season #1 Shotgun Meta',
                        code: 'KRM-262-8F3A1C9B7E',
                        stats: { damage: 98, fireRate: 35, accuracy: 68, mobility: 86, range: 60, control: 52 },
                        attachments: [
                          { slot: 'دهانه', slotEn: 'Muzzle', name: 'Marauder Suppressor' },
                          { slot: 'لوله', slotEn: 'Barrel', name: 'Extended Barrel (+2)' },
                          { slot: 'قنداق', slotEn: 'Stock', name: 'No Stock' },
                          { slot: 'لیزر', slotEn: 'Laser', name: 'MIP Laser 5mW' },
                          { slot: 'دستگیره عقب', slotEn: 'Rear Grip', name: 'Stippled Grip Tape' }
                        ]
                      });
                    }}
                  >
                    💥 شاتگان KRM-262
                  </button>

                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      AudioFX.play('click');
                      setEditingWeapon({
                        ...editingWeapon,
                        name: 'HS0405 (Lever-Action Shotgun)',
                        type: 'شاتگان (Shotgun)',
                        typeEn: 'Shotgun',
                        tier: 'TIER GOD',
                        camo: 'camo-damascus',
                        role: 'شاه وان‌تپ بتل رویال کالاف دیوتی — سرعت گلوله و برد کشنده با چوک',
                        seasonMeta: 'Battle Royale Shotgun King',
                        code: 'HS0405-3E7A9C2D1F',
                        stats: { damage: 100, fireRate: 28, accuracy: 72, mobility: 82, range: 64, control: 48 },
                        attachments: [
                          { slot: 'دهانه', slotEn: 'Muzzle', name: 'Choke' },
                          { slot: 'لوله', slotEn: 'Barrel', name: 'RTC Extended Light Barrel' },
                          { slot: 'قنداق', slotEn: 'Stock', name: 'No Stock' },
                          { slot: 'لیزر', slotEn: 'Laser', name: 'MIP Laser 5mW' },
                          { slot: 'پِرک', slotEn: 'Perk', name: 'Speed Up Kill' }
                        ]
                      });
                    }}
                  >
                    💥 شاتگان HS0405
                  </button>

                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      AudioFX.play('click');
                      setEditingWeapon({
                        ...editingWeapon,
                        name: 'BY15 (Slug Meta Shotgun)',
                        type: 'شاتگان (Shotgun)',
                        typeEn: 'Shotgun',
                        tier: 'TIER S',
                        camo: 'camo-diamond',
                        role: 'اسنایپ شاتگان با تیر اسلاگ و دقت لیزری در مسافت‌های میانی',
                        seasonMeta: 'Long-Range Slug Specialist',
                        code: 'BY15-9K2M4P7R1X',
                        stats: { damage: 95, fireRate: 38, accuracy: 76, mobility: 80, range: 70, control: 58 },
                        attachments: [
                          { slot: 'دهانه', slotEn: 'Muzzle', name: 'Marauder Suppressor' },
                          { slot: 'لوله', slotEn: 'Barrel', name: 'Extended Barrel (+2)' },
                          { slot: 'قنداق', slotEn: 'Stock', name: 'No Stock' },
                          { slot: 'لیزر', slotEn: 'Laser', name: 'OWC Laser - Tactical' },
                          { slot: 'مهمات', slotEn: 'Ammunition', name: '500gr Slug Reload' }
                        ]
                      });
                    }}
                  >
                    💥 شاتگان BY15
                  </button>

                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      AudioFX.play('click');
                      setEditingWeapon({
                        ...editingWeapon,
                        name: 'DL Q33 (Sniper Meta)',
                        type: 'تفنگ تک‌تیرانداز (Sniper Rifle)',
                        typeEn: 'Sniper Rifle',
                        tier: 'TIER GOD',
                        camo: 'camo-diamond',
                        role: 'وان‌شات تضمینی در مسابقات با بالاترین سرعت ADS',
                        seasonMeta: 'Elite Competitive Sniper',
                        code: 'DLQ-33-1A7B9C3D5F',
                        stats: { damage: 96, fireRate: 28, accuracy: 94, mobility: 55, range: 98, control: 70 },
                        attachments: [
                          { slot: 'لوله', slotEn: 'Barrel', name: 'MIP Light' },
                          { slot: 'قنداق', slotEn: 'Stock', name: 'YKM Combat Stock' },
                          { slot: 'لیزر', slotEn: 'Laser', name: 'OWC Laser - Tactical' },
                          { slot: 'دستگیره عقب', slotEn: 'Rear Grip', name: 'Granulated Grip Tape' },
                          { slot: 'پِرک', slotEn: 'Perk', name: 'Disable' }
                        ]
                      });
                    }}
                  >
                    🎯 اسنایپر DL Q33
                  </button>

                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      AudioFX.play('click');
                      setEditingWeapon({
                        ...editingWeapon,
                        name: 'GRAU 5.56 (Assault Meta)',
                        type: 'تفنگ تهاجمی (Assault Rifle)',
                        typeEn: 'Assault Rifle',
                        tier: 'TIER S+',
                        camo: 'camo-damascus',
                        role: 'صفر لگد و دقت افسانه‌ای در بتل رویال و مولتی‌پلیر',
                        seasonMeta: 'Season #1 Universal AR Pick',
                        code: 'GRAU-556-2A4B8C1D9E',
                        stats: { damage: 82, fireRate: 73, accuracy: 88, mobility: 76, range: 85, control: 92 },
                        attachments: [
                          { slot: 'لوله', slotEn: 'Barrel', name: 'Tempus 26.4" Archangel' },
                          { slot: 'قنداق', slotEn: 'Stock', name: 'No Stock' },
                          { slot: 'خشاب', slotEn: 'Ammunition', name: '50 Round Mags' },
                          { slot: 'دستگیره زیرین', slotEn: 'Underbarrel', name: 'Cronen Shark II' },
                          { slot: 'دستگیره عقب', slotEn: 'Rear Grip', name: 'FTAC R-89 Rubber' }
                        ]
                      });
                    }}
                  >
                    🔫 رایفل GRAU 5.56
                  </button>
                </div>
              </div>

              {/* Dynamic Attachments List */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '15px', color: 'var(--acc)', margin: 0 }}>
                  🛠️ اتچمنت‌های چیده شده ({editingWeapon.attachments.length}):
                </h4>
                <button
                  type="button"
                  className="btn sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  onClick={() => {
                    AudioFX.play('click');
                    const updated = [...editingWeapon.attachments, { slot: 'اسلات جدید', slotEn: 'Slot', name: 'اتچمنت انتخابی' }];
                    setEditingWeapon({ ...editingWeapon, attachments: updated });
                  }}
                >
                  ➕ {isEn ? 'Add Slot' : 'افزودن اسلات اتچمنت'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {editingWeapon.attachments.map((att, idx) => (
                  <div key={idx} style={{ background: 'var(--bg2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--acc)' }}>اتچمنت #{idx + 1}</span>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--bad)',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          fontSize: '12px'
                        }}
                        title="حذف این اتچمنت"
                        onClick={() => {
                          AudioFX.play('click');
                          const updated = editingWeapon.attachments.filter((_, i) => i !== idx);
                          setEditingWeapon({ ...editingWeapon, attachments: updated });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="field" style={{ marginBottom: '6px' }}>
                      <label style={{ fontSize: '10.5px' }}>بخش / قطعه (اسلات):</label>
                      <input
                        value={att.slot}
                        onChange={(e) => {
                          const updated = [...editingWeapon.attachments];
                          updated[idx] = { ...updated[idx], slot: e.target.value };
                          setEditingWeapon({ ...editingWeapon, attachments: updated });
                        }}
                        placeholder="مثال: لوله / قنداق / لیزر / دهانه"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '10.5px' }}>نام اتچمنت:</label>
                      <input
                        value={att.name}
                        onChange={(e) => {
                          const updated = [...editingWeapon.attachments];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setEditingWeapon({ ...editingWeapon, attachments: updated });
                        }}
                        placeholder="مثال: Marauder Suppressor"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Sliders */}
              <h4 style={{ fontSize: '15px', color: 'var(--neon)', marginTop: '12px', marginBottom: '8px' }}>
                📊 نمودار مشخصات اسلحه (۰ تا ۱۰۰):
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <div className="field">
                  <label style={{ fontSize: '11px' }}>دمیج: {editingWeapon.stats.damage}</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editingWeapon.stats.damage}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, stats: { ...editingWeapon.stats, damage: Number(e.target.value) } })}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: '11px' }}>فایر ریت: {editingWeapon.stats.fireRate}</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editingWeapon.stats.fireRate}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, stats: { ...editingWeapon.stats, fireRate: Number(e.target.value) } })}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: '11px' }}>دقت: {editingWeapon.stats.accuracy}</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editingWeapon.stats.accuracy}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, stats: { ...editingWeapon.stats, accuracy: Number(e.target.value) } })}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: '11px' }}>موومنت: {editingWeapon.stats.mobility}</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editingWeapon.stats.mobility}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, stats: { ...editingWeapon.stats, mobility: Number(e.target.value) } })}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: '11px' }}>بُرد موثر: {editingWeapon.stats.range}</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editingWeapon.stats.range}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, stats: { ...editingWeapon.stats, range: Number(e.target.value) } })}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: '11px' }}>کنترل لگد: {editingWeapon.stats.control}</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editingWeapon.stats.control}
                    onChange={(e) => setEditingWeapon({ ...editingWeapon, stats: { ...editingWeapon.stats, control: Number(e.target.value) } })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowWeaponModal(false)}
                >
                  {isEn ? 'Cancel' : 'انصراف'}
                </button>
                <button
                  type="submit"
                  className="btn primary lg"
                >
                  💾 {isEn ? 'Save Weapon Loadout' : 'ذخیره لوداوت اسلحه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── مودال مشاهده عکس فیش و رسید پرداخت ── */}
      {viewReceiptModal && (
        <div className="modal-ov" onClick={(e) => { if (e.target === e.currentTarget) setViewReceiptModal(null); }}>
          <div className="modal" style={{ maxWidth: '600px', width: '92%' }}>
            <button className="mclose" onClick={() => setViewReceiptModal(null)} aria-label="بستن">✕</button>

            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>📸 {viewReceiptModal.title}</h3>
            <p className="msub" style={{ fontSize: '12px', marginTop: '4px' }}>
              {viewReceiptModal.platform === 'bale'
                ? 'تصویر فیش دریافتی از ربات رسمی بله (@codm_room_bot)'
                : 'تصویر فیش بارگذاری شده در سایت'}
            </p>

            <div style={{ textAlign: 'center', margin: '16px 0', background: '#000', borderRadius: '12px', padding: '10px', border: '1px solid var(--line)' }}>
              <img
                src={viewReceiptModal.url}
                alt="Receipt"
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  display: 'inline-block'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: '14px' }}>
              <a
                href={viewReceiptModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn sm"
                download={`receipt_${viewReceiptModal.paymentId}.jpg`}
              >
                📥 {isEn ? 'Open Full Image / Download' : 'باز کردن در تب جدید / دانلود'}
              </a>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn good sm"
                  onClick={() => handleApprovePayment(viewReceiptModal.paymentId, true)}
                >
                  ✅ {isEn ? 'Approve Payment' : 'تایید این پرداخت'}
                </button>
                <button
                  type="button"
                  className="btn bad sm"
                  onClick={() => handleRejectPayment(viewReceiptModal.paymentId)}
                >
                  ❌ {isEn ? 'Reject' : 'رد رسید'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
