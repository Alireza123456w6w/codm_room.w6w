import React, { useEffect, useState } from 'react';
import { Room, Slot, User } from '../types';
import { I18N, MODES, money, fa } from '../i18n/translations';
import { ApiService } from '../services/api';
import { AudioFX } from '../services/audio';

interface RoomDetailProps {
  roomId: number;
  user: User | null;
  onOpenAuth: () => void;
  onBack: () => void;
  lang: 'fa' | 'en';
  onToast: (msg: string, type?: 'info' | 'ok' | 'err' | 'warn') => void;
  onUserUpdate: (u: User) => void;
}

export const RoomDetail: React.FC<RoomDetailProps> = ({
  roomId,
  user,
  onOpenAuth,
  onBack,
  lang,
  onToast,
  onUserUpdate
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [counts, setCounts] = useState({ total: 0, paid: 0, free: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'wallet' | 'card' | 'online' | 'free'>('wallet');
  const [referralCode, setReferralCode] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cardInfo, setCardInfo] = useState<{ number?: string; name?: string; bank?: string } | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<number | null>(null);
  const [botLink, setBotLink] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [receiptUploading, setReceiptUploading] = useState(false);

  const t = I18N[lang];
  const isEn = lang === 'en';

  const loadRoom = () => {
    setLoading(true);
    ApiService.getRoom(roomId)
      .then((data) => {
        setRoom(data.room);
        setSlots(data.slots || []);
        if (data.counts) setCounts(data.counts);
      })
      .catch((err) => {
        onToast(err.message || 'خطا در بارگذاری روم', 'err');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const handleSlotClick = (slot: Slot) => {
    if (!user) {
      AudioFX.play('click');
      onToast(isEn ? 'Please sign in to lock your tactical squad slot' : 'برای رزرو موقعیت، ابتدا وارد حساب خود شوید', 'info');
      onOpenAuth();
      return;
    }

    if (slot.status === 'paid') {
      AudioFX.play('click');
      onToast(isEn ? `Slot #${slot.slot_no} is already locked by ${slot.display_name || slot.username}` : `این موقعیت توسط ${slot.display_name || slot.username || 'بازیکن دیگر'} رزرو شده است`, 'warn');
      return;
    }

    if (room?.status !== 'open') {
      AudioFX.play('click');
      onToast(isEn ? 'This room is no longer open for new enlistments' : 'ثبت‌نام این روم در حال حاضر باز نیست', 'warn');
      return;
    }

    AudioFX.play('lock');
    setSelectedSlot(slot);
    setPayMethod(room?.entry_fee === 0 ? 'free' : (user.wallet >= (room?.entry_fee || 0) ? 'wallet' : 'card'));
    setBookingModal(true);
  };

  const handleConfirmJoin = async () => {
    if (!selectedSlot || !room) return;
    setSubmitting(true);

    try {
      const res = await ApiService.joinRoom(room.id, selectedSlot.slot_no, payMethod, referralCode.trim());
      AudioFX.play('lock');

      if (res.need === 'topup') {
        onToast(isEn ? 'Insufficient wallet balance. Please top up or pay via card/bot' : 'موجودی کیف پول کافی نیست. لطفاً کیف پول را شارژ کنید یا روش کارت به کارت را انتخاب کنید', 'warn');
        setPayMethod('card');
        setSubmitting(false);
        return;
      }

      if (res.card) {
        setCardInfo(res.card);
      }
      if (res.payment_id) {
        setPendingPaymentId(res.payment_id);
      }
      if (res.bot_link) {
        setBotLink(res.bot_link);
      }

      if (payMethod === 'wallet' || payMethod === 'free') {
        onToast(isEn ? '🎉 Squad slot successfully secured!' : '🎉 موقعیت شما با موفقیت قطعی شد!', 'ok');
        setBookingModal(false);
        if (user && payMethod === 'wallet') {
          onUserUpdate({ ...user, wallet: Math.max(0, user.wallet - room.entry_fee) });
        }
        loadRoom();
      } else {
        onToast(isEn ? 'Payment initiated. Submit tracking code or receipt via Bale bot.' : 'درخواست پرداخت ثبت شد. لطفاً فیش یا کد پیگیری را ثبت کنید.', 'info');
      }
    } catch (err: any) {
      AudioFX.play('reload');
      onToast(err.message || (isEn ? 'Failed to secure slot' : 'خطا در رزرو موقعیت'), 'err');
    } finally {
      setSubmitting(false);
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
      setReceiptImage(reader.result as string);
      onToast(isEn ? 'Receipt photo selected! Click submit to register.' : 'عکس فیش انتخاب شد! دکمه ارسال عکس رسید را بزنید.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReceiptProof = async () => {
    if (!pendingPaymentId) return;
    if (!receiptImage) {
      onToast(isEn ? 'Receipt photo is required! Please attach image or send via Bale bot.' : 'ارسال تصویر یا عکس فیش رسید الزامی است! با کد پیگیری به تنهایی امکان تایید وجود ندارد.', 'warn');
      return;
    }
    setReceiptUploading(true);
    try {
      await ApiService.submitPaymentRef(pendingPaymentId, trackingCode.trim(), receiptImage);
      AudioFX.play('lock');
      onToast(isEn ? 'Receipt photo registered! Awaiting admin verification.' : 'عکس فیش با موفقیت ثبت شد و پس از بررسی ادمین، جایگاه شما قطعی می‌شود! 📸', 'ok');
      setBookingModal(false);
      setCardInfo(null);
      setPendingPaymentId(null);
      setReceiptImage('');
      setTrackingCode('');
      loadRoom();
    } catch (err: any) {
      onToast(err.message || 'خطا در ثبت عکس رسید', 'err');
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleCancelEnlistment = async () => {
    if (!room) return;
    if (!confirm(isEn ? 'Are you sure you want to cancel your slot enlistment? Entry fee will be refunded to your wallet.' : 'آیا مطمئنید که می‌خواهید ثبت‌نام خود را لغو کنید؟ مبلغ ورودی به کیف پول شما بازخواهد گشت.')) {
      return;
    }
    try {
      await ApiService.leaveRoom(room.id);
      AudioFX.play('reload');
      onToast(isEn ? 'Enlistment cancelled successfully' : 'ثبت‌نام شما با موفقیت لغو شد', 'ok');
      loadRoom();
      ApiService.getMe().then((res) => onUserUpdate(res.user)).catch(() => {});
    } catch (err: any) {
      onToast(err.message || 'خطا در لغو ثبت‌نام', 'err');
    }
  };

  if (loading || !room) {
    return (
      <div className="roomwrap empty">
        <div className="big">⏳</div>
        <h3>{isEn ? 'Loading tactical squad roster...' : 'در حال بارگذاری اسلات‌مپ و اطلاعات روم...'}</h3>
      </div>
    );
  }

  const modeInfo = MODES[room.mode] || MODES.custom;
  const isUserJoined = user && slots.some((s) => s.user_id === user.id && (s.status === 'paid' || s.status === 'pending'));

  const teamGroups: Record<string, Slot[]> = {};
  slots.forEach((s) => {
    const tLabel = s.team_label || (isEn ? `Team ${Math.ceil(s.slot_no / room.team_size)}` : `تیم ${Math.ceil(s.slot_no / room.team_size)}`);
    if (!teamGroups[tLabel]) teamGroups[tLabel] = [];
    teamGroups[tLabel].push(s);
  });

  return (
    <div className="roomwrap">
      <div className="crumb" onClick={onBack}>
        {t.backToRooms}
      </div>

      <div className="room-hero">
        <div className="room-mode" style={{ width: '56px', height: '56px', fontSize: '28px' }}>
          {modeInfo.emoji}
        </div>

        <div className="info">
          <h1>{room.title}</h1>
          <div className="meta">
            <span>🎮 <b>{isEn ? modeInfo.en : modeInfo.fa}</b></span>
            {room.map_name && <span>🗺️ <b>{room.map_name}</b></span>}
            <span>👥 <b>{counts.paid}/{counts.total} {t.players}</b></span>
            {room.start_time && <span>🕒 <b>{room.start_time}</b></span>}
          </div>
        </div>

        <div className="pricebox">
          <div className="pp">
            {room.entry_fee > 0
              ? (isEn ? `${money(room.entry_fee)} T` : `${fa(money(room.entry_fee))} تومان`)
              : t.free}
          </div>
          <div className="pl">{t.entryFee}</div>

          {room.prize_pool > 0 && (
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,159,26,0.2)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--good)', fontWeight: 800, fontSize: '15px' }}>
                {isEn ? `${money(room.prize_pool)} T` : `${fa(money(room.prize_pool))} تومان`}
              </span>
              <div style={{ fontSize: '11px', color: 'var(--mut)' }}>{t.prizePool}</div>
            </div>
          )}
        </div>
      </div>

      {room.description && (
        <div className="roomdesc">
          <b>{isEn ? 'Tactical Briefing:' : 'توضیحات روم:'}</b> {room.description}
          {room.rules && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
              <b>{isEn ? 'Tournament Rules:' : 'قوانین:'}</b> {room.rules}
            </div>
          )}
        </div>
      )}

      {(room.room_id || room.room_pass) && (
        <div
          style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, rgba(46,204,113,0.15), rgba(46,204,113,0.05))',
            border: '1px solid rgba(46,204,113,0.4)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ color: 'var(--good)', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔓</span>
              <span>{isEn ? 'COMBAT ROOM CREDENTIALS UNLOCKED' : 'اطلاعات ورود به روم بازی'}</span>
            </div>
            <div style={{ marginTop: '6px', fontSize: '14px', color: '#fff', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span>Room ID: <code style={{ color: '#7dd87d', fontSize: '15px', fontWeight: 800 }}>{room.room_id}</code></span>
              {room.room_pass && (
                <span>Password: <code style={{ color: '#7dd87d', fontSize: '15px', fontWeight: 800 }}>{room.room_pass}</code></span>
              )}
            </div>
          </div>
          <button
            className="btn good sm"
            onClick={() => {
              AudioFX.play('click');
              navigator.clipboard.writeText(`${room.room_id} ${room.room_pass || ''}`);
              onToast(isEn ? 'Credentials copied to clipboard!' : 'اطلاعات روم کپی شد!', 'ok');
            }}
          >
            📋 {isEn ? 'Copy Credentials' : 'کپی آیدی و پسورد'}
          </button>
        </div>
      )}

      {isUserJoined && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel)', padding: '14px 20px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          <span style={{ color: 'var(--acc2)', fontWeight: 700 }}>
            🎖️ {isEn ? 'You have a secured slot in this room.' : 'شما در این روم دارای جایگاه ثبت‌شده هستید.'}
          </span>
          <button
            className="btn bad sm"
            onClick={handleCancelEnlistment}
          >
            ❌ {isEn ? 'Cancel Enlistment & Refund' : 'لغو جایگاه و استرداد وجه'}
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900 }}>
              🗺️ <span>{isEn ? 'Tactical Squad Board & Slot Map' : 'اسلات‌مپ تاکتیکال و چیدمان تیم‌ها'}</span>
            </h2>
            <p className="mut" style={{ fontSize: '13px', marginTop: '4px' }}>
              {isEn ? 'Click on any available green seat to lock your position' : 'روی موقعیت‌های سبز کلیک کن تا جایگاه اسکواد خودت را رزرو کنی'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 700 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i style={{ width: '10px', height: '10px', background: 'var(--good)', borderRadius: '50%', display: 'inline-block' }} />
              {isEn ? 'Free' : 'آزاد'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i style={{ width: '10px', height: '10px', background: 'var(--warn)', borderRadius: '50%', display: 'inline-block' }} />
              {isEn ? 'Pending' : 'در انتظار'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i style={{ width: '10px', height: '10px', background: 'var(--bad)', borderRadius: '50%', display: 'inline-block' }} />
              {isEn ? 'Reserved' : 'رزرو شده'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {Object.entries(teamGroups).map(([teamName, teamSlots]) => (
            <div
              key={teamName}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '18px',
                clipPath: 'var(--clip-sm)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--line2)'
                }}
              >
                <b style={{ color: 'var(--acc)', fontFamily: 'Russo One', fontSize: '15px' }}>
                  🛡️ {teamName}
                </b>
                <span className="mut" style={{ fontSize: '12px' }}>
                  {teamSlots.filter((s) => s.status === 'paid').length}/{teamSlots.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {teamSlots.map((slot) => {
                  const isMine = user && slot.user_id === user.id;
                  const isPaid = slot.status === 'paid';
                  const isPending = slot.status === 'pending';
                  const isFree = slot.status === 'free';

                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        cursor: isFree ? 'pointer' : 'default',
                        transition: 'all .2s',
                        border: isMine
                          ? '1px solid var(--good)'
                          : isPaid
                          ? '1px solid rgba(255,71,87,0.3)'
                          : isPending
                          ? '1px solid rgba(255,192,72,0.3)'
                          : '1px solid rgba(46,204,113,0.35)',
                        background: isMine
                          ? 'rgba(46,204,113,0.15)'
                          : isPaid
                          ? 'rgba(255,71,87,0.08)'
                          : isPending
                          ? 'rgba(255,192,72,0.08)'
                          : 'rgba(46,204,113,0.06)'
                      }}
                      onMouseEnter={(e) => {
                        if (isFree) e.currentTarget.style.borderColor = 'var(--acc)';
                      }}
                      onMouseLeave={(e) => {
                        if (isFree) e.currentTarget.style.borderColor = 'rgba(46,204,113,0.35)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: '6px',
                            background: isPaid ? 'rgba(255,71,87,0.2)' : isPending ? 'rgba(255,192,72,0.2)' : 'rgba(46,204,113,0.2)',
                            color: isPaid ? 'var(--bad)' : isPending ? 'var(--warn)' : 'var(--good)',
                            fontWeight: 900,
                            fontSize: '12px',
                            fontFamily: 'Russo One'
                          }}
                        >
                          #{slot.slot_no}
                        </span>

                        <span style={{ fontWeight: 700, fontSize: '13px' }}>
                          {isPaid
                            ? (isMine ? (isEn ? '🎖️ YOU' : '🎖️ جایگاه شما') : (slot.display_name || slot.username || (isEn ? 'Locked Player' : 'رزرو شده')))
                            : isPending
                            ? (isEn ? '⏳ Under Review' : '⏳ در حال تایید')
                            : (isEn ? '🟢 Click to Lock' : '🟢 آزاد — رزرو')}
                        </span>
                      </div>

                      {isFree && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--acc2)',
                            fontWeight: 700,
                            background: 'rgba(255,159,26,0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {isEn ? 'LOCK' : 'رزرو'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {bookingModal && selectedSlot && (
        <div className="modal-ov" onClick={(e) => { if (e.target === e.currentTarget) setBookingModal(false); }}>
          <div className="modal">
            <button className="mclose" onClick={() => setBookingModal(false)} aria-label="بستن">✕</button>

            <h3>{isEn ? `Lock Squad Slot #${selectedSlot.slot_no}` : `رزرو موقعیت #${fa(selectedSlot.slot_no)}`}</h3>
            <p className="msub">
              {isEn
                ? `Confirm your registration for room "${room.title}".`
                : `تایید ثبت‌نام در روم «${room.title}».`}
            </p>

            <div style={{ background: 'var(--panel2)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px' }}>
                <span className="mut">{t.entryFee}:</span>
                <b style={{ color: 'var(--acc2)' }}>
                  {room.entry_fee > 0
                    ? (isEn ? `${money(room.entry_fee)} Toman` : `${fa(money(room.entry_fee))} تومان`)
                    : t.free}
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span className="mut">{isEn ? 'Your Wallet Balance:' : 'موجودی کیف پول شما:'}</span>
                <b>{isEn ? `${money(user?.wallet)} Toman` : `${fa(money(user?.wallet))} تومان`}</b>
              </div>
            </div>

            {room.entry_fee > 0 && !pendingPaymentId && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  {isEn ? 'Select Payment Method:' : 'روش پرداخت:'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: 'var(--panel)',
                      borderRadius: '8px',
                      border: payMethod === 'wallet' ? '1px solid var(--acc)' : '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="method"
                      checked={payMethod === 'wallet'}
                      onChange={() => setPayMethod('wallet')}
                    />
                    <span>
                      💼 {isEn ? 'Wallet Balance' : 'کیف پول درون‌برنامه'}
                      {(user?.wallet || 0) < room.entry_fee && (
                        <small style={{ color: 'var(--bad)', display: 'block', fontSize: '11px' }}>
                          {isEn ? '(Insufficient balance)' : '(موجودی ناکافی)'}
                        </small>
                      )}
                    </span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: 'var(--panel)',
                      borderRadius: '8px',
                      border: payMethod === 'card' ? '1px solid var(--acc)' : '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="method"
                      checked={payMethod === 'card'}
                      onChange={() => setPayMethod('card')}
                    />
                    <span>💳 {isEn ? 'Card to Card & Bale Bot' : 'کارت به کارت و تایید از ربات بله'}</span>
                  </label>
                </div>
              </div>
            )}

            {!pendingPaymentId && (
              <div className="field" style={{ marginBottom: '16px' }}>
                <label>{isEn ? 'Referral Invite Code (Optional):' : 'کد معرف دوستان (اختیاری):'}</label>
                <input
                  className="ltr"
                  placeholder="e.g. 7X9K2B"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                />
                <small className="mut" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  {isEn
                    ? 'Entering a friend\'s referral code awards them 10,000 Toman upon payment verification!'
                    : 'با وارد کردن کد معرف دوستت، پس از تایید ثبت‌نام ۱۰,۰۰۰ تومان پاداش به کیف پول او اضافه می‌شود!'}
                </small>
              </div>
            )}

            {cardInfo && (
              <div style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,159,26,0.4)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <b style={{ color: 'var(--acc2)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  💳 {isEn ? 'Card Payment Details' : 'اطلاعات شماره کارت جهت واریز'}
                </b>
                <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
                  <div>🏦 {isEn ? 'Bank:' : 'بانک:'} <b>{cardInfo.bank || '—'}</b></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span>🔢 {isEn ? 'Card:' : 'شماره کارت:'}</span>
                    <code style={{ fontSize: '14px', fontWeight: 800, color: 'var(--good)' }}>{cardInfo.number}</code>
                    <button
                      className="btn ghost sm"
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => {
                        if (cardInfo.number) navigator.clipboard.writeText(cardInfo.number);
                        onToast(isEn ? 'Card number copied' : 'شماره کارت کپی شد', 'ok');
                      }}
                    >
                      📋
                    </button>
                  </div>
                  <div>👤 {isEn ? 'Holder:' : 'به نام:'} <b>{cardInfo.name || '—'}</b></div>
                  <div>💰 {isEn ? 'Exact Amount:' : 'مبلغ دقیق:'} <b>{isEn ? `${money(room.entry_fee)} Toman` : `${fa(money(room.entry_fee))} تومان`}</b></div>
                </div>

                {/* ── دکمه اصلی و رسمی: ارسال عکس رسید در ربات بله ── */}
                <div style={{ marginTop: '16px', background: 'rgba(46, 204, 113, 0.12)', border: '2px solid var(--good)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--good)', marginBottom: '6px' }}>
                    📸 {isEn ? 'Official Method: Submit Receipt Photo via Bale Bot' : 'روش اصلی و رسمی: ارسال عکس فیش در ربات بله (الزامی)'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--txt)', margin: '0 0 12px', lineHeight: 1.6 }}>
                    {isEn
                      ? '⚠️ Transactions are strictly tracked via receipt photos. Text-only tracking codes cannot be verified. Click below to send the receipt photo directly in Bale Bot for rapid approval.'
                      : '⚠️ توجه مهم: به دلیل غیرقابل پیگیری بودن کدهای پیگیری متنی، تایید پرداخت‌ها منحصراً با ارسال تصویر فیش واریز در ربات بله انجام می‌شود. روی دکمه زیر بزنید و عکس رسید را بفرستید تا موقعیت شما فوراً قطعی شود.'}
                  </p>

                  <a
                    href={botLink || `https://ble.ir/codm_room_bot?start=pay_${pendingPaymentId}`}
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
                <div style={{ marginTop: '14px', background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--txt)', marginBottom: '6px' }}>
                    📎 {isEn ? 'Or attach receipt image directly on website (Image Required):' : '📎 یا عکس فیش را همین‌جا بارگذاری کنید (عکس رسید الزامی است):'}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptFileChange}
                    style={{ fontSize: '12px', marginTop: '2px', width: '100%' }}
                  />

                  {receiptImage ? (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <img
                        src={receiptImage}
                        alt="Preview"
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
                    <label style={{ fontSize: '11px' }}>{isEn ? 'Tracking number on receipt (Optional):' : 'کد پیگیری مندرج در فیش (اختیاری):'}</label>
                    <input
                      className="ltr"
                      placeholder="e.g. 123456789"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn sm"
                    style={{
                      width: '100%',
                      background: receiptImage ? 'var(--good)' : 'rgba(255,255,255,0.1)',
                      color: receiptImage ? '#000' : 'var(--mut)',
                      fontWeight: 800,
                      cursor: receiptImage ? 'pointer' : 'not-allowed'
                    }}
                    disabled={receiptUploading || !receiptImage}
                    onClick={handleSubmitReceiptProof}
                  >
                    {receiptUploading ? 'در حال ارسال...' : (isEn ? '📤 Submit Receipt Photo on Website' : '📤 ثبت عکس رسید در سایت')}
                  </button>
                </div>
              </div>
            )}

            {!cardInfo && (
              <button
                className="btn blk lg"
                disabled={submitting}
                onClick={handleConfirmJoin}
              >
                {submitting
                  ? (isEn ? 'Processing...' : 'در حال پردازش...')
                  : (isEn ? 'Confirm & Lock Slot' : 'تایید و رزرو قطعی جایگاه')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
