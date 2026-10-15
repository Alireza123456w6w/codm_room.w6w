import React, { useEffect, useState } from 'react';
import { Room } from '../types';
import { I18N, MODES, money, fa } from '../i18n/translations';
import { ApiService } from '../services/api';
import { AudioFX } from '../services/audio';

interface RoomsProps {
  onSelectRoom: (roomId: number) => void;
  lang: 'fa' | 'en';
}

export const Rooms: React.FC<RoomsProps> = ({ onSelectRoom, lang }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const t = I18N[lang];
  const isEn = lang === 'en';

  const loadRooms = () => {
    setLoading(true);
    ApiService.getRooms(selectedStatus, selectedMode)
      .then((data) => {
        setRooms(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRooms();
  }, [selectedStatus, selectedMode]);

  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      (r.map_name && r.map_name.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: Room['status']) => {
    switch (status) {
      case 'open':
        return <span className="rbadge open">{isEn ? '🟢 OPEN' : '🟢 باز'}</span>;
      case 'full':
        return <span className="rbadge full">{isEn ? '🟡 FULL' : '🟡 تکمیل'}</span>;
      case 'running':
        return <span className="rbadge running">{isEn ? '🔴 LIVE' : '🔴 در جریان'}</span>;
      case 'finished':
        return <span className="rbadge finished">{isEn ? '⚫️ ENDED' : '⚫️ پایان'}</span>;
      case 'cancelled':
        return <span className="rbadge cancelled">{isEn ? '❌ CANCELLED' : '❌ لغو'}</span>;
      default:
        return <span className="rbadge">{status}</span>;
    }
  };

  return (
    <div className="sec">
      <div className="sec-head">
        <h2>
          <span>{t.roomsTitle}</span>
        </h2>
        <p>{t.roomsSub}</p>
      </div>

      {/* ── فیلترها و جستجو ── */}
      <div className="filters">
        <button
          className={`chip ${selectedStatus === 'all' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSelectedStatus('all'); }}
        >
          {t.statusAll}
        </button>
        <button
          className={`chip ${selectedStatus === 'open' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSelectedStatus('open'); }}
        >
          {t.statusOpen}
        </button>
        <button
          className={`chip ${selectedStatus === 'full' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSelectedStatus('full'); }}
        >
          {t.statusFull}
        </button>
        <button
          className={`chip ${selectedStatus === 'running' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSelectedStatus('running'); }}
        >
          {t.statusRunning}
        </button>
        <button
          className={`chip ${selectedStatus === 'finished' ? 'on' : ''}`}
          onClick={() => { AudioFX.play('click'); setSelectedStatus('finished'); }}
        >
          {t.statusFinished}
        </button>

        <select
          className="chip"
          value={selectedMode}
          onChange={(e) => {
            AudioFX.play('click');
            setSelectedMode(e.target.value);
          }}
          aria-label="حالت بازی"
        >
          <option value="all">{t.allModes}</option>
          {Object.entries(MODES).map(([key, m]) => (
            <option key={key} value={key}>
              {m.emoji} {isEn ? m.en : m.fa}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="chip"
          style={{ width: '190px', cursor: 'text' }}
          placeholder={isEn ? '🔍 Search room or map...' : '🔍 جستجوی روم یا نقشه...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── لیست روم‌ها ── */}
      {loading ? (
        <div className="empty">
          <div className="big">⏳</div>
          <h3>{isEn ? 'Scouting active battlefield rooms...' : 'در حال دریافت اطلاعات روم‌ها از سرور...'}</h3>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="empty">
          <div className="big">🎯</div>
          <h3>{isEn ? 'No rooms match your tactical filters' : 'رومی با این فیلترها پیدا نشد'}</h3>
          <p className="mut" style={{ marginTop: '8px' }}>
            {isEn ? 'Try changing your game mode or status selection.' : 'می‌توانی فیلترها را ریست کنی یا روم دیگری را بررسی کنی.'}
          </p>
          <button
            className="btn ghost sm"
            style={{ marginTop: '16px' }}
            onClick={() => {
              setSelectedStatus('all');
              setSelectedMode('all');
              setSearchQuery('');
            }}
          >
            {isEn ? 'Reset All Filters' : 'نمایش همه روم‌ها'}
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {filteredRooms.map((room) => {
            const modeInfo = MODES[room.mode] || MODES.custom;
            const totalSlots = room.total || room.max_players || 8;
            const paidSlots = room.paid || 0;
            const pct = Math.min(100, Math.round((paidSlots / totalSlots) * 100));

            return (
              <div key={room.id} className="room-card">
                <div className="room-top">
                  <div className="room-mode">
                    {modeInfo.emoji}
                  </div>
                  <div className="room-tt">
                    <h3 title={room.title}>{room.title}</h3>
                    <div className="mm">
                      <span>{isEn ? modeInfo.en : modeInfo.fa}</span>
                      {room.map_name && <span> • 🗺️ {room.map_name}</span>}
                    </div>
                  </div>
                  {getStatusBadge(room.status)}
                </div>

                <div className="room-mid">
                  <div>
                    <div className="k">{t.entryFee}</div>
                    <div className="v fee">
                      {room.entry_fee > 0
                        ? (isEn ? `${money(room.entry_fee)} Toman` : `${fa(money(room.entry_fee))} تومان`)
                        : t.free}
                    </div>
                  </div>

                  <div>
                    <div className="k">{t.prizePool}</div>
                    <div className="v prize">
                      {room.prize_pool > 0
                        ? (isEn ? `${money(room.prize_pool)} Toman` : `${fa(money(room.prize_pool))} تومان`)
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div className="k">{t.layout}</div>
                    <div className="v">
                      {isEn
                        ? `${room.teams} Teams × ${room.team_size}`
                        : `${fa(room.teams)} تیم × ${fa(room.team_size)} نفر`}
                    </div>
                  </div>

                  <div>
                    <div className="k">{t.start}</div>
                    <div className="v" style={{ fontSize: '11.5px', color: '#c3ccd9' }}>
                      {room.start_time || (isEn ? 'To be announced' : 'به زودی')}
                    </div>
                  </div>
                </div>

                <div className="slotbar">
                  <div className="bar">
                    <div className="fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="lbl">
                    <span>
                      {isEn
                        ? `${paidSlots} of ${totalSlots} ${t.players}`
                        : `${fa(paidSlots)} از ${fa(totalSlots)} ${t.players}`}
                    </span>
                    <span>
                      {isEn ? `${pct}% ${t.filled}` : `${fa(pct)}٪ ${t.filled}`}
                    </span>
                  </div>
                </div>

                <div className="room-bot">
                  <button
                    className="btn blk"
                    onClick={() => {
                      AudioFX.play('lock');
                      onSelectRoom(room.id);
                    }}
                  >
                    {t.viewAndReserve}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
