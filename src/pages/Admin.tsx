import React, { useEffect, useState } from 'react';
import { User, Room, Payment, Prize, AdminStats } from '../types';
import { MODES, money, fa } from '../i18n/translations';
import { ApiService } from '../services/api';
import { AudioFX } from '../services/audio';

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
  const [subTab, setSubTab] = useState<'stats' | 'rooms' | 'pays' | 'przs' | 'users' | 'settings' | 'broadcast'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
  }, []);

  const handleApprovePayment = async (payId: number) => {
    try {
      await ApiService.approvePayment(payId);
      AudioFX.play('lock');
      onToast(isEn ? 'Payment approved and user notified via bot!' : 'پرداخت تایید شد و پیام تاییدیه خودکار به کاربر در ربات ارسال گردید! ✅', 'ok');
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
      loadPayments();
      loadStats();
    } catch (err: any) {
      onToast(err.message || 'خطا در رد پرداخت', 'err');
    }
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
                      <div>💵 مبلغ: <b style={{ color: 'var(--acc2)' }}>{money(p.amount)} تومان</b> | روش: <b>{p.method}</b></div>
                      {p.ref_code && (
                        <div>🧾 کد پیگیری: <code style={{ color: 'var(--good)', fontWeight: 800 }}>{p.ref_code}</code></div>
                      )}
                      {p.proof_file_id && (
                        <div>📸 عکس فیش: <b>ارسال شده در ربات {p.proof_platform === 'tg' ? 'تلگرام' : 'بله'}</b></div>
                      )}
                    </div>
                  </div>

                  {p.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn good sm"
                        onClick={() => handleApprovePayment(p.id)}
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
        </div>
      )}
    </div>
  );
};
