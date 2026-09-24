/* ══════════════════════════════════════════════════════════════
   CODM ROOMS PLATFORM — Cloudflare Worker v1.0
   سایت + ربات تلگرام + ربات بله — دیتابیس مشترک D1
   ──────────────────────────────────────────────────────────────
   Bindings:
     D1 → هر نامی که باشد خودکار شناسایی می‌شود (DB یا هر نام دیگر)
     جداول و تنظیمات پیش‌فرض در اولین درخواست خودکار ساخته می‌شوند
     (نیازی به اجرای دستی schema.sql نیست)
   Environment Variables (اختیاری):
     TELEGRAM_TOKEN, BALE_TOKEN, ADMIN_SECRET, ADMIN_IDS
   روت‌ها:
     /api/*              →  REST API سایت
     /tg/<secret>        →  Webhook ربات تلگرام (با کلید امنیتی خودکار)
     /bale/<secret>      →  Webhook ربات بله (با کلید امنیتی خودکار)
     /setup              →  صفحه اتصال سریع وب‌هوک‌ها
   ══════════════════════════════════════════════════════════════ */

const V = '1.3.0';
const TG_BASE = 'https://api.telegram.org';
const BL_BASE = 'https://tapi.bale.ai';
const FA_D = '۰۱۲۳۴۵۶۷۸۹';

const H = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store'
};

const MODES = {
  tdm:    { fa: 'نبرد تیمی TDM',        def_teams: 2, def_size: 5, emoji: '🔫' },
  snd:    { fa: 'جستجو و نابودی S&D',   def_teams: 2, def_size: 4, emoji: '💣' },
  snd6:   { fa: 'جستجو و نابودی ۶v۶',   def_teams: 2, def_size: 6, emoji: '💣' },
  dom:    { fa: 'سلطه DOM',             def_teams: 2, def_size: 5, emoji: '🚩' },
  gun:    { fa: 'گانفایت ۲v۲',          def_teams: 2, def_size: 2, emoji: '🤝' },
  one:    { fa: 'تک‌به‌تک 1v1',          def_teams: 2, def_size: 1, emoji: '⚔️' },
  sniper: { fa: 'اسنایپر 1v1',          def_teams: 2, def_size: 1, emoji: '🎯' },
  knife:  { fa: 'چاقو فقط 1v1',         def_teams: 2, def_size: 1, emoji: '🔪' },
  br:     { fa: 'بتل رویال BR',         def_teams: 4, def_size: 4, emoji: '🪂' },
  custom: { fa: 'سفارشی',               def_teams: 2, def_size: 4, emoji: '🎮' }
};
const TEAM_NAMES = ['تیم آ', 'تیم ب', 'تیم ج', 'تیم د', 'تیم هـ', 'تیم و'];
const ROOM_STATUS = { open: '🟢 باز', full: '🟡 تکمیل ظرفیت', running: '🔴 در حال اجرا', finished: '⚫️ پایان یافت', cancelled: '❌ لغو شد' };
const SET_KEYS = ['tg_token','bale_token','admin_secret','card_number','card_name','bank_name','gateway_url','channel_link','support_bot','website_url','offers_site','offers_page','shop_bot','min_topup','welcome','announce_channel'];
const BC_BATCH = 20;

/* ─────────────── execution context (waitUntil) ─────────────── */
let CTX = null;
function keep(p) {
  if (CTX && p && typeof p.then === 'function') { try { CTX.waitUntil(Promise.resolve(p).catch(() => {})); } catch (e) {} }
  return p;
}

/* ─────────────── دیتابیس: شناسایی خودکار + ساخت خودکار جداول ─────────────── */
function pickDB(env) {
  if (!env) return null;
  try {
    if (env.DB && typeof env.DB.prepare === 'function') return env.DB;
    for (const k of Object.keys(env)) {
      const v = env[k];
      if (v && typeof v === 'object' && typeof v.prepare === 'function' && typeof v.batch === 'function') return v;
    }
  } catch (e) {}
  return null;
}
const SCHEMA_SQL = [
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password_hash TEXT, display_name TEXT, telegram_id TEXT UNIQUE, bale_id TEXT UNIQUE, role TEXT DEFAULT 'user', wallet REAL DEFAULT 0, codm_id TEXT, banned INTEGER DEFAULT 0, lang TEXT DEFAULT 'fa', created_at TEXT DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, mode TEXT DEFAULT 'tdm', map_name TEXT, teams INTEGER DEFAULT 2, team_size INTEGER DEFAULT 4, max_players INTEGER DEFAULT 8, entry_fee REAL DEFAULT 0, prize_pool REAL DEFAULT 0, start_time TEXT, status TEXT DEFAULT 'open', room_id TEXT, room_pass TEXT, description TEXT, rules TEXT, created_by INTEGER, created_at TEXT DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS slots (id INTEGER PRIMARY KEY AUTOINCREMENT, room_id INTEGER NOT NULL, slot_no INTEGER NOT NULL, team_label TEXT, user_id INTEGER, status TEXT DEFAULT 'free', payment_id INTEGER, UNIQUE(room_id, slot_no))",
  "CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, room_id INTEGER, slot_id INTEGER, amount REAL NOT NULL, method TEXT DEFAULT 'card', ref_code TEXT, proof_file_id TEXT, proof_platform TEXT, status TEXT DEFAULT 'pending', kind TEXT DEFAULT 'entry', created_at TEXT DEFAULT (datetime('now')), handled_by INTEGER, handled_at TEXT)",
  "CREATE TABLE IF NOT EXISTS prizes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, room_id INTEGER, amount REAL NOT NULL, note TEXT, status TEXT DEFAULT 'pending', created_by INTEGER, created_at TEXT DEFAULT (datetime('now')), handled_at TEXT)",
  "CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, amount REAL NOT NULL, kind TEXT, ref TEXT, created_at TEXT DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)",
  "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')), expires_at TEXT)",
  "CREATE TABLE IF NOT EXISTS link_codes (code TEXT PRIMARY KEY, user_id INTEGER NOT NULL, platform TEXT, expires_at TEXT)",
  "CREATE TABLE IF NOT EXISTS bot_state (key TEXT PRIMARY KEY, data TEXT, updated_at TEXT DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_slots_room ON slots(room_id)",
  "CREATE INDEX IF NOT EXISTS idx_slots_user ON slots(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_pay_user ON payments(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_pay_status ON payments(status)",
  "CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)",
  "INSERT OR IGNORE INTO settings (key, value) VALUES ('min_topup','50000'),('welcome','به بزرگترین پلتفرم مدیریت روم‌های کالاف دیوتی موبایل خوش آمدید! 🪖'),('bank_name',''),('card_number',''),('card_name',''),('gateway_url',''),('channel_link','https://t.me/offerspishnahadat_shop_bot'),('support_bot','https://t.me/offerspishnahadat_feedbackbot'),('website_url',''),('offers_site','https://offers-pishnahadat.vercel.app'),('offers_page','https://zaya.io/Offers_pishnahadat'),('shop_bot','https://t.me/offerspishnahadat_shop_bot')"
];
let INIT_P = null;
/* مهاجرت‌های سبک — برای دیتابیس‌های موجود؛ خطای «ستون تکراری» بی‌صدا رد می‌شود */
async function migrateDB(db) {
  const cols = [
    'ALTER TABLE payments ADD COLUMN proof_file_id TEXT',
    'ALTER TABLE payments ADD COLUMN proof_platform TEXT'
  ];
  for (const c of cols) { try { await db.prepare(c).run(); } catch (e) {} }
}
function initDB(db) {
  if (!INIT_P) INIT_P = (async () => {
    await db.batch(SCHEMA_SQL.map(s => db.prepare(s)));
    await migrateDB(db);
    const r = await db.prepare('SELECT value FROM settings WHERE key=?1').bind('wh_secret').first();
    if (!r) await db.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('wh_secret',?1)").bind(rid(24)).run();
  })().catch(e => { INIT_P = null; throw e; });
  return INIT_P;
}
async function whSecret(db) {
  let s = '';
  try { const r = await db.prepare("SELECT value FROM settings WHERE key='wh_secret'").first(); s = (r && r.value) || ''; } catch (e) {}
  if (!s) { s = rid(24); try { await setSetting(db, 'wh_secret', s); } catch (e) {} }
  return s;
}

/* ─────────────── ابزارهای عمومی ─────────────── */
function j(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: H }); }
function html(body) { return new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function faNum(n) { return String(n).replace(/\d/g, d => FA_D[+d]); }
function money(n) { n = Number(n) || 0; return n.toLocaleString('en-US').replace(/,/g, '،'); }
async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
function rid(n = 20) { let s = ''; const c = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
async function body(req) { try { return await req.json(); } catch (e) { return {}; } }

/* ─────────────── دیتابیس: تنظیمات ─────────────── */
async function getSettings(db) {
  const r = await db.prepare('SELECT key,value FROM settings').all();
  const o = {}; (r.results || []).forEach(x => { o[x.key] = x.value; }); return o;
}
async function setSetting(db, k, v) {
  await db.prepare('INSERT INTO settings(key,value) VALUES(?1,?2) ON CONFLICT(key) DO UPDATE SET value=?2').bind(k, String(v == null ? '' : v)).run();
}
function stg(st, k, def) { const v = st[k]; return (v === undefined || v === null || v === '') ? def : v; }
function tgToken(env, st) { return (env && env.TELEGRAM_TOKEN) || stg(st, 'tg_token', ''); }
function baleToken(env, st) { return (env && env.BALE_TOKEN) || stg(st, 'bale_token', ''); }

/* ─────────────── لایه ربات‌ها (ارسال) ─────────────── */
async function botCall(base, token, method, payload) {
  if (!token) return { ok: false, description: 'no token' };
  try {
    const r = await fetch(`${base}/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}) });
    return await r.json().catch(() => ({ ok: false, description: 'bad json' }));
  } catch (e) { return { ok: false, description: String(e && e.message || e) }; }
}
async function sendBot(base, token, chatId, text, kb) {
  const p = { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (kb) p.reply_markup = { inline_keyboard: kb };
  return botCall(base, token, 'sendMessage', p);
}
async function sendBotPhoto(base, token, chatId, fileId, caption, kb) {
  const p = { chat_id: chatId, photo: fileId, caption: String(caption || '').slice(0, 1000), parse_mode: 'HTML' };
  if (kb) p.reply_markup = { inline_keyboard: kb };
  return botCall(base, token, 'sendPhoto', p);
}
async function editBot(base, token, chatId, msgId, text, kb) {
  const p = { chat_id: chatId, message_id: msgId, text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (kb) p.reply_markup = { inline_keyboard: kb };
  const r = await botCall(base, token, 'editMessageText', p);
  if (!r.ok && String(r.description || '').includes('not modified')) return { ok: true };
  return r;
}
/* اطلاع‌رسانی به کاربر روی همه پلتفرم‌های متصل */
async function notifyUser(db, env, userId, text, kb) {
  try {
    const u = await db.prepare('SELECT telegram_id, bale_id FROM users WHERE id=?1').bind(userId).first(); if (!u) return;
    const st = await getSettings(db);
    const kbd = kb || null;
    if (u.telegram_id) keep(sendBot(TG_BASE, tgToken(env, st), u.telegram_id, text, kbd).catch(() => {}));
    if (u.bale_id) keep(sendBot(BL_BASE, baleToken(env, st), u.bale_id, text, kbd).catch(() => {}));
  } catch (e) { /* هرگز اجازه نده اطلاع‌رسانی جریان اصلی را بشکند */ }
}
async function notifyAdmins(db, env, text) {
  try {
    const r = await db.prepare("SELECT id FROM users WHERE role='admin' AND banned=0").all();
    for (const row of (r.results || [])) notifyUser(db, env, row.id, text);
  } catch (e) {}
}
/* اطلاع‌رسانی عکس رسید به ادمین‌ها: عکس روی پلتفرم مبدا (با دکمه تایید/رد) + متن جایگزین برای بقیه */
async function notifyProofAdmins(db, env, payId, headerText) {
  try {
    const pay = await db.prepare('SELECT * FROM payments WHERE id=?1').bind(payId).first();
    if (!pay) return;
    const st = await getSettings(db);
    const admins = await db.prepare("SELECT id, telegram_id, bale_id FROM users WHERE role='admin' AND banned=0").all();
    const cap = `${headerText}\n🧾 کد پیگیری: ${pay.ref_code ? '<code>' + esc(pay.ref_code) + '</code>' : '— (اختیاری)'}\n👇 رسید را بررسی کن:`;
    const kb = [[{ text: '✅ تایید پرداخت', callback_data: `adm:ok:${pay.id}` }, { text: '❌ رد', callback_data: `adm:no:${pay.id}` }]];
    for (const a of (admins.results || [])) {
      const srcId = pay.proof_platform === 'tg' ? a.telegram_id : a.bale_id;
      if (pay.proof_file_id && srcId) {
        keep(sendBotPhoto(pay.proof_platform === 'tg' ? TG_BASE : BL_BASE, pay.proof_platform === 'tg' ? tgToken(env, st) : baleToken(env, st), srcId, pay.proof_file_id, cap, kb).catch(() => {}));
      } else {
        const where = pay.proof_file_id ? `\n📸 عکس رسید در ربات ${pay.proof_platform === 'tg' ? 'تلگرام' : 'بله'} ثبت شده است — از همان ربات بررسی کن.` : '\n⚠️ این پرداخت هنوز عکس رسید ندارد.';
        notifyUser(db, env, a.id, `${headerText}${where}`);
      }
    }
  } catch (e) {}
}
/* متن کوتاه فقط برای ادمین‌های یک پلتفرم مشخص */
async function notifyPlatformAdmins(db, env, platform, text) {
  try {
    const st = await getSettings(db);
    const admins = await db.prepare("SELECT id, telegram_id, bale_id FROM users WHERE role='admin' AND banned=0").all();
    for (const a of (admins.results || [])) {
      const cid = platform === 'tg' ? a.telegram_id : a.bale_id;
      if (cid) keep(sendBot(platform === 'tg' ? TG_BASE : BL_BASE, platform === 'tg' ? tgToken(env, st) : baleToken(env, st), cid, text).catch(() => {}));
    }
  } catch (e) {}
}

/* ─────────────── احراز هویت ─────────────── */
async function authUser(db, req) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer (.+)$/);
  if (!m) return null;
  const s = await db.prepare('SELECT user_id FROM sessions WHERE token=?1 AND expires_at > datetime(\'now\')').bind(m[1]).first();
  if (!s) return null;
  const u = await db.prepare('SELECT * FROM users WHERE id=?1').bind(s.user_id).first();
  if (!u || u.banned) return null;
  return u;
}
function pubUser(u) {
  return { id: u.id, username: u.username, display_name: u.display_name, role: u.role, wallet: num(u.wallet), codm_id: u.codm_id, telegram_id: u.telegram_id, bale_id: u.bale_id, created_at: u.created_at };
}

/* ─────────────── منطق مشترک روم‌ها ─────────────── */
async function roomCounts(db, roomId) {
  const r = await db.prepare("SELECT COUNT(*) t, SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) p, SUM(CASE WHEN status='free' THEN 1 ELSE 0 END) f FROM slots WHERE room_id=?1").bind(roomId).first();
  return { total: num(r && r.t), paid: num(r && r.p), free: num(r && r.f) };
}
/* محدودیت‌های چیدمان روم — تا ۵۰ تیم × ۲۰ نفر (سقف کل ۲۵۰ اسلات در هر روم) */
const MAX_TEAMS = 50, MAX_SIZE = 20, MAX_SLOTS = 250;
function clampTeams(v, def) { let n = Math.floor(num(v)); if (!n) n = def || 2; return Math.min(MAX_TEAMS, Math.max(2, n)); }
function clampSize(v, def) { let n = Math.floor(num(v)); if (!n) n = def || 4; return Math.min(MAX_SIZE, Math.max(1, n)); }
function layoutError(teams, size) {
  if (!Number.isInteger(teams) || teams < 2 || teams > MAX_TEAMS) return `تعداد تیم‌ها باید عددی بین ۲ تا ${faNum(MAX_TEAMS)} باشد`;
  if (!Number.isInteger(size) || size < 1 || size > MAX_SIZE) return `بازیکن در هر تیم باید عددی بین ۱ تا ${faNum(MAX_SIZE)} باشد`;
  if (teams * size > MAX_SLOTS) return `حداکثر ظرفیت هر روم ${faNum(MAX_SLOTS)} بازیکن است (تعداد تیم‌ها × اعضا = ${faNum(teams * size)})`;
  return '';
}
async function batchChunks(db, stmts, per = 80) { for (let i = 0; i < stmts.length; i += per) await db.batch(stmts.slice(i, i + per)); }
async function createRoom(db, env, f, adminId) {
  const mode = MODES[f.mode] ? f.mode : 'custom';
  const teams = clampTeams(f.teams, MODES[mode].def_teams);
  const size = clampSize(f.team_size, MODES[mode].def_size);
  const maxp = teams * size;
  const rr = await db.prepare(`INSERT INTO rooms (title,mode,map_name,teams,team_size,max_players,entry_fee,prize_pool,start_time,description,rules,created_by,status)
    VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,'open')`)
    .bind(String(f.title || 'روم جدید').slice(0, 120), mode, String(f.map_name || '').slice(0, 60), teams, size, maxp,
      num(f.entry_fee), num(f.prize_pool), String(f.start_time || '').slice(0, 40), String(f.description || '').slice(0, 800), String(f.rules || '').slice(0, 800), adminId || null)
    .run();
  const roomId = rr.meta.last_row_id;
  const stmts = [];
  for (let t = 0; t < teams; t++) for (let s = 1; s <= size; s++) {
    stmts.push(db.prepare('INSERT INTO slots (room_id,slot_no,team_label) VALUES(?1,?2,?3)').bind(roomId, t * size + s, TEAM_NAMES[t] || ('تیم ' + faNum(t + 1))));
  }
  await batchChunks(db, stmts);
  return roomId;
}
async function roomText(db, env, roomId, viewer) {
  const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(roomId).first();
  if (!room) return null;
  const c = await roomCounts(db, roomId);
  const m = MODES[room.mode] || MODES.custom;
  let t = `${m.emoji} <b>${esc(room.title)}</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🎮 حالت: <b>${m.fa}</b>\n` +
    `🗺 نقشه: <b>${esc(room.map_name) || '—'}</b>\n` +
    `👥 ظرفیت: <b>${faNum(c.paid)}/${faNum(c.total)}</b> نفر\n` +
    `💰 ورودی: <b>${room.entry_fee > 0 ? money(room.entry_fee) + ' تومان' : 'رایگان'}</b>\n` +
    `🏆 جایزه: <b>${room.prize_pool > 0 ? money(room.prize_pool) + ' تومان' : '—'}</b>\n` +
    (room.start_time ? `🕒 شروع: <b>${esc(room.start_time)}</b>\n` : '') +
    `📌 وضعیت: <b>${ROOM_STATUS[room.status] || room.status}</b>\n`;
  if (room.description) t += `📝 ${esc(room.description)}\n`;
  if (room.rules) t += `📜 قوانین: ${esc(room.rules)}\n`;
  let canSee = !!(viewer && viewer.role === 'admin');
  if (!canSee && viewer && viewer.id) {
    try { canSee = !!(await db.prepare("SELECT id FROM slots WHERE room_id=?1 AND user_id=?2 AND status IN ('paid','pending')").bind(roomId, viewer.id).first()); } catch (e) {}
  }
  if (canSee && room.room_id && room.room_pass) t += `\n🔓 <b>اطلاعات روم:</b>\n🆔 Room ID: <code>${esc(room.room_id)}</code>\n🔑 Password: <code>${esc(room.room_pass)}</code>\n`;
  t += `\n👇 یک موقعیت انتخاب کن:`;
  return { room, counts: c, text: t };
}

/* ─────────────── منطق مشترک پرداخت ─────────────── */
async function approvePayment(db, env, payId, adminId) {
  const pay = await db.prepare('SELECT * FROM payments WHERE id=?1').bind(payId).first();
  if (!pay || pay.status !== 'pending') return { ok: false, error: 'پرداخت یافت نشد یا قبلاً بررسی شده' };
  await db.prepare("UPDATE payments SET status='approved', handled_by=?2, handled_at=datetime('now') WHERE id=?1").bind(payId, adminId || null).run();
  if (pay.kind === 'topup') {
    await db.prepare('UPDATE users SET wallet = wallet + ?2 WHERE id=?1').bind(pay.user_id, num(pay.amount)).run();
    await db.prepare('INSERT INTO transactions (user_id,amount,kind,ref) VALUES(?1,?2,?3,?4)').bind(pay.user_id, num(pay.amount), 'topup', 'PAY#' + payId).run();
    notifyUser(db, env, pay.user_id, `💰 <b>کیف پول شما شارژ شد!</b>\n\n💵 مبلغ: <b>${money(pay.amount)} تومان</b>\n🧾 کد پیگیری: <code>${esc(pay.ref_code || ('PAY-' + payId))}</code>\n\nبرای مشاهده موجودی، «حساب من» را بزنید.`);
    return { ok: true, kind: 'topup' };
  }
  if (pay.slot_id) {
    await db.prepare("UPDATE slots SET status='paid' WHERE id=?1").bind(pay.slot_id).run();
    const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(pay.room_id).first();
    const c = room ? await roomCounts(db, pay.room_id) : null;
    if (room && c && c.free === 0 && room.status === 'open') await db.prepare("UPDATE rooms SET status='full' WHERE id=?1").bind(room.id).run();
    let extra = '';
    if (room && room.room_id && room.room_pass) extra += `\n\n🆔 Room ID: <code>${esc(room.room_id)}</code>\n🔑 Password: <code>${esc(room.room_pass)}</code>`;
    notifyUser(db, env, pay.user_id, `✅ <b>پرداخت شما تایید شد!</b>\n\n🎮 روم: <b>${esc(room ? room.title : '')}</b>${extra}\n\nموفق باشی قهرمان! 🪖`);
    return { ok: true, kind: 'entry' };
  }
  return { ok: true, kind: 'other' };
}
async function rejectPayment(db, env, payId, adminId) {
  const pay = await db.prepare('SELECT * FROM payments WHERE id=?1').bind(payId).first();
  if (!pay || pay.status !== 'pending') return { ok: false, error: 'پرداخت یافت نشد یا قبلاً بررسی شده' };
  await db.prepare("UPDATE payments SET status='rejected', handled_by=?2, handled_at=datetime('now') WHERE id=?1").bind(payId, adminId || null).run();
  if (pay.kind === 'entry' && pay.slot_id) {
    await db.prepare("UPDATE slots SET status='free', user_id=NULL, payment_id=NULL WHERE id=?1 AND status='pending'").bind(pay.slot_id).run();
  }
  notifyUser(db, env, pay.user_id, `❌ <b>پرداخت شما رد شد</b>\n\n🧾 کد پیگیری: <code>${esc(pay.ref_code || ('PAY-' + payId))}</code>\n💵 مبلغ: ${money(pay.amount)} تومان\n\nدر صورت نیاز با پشتیبانی در تماس باش.`);
  return { ok: true };
}
async function approvePrize(db, env, prizeId, adminId) {
  const p = await db.prepare('SELECT * FROM prizes WHERE id=?1').bind(prizeId).first();
  if (!p || p.status !== 'pending') return { ok: false, error: 'جایزه یافت نشد یا قبلاً بررسی شده' };
  await db.prepare("UPDATE prizes SET status='approved', handled_at=datetime('now') WHERE id=?1").bind(prizeId).run();
  await db.prepare('UPDATE users SET wallet = wallet + ?2 WHERE id=?1').bind(p.user_id, num(p.amount)).run();
  await db.prepare('INSERT INTO transactions (user_id,amount,kind,ref) VALUES(?1,?2,?3,?4)').bind(p.user_id, num(p.amount), 'prize', 'PRIZE#' + prizeId).run();
  notifyUser(db, env, p.user_id, `🏆 <b>جایزه تو تایید شد!</b>\n\n💵 مبلغ: <b>${money(p.amount)} تومان</b> به کیف پولت اضافه شد.\n${p.note ? '📝 ' + esc(p.note) + '\n' : ''}\nدمت گرم قهرمان! 🔥`);
  return { ok: true };
}

/* ─────────────── API: عمومی ─────────────── */
async function apiPublicStats(db) {
  const u = await db.prepare('SELECT COUNT(*) c FROM users').first();
  const r = await db.prepare("SELECT COUNT(*) c, SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) o FROM rooms").first();
  const e = await db.prepare("SELECT COUNT(*) c FROM slots WHERE status='paid'").first();
  const p = await db.prepare("SELECT COALESCE(SUM(amount),0) s FROM prizes WHERE status='approved'").first();
  return j({ ok: true, users: num(u.c), rooms: num(r.c), openRooms: num(r.o), entries: num(e.c), prizesPaid: num(p.s) });
}
async function apiPublicConfig(db, env) {
  const st = await getSettings(db);
  return j({
    ok: true,
    channel_link: stg(st, 'channel_link', ''),
    support_bot: stg(st, 'support_bot', 'https://t.me/offerspishnahadat_feedbackbot'),
    website_url: stg(st, 'website_url', ''),
    offers_site: stg(st, 'offers_site', 'https://offers-pishnahadat.vercel.app'),
    offers_page: stg(st, 'offers_page', 'https://zaya.io/Offers_pishnahadat'),
    shop_bot: stg(st, 'shop_bot', 'https://t.me/offerspishnahadat_shop_bot'),
    min_topup: num(stg(st, 'min_topup', 50000)),
    has_card: !!stg(st, 'card_number', ''),
    has_gateway: !!stg(st, 'gateway_url', ''),
    modes: MODES
  });
}

/* ─────────────── API: احراز هویت ─────────────── */
async function apiRegister(db, env, req) {
  const b = await body(req);
  const username = String(b.username || '').trim();
  const password = String(b.password || '');
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return j({ ok: false, error: 'نام کاربری باید ۳ تا ۲۰ حرف انگلیسی، عدد یا _ باشد' }, 400);
  if (password.length < 4) return j({ ok: false, error: 'رمز عبور حداقل ۴ کاراکتر باشد' }, 400);
  const ex = await db.prepare('SELECT id FROM users WHERE LOWER(username)=LOWER(?1)').bind(username).first();
  if (ex) return j({ ok: false, error: 'این نام کاربری قبلاً ثبت شده' }, 400);
  const st = await getSettings(db);
  const noAdmin = !(await db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first());
  const secret = (env && env.ADMIN_SECRET) || stg(st, 'admin_secret', '');
  const isAdmin = noAdmin || (b.admin_secret && secret && b.admin_secret === secret);
  const h = await sha256(password + '::codm');
  const rr = await db.prepare("INSERT INTO users (username,password_hash,display_name,role) VALUES(?1,?2,?3,?4)")
    .bind(username, h, String(b.display_name || username).slice(0, 60), isAdmin ? 'admin' : 'user').run();
  const uid = rr.meta.last_row_id;
  const token = rid(32);
  await db.prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES(?1,?2,datetime('now','+30 days'))").bind(token, uid).run();
  if (isAdmin && !noAdmin) await setSetting(db, 'admin_secret', stg(st, 'admin_secret', '') || rid(10));
  const u = await db.prepare('SELECT * FROM users WHERE id=?1').bind(uid).first();
  return j({ ok: true, token, user: pubUser(u), is_first_admin: !!noAdmin });
}
async function apiLogin(db, req) {
  const b = await body(req);
  const username = String(b.username || '').trim();
  const h = await sha256(String(b.password || '') + '::codm');
  const u = await db.prepare('SELECT * FROM users WHERE LOWER(username)=LOWER(?1)').bind(username).first();
  if (!u || u.password_hash !== h) return j({ ok: false, error: 'نام کاربری یا رمز عبور اشتباه است' }, 401);
  if (u.banned) return j({ ok: false, error: 'حساب شما مسدود شده است' }, 403);
  const token = rid(32);
  await db.prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES(?1,?2,datetime('now','+30 days'))").bind(token, u.id).run();
  return j({ ok: true, token, user: pubUser(u) });
}
async function apiMe(db, req) {
  const u = await authUser(db, req);
  if (!u) return j({ ok: false, error: 'unauthorized' }, 401);
  const entries = await db.prepare(`SELECT s.id slot_id, s.slot_no, s.team_label, s.status, r.id room_id, r.title, r.mode, r.status room_status, r.entry_fee, r.room_id code_id, r.room_pass code_pass, p.id pay_id, p.status pay_status, p.amount
    FROM slots s JOIN rooms r ON r.id=s.room_id LEFT JOIN payments p ON p.id=s.payment_id
    WHERE s.user_id=?1 ORDER BY s.id DESC LIMIT 50`).bind(u.id).all();
  const tx = await db.prepare('SELECT * FROM transactions WHERE user_id=?1 ORDER BY id DESC LIMIT 30').bind(u.id).all();
  const prizes = await db.prepare('SELECT * FROM prizes WHERE user_id=?1 ORDER BY id DESC LIMIT 20').bind(u.id).all();
  return j({ ok: true, user: pubUser(u), entries: entries.results || [], transactions: tx.results || [], prizes: prizes.results || [] });
}
async function apiMeUpdate(db, req) {
  const u = await authUser(db, req);
  if (!u) return j({ ok: false, error: 'unauthorized' }, 401);
  const b = await body(req);
  if (b.display_name !== undefined) await db.prepare('UPDATE users SET display_name=?2 WHERE id=?1').bind(u.id, String(b.display_name).slice(0, 60)).run();
  if (b.codm_id !== undefined) await db.prepare('UPDATE users SET codm_id=?2 WHERE id=?1').bind(u.id, String(b.codm_id).slice(0, 40)).run();
  if (b.password) {
    if (String(b.password).length < 4) return j({ ok: false, error: 'رمز عبور حداقل ۴ کاراکتر باشد' }, 400);
    const h = await sha256(String(b.password) + '::codm');
    await db.prepare('UPDATE users SET password_hash=?2 WHERE id=?1').bind(u.id, h).run();
  }
  const nu = await db.prepare('SELECT * FROM users WHERE id=?1').bind(u.id).first();
  return j({ ok: true, user: pubUser(nu) });
}
/* اتصال اکانت ربات به اکانت سایت با کد */
async function apiLink(db, env, req) {
  const u = await authUser(db, req);
  if (!u) return j({ ok: false, error: 'unauthorized' }, 401);
  const b = await body(req);
  const code = String(b.code || '').trim().toUpperCase();
  const lc = await db.prepare('SELECT * FROM link_codes WHERE code=?1 AND expires_at > datetime(\'now\')').bind(code).first();
  if (!lc) return j({ ok: false, error: 'کد نامعتبر یا منقضی است. در ربات دستور /link را بزنید' }, 400);
  if (lc.user_id === u.id) return j({ ok: false, error: 'این پلتفرم از قبل به همین حسابت متصل است ✅ — برای پلتفرم دیگر، از آن ربات /link بزن' }, 400);
  const bot = await db.prepare('SELECT * FROM users WHERE id=?1').bind(lc.user_id).first();
  if (!bot) return j({ ok: false, error: 'اکانت ربات یافت نشد' }, 400);
  const tg = u.telegram_id || bot.telegram_id;
  const bl = u.bale_id || bot.bale_id;
  /* ترتیب مهم است: اول انتقال داده‌ها، بعد حذف ردیف ربات، آخر ستدن شناسه‌ها (جلوگیری از UNIQUE conflict) */
  await db.batch([
    db.prepare('UPDATE slots SET user_id=?2 WHERE user_id=?1').bind(bot.id, u.id),
    db.prepare('UPDATE payments SET user_id=?2 WHERE user_id=?1').bind(bot.id, u.id),
    db.prepare('UPDATE transactions SET user_id=?2 WHERE user_id=?1').bind(bot.id, u.id),
    db.prepare('UPDATE prizes SET user_id=?2 WHERE user_id=?1').bind(bot.id, u.id),
    db.prepare('DELETE FROM users WHERE id=?1').bind(bot.id)
  ]);
  await db.prepare("UPDATE users SET telegram_id=?2, bale_id=?3, wallet=wallet+?4, codm_id=COALESCE(NULLIF(codm_id,''),?5), display_name=COALESCE(NULLIF(display_name,''),?6) WHERE id=?1")
    .bind(u.id, tg, bl, num(bot.wallet), bot.codm_id || '', bot.display_name || '').run();
  await db.prepare('DELETE FROM link_codes WHERE code=?1').bind(code).run();
  notifyUser(db, env, u.id, '🔗 <b>اکانت شما با موفقیت متصل شد!</b>\nحالا هم سایت و هم ربات، حساب واحد شما را می‌شناسند. ✅');
  const nu = await db.prepare('SELECT * FROM users WHERE id=?1').bind(u.id).first();
  return j({ ok: true, user: pubUser(nu) });
}

/* ─────────────── API: روم‌ها ─────────────── */
async function apiRooms(db, url) {
  const st = url.searchParams.get('status');
  const mode = url.searchParams.get('mode');
  let sql = `SELECT r.*, (SELECT COUNT(*) FROM slots s WHERE s.room_id=r.id) total,
    (SELECT COUNT(*) FROM slots s WHERE s.room_id=r.id AND s.status='paid') paid,
    (SELECT COUNT(*) FROM slots s WHERE s.room_id=r.id AND s.status='free') free FROM rooms r WHERE 1=1`;
  const binds = [];
  if (st && st !== 'all') { sql += ` AND r.status=?${binds.length + 1}`; binds.push(st); }
  if (mode && mode !== 'all') { sql += ` AND r.mode=?${binds.length + 1}`; binds.push(mode); }
  sql += " ORDER BY CASE r.status WHEN 'open' THEN 0 WHEN 'full' THEN 1 WHEN 'running' THEN 2 ELSE 3 END, r.id DESC LIMIT 100";
  const stmt = binds.length ? db.prepare(sql).bind(...binds) : db.prepare(sql);
  const r = await stmt.all();
  return j({ ok: true, rooms: r.results || [] });
}
async function apiRoomGet(db, req, id) {
  const room = await db.prepare('SELECT r.*, (SELECT username FROM users WHERE id=r.created_by) creator FROM rooms r WHERE r.id=?1').bind(id).first();
  if (!room) return j({ ok: false, error: 'روم یافت نشد' }, 404);
  let viewer = null;
  try { viewer = await authUser(db, req); } catch (e) {}
  let showSecret = !!(viewer && viewer.role === 'admin');
  if (!showSecret && viewer) {
    const mine = await db.prepare("SELECT id FROM slots WHERE room_id=?1 AND user_id=?2 AND status IN ('paid','pending')").bind(id, viewer.id).first();
    showSecret = !!mine;
  }
  if (!showSecret) { delete room.room_id; delete room.room_pass; }
  const slots = await db.prepare(`SELECT s.*, u.display_name, u.username FROM slots s LEFT JOIN users u ON u.id=s.user_id WHERE s.room_id=?1 ORDER BY s.slot_no`).bind(id).all();
  const c = await roomCounts(db, id);
  return j({ ok: true, room, slots: slots.results || [], counts: c });
}
async function apiRoomCreate(db, env, req) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  if (!b.title || !String(b.title).trim()) return j({ ok: false, error: 'عنوان روم الزامی است' }, 400);
  const lerr = layoutError(Math.floor(num(b.teams) || 2), Math.floor(num(b.team_size) || 4));
  if (lerr) return j({ ok: false, error: lerr }, 400);
  const id = await createRoom(db, null, b, u.id);
  announceNewRoom(db, env, id);
  return j({ ok: true, id });
}
async function apiRoomUpdate(db, req, id) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  if (b.teams !== undefined || b.team_size !== undefined) {
    const cur0 = await db.prepare('SELECT teams, team_size FROM rooms WHERE id=?1').bind(id).first();
    const nt = b.teams !== undefined ? Math.floor(num(b.teams)) : num(cur0 && cur0.teams);
    const ns = b.team_size !== undefined ? Math.floor(num(b.team_size)) : num(cur0 && cur0.team_size);
    const lerr = layoutError(nt, ns);
    if (lerr) return j({ ok: false, error: lerr }, 400);
  }
  if (b.reset_slots) {
    const cur = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(id).first();
    if (cur && cur.status === 'open') {
      await db.prepare("UPDATE payments SET status='rejected', handled_at=datetime('now') WHERE room_id=?1 AND status='pending'").bind(id).run();
      await db.prepare('DELETE FROM slots WHERE room_id=?1').bind(id).run();
    }
  }
  const fields = ['title','mode','map_name','teams','team_size','entry_fee','prize_pool','start_time','description','rules','status','room_id','room_pass'];
  const sets = [], binds = [];
  for (const f of fields) if (b[f] !== undefined) { sets.push(`${f}=?${binds.length + 1}`); binds.push(typeof b[f] === 'string' ? b[f].slice(0, 800) : b[f]); }
  if (!sets.length) { /* ممکن است فقط reset_slots خواسته شده باشد */ }
  if (sets.length) {
    binds.push(id);
    await db.prepare(`UPDATE rooms SET ${sets.join(',')} WHERE id=?${binds.length}`).bind(...binds).run();
  }
  if (b.reset_slots) {
    const cur = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(id).first();
    if (cur) {
      const teams = clampTeams(cur.teams, 2);
      const size = clampSize(cur.team_size, 4);
      await db.prepare('UPDATE rooms SET max_players=?2 WHERE id=?1').bind(id, teams * size).run();
      const stmts = [];
      for (let t = 0; t < teams; t++) for (let s = 1; s <= size; s++) stmts.push(db.prepare('INSERT INTO slots (room_id,slot_no,team_label) VALUES(?1,?2,?3)').bind(id, t * size + s, TEAM_NAMES[t] || ('تیم ' + faNum(t + 1))));
      await batchChunks(db, stmts);
    }
  }
  return j({ ok: true });
}
async function apiRoomDelete(db, req, id) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  await db.batch([db.prepare('DELETE FROM slots WHERE room_id=?1').bind(id), db.prepare('DELETE FROM rooms WHERE id=?1').bind(id)]);
  return j({ ok: true });
}
/* عضویت در روم — قلب سیستم (منطق اصلی مشترک در joinCore) */
async function apiRoomJoin(db, env, req, id) {
  const u = await authUser(db, req);
  if (!u) return j({ ok: false, error: 'برای ثبت‌نام اول وارد شوید' }, 401);
  if (u.banned) return j({ ok: false, error: 'حساب شما مسدود است' }, 403);
  const b = await body(req);
  const r = await joinCore(db, env, u, id, num(b.slot_no), String(b.method || ''));
  return j(r, r.ok ? 200 : 400);
}
async function checkRoomFull(db, roomId) {
  const c = await roomCounts(db, roomId);
  if (c.free === 0) await db.prepare("UPDATE rooms SET status='full' WHERE id=?1 AND status='open'").bind(roomId).run();
}
async function apiRoomLeave(db, env, req, id) {
  const u = await authUser(db, req);
  if (!u) return j({ ok: false, error: 'unauthorized' }, 401);
  const r = await leaveCore(db, env, u, id);
  return j(r, r.ok ? 200 : 400);
}
async function apiRoomPublish(db, env, req, id) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  await db.prepare('UPDATE rooms SET room_id=?2, room_pass=?3 WHERE id=?1').bind(id, String(b.room_id || ''), String(b.room_pass || '')).run();
  const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(id).first();
  const players = await db.prepare("SELECT DISTINCT user_id FROM slots WHERE room_id=?1 AND status='paid' AND user_id IS NOT NULL").bind(id).all();
  for (const p of (players.results || [])) {
    notifyUser(db, env, p.user_id, `🔓 <b>اطلاعات روم آماده شد!</b>\n\n🎮 روم: <b>${esc(room.title)}</b>\n🆔 Room ID: <code>${esc(room.room_id)}</code>\n🔑 Password: <code>${esc(room.room_pass)}</code>\n\n‌سریع خودت را برسون قهرمان! ⏰`);
  }
  return j({ ok: true, notified: (players.results || []).length });
}
async function apiRoomStatus(db, env, req, id) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  const status = String(b.status || '');
  if (!['open', 'running', 'finished', 'cancelled'].includes(status)) return j({ ok: false, error: 'وضعیت نامعتبر' }, 400);
  const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(id).first();
  if (!room) return j({ ok: false, error: 'روم یافت نشد' }, 404);
  if (status === 'cancelled' && room.status !== 'cancelled') {
    const paid = await db.prepare("SELECT s.*, p.amount FROM slots s LEFT JOIN payments p ON p.id=s.payment_id WHERE s.room_id=?1 AND s.status='paid' AND s.user_id IS NOT NULL").bind(id).all();
    for (const s of (paid.results || [])) {
      if (num(s.amount) > 0) {
        await db.prepare('UPDATE users SET wallet = wallet + ?2 WHERE id=?1').bind(s.user_id, num(s.amount)).run();
        await db.prepare('INSERT INTO transactions (user_id,amount,kind,ref) VALUES(?1,?2,?3,?4)').bind(s.user_id, num(s.amount), 'refund', 'ROOM#' + id).run();
      }
      notifyUser(db, env, s.user_id, `❌ روم <b>${esc(room.title)}</b> لغو شد.\n💰 ورودی ${money(s.amount)} تومان به کیف پولت برگشت داده شد.`);
    }
    await db.prepare("UPDATE payments SET status='rejected', handled_at=datetime('now') WHERE room_id=?1 AND status='pending'").bind(id).run();
    await db.prepare("UPDATE slots SET status='free', user_id=NULL, payment_id=NULL WHERE room_id=?1").bind(id).run();
  }
  await db.prepare('UPDATE rooms SET status=?2 WHERE id=?1').bind(id, status).run();
  return j({ ok: true });
}
async function apiRoomRemove(db, env, req, id) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  const slot = await db.prepare("SELECT * FROM slots WHERE room_id=?1 AND slot_no=?2 AND status IN ('pending','paid')").bind(id, num(b.slot_no)).first();
  if (!slot) return j({ ok: false, error: 'بازیکن در این موقعیت یافت نشد' }, 404);
  if (slot.payment_id) {
    const pay = await db.prepare('SELECT * FROM payments WHERE id=?1').bind(slot.payment_id).first();
    if (pay && pay.status === 'approved' && num(pay.amount) > 0) {
      await db.prepare('UPDATE users SET wallet = wallet + ?2 WHERE id=?1').bind(slot.user_id, num(pay.amount)).run();
      await db.prepare('INSERT INTO transactions (user_id,amount,kind,ref) VALUES(?1,?2,?3,?4)').bind(slot.user_id, num(pay.amount), 'refund', 'ROOM#' + id).run();
    }
  }
  await db.prepare("UPDATE slots SET status='free', user_id=NULL, payment_id=NULL WHERE id=?1").bind(slot.id).run();
  await db.prepare("UPDATE rooms SET status='open' WHERE id=?1 AND status='full'").bind(id).run();
  notifyUser(db, env, slot.user_id, `⚠️ شما توسط مدیریت از روم حذف شدید. در صورت پرداخت، مبلغ به کیف پولت برگشت داده شد. 💰`);
  return j({ ok: true });
}

/* ─────────────── API: شارژ کیف پول ─────────────── */
async function apiTopup(db, env, req) {
  const u = await authUser(db, req);
  if (!u) return j({ ok: false, error: 'unauthorized' }, 401);
  const b = await body(req);
  const amount = num(b.amount);
  const method = String(b.method || 'card');
  const st = await getSettings(db);
  const minTop = num(stg(st, 'min_topup', 50000));
  if (amount < minTop) return j({ ok: false, error: `حداقل مبلغ شارژ ${money(minTop)} تومان است` }, 400);
  if (method === 'card' && !stg(st, 'card_number', '')) return j({ ok: false, error: 'پرداخت کارت‌به‌کارت فعلاً فعال نیست' }, 400);
  if (method === 'online' && !stg(st, 'gateway_url', '')) return j({ ok: false, error: 'درگاه پرداخت فعلاً فعال نیست' }, 400);
  const pr = await db.prepare("INSERT INTO payments (user_id,amount,method,ref_code,status,kind) VALUES(?1,?2,?3,?4,'pending','topup')").bind(u.id, amount, method, String(b.ref_code || '').slice(0, 60)).run();
  notifyAdmins(db, env, `🔔 <b>درخواست شارژ کیف پول</b>\n\n👤 ${esc(u.display_name || u.username)}\n💰 مبلغ: ${money(amount)} تومان\nروش: ${method === 'card' ? 'کارت‌به‌کارت' : 'درگاه'}${b.ref_code ? '\n🧾 کد: ' + esc(b.ref_code) : ''}`);
  const resp = { ok: true, payment_id: pr.meta.last_row_id, message: 'درخواست شارژ ثبت شد و پس از تایید مدیریت، کیف پولت شارژ می‌شود.' };
  if (method === 'card') resp.card = { number: stg(st, 'card_number', ''), name: stg(st, 'card_name', ''), bank: stg(st, 'bank_name', '') };
  if (method === 'online') resp.gateway_url = String(stg(st, 'gateway_url', '')).replace('{amount}', String(amount)).replace('{desc}', encodeURIComponent('Topup'));
  return j(resp);
}

/* ثبت کد پیگیری پرداخت توسط صاحب پرداخت (سایت) */
async function apiPaymentRef(db, env, req, payId) {
  const u = await authUser(db, req);
  if (!u) return j({ ok: false, error: 'unauthorized' }, 401);
  const b = await body(req);
  const pay = await db.prepare('SELECT * FROM payments WHERE id=?1 AND user_id=?2').bind(payId, u.id).first();
  if (!pay) return j({ ok: false, error: 'پرداخت یافت نشد' }, 404);
  if (pay.status !== 'pending') return j({ ok: false, error: 'این پرداخت قبلاً بررسی شده' }, 400);
  await db.prepare('UPDATE payments SET ref_code=?2 WHERE id=?1').bind(payId, String(b.ref_code || '').slice(0, 60)).run();
  const st = await getSettings(db);
  notifyAdmins(db, env, `🧾 <b>رسید پرداخت ثبت شد</b>\n\n#${faNum(payId)} | ${pay.kind === 'topup' ? '💰 شارژ' : '🎮 ورودی روم'} | ${money(pay.amount)} ت\n👤 ${esc(u.display_name || u.username)}\n🆔 کد پیگیری: <code>${esc(String(b.ref_code || '').slice(0, 60))}</code>\n\nاز پنل مدیریت تایید کنید.`);
  return j({ ok: true });
}

/* ─────────────── API: ادمین — پرداخت‌ها ─────────────── */
async function apiPayments(db, req, url) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const st = url.searchParams.get('status') || 'all';
  const kind = url.searchParams.get('kind') || 'all';
  let sql = `SELECT p.*, u.username, u.display_name, r.title room_title FROM payments p
    LEFT JOIN users u ON u.id=p.user_id LEFT JOIN rooms r ON r.id=p.room_id WHERE 1=1`;
  const binds = [];
  if (st !== 'all') { sql += ` AND p.status=?${binds.length + 1}`; binds.push(st); }
  if (kind !== 'all') { sql += ` AND p.kind=?${binds.length + 1}`; binds.push(kind); }
  sql += ' ORDER BY p.id DESC LIMIT 200';
  const r = await db.prepare(sql).bind(...binds).all();
  return j({ ok: true, payments: r.results || [] });
}

/* ─────────────── API: ادمین — جوایز ─────────────── */
async function apiPrizes(db, req, url) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const st = url.searchParams.get('status') || 'all';
  let sql = `SELECT pz.*, u.username, u.display_name, r.title room_title FROM prizes pz
    LEFT JOIN users u ON u.id=pz.user_id LEFT JOIN rooms r ON r.id=pz.room_id WHERE 1=1`;
  const binds = [];
  if (st !== 'all') { sql += ` AND pz.status=?${binds.length + 1}`; binds.push(st); }
  sql += ' ORDER BY pz.id DESC LIMIT 200';
  const r = await db.prepare(sql).bind(...binds).all();
  return j({ ok: true, prizes: r.results || [] });
}
async function apiPrizeCreate(db, env, req) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  const amount = num(b.amount);
  if (amount <= 0) return j({ ok: false, error: 'مبلغ باید بیشتر از صفر باشد' }, 400);
  let target = null;
  if (b.user_id) target = await db.prepare('SELECT id FROM users WHERE id=?1').bind(num(b.user_id)).first();
  else if (b.username) target = await db.prepare('SELECT id FROM users WHERE LOWER(username)=LOWER(?1)').bind(String(b.username).trim()).first();
  if (!target) return j({ ok: false, error: 'کاربر یافت نشد' }, 404);
  const pr = await db.prepare("INSERT INTO prizes (user_id,room_id,amount,note,status,created_by) VALUES(?1,?2,?3,?4,'pending',?5)").bind(target.id, b.room_id ? num(b.room_id) : null, amount, String(b.note || '').slice(0, 200), u.id).run();
  if (b.approve_now) await approvePrize(db, env, pr.meta.last_row_id, u.id);
  return j({ ok: true, id: pr.meta.last_row_id });
}

/* ─────────────── API: ادمین — کاربران ─────────────── */
async function apiUsers(db, req, url) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const q = (url.searchParams.get('q') || '').trim();
  let sql = `SELECT u.id, u.username, u.display_name, u.role, u.wallet, u.banned, u.telegram_id, u.bale_id, u.codm_id, u.created_at,
    (SELECT COUNT(*) FROM slots s WHERE s.user_id=u.id AND s.status='paid') entries FROM users u`;
  if (q) sql += ` WHERE LOWER(u.username) LIKE LOWER(?1) OR u.telegram_id=?1 OR u.bale_id=?1 OR CAST(u.id AS TEXT)=?1`;
  sql += ' ORDER BY u.id DESC LIMIT 100';
  const r = q ? await db.prepare(sql).bind('%' + q + '%').all() : await db.prepare(sql).all();
  return j({ ok: true, users: r.results || [] });
}
async function apiUserRole(db, req, id) {
  const me = await authUser(db, req);
  if (!me || me.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  const role = String(b.role || 'user');
  if (!['user', 'admin'].includes(role)) return j({ ok: false, error: 'نقش نامعتبر' }, 400);
  if (num(id) === me.id && role !== 'admin') return j({ ok: false, error: 'نمی‌توانی ادمین بودن خودت را برداری' }, 400);
  await db.prepare('UPDATE users SET role=?2 WHERE id=?1').bind(id, role).run();
  return j({ ok: true });
}
async function apiUserBan(db, req, id) {
  const me = await authUser(db, req);
  if (!me || me.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  if (num(id) === me.id) return j({ ok: false, error: 'نمی‌توانی خودت را مسدود کنی' }, 400);
  const b = await body(req);
  await db.prepare('UPDATE users SET banned=?2 WHERE id=?1').bind(id, b.banned ? 1 : 0).run();
  return j({ ok: true });
}

/* ─────────────── API: ادمین — آمار و تنظیمات ─────────────── */
async function apiStats(db) {
  const q = async (sql) => (await db.prepare(sql).first());
  const users = await q('SELECT COUNT(*) c FROM users');
  const today = await q("SELECT COUNT(*) c FROM users WHERE created_at >= date('now')");
  const admins = await q("SELECT COUNT(*) c FROM users WHERE role='admin'");
  const rooms = await q("SELECT COUNT(*) c, SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) o, SUM(CASE WHEN status='running' THEN 1 ELSE 0 END) r, SUM(CASE WHEN status='finished' THEN 1 ELSE 0 END) f FROM rooms");
  const entries = await q("SELECT COUNT(*) c FROM slots WHERE status='paid'");
  const revenue = await q("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='approved' AND kind='entry'");
  const topups = await q("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='approved' AND kind='topup'");
  const wallet = await q('SELECT COALESCE(SUM(wallet),0) s FROM users');
  const prizes = await q("SELECT COALESCE(SUM(amount),0) s FROM prizes WHERE status='approved'");
  const pendPay = await q("SELECT COUNT(*) c FROM payments WHERE status='pending'");
  const pendPrize = await q("SELECT COUNT(*) c FROM prizes WHERE status='pending'");
  return j({
    ok: true,
    users: num(users.c), todayUsers: num(today.c), admins: num(admins.c),
    rooms: num(rooms.c), openRooms: num(rooms.o), runningRooms: num(rooms.r), finishedRooms: num(rooms.f),
    entries: num(entries.c), revenue: num(revenue.s), topups: num(topups.s),
    walletTotal: num(wallet.s), prizesPaid: num(prizes.s),
    pendingPayments: num(pendPay.c), pendingPrizes: num(pendPrize.c)
  });
}
async function apiSettingsGet(db, req) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const st = await getSettings(db);
  return j({ ok: true, settings: st });
}
async function apiSettingsSet(db, req) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  for (const k of Object.keys(b)) if (SET_KEYS.includes(k)) await setSetting(db, k, b[k]);
  return j({ ok: true });
}
/* پیام همگانی — دسته‌ای برای جلوگیری از خطای subrequest */
async function apiBroadcast(db, env, req) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  const text = String(b.text || '').slice(0, 3500);
  const target = String(b.target || 'all');
  const offset = num(b.offset);
  if (!text && offset === 0) return j({ ok: false, error: 'متن پیام خالی است' }, 400);
  const st = await getSettings(db);
  let ids = [];
  if (target.startsWith('room:')) {
    const rid2 = num(target.split(':')[1]);
    const r = await db.prepare("SELECT DISTINCT user_id uid FROM slots WHERE room_id=?1 AND user_id IS NOT NULL ORDER BY uid LIMIT ?2 OFFSET ?3").bind(rid2, BC_BATCH, offset).all();
    ids = (r.results || []).map(x => x.uid);
    const total = await db.prepare("SELECT COUNT(DISTINCT user_id) c FROM slots WHERE room_id=?1 AND user_id IS NOT NULL").bind(rid2).first();
    var totalN = num(total.c);
  } else {
    const r = await db.prepare('SELECT id uid FROM users WHERE banned=0 ORDER BY id LIMIT ?1 OFFSET ?2').bind(BC_BATCH, offset).all();
    ids = (r.results || []).map(x => x.uid);
    const total = await db.prepare('SELECT COUNT(*) c FROM users WHERE banned=0').first();
    var totalN = num(total.c);
  }
  let sent = 0;
  const tgT = tgToken(env, st), blT = baleToken(env, st);
  for (const uid of ids) {
    try {
      const ur = await db.prepare('SELECT telegram_id, bale_id FROM users WHERE id=?1').bind(uid).first();
      if (!ur) continue;
      if (ur.telegram_id) { await sendBot(TG_BASE, tgT, ur.telegram_id, `📢 <b>پیام مدیریت</b>\n\n${esc(text)}`).catch(() => {}); sent++; }
      if (ur.bale_id) { await sendBot(BL_BASE, blT, ur.bale_id, `📢 <b>پیام مدیریت</b>\n\n${esc(text)}`).catch(() => {}); }
    } catch (e) {}
  }
  const done = offset + ids.length;
  return j({ ok: true, sent, total: totalN, remaining: Math.max(0, totalN - done), offset: done });
}

/* ─────────────── API: وب‌هوک ربات‌ها (اتصال سریع) ─────────────── */
async function apiWebhookStatus(db, env, req, origin) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const st = await getSettings(db);
  const tg = await botCall(TG_BASE, tgToken(env, st), 'getWebhookInfo', {});
  const bl = await botCall(BL_BASE, baleToken(env, st), 'getWebhookInfo', {});
  const tgMe = await botCall(TG_BASE, tgToken(env, st), 'getMe', {});
  const blMe = await botCall(BL_BASE, baleToken(env, st), 'getMe', {});
  return j({ ok: true, telegram: { info: tg.result || null, ok: tg.ok, me: tgMe.result || null, connected: !!(tg.result && tg.result.url) }, bale: { info: bl.result || null, ok: bl.ok, me: blMe.result || null, connected: !!(bl.result && bl.result.url) }, expected: { tg: `${origin}/tg/${await whSecret(db)}`, bale: `${origin}/bale/${await whSecret(db)}` } });
}
async function apiWebhookSet(db, env, req, origin) {
  const u = await authUser(db, req);
  if (!u || u.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
  const b = await body(req);
  const platform = String(b.platform || '');
  const st = await getSettings(db);
  const secret = await whSecret(db);
  let r;
  if (platform === 'telegram') {
    const t = tgToken(env, st);
    if (!t) return j({ ok: false, error: 'ابتدا توکن ربات تلگرام را در تنظیمات ثبت کن' }, 400);
    r = await botCall(TG_BASE, t, 'setWebhook', { url: `${origin}/tg/${secret}`, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
  } else if (platform === 'bale') {
    const t = baleToken(env, st);
    if (!t) return j({ ok: false, error: 'ابتدا توکن ربات بله را در تنظیمات ثبت کن' }, 400);
    r = await botCall(BL_BASE, t, 'setWebhook', { url: `${origin}/bale/${secret}` });
  } else return j({ ok: false, error: 'پلتفرم نامعتبر' }, 400);
  return j({ ok: !!r.ok, error: r.ok ? null : (r.description || 'خطای ناشناخته'), result: r.result || null });
}
async function announceNewRoom(db, env, roomId) {
  try {
    const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(roomId).first();
    if (!room) return;
    const st = await getSettings(db);
    const ch = stg(st, 'announce_channel', '');
    const m = MODES[room.mode] || MODES.custom;
    const site = stg(st, 'website_url', '');
    const txt = `🪖 <b>روم جدید باز شد!</b>\n\n${m.emoji} ${esc(room.title)}\n🎮 ${m.fa}\n👥 ظرفیت: ${faNum(room.max_players)} نفر\n💰 ورودی: ${room.entry_fee > 0 ? money(room.entry_fee) + ' تومان' : 'رایگان'}\n${room.prize_pool > 0 ? '🏆 جایزه: ' + money(room.prize_pool) + ' تومان\n' : ''}\n${site ? '🌐 ' + site : ''}`;
    if (ch) {
      const clean = ch.replace('@', '');
      keep(botCall(TG_BASE, tgToken(env, st), 'sendMessage', { chat_id: ch, text: txt, parse_mode: 'HTML' }).catch(() => {}));
      keep(botCall(BL_BASE, baleToken(env, st), 'sendMessage', { chat_id: ch, text: txt, parse_mode: 'HTML' }).catch(() => {}));
    }
    notifyAdmins(db, env, `🆕 روم جدید ساخته شد: <b>${esc(room.title)}</b> (${faNum(room.max_players)} نفر)`);
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════════
   موتور ربات‌ها (تلگرام + بله) — منطق کاملاً مشترک
   ══════════════════════════════════════════════════════════════ */
const BOT_BASE = { tg: TG_BASE, bale: BL_BASE };
function bBase(p) { return p === 'tg' ? TG_BASE : BL_BASE; }
function bToken(env, st, p) { return p === 'tg' ? tgToken(env, st) : baleToken(env, st); }
function bkey(p, chatId) { return p + ':' + chatId; }
function numFa(s) { return String(s || '').replace(/[۰-۹]/g, d => FA_D.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).trim(); }

async function getBState(db, p, chatId) {
  const r = await db.prepare('SELECT data FROM bot_state WHERE key=?1').bind(bkey(p, chatId)).first();
  try { return r && r.data ? JSON.parse(r.data) : null; } catch (e) { return null; }
}
async function setBState(db, p, chatId, obj) {
  if (!obj) { await db.prepare('DELETE FROM bot_state WHERE key=?1').bind(bkey(p, chatId)).run(); return; }
  await db.prepare("INSERT INTO bot_state (key,data,updated_at) VALUES(?1,?2,datetime('now')) ON CONFLICT(key) DO UPDATE SET data=?2, updated_at=datetime('now')").bind(bkey(p, chatId), JSON.stringify(obj)).run();
}
async function findBotUser(db, p, chatId) {
  return db.prepare(p === 'tg' ? 'SELECT * FROM users WHERE telegram_id=?1' : 'SELECT * FROM users WHERE bale_id=?1').bind(String(chatId)).first();
}
async function ensureBotUser(db, env, p, from) {
  const chatId = String(from.id);
  let u = await findBotUser(db, p, chatId);
  const noAdmin = !(await db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first());
  if (!u) {
    let username = 'P' + chatId;
    if (await db.prepare('SELECT id FROM users WHERE LOWER(username)=LOWER(?1)').bind(username).first()) username += '_' + rid(3);
    await db.prepare('INSERT INTO users (username,display_name,' + (p === 'tg' ? 'telegram_id' : 'bale_id') + ',role) VALUES(?1,?2,?3,?4)')
      .bind(username, String(from.first_name || from.username || 'Gamer').slice(0, 60), chatId, noAdmin ? 'admin' : 'user').run();
    u = await findBotUser(db, p, chatId);
    return { user: u, isNew: true, madeAdmin: noAdmin };
  }
  let madeAdmin = false;
  if (env && env.ADMIN_IDS && String(env.ADMIN_IDS).split(',').map(x => x.trim()).includes(chatId) && u.role !== 'admin') {
    await db.prepare("UPDATE users SET role='admin' WHERE id=?1").bind(u.id).run();
    u.role = 'admin'; madeAdmin = true;
  }
  return { user: u, isNew: false, madeAdmin };
}

/* ─────────────── منوها ─────────────── */
function mainKb(u, isAdmin) {
  const kb = [
    [{ text: '🎮 روم‌ها', callback_data: 'm:rooms' }, { text: '👤 حساب من', callback_data: 'm:acc' }],
    [{ text: '🏆 جوایز من', callback_data: 'm:prz' }, { text: '💵 شارژ کیف پول', callback_data: 'm:top' }],
    [{ text: 'ℹ️ راهنما', callback_data: 'm:help' }, { text: '🌐 وبسایت', callback_data: 'm:web' }]
  ];
  if (isAdmin) kb.push([{ text: '🛡 پنل مدیریت', callback_data: 'adm' }]);
  return kb;
}
const HELP_TEXT = `🪖 <b>راهنمای کامل CODM Rooms</b>
━━━━━━━━━━━━━━━━━━
🎮 <b>شرکت در روم‌ها:</b>
۱. «روم‌ها» را بزن و روم موردنظرت را انتخاب کن
۲. یک موقعیت (اسلات) آزاد 🟢 را بزن
۳. روش پرداخت را انتخاب کن (کیف پول / کارت / درگاه)
۴. بعد از تایید پرداخت، جایگاهت قطعی می‌شود

💰 <b>شارژ کیف پول:</b>
مبلغ را انتخاب کن، پرداخت کن و عکس رسید را بفرست (کد پیگیری اختیاری است). بعد از تایید مدیریت، کیف پولت شارژ می‌شود.

👤 <b>حساب من:</b>
مشاهده موجودی، روم‌های ثبت‌نام‌شده، لغو ثبت‌نام (قبل از شروع)، اتصال به سایت و تنظیم رمز سایت.

🔗 <b>اتصال سایت و ربات:</b>
اگر اول در سایت ثبت‌نام کرده‌ای، در سایت وارد شو و در پروفایل، کد اتصال ربات (/link) را وارد کن تا حساب‌ها یکی شوند.

🏆 <b>جوایز:</b>
جوایز برنده‌ها توسط مدیریت تایید و مستقیماً به کیف پول اضافه می‌شود.

⚠️ <b>قوانین:</b>
• بعد از شروع روم، انصراف امکان‌پذیر نیست
• تقلب = حذف دائمی و عدم بازگشت وجه
• رعایت ادب و احترام الزامی است
━━━━━━━━━━━━━━━━━━
🛡 پشتیبانی: @offerspishnahadat_feedbackbot`;

/* ─────────────── نمایش‌ها ─────────────── */
async function showMain(db, env, p, chatId, u) {
  const st = await getSettings(db);
  const site = stg(st, 'website_url', '');
  let t = `${u.role === 'admin' ? '🛡' : '🪖'} <b>سلام ${esc(u.display_name || u.username)}!</b>\n\n${esc(stg(st, 'welcome', 'به پلتفرم روم‌های کالاف دیوتی موبایل خوش آمدی!'))}\n\n💰 موجودی: <b>${money(u.wallet)} تومان</b>`;
  await sendBot(bBase(p), bToken(env, st, p), chatId, t, mainKb(u, u.role === 'admin'));
}
async function showRoomsListBot(db, env, p, chatId, msgId, page, admin) {
  const per = 6;
  const r = await db.prepare(`SELECT r.id, r.title, r.mode, r.entry_fee, r.status,
    (SELECT COUNT(*) FROM slots s WHERE s.room_id=r.id) total,
    (SELECT COUNT(*) FROM slots s WHERE s.room_id=r.id AND s.status='paid') paid
    FROM rooms r WHERE r.status IN ('open','full') ORDER BY r.id DESC LIMIT ?1 OFFSET ?2`).bind(per, page * per).all();
  const list = r.results || [];
  if (!list.length && page === 0) {
    return editOrSend(db, env, p, chatId, msgId, '🎮 فعلاً روم بازی وجود ندارد. منتظر باز شدن روم‌ها باش! ⏳', [[{ text: '🔄 بروزرسانی', callback_data: 'm:rooms' }], [{ text: '🔙 منوی اصلی', callback_data: 'm:main' }]]);
  }
  const totalC = await db.prepare("SELECT COUNT(*) c FROM rooms WHERE status IN ('open','full')").first();
  let t = `🎮 <b>روم‌های فعال</b> (صفحه ${faNum(page + 1)})\n━━━━━━━━━━━━━━━━━━\n`;
  const kb = [];
  for (const rm of list) {
    const m = MODES[rm.mode] || MODES.custom;
    kb.push([{ text: `${m.emoji} ${rm.title.slice(0, 26)} | ${faNum(rm.paid)}/${faNum(rm.total)} | ${rm.entry_fee > 0 ? money(rm.entry_fee) + ' ت' : 'رایگان'}`, callback_data: 'rm:' + rm.id }]);
  }
  const nav = [];
  if (page > 0) nav.push({ text: '▶️ قبلی', callback_data: `rl:p${page - 1}` });
  if ((page + 1) * per < num(totalC.c)) nav.push({ text: 'بعدی ◀️', callback_data: `rl:p${page + 1}` });
  if (nav.length) kb.push(nav);
  kb.push([{ text: '🔄 بروزرسانی', callback_data: 'm:rooms' }, { text: '🔙 منوی اصلی', callback_data: 'm:main' }]);
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
function slotKb(room, slots) {
  const kb = [];
  const byTeam = {};
  for (const s of slots) { (byTeam[s.team_label] = byTeam[s.team_label] || []).push(s); }
  for (const tl of Object.keys(byTeam)) {
    const row = [];
    for (const s of byTeam[tl]) {
      const icon = s.status === 'paid' ? '🔒' : (s.status === 'pending' ? '⏳' : '🟢');
      row.push({ text: `${icon}${faNum(s.slot_no)}`, callback_data: `sl:${room.id}:${s.slot_no}` });
      if (row.length === 5) { kb.push(row); row.length = 0; }
    }
    if (row.length) kb.push(row);
  }
  kb.push([{ text: '🔄 بروزرسانی', callback_data: `rm:${room.id}` }, { text: '🔙 روم‌ها', callback_data: 'm:rooms' }]);
  return kb;
}
async function showRoomBot(db, env, p, chatId, msgId, roomId, u) {
  const rt = await roomText(db, env, roomId, u);
  if (!rt) return editOrSend(db, env, p, chatId, msgId, '❌ روم یافت نشد', [[{ text: '🔙 روم‌ها', callback_data: 'm:rooms' }]]);
  const slots = await db.prepare('SELECT * FROM slots WHERE room_id=?1 ORDER BY slot_no').bind(roomId).all();
  await editOrSend(db, env, p, chatId, msgId, rt.text, slotKb(rt.room, slots.results || []));
}
async function joinMethodKb(db, env, p, chatId, msgId, roomId, slotNo, u) {
  const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(roomId).first();
  if (!room) return;
  const st = await getSettings(db);
  const fee = num(room.entry_fee);
  let t;
  const kb = [];
  if (fee === 0) {
    t = `🎮 <b>${esc(room.title)}</b>\n\n🎯 موقعیت ${faNum(slotNo)} — این روم <b>رایگان</b> است!\n\nبرای ثبت‌نام دکمه زیر را بزن:`;
    kb.push([{ text: '✅ ثبت‌نام رایگان', callback_data: `jf:${roomId}:${slotNo}` }]);
  } else {
    t = `🎮 <b>${esc(room.title)}</b>\n\n🎯 موقعیت ${faNum(slotNo)}\n💰 ورودی: <b>${money(fee)} تومان</b>\n👤 موجودی کیف پولت: ${money(u.wallet)} تومان\n\nروش پرداخت را انتخاب کن:`;
    kb.push([{ text: `💰 پرداخت از کیف پول (${money(fee)} ت)`, callback_data: `jw:${roomId}:${slotNo}` }]);
    if (stg(st, 'card_number', '')) kb.push([{ text: '💳 کارت به کارت', callback_data: `jc:${roomId}:${slotNo}` }]);
    if (stg(st, 'gateway_url', '')) kb.push([{ text: '🏦 پرداخت آنلاین', callback_data: `jo:${roomId}:${slotNo}` }]);
  }
  kb.push([{ text: '🔙 بازگشت به روم', callback_data: `rm:${roomId}` }]);
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
async function showAccount(db, env, p, chatId, msgId, u) {
  const entries = await db.prepare(`SELECT s.slot_no, s.team_label, s.status, r.id rid, r.title, r.status rstatus FROM slots s JOIN rooms r ON r.id=s.room_id WHERE s.user_id=?1 AND s.status IN ('pending','paid') ORDER BY s.id DESC LIMIT 15`).bind(u.id).all();
  let t = `👤 <b>حساب من</b>\n━━━━━━━━━━━━━━━━━━\n🆔 شناسه: <code>${u.id}</code>\n📛 نام کاربری: <code>${esc(u.username)}</code>\n💰 موجودی: <b>${money(u.wallet)} تومان</b>\n🎮 حالت: ${u.telegram_id && u.bale_id ? 'ربات تلگرام + بله' : (u.telegram_id ? 'تلگرام' : 'بله')}\n🌐 سایت: ${u.password_hash ? '✅ رمز تنظیم شده' : '❌ رمز سایت تنظیم نشده'}\n`;
  const list = entries.results || [];
  if (list.length) {
    t += `\n🎮 <b>روم‌های من:</b>\n`;
    for (const e of list) t += `${e.status === 'paid' ? '✅' : '⏳'} ${esc(e.title)} — ${esc(e.team_label)} ${faNum(e.slot_no)} (${ROOM_STATUS[e.rstatus] || ''})\n`;
  } else t += `\n🎮 هنوز در رومی ثبت‌نام نکرده‌ای.`;
  const kb = [];
  for (const e of list) if (e.rstatus === 'open') kb.push([{ text: `↩️ لغو ثبت‌نام ${e.title.slice(0, 22)}`, callback_data: `myc:${e.rid}` }]);
  kb.push([{ text: '💵 شارژ کیف پول', callback_data: 'm:top' }, { text: '🏆 جوایز من', callback_data: 'm:prz' }]);
  kb.push([{ text: '🔗 اتصال به سایت', callback_data: 'm:link' }, { text: '🔑 رمز سایت', callback_data: 'm:pass' }]);
  kb.push([{ text: '🔙 منوی اصلی', callback_data: 'm:main' }]);
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
async function showMyPrizes(db, env, p, chatId, msgId, u) {
  const r = await db.prepare('SELECT * FROM prizes WHERE user_id=?1 ORDER BY id DESC LIMIT 15').bind(u.id).all();
  const list = r.results || [];
  let t = `🏆 <b>جوایز من</b>\n━━━━━━━━━━━━━━━━━━\n`;
  if (!list.length) t += 'هنوز جایزه‌ای نداری. قهرمان باش تا جایزه بگیری! 🔥\n';
  for (const z of list) t += `${z.status === 'approved' ? '✅' : (z.status === 'pending' ? '⏳' : '❌')} ${money(z.amount)} تومان — ${esc(z.note || '')}\n`;
  t += `\n💰 جمع جوایز تاییدشده: <b>${money(list.filter(x => x.status === 'approved').reduce((a, b) => a + num(b.amount), 0))} تومان</b>`;
  await editOrSend(db, env, p, chatId, msgId, t, [[{ text: '🔙 حساب من', callback_data: 'm:acc' }]]);
}
async function showTopupMenu(db, env, p, chatId, msgId, u) {
  const st = await getSettings(db);
  const minT = num(stg(st, 'min_topup', 50000));
  let t = `💵 <b>شارژ کیف پول</b>\n━━━━━━━━━━━━━━━━━━\n👤 موجودی فعلی: <b>${money(u.wallet)} تومان</b>\n⬇️ حداقل شارژ: <b>${money(minT)} تومان</b>\n\nروش پرداخت را انتخاب کن:`;
  const kb = [];
  if (stg(st, 'card_number', '')) kb.push([{ text: '💳 کارت به کارت', callback_data: 'tp:card' }]);
  if (stg(st, 'gateway_url', '')) kb.push([{ text: '🏦 پرداخت آنلاین', callback_data: 'tp:online' }]);
  if (!kb.length) t += '\n⚠️ فعلاً هیچ روش پرداختی توسط مدیریت فعال نشده است.';
  kb.push([{ text: '🔙 حساب من', callback_data: 'm:acc' }]);
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
async function showHelp(db, env, p, chatId, msgId, u) {
  const st = await getSettings(db);
  const sup = stg(st, 'support_bot', '');
  const kb = [[{ text: '🎮 روم‌ها', callback_data: 'm:rooms' }]];
  if (sup) kb.push([{ text: '🛡 پشتیبانی', url: sup }]);
  kb.push([{ text: '🔙 منوی اصلی', callback_data: 'm:main' }]);
  await editOrSend(db, env, p, chatId, msgId, HELP_TEXT, kb);
}
async function showWeb(db, env, p, chatId, msgId) {
  const st = await getSettings(db);
  const site = stg(st, 'website_url', '');
  const shop = stg(st, 'shop_bot', '');
  const offers = stg(st, 'offers_site', '');
  const kb = [];
  if (site) kb.push([{ text: '🌐 وبسایت CODM Rooms', url: site }]);
  if (shop) kb.push([{ text: '🛒 ربات فروشگاه کانال', url: shop }]);
  if (offers) kb.push([{ text: '📣 سایت کانال پیشنهادات', url: offers }]);
  kb.push([{ text: '🔙 منوی اصلی', callback_data: 'm:main' }]);
  await editOrSend(db, env, p, chatId, msgId, site ? `🌐 وبسایت ما:\n${site}` : '🌐 وبسایت هنوز توسط مدیریت تنظیم نشده است.', kb);
}
async function showLinkCode(db, env, p, chatId, msgId, u) {
  /* اگر همین پلتفرم از قبل به حساب سایت متصل است، به‌جای کد بی‌فایده راهنمایی بده */
  const pid = String(p === 'tg' ? (u.telegram_id || '') : (u.bale_id || ''));
  const isBotName = !!pid && (u.username === 'P' + pid || u.username.startsWith('P' + pid + '_'));
  if (u.password_hash && pid && !isBotName) {
    const otherTg = p !== 'tg';
    const otherOk = !!(otherTg ? u.telegram_id : u.bale_id);
    let t = `🔗 <b>حساب ${p === 'tg' ? 'تلگرام' : 'بله'} تو از قبل متصل است!</b>\n━━━━━━━━━━━━━━━━━━\n✅ این پلتفرم هم‌اکنون به حسابت وصل است و نیازی به اتصال دوباره نیست.\n📛 نام کاربری سایت: <code>${esc(u.username)}</code>\n`;
    t += otherOk
      ? '\n🎉 هر دو پلتفرم (تلگرام + بله) به حسابت متصل‌اند — همه‌چیز آماده است!'
      : `\n💡 برای اتصال پلتفرم دیگر، از ربات ${otherTg ? 'تلگرام 📱' : 'بله 💬'} دستور <code>/link</code> را بزن و کد را در «پروفایل» سایت وارد کن.`;
    return editOrSend(db, env, p, chatId, msgId, t, [[{ text: '👤 حساب من', callback_data: 'm:acc' }]]);
  }
  await db.prepare('DELETE FROM link_codes WHERE user_id=?1').bind(u.id).run();
  const code = ('W6W' + rid(6)).toUpperCase();
  await db.prepare("INSERT INTO link_codes (code,user_id,platform,expires_at) VALUES(?1,?2,?3,datetime('now','+15 minutes'))").bind(code, u.id, p).run();
  const t = `🔗 <b>اتصال اکانت ربات به سایت</b>\n━━━━━━━━━━━━━━━━━━\n۱. وارد سایت شو و وارد حسابت شو\n۲. به بخش «پروفایل» برو\n۳. این کد را در قسمت «اتصال ${p === 'tg' ? 'تلگرام' : 'بله'}» وارد کن:\n\n🔑 <code>${code}</code>\n\n⏰ این کد ۱۵ دقیقه اعتبار دارد.\nبا اتصال، موجودی و اطلاعات شما در سایت و ربات یکی می‌شود. ✅`;
  await editOrSend(db, env, p, chatId, msgId, t, [[{ text: '🔙 حساب من', callback_data: 'm:acc' }]]);
}
async function editOrSend(db, env, p, chatId, msgId, text, kb) {
  if (msgId) {
    const r = await editBot(bBase(p), bToken(env, await getSettings(db), p), chatId, msgId, text, kb);
    if (r.ok) return;
  }
  sendBot(bBase(p), bToken(env, await getSettings(db), p), chatId, text, kb);
}

/* ─────────────── هسته عضویت (مشترک سایت + ربات‌ها) ─────────────── */
async function joinCore(db, env, u, roomId, slotNo, method) {
  const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(roomId).first();
  if (!room) return { ok: false, error: 'روم یافت نشد' };
  if (room.status !== 'open') return { ok: false, error: 'این روم در وضعیت فعلی قابل ثبت‌نام نیست' };
  const slot = await db.prepare('SELECT * FROM slots WHERE room_id=?1 AND slot_no=?2').bind(roomId, slotNo).first();
  if (!slot) return { ok: false, error: 'موقعیت یافت نشد' };
  if (slot.status !== 'free') return { ok: false, error: 'این موقعیت قبلاً رزرو شده! موقعیت دیگری انتخاب کن' };
  const mine = await db.prepare("SELECT id FROM slots WHERE room_id=?1 AND user_id=?2 AND status IN ('pending','paid')").bind(roomId, u.id).first();
  if (mine) return { ok: false, error: 'شما قبلاً در این روم ثبت‌نام کرده‌اید' };
  const fee = num(room.entry_fee);
  const st = await getSettings(db);
  method = fee === 0 ? 'free' : method;
  if (fee > 0 && !['wallet', 'card', 'online'].includes(method)) return { ok: false, error: 'روش پرداخت نامعتبر' };
  if (method === 'card' && !stg(st, 'card_number', '')) return { ok: false, error: 'پرداخت کارت‌به‌کارت فعلاً فعال نیست' };
  if (method === 'online' && !stg(st, 'gateway_url', '')) return { ok: false, error: 'درگاه پرداخت فعلاً فعال نیست' };
  if (method === 'free') {
    const upd = await db.prepare("UPDATE slots SET status='paid', user_id=?2 WHERE id=?1 AND status='free'").bind(slot.id, u.id).run();
    if (!upd.meta.changes) return { ok: false, error: 'موقعیت لحظاتی پیش رزرو شد' };
    const pr = await db.prepare("INSERT INTO payments (user_id,room_id,slot_id,amount,method,status,kind) VALUES(?1,?2,?3,0,'free','approved','entry')").bind(u.id, roomId, slot.id).run();
    await db.prepare('UPDATE slots SET payment_id=?2 WHERE id=?1').bind(slot.id, pr.meta.last_row_id).run();
    await checkRoomFull(db, roomId);
    notifyUser(db, env, u.id, `🎮 <b>ثبت‌نام رایگان انجام شد!</b>\n\nروم: <b>${esc(room.title)}</b>\nموقعیت: ${esc(slot.team_label)} / ${faNum(slotNo)}`);
    return { ok: true, status: 'paid', message: 'ثبت‌نام رایگان با موفقیت انجام شد!' };
  }
  if (method === 'wallet') {
    if (num(u.wallet) < fee) return { ok: false, error: `موجودی کیف پول کافی نیست (موجودی: ${money(u.wallet)} تومان)`, need: 'topup' };
    const upd = await db.prepare("UPDATE slots SET status='paid', user_id=?2 WHERE id=?1 AND status='free'").bind(slot.id, u.id).run();
    if (!upd.meta.changes) return { ok: false, error: 'موقعیت لحظاتی پیش رزرو شد' };
    await db.prepare('UPDATE users SET wallet = wallet - ?2 WHERE id=?1').bind(u.id, fee).run();
    const pr = await db.prepare("INSERT INTO payments (user_id,room_id,slot_id,amount,method,status,kind) VALUES(?1,?2,?3,?4,'wallet','approved','entry')").bind(u.id, roomId, slot.id, fee).run();
    await db.prepare('INSERT INTO transactions (user_id,amount,kind,ref) VALUES(?1,?2,?3,?4)').bind(u.id, -fee, 'entry', 'ROOM#' + roomId).run();
    await db.prepare('UPDATE slots SET payment_id=?2 WHERE id=?1').bind(slot.id, pr.meta.last_row_id).run();
    await checkRoomFull(db, roomId);
    let extra = '';
    if (room.room_id && room.room_pass) extra += `\n\n🆔 Room ID: <code>${esc(room.room_id)}</code>\n🔑 Password: <code>${esc(room.room_pass)}</code>`;
    notifyUser(db, env, u.id, `🎮 <b>ثبت‌نام انجام شد!</b>\n\nروم: <b>${esc(room.title)}</b>\nموقعیت: ${esc(slot.team_label)} / ${faNum(slotNo)}\n💳 پرداخت از کیف پول: ${money(fee)} تومان${extra}\n\nموفق باشی قهرمان! 🔥`);
    return { ok: true, status: 'paid', message: 'ثبت‌نام با موفقیت انجام شد!' };
  }
  const upd = await db.prepare("UPDATE slots SET status='pending', user_id=?2 WHERE id=?1 AND status='free'").bind(slot.id, u.id).run();
  if (!upd.meta.changes) return { ok: false, error: 'موقعیت لحظاتی پیش رزرو شد' };
  const pr = await db.prepare("INSERT INTO payments (user_id,room_id,slot_id,amount,method,status,kind) VALUES(?1,?2,?3,?4,?5,'pending','entry')").bind(u.id, roomId, slot.id, fee, method).run();
  await db.prepare('UPDATE slots SET payment_id=?2 WHERE id=?1').bind(slot.id, pr.meta.last_row_id).run();
  notifyAdmins(db, env, `🔔 <b>درخواست ثبت‌نام جدید</b>\n\n👤 ${esc(u.display_name || u.username)}\n🎮 روم: ${esc(room.title)}\n💰 مبلغ: ${money(fee)} تومان\nروش: ${method === 'card' ? 'کارت‌به‌کارت' : 'درگاه'}`);
  const resp = { ok: true, status: 'pending', payment_id: pr.meta.last_row_id, fee, message: 'موقعیت شما موقتاً رزرو شد. پس از تایید پرداخت، قطعی می‌شود.' };
  if (method === 'card') resp.card = { number: stg(st, 'card_number', ''), name: stg(st, 'card_name', ''), bank: stg(st, 'bank_name', '') };
  if (method === 'online') resp.gateway_url = String(stg(st, 'gateway_url', '')).replace('{amount}', String(fee)).replace('{desc}', encodeURIComponent('Room#' + roomId));
  return resp;
}

/* ─────────────── هسته پیام همگانی (مشترک) ─────────────── */
async function bcCore(db, env, text, target, offset) {
  const st = await getSettings(db);
  let ids = [], totalN = 0;
  if (target && target.startsWith('room:')) {
    const rid2 = num(target.split(':')[1]);
    const r = await db.prepare('SELECT DISTINCT user_id uid FROM slots WHERE room_id=?1 AND user_id IS NOT NULL ORDER BY uid LIMIT ?2 OFFSET ?3').bind(rid2, BC_BATCH, offset).all();
    ids = (r.results || []).map(x => x.uid);
    const total = await db.prepare('SELECT COUNT(DISTINCT user_id) c FROM slots WHERE room_id=?1 AND user_id IS NOT NULL').bind(rid2).first();
    totalN = num(total.c);
  } else {
    const r = await db.prepare('SELECT id uid FROM users WHERE banned=0 ORDER BY id LIMIT ?1 OFFSET ?2').bind(BC_BATCH, offset).all();
    ids = (r.results || []).map(x => x.uid);
    const total = await db.prepare('SELECT COUNT(*) c FROM users WHERE banned=0').first();
    totalN = num(total.c);
  }
  let sent = 0;
  const tgT = tgToken(env, st), blT = baleToken(env, st);
  for (const uid of ids) {
    try {
      const ur = await db.prepare('SELECT telegram_id, bale_id FROM users WHERE id=?1').bind(uid).first();
      if (!ur) continue;
      if (ur.telegram_id) { await sendBot(TG_BASE, tgT, ur.telegram_id, `📢 <b>پیام مدیریت</b>\n\n${esc(text)}`).catch(() => {}); sent++; }
      if (ur.bale_id) { await sendBot(BL_BASE, blT, ur.bale_id, `📢 <b>پیام مدیریت</b>\n\n${esc(text)}`).catch(() => {}); }
    } catch (e) {}
  }
  const done = offset + ids.length;
  return { sent, total: totalN, remaining: Math.max(0, totalN - done), offset: done };
}

/* ─────────────── پنل ادمین ربات ─────────────── */
async function showAdminPanel(db, env, p, chatId, msgId) {
  const pendPay = await db.prepare("SELECT COUNT(*) c FROM payments WHERE status='pending'").first();
  const pendPrz = await db.prepare("SELECT COUNT(*) c FROM prizes WHERE status='pending'").first();
  const openR = await db.prepare("SELECT COUNT(*) c FROM rooms WHERE status='open'").first();
  const t = `🛡 <b>پنل مدیریت</b>\n━━━━━━━━━━━━━━━━━━\n🟢 روم‌های باز: ${faNum(openR.c)}\n🔔 پرداخت‌های در انتظار: ${faNum(pendPay.c)}\n🏆 جوایز در انتظار: ${faNum(pendPrz.c)}`;
  await editOrSend(db, env, p, chatId, msgId, t, [
    [{ text: '➕ ساخت روم', callback_data: 'adm:new' }, { text: '🎮 مدیریت روم‌ها', callback_data: 'adm:rooms' }],
    [{ text: `🔔 پرداخت‌ها (${faNum(pendPay.c)})`, callback_data: 'adm:pays' }, { text: `🏆 جوایز (${faNum(pendPrz.c)})`, callback_data: 'adm:przs' }],
    [{ text: '👥 کاربران', callback_data: 'adm:users:p0' }, { text: '📊 آمار کامل', callback_data: 'adm:stats' }],
    [{ text: '📢 پیام همگانی', callback_data: 'adm:bc' }, { text: '⚙️ تنظیمات', callback_data: 'adm:set' }],
    [{ text: '🔗 اتصال وب‌هوک‌ها', callback_data: 'adm:wh' }],
    [{ text: '🔙 منوی اصلی', callback_data: 'm:main' }]
  ]);
}
async function admStatsText(db) {
  const s = await apiStats(db);
  const b = JSON.parse(await s.text());
  return `📊 <b>آمار کامل پلتفرم</b>\n━━━━━━━━━━━━━━━━━━\n👥 کاربران: <b>${money(b.users)}</b> (امروز: ${money(b.todayUsers)})\n🛡 ادمین‌ها: ${money(b.admins)}\n\n🎮 روم‌ها: <b>${money(b.rooms)}</b>\n🟢 باز: ${money(b.openRooms)} | 🔴 در جریان: ${money(b.runningRooms)} | ⚫️ تمام‌شده: ${money(b.finishedRooms)}\n\n🎯 ورودی‌های قطعی: <b>${money(b.entries)}</b>\n💵 درآمد ورودی‌ها: <b>${money(b.revenue)} تومان</b>\n📈 شارژ تاییدشده: ${money(b.topups)} تومان\n🏆 جوایز پرداخت‌شده: ${money(b.prizesPaid)} تومان\n💼 موجودی کل کاربران: ${money(b.walletTotal)} تومان\n\n⏳ در انتظار: ${money(b.pendingPayments)} پرداخت، ${money(b.pendingPrizes)} جایزه`;
}
async function admRoomsList(db, env, p, chatId, msgId) {
  const r = await db.prepare(`SELECT r.*, (SELECT COUNT(*) FROM slots s WHERE s.room_id=r.id AND s.status='paid') paid FROM rooms r ORDER BY r.id DESC LIMIT 15`).all();
  const list = r.results || [];
  const kb = [];
  for (const rm of list) kb.push([{ text: `${ROOM_STATUS[rm.status] || ''} ${rm.title.slice(0, 24)} (${faNum(rm.paid)}/${faNum(rm.max_players)})`, callback_data: 'adm:room:' + rm.id }]);
  if (!list.length) kb.push([{ text: '➕ ساخت اولین روم', callback_data: 'adm:new' }]);
  kb.push([{ text: '➕ ساخت روم', callback_data: 'adm:new' }, { text: '🔙 پنل', callback_data: 'adm' }]);
  await editOrSend(db, env, p, chatId, msgId, '🎮 <b>مدیریت روم‌ها</b>\nروم را انتخاب کن:', kb);
}
async function admRoomView(db, env, p, chatId, msgId, roomId) {
  const rt = await roomText(db, env, roomId, { role: 'admin' });
  if (!rt) return editOrSend(db, env, p, chatId, msgId, '❌ روم یافت نشد', [[{ text: '🔙', callback_data: 'adm:rooms' }]]);
  const kb = [
    [{ text: '🔓 ارسال اطلاعات روم (ID/Pass)', callback_data: `adm:pub:${roomId}` }],
    [{ text: '▶️ شروع روم', callback_data: `adm:start:${roomId}` }, { text: '🏁 پایان', callback_data: `adm:fin:${roomId}` }],
    [{ text: '❌ لغو روم + بازگشت وجوه', callback_data: `adm:cnl:${roomId}` }],
    [{ text: '🗑 حذف کامل روم', callback_data: `adm:del:${roomId}` }],
    [{ text: '🔙 لیست روم‌ها', callback_data: 'adm:rooms' }]
  ];
  const players = await db.prepare("SELECT s.slot_no, s.team_label, u.display_name, u.username FROM slots s LEFT JOIN users u ON u.id=s.user_id WHERE s.room_id=?1 AND s.status='paid' ORDER BY s.slot_no").bind(roomId).all();
  let t = rt.text + `\n━━━━━━━━━━━━━━━━━━\n✅ <b>بازیکنان قطعی:</b>\n`;
  const pl = players.results || [];
  if (!pl.length) t += '— هنوز بازیکنی قطعی نشده\n';
  for (const x of pl) t += `${faNum(x.slot_no)}. ${esc(x.display_name || x.username || '?')}\n`;
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
async function admPaysList(db, env, p, chatId, msgId) {
  const r = await db.prepare(`SELECT p.*, u.username, u.display_name, r.title room_title FROM payments p LEFT JOIN users u ON u.id=p.user_id LEFT JOIN rooms r ON r.id=p.room_id WHERE p.status='pending' ORDER BY p.id LIMIT 20`).all();
  const list = r.results || [];
  let t = `🔔 <b>پرداخت‌های در انتظار تایید</b>\n━━━━━━━━━━━━━━━━━━\n`;
  const kb = [];
  if (!list.length) t += 'همه پرداخت‌ها بررسی شده‌اند. ✅\n';
  for (const x of list) {
    const isTop = x.kind === 'topup';
    t += `#${faNum(x.id)} | ${isTop ? '💰 شارژ' : '🎮 ' + esc(x.room_title || '')} | ${esc(x.display_name || x.username)} | ${money(x.amount)} ت | ${x.method === 'card' ? '💳' : (x.method === 'online' ? '🏦' : '💼')}${x.ref_code ? ' | 🧾 ' + esc(x.ref_code) : ''}${x.proof_file_id ? ' | 📸 عکس' : ' | ⚠️ بدون عکس'}\n`;
    if (x.proof_file_id) kb.push([{ text: `✅ #${x.id}`, callback_data: `adm:ok:${x.id}` }, { text: `❌ #${x.id}`, callback_data: `adm:no:${x.id}` }, { text: '📸 دیدن رسید', callback_data: `adm:pr:${x.id}` }]);
    else kb.push([{ text: `✅ #${x.id}`, callback_data: `adm:ok:${x.id}` }, { text: `❌ #${x.id}`, callback_data: `adm:no:${x.id}` }]);
  }
  kb.push([{ text: '🔙 پنل', callback_data: 'adm' }]);
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
async function admPrzsList(db, env, p, chatId, msgId) {
  const r = await db.prepare(`SELECT z.*, u.username, u.display_name FROM prizes z LEFT JOIN users u ON u.id=z.user_id WHERE z.status='pending' ORDER BY z.id LIMIT 20`).all();
  const list = r.results || [];
  let t = `🏆 <b>جوایز در انتظار تایید</b>\n━━━━━━━━━━━━━━━━━━\n`;
  const kb = [];
  if (!list.length) t += 'جایزه در انتظاری نیست. ✅\n';
  for (const x of list) {
    t += `#${faNum(x.id)} | ${esc(x.display_name || x.username)} | ${money(x.amount)} ت | ${esc(x.note || '')}\n`;
    kb.push([{ text: `✅ #${x.id}`, callback_data: `adm:pok:${x.id}` }, { text: `❌ #${x.id}`, callback_data: `adm:pno:${x.id}` }]);
  }
  kb.push([{ text: '➕ جایزه جدید', callback_data: 'adm:prznew' }, { text: '🔙 پنل', callback_data: 'adm' }]);
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
async function admUsersList(db, env, p, chatId, msgId, page) {
  const per = 8;
  const r = await db.prepare('SELECT id, username, display_name, role, wallet, banned FROM users ORDER BY id DESC LIMIT ?1 OFFSET ?2').bind(per, page * per).all();
  const total = await db.prepare('SELECT COUNT(*) c FROM users').first();
  const kb = [];
  for (const x of (r.results || [])) {
    kb.push([{ text: `${x.banned ? '⛔️' : (x.role === 'admin' ? '🛡' : '👤')} ${String(x.display_name || x.username).slice(0, 16)} | ${money(x.wallet)} ت`, callback_data: `adm:u:${x.id}` }]);
  }
  const nav = [];
  if (page > 0) nav.push({ text: '▶️', callback_data: `adm:users:p${page - 1}` });
  if ((page + 1) * per < num(total.c)) nav.push({ text: '◀️', callback_data: `adm:users:p${page + 1}` });
  if (nav.length) kb.push(nav);
  kb.push([{ text: '🔙 پنل', callback_data: 'adm' }]);
  await editOrSend(db, env, p, chatId, msgId, `👥 <b>کاربران</b> (صفحه ${faNum(page + 1)} — جمع: ${money(total.c)})`, kb);
}
async function admUserCard(db, env, p, chatId, msgId, uid) {
  const x = await db.prepare('SELECT * FROM users WHERE id=?1').bind(uid).first();
  if (!x) return;
  const ent = await db.prepare("SELECT COUNT(*) c FROM slots WHERE user_id=?1 AND status='paid'").bind(uid).first();
  const t = `👤 <b>کاربر #${faNum(x.id)}</b>\n━━━━━━━━━━━━━━━━━━\n📛 ${esc(x.display_name || '')} (@${esc(x.username)})\n💰 موجودی: <b>${money(x.wallet)} تومان</b>\n🎮 ورودی‌ها: ${faNum(ent.c)}\n📱 تلگرام: ${x.telegram_id ? esc(x.telegram_id) : '—'}\n💬 بله: ${x.bale_id ? esc(x.bale_id) : '—'}\n🎮 آیدی کالاف: ${esc(x.codm_id || '—')}\n🗓 عضویت: ${esc(x.created_at)}\nوضعیت: ${x.banned ? '⛔️ مسدود' : '✅ فعال'} | نقش: ${x.role === 'admin' ? '🛡 ادمین' : '👤 کاربر'}`;
  const kb = [
    [{ text: x.role === 'admin' ? '👤 برداشتن ادمین' : '🛡 ادمین کن', callback_data: `adm:mk:${x.id}` }],
    [{ text: x.banned ? '✅ رفع مسدودی' : '⛔️ مسدودسازی', callback_data: `adm:ban:${x.id}` }],
    [{ text: '🏆 دادن جایزه', callback_data: `adm:przu:${x.id}` }],
    [{ text: '🔙 کاربران', callback_data: 'adm:users:p0' }]
  ];
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
async function admSettingsView(db, env, p, chatId, msgId) {
  const st = await getSettings(db);
  const mask = (v) => v ? (String(v).length > 12 ? String(v).slice(0, 6) + '•••' + String(v).slice(-4) : String(v)) : '—';
  const t = `⚙️ <b>تنظیمات</b>\n━━━━━━━━━━━━━━━━━━\n🤖 توکن تلگرام: ${mask(st.tg_token)}\n🤖 توکن بله: ${mask(st.bale_token)}\n💳 کارت: ${stg(st, 'card_number', '') || '—'}\n🏦 درگاه: ${stg(st, 'gateway_url', '') || '—'}\n🌐 سایت: ${stg(st, 'website_url', '') || '—'}\n📣 کانال اعلان: ${stg(st, 'announce_channel', '') || '—'}\n⬇️ حداقل شارژ: ${money(stg(st, 'min_topup', 50000))} تومان\n\nبرای تغییر، روی هر مورد بزن:`;
  const kb = [
    [{ text: '🤖 توکن تلگرام', callback_data: 'set:tg_token' }, { text: '🤖 توکن بله', callback_data: 'set:bale_token' }],
    [{ text: '💳 شماره کارت', callback_data: 'set:card_number' }, { text: '👤 نام صاحب کارت', callback_data: 'set:card_name' }],
    [{ text: '🏦 درگاه پرداخت', callback_data: 'set:gateway_url' }, { text: '🌐 آدرس سایت', callback_data: 'set:website_url' }],
    [{ text: '📣 کانال اعلان روم', callback_data: 'set:announce_channel' }, { text: '⬇️ حداقل شارژ', callback_data: 'set:min_topup' }],
    [{ text: '🛡 بات پشتیبانی', callback_data: 'set:support_bot' }, { text: '🛒 بات فروشگاه', callback_data: 'set:shop_bot' }],
    [{ text: '🔙 پنل', callback_data: 'adm' }]
  ];
  await editOrSend(db, env, p, chatId, msgId, t, kb);
}
const SET_LABELS = { tg_token: 'توکن ربات تلگرام', bale_token: 'توکن ربات بله', card_number: 'شماره کارت', card_name: 'نام صاحب کارت', bank_name: 'نام بانک', gateway_url: 'آدرس درگاه (شامل {amount})', website_url: 'آدرس وبسایت', announce_channel: 'آیدی/آیدی عددی کانال اعلان', min_topup: 'حداقل شارژ (تومان)', support_bot: 'لینک بات پشتیبانی', shop_bot: 'لینک بات فروشگاه', offers_site: 'سایت پیشنهادات', offers_page: 'صفحه پیشنهادات', channel_link: 'لینک کانال', welcome: 'متن خوش‌آمد' };

/* ─────────────── هسته انصراف از روم (مشترک) ─────────────── */
async function leaveCore(db, env, u, roomId) {
  const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(roomId).first();
  if (!room) return { ok: false, error: 'روم یافت نشد' };
  if (room.status !== 'open') return { ok: false, error: 'روم شروع شده و امکان انصراف نیست' };
  const slot = await db.prepare("SELECT * FROM slots WHERE room_id=?1 AND user_id=?2 AND status IN ('pending','paid')").bind(roomId, u.id).first();
  if (!slot) return { ok: false, error: 'شما در این روم ثبت‌نام نکرده‌اید' };
  let refunded = false;
  if (slot.payment_id) {
    const pay = await db.prepare('SELECT * FROM payments WHERE id=?1').bind(slot.payment_id).first();
    if (pay && pay.status === 'pending') await db.prepare("UPDATE payments SET status='rejected', handled_at=datetime('now') WHERE id=?1").bind(pay.id).run();
    else if (pay && pay.status === 'approved' && num(pay.amount) > 0) {
      await db.prepare('UPDATE users SET wallet = wallet + ?2 WHERE id=?1').bind(u.id, num(pay.amount)).run();
      await db.prepare('INSERT INTO transactions (user_id,amount,kind,ref) VALUES(?1,?2,?3,?4)').bind(u.id, num(pay.amount), 'refund', 'ROOM#' + roomId).run();
      refunded = true;
    }
  }
  await db.prepare("UPDATE slots SET status='free', user_id=NULL, payment_id=NULL WHERE id=?1").bind(slot.id).run();
  await db.prepare("UPDATE rooms SET status='open' WHERE id=?1 AND status='full'").bind(roomId).run();
  notifyUser(db, env, u.id, `↩️ انصراف شما از روم <b>${esc(room.title)}</b> ثبت شد.\n${refunded ? 'مبلغ پرداختی به کیف پولت برگشت داده شد. 💰' : ''}`);
  return { ok: true, refunded };
}

/* ─────────────── هندلر کال‌بک‌های ربات ─────────────── */
async function handleCallback(db, env, p, cb) {
  let answered = false;
  let st0 = {};
  try { st0 = await getSettings(db); } catch (e) {}
  const ans = (extra) => { if (answered) return; answered = true; try { keep(botCall(bBase(p), bToken(env, st0, p), 'answerCallbackQuery', Object.assign({ callback_query_id: cb.id }, extra || {})).catch(() => {})); } catch (e) {} };
  try { await cbDispatch(db, env, p, cb, ans, st0); } catch (e) { try { console.error('CODM cb err:', e && e.stack || e); } catch (e2) {} try { ans(); } catch (e2) {} }
  ans();
}
async function cbDispatch(db, env, p, cb, ans, st0) {
  const chatId = String(cb.message && cb.message.chat ? cb.message.chat.id : cb.from.id);
  const msgId = cb.message ? cb.message.message_id : null;
  const data = String(cb.data || '');
  const { user } = await ensureBotUser(db, env, p, cb.from);
  if (user.banned) return;
  const isAdmin = user.role === 'admin';

  if (data === 'noop') return;
  if (data === 'm:main') { await setBState(db, p, chatId, null); const st = await getSettings(db); return editOrSend(db, env, p, chatId, msgId, `${user.role === 'admin' ? '🛡' : '🪖'} <b>سلام ${esc(user.display_name || user.username)}!</b>\n\n${esc(stg(st, 'welcome', 'به پلتفرم روم‌های کالاف دیوتی موبایل خوش آمدی!'))}\n\n💰 موجودی: <b>${money(user.wallet)} تومان</b>`, mainKb(user, isAdmin)); }
  if (data === 'm:rooms') { await setBState(db, p, chatId, null); return showRoomsListBot(db, env, p, chatId, msgId, 0); }
  if (data.startsWith('rl:p')) return showRoomsListBot(db, env, p, chatId, msgId, num(data.slice(4)));
  if (data === 'm:acc') return showAccount(db, env, p, chatId, msgId, user);
  if (data === 'm:prz') return showMyPrizes(db, env, p, chatId, msgId, user);
  if (data === 'm:top') return showTopupMenu(db, env, p, chatId, msgId, user);
  if (data === 'm:help') return showHelp(db, env, p, chatId, msgId, user);
  if (data === 'm:web') return showWeb(db, env, p, chatId, msgId);
  if (data === 'm:link') return showLinkCode(db, env, p, chatId, msgId, user);
  if (data === 'm:pass') { await setBState(db, p, chatId, { flow: 'pass', data: {} }); return editOrSend(db, env, p, chatId, msgId, `🔑 <b>تنظیم رمز ورود به سایت</b>\n\nیک رمز عبور (حداقل ۴ کاراکتر) بفرست تا با آن بتوانی با نام کاربری <code>${esc(user.username)}</code> وارد سایت شوی.\n\nبرای لغو /cancel را بزن.`, [[{ text: '❌ لغو', callback_data: 'm:acc' }]]); }
  if (data.startsWith('rm:')) return showRoomBot(db, env, p, chatId, msgId, num(data.slice(3)), user);
  if (data.startsWith('sl:')) {
    const [, ridS, snS] = data.split(':');
    const slot = await db.prepare('SELECT * FROM slots WHERE room_id=?1 AND slot_no=?2').bind(num(ridS), num(snS)).first();
    if (!slot) return;
    if (slot.status === 'free') return joinMethodKb(db, env, p, chatId, msgId, num(ridS), num(snS), user);
    if (slot.user_id === user.id) return editOrSend(db, env, p, chatId, msgId, `🎯 موقعیت ${faNum(slot.slot_no)} مال خودت است.\nوضعیت: ${slot.status === 'paid' ? '✅ قطعی' : '⏳ در انتظار تایید پرداخت'}`, [[{ text: '↩️ لغو ثبت‌نام', callback_data: `myc:${ridS}` }], [{ text: '🔙 بازگشت', callback_data: `rm:${ridS}` }]]);
    return ans({ text: slot.status === 'pending' ? '⏳ در انتظار تایید پرداخت' : '🔒 این موقعیت رزرو شده است', show_alert: true });
  }
  if (data.startsWith('jf:') || data.startsWith('jw:')) {
    const [act, ridS, snS] = data.split(':');
    const r = await joinCore(db, env, user, num(ridS), num(snS), act === 'jf' ? 'free' : 'wallet');
    if (!r.ok) return editOrSend(db, env, p, chatId, msgId, `❌ ${r.error}`, r.need === 'topup' ? [[{ text: '💵 شارژ کیف پول', callback_data: 'm:top' }], [{ text: '🔙 بازگشت', callback_data: `rm:${ridS}` }]] : [[{ text: '🔙 بازگشت', callback_data: `rm:${ridS}` }]]);
    return showRoomBot(db, env, p, chatId, msgId, num(ridS), user);
  }
  if (data.startsWith('jc:') || data.startsWith('jo:')) {
    const [act, ridS, snS] = data.split(':');
    const r = await joinCore(db, env, user, num(ridS), num(snS), act === 'jc' ? 'card' : 'online');
    if (!r.ok) return editOrSend(db, env, p, chatId, msgId, `❌ ${r.error}`, [[{ text: '🔙 بازگشت', callback_data: `rm:${ridS}` }]]);
    await setBState(db, p, chatId, { flow: 'receipt', data: { payment_id: r.payment_id, room: num(ridS) } });
    const kb = [[{ text: '🔙 بازگشت به روم', callback_data: `rm:${ridS}` }]];
    if (act === 'jc') {
      const c = r.card || {};
      var t = `💳 <b>پرداخت کارت به کارت</b>\n━━━━━━━━━━━━━━━━━━\n🏦 بانک: ${esc(c.bank) || '—'}\n🔢 شماره کارت:\n<code>${esc(c.number)}</code>\n👤 به نام: ${esc(c.name) || '—'}\n💰 مبلغ: <b>${money(r.fee)} تومان</b>\n\n⚠️ مبلغ را دقیقاً ${money(r.fee)} تومان واریز کن.\n📸 سپس <b>عکس رسید</b> را همین‌جا بفرست (الزامی).\n🧾 کد پیگیری اختیاری است — می‌توانی در کپشن عکس بنویسی.`;
    } else {
      var t = `🏦 <b>پرداخت آنلاین</b>\n\nبا دکمه زیر به درگاه برو و پرداخت کن، سپس <b>عکس رسید</b> را همین‌جا بفرست (الزامی).\n🧾 کد پیگیری اختیاری است — در کپشن عکس یا جداگانه.`;
      kb.unshift([{ text: '🏦 رفتن به درگاه پرداخت', url: r.gateway_url }]);
    }
    return editOrSend(db, env, p, chatId, msgId, t, kb);
  }
  if (data.startsWith('myc:')) return editOrSend(db, env, p, chatId, msgId, '↔️ مطمئنی می‌خوای لغو کنی؟ اگر پرداخت کرده باشی، پولت به کیف پولت برمی‌گردد.', [[{ text: '✅ بله، لغو کن', callback_data: `mycy:${data.slice(4)}` }], [{ text: '❌ نه', callback_data: 'm:acc' }]]);
  if (data.startsWith('mycy:')) {
    const r = await leaveCore(db, env, user, num(data.slice(5)));
    return editOrSend(db, env, p, chatId, msgId, r.ok ? '✅ ثبت‌نامت لغو شد.' : `❌ ${r.error}`, [[{ text: '🔙 حساب من', callback_data: 'm:acc' }]]);
  }
  if (data.startsWith('tp:')) {
    const method = data.slice(3);
    await setBState(db, p, chatId, { flow: 'topamount', data: { method } });
    const minT = num(stg(await getSettings(db), 'min_topup', 50000));
    return editOrSend(db, env, p, chatId, msgId, `💵 <b>شارژ کیف پول</b> (${method === 'card' ? 'کارت به کارت' : 'پرداخت آنلاین'})\n\n💰 مبلغ موردنظرت را بفرست (تومان).\n⬇️ حداقل: <b>${money(minT)} تومان</b>\n\nبرای لغو /cancel را بزن.`, [[{ text: '❌ لغو', callback_data: 'm:top' }]]);
  }
  /* ── ادمین ── */
  if (!isAdmin) return;
  if (data === 'adm') return showAdminPanel(db, env, p, chatId, msgId);
  if (data === 'adm:stats') return editOrSend(db, env, p, chatId, msgId, await admStatsText(db), [[{ text: '🔙 پنل', callback_data: 'adm' }]]);
  if (data === 'adm:rooms') return admRoomsList(db, env, p, chatId, msgId);
  if (data.startsWith('adm:room:')) return admRoomView(db, env, p, chatId, msgId, num(data.slice(9)));
  if (data === 'adm:pays') return admPaysList(db, env, p, chatId, msgId);
  if (data === 'adm:przs') return admPrzsList(db, env, p, chatId, msgId);
  if (data.startsWith('adm:users:p')) return admUsersList(db, env, p, chatId, msgId, num(data.slice(11)));
  if (data.startsWith('adm:u:')) return admUserCard(db, env, p, chatId, msgId, num(data.slice(6)));
  if (data.startsWith('adm:mk:')) {
    const uid = num(data.slice(7));
    const tu = await db.prepare('SELECT role FROM users WHERE id=?1').bind(uid).first();
    if (!tu) return;
    if (uid === user.id) return editOrSend(db, env, p, chatId, msgId, '⚠️ تغییر نقش خودت مجاز نیست.', [[{ text: '🔙', callback_data: `adm:u:${uid}` }]]);
    await db.prepare('UPDATE users SET role=?2 WHERE id=?1').bind(uid, tu.role === 'admin' ? 'user' : 'admin').run();
    return admUserCard(db, env, p, chatId, msgId, uid);
  }
  if (data.startsWith('adm:ban:')) {
    const uid = num(data.slice(8));
    if (uid === user.id) return editOrSend(db, env, p, chatId, msgId, '⚠️ مسدودسازی خودت مجاز نیست.', [[{ text: '🔙', callback_data: `adm:u:${uid}` }]]);
    const tu = await db.prepare('SELECT banned FROM users WHERE id=?1').bind(uid).first();
    if (!tu) return;
    await db.prepare('UPDATE users SET banned=?2 WHERE id=?1').bind(uid, tu.banned ? 0 : 1).run();
    return admUserCard(db, env, p, chatId, msgId, uid);
  }
  if (data === 'adm:new') { await setBState(db, p, chatId, { flow: 'nr', step: 1, data: {} }); return editOrSend(db, env, p, chatId, msgId, `➕ <b>ساخت روم جدید</b> (۱/۹)\n\n📝 <b>عنوان روم را بفرست</b>\nمثال: <code>جام قهرمانان شبانه — فینال</code>\n\nبرای لغو /cancel را بزن.`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
  if (data.startsWith('nrmode:')) {
    const s = await getBState(db, p, chatId);
    if (!s || s.flow !== 'nr') return;
    s.data.mode = data.slice(7); s.step = 3;
    await setBState(db, p, chatId, s);
    return editOrSend(db, env, p, chatId, msgId, `➕ <b>ساخت روم</b> (۳/۹)\n\n👥 <b>تعداد تیم‌ها را بفرست</b> (عدد)\nمثال: <code>2</code> برای دو تیم`, [[{ text: '❌ لغو', callback_data: 'adm' }]]);
  }
  if (data === 'nr:ok') {
    const s = await getBState(db, p, chatId);
    if (!s || s.flow !== 'nr') return;
    const d = s.data;
    const roomId = await createRoom(db, env, d, user.id);
    await setBState(db, p, chatId, null);
    await announceNewRoom(db, env, roomId);
    return admRoomView(db, env, p, chatId, msgId, roomId);
  }
  if (data.startsWith('adm:pub:')) {
    const roomId = num(data.slice(8));
    await setBState(db, p, chatId, { flow: 'pub', data: { roomId } });
    return editOrSend(db, env, p, chatId, msgId, `🔓 <b>ارسال اطلاعات روم به بازیکنان</b>\n\n🆔 Room ID و 🔑 رمز را در یک پیام بفرست:\nمثال: <code>12345678 9101</code> یا <code>ABC123 | XYZ9</code>\n\n⚠️ این اطلاعات برای همه بازیکنان قطعی ارسال می‌شود.`, [[{ text: '❌ لغو', callback_data: `adm:room:${roomId}` }]]);
  }
  if (data.startsWith('adm:start:')) {
    const roomId = num(data.slice(10));
    await db.prepare("UPDATE rooms SET status='running' WHERE id=?1").bind(roomId).run();
    const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(roomId).first();
    const pl = await db.prepare("SELECT DISTINCT user_id uid FROM slots WHERE room_id=?1 AND status='paid' AND user_id IS NOT NULL").bind(roomId).all();
    for (const x of (pl.results || [])) notifyUser(db, env, x.uid, `🔴 <b>روم «${esc(room.title)}» شروع شد!</b>\n${room.room_id ? '🆔 ' + esc(room.room_id) + (room.room_pass ? '\n🔑 ' + esc(room.room_pass) : '') : 'اطلاعات روم به‌زودی ارسال می‌شود.'}\nموفق باشی! 🔥`);
    return admRoomView(db, env, p, chatId, msgId, roomId);
  }
  if (data.startsWith('adm:fin:')) {
    await db.prepare("UPDATE rooms SET status='finished' WHERE id=?1").bind(num(data.slice(8))).run();
    return admRoomView(db, env, p, chatId, msgId, num(data.slice(8)));
  }
  if (data.startsWith('adm:cnl:')) {
    const roomId = num(data.slice(8));
    const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(roomId).first();
    if (room && room.status !== 'cancelled') {
      const paid = await db.prepare("SELECT s.user_id uid, COALESCE(p.amount,0) amt FROM slots s LEFT JOIN payments p ON p.id=s.payment_id WHERE s.room_id=?1 AND s.status='paid' AND s.user_id IS NOT NULL").bind(roomId).all();
      for (const x of (paid.results || [])) {
        if (num(x.amt) > 0) {
          await db.prepare('UPDATE users SET wallet = wallet + ?2 WHERE id=?1').bind(x.uid, num(x.amt)).run();
          await db.prepare('INSERT INTO transactions (user_id,amount,kind,ref) VALUES(?1,?2,?3,?4)').bind(x.uid, num(x.amt), 'refund', 'ROOM#' + roomId).run();
        }
        notifyUser(db, env, x.uid, `❌ روم <b>${esc(room.title)}</b> لغو شد.\n💰 ورودی ${money(x.amt)} تومان به کیف پولت برگشت داده شد.`);
      }
      await db.prepare("UPDATE payments SET status='rejected', handled_at=datetime('now') WHERE room_id=?1 AND status='pending'").bind(roomId).run();
      await db.prepare("UPDATE slots SET status='free', user_id=NULL, payment_id=NULL WHERE room_id=?1").bind(roomId).run();
    }
    await db.prepare("UPDATE rooms SET status='cancelled' WHERE id=?1").bind(roomId).run();
    return admRoomView(db, env, p, chatId, msgId, roomId);
  }
  if (data.startsWith('adm:del:')) return editOrSend(db, env, p, chatId, msgId, '🗑 مطمئنی؟ روم برای همیشه حذف می‌شود.', [[{ text: '🗑 بله حذف کن', callback_data: `adm:dely:${data.slice(8)}` }], [{ text: '❌ نه', callback_data: `adm:room:${data.slice(8)}` }]]);
  if (data.startsWith('adm:dely:')) {
    const roomId = num(data.slice(9));
    await db.batch([db.prepare('DELETE FROM slots WHERE room_id=?1').bind(roomId), db.prepare('DELETE FROM rooms WHERE id=?1').bind(roomId)]);
    return admRoomsList(db, env, p, chatId, msgId);
  }
  if (data.startsWith('adm:pr:')) {
    const pay = await db.prepare('SELECT * FROM payments WHERE id=?1').bind(num(data.slice(7))).first();
    if (!pay || !pay.proof_file_id) return editOrSend(db, env, p, chatId, msgId, '⚠️ عکسی برای این پرداخت ثبت نشده است.', [[{ text: '🔙 پرداخت‌ها', callback_data: 'adm:pays' }]]);
    if (pay.proof_platform !== p) return editOrSend(db, env, p, chatId, msgId, `⚠️ این رسید در ربات ${pay.proof_platform === 'tg' ? 'تلگرام' : 'بله'} فرستاده شده است. از همان ربات بررسی کن.`, [[{ text: '🔙 پرداخت‌ها', callback_data: 'adm:pays' }]]);
    return sendBotPhoto(bBase(p), bToken(env, await getSettings(db), p), chatId, pay.proof_file_id, `🧾 رسید پرداخت #${faNum(pay.id)} | ${money(pay.amount)} تومان${pay.ref_code ? '\n🆔 کد پیگیری: ' + esc(pay.ref_code) : ''}`, [[{ text: '✅ تایید', callback_data: `adm:ok:${pay.id}` }, { text: '❌ رد', callback_data: `adm:no:${pay.id}` }]]);
  }
  if (data.startsWith('adm:ok:')) {
    const r = await approvePayment(db, env, num(data.slice(7)), user.id);
    return editOrSend(db, env, p, chatId, msgId, r.ok ? (r.kind === 'topup' ? '✅ شارژ کیف پول تایید و اعمال شد.' : '✅ پرداخت تایید و جایگاه بازیکن قطعی شد.') : `⚠️ ${r.error}`, [[{ text: '🔙 پرداخت‌ها', callback_data: 'adm:pays' }]]);
  }
  if (data.startsWith('adm:no:')) {
    const r = await rejectPayment(db, env, num(data.slice(7)), user.id);
    return editOrSend(db, env, p, chatId, msgId, r.ok ? '❌ پرداخت رد شد و کاربر مطلع گردید.' : `⚠️ ${r.error}`, [[{ text: '🔙 پرداخت‌ها', callback_data: 'adm:pays' }]]);
  }
  if (data.startsWith('adm:pok:')) {
    const r = await approvePrize(db, env, num(data.slice(8)), user.id);
    return editOrSend(db, env, p, chatId, msgId, r.ok ? '🏆 جایزه تایید و به کیف پول کاربر اضافه شد.' : `⚠️ ${r.error}`, [[{ text: '🔙 جوایز', callback_data: 'adm:przs' }]]);
  }
  if (data.startsWith('adm:pno:')) {
    const pid = num(data.slice(8));
    await db.prepare("UPDATE prizes SET status='rejected', handled_at=datetime('now') WHERE id=?1 AND status='pending'").bind(pid).run();
    return editOrSend(db, env, p, chatId, msgId, '❌ جایزه رد شد.', [[{ text: '🔙 جوایز', callback_data: 'adm:przs' }]]);
  }
  if (data === 'adm:prznew') { await setBState(db, p, chatId, { flow: 'prz', step: 1, data: {} }); return editOrSend(db, env, p, chatId, msgId, `🏆 <b>دادن جایزه</b> (۱/۳)\n\n🆔 نام کاربری یا شناسه عددی کاربر را بفرست:`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
  if (data.startsWith('adm:przu:')) {
    const uid = num(data.slice(9));
    const tu = await db.prepare('SELECT username, display_name FROM users WHERE id=?1').bind(uid).first();
    if (!tu) return;
    await setBState(db, p, chatId, { flow: 'prz', step: 2, data: { userId: uid, name: tu.display_name || tu.username } });
    return editOrSend(db, env, p, chatId, msgId, `🏆 <b>جایزه برای ${esc(tu.display_name || tu.username)}</b> (۲/۳)\n\n💰 مبلغ جایزه را بفرست (تومان):`, [[{ text: '❌ لغو', callback_data: `adm:u:${uid}` }]]);
  }
  if (data === 'prz:ok') {
    const s = await getBState(db, p, chatId);
    if (!s || s.flow !== 'prz') return;
    const d = s.data;
    await db.prepare("INSERT INTO prizes (user_id,amount,note,status,created_by,handled_at) VALUES(?1,?2,?3,'approved',?4,datetime('now'))").bind(d.userId, num(d.amount), String(d.note || ''), user.id).run();
    const pid = await db.prepare('SELECT id FROM prizes WHERE user_id=?1 ORDER BY id DESC LIMIT 1').bind(d.userId).first();
    await approvePrize(db, env, pid.id, user.id);
    await setBState(db, p, chatId, null);
    return editOrSend(db, env, p, chatId, msgId, `✅ جایزه ${money(d.amount)} تومانی به کیف پول ${esc(d.name)} اضافه و کاربر مطلع شد.`, [[{ text: '🔙 پنل', callback_data: 'adm' }]]);
  }
  if (data === 'adm:bc') { await setBState(db, p, chatId, { flow: 'bc', data: {} }); return editOrSend(db, env, p, chatId, msgId, `📢 <b>پیام همگانی</b>\n\nمتن پیام را بفرست (برای همه کاربران ارسال می‌شود):\n\nبرای لغو /cancel را بزن.`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
  if (data.startsWith('bcgo:')) {
    const s = await getBState(db, p, chatId);
    if (!s || s.flow !== 'bc' || !s.data.text) return;
    const r = await bcCore(db, env, s.data.text, null, num(data.slice(5)));
    if (r.remaining > 0) {
      await setBState(db, p, chatId, s);
      return editOrSend(db, env, p, chatId, msgId, `📤 ${money(r.sent)} پیام ارسال شد...\n📊 پیشرفت: ${money(r.offset)}/${money(r.total)}\n⏳ باقی‌مانده: ${money(r.remaining)}`, [[{ text: '▶️ ادامه ارسال', callback_data: `bcgo:${r.offset}` }], [{ text: '⏹ توقف', callback_data: 'adm' }]]);
    }
    await setBState(db, p, chatId, null);
    return editOrSend(db, env, p, chatId, msgId, `✅ پیام همگانی کامل ارسال شد!\n📤 جمع ارسال: ${money(r.total)} کاربر`, [[{ text: '🔙 پنل', callback_data: 'adm' }]]);
  }
  if (data.startsWith('set:')) {
    const key = data.slice(4);
    if (!SET_LABELS[key]) return;
    await setBState(db, p, chatId, { flow: 'set', data: { key } });
    return editOrSend(db, env, p, chatId, msgId, `⚙️ <b>تغییر ${SET_LABELS[key]}</b>\n\nمقدار جدید را بفرست:\n(برای خالی کردن، کلمه <code>حذف</code> را بفرست)`, [[{ text: '❌ لغو', callback_data: 'adm:set' }]]);
  }
  if (data === 'adm:set') return admSettingsView(db, env, p, chatId, msgId);
  if (data === 'adm:wh') {
    const st = await getSettings(db);
    let t = '🔗 <b>اتصال وب‌هوک‌ها</b>\n━━━━━━━━━━━━━━━━━━\n';
    t += 'برای اتصال سریع، از دکمه «اتصال خودکار وب‌هوک‌ها» در پنل وب سایت استفاده کن:\n\n';
    const tgT = tgToken(env, st), blT = baleToken(env, st);
    if (tgT) t += `📱 تلگرام: توکن ثبت شده ✅\n`;
    if (blT) t += `💬 بله: توکن ثبت شده ✅\n`;
    t += '\n⚠️ توجه: هیچ‌وقت setWebhook را با آدرس خالی نزنید چون اتصال ربات قطع می‌شود.';
    return editOrSend(db, env, p, chatId, msgId, t, [[{ text: '🔙 پنل', callback_data: 'adm' }]]);
  }
}

/* ثبت عکس رسید پرداخت (الزامی) — کد پیگیری از کپشن عکس اختیاری است */
async function handlePayProof(db, env, p, chatId, user, s, msg) {
  const T = bToken(env, await getSettings(db), p);
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const cap = String(msg.caption || '').trim().slice(0, 60);
  let pid = num(s.data.payment_id);
  if (!pid && s.flow === 'topref') {
    /* شارژ کیف پول: پرداخت هنوز ساخته نشده — با عکس رسید ساخته می‌شود */
    const pr = await db.prepare("INSERT INTO payments (user_id,amount,method,ref_code,proof_file_id,proof_platform,status,kind) VALUES(?1,?2,?3,?4,?5,?6,'pending','topup')").bind(user.id, num(s.data.amount), s.data.method || 'card', cap, fileId, p).run();
    pid = pr.meta.last_row_id;
  } else {
    await db.prepare("UPDATE payments SET proof_file_id=?2, proof_platform=?3, ref_code=CASE WHEN ?4<>'' THEN ?4 ELSE ref_code END WHERE id=?1 AND status='pending'").bind(pid, fileId, p, cap).run();
  }
  const pay = await db.prepare('SELECT * FROM payments WHERE id=?1').bind(pid).first();
  if (!pay) { await setBState(db, p, chatId, null); return sendBot(bBase(p), T, chatId, '⚠️ پرداخت یافت نشد. دوباره از بخش پرداخت شروع کن.', mainKb(user, user.role === 'admin')); }
  s.data.payment_id = pid; s.data.proof = true;
  await setBState(db, p, chatId, s);
  const kind = pay.kind === 'topup' ? 'شارژ کیف پول' : 'ورودی روم';
  notifyProofAdmins(db, env, pay.id, `📸 <b>رسید ${kind} دریافت شد</b>\n\n#${faNum(pay.id)} | ${money(pay.amount)} تومان\n👤 ${esc(user.display_name || user.username)}`);
  return sendBot(bBase(p), T, chatId, `✅ <b>عکس رسید ثبت شد و برای مدیریت ارسال گردید.</b>\n\n⏳ پس از بررسی، نتیجه به شما اعلام می‌شود.\n🧾 کد پیگیری اختیاری است — اگر کد تراکنش را داری همین‌جا بفرست تا ثبت شود، یا /skip را بزن.`, s.data.room ? [[{ text: '🔙 بازگشت به روم', callback_data: `rm:${s.data.room}` }]] : [[{ text: '👤 حساب من', callback_data: 'm:acc' }]]);
}

/* ─────────────── هندلر پیام‌های متنی ربات ─────────────── */
async function handleBotMessage(db, env, p, msg) {
  if (!msg || !msg.from || msg.from.is_bot) return;
  const chatId = String(msg.chat.id);
  const text = String(msg.text || '').trim();
  const st0 = await getSettings(db);
  const { user, isNew, madeAdmin } = await ensureBotUser(db, env, p, msg.from);
  const isAdmin = user.role === 'admin';

  if (user.banned) {
    if (text === '/start') await sendBot(bBase(p), bToken(env, st0, p), chatId, '⛔️ دسترسی شما توسط مدیریت مسدود شده است.');
    return;
  }
  /* دستورها */
  if (text === '/start') {
    if (isNew) {
      await db.prepare('INSERT INTO transactions (user_id,amount,kind,ref) VALUES(?1,0,?2,?3)').bind(user.id, 'register', 'signup').run();
      if (madeAdmin) await sendBot(bBase(p), bToken(env, st0, p), chatId, '🛡 <b>شما به عنوان مدیر اصلی پلتفرم ثبت شدید!</b>\n\nهمه بخش‌ها در اختیار شماست. برای شروع، «🛡 پنل مدیریت» را بزن و تنظیمات را کامل کن.\n\n👇 از منوی زیر استفاده کن:', mainKb(user, true));
      else await sendBot(bBase(p), bToken(env, st0, p), chatId, `🪖 <b>خوش آمدی ${esc(user.display_name || user.username)}!</b>\n\nحساب شما ساخته شد. 👇`, mainKb(user, isAdmin));
      return;
    }
    await showMain(db, env, p, chatId, user);
    return;
  }
  if (text === '/help') return showHelp(db, env, p, chatId, null, user);
  if (text === '/myid') return sendBot(bBase(p), bToken(env, st0, p), chatId, `🆔 شناسه عددی شما:\n<code>${chatId}</code>`);
  if (text === '/cancel') { await setBState(db, p, chatId, null); return sendBot(bBase(p), bToken(env, st0, p), chatId, '❌ عملیات لغو شد.', mainKb(user, isAdmin)); }
  if (text === '/link') return showLinkCode(db, env, p, chatId, null, user);
  if (text === '/admin') { if (isAdmin) return showAdminPanel(db, env, p, chatId, null); }

  /* ماشین حالت */
  const s = await getBState(db, p, chatId);
  const T = bToken(env, await getSettings(db), p);
  /* پیام‌های عکسی — ثبت عکس رسید (الزامی) */
  if (msg.photo && msg.photo.length) {
    if (s && (s.flow === 'receipt' || s.flow === 'topref')) return handlePayProof(db, env, p, chatId, user, s, msg);
    return sendBot(bBase(p), T, chatId, '📸 برای ثبت عکس رسید، اول پرداخت را شروع کن (ورودی روم یا شارژ کیف پول) و بعد عکس را بفرست.');
  }
  if (!s) {
    return sendBot(bBase(p), T, chatId, '👇 از منوی زیر استفاده کن:', mainKb(user, isAdmin));
  }
  if (s.flow === 'pass') {
    if (text.length < 4) return sendBot(bBase(p), T, chatId, '⚠️ رمز حداقل ۴ کاراکتر باشد. دوباره بفرست:');
    await db.prepare('UPDATE users SET password_hash=?2 WHERE id=?1').bind(user.id, await sha256(text + '::codm')).run();
    await setBState(db, p, chatId, null);
    return sendBot(bBase(p), T, chatId, `✅ رمز سایت تنظیم شد!\n\n🌐 ورود به سایت:\n📛 نام کاربری: <code>${esc(user.username)}</code>\n🔑 رمز: همان که فرستادی`, mainKb(user, isAdmin));
  }
  if (s.flow === 'receipt' || s.flow === 'topref') {
    let pid = num(s.data.payment_id);
    /* شارژ کیف پول: اگر هنوز پرداخت ساخته نشده، با اولین پیام ساخته می‌شود */
    if (!pid && s.flow === 'topref') {
      const pr = await db.prepare("INSERT INTO payments (user_id,amount,method,ref_code,status,kind) VALUES(?1,?2,?3,?4,'pending','topup')").bind(user.id, num(s.data.amount), s.data.method || 'card', '').run();
      pid = pr.meta.last_row_id; s.data.payment_id = pid;
      await setBState(db, p, chatId, s);
    }
    const pay = await db.prepare('SELECT * FROM payments WHERE id=?1').bind(pid).first();
    if (!pay) { await setBState(db, p, chatId, null); return sendBot(bBase(p), T, chatId, '⚠️ پرداخت یافت نشد.', mainKb(user, isAdmin)); }
    if (text === '/skip' || text === '/cancel') {
      const done = !!s.data.proof;
      await setBState(db, p, chatId, null);
      return sendBot(bBase(p), T, chatId, done ? '✅ رسید شما ثبت شد و در حال بررسی توسط مدیریت است.' : '⚠️ تا وقتی عکس رسید نفرستی، پرداختت بررسی نمی‌شود. هر وقت عکس آماده بود، همین‌جا بفرست.', s.data.room ? [[{ text: '🔙 بازگشت به روم', callback_data: `rm:${s.data.room}` }]] : mainKb(user, isAdmin));
    }
    /* کد پیگیری اختیاری است — اما عکس رسید الزامی */
    await db.prepare("UPDATE payments SET ref_code=?2 WHERE id=?1 AND status='pending'").bind(pid, text.slice(0, 60)).run();
    if (!s.data.proof) {
      return sendBot(bBase(p), T, chatId, `🧾 کد پیگیری ثبت شد: <code>${esc(text.slice(0, 60))}</code>\n\n⚠️ <b>ارسال عکس رسید الزامی است!</b>\n📸 لطفاً عکس رسید واریز را همین‌جا بفرست (می‌توانی کد پیگیری را در کپشن عکس هم بنویسی).`);
    }
    notifyPlatformAdmins(db, env, pay.proof_platform || p, `🧾 کد پیگیری پرداخت #${faNum(pay.id)} بروزرسانی شد: <code>${esc(text.slice(0, 60))}</code>`);
    return sendBot(bBase(p), T, chatId, `✅ کد پیگیری بروزرسانی شد: <code>${esc(text.slice(0, 60))}</code>\n⏳ رسید شما در حال بررسی است.`, s.data.room ? [[{ text: '🔙 بازگشت به روم', callback_data: `rm:${s.data.room}` }]] : mainKb(user, isAdmin));
  }
  if (s.flow === 'topamount') {
    const amount = num(numFa(text).replace(/[,،]/g, ''));
    const st = await getSettings(db);
    const minT = num(stg(st, 'min_topup', 50000));
    if (!amount || amount < minT) return sendBot(bBase(p), T, chatId, `⚠️ مبلغ نامعتبر است. حداقل <b>${money(minT)} تومان</b> را بفرست:`);
    s.flow = 'topref'; s.data.amount = amount;
    await setBState(db, p, chatId, s);
    if (s.data.method === 'card') {
      return sendBot(bBase(p), T, chatId, `💳 <b>پرداخت کارت به کارت</b>\n━━━━━━━━━━━━━━━━━━\n🏦 بانک: ${esc(stg(st, 'bank_name', '')) || '—'}\n🔢 شماره کارت:\n<code>${esc(stg(st, 'card_number', ''))}</code>\n👤 به نام: ${esc(stg(st, 'card_name', '')) || '—'}\n💰 مبلغ: <b>${money(amount)} تومان</b>\n\n⚠️ مبلغ را دقیقاً ${money(amount)} تومان واریز کن.\n📸 سپس <b>عکس رسید</b> را همین‌جا بفرست (الزامی).\n🧾 کد پیگیری اختیاری است — می‌توانی در کپشن عکس بنویسی یا جداگانه بفرستی:`, [[{ text: '❌ لغو', callback_data: 'm:top' }]]);
    }
    return sendBot(bBase(p), T, chatId, `🏦 <b>پرداخت آنلاین</b>\n\nمبلغ: <b>${money(amount)} تومان</b>\nبا دکمه زیر پرداخت کن و سپس <b>عکس رسید</b> را همین‌جا بفرست (الزامی):\n🧾 کد پیگیری اختیاری است.`, [[{ text: '🏦 رفتن به درگاه', url: String(stg(st, 'gateway_url', '')).replace('{amount}', String(amount)).replace('{desc}', encodeURIComponent('Topup')) }], [{ text: '❌ لغو', callback_data: 'm:top' }]]);
  }
  if (s.flow === 'nr' && isAdmin) {
    const d = s.data;
    if (s.step === 1) { d.title = text.slice(0, 120); s.step = 2; await setBState(db, p, chatId, s); const kb = []; const keys = Object.keys(MODES); for (let i = 0; i < keys.length; i += 2) kb.push(keys.slice(i, i + 2).map(k => ({ text: `${MODES[k].emoji} ${MODES[k].fa}`, callback_data: `nrmode:${k}` }))); return sendBot(bBase(p), T, chatId, `➕ <b>ساخت روم</b> (۲/۹)\n\n🎮 حالت بازی را انتخاب کن:`, kb); }
    if (s.step === 3) { const n = Math.floor(num(numFa(text))); if (n < 2 || n > MAX_TEAMS) return sendBot(bBase(p), T, chatId, `⚠️ عدد بین ۲ تا ${faNum(MAX_TEAMS)} بفرست:`); d.teams = n; s.step = 4; await setBState(db, p, chatId, s); return sendBot(bBase(p), T, chatId, `➕ <b>ساخت روم</b> (۴/۹)\n\n👥 تعداد بازیکن در هر تیم را بفرست (عدد)\nمثال: <code>4</code>\n\n💡 چیدمان فعلی: ${faNum(d.teams)} تیم`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
    if (s.step === 4) { const n = Math.floor(num(numFa(text))); if (n < 1 || n > MAX_SIZE) return sendBot(bBase(p), T, chatId, `⚠️ عدد بین ۱ تا ${faNum(MAX_SIZE)} بفرست:`); const lerr = layoutError(d.teams, n); if (lerr) return sendBot(bBase(p), T, chatId, `⚠️ ${lerr}.\nدوباره بفرست:`); d.team_size = n; s.step = 5; await setBState(db, p, chatId, s); return sendBot(bBase(p), T, chatId, `➕ <b>ساخت روم</b> (۵/۹)\n\n🗺 نام نقشه را بفرست (مثال: <code>Ismail</code>) یا /skip\n\n👥 چیدمان: ${faNum(d.teams)} تیم × ${faNum(n)} نفر = <b>${faNum(d.teams * n)} بازیکن</b>`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
    if (s.step === 5) { d.map_name = text === '/skip' ? '' : text.slice(0, 60); s.step = 6; await setBState(db, p, chatId, s); return sendBot(bBase(p), T, chatId, `➕ <b>ساخت روم</b> (۶/۹)\n\n💰 ورودی هر بازیکن به تومان (۰ = رایگان)\nمثال: <code>50000</code>`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
    if (s.step === 6) { const n = num(numFa(text).replace(/[,،]/g, '')); if (n < 0) return sendBot(bBase(p), T, chatId, '⚠️ عدد معتبر بفرست:'); d.entry_fee = n; s.step = 7; await setBState(db, p, chatId, s); return sendBot(bBase(p), T, chatId, `➕ <b>ساخت روم</b> (۷/۹)\n\n🏆 جایزه کل به تومان (۰ = بدون جایزه)\nمثال: <code>200000</code>`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
    if (s.step === 7) { const n = num(numFa(text).replace(/[,،]/g, '')); if (n < 0) return sendBot(bBase(p), T, chatId, '⚠️ عدد معتبر بفرست:'); d.prize_pool = n; s.step = 8; await setBState(db, p, chatId, s); return sendBot(bBase(p), T, chatId, `➕ <b>ساخت روم</b> (۸/۹)\n\n🕒 زمان شروع را بفرست (مثال: <code>امروز 21:00</code>) یا /skip`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
    if (s.step === 8) { d.start_time = text === '/skip' ? '' : text.slice(0, 40); s.step = 9; await setBState(db, p, chatId, s); return sendBot(bBase(p), T, chatId, `➕ <b>ساخت روم</b> (۹/۹)\n\n📝 توضیحات یا قوانین روم را بفرست یا /skip`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
    if (s.step === 9) { d.description = text === '/skip' ? '' : text.slice(0, 800); s.step = 10; await setBState(db, p, chatId, s); const m = MODES[d.mode] || MODES.custom; return sendBot(bBase(p), T, chatId, `📋 <b>بازبینی نهایی روم:</b>\n━━━━━━━━━━━━━━━━━━\n📝 عنوان: ${esc(d.title)}\n🎮 حالت: ${m.emoji} ${m.fa}\n👥 چیدمان: ${faNum(d.teams)} تیم × ${faNum(d.team_size)} نفر = ${faNum(d.teams * d.team_size)} بازیکن\n🗺 نقشه: ${esc(d.map_name) || '—'}\n💰 ورودی: ${d.entry_fee > 0 ? money(d.entry_fee) + ' تومان' : 'رایگان'}\n🏆 جایزه: ${d.prize_pool > 0 ? money(d.prize_pool) + ' تومان' : '—'}\n🕒 شروع: ${esc(d.start_time) || '—'}\n📝 توضیحات: ${esc(d.description) || '—'}\n━━━━━━━━━━━━━━━━━━\nآیا روم ساخته شود؟`, [[{ text: '✅ بله، بساز', callback_data: 'nr:ok' }], [{ text: '❌ لغو', callback_data: 'adm' }]]); }
  }
  if (s.flow === 'prz' && isAdmin) {
    if (s.step === 1) {
      const q = text.replace('@', '').trim();
      let tu = /^[0-9]+$/.test(q) ? await db.prepare('SELECT id, username, display_name FROM users WHERE id=?1').bind(num(q)).first() : await db.prepare('SELECT id, username, display_name FROM users WHERE LOWER(username)=LOWER(?1)').bind(q).first();
      if (!tu) return sendBot(bBase(p), T, chatId, '⚠️ کاربر یافت نشد. نام کاربری یا شناسه عددی معتبر بفرست:');
      s.data.userId = tu.id; s.data.name = tu.display_name || tu.username; s.step = 2;
      await setBState(db, p, chatId, s);
      return sendBot(bBase(p), T, chatId, `🏆 جایزه برای <b>${esc(s.data.name)}</b> (۲/۳)\n\n💰 مبلغ را بفرست (تومان):`, [[{ text: '❌ لغو', callback_data: 'adm' }]]);
    }
    if (s.step === 2) { const n = num(numFa(text).replace(/[,،]/g, '')); if (n <= 0) return sendBot(bBase(p), T, chatId, '⚠️ مبلغ معتبر بفرست:'); s.data.amount = n; s.step = 3; await setBState(db, p, chatId, s); return sendBot(bBase(p), T, chatId, `🏆 (۳/۳)\n\n📝 توضیح جایزه را بفرست (مثال: قهرمان روم شماره ۵) یا /skip`, [[{ text: '❌ لغو', callback_data: 'adm' }]]); }
    if (s.step === 3) { s.data.note = text === '/skip' ? '' : text.slice(0, 200); await setBState(db, p, chatId, s); return sendBot(bBase(p), T, chatId, `📋 <b>تایید جایزه:</b>\n👤 ${esc(s.data.name)}\n💰 ${money(s.data.amount)} تومان\n📝 ${esc(s.data.note) || '—'}`, [[{ text: '✅ تایید و پرداخت', callback_data: 'prz:ok' }], [{ text: '❌ لغو', callback_data: 'adm' }]]); }
  }
  if (s.flow === 'pub' && isAdmin) {
    let roomId = '', roomPass = '';
    const parts = text.split(/\s*[|:]\s*|\s+/);
    if (parts.length >= 2) { roomId = parts[0]; roomPass = parts.slice(1).join(' '); } else { roomId = text; }
    await db.prepare('UPDATE rooms SET room_id=?2, room_pass=?3 WHERE id=?1').bind(num(s.data.roomId), roomId.slice(0, 60), roomPass.slice(0, 60)).run();
    const room = await db.prepare('SELECT * FROM rooms WHERE id=?1').bind(num(s.data.roomId)).first();
    const pl = await db.prepare("SELECT DISTINCT user_id uid FROM slots WHERE room_id=?1 AND status='paid' AND user_id IS NOT NULL").bind(room.id).all();
    for (const x of (pl.results || [])) notifyUser(db, env, x.uid, `🔓 <b>اطلاعات روم آماده شد!</b>\n\n🎮 روم: <b>${esc(room.title)}</b>\n🆔 Room ID: <code>${esc(roomId)}</code>\n🔑 Password: <code>${esc(roomPass)}</code>\n\nسریع خودت را برسون قهرمان! ⏰`);
    await setBState(db, p, chatId, null);
    return sendBot(bBase(p), T, chatId, `✅ اطلاعات روم ذخیره و برای ${faNum((pl.results || []).length)} بازیکن قطعی ارسال شد.`, [[{ text: '🔙 بازگشت به روم', callback_data: `adm:room:${room.id}` }]]);
  }
  if (s.flow === 'set' && isAdmin) {
    let val = text;
    if (text === 'حذف') val = '';
    if (s.data.key === 'min_topup') val = String(num(numFa(text).replace(/[,،]/g, '')));
    await setSetting(db, s.data.key, val);
    await setBState(db, p, chatId, null);
    return sendBot(bBase(p), T, chatId, `✅ «${SET_LABELS[s.data.key]}» بروزرسانی شد.`, [[{ text: '🔙 تنظیمات', callback_data: 'adm:set' }]]);
  }
  if (s.flow === 'bc' && isAdmin) {
    s.data.text = text.slice(0, 3500);
    await setBState(db, p, chatId, s);
    return sendBot(bBase(p), T, chatId, `📋 <b>پیش‌نمایش پیام:</b>\n━━━━━━━━━━━━━━━━━━\n${esc(text.slice(0, 1000))}\n━━━━━━━━━━━━━━━━━━\nارسال شود؟`, [[{ text: '📤 ارسال به همه', callback_data: 'bcgo:0' }], [{ text: '❌ لغو', callback_data: 'adm' }]]);
  }
  return sendBot(bBase(p), T, chatId, '🤔 متوجه نشدم. از منوی زیر استفاده کن:', mainKb(user, isAdmin));
}

/* ─────────────── ورودی وب‌هوک ─────────────── */
async function botRoute(p, req, env, db) {
  if (req.method !== 'POST') return j({ ok: true, service: 'CODM Rooms bot', platform: p });
  let upd = null;
  try { upd = await req.json(); } catch (e) { return j({ ok: true }); }
  try {
    if (!db) return j({ ok: true });
    if (upd.callback_query) await handleCallback(db, env, p, upd.callback_query);
    else if (upd.message) await handleBotMessage(db, env, p, upd.message);
  } catch (e) { try { console.error('CODM bot err:', e && e.stack || e); } catch (e2) {} }
  return j({ ok: true });
}

/* ══════════════════════════════════════════════════════════════
   روتر اصلی API
   ══════════════════════════════════════════════════════════════ */
async function apiRoute(req, env, db, url) {
  const p = url.pathname, m = req.method, origin = url.origin;
  if (!db) return j({ ok: false, error: 'D1 database not bound. Add DB binding in worker settings.' }, 500);
  const pm = p.match(/^\/api\/rooms\/(\d+)(\/(join|leave|publish|status|remove))?$/);
  const prm = p.match(/^\/api\/payments\/(\d+)\/ref$/);
  const pym = p.match(/^\/api\/payments\/(\d+)\/(approve|reject)$/);
  const pzm = p.match(/^\/api\/prizes\/(\d+)\/(approve|reject)$/);
  const pum = p.match(/^\/api\/users\/(\d+)\/(role|ban)$/);
  if (m === 'GET') {
    if (p === '/api/health') return j({ ok: true, service: 'CODM Rooms', version: V, time: new Date().toISOString() });
    if (p === '/api/public/stats') return apiPublicStats(db);
    if (p === '/api/public/config') return apiPublicConfig(db, env);
    if (p === '/api/me') return apiMe(db, req);
    if (p === '/api/rooms') return apiRooms(db, url);
    if (pm && !p.endsWith('/join')) return apiRoomGet(db, req, num(pm[1]));
    if (p === '/api/payments') return apiPayments(db, req, url);
    if (p === '/api/prizes') return apiPrizes(db, req, url);
    if (p === '/api/users') return apiUsers(db, req, url);
    if (p === '/api/stats') return apiStats(db);
    if (p === '/api/settings') return apiSettingsGet(db, req);
    if (p === '/api/webhook/status') return apiWebhookStatus(db, env, req, origin);
  }
  if (m === 'POST') {
    if (p === '/api/register') return apiRegister(db, env, req);
    if (p === '/api/login') return apiLogin(db, req);
    if (p === '/api/logout') {
      const tk = (req.headers.get('Authorization') || '').match(/^Bearer (.+)$/);
      if (tk) await db.prepare('DELETE FROM sessions WHERE token=?1').bind(tk[1]).run();
      return j({ ok: true });
    }
    if (p === '/api/me/update') return apiMeUpdate(db, req);
    if (p === '/api/link') return apiLink(db, env, req);
    if (p === '/api/rooms') return apiRoomCreate(db, env, req);
    if (pm && pm[3] === 'join') return apiRoomJoin(db, env, req, num(pm[1]));
    if (pm && pm[3] === 'leave') return apiRoomLeave(db, env, req, num(pm[1]));
    if (pm && pm[3] === 'publish') return apiRoomPublish(db, env, req, num(pm[1]));
    if (pm && pm[3] === 'status') return apiRoomStatus(db, env, req, num(pm[1]));
    if (pm && pm[3] === 'remove') return apiRoomRemove(db, env, req, num(pm[1]));
    if (p === '/api/topup') return apiTopup(db, env, req);
    if (prm) return apiPaymentRef(db, env, req, num(prm[1]));
    if (pym) {
      const au = await authUser(db, req);
      if (!au || au.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
      if (pym[2] === 'approve') { const r = await approvePayment(db, env, num(pym[1]), au.id); return r.ok ? j(r) : j(r, 400); }
      const r = await rejectPayment(db, env, num(pym[1]), au.id); return r.ok ? j(r) : j(r, 400);
    }
    if (p === '/api/prizes') return apiPrizeCreate(db, env, req);
    if (pzm) {
      const au = await authUser(db, req);
      if (!au || au.role !== 'admin') return j({ ok: false, error: 'دسترسی ادمین لازم است' }, 403);
      if (pzm[2] === 'approve') { const r = await approvePrize(db, env, num(pzm[1]), au.id); return r.ok ? j(r) : j(r, 400); }
      await db.prepare("UPDATE prizes SET status='rejected', handled_at=datetime('now') WHERE id=?1 AND status='pending'").bind(num(pzm[1])).run();
      return j({ ok: true });
    }
    if (pum) {
      if (pum[2] === 'role') return apiUserRole(db, req, num(pum[1]));
      return apiUserBan(db, req, num(pum[1]));
    }
    if (p === '/api/settings') return apiSettingsSet(db, req);
    if (p === '/api/broadcast') return apiBroadcast(db, env, req);
    if (p === '/api/webhook/set') return apiWebhookSet(db, env, req, origin);
  }
  if (m === 'PUT' && pm && !pm[3]) return apiRoomUpdate(db, req, num(pm[1]));
  if (m === 'DELETE' && pm && !pm[3]) return apiRoomDelete(db, req, num(pm[1]));
  return j({ ok: false, error: 'endpoint not found' }, 404);
}

/* ─────────────── صفحات HTML ─────────────── */
function pageShell(title, bodyInner) {
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:Tahoma,Vazirmatn,sans-serif;background:#07090d;color:#e8edf4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .c{max-width:640px;width:100%}.card{background:#11161f;border:1px solid #232b38;border-radius:16px;padding:28px;margin-bottom:16px}
  h1{color:#ff9f1a;font-size:22px;margin-bottom:12px}h2{font-size:16px;margin:14px 0 8px;color:#ffb84d}
  code{background:#0a0e14;border:1px solid #232b38;padding:2px 8px;border-radius:6px;direction:ltr;display:inline-block;font-size:13px;color:#7dd87d;word-break:break-all}
  .st{display:flex;justify-content:space-between;padding:10px 14px;background:#0a0e14;border:1px solid #232b38;border-radius:10px;margin:8px 0;font-size:14px}
  .ok{color:#2ecc71}.bad{color:#ff4757}button{background:linear-gradient(135deg,#ff9f1a,#ff6b00);border:none;color:#0a0e14;font-weight:700;padding:12px 22px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:14px;width:100%;margin-top:8px}
  input{width:100%;padding:12px;border-radius:10px;border:1px solid #232b38;background:#0a0e14;color:#fff;font-family:inherit;margin:8px 0;direction:ltr;text-align:left}
  .mut{color:#8b98a9;font-size:13px;line-height:1.9}.sep{border-top:1px dashed #232b38;margin:14px 0}
  </style></head><body><div class="c">${bodyInner}</div></body></html>`;
}
function rootPage(origin, db) {
  const dbOk = !!db;
  return pageShell('CODM Rooms Platform', `
  <div class="card"><h1>🪖 CODM Rooms Platform v${V}</h1>
  <p class="mut">بک‌اند پلتفرم مدیریت روم‌های کالاف دیوتی موبایل — سایت + ربات تلگرام + ربات بله با دیتابیس مشترک D1</p>
  <div class="sep"></div>
  <div class="st"><span>وضعیت سرویس</span><span class="ok">✅ فعال</span></div>
  <div class="st"><span>اتصال دیتابیس D1</span><span class="${dbOk ? 'ok' : 'bad'}">${dbOk ? '✅ شناسایی شد (جداول خودکار ساخته می‌شوند)' : '❌ یافت نشد — اتصال D1 را در تنظیمات ورکر بررسی کن'}</span></div>
  <div class="st"><span>API سایت</span><span><code>${origin}/api/health</code></span></div>
  <div class="st"><span>وب‌هوک ربات‌ها</span><span><code>${origin}/tg/••••••</code> و <code>${origin}/bale/••••••</code></span></div>
  <div class="sep"></div>
  <h2>🚀 مراحل راه‌اندازی</h2>
  <p class="mut">۱. کد این ورکر را در ورکر خودت Paste کن (جداول D1 خودکار ساخته می‌شوند — نیازی به ایمپورت SQL نیست)<br>۲. با ربات تلگرام یا بله /start بزن — اولین نفر «مدیر اصلی» می‌شود<br>۳. در «🛡 پنل مدیریت» ربات ← «⚙️ تنظیمات» توکن‌ها و کارت را ثبت کن<br>۴. وب‌هوک‌ها را از پنل سایت یا دکمه‌های صفحه <code>${origin}/setup</code> وصل کن<br>۵. آدرس این ورکر را در فایل config.js سایت بگذار</p></div>`);
}
function setupPage(origin) {
  return pageShell('اتصال ربات‌ها — CODM Rooms', `
  <div class="card"><h1>🔗 اتصال سریع وب‌هوک ربات‌ها</h1>
  <p class="mut">توکن ربات را از <b>@BotFather</b> (تلگرام) یا <b>BotFather بله</b> بگیر. اول در پنل سایت (تنظیمات ادمین) یا از طریق ربات، توکن‌ها را در تنظیمات ذخیره کن؛ سپس توکن ادمین سایت را اینجا وارد کن و دکمه اتصال را بزن.</p>
  <input id="tok" placeholder="توکن ادمین سایت (Bearer)" autocomplete="off">
  <button onclick="conn('telegram')">📱 اتصال ربات تلگرام</button>
  <button onclick="conn('bale')">💬 اتصال ربات بله</button>
  <button onclick="stat()" style="background:#161d29;color:#e8edf4;border:1px solid #232b38">🔄 بررسی وضعیت فعلی</button>
  <div id="out"></div></div>
  <div class="card"><h2>📎 آدرس‌های وب‌هوک</h2>
  <p class="mut">آدرس صحیح وب‌هوک شامل یک <b>کلید امنیتی خودکار</b> است و با دکمه‌های بالا به‌صورت خودکار تنظیم می‌شود:<br>تلگرام: <code>${origin}/tg/&lt;کلید-امنیتی&gt;</code><br>بله: <code>${origin}/bale/&lt;کلید-امنیتی&gt;</code></p>
  <p class="mut" style="margin-top:8px">⚠️ هشدار: هرگز setWebhook را با url خالی نزنید — اتصال ربات قطع می‌شود! کلید امنیتی جلوی پیام‌های جعلی را می‌گیرد.</p></div>
  <script>
  async function conn(p){const t=document.getElementById('tok').value.trim();const o=document.getElementById('out');
  if(!t){o.innerHTML='<p class="bad" style="margin-top:10px">توکن ادمین را وارد کن</p>';return}
  o.innerHTML='<p class="mut">در حال اتصال...</p>';
  try{const r=await fetch('/api/webhook/set',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({platform:p})});const j=await r.json();
  o.innerHTML=j.ok?'<p class="ok" style="margin-top:10px">✅ اتصال '+p+' با موفقیت انجام شد!</p>':'<p class="bad" style="margin-top:10px">❌ '+(j.error||'خطا')+'</p>'}catch(e){o.innerHTML='<p class="bad">❌ '+e+'</p>'}}
  async function stat(){const t=document.getElementById('tok').value.trim();const o=document.getElementById('out');
  if(!t){o.innerHTML='<p class="bad">توکن ادمین را وارد کن</p>';return}
  try{const r=await fetch('/api/webhook/status',{headers:{'Authorization':'Bearer '+t}});const j=await r.json();
  if(j.ok){const tg=j.telegram,bj=j.bale;
  o.innerHTML='<div class="st"><span>📱 تلگرام</span><span class="'+(tg.connected?'ok':'bad')+'">'+(tg.connected?'✅ متصل: '+tg.info.url:'❌ متصل نیست')+'</span></div><div class="st"><span>💬 بله</span><span class="'+(bj.connected?'ok':'bad')+'">'+(bj.connected?'✅ متصل: '+bj.info.url:'❌ متصل نیست')+'</span></div>'}
  }catch(e){o.innerHTML='<p class="bad">❌ '+e+'</p>'}}
  </script>`);
}

/* ─────────────── نقطه ورود ─────────────── */
async function handleFetch(req, env, ctx) {
  CTX = ctx || null;
  const url = new URL(req.url), p = url.pathname;
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: H });
  try {
    const db = pickDB(env);
    if (db) { try { await initDB(db); } catch (e) {} }
    if (p.startsWith('/api/')) return await apiRoute(req, env, db, url);
    const mTg = p.match(/^\/tg(?:\/([A-Za-z0-9]+))?$/), mBl = p.match(/^\/bale(?:\/([A-Za-z0-9]+))?$/);
    if (mTg || mBl) {
      if (!db) return j({ ok: true });
      const sec = (mTg ? mTg[1] : mBl[1]) || '';
      const want = await whSecret(db);
      if (want && sec !== want) return j({ ok: false, error: 'forbidden' }, 403);
      return await botRoute(mTg ? 'tg' : 'bale', req, env, db);
    }
    if (p === '/setup') return html(setupPage(url.origin));
    if (p === '/' || p === '') return html(rootPage(url.origin, db));
    return j({ ok: false, error: 'not found' }, 404);
  } catch (e) {
    return j({ ok: false, error: String(e && e.message || e) }, 500);
  }
}
export default { fetch: (req, env, ctx) => handleFetch(req, env, ctx) };






