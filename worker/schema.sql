-- ============================================================
--  CODM ROOMS PLATFORM — D1 Schema v1.1
--  دیتابیس مشترک: سایت + ربات تلگرام + ربات بله
--  ⚠️ نیاز به اجرای دستی نیست! ورکر در اولین درخواست جداول را خودکار می‌سازد.
--  این فایل فقط برای مشاهده/اجرای دستی اختیاری است.
-- ============================================================

-- کاربران (مشترک بین سایت و ربات‌ها)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  telegram_id TEXT UNIQUE,
  bale_id TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  wallet REAL DEFAULT 0,
  codm_id TEXT,
  banned INTEGER DEFAULT 0,
  lang TEXT DEFAULT 'fa',
  created_at TEXT DEFAULT (datetime('now'))
);

-- روم‌ها
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  mode TEXT DEFAULT 'tdm',
  map_name TEXT,
  teams INTEGER DEFAULT 2,
  team_size INTEGER DEFAULT 4,
  max_players INTEGER DEFAULT 8,
  entry_fee REAL DEFAULT 0,
  prize_pool REAL DEFAULT 0,
  start_time TEXT,
  status TEXT DEFAULT 'open',
  room_id TEXT,
  room_pass TEXT,
  description TEXT,
  rules TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- موقعیت‌های (اسلات‌های) هر روم
CREATE TABLE IF NOT EXISTS slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  slot_no INTEGER NOT NULL,
  team_label TEXT,
  user_id INTEGER,
  status TEXT DEFAULT 'free',
  payment_id INTEGER,
  UNIQUE(room_id, slot_no)
);

-- پرداخت‌ها (ورودی روم / شارژ کیف پول)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  room_id INTEGER,
  slot_id INTEGER,
  amount REAL NOT NULL,
  method TEXT DEFAULT 'card',
  ref_code TEXT,
  status TEXT DEFAULT 'pending',
  kind TEXT DEFAULT 'entry',
  created_at TEXT DEFAULT (datetime('now')),
  handled_by INTEGER,
  handled_at TEXT
);

-- جوایز
CREATE TABLE IF NOT EXISTS prizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  room_id INTEGER,
  amount REAL NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending',
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  handled_at TEXT
);

-- تراکنش‌های کیف پول
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  kind TEXT,
  ref TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- تنظیمات (کلید/مقدار)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- نشست‌های ورود سایت
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

-- کدهای اتصال اکانت سایت به ربات
CREATE TABLE IF NOT EXISTS link_codes (
  code TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  platform TEXT,
  expires_at TEXT
);

-- وضعیت گفتگوی ربات‌ها (فرم‌های چندمرحله‌ای)
CREATE TABLE IF NOT EXISTS bot_state (
  key TEXT PRIMARY KEY,
  data TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_slots_room ON slots(room_id);
CREATE INDEX IF NOT EXISTS idx_slots_user ON slots(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- تنظیمات پیش‌فرض
INSERT OR IGNORE INTO settings (key, value) VALUES
('min_topup', '50000'),
('welcome', 'به بزرگترین پلتفرم مدیریت روم‌های کالاف دیوتی موبایل خوش آمدید! 🪖'),
('bank_name', ''),
('card_number', ''),
('card_name', ''),
('gateway_url', ''),
('channel_link', 'https://t.me/offerspishnahadat_shop_bot'),
('support_bot', 'https://t.me/offerspishnahadat_feedbackbot'),
('website_url', ''),
('offers_site', 'https://offers-pishnahadat.vercel.app'),
('offers_page', 'https://zaya.io/Offers_pishnahadat'),
('shop_bot', 'https://t.me/offerspishnahadat_shop_bot');
