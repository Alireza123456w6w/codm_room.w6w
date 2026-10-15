/* ══════════════════════════════════════════════════════════
   CODM ROOMS — COMPLETE PLATFORM v1.5.3
   سایت چندزبانه (FA / EN) + پنل مدیریت کامل + ربات‌های بله و تلگرام
   متصل به Cloudflare Worker با دیتابیس D1
   ══════════════════════════════════════════════════════════ */
'use strict';

const FA_D = '۰۱۲۳۴۵۶۷۸۹';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fa = (n) => String(n).replace(/\d/g, (d) => FA_D[+d]);
const money = (n) => (Number(n) || 0).toLocaleString('en-US').replace(/,/g, '،');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num2 = (v) => { const n = parseInt(v, 10); return isFinite(n) ? n : 0; };

/* ─────────── سیستم دو زبانه (I18N) ─────────── */
let CUR_LANG = localStorage.getItem('codm_lang') || 'fa';

const I18N = {
  fa: {
    navHome: '🏠 خانه',
    navRooms: '🎮 روم‌ها',
    navMeta: '🔫 لوداوت‌های متا',
    navDogtag: '🎖️ کارت گیمری',
    navHelp: '📖 راهنما',
    mobHome: 'خانه',
    mobRooms: 'روم‌ها',
    mobMeta: 'متا',
    mobDogtag: 'داگ‌تگ',
    mobProfile: 'پروفایل',
    heroKicker: '🎯 پلتفرم شماره ۱ روم‌های CODM موبایل',
    heroTitle1: 'به',
    heroBattlefield: 'میدان نبرد',
    heroTitle2: 'خوش آمدی، سرباز!',
    heroSub: 'روم‌های کالاف دیوتی موبایل را اینجا پیدا کن، موقعیت اسکواد خودت را انتخاب کن، آنلاین یا از طریق ربات بله/تلگرام بپرداز و قطعی شو. جوایز نقدی هم منتظر قهرمان‌هاست! 🏆',
    heroBtnRooms: '🎮 ورود به روم‌ها',
    heroBtnAccount: '👤 حساب من',
    heroBtnRegister: '🪖 ساخت حساب رایگان',
    badgeReg: '⚡ ثبت‌نام آنی',
    badgePay: '💳 پرداخت امن',
    badgeBot: '🔔 اطلاع‌رسانی خودکار ربات',
    badgePrize: '🏆 جوایز نقدی تضمینی',
    statUsers: '🪖 سرباز ثبت‌نام‌شده',
    statRooms: '🎮 روم برگزارشده',
    statEntries: '🎯 ورودی قطعی',
    statPrizes: '🏆 جوایز پرداخت‌شده (تومان)',
    whyTitle: 'چرا',
    whySub: 'هر چیزی که برای یک تورنمنت حرفه‌ای لازم داری، یک‌جا',
    featMapTitle: 'انتخاب موقعیت روی نقشه',
    featMapDesc: 'مثل بازی واقعی! اسلات‌مپ زنده هر روم را ببین، تیم و جایگاهت را خودت انتخاب کن و رزروش کن.',
    featPayTitle: 'پرداخت چندروشه و ربات بله',
    featPayDesc: 'کیف پول، درگاه و کارت‌به‌کارت با تایید مستقیم فیش از طریق ربات بله. وضعیت پرداخت لحظه‌ای آپدیت می‌شود.',
    featBotTitle: 'ربات تلگرام + بله',
    featBotDesc: 'همه‌چیز از داخل ربات هم انجام می‌شود! ثبت‌نام، پرداخت، اطلاع‌رسانی Room ID و جوایز — با یک دیتابیس مشترک.',
    featPrizeTitle: 'جوایز نقدی شفاف',
    featPrizeDesc: 'جوایز قهرمان‌ها توسط مدیریت تایید و مستقیماً به کیف پول واریز می‌شود. همه‌چیز قابل رهگیری است.',
    featRefTitle: 'کد معرف و پاداش',
    featRefDesc: 'کد معرف اختصاصی بگیر و برای هر دعوت موفق، پاداش نقدی به کیف پولت برس — ورودی روم‌ها می‌تواند رایگان شود!',
    stepsTitle: 'چهار قدم تا میدان',
    step1Title: '🪖 حساب بساز',
    step1Desc: 'با نام کاربری و رمز در ۳۰ ثانیه. یا در ربات /start بزن.',
    step2Title: '🎮 روم را انتخاب کن',
    step2Desc: 'TDM، S&D، بتل رویال و ده‌ها مود دیگر — روم دلخواهت را پیدا کن.',
    step3Title: '🎯 جایگاهت را بگیر',
    step3Desc: 'از نقشه اسلات‌ها موقعیتت را انتخاب و هزینه ورودی را پرداخت کن.',
    step4Title: '🔓 وارد روم شو',
    step4Desc: 'Room ID و رمز به محض انتشار برایت ارسال می‌شود.',
    ctaTitle: 'آماده‌ای قهرمان بشی؟ 🔥',
    ctaSub: 'همین الان اولین رومت را رزرو کن — جایگاه‌ها محدودند!',
    ctaBtn: '🎯 مشاهده روم‌های باز',
    roomsTitle: 'روم‌های نبرد',
    roomsSub: 'روم دلخواهت را انتخاب کن و جایگاهت را رزرو کن',
    statusOpen: '🟢 باز',
    statusAll: 'همه',
    statusFull: '🟡 تکمیل',
    statusRunning: '🔴 در جریان',
    statusFinished: '⚫️ پایان',
    allModes: 'همه حالت‌ها',
    entryFee: 'ورودی',
    prizePool: 'جایزه',
    layout: 'چیدمان',
    start: 'شروع',
    viewAndReserve: '🎯 مشاهده و رزرو جایگاه',
    loginRegister: '🔐 ورود / ثبت‌نام',
    adminPanel: 'پنل مدیریت',
    toman: 'تومان',
    free: 'رایگان',
    players: 'بازیکن',
    filled: 'پر شده',
    backToRooms: '« بازگشت به روم‌ها'
  },
  en: {
    navHome: '🏠 HOME',
    navRooms: '🎮 ROOMS',
    navMeta: '🔫 META LOADOUTS',
    navDogtag: '🎖️ DOGTAG CARD',
    navHelp: '📖 GUIDE',
    mobHome: 'Home',
    mobRooms: 'Rooms',
    mobMeta: 'Meta',
    mobDogtag: 'Dogtag',
    mobProfile: 'Profile',
    heroKicker: '🎯 #1 CALL OF DUTY MOBILE TOURNAMENT PLATFORM',
    heroTitle1: 'WELCOME TO THE',
    heroBattlefield: 'BATTLEFIELD',
    heroTitle2: 'SOLDIER!',
    heroSub: 'Discover competitive CODM rooms, pick your tactical squad slot on live tactical maps, verify payments via Bale/Telegram bot, and win cash prize pools! 🏆',
    heroBtnRooms: '🎮 DEPLOY TO ROOMS',
    heroBtnAccount: '👤 MY PROFILE',
    heroBtnRegister: '🪖 RECRUIT ACCOUNT',
    badgeReg: '⚡ Instant Register',
    badgePay: '💳 Secure Payments',
    badgeBot: '🔔 Auto Bot Broadcast',
    badgePrize: '🏆 Guaranteed Prizes',
    statUsers: '🪖 Registered Soldiers',
    statRooms: '🎮 Tournaments Hosted',
    statEntries: '🎯 Verified Entries',
    statPrizes: '🏆 Paid Out Prizes (Toman)',
    whyTitle: 'WHY',
    whySub: 'Everything competitive squads need in one elite hub',
    featMapTitle: 'Interactive Slot Map',
    featMapDesc: 'Tactical interactive squad slot-map! Lock your precise seat with team rosters.',
    featPayTitle: 'Bale Bot & Multi-Pay',
    featPayDesc: 'Wallet balance, receipt upload via Bale bot, or online instant payment gateways.',
    featBotTitle: 'Telegram & Bale Bots',
    featBotDesc: 'Shared D1 real-time database. Instant room ID / pass push to your mobile device.',
    featPrizeTitle: 'Transparent Cash Prizes',
    featPrizeDesc: 'Automated verified payouts credited straight to champion wallets with audit logs.',
    featRefTitle: 'Referral & Squad Bounty',
    featRefDesc: 'Earn cash rewards for every recruited soldier who completes an entry!',
    stepsTitle: 'Four Steps To Victory',
    step1Title: '🪖 Create Soldier ID',
    step1Desc: 'Set up username and security credentials in under 30 seconds.',
    step2Title: '🎮 Select Tournament',
    step2Desc: 'Choose TDM, S&D, Battle Royale squads, or Sniper 1v1 duels.',
    step3Title: '🎯 Lock Squad Slot',
    step3Desc: 'Pick your position on the squad board and confirm your slot.',
    step4Title: '🔓 Get Room Credentials',
    step4Desc: 'Receive Room ID & Password instantly upon countdown launch.',
    ctaTitle: 'READY FOR GLORY, SOLDIER? 🔥',
    ctaSub: 'Claim your tournament position now — limited team slots!',
    ctaBtn: '🎯 BROWSE OPEN ROOMS',
    roomsTitle: 'ACTIVE COMBAT ROOMS',
    roomsSub: 'Choose your combat format and reserve your squad slot',
    statusOpen: '🟢 OPEN',
    statusAll: 'ALL',
    statusFull: '🟡 FULL',
    statusRunning: '🔴 LIVE',
    statusFinished: '⚫️ ENDED',
    allModes: 'All Game Modes',
    entryFee: 'Entry Fee',
    prizePool: 'Prize Pool',
    layout: 'Layout',
    start: 'Start',
    viewAndReserve: '🎯 VIEW & LOCK SLOT',
    loginRegister: '🔐 SIGN IN / REGISTER',
    adminPanel: 'Admin HQ',
    toman: 'Toman',
    free: 'FREE',
    players: 'Players',
    filled: 'Filled',
    backToRooms: '« Back to Rooms'
  }
};

function t(k) {
  const dict = I18N[CUR_LANG] || I18N.fa;
  return dict[k] || I18N.fa[k] || k;
}

function setLanguage(lang) {
  CUR_LANG = lang === 'en' ? 'en' : 'fa';
  localStorage.setItem('codm_lang', CUR_LANG);
  document.documentElement.lang = CUR_LANG;
  document.documentElement.dir = CUR_LANG === 'en' ? 'ltr' : 'rtl';
  
  $('#langTxt').textContent = CUR_LANG === 'fa' ? 'EN' : 'FA';
  $('#navHome').textContent = t('navHome');
  $('#navRooms').textContent = t('navRooms');
  $('#navMeta').textContent = t('navMeta');
  $('#navDogtag').textContent = t('navDogtag');
  $('#navHelp').textContent = t('navHelp');
  
  $('#mobNavHome').textContent = t('mobHome');
  $('#mobNavRooms').textContent = t('mobRooms');
  $('#mobNavMeta').textContent = t('mobMeta');
  $('#mobNavDogtag').textContent = t('mobDogtag');
  $('#mobNavProfile').textContent = t('mobProfile');
  
  renderTop();
  route();
  AudioFX.play('click');
}

/* ─────────── افکت‌های صوتی تاکتیکال (Web Audio API) ─────────── */
const AudioFX = (() => {
  let ctx = null;
  let enabled = localStorage.getItem('codm_sfx') !== 'false';

  function init() {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) ctx = new AudioContextClass();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function toggle() {
    enabled = !enabled;
    localStorage.setItem('codm_sfx', enabled ? 'true' : 'false');
    updateBtn();
    if (enabled) { init(); play('click'); }
    toast(enabled ? (CUR_LANG === 'en' ? '🔊 SFX Enabled' : '🔊 صدای بازی فعال شد') : (CUR_LANG === 'en' ? '🔇 SFX Muted' : '🔇 صدای بازی قطع شد'), 'info', 1800);
  }

  function updateBtn() {
    const btn = $('#sfxToggle');
    if (!btn) return;
    btn.classList.toggle('active', enabled);
    const txt = btn.querySelector('.sfx-txt');
    if (txt) txt.textContent = enabled ? 'SFX ON' : 'SFX OFF';
    const ic = btn.querySelector('.sfx-icon');
    if (ic) ic.textContent = enabled ? '🔊' : '🔇';
  }

  function play(type) {
    if (!enabled) return;
    try {
      init();
      if (!ctx) return;
      const tm = ctx.currentTime;
      if (type === 'click') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, tm);
        osc.frequency.exponentialRampToValueAtTime(600, tm + 0.05);
        g.gain.setValueAtTime(0.12, tm);
        g.gain.exponentialRampToValueAtTime(0.001, tm + 0.05);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(tm);
        osc.stop(tm + 0.05);
      } else if (type === 'lock') {
        [1100, 1760].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, tm + idx * 0.06);
          g.gain.setValueAtTime(0.15, tm + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, tm + idx * 0.06 + 0.12);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(tm + idx * 0.06);
          osc.stop(tm + idx * 0.06 + 0.12);
        });
      } else if (type === 'headshot') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, tm);
        osc.frequency.exponentialRampToValueAtTime(3200, tm + 0.15);
        g.gain.setValueAtTime(0.2, tm);
        g.gain.exponentialRampToValueAtTime(0.001, tm + 0.28);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(tm);
        osc.stop(tm + 0.28);
      } else if (type === 'nuke') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, tm);
        osc.frequency.linearRampToValueAtTime(750, tm + 0.4);
        osc.frequency.linearRampToValueAtTime(220, tm + 0.8);
        g.gain.setValueAtTime(0.18, tm);
        g.gain.exponentialRampToValueAtTime(0.01, tm + 0.85);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(tm);
        osc.stop(tm + 0.85);
      } else if (type === 'reload') {
        [0, 0.11].forEach((delay) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(700, tm + delay);
          osc.frequency.exponentialRampToValueAtTime(300, tm + delay + 0.04);
          g.gain.setValueAtTime(0.12, tm + delay);
          g.gain.exponentialRampToValueAtTime(0.001, tm + delay + 0.04);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(tm + delay);
          osc.stop(tm + delay + 0.04);
        });
      }
    } catch (e) {}
  }

  return { init, toggle, play, updateBtn };
})();
window.AudioFX = AudioFX;

/* ─────────── تنظیمات و وضعیت پایه ─────────── */
const MODES = {
  tdm: { fa: 'نبرد تیمی TDM', en: 'Team Deathmatch 5v5', emoji: '🔫', def_teams: 2, def_size: 5 },
  snd: { fa: 'جستجو و نابودی S&D', en: 'Search & Destroy 4v4', emoji: '💣', def_teams: 2, def_size: 4 },
  snd6: { fa: 'جستجو و نابودی ۶v۶', en: 'Search & Destroy 6v6', emoji: '💣', def_teams: 2, def_size: 6 },
  dom: { fa: 'سلطه DOM', en: 'Domination 5v5', emoji: '🚩', def_teams: 2, def_size: 5 },
  gun: { fa: 'گانفایت ۲v۲', en: 'Gunfight 2v2', emoji: '🤝', def_teams: 2, def_size: 2 },
  one: { fa: 'تک‌به‌تک 1v1', en: 'Duel 1v1', emoji: '⚔️', def_teams: 2, def_size: 1 },
  sniper: { fa: 'اسنایپر 1v1', en: 'Sniper Only 1v1', emoji: '🎯', def_teams: 2, def_size: 1 },
  knife: { fa: 'چاقو فقط 1v1', en: 'Melee Only 1v1', emoji: '🔪', def_teams: 2, def_size: 1 },
  br: { fa: 'بتل رویال BR', en: 'Battle Royale Squads', emoji: '🪂', def_teams: 4, def_size: 4 },
  custom: { fa: 'سفارشی', en: 'Custom Format', emoji: '🎮', def_teams: 2, def_size: 4 }
};

const RSTATUS = {
  open: ['باز', 'OPEN', 'open'],
  full: ['تکمیل ظرفیت', 'FULL', 'full'],
  running: ['در حال اجرا', 'IN BATTLE', 'running'],
  finished: ['پایان یافت', 'FINISHED', 'finished'],
  cancelled: ['لغو شد', 'CANCELLED', 'cancelled']
};

const S = {
  api: localStorage.getItem('codm_api') || (window.CODM_CFG && window.CODM_CFG.API_URL) || '',
  token: localStorage.getItem('codm_token') || '',
  me: null,
  cfg: null
};

/* ─────────── لایه API هماهنگ با سرور و ورکر ─────────── */
async function api(path, opts = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (S.token) h['Authorization'] = 'Bearer ' + S.token;

  // 1. Direct Cloudflare Worker API call
  if (S.api) {
    try {
      const r = await fetch(S.api + path, {
        method: opts.method || 'GET',
        headers: h,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
      });
      const data = await r.json();
      if (data && data.ok) return data;
      if (data && !data.ok) {
        if (r.status === 401 && S.token) logout(false);
        const err = new Error(data.error || 'خطای ورکر');
        err.data = data;
        if (!opts.silent) toast(data.error || 'خطایی رخ داد', 'err');
        throw err;
      }
    } catch (e) {
      if (e.data) throw e;
    }
  }

  // 2. Local express proxy (only on local development server, never on static GitHub Pages)
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.includes('run.app')) {
    try {
      const localRes = await fetch(path, {
        method: opts.method || 'GET',
        headers: h,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
      });
      if (localRes.ok) {
        const localData = await localRes.json();
        if (localData && localData.ok) return localData;
        if (localData && !localData.ok) {
          if (localRes.status === 401 && S.token) logout(false);
          const err = new Error(localData.error || 'خطای سرور');
          err.data = localData;
          if (!opts.silent) toast(localData.error || 'خطایی رخ داد', 'err');
          throw err;
        }
      }
    } catch (e) {
      if (e.data) throw e;
    }
  }

  // 3. Fallbacks for public config/stats to avoid broken UI
  if (path === '/api/public/config') {
    return {
      ok: true,
      bale_bot: (window.CODM_CFG && window.CODM_CFG.BALE_BOT_LINK) || 'https://ble.ir/codm_room_bot',
      tg_bot: (window.CODM_CFG && window.CODM_CFG.TG_BOT_LINK) || 'https://t.me/codm_room_bot',
      bale_bot_id: (window.CODM_CFG && window.CODM_CFG.BALE_BOT_ID) || 'codm_room_bot',
      tg_bot_id: (window.CODM_CFG && window.CODM_CFG.TG_BOT_ID) || 'codm_room_bot'
    };
  }
  if (path === '/api/public/stats') {
    return { ok: true, users: 0, rooms: 0, entries: 0, prizesPaid: 0 };
  }
  if (path === '/api/rooms') {
    return { ok: true, rooms: [] };
  }

  const genericErr = new Error('عدم دسترسی به سرور ورکر — لطفاً اتصال اینترنت را بررسی کنید');
  if (!opts.silent) toast('عدم دسترسی به ورکر Cloudflare', 'err');
  throw genericErr;
}

/* ─────────── ابزار UI (Toast & Modal) ─────────── */
function toast(msg, type = 'info', ms = 3200) {
  const tEl = document.createElement('div');
  tEl.className = 'toast ' + type;
  tEl.textContent = msg;
  $('#toastRoot').appendChild(tEl);
  setTimeout(() => {
    tEl.style.opacity = '0';
    tEl.style.transition = '.35s';
    setTimeout(() => tEl.remove(), 350);
  }, ms);
}

function modal(html, wide) {
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'modal-ov';
  ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><button class="mclose" onclick="closeModal()">✕</button>${html}</div>`;
  ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(); });
  $('#modalRoot').appendChild(ov);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const m = $('.modal-ov');
  if (m) m.remove();
  document.body.style.overflow = '';
}
window.closeModal = closeModal;

function copyTxt(txt) {
  navigator.clipboard.writeText(txt).then(() => {
    AudioFX.play('click');
    toast(CUR_LANG === 'en' ? 'Copied to clipboard ✅' : 'کپی شد ✅', 'ok', 1600);
  }).catch(() => {});
}
window.copyTxt = copyTxt;

/* ─────────── انیمیشن‌ها ─────────── */
const Reveal = {
  io: null,
  arm() {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!els.length) return;
    // Guaranteed fallback after 400ms so webviews or low-power modes never hide content
    setTimeout(() => {
      els.forEach((el) => el.classList.add('in'));
    }, 400);
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    if (!this.io) {
      this.io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            this.io.unobserve(e.target);
          }
        });
      }, { threshold: 0.05 });
    }
    els.forEach((el) => this.io.observe(el));
  }
};
window.Reveal = Reveal;

function countUp(el, target) {
  const n = Number(target) || 0;
  if (!el) return;
  const dur = 1000, t0 = performance.now();
  const tick = (tm) => {
    const k = Math.min(1, (tm - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    const curr = Math.round(n * eased);
    el.textContent = CUR_LANG === 'fa' ? fa(money(curr)) : money(curr);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function armStats() {
  document.querySelectorAll('[data-cnt]').forEach((el) => {
    countUp(el, el.dataset.cnt);
  });
}

/* ─────────── احراز هویت ─────────── */
function authModal(tab = 'login') {
  AudioFX.play('click');
  const isEn = CUR_LANG === 'en';
  modal(`
    <h3>${tab === 'login' ? (isEn ? '🔐 Sign In' : '🔐 ورود به حساب') : (isEn ? '🪖 Recruit Soldier' : '🪖 ساخت حساب جدید')}</h3>
    <p class="msub">${tab === 'login' ? (isEn ? 'Welcome back to the combat arena, soldier!' : 'به میدان نبرد خوش برگشتی، سرباز!') : (isEn ? 'Create your profile to join custom tournaments.' : 'حساب بساز و در روم‌ها ثبت‌نام کن.')}</p>
    <div class="field"><label>${isEn ? 'Username (English)' : 'نام کاربری (انگلیسی)'}</label><input id="au" class="ltr" placeholder="username" autocomplete="username"></div>
    <div class="field"><label>${isEn ? 'Password' : 'رمز عبور'}</label><input id="ap" type="password" class="ltr" placeholder="••••••" autocomplete="current-password"></div>
    ${tab === 'register' ? `
      <div class="field"><label>${isEn ? 'Soldier In-Game Tag (Optional)' : 'نام نمایشی یا آیدی گیمری'}</label><input id="ad" placeholder="e.g. Ghost_Sniper"></div>
      <div class="field"><label>${isEn ? 'Admin Passcode (Optional)' : 'کد مدیر (اختیاری — فقط برای مدیریت)'}</label><input id="as" class="ltr" placeholder="Admin Secret"></div>` : ''}
    <div id="authErr"></div>
    <button class="btn blk lg" onclick="doAuth('${tab}')">${tab === 'login' ? (isEn ? '🔓 Sign In' : '🔓 ورود') : (isEn ? '⚔️ Create Profile' : '⚔️ ثبت‌نام')}</button>
    <p class="msub" style="text-align:center;margin-top:14px">
      ${tab === 'login' ? (isEn ? "Don't have an account?" : 'حساب نداری؟') : (isEn ? 'Already registered?' : 'قبلاً ثبت‌نام کرده‌ای؟')}
      <a href="javascript:void(0)" style="color:var(--acc);font-weight:700" onclick="authModal('${tab === 'login' ? 'register' : 'login'}')">
        ${tab === 'login' ? (isEn ? 'Sign Up' : 'ثبت‌نام کن') : (isEn ? 'Sign In' : 'وارد شو')}
      </a>
    </p>
  `);
}
window.authModal = authModal;

async function doAuth(tab) {
  const username = $('#au').value.trim(), password = $('#ap').value;
  if (!username || !password) {
    $('#authErr').innerHTML = `<div class="malert err">${CUR_LANG === 'en' ? 'Please fill in all fields' : 'لطفاً نام کاربری و رمز را وارد کن'}</div>`;
    return;
  }
  try {
    let r;
    if (tab === 'login') {
      r = await api('/api/login', { method: 'POST', body: { username, password } });
    } else {
      r = await api('/api/register', {
        method: 'POST',
        body: { username, password, display_name: $('#ad') ? $('#ad').value.trim() : '', admin_secret: $('#as') ? $('#as').value.trim() : '' }
      });
      if (r.is_first_admin) toast('👑 شما اولین کاربر هستید — مدیر کل شدید!', 'ok', 5000);
    }
    S.token = r.token;
    localStorage.setItem('codm_token', r.token);
    S.me = r.user;
    closeModal();
    AudioFX.play('lock');
    toast((CUR_LANG === 'en' ? 'Welcome Soldier ' : 'خوش آمدی ') + (r.user.display_name || r.user.username) + ' 🪖', 'ok');
    renderTop();
    route();
  } catch (e) {
    $('#authErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`;
  }
}
window.doAuth = doAuth;

function logout(go = true) {
  api('/api/logout', { method: 'POST', silent: true }).catch(() => {});
  S.token = '';
  S.me = null;
  localStorage.removeItem('codm_token');
  renderTop();
  AudioFX.play('click');
  if (go) { location.hash = '#/'; route(); }
}
window.logout = logout;

/* ─────────── هدر و دکمه‌های بالا ─────────── */
function renderTop() {
  const el = $('#topActions');
  const mobNavEl = $('#mainnavMobActions');
  const isEn = CUR_LANG === 'en';

  if (S.me) {
    if (el) {
      el.innerHTML = `
        ${S.me.role === 'admin' ? `<a class="btn ghost sm" href="#/admin">🛡 <span class="topActionsAdminTxt">${t('adminPanel')}</span></a>` : ''}
        <div class="userchip" onclick="location.hash='#/profile'" title="${isEn ? 'My Profile' : 'حساب من'}">
          <span class="nm">${esc(S.me.display_name || S.me.username)}</span>
          <span class="wal">${isEn ? money(S.me.wallet) + ' T' : fa(money(S.me.wallet)) + ' ت'}</span>
        </div>`;
    }
    if (mobNavEl) {
      mobNavEl.innerHTML = `
        <div class="mob-user-summary">
          <b>🪖 ${esc(S.me.display_name || S.me.username)}</b>
          <span style="color:var(--acc2);font-weight:800">${isEn ? money(S.me.wallet) + ' T' : fa(money(S.me.wallet)) + ' ت'}</span>
        </div>
        <a href="#/profile" class="mob-nav-act-btn" onclick="$('#mainnav').classList.remove('openm')">👤 ${isEn ? 'My Profile & Wallet' : 'حساب من و کیف پول'}</a>
        ${S.me.role === 'admin' ? `<a href="#/admin" class="mob-nav-act-btn adm" onclick="$('#mainnav').classList.remove('openm')">🛡 ${isEn ? 'Admin Headquarters' : 'پنل مدیریت'}</a>` : ''}
        <button class="mob-nav-act-btn bad" onclick="$('#mainnav').classList.remove('openm');logout()">🚪 ${isEn ? 'Log Out' : 'خروج از حساب'}</button>
      `;
    }
  } else {
    if (el) {
      el.innerHTML = `<button class="btn sm pulse-btn" onclick="authModal('login')">${t('loginRegister')}</button>`;
    }
    if (mobNavEl) {
      mobNavEl.innerHTML = `
        <button class="mob-nav-act-btn primary" onclick="$('#mainnav').classList.remove('openm');authModal('login')">🔐 ${isEn ? 'Sign In / Register' : 'ورود به حساب / ثبت‌نام'}</button>
        <a href="https://ble.ir/codm_room_bot" target="_blank" rel="noopener" class="mob-nav-act-btn bale">💬 ${isEn ? 'Bale Bot (Receipts)' : 'ربات بله (ارسال فیش)'}</a>
        <a href="https://t.me/codm_room_bot" target="_blank" rel="noopener" class="mob-nav-act-btn tg">📱 ${isEn ? 'Telegram Bot' : 'ربات تلگرام'}</a>
      `;
    }
  }
}
window.renderTop = renderTop;

/* ─────────── روتر برنامه ─────────── */
async function route() {
  const h = (location.hash || '#/').slice(1);
  const app = $('#app');
  const parts = h.split('/').filter(Boolean);
  const rootPart = parts[0] || 'home';

  $$('.mainnav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === rootPart));
  $$('.mob-nav-item').forEach((a) => a.classList.toggle('on', a.dataset.nav === rootPart));

  if (window.FX) FX.wipe();
  window.scrollTo({ top: 0 });

  try {
    if (!parts.length || rootPart === 'home') await viewHome();
    else if (rootPart === 'rooms') await viewRooms();
    else if (rootPart === 'room' && parts[1]) await viewRoom(parseInt(parts[1], 10) || 1);
    else if (rootPart === 'meta') viewMeta();
    else if (rootPart === 'dogtag') viewDogtag();
    else if (rootPart === 'profile') await viewProfile();
    else if (rootPart === 'admin') await viewAdmin();
    else if (rootPart === 'help') viewHelp();
    else await viewHome();
  } catch (e) {
    app.innerHTML = `
      <div class="empty">
        <div class="big">💀</div>
        <h2>${CUR_LANG === 'en' ? 'Signal Interrupted' : 'مشکلی پیش آمد'}</h2>
        <p class="mut">${esc(e.message || '')}</p><br>
        <button class="btn" onclick="route()">🔄 ${CUR_LANG === 'en' ? 'Retry Connection' : 'تلاش دوباره'}</button>
      </div>`;
  }
}
window.route = route;

/* ─────────── ویو ۱: صفحه خانه (Home) ─────────── */
async function viewHome() {
  let stats = { users: 0, rooms: 0, entries: 0, prizesPaid: 0 };
  try {
    const s = await api('/api/public/stats', { silent: true });
    if (s && s.ok) {
      stats.users = Number(s.users) || 0;
      stats.rooms = Number(s.rooms) || 0;
      stats.entries = Number(s.entries) || 0;
      stats.prizesPaid = Number(s.prizesPaid) || 0;
    }
  } catch (e) {}

  const isEn = CUR_LANG === 'en';
  const cfg = S.cfg || {};

  $('#app').innerHTML = `
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hud-ring" aria-hidden="true"></div>
    <div class="hud-cross" aria-hidden="true"></div>
    <div class="hud-bracket tl" aria-hidden="true"></div>
    <div class="hud-bracket br" aria-hidden="true"></div>
    <div class="hero-in">
      <span class="hero-kicker">${t('heroKicker')}</span>
      <h1>${t('heroTitle1')} <span class="glow glitch" data-text="${t('heroBattlefield')}">${t('heroBattlefield')}</span> ${t('heroTitle2')}</h1>
      <p class="sub">${t('heroSub')}</p>
      <div class="hero-cta">
        <button class="btn lg" onclick="AudioFX.play('click');location.hash='#/rooms'">${t('heroBtnRooms')}</button>
        ${S.me ? `
          <button class="btn ghost lg" onclick="AudioFX.play('click');location.hash='#/profile'">👤 ${isEn ? 'My Profile & Wallet' : 'حساب من و کیف پول'}</button>
        ` : `
          <button class="btn ghost lg pulse-btn" onclick="AudioFX.play('click');authModal('login')">🔐 ${isEn ? 'Sign In / Register' : 'ورود / ساخت حساب'}</button>
        `}
        <button class="btn ghost lg" onclick="AudioFX.play('click');location.hash='#/meta'">${isEn ? '🔫 Meta Gunsmith' : '🔫 لوداوت‌های متای سیزن'}</button>
        <button class="btn ghost lg" onclick="AudioFX.play('click');location.hash='#/dogtag'">${isEn ? '🎖️ 3D Dogtag Card' : '🎖️ ساخت کارت گیمری'}</button>
      </div>

      <!-- نوار سریع ربات‌ها درست در قلب هیرو -->
      <div class="hero-bot-bar">
        <div class="hbb-title">⚡ ${isEn ? 'OFFICIAL BOTS FOR PAYMENTS & NOTIFICATIONS:' : 'ربات‌های رسمی برای ثبت‌نام، پرداخت و ارسال فیش:'}</div>
        <div class="hbb-links">
          <a href="${cfg.bale_bot || 'https://ble.ir/codm_room_bot'}" target="_blank" rel="noopener" class="btn bale">
            💬 ${isEn ? 'Bale Bot: @' : 'ربات رسمی بله: @'}${esc(cfg.bale_bot_id || 'codm_room_bot')} <span class="hbb-badge">${isEn ? 'RECEIPTS' : 'ارسال فیش'}</span>
          </a>
          <a href="${cfg.tg_bot || 'https://t.me/codm_room_bot'}" target="_blank" rel="noopener" class="btn tg-btn">
            📱 ${isEn ? 'Telegram Bot: @' : 'ربات تلگرام: @'}${esc(cfg.tg_bot_id || 'codm_room_bot')} <span class="hbb-badge">${isEn ? 'ALERTS' : 'اطلاع‌رسانی'}</span>
          </a>
        </div>
      </div>

      <div class="hero-badges">
        <div class="hbadge">${t('badgeReg')}</div>
        <div class="hbadge">${t('badgePay')}</div>
        <div class="hbadge">${t('badgeBot')}</div>
        <div class="hbadge">${t('badgePrize')}</div>
      </div>
      <div class="term ltr" data-text="TACTICAL LINK ESTABLISHED // CODM ROOMS PLATFORM // PING: 21MS // ENCRYPTION: ACTIVE" aria-hidden="true"></div>
    </div>
  </section>

  <div class="stats-strip">
    <div class="stats-grid">
      <div class="stat"><div class="v" data-cnt="${stats.users}">۰</div><div class="l">${t('statUsers')}</div></div>
      <div class="stat"><div class="v" data-cnt="${stats.rooms}">۰</div><div class="l">${t('statRooms')}</div></div>
      <div class="stat"><div class="v" data-cnt="${stats.entries}">۰</div><div class="l">${t('statEntries')}</div></div>
      <div class="stat"><div class="v" data-cnt="${stats.prizesPaid}">۰</div><div class="l">${t('statPrizes')}</div></div>
    </div>
  </div>

  <!-- بخش اختصاصی ربات‌های بله و تلگرام (منبع ثبت‌نام و پرداخت) -->
  <section class="sec" style="padding-top:20px">
    <div class="sec-head">
      <h2>🤖 ${isEn ? 'OFFICIAL COMBAT BOTS' : 'ربات‌های رسمی'} <span>${isEn ? 'BALE & TELEGRAM' : 'بله و تلگرام'}</span></h2>
      <p>${isEn ? 'Register, pick slots, and upload payment receipts directly through Bale and Telegram bots with unified D1 database' : 'ثبت‌نام، انتخاب اسلات و ارسال عکس فیش پرداخت مستقیماً از طریق ربات بله و تلگرام متصل به همین دیتابیس'}</p>
    </div>
    <div class="bots-grid" style="margin:0 auto">
      <a class="botcard" href="${cfg.bale_bot || 'https://ble.ir/codm_room_bot'}" target="_blank" rel="noopener">
        <div class="bic">💬</div>
        <h3>${isEn ? 'Bale Combat Bot (Payment & Receipts)' : 'ربات رسمی بله (درگاه پرداخت و فیش)'}</h3>
        <div class="bid ltr">@${esc(cfg.bale_bot_id || 'codm_room_bot')}</div>
        <small>${isEn ? 'Primary channel for card-to-card receipt uploads' : 'مرکز اصلی ارسال عکس رسید کارت‌به‌کارت و تایید سریع'}</small>
      </a>
      <a class="botcard" href="${cfg.tg_bot || 'https://t.me/codm_room_bot'}" target="_blank" rel="noopener">
        <div class="bic">📱</div>
        <h3>${isEn ? 'Telegram Tournament Bot' : 'ربات رسمی تلگرام'}</h3>
        <div class="bid ltr">@${esc(cfg.tg_bot_id || 'codm_room_bot')}</div>
        <small>${isEn ? 'Instant room credentials, alerts, and management' : 'اطلاع‌رسانی Room ID و رمز، ثبت‌نام و پشتیبانی'}</small>
      </a>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head reveal">
      <h2>${t('whyTitle')} <span>CODM ROOMS</span>؟</h2>
      <p>${t('whySub')}</p>
    </div>
    <div class="feat-grid">
      <div class="feat reveal rv-d1"><div class="ic">🗺</div><h3>${t('featMapTitle')}</h3><p>${t('featMapDesc')}</p></div>
      <div class="feat reveal rv-d2"><div class="ic">💳</div><h3>${t('featPayTitle')}</h3><p>${t('featPayDesc')}</p></div>
      <div class="feat reveal rv-d3"><div class="ic">🤖</div><h3>${t('featBotTitle')}</h3><p>${t('featBotDesc')}</p></div>
      <div class="feat reveal rv-d4"><div class="ic">🏆</div><h3>${t('featPrizeTitle')}</h3><p>${t('featPrizeDesc')}</p></div>
      <div class="feat reveal rv-d5"><div class="ic">🎯</div><h3>${t('featRefTitle')}</h3><p>${t('featRefDesc')}</p></div>
    </div>
  </section>

  <section class="sec" style="padding-top:10px">
    <div class="sec-head reveal"><h2>${t('stepsTitle')}</h2></div>
    <div class="steps">
      <div class="step reveal rv-d1"><h3>${t('step1Title')}</h3><p>${t('step1Desc')}</p></div>
      <div class="step reveal rv-d2"><h3>${t('step2Title')}</h3><p>${t('step2Desc')}</p></div>
      <div class="step reveal rv-d3"><h3>${t('step3Title')}</h3><p>${t('step3Desc')}</p></div>
      <div class="step reveal rv-d4"><h3>${t('step4Title')}</h3><p>${t('step4Desc')}</p></div>
    </div>
  </section>

  <div class="cta-box reveal">
    <div class="cta-in">
      <h2>${t('ctaTitle')}</h2>
      <p>${t('ctaSub')}</p>
      <button class="btn lg" onclick="AudioFX.play('click');location.hash='#/rooms'">${t('ctaBtn')}</button>
    </div>
  </div>`;

  Reveal.arm();
  armStats();
  if (window.FX) FX.home();
}

/* ─────────── ویو ۲: لیست روم‌ها (Rooms) ─────────── */
const RF = { status: 'open', mode: 'all' };

async function viewRooms() {
  $('#app').innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head reveal">
      <h2>🎮 <span>${t('roomsTitle')}</span></h2>
      <p>${t('roomsSub')}</p>
    </div>
    <div class="filters" id="rfilters"></div>
    <div class="rooms-grid" id="roomsGrid"><div class="empty" style="grid-column:1/-1;padding:40px">⏳ ${CUR_LANG === 'en' ? 'Scanning combat frequencies...' : 'در حال بارگذاری روم‌ها...'}</div></div>
  </section>`;
  renderFilters();
  await loadRooms();
}

function renderFilters() {
  const isEn = CUR_LANG === 'en';
  const st = [
    ['open', t('statusOpen')],
    ['all', t('statusAll')],
    ['full', t('statusFull')],
    ['running', t('statusRunning')],
    ['finished', t('statusFinished')]
  ];
  const modes = [
    ['all', t('allModes')],
    ...Object.keys(MODES).map((k) => [k, isEn ? MODES[k].en : MODES[k].fa])
  ];

  $('#rfilters').innerHTML =
    st.map(([v, l]) => `<button class="chip ${RF.status === v ? 'on' : ''}" onclick="AudioFX.play('click');setF('status','${v}')">${l}</button>`).join('') +
    `<select class="chip" onchange="AudioFX.play('click');setF('mode',this.value)">${modes.map(([v, l]) => `<option value="${v}" ${RF.mode === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
}

window.setF = (k, v) => {
  RF[k] = v;
  renderFilters();
  loadRooms();
};

async function loadRooms() {
  const g = $('#roomsGrid');
  if (!g) return;
  try {
    const r = await api(`/api/rooms?status=${RF.status}&mode=${RF.mode}`);
    const rooms = r.rooms || [];
    if (!rooms.length) {
      g.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <div class="big">🕹</div>
          <h3>${CUR_LANG === 'en' ? 'No active combat rooms match these filters' : 'رومی با این فیلترها پیدا نشد'}</h3>
          <p class="mut">${CUR_LANG === 'en' ? 'Adjust filters or check back shortly' : 'فیلترها را عوض کن یا بعداً سر بزن'}</p>
        </div>`;
      Reveal.arm();
      return;
    }
    g.innerHTML = rooms.map((rm, i) => roomCard(rm).replace('class="room-card"', `class="room-card reveal rv-d${(i % 5) + 1}"`)).join('');
    Reveal.arm();
  } catch (e) {
    g.innerHTML = `<div class="empty" style="grid-column:1/-1">⚠️ ${CUR_LANG === 'en' ? 'Error loading rooms' : 'خطا در دریافت روم‌ها'}</div>`;
  }
}

function roomCard(rm) {
  const isEn = CUR_LANG === 'en';
  const m = MODES[rm.mode] || MODES.custom;
  const total = rm.total || rm.max_players || 10;
  const paid = rm.paid || 0;
  const pct = total ? Math.round((paid / total) * 100) : 0;
  const statusInfo = RSTATUS[rm.status] || ['پایان', 'ENDED', 'finished'];
  const stLabel = isEn ? statusInfo[1] : statusInfo[0];
  const stClass = statusInfo[2];

  return `
  <div class="room-card" onclick="AudioFX.play('click');location.hash='#/room/${rm.id}'">
    <div class="room-top">
      <div class="room-mode">${m.emoji}</div>
      <div class="room-tt">
        <h3>${esc(rm.title)}</h3>
        <div class="mm">${isEn ? m.en : m.fa}${rm.map_name ? ' • 🗺 ' + esc(rm.map_name) : ''}</div>
      </div>
      <span class="rbadge ${stClass}">${stLabel}</span>
    </div>
    <div class="room-mid">
      <div><span class="k">💰 ${t('entryFee')}: </span><span class="v fee">${rm.entry_fee > 0 ? (isEn ? money(rm.entry_fee) + ' T' : fa(money(rm.entry_fee)) + ' ت') : t('free')}</span></div>
      <div><span class="k">🏆 ${t('prizePool')}: </span><span class="v prize">${rm.prize_pool > 0 ? (isEn ? money(rm.prize_pool) + ' T' : fa(money(rm.prize_pool)) + ' ت') : '—'}</span></div>
      <div><span class="k">👥 ${t('layout')}: </span><span class="v">${isEn ? `${rm.teams || 2}x${rm.team_size || 4}` : `${fa(rm.teams || 2)}×${fa(rm.team_size || 4)}`}</span></div>
      <div><span class="k">🕒 ${t('start')}: </span><span class="v">${esc(rm.start_time) || '—'}</span></div>
    </div>
    <div class="slotbar">
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      <div class="lbl">
        <span>${isEn ? `${paid}/${total} ${t('players')}` : `${fa(paid)}/${fa(total)} ${t('players')}`}</span>
        <span>${isEn ? `${pct}% ${t('filled')}` : `${fa(pct)}٪ ${t('filled')}`}</span>
      </div>
    </div>
    <div class="room-bot"><button class="btn blk sm">${t('viewAndReserve')}</button></div>
  </div>`;
}

/* ─────────── ویو ۳: جزئیات روم + نقشه اسلات‌ها ─────────── */
let CUR_ROOM = null;

async function viewRoom(id) {
  const isEn = CUR_LANG === 'en';
  const app = $('#app');
  app.innerHTML = `<div class="roomwrap"><div class="empty" style="padding:40px">⏳ ${isEn ? 'Loading tournament roster...' : 'در حال بارگذاری روم...'}</div></div>`;

  let r;
  try {
    r = await api('/api/rooms/' + id);
  } catch (e) {
    return;
  }
  CUR_ROOM = r;
  const rm = r.room, m = MODES[rm.mode] || MODES.custom;
  const statusInfo = RSTATUS[rm.status] || ['پایان', 'ENDED', 'finished'];
  const stLabel = isEn ? statusInfo[1] : statusInfo[0];
  const stClass = statusInfo[2];
  const totalSlots = (r.counts && r.counts.total) || rm.max_players || 10;
  const paidSlots = (r.counts && r.counts.paid) || 0;
  const pct = totalSlots ? Math.round((paidSlots / totalSlots) * 100) : 0;
  const mySlot = (r.slots || []).find((s) => S.me && s.user_id === S.me.id);

  const teams = {};
  (r.slots || []).forEach((s) => {
    (teams[s.team_label] = teams[s.team_label] || []).push(s);
  });

  // Room ID and password (visible only to admin or confirmed paid players)
  let codemap = '';
  if (rm.room_id && rm.room_pass) {
    const canSee = S.me && (S.me.role === 'admin' || (mySlot && mySlot.status === 'paid'));
    codemap = `
      <div class="codemap" style="background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:16px;margin:18px 0">
        <div class="row" style="font-weight:800;color:var(--acc2);margin-bottom:8px"><span>🔓 اطلاعات ورود به روم ${canSee ? '' : '<small class="mut">(فقط بازیکنان قطعی)</small>'}</span></div>
        ${canSee ? `
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
            <div><span>🆔 Room ID: </span><code>${esc(rm.room_id)}</code> <button class="btn sm ghost" onclick="copyTxt('${esc(rm.room_id)}')">📋 کپی</button></div>
            <div><span>🔑 رمز: </span><code>${esc(rm.room_pass)}</code> <button class="btn sm ghost" onclick="copyTxt('${esc(rm.room_pass)}')">📋 کپی</button></div>
          </div>` : `<div class="mut" style="font-size:12.5px">🔒 اطلاعات روم پس از تایید نهایی پرداخت نمایش داده می‌شود.</div>`}
      </div>`;
  }

  // Admin action controls
  const adminBar = S.me && S.me.role === 'admin' ? `
    <div class="roomdesc" style="border-color:rgba(255,159,26,.45);margin-top:20px">
      <b>🛡 ابزارهای ادمین:</b>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn sm info" onclick="publishModal(${rm.id}, '${esc(rm.room_id || '')}', '${esc(rm.room_pass || '')}')">🔓 ارسال ID/Pass به بازیکنان</button>
        <button class="btn sm good" onclick="roomStatusAction(${rm.id}, 'running')">▶️ شروع مسابقه</button>
        <button class="btn sm ghost" onclick="roomStatusAction(${rm.id}, 'finished')">🏁 پایان مسابقه</button>
        <button class="btn sm bad" onclick="roomStatusAction(${rm.id}, 'cancelled')">❌ لغو روم و بازگشت وجه</button>
        <button class="btn sm ghost" onclick="editRoomModal(${rm.id})">✏️ ویرایش مشخصات</button>
        <button class="btn sm bad" onclick="delRoomAction(${rm.id})">🗑 حذف روم</button>
      </div>
    </div>` : '';

  app.innerHTML = `
  <div class="roomwrap">
    <div class="crumb" onclick="AudioFX.play('click');location.hash='#/rooms'">${t('backToRooms')}</div>
    <div class="room-hero reveal">
      <div class="info">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div class="room-mode" style="width:56px;height:56px;font-size:27px">${m.emoji}</div>
          <div><h1>${esc(rm.title)}</h1><span class="rbadge ${stClass}">${stLabel}</span></div>
        </div>
        <div class="meta">
          <span>🎮 <b>${isEn ? m.en : m.fa}</b></span>
          ${rm.map_name ? `<span>🗺 ${isEn ? 'Map' : 'نقشه'}: <b>${esc(rm.map_name)}</b></span>` : ''}
          <span>👥 <b>${isEn ? `${rm.teams} Teams × ${rm.team_size} Players` : `${fa(rm.teams)} تیم × ${fa(rm.team_size)} نفر`}</b></span>
          ${rm.start_time ? `<span>🕒 ${isEn ? 'Start' : 'شروع'}: <b>${esc(rm.start_time)}</b></span>` : ''}
        </div>
      </div>
      <div class="pricebox">
        <div class="pp">${rm.entry_fee > 0 ? (isEn ? money(rm.entry_fee) : fa(money(rm.entry_fee))) : t('free')}<small style="font-size:11px;color:var(--mut)">${rm.entry_fee > 0 ? ' ' + t('toman') : ''}</small></div>
        <div class="pl">${isEn ? 'Per Player Entry' : 'ورودی هر بازیکن'}</div>
        ${rm.prize_pool > 0 ? `<div style="margin-top:10px;font-size:13px;color:var(--good)">🏆 ${t('prizePool')}: ${isEn ? money(rm.prize_pool) + ' T' : fa(money(rm.prize_pool)) + ' ت'}</div>` : ''}
      </div>
    </div>

    ${rm.description ? `<div class="roomdesc">📝 <b>${isEn ? 'Description' : 'توضیحات'}:</b> ${esc(rm.description)}</div>` : ''}
    ${rm.rules ? `<div class="roomdesc">📜 <b>${isEn ? 'Rules' : 'قوانین'}:</b> ${esc(rm.rules)}</div>` : ''}
    ${codemap}

    ${mySlot ? `
      <div class="roomdesc" style="border-color:rgba(255,159,26,.5)">
        🎯 <b>${isEn ? 'Your Slot' : 'جایگاه تو'}:</b> ${esc(mySlot.team_label)} / شماره ${isEn ? mySlot.slot_no : fa(mySlot.slot_no)} — ${mySlot.status === 'paid' ? '✅ ' + (isEn ? 'Confirmed' : 'قطعی شد') : '⏳ ' + (isEn ? 'Pending Payment Approval' : 'در انتظار تایید پرداخت')}
        ${rm.status === 'open' ? `<button class="btn sm bad" style="margin-inline-start:12px" onclick="leaveRoomAction(${rm.id})">↩️ ${isEn ? 'Leave & Refund' : 'انصراف و عودت وجه'}</button>` : ''}
      </div>` : ''}

    <div class="slots-title reveal">
      <h2>🎯 ${isEn ? 'Tactical Squad Board' : 'نقشه موقعیت اسکوادها'}</h2>
      <span class="hint">${isEn ? '🟢 Free — ⏳ Pending — 🔒 Confirmed' : '🟢 آزاد — ⏳ در انتظار پرداخت — 🔒 قطعی'}</span>
    </div>

    ${Object.keys(teams).map((tl) => `
      <div class="team-sec">
        <div class="team-lbl">🪖 ${esc(tl)}</div>
        <div class="slotrow">
          ${teams[tl].map((s, si) => {
            const isMine = S.me && s.user_id === S.me.id;
            const who = s.status === 'free' ? (isEn ? 'FREE' : 'آزاد') : (isMine ? (isEn ? 'YOU!' : 'تو!') : (s.status === 'pending' ? (isEn ? 'PENDING' : 'رزرو موقت') : esc(s.display_name || s.username || (isEn ? 'Soldier' : 'بازیکن'))));
            return `
              <div class="slot ${s.status} ${isMine ? 'mine' : ''}" style="--si:${si}" onclick="slotClick(${s.slot_no},'${s.status}',${isMine ? 1 : 0},${rm.status === 'open' ? 1 : 0})">
                <div class="no">${isEn ? s.slot_no : fa(s.slot_no)}</div>
                <div class="who">${who}</div>
              </div>`;
          }).join('')}
        </div>
      </div>`).join('')}

    <div class="players-list">
      <h3>✅ ${isEn ? `Confirmed Players (${paidSlots}/${totalSlots})` : `بازیکنان قطعی (${fa(paidSlots)}/${fa(totalSlots)})`}</h3>
      <div class="bar" style="height:7px;background:var(--bg2);border-radius:100px;overflow:hidden;border:1px solid var(--line);margin-bottom:14px">
        <div class="fill" style="height:100%;width:${pct}%;background:var(--grad)"></div>
      </div>
      <div class="plist">
        ${(r.slots || []).filter((s) => s.status === 'paid').map((s) => `
          <div class="pitem">
            <span class="pn">${isEn ? s.slot_no : fa(s.slot_no)}</span>
            <span>${esc(s.display_name || s.username || '—')}</span>
            <small class="mut">${esc(s.team_label)}</small>
          </div>`).join('') || `<span class="mut">${isEn ? 'No confirmed players yet — be the first to lock in! 🔥' : 'هنوز کسی قطعی نشده — اولین نفر باش! 🔥'}</span>`}
      </div>
      ${S.me && S.me.role === 'admin' && (r.slots || []).some((s) => s.status !== 'free') ? `
        <div style="margin-top:16px;border-top:1px dashed var(--line);padding-top:10px">
          <b style="font-size:12.5px;color:var(--bad)">🛡 حذف بازیکن متخلف:</b>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            ${(r.slots || []).filter((s) => s.status !== 'free').map((s) => `
              <button class="btn sm bad ghost" onclick="removeSlotAction(${rm.id}, ${s.slot_no})">✖ #${s.slot_no} - ${esc(s.display_name || s.username || '?')}</button>
            `).join('')}
          </div>
        </div>` : ''}
    </div>
    ${adminBar}
  </div>`;
  Reveal.arm();
}

window.slotClick = (no, status, isMine, canJoin) => {
  AudioFX.play('click');
  if (!S.me) return authModal('login');
  if (isMine) return toast(CUR_LANG === 'en' ? 'This slot is already yours 🙂' : 'این جایگاه مال خودت است 🙂', 'info');
  if (status !== 'free') return toast(CUR_LANG === 'en' ? 'Slot already claimed — pick another' : 'این جایگاه رزرو شده — یکی دیگر را انتخاب کن', 'err');
  if (!canJoin) return toast(CUR_LANG === 'en' ? 'Tournament is currently closed' : 'این روم در وضعیت فعلی قابل ثبت‌نام نیست', 'err');

  joinModal(CUR_ROOM.room.id, no);
};

/* ─────────── مودال انتخاب روش پرداخت و ارتباط با ربات بله ─────────── */
function joinModal(roomId, slotNo) {
  const fee = CUR_ROOM.room.entry_fee;
  const cfg = S.cfg || {};
  const isEn = CUR_LANG === 'en';
  AudioFX.play('lock');

  if (fee === 0) {
    modal(`
      <h3>🎁 ${isEn ? 'Free Tournament Entry' : 'ثبت‌نام در روم رایگان'}</h3>
      <p class="msub">${isEn ? `Slot #${slotNo} in ${esc(CUR_ROOM.room.title)}` : `رزرو موقعیت شماره ${fa(slotNo)} در روم «${esc(CUR_ROOM.room.title)}»`}</p>
      <button class="btn blk lg good" onclick="doJoin(${roomId}, ${slotNo}, 'free')">✅ ${isEn ? 'Confirm Free Slot' : 'تایید و ثبت‌نام قطعی'}</button>
    `);
    return;
  }

  modal(`
    <h3>🎯 ${isEn ? `Lock Slot #${slotNo}` : `رزرو موقعیت شماره ${fa(slotNo)}`}</h3>
    <p class="msub">${esc(CUR_ROOM.room.title)}</p>

    <div style="background:var(--bg2);padding:14px;border-radius:10px;border:1px solid var(--line);margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>${t('entryFee')}:</span><b style="color:var(--acc2)">${isEn ? money(fee) + ' Toman' : fa(money(fee)) + ' تومان'}</b></div>
      <div style="display:flex;justify-content:space-between"><span>${isEn ? 'Your Wallet' : 'موجودی کیف پول شما'}:</span><b>${isEn ? money(S.me.wallet) + ' Toman' : fa(money(S.me.wallet)) + ' تومان'}</b></div>
    </div>

    <div class="field">
      <label>🎯 ${isEn ? 'Friend Referral Code (Optional)' : 'کد معرف دوستت (اختیاری)'}</label>
      <input id="joinRefCode" class="ltr" placeholder="e.g. 7X9K2W">
      <div class="hint">${isEn ? 'Rewards will be credited to your friend upon entry verification!' : 'با وارد کردن کد دوستت، پس از تایید پرداخت پاداش نقدی به کیف پول او واریز می‌شود!'}</div>
    </div>

    <div style="margin-bottom:12px;font-weight:700;font-size:13px;color:var(--acc2)">👇 ${isEn ? 'Choose Payment Method' : 'روش پرداخت را انتخاب کن'}:</div>

    <!-- ۱. پرداخت از کیف پول -->
    <button class="payopt" onclick="doJoin(${roomId}, ${slotNo}, 'wallet')">
      <div class="pi">💼</div>
      <div class="pt">
        <b>${isEn ? 'Pay with Wallet Balance' : 'پرداخت آنی از کیف پول'}</b>
        <small>${isEn ? 'Instant slot confirmation' : 'تایید فوری بدون نیاز به ارسال فیش'}</small>
      </div>
    </button>

    <!-- ۲. کارت به کارت + ارسال فیش در ربات بله -->
    <button class="payopt" onclick="doJoin(${roomId}, ${slotNo}, 'card')">
      <div class="pi">💳</div>
      <div class="pt">
        <b>${isEn ? 'Card to Card (Upload receipt in Bale Bot)' : 'کارت به کارت + ارسال عکس فیش در ربات بله'}</b>
        <small>${isEn ? 'Send transfer proof to Bale bot for instant admin verification' : 'انتقال کارت به کارت و ارسال عکس فیش در ربات بله'}</small>
      </div>
    </button>

    <!-- ۳. درگاه آنلاین -->
    ${cfg.has_gateway ? `
      <button class="payopt" onclick="doJoin(${roomId}, ${slotNo}, 'online')">
        <div class="pi">🏦</div>
        <div class="pt">
          <b>${isEn ? 'Online Payment Gateway' : 'درگاه پرداخت آنلاین شتابی'}</b>
          <small>${isEn ? 'Instant gateway checkout' : 'پرداخت مستقیم با درگاه بانکی'}</small>
        </div>
      </button>` : ''}
  `);
}

async function doJoin(roomId, slotNo, method) {
  const refCode = $('#joinRefCode') ? $('#joinRefCode').value.trim() : '';
  try {
    AudioFX.play('click');
    const r = await api(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      body: { slot_no: slotNo, method, referral_code: refCode }
    });

    if (method === 'free' || method === 'wallet') {
      closeModal();
      AudioFX.play('headshot');
      toast(CUR_LANG === 'en' ? 'Slot confirmed successfully! 🎮' : 'جایگاه با موفقیت قطعی شد! 🎮', 'ok');
      viewRoom(roomId);
      return;
    }

    // Method is CARD -> Show payment details and direct deep links to Bale & Telegram bots
    if (method === 'card') {
      const card = r.card || {};
      const cfg = S.cfg || {};
      const baleBotId = cfg.bale_bot_id || 'codm_room_bot';
      const tgBotId = cfg.tg_bot_id || 'codm_room_bot';
      const baleDeepLink = `https://ble.ir/${baleBotId}?start=pay_${r.payment_id}`;
      const tgDeepLink = `https://t.me/${tgBotId}?start=pay_${r.payment_id}`;

      modal(`
        <h3>💳 ${CUR_LANG === 'en' ? 'Card to Card Payment' : 'اطلاعات پرداخت کارت به کارت'}</h3>
        <p class="msub">موقعیت شماره ${fa(slotNo)} موقتاً برای شما رزرو شد. برای قطعی شدن، عکس فیش را ارسال کنید.</p>

        <div class="cardinfo">
          <div class="cnum" onclick="copyTxt('${esc(card.number)}')">${esc(card.number) || '—'}</div>
          <div class="cnm"><b>${esc(card.name) || 'صاحب حساب'}</b> ${card.bank ? `(${esc(card.bank)})` : ''}</div>
          <div style="margin-top:8px;font-size:15px;color:var(--acc2);font-weight:800">مبلغ: ${fa(money(r.fee))} تومان</div>
          <button class="copybtn" onclick="copyTxt('${esc(card.number)}')">📋 کپی شماره کارت</button>
        </div>

        <div class="paysteps">
          <div><b>۱.</b> مبلغ دقیق <b>${fa(money(r.fee))} تومان</b> را به شماره کارت بالا واریز کنید.</div>
          <div><b>۲.</b> با دکمه زیر وارد <b>ربات بله</b> شوید و <b>عکس رسید</b> را ارسال کنید (شناسه پرداخت خودکار ست شده است):</div>
        </div>

        <!-- دکمه رفتن به ربات بله -->
        <a class="btn blk lg bale" href="${baleDeepLink}" target="_blank" rel="noopener" style="margin-bottom:10px;text-align:center">
          💬 رفتن به ربات بله و ارسال عکس فیش
        </a>

        <!-- دکمه ربات تلگرام -->
        <a class="btn blk sm ghost" href="${tgDeepLink}" target="_blank" rel="noopener" style="margin-bottom:16px;text-align:center">
          📱 یا ارسال فیش در ربات تلگرام
        </a>

        <!-- ثبت اختیاری کد پیگیری -->
        <div class="field" style="border-top:1px solid var(--line);padding-top:14px">
          <label>کد پیگیری بانکی (اختیاری):</label>
          <div style="display:flex;gap:8px">
            <input id="refInputCode" class="ltr" placeholder="کد رهگیری">
            <button class="btn sm" onclick="submitRefCode(${r.payment_id})">ثبت کد</button>
          </div>
        </div>

        <button class="btn blk ghost" onclick="closeModal();viewRoom(${roomId})">✔️ متوجه شدم، بازگشت به روم</button>
      `);
      return;
    }

    if (method === 'online' && r.gateway_url) {
      location.href = r.gateway_url;
    }
  } catch (e) {
    if (e.data && e.data.need === 'topup') {
      topupModal();
    }
  }
}
window.doJoin = doJoin;

async function submitRefCode(payId) {
  const code = $('#refInputCode').value.trim();
  if (!code) return;
  try {
    await api(`/api/payments/${payId}/ref`, { method: 'POST', body: { ref_code: code } });
    toast('کد پیگیری با موفقیت ثبت شد ✅', 'ok');
  } catch (e) {}
}
window.submitRefCode = submitRefCode;

/* ─────────── ابزارهای ادمین روم در صفحه روم ─────────── */
async function publishModal(roomId, curId, curPass) {
  modal(`
    <h3>🔓 ارسال مشخصات روم به بازیکنان</h3>
    <p class="msub">اطلاعات برای تمام بازیکنانی که پرداختشان قطعی است در سایت و ربات‌ها ارسال می‌شود.</p>
    <div class="field"><label>Room ID</label><input id="pubRid" class="ltr" value="${esc(curId)}"></div>
    <div class="field"><label>Password</label><input id="pubPass" class="ltr" value="${esc(curPass)}"></div>
    <button class="btn blk good" onclick="doPublish(${roomId})">🚀 ذخیره و ارسال آنی</button>
  `);
}
window.publishModal = publishModal;

async function doPublish(roomId) {
  const room_id = $('#pubRid').value.trim();
  const room_pass = $('#pubPass').value.trim();
  try {
    const r = await api(`/api/rooms/${roomId}/publish`, { method: 'POST', body: { room_id, room_pass } });
    closeModal();
    AudioFX.play('lock');
    toast(`مشخصات روم برای ${r.notified || 0} بازیکن ارسال شد ✅`, 'ok');
    viewRoom(roomId);
  } catch (e) {}
}
window.doPublish = doPublish;

async function roomStatusAction(roomId, status) {
  if (status === 'cancelled' && !confirm('آیا از لغو روم مطمئن هستید؟ ورودی تمام بازیکنان به کیف پولشان بازگردانده می‌شود.')) return;
  try {
    await api(`/api/rooms/${roomId}/status`, { method: 'POST', body: { status } });
    toast('وضعیت روم بروز شد ✅', 'ok');
    viewRoom(roomId);
  } catch (e) {}
}
window.roomStatusAction = roomStatusAction;

async function leaveRoomAction(roomId) {
  if (!confirm('آیا از انصراف از روم مطمئن هستید؟ مبلغ پرداختی به کیف پول شما برگشت داده می‌شود.')) return;
  try {
    await api(`/api/rooms/${roomId}/leave`, { method: 'POST' });
    toast('انصراف با موفقیت ثبت شد و مبلغ به کیف پول برگشت ✅', 'ok');
    viewRoom(roomId);
  } catch (e) {}
}
window.leaveRoomAction = leaveRoomAction;

async function removeSlotAction(roomId, slotNo) {
  if (!confirm(`آیا از حذف بازیکن اسلات شماره ${slotNo} مطمئن هستید؟`)) return;
  try {
    await api(`/api/rooms/${roomId}/remove`, { method: 'POST', body: { slot_no: slotNo } });
    toast('بازیکن حذف شد ✅', 'ok');
    viewRoom(roomId);
  } catch (e) {}
}
window.removeSlotAction = removeSlotAction;

async function delRoomAction(roomId) {
  if (!confirm('آیا از حذف کامل این روم اطمینان دارید؟ این عملیات غیرقابل بازگشت است.')) return;
  try {
    await api(`/api/rooms/${roomId}`, { method: 'DELETE' });
    toast('روم با موفقیت حذف شد 🗑️', 'ok');
    location.hash = '#/rooms';
    route();
  } catch (e) {}
}
window.delRoomAction = delRoomAction;

/* ─────────── ویو ۴: استودیو لوداوت‌های متای سیزن (Gunsmith Meta) ─────────── */
let META_GUNS = [
  {
    id: 'dlq33',
    name: 'DL Q33',
    category: 'sniper',
    typeFa: 'تک‌تیرانداز اسطوره‌ای (باف شده)',
    typeEn: 'Legendary Sniper Rifle (Buffed)',
    emoji: '🎯',
    code: 'DLQ-SNIP-8821',
    stats: { damage: 95, firerate: 30, accuracy: 88, mobility: 52, range: 94, control: 60 },
    attachments: [
      { slotFa: 'لوله', slotEn: 'Barrel', name: 'MIP Light' },
      { slotFa: 'قنداق', slotEn: 'Stock', name: 'YKM Combat Stock' },
      { slotFa: 'لیزر', slotEn: 'Laser', name: 'OWC Laser - Tactical' },
      { slotFa: 'پِرک', slotEn: 'Perk', name: 'Fast Switch' },
      { slotFa: 'مهمات', slotEn: 'Ammo', name: 'FMJ Piercing' }
    ]
  },
  {
    id: 'krm262',
    name: 'KRM-262',
    category: 'shotgun',
    typeFa: 'شاتگان وان‌شات متای نزدیک',
    typeEn: 'One-Shot Close Range Demon',
    emoji: '💥',
    code: 'KRM-SHOT-9904',
    stats: { damage: 98, firerate: 35, accuracy: 64, mobility: 82, range: 48, control: 42 },
    attachments: [
      { slotFa: 'صداخفه‌کن', slotEn: 'Muzzle', name: 'Marauder Suppressor' },
      { slotFa: 'لوله', slotEn: 'Barrel', name: 'Extended Barrel (+2)' },
      { slotFa: 'قنداق', slotEn: 'Stock', name: 'No Stock' },
      { slotFa: 'لیزر', slotEn: 'Laser', name: 'MIP Laser 5mW' },
      { slotFa: 'پِرک', slotEn: 'Perk', name: 'Speed Up Kill' }
    ]
  },
  {
    id: 'grau556',
    name: 'GRAU 5.56',
    category: 'ar',
    typeFa: 'رایفل لیزری سیزن (باف شده)',
    typeEn: 'Zero Recoil Tactical AR (Buffed)',
    emoji: '⚔️',
    code: 'GRAU-ZERO-5561',
    stats: { damage: 82, firerate: 73, accuracy: 84, mobility: 78, range: 79, control: 86 },
    attachments: [
      { slotFa: 'لوله', slotEn: 'Barrel', name: 'Tempus 26.4" Archangel' },
      { slotFa: 'قنداق', slotEn: 'Stock', name: 'No Stock' },
      { slotFa: 'مهمات', slotEn: 'Ammo', name: '60 Round Mags' },
      { slotFa: 'دستگیره', slotEn: 'Underbarrel', name: 'Cronen Sharkfin' },
      { slotFa: 'گریپ عقب', slotEn: 'Rear Grip', name: 'XRK Void Grip' }
    ]
  },
  {
    id: 'cbr4',
    name: 'CBR4',
    category: 'smg',
    typeFa: 'مسلسل سبک راش پرو',
    typeEn: 'Pro League SMG Shredder',
    emoji: '⚡',
    code: 'CBR4-RUSH-4412',
    stats: { damage: 79, firerate: 84, accuracy: 78, mobility: 86, range: 68, control: 75 },
    attachments: [
      { slotFa: 'صداخفه‌کن', slotEn: 'Muzzle', name: 'Monolithic Suppressor' },
      { slotFa: 'لوله', slotEn: 'Barrel', name: 'OWC Marksman' },
      { slotFa: 'قنداق', slotEn: 'Stock', name: 'YKM Light Stock' },
      { slotFa: 'لیزر', slotEn: 'Laser', name: 'OWC Laser - Tactical' },
      { slotFa: 'گریپ', slotEn: 'Rear Grip', name: 'Granulated Grip Tape' }
    ]
  },
  {
    id: 'mg42',
    name: 'MG42',
    category: 'lmg',
    typeFa: 'تیربار رگباری جهنمی',
    typeEn: 'Insane Suppressive Fire LMG',
    emoji: '🛡️',
    code: 'MG42-BULLET-1944',
    stats: { damage: 84, firerate: 94, accuracy: 76, mobility: 44, range: 88, control: 78 },
    attachments: [
      { slotFa: 'لوله', slotEn: 'Barrel', name: 'Rapid Fire Barrel' },
      { slotFa: 'مهمات', slotEn: 'Ammo', name: '250 Round Drum' },
      { slotFa: 'دهانه', slotEn: 'Muzzle', name: 'Recoil Booster' },
      { slotFa: 'قنداق', slotEn: 'Stock', name: 'Krausnick Padded' },
      { slotFa: 'پِرک', slotEn: 'Perk', name: 'Disable' }
    ]
  }
];

// Load custom meta weapons from settings if configured by admin
try {
  const customMeta = localStorage.getItem('codm_custom_meta');
  if (customMeta) META_GUNS = JSON.parse(customMeta);
} catch (e) {}

let CUR_META_CAT = 'all';

function viewMeta() {
  const isEn = CUR_LANG === 'en';
  const cats = [
    ['all', isEn ? 'ALL WEAPONS' : 'همه سلاح‌ها'],
    ['sniper', isEn ? '🎯 SNIPER' : '🎯 تک‌تیرانداز'],
    ['shotgun', isEn ? '💥 SHOTGUN' : '💥 شاتگان'],
    ['ar', isEn ? '⚔️ ASSAULT RIFLE' : '⚔️ تفنگ تهاجمی'],
    ['smg', isEn ? '⚡ SMG' : '⚡ مسلسل سبک'],
    ['lmg', isEn ? '🛡️ LMG' : '🛡️ تیربار']
  ];

  const filtered = CUR_META_CAT === 'all' ? META_GUNS : META_GUNS.filter((g) => g.category === CUR_META_CAT);

  $('#app').innerHTML = `
  <div class="meta-studio">
    <div class="meta-header reveal">
      <h1>🔫 <span>${isEn ? 'SEASON META' : 'متای سیزن'}</span> ${isEn ? 'BUFFED GUNS' : 'کالاف دیوتی موبایل'}</h1>
      <p>${isEn ? 'Tournament approved loadouts and buffed weapons with one-click Gunsmith codes' : 'بهترین اتچمنت‌های مسابقات رسمی برای سلاح‌های باف شده سیزن با کدهای گان‌اسمیت'}</p>
    </div>

    <div class="meta-category-bar">
      ${cats.map(([k, l]) => `
        <button class="chip ${CUR_META_CAT === k ? 'on' : ''}" onclick="AudioFX.play('click');setMetaCat('${k}')">${l}</button>
      `).join('')}
    </div>

    <div class="meta-gun-grid">
      ${filtered.map((gun) => `
        <div class="gun-card reveal">
          <div class="gun-card-top">
            <div class="gun-meta-title">
              <h3>${esc(gun.name)}</h3>
              <div class="gun-meta-type">${isEn ? gun.typeEn : gun.typeFa}</div>
            </div>
            <span class="gun-tier-badge">BUFFED S-TIER</span>
          </div>

          <div class="gun-blueprint-area">
            <div class="gun-camo-preview">${gun.emoji}</div>
            <div class="gun-stats-radar">
              ${[
                [isEn ? 'Damage' : 'آسیب', gun.stats.damage],
                [isEn ? 'Fire Rate' : 'سرعت تیر', gun.stats.firerate],
                [isEn ? 'Accuracy' : 'دقت', gun.stats.accuracy],
                [isEn ? 'Mobility' : 'تحرک', gun.stats.mobility],
                [isEn ? 'Range' : 'بُرد', gun.stats.range],
                [isEn ? 'Control' : 'کنترل لگد', gun.stats.control]
              ].map(([stName, stVal]) => `
                <div class="stat-row">
                  <span class="stat-name">${stName}</span>
                  <div class="stat-meter"><div class="stat-meter-fill" style="width:${stVal}%"></div></div>
                  <span class="stat-val">${stVal}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="gun-attachments-list">
            <div class="gun-attachments-title">🛠️ ${isEn ? 'PRO ATTACHMENTS (5/5)' : 'اتچمنت‌های پرو پلیرها'}</div>
            ${gun.attachments.map((att) => `
              <div class="attachment-item">
                <span class="att-slot">${isEn ? att.slotEn : att.slotFa}</span>
                <span class="att-name">${esc(att.name)}</span>
              </div>
            `).join('')}
          </div>

          <div class="gun-card-bot">
            <div class="gun-code-wrap">
              <span class="gun-code-val">${esc(gun.code)}</span>
              <button class="btn sm" onclick="AudioFX.play('reload');copyTxt('${esc(gun.code)}')">📋 ${isEn ? 'Copy Code' : 'کپی کد'}</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
  Reveal.arm();
}

window.setMetaCat = (cat) => {
  CUR_META_CAT = cat;
  viewMeta();
};

/* ─────────── ویو ۵: استودیو کارت گیمری و داگ‌تگ ۳D ─────────── */
let DT_DATA = {
  ign: 'GHOST_W6W',
  uid: '67489214059281',
  clan: '[W6W]',
  rank: 'Legendary',
  role: 'Rusher',
  camo: 'damascus',
  kd: '3.42',
  matches: '1,420'
};

function viewDogtag() {
  const isEn = CUR_LANG === 'en';
  $('#app').innerHTML = `
  <div class="dogtag-studio">
    <div class="sec-head reveal">
      <h2>🎖️ <span>${isEn ? 'HOLOGRAPHIC 3D' : 'استودیو داگ‌تگ ۳D'}</span> ${isEn ? 'CODM DOGTAG' : 'کارت گیمری'}</h2>
      <p>${isEn ? 'Design your elite holographic soldier ID card, customize weapon camo foils, and download high-res PNG to share!' : 'کارت نظامی اختصاصی خودت را بساز، متالیک فویل را انتخاب کن و برای اشتراک‌گذاری در تلگرام و بله دانلود کن'}</p>
    </div>

    <div class="dogtag-grid">
      <div class="dogtag-preview-wrap reveal">
        <div class="dogtag-card camo-${esc(DT_DATA.camo)}" id="dtCard" onmousemove="tiltDogtag(event)" onmouseleave="resetDogtag()">
          <div class="dogtag-holo-foil"></div>
          <div class="dogtag-top">
            <div class="dogtag-brand-tag">🎯 CODM <i>ROOMS</i></div>
            <div class="dogtag-rank-badge" id="dtRankBadge">👑 ${esc(DT_DATA.rank)}</div>
          </div>
          <div class="dogtag-body">
            <div class="dogtag-soldier-info">
              <h2 id="dtIgnTxt">${esc(DT_DATA.ign)}</h2>
              <div class="dogtag-uid" id="dtUidTxt">UID: ${esc(DT_DATA.uid)}</div>
              <div class="dogtag-clan-role" id="dtClanRoleTxt">CLAN: ${esc(DT_DATA.clan)} • ROLE: ${esc(DT_DATA.role)}</div>
            </div>
            <div class="dogtag-stats-box">
              <div class="dt-stat">
                <span class="dt-stat-v" id="dtKdTxt">${esc(DT_DATA.kd)}</span>
                <span class="dt-stat-l">K/D RATIO</span>
              </div>
              <div class="dt-stat">
                <span class="dt-stat-v" id="dtMatchesTxt">${esc(DT_DATA.matches)}</span>
                <span class="dt-stat-l">${isEn ? 'MATCHES' : 'نبردها'}</span>
              </div>
            </div>
          </div>
          <div class="dogtag-barcode">||| | |||| | ||| |||| |</div>
        </div>
        <div style="margin-top:20px;display:flex;gap:12px;width:100%;max-width:430px">
          <button class="btn lg blk good" onclick="downloadDogtagPng()">📥 ${isEn ? 'Download HD Dogtag PNG' : 'دانلود کارت گیمری (PNG)'}</button>
        </div>
      </div>

      <div class="dogtag-form reveal">
        <h3 style="color:var(--acc2)">⚙️ ${isEn ? 'Soldier Profile Customizer' : 'مشخصات کارت گیمری'}</h3>
        <div class="field">
          <label>${isEn ? 'Soldier In-Game Tag (IGN)' : 'نام گیمری (IGN)'}</label>
          <input id="inIgn" class="ltr" value="${esc(DT_DATA.ign)}" oninput="updateDogtagLive()">
        </div>
        <div class="form-grid-2">
          <div class="field">
            <label>${isEn ? 'CODM UID' : 'آیدی عددی (UID)'}</label>
            <input id="inUid" class="ltr" value="${esc(DT_DATA.uid)}" oninput="updateDogtagLive()">
          </div>
          <div class="field">
            <label>${isEn ? 'Clan Tag' : 'کلن تگ'}</label>
            <input id="inClan" class="ltr" value="${esc(DT_DATA.clan)}" oninput="updateDogtagLive()">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="field">
            <label>${isEn ? 'Rank Crest' : 'رنک پلیر'}</label>
            <select id="inRank" class="chip blk" onchange="updateDogtagLive()">
              <option value="Legendary" ${DT_DATA.rank === 'Legendary' ? 'selected' : ''}>👑 Legendary (افسانه‌ای)</option>
              <option value="Grandmaster" ${DT_DATA.rank === 'Grandmaster' ? 'selected' : ''}>💎 Grandmaster (استاد بزرگ)</option>
              <option value="Master" ${DT_DATA.rank === 'Master' ? 'selected' : ''}>⚔️ Master (استاد)</option>
              <option value="Pro" ${DT_DATA.rank === 'Pro' ? 'selected' : ''}>🎖️ Pro (حرفه‌ای)</option>
            </select>
          </div>
          <div class="field">
            <label>${isEn ? 'Tactical Role' : 'پوزیشن بازی'}</label>
            <select id="inRole" class="chip blk" onchange="updateDogtagLive()">
              <option value="Rusher" ${DT_DATA.role === 'Rusher' ? 'selected' : ''}>⚡ Rusher (راشر)</option>
              <option value="Sniper" ${DT_DATA.role === 'Sniper' ? 'selected' : ''}>🎯 Sniper (تک‌تیرانداز)</option>
              <option value="IGL Leader" ${DT_DATA.role === 'IGL Leader' ? 'selected' : ''}>👑 IGL (لیدر اسکواد)</option>
              <option value="Support" ${DT_DATA.role === 'Support' ? 'selected' : ''}>🛡️ Support (پشتیبان)</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>${isEn ? 'Holographic Camo Foil' : 'پوسته متالیک و هولوگرافیک'}</label>
          <select id="inCamo" class="chip blk" onchange="updateDogtagLive()">
            <option value="damascus" ${DT_DATA.camo === 'damascus' ? 'selected' : ''}>🌈 Damascus Foil (رنگین‌کمانی موج‌دار)</option>
            <option value="diamond" ${DT_DATA.camo === 'diamond' ? 'selected' : ''}>✨ Diamond Glitter (الماس درخشان)</option>
            <option value="darkmatter" ${DT_DATA.camo === 'darkmatter' ? 'selected' : ''}>🌌 Dark Matter Nebula (ماده تاریک)</option>
            <option value="gold" ${DT_DATA.camo === 'gold' ? 'selected' : ''}>🏆 Gold Bullion (طلای نظامی)</option>
          </select>
        </div>
        <div class="form-grid-2">
          <div class="field"><label>K/D Ratio</label><input id="inKd" class="ltr" value="${esc(DT_DATA.kd)}" oninput="updateDogtagLive()"></div>
          <div class="field"><label>${isEn ? 'Matches' : 'تعداد بازی‌ها'}</label><input id="inMatches" class="ltr" value="${esc(DT_DATA.matches)}" oninput="updateDogtagLive()"></div>
        </div>
      </div>
    </div>
  </div>`;
  Reveal.arm();
}

window.tiltDogtag = (e) => {
  const card = $('#dtCard');
  if (!card) return;
  const rc = card.getBoundingClientRect();
  const px = (e.clientX - rc.left) / rc.width;
  const py = (e.clientY - rc.top) / rc.height;
  const rx = (0.5 - py) * 16;
  const ry = (px - 0.5) * 18;
  card.style.transform = `rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) scale(1.02)`;
};

window.resetDogtag = () => {
  const card = $('#dtCard');
  if (card) card.style.transform = '';
};

window.updateDogtagLive = () => {
  DT_DATA.ign = $('#inIgn').value.trim() || 'SOLDIER';
  DT_DATA.uid = $('#inUid').value.trim() || '674000000000';
  DT_DATA.clan = $('#inClan').value.trim() || '[W6W]';
  DT_DATA.rank = $('#inRank').value;
  DT_DATA.role = $('#inRole').value;
  DT_DATA.camo = $('#inCamo').value;
  DT_DATA.kd = $('#inKd').value.trim() || '3.00';
  DT_DATA.matches = $('#inMatches').value.trim() || '1,000';

  $('#dtIgnTxt').textContent = DT_DATA.ign;
  $('#dtUidTxt').textContent = 'UID: ' + DT_DATA.uid;
  $('#dtClanRoleTxt').textContent = `CLAN: ${DT_DATA.clan} • ROLE: ${DT_DATA.role}`;
  $('#dtRankBadge').textContent = '👑 ' + DT_DATA.rank;
  $('#dtKdTxt').textContent = DT_DATA.kd;
  $('#dtMatchesTxt').textContent = DT_DATA.matches;

  const card = $('#dtCard');
  if (card) card.className = `dogtag-card camo-${DT_DATA.camo}`;
};

window.downloadDogtagPng = () => {
  AudioFX.play('click');
  const canvas = document.createElement('canvas');
  canvas.width = 860;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 860, 540);
  if (DT_DATA.camo === 'damascus') {
    grad.addColorStop(0, '#0a0d14');
    grad.addColorStop(0.5, '#162238');
    grad.addColorStop(1, '#1b1226');
  } else if (DT_DATA.camo === 'gold') {
    grad.addColorStop(0, '#1c150a');
    grad.addColorStop(0.5, '#2e200c');
    grad.addColorStop(1, '#0e0b05');
  } else {
    grad.addColorStop(0, '#0a0d14');
    grad.addColorStop(1, '#131b26');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 860, 540);

  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 820, 500);

  ctx.fillStyle = '#ff9800';
  ctx.font = 'bold 30px "Russo One", sans-serif';
  ctx.fillText('CODM ROOMS | TACTICAL SOLDIER ID', 45, 75);

  ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
  ctx.fillRect(620, 45, 190, 42);
  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = 2;
  ctx.strokeRect(620, 45, 190, 42);
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 20px "Russo One", sans-serif';
  ctx.fillText('👑 ' + DT_DATA.rank.toUpperCase(), 635, 74);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px "Russo One", sans-serif';
  ctx.fillText(DT_DATA.ign, 45, 190);

  ctx.fillStyle = '#ffb74d';
  ctx.font = '24px monospace';
  ctx.fillText('UID: ' + DT_DATA.uid, 45, 240);

  ctx.fillStyle = '#cfd8dc';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`CLAN: ${DT_DATA.clan}   |   ROLE: ${DT_DATA.role}`, 45, 290);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(45, 340, 770, 100);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(45, 340, 770, 100);

  ctx.fillStyle = '#ff9800';
  ctx.font = 'bold 36px "Russo One", sans-serif';
  ctx.fillText(DT_DATA.kd, 85, 395);
  ctx.fillStyle = '#90a4ae';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('K/D RATIO', 85, 425);

  ctx.fillStyle = '#ff9800';
  ctx.font = 'bold 36px "Russo One", sans-serif';
  ctx.fillText(DT_DATA.matches, 340, 395);
  ctx.fillStyle = '#90a4ae';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('MATCHES PLAYED', 340, 425);

  ctx.fillStyle = '#4caf50';
  ctx.font = 'bold 28px "Russo One", sans-serif';
  ctx.fillText('VERIFIED SQUAD', 580, 400);

  const a = document.createElement('a');
  a.download = `CODM_DOGTAG_${DT_DATA.ign}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  AudioFX.play('headshot');
  toast(CUR_LANG === 'en' ? 'Dogtag PNG downloaded! 🏆' : 'کارت گیمری با کیفیت بالا دانلود شد! 🏆', 'ok');
};

/* ─────────── ویو ۶: پروفایل کامل، کیف پول، و اتصال ربات‌ها ─────────── */
async function viewProfile() {
  if (!S.me) { authModal('login'); return; }
  const isEn = CUR_LANG === 'en';
  let myData = { entries: [], transactions: [], prizes: [], referral: { uses: 0, earned: 0 } };

  try {
    const r = await api('/api/me');
    if (r) {
      myData = r;
      S.me = r.user;
    }
  } catch (e) {}

  const u = S.me;
  const refCode = u.referral_code || '—';

  $('#app').innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head reveal">
      <h2>👤 <span>${isEn ? 'SOLDIER HQ' : 'حساب کاربری و کیف پول'}</span></h2>
      <p>${isEn ? 'Manage your balance, Telegram/Bale bot connection, referrals, and tournament history' : 'مدیریت موجودی، شارژ کیف پول، اتصال به ربات‌های بله و تلگرام، و پاداش دعوت'}</p>
    </div>

    <div style="max-width:960px;margin:0 auto">
      <!-- کارت موجودی و شارژ کیف پول -->
      <div style="background:var(--panel);border:1px solid var(--line);clip-path:var(--clip);padding:26px;margin-bottom:20px" class="reveal">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;border-bottom:1px solid var(--line);padding-bottom:18px">
          <div>
            <h2 style="font-size:22px;color:#fff">${esc(u.display_name || u.username)}</h2>
            <div style="color:var(--acc2);font-family:monospace;margin-top:4px">@${esc(u.username)}</div>
            ${u.codm_id ? `<div style="font-size:12px;color:var(--mut);margin-top:4px">🎮 CODM ID: ${esc(u.codm_id)}</div>` : ''}
          </div>
          <div style="text-align:end">
            <div style="font-size:12px;color:var(--mut)">${isEn ? 'Wallet Balance' : 'موجودی کیف پول'}</div>
            <div style="font-size:26px;font-family:'Russo One',sans-serif;color:var(--good)">${isEn ? money(u.wallet) + ' Toman' : fa(money(u.wallet)) + ' تومان'}</div>
            <button class="btn sm good" style="margin-top:8px" onclick="topupModal()">💰 ${isEn ? 'Top-Up Wallet' : 'شارژ کیف پول'}</button>
          </div>
        </div>

        <!-- کارت پاداش کد معرف -->
        <div class="refbox">
          <div class="wl">🎯 ${isEn ? 'Your Personal Referral Code & Bounty' : 'کد معرف اختصاصی شما (پاداش نقدی دعوت دوستان)'}:</div>
          <div class="refcode-row">
            <code>${esc(refCode)}</code>
            <button class="btn sm" onclick="copyTxt('${esc(refCode)}')">📋 ${isEn ? 'Copy' : 'کپی کد معرف'}</button>
            <div class="refstat">
              👥 ${isEn ? 'Successful Invites' : 'دعوت‌های موفق'}: <b>${myData.referral.uses || 0}</b> |
              💰 ${isEn ? 'Earned Bounty' : 'درآمد کسب‌شده'}: <b>${fa(money(myData.referral.earned || 0))} تومان</b>
            </div>
          </div>
        </div>

        <!-- اتصال به ربات بله و تلگرام -->
        <div style="margin-top:20px;padding:16px;background:var(--bg2);border:1px solid var(--line);border-radius:12px">
          <div style="font-weight:800;color:var(--acc2);margin-bottom:10px">🔗 ${isEn ? 'Bot Account Integration (Bale & Telegram)' : 'اتصال به ربات بله و تلگرام (جهت پرداخت و دریافت رمز روم)'}:</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
            ${u.bale_id ? `<span class="tag approved">✅ متصل به بله (ID: ${esc(u.bale_id)})</span>` : `<button class="btn sm bale" onclick="linkBotModal('bale')">💬 اتصال به ربات بله</button>`}
            ${u.telegram_id ? `<span class="tag approved">✅ متصل به تلگرام (ID: ${esc(u.telegram_id)})</span>` : `<button class="btn sm ghost" onclick="linkBotModal('telegram')">📱 اتصال به ربات تلگرام</button>`}
          </div>
          <div class="hint" style="margin-top:8px">💡 با اتصال ربات، پرداخت‌های فیش شما در بله مستقیماً به همین حساب متصل شده و رمز روم‌ها خودکار برایتان ارسال می‌شود.</div>
        </div>
      </div>

      <!-- روم‌های من -->
      <div style="background:var(--panel);border:1px solid var(--line);clip-path:var(--clip-sm);padding:24px;margin-bottom:20px" class="reveal">
        <h3 style="color:var(--acc);margin-bottom:14px">🎮 ${isEn ? 'My Tournament Entries' : 'روم‌های من'}</h3>
        <div class="tblwrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>روم</th>
                <th>موقعیت</th>
                <th>وضعیت پرداخت</th>
                <th>اطلاعات روم</th>
              </tr>
            </thead>
            <tbody>
              ${(myData.entries || []).map((e) => `
                <tr>
                  <td><b>${esc(e.title)}</b></td>
                  <td>${esc(e.team_label)} / شماره ${fa(e.slot_no)}</td>
                  <td><span class="tag ${e.status}">${e.status === 'paid' ? '✅ قطعی' : '⏳ در انتظار تایید'}</span></td>
                  <td>${e.code_id ? `<code>${esc(e.code_id)}</code> | <code>${esc(e.code_pass)}</code>` : '<small class="mut">پس از انتشار اعلام می‌شود</small>'}</td>
                </tr>
              `).join('') || `<tr><td colspan="4" style="text-align:center;color:var(--mut)">هنوز در رومی ثبت‌نام نکرده‌اید</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <!-- تراکنش‌های مالی -->
      <div style="background:var(--panel);border:1px solid var(--line);clip-path:var(--clip-sm);padding:24px" class="reveal">
        <h3 style="color:var(--acc);margin-bottom:14px">🧾 ${isEn ? 'Recent Wallet Transactions' : 'تراکنش‌های کیف پول'}</h3>
        <div class="tblwrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>نوع</th>
                <th>مبلغ</th>
                <th>توضیحات</th>
              </tr>
            </thead>
            <tbody>
              ${(myData.transactions || []).map((tItem) => `
                <tr>
                  <td>${esc(tItem.created_at)}</td>
                  <td>${tItem.kind === 'topup' ? '💰 شارژ' : (tItem.kind === 'entry' ? '🎮 ورودی روم' : (tItem.kind === 'referral' ? '🎯 پاداش معرف' : '🏆 جایزه'))}</td>
                  <td style="font-weight:800;color:${tItem.amount >= 0 ? 'var(--good)' : 'var(--bad)'}">${tItem.amount >= 0 ? '+' : ''}${fa(money(tItem.amount))} تومان</td>
                  <td>${esc(tItem.ref || '—')}</td>
                </tr>
              `).join('') || `<tr><td colspan="4" style="text-align:center;color:var(--mut)">تراکنشی ثبت نشده است</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>`;
  Reveal.arm();
}

/* ─────────── مودال شارژ کیف پول ─────────── */
function topupModal() {
  const cfg = S.cfg || {};
  const minT = cfg.min_topup || 10000;
  modal(`
    <h3>💰 شارژ کیف پول</h3>
    <p class="msub">مبلغ موردنظر را انتخاب یا وارد کن. حداقل مبلغ: <b>${fa(money(minT))} تومان</b></p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <button class="chip" onclick="$('#topupAmt').value='10000'">۱۰,۰۰۰ ت</button>
      <button class="chip" onclick="$('#topupAmt').value='20000'">۲۰,۰۰۰ ت</button>
      <button class="chip" onclick="$('#topupAmt').value='50000'">۵۰,۰۰۰ ت</button>
      <button class="chip" onclick="$('#topupAmt').value='100000'">۱۰۰,۰۰۰ ت</button>
    </div>
    <div class="field"><label>مبلغ دلخواه (تومان):</label><input id="topupAmt" type="number" class="ltr" value="${minT}"></div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="btn blk bale" onclick="doTopup('card')">💳 کارت به کارت (ارسال فیش در بله)</button>
      ${cfg.has_gateway ? `<button class="btn blk good" onclick="doTopup('online')">🏦 درگاه آنلاین</button>` : ''}
    </div>
  `);
}
window.topupModal = topupModal;

async function doTopup(method) {
  const amount = Number($('#topupAmt').value);
  const cfg = S.cfg || {};
  if (!amount || amount < (cfg.min_topup || 10000)) {
    toast(`حداقل مبلغ شارژ ${money(cfg.min_topup || 10000)} تومان است`, 'err');
    return;
  }
  try {
    const r = await api('/api/topup', { method: 'POST', body: { amount, method } });
    if (method === 'card') {
      const card = r.card || {};
      const baleDeepLink = `https://ble.ir/${cfg.bale_bot_id || 'codm_room_bot'}?start=pay_${r.payment_id}`;
      modal(`
        <h3>💳 شارژ کارت به کارت</h3>
        <p class="msub">درخواست شارژ ثبت شد. پس از واریز، عکس رسید را در ربات بله ارسال کنید:</p>
        <div class="cardinfo">
          <div class="cnum" onclick="copyTxt('${esc(card.number)}')">${esc(card.number) || '—'}</div>
          <div class="cnm"><b>${esc(card.name)}</b> ${card.bank ? `(${esc(card.bank)})` : ''}</div>
          <div style="margin-top:8px;font-size:16px;color:var(--good);font-weight:800">مبلغ: ${fa(money(amount))} تومان</div>
          <button class="copybtn" onclick="copyTxt('${esc(card.number)}')">📋 کپی شماره کارت</button>
        </div>
        <a class="btn blk lg bale" href="${baleDeepLink}" target="_blank" rel="noopener" style="margin-bottom:12px;text-align:center">
          💬 رفتن به ربات بله و ارسال عکس فیش شارژ
        </a>
        <button class="btn blk ghost" onclick="closeModal();viewProfile()">✔️ انجام دادم، بازگشت</button>
      `);
      return;
    }
    if (method === 'online' && r.gateway_url) {
      location.href = r.gateway_url;
    }
  } catch (e) {}
}
window.doTopup = doTopup;

/* ─────────── مودال اتصال ربات بله / تلگرام ─────────── */
function linkBotModal(platform) {
  const pName = platform === 'bale' ? 'بله' : 'تلگرام';
  const cfg = S.cfg || {};
  const botLink = platform === 'bale' ? (cfg.bale_bot || 'https://ble.ir/codm_room_bot') : (cfg.tg_bot || 'https://t.me/codm_room_bot');
  modal(`
    <h3>🔗 اتصال به ربات ${pName}</h3>
    <div class="paysteps">
      <div><b>۱.</b> وارد ربات ${pName} شو: <a href="${botLink}" target="_blank" rel="noopener" style="color:var(--acc);font-weight:700">@${esc(platform === 'bale' ? cfg.bale_bot_id || 'codm_room_bot' : cfg.tg_bot_id || 'codm_room_bot')}</a></div>
      <div><b>۲.</b> در چت ربات دستور <code>/link</code> را ارسال کن.</div>
      <div><b>۳.</b> ربات به شما یک کد ۶ رقمی می‌دهد؛ آن را در کادر زیر وارد کن:</div>
    </div>
    <div class="field"><label>کد ۶ رقمی دریافتی از ربات:</label><input id="botLinkCode" class="ltr" placeholder="مثال: A7B9K2" style="text-transform:uppercase"></div>
    <button class="btn blk lg good" onclick="doLinkBot()">✅ اتصال حساب</button>
  `);
}
window.linkBotModal = linkBotModal;

async function doLinkBot() {
  const code = $('#botLinkCode').value.trim();
  if (!code) return;
  try {
    const r = await api('/api/link', { method: 'POST', body: { code } });
    closeModal();
    AudioFX.play('lock');
    toast('اکانت شما با موفقیت به ربات متصل شد! ✅', 'ok');
    S.me = r.user;
    viewProfile();
  } catch (e) {}
}
window.doLinkBot = doLinkBot;

/* ─────────── ویو ۷: پنل مدیریت کامل (ADMIN PANEL) ─────────── */
let ADM_TAB = 'dash';

async function viewAdmin() {
  if (!S.me || S.me.role !== 'admin') {
    location.hash = '#/';
    return;
  }
  const isEn = CUR_LANG === 'en';
  const app = $('#app');

  const tabs = [
    ['dash', '📊 ' + (isEn ? 'Dashboard' : 'داشبورد')],
    ['rooms', '🎮 ' + (isEn ? 'Rooms' : 'مدیریت روم‌ها')],
    ['pays', '🔔 ' + (isEn ? 'Payments' : 'تایید پرداخت‌ها')],
    ['przs', '🏆 ' + (isEn ? 'Prizes' : 'جوایز')],
    ['users', '👥 ' + (isEn ? 'Users' : 'کاربران')],
    ['settings', '⚙️ ' + (isEn ? 'Settings & Meta' : 'تنظیمات و متای سیزن')],
    ['broadcast', '📢 ' + (isEn ? 'Broadcast' : 'پیام همگانی')]
  ];

  app.innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head reveal">
      <h2>🛡️ <span>${isEn ? 'ADMIN HEADQUARTERS' : 'پنل مدیریت پلتفرم'}</span></h2>
      <p>${isEn ? 'Full control over tournaments, Bale payments, users, and seasonal meta weapon loadouts' : 'کنترل کامل روم‌ها، تایید پرداخت‌ها و رسیدهای بله، کاربران و تنظیمات گان‌های باف شده سیزن'}</p>
    </div>

    <div class="admtabs">
      ${tabs.map(([k, l]) => `
        <button class="admtab ${ADM_TAB === k ? 'on' : ''}" onclick="setAdmTab('${k}')">${l}</button>
      `).join('')}
    </div>

    <div id="admBody" class="reveal">
      <div class="empty">⏳ در حال بارگذاری اطلاعات پنل...</div>
    </div>
  </section>`;
  Reveal.arm();

  loadAdmTab();
}

window.setAdmTab = (tTab) => {
  ADM_TAB = tTab;
  $$('.admtab').forEach((b, i) => b.classList.toggle('on', b.textContent.includes(tTab) || (tTab === 'dash' && i === 0)));
  AudioFX.play('click');
  loadAdmTab();
};

async function loadAdmTab() {
  const b = $('#admBody');
  if (!b) return;

  if (ADM_TAB === 'dash') {
    let s = {};
    try { s = await api('/api/stats'); } catch (e) {}
    b.innerHTML = `
      <div class="adm-stats">
        <div class="astat"><div class="v">${fa(money(s.users || 0))}</div><div class="l">👥 کل کاربران</div></div>
        <div class="astat"><div class="v">${fa(money(s.todayUsers || 0))}</div><div class="l">📅 کاربران ثبت‌نامی امروز</div></div>
        <div class="astat"><div class="v">${fa(money(s.rooms || 0))}</div><div class="l">🎮 کل روم‌ها (${fa(s.openRooms || 0)} باز)</div></div>
        <div class="astat"><div class="v">${fa(money(s.entries || 0))}</div><div class="l">🎯 ورودی‌های قطعی</div></div>
        <div class="astat good"><div class="v">${fa(money(s.revenue || 0))} ت</div><div class="l">💵 درآمد از ورودی روم‌ها</div></div>
        <div class="astat good"><div class="v">${fa(money(s.topups || 0))} ت</div><div class="l">📈 شارژ کیف پول تاییدشده</div></div>
        <div class="astat"><div class="v">${fa(money(s.walletTotal || 0))} ت</div><div class="l">💼 مجموع موجودی کاربران</div></div>
        <div class="astat"><div class="v">${fa(money(s.prizesPaid || 0))} ت</div><div class="l">🏆 جوایز پرداخت شده</div></div>
        <div class="astat warn" onclick="setAdmTab('pays')" style="cursor:pointer"><div class="v">${fa(s.pendingPayments || 0)}</div><div class="l">🔔 پرداخت در انتظار تایید (کلیک برای بررسی)</div></div>
        <div class="astat warn" onclick="setAdmTab('przs')" style="cursor:pointer"><div class="v">${fa(s.pendingPrizes || 0)}</div><div class="l">🏆 جوایز در انتظار تایید</div></div>
      </div>
      <div style="margin-top:20px;display:flex;gap:10px">
        <button class="btn" onclick="newRoomModal()">➕ ساخت روم جدید</button>
        <button class="btn ghost" onclick="setAdmTab('settings')">⚙️ تنظیمات وب‌هوک و پرداخت</button>
      </div>`;
    return;
  }

  if (ADM_TAB === 'rooms') {
    let rooms = [];
    try { const r = await api('/api/rooms?status=all'); rooms = r.rooms || []; } catch (e) {}
    b.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3>لیست کامل روم‌ها</h3>
        <button class="btn good sm" onclick="newRoomModal()">➕ ساخت روم جدید</button>
      </div>
      <div class="tblwrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>شناسه</th>
              <th>عنوان روم</th>
              <th>حالت</th>
              <th>ظرفیت</th>
              <th>ورودی</th>
              <th>جایزه</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${rooms.map((rm) => `
              <tr>
                <td>#${rm.id}</td>
                <td><b>${esc(rm.title)}</b></td>
                <td>${esc(rm.mode)}</td>
                <td>${fa(rm.paid || 0)}/${fa(rm.total || rm.max_players || 0)}</td>
                <td>${rm.entry_fee > 0 ? fa(money(rm.entry_fee)) + ' ت' : 'رایگان'}</td>
                <td>${rm.prize_pool > 0 ? fa(money(rm.prize_pool)) + ' ت' : '—'}</td>
                <td><span class="tag ${rm.status}">${RSTATUS[rm.status] ? RSTATUS[rm.status][0] : rm.status}</span></td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="btn sm ghost" onclick="location.hash='#/room/${rm.id}'">👁️ نقشه اسلات</button>
                    <button class="btn sm info" onclick="publishModal(${rm.id}, '${esc(rm.room_id || '')}', '${esc(rm.room_pass || '')}')">🔓 رمز</button>
                    <button class="btn sm bad" onclick="delRoomAction(${rm.id})">🗑 حذف</button>
                  </div>
                </td>
              </tr>
            `).join('') || `<tr><td colspan="8" style="text-align:center;color:var(--mut)">هنوز رومی ساخته نشده است</td></tr>`}
          </tbody>
        </table>
      </div>`;
    return;
  }

  if (ADM_TAB === 'pays') {
    let pays = [];
    try { const r = await api('/api/payments?status=all'); pays = r.payments || []; } catch (e) {}
    b.innerHTML = `
      <div style="margin-bottom:14px;font-weight:700">🔔 لیست تمام پرداخت‌ها و رسیدهای ارسالی کاربران:</div>
      <div class="tblwrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>کاربر</th>
              <th>نوع پرداخت</th>
              <th>مبلغ</th>
              <th>روش</th>
              <th>کد پیگیری / رسید بله</th>
              <th>وضعیت</th>
              <th>عملیات تایید</th>
            </tr>
          </thead>
          <tbody>
            ${pays.map((p) => `
              <tr>
                <td>#${p.id}</td>
                <td><b>${esc(p.display_name || p.username)}</b></td>
                <td>${p.kind === 'topup' ? '💰 شارژ کیف پول' : `🎮 روم: ${esc(p.room_title || ('#' + p.room_id))}`}</td>
                <td style="font-weight:800;color:var(--acc2)">${fa(money(p.amount))} تومان</td>
                <td>${p.method === 'card' ? '💳 کارت' : (p.method === 'wallet' ? '💼 کیف پول' : '🏦 درگاه')}</td>
                <td>
                  ${p.ref_code ? `<code>${esc(p.ref_code)}</code>` : ''}
                  ${p.proof_file_id ? `<span class="tag approved">📸 عکس فیش در ${p.proof_platform === 'tg' ? 'تلگرام' : 'بله'}</span>` : ''}
                </td>
                <td><span class="tag ${p.status}">${p.status === 'pending' ? '⏳ در انتظار' : (p.status === 'approved' ? '✅ تایید' : '❌ رد')}</span></td>
                <td>
                  ${p.status === 'pending' ? `
                    <div style="display:flex;gap:6px">
                      <button class="btn sm good" onclick="approvePay(${p.id})">✅ تایید</button>
                      <button class="btn sm bad" onclick="rejectPay(${p.id})">❌ رد</button>
                    </div>` : '<small class="mut">بررسی شده</small>'}
                </td>
              </tr>
            `).join('') || `<tr><td colspan="8" style="text-align:center;color:var(--mut)">پرداختی یافت نشد</td></tr>`}
          </tbody>
        </table>
      </div>`;
    return;
  }

  if (ADM_TAB === 'przs') {
    let przs = [];
    try { const r = await api('/api/prizes?status=all'); przs = r.prizes || []; } catch (e) {}
    b.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3>لیست جوایز قهرمان‌ها</h3>
        <button class="btn good sm" onclick="newPrizeModal()">➕ ثبت جایزه جدید</button>
      </div>
      <div class="tblwrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>کاربر</th>
              <th>مبلغ جایزه</th>
              <th>توضیحات</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${przs.map((z) => `
              <tr>
                <td>#${z.id}</td>
                <td><b>${esc(z.display_name || z.username)}</b></td>
                <td style="font-weight:800;color:var(--good)">${fa(money(z.amount))} تومان</td>
                <td>${esc(z.note || '—')}</td>
                <td><span class="tag ${z.status}">${z.status === 'pending' ? '⏳ در انتظار' : '✅ تایید'}</span></td>
                <td>
                  ${z.status === 'pending' ? `
                    <div style="display:flex;gap:6px">
                      <button class="btn sm good" onclick="approvePrizeAction(${z.id})">✅ تایید و واریز</button>
                      <button class="btn sm bad" onclick="rejectPrizeAction(${z.id})">❌ رد</button>
                    </div>` : '<small class="mut">واریز شده</small>'}
                </td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--mut)">جایزه‌ای یافت نشد</td></tr>`}
          </tbody>
        </table>
      </div>`;
    return;
  }

  if (ADM_TAB === 'users') {
    let users = [];
    try { const r = await api('/api/users'); users = r.users || []; } catch (e) {}
    b.innerHTML = `
      <div style="margin-bottom:14px;display:flex;gap:10px">
        <input id="userSearchIn" placeholder="جستجو بر اساس نام، یوزرنیم، تلگرام یا بله..." style="flex:1" oninput="searchUsersLive()">
      </div>
      <div class="tblwrap">
        <table class="tbl" id="usersTbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>نام و یوزرنیم</th>
              <th>نقش</th>
              <th>موجودی</th>
              <th>کد معرف</th>
              <th>بله / تلگرام</th>
              <th>عملیات مدیریت</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((uRow) => `
              <tr>
                <td>#${uRow.id}</td>
                <td><b>${esc(uRow.display_name || uRow.username)}</b><br><small class="mut">@${esc(uRow.username)}</small></td>
                <td><span class="tag ${uRow.role === 'admin' ? 'approved' : 'usr'}">${uRow.role === 'admin' ? '🛡 ادمین' : '👤 کاربر'}</span></td>
                <td style="font-weight:800;color:var(--good)">${fa(money(uRow.wallet))} تومان</td>
                <td><code>${esc(uRow.referral_code || '—')}</code></td>
                <td><small>${uRow.bale_id ? '💬 بله ' : ''}${uRow.telegram_id ? '📱 تلگرام' : ''}</small></td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="btn sm good" onclick="changeWalletModal(${uRow.id}, '${esc(uRow.display_name || uRow.username)}')">💰 تغییر کیف پول</button>
                    <button class="btn sm ghost" onclick="toggleRole(${uRow.id}, '${uRow.role}')">${uRow.role === 'admin' ? '👤 کاربر کن' : '🛡 ادمین کن'}</button>
                    <button class="btn sm ${uRow.banned ? 'good' : 'bad'}" onclick="toggleBan(${uRow.id}, ${uRow.banned ? 1 : 0})">${uRow.banned ? '✅ رفع بن' : '⛔ مسدود'}</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    return;
  }

  if (ADM_TAB === 'settings') {
    let st = {};
    let whStatus = {};
    try {
      const r = await api('/api/settings');
      st = r.settings || {};
      const wh = await api('/api/webhook/status', { silent: true });
      if (wh) whStatus = wh;
    } catch (e) {}

    b.innerHTML = `
      <div class="set-grid">
        <div class="setrow">
          <label>🤖 توکن ربات تلگرام:</label>
          <input id="set_tg_token" class="ltr" value="${esc(st.tg_token || '')}" placeholder="123456:ABC-DEF...">
        </div>
        <div class="setrow">
          <label>💬 توکن ربات بله (مرکز پرداخت):</label>
          <input id="set_bale_token" class="ltr" value="${esc(st.bale_token || '')}" placeholder="123456:ABC-DEF...">
        </div>
        <div class="setrow">
          <label>📱 آیدی ربات تلگرام (بدون @):</label>
          <input id="set_tg_bot_id" class="ltr" value="${esc(st.tg_bot_id || '')}" placeholder="codm_room_bot">
        </div>
        <div class="setrow">
          <label>💬 آیدی ربات بله (بدون @):</label>
          <input id="set_bale_bot_id" class="ltr" value="${esc(st.bale_bot_id || '')}" placeholder="codm_room_bot">
        </div>
        <div class="setrow">
          <label>💳 شماره کارت بانکی (دریافت ورودی‌ها):</label>
          <input id="set_card_number" class="ltr" value="${esc(st.card_number || '')}" placeholder="6037-xxxx-xxxx-xxxx">
        </div>
        <div class="setrow">
          <label>👤 نام صاحب حساب کارت:</label>
          <input id="set_card_name" value="${esc(st.card_name || '')}" placeholder="علیرضا ...">
        </div>
        <div class="setrow">
          <label>🏦 نام بانک:</label>
          <input id="set_bank_name" value="${esc(st.bank_name || '')}" placeholder="ملی / صادرات / ملت">
        </div>
        <div class="setrow">
          <label>🌐 آدرس وبسایت:</label>
          <input id="set_website_url" class="ltr" value="${esc(st.website_url || '')}">
        </div>
        <div class="setrow">
          <label>📣 کانال اعلان روم‌ها:</label>
          <input id="set_announce_channel" class="ltr" value="${esc(st.announce_channel || '')}" placeholder="@channel_id">
        </div>
        <div class="setrow">
          <label>⬇️ حداقل مبلغ شارژ کیف پول (تومان):</label>
          <input id="set_min_topup" type="number" class="ltr" value="${st.min_topup || 10000}">
        </div>
        <div class="setrow">
          <label>🎯 مبلغ پاداش کد معرف (تومان):</label>
          <input id="set_referral_reward" type="number" class="ltr" value="${st.referral_reward || 10000}">
        </div>
        <div class="setrow">
          <label>🛡 لینک بات پشتیبانی:</label>
          <input id="set_support_bot" class="ltr" value="${esc(st.support_bot || '')}">
        </div>
      </div>

      <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn good lg" onclick="saveSettingsAction()">💾 ذخیره تمام تنظیمات</button>
        <button class="btn bale" onclick="setWebhookAction('bale')">🔗 اتصال خودکار وب‌هوک ربات بله</button>
        <button class="btn ghost" onclick="setWebhookAction('telegram')">🔗 اتصال خودکار وب‌هوک ربات تلگرام</button>
      </div>

      <!-- بخش جدید: تنظیمات سلاح‌های باف شده و متای سیزن -->
      <div style="margin-top:34px;background:var(--panel2);border:1px solid var(--acc);border-radius:14px;padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div>
            <h3 style="color:var(--acc2);font-size:18px">🔫 تنظیمات لوداوت‌ها و سلاح‌های باف شده سیزن (Season Meta Editor)</h3>
            <p class="mut" style="font-size:12.5px">سلاح‌های متای نمایش داده شده در بخش «لوداوت‌های متا» را ویرایش کنید یا گان باف شده جدید اضافه نمایید:</p>
          </div>
          <button class="btn sm good" onclick="addMetaGunModal()">➕ افزودن سلاح باف جدید</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
          ${META_GUNS.map((g, idx) => `
            <div style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:14px">
              <div style="display:flex;justify-content:space-between">
                <b>${g.emoji} ${esc(g.name)}</b>
                <span class="tag approved">S-TIER</span>
              </div>
              <div style="font-size:12px;color:var(--acc2);margin-top:4px">کد: ${esc(g.code)}</div>
              <div style="font-size:11px;color:var(--mut);margin-top:4px">${g.attachments.map(a => a.name).join(' • ')}</div>
              <div style="margin-top:10px;display:flex;gap:6px">
                <button class="btn sm ghost" onclick="editMetaGunModal(${idx})">✏️ ویرایش</button>
                <button class="btn sm bad" onclick="deleteMetaGun(${idx})">🗑 حذف</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
    return;
  }

  if (ADM_TAB === 'broadcast') {
    b.innerHTML = `
      <div style="max-width:700px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:24px">
        <h3>📢 ارسال پیام همگانی به کاربران</h3>
        <p class="msub">این پیام به صورت دسته‌ای برای تمام کاربران ثبت‌نام شده در ربات تلگرام و بله فرستاده می‌شود.</p>
        <div class="field">
          <label>متن پیام اعلان:</label>
          <textarea id="bcText" rows="6" placeholder="متن پیام شما برای ارسال به همه اعضا..."></textarea>
        </div>
        <button class="btn blk lg good" onclick="doBroadcastAction()">📤 ارسال پیام به تمام کاربران</button>
      </div>`;
    return;
  }
}

/* ─────────── توابع ذخیره‌سازی و اکشن‌های ادمین ─────────── */
async function saveSettingsAction() {
  const body = {
    tg_token: $('#set_tg_token').value.trim(),
    bale_token: $('#set_bale_token').value.trim(),
    tg_bot_id: $('#set_tg_bot_id').value.trim(),
    bale_bot_id: $('#set_bale_bot_id').value.trim(),
    card_number: $('#set_card_number').value.trim(),
    card_name: $('#set_card_name').value.trim(),
    bank_name: $('#set_bank_name').value.trim(),
    website_url: $('#set_website_url').value.trim(),
    announce_channel: $('#set_announce_channel').value.trim(),
    min_topup: Number($('#set_min_topup').value) || 10000,
    referral_reward: Number($('#set_referral_reward').value) || 10000,
    support_bot: $('#set_support_bot').value.trim()
  };
  try {
    await api('/api/settings', { method: 'POST', body });
    toast('تمام تنظیمات با موفقیت در دیتابیس ذخیره شد ✅', 'ok');
    try { S.cfg = await api('/api/public/config', { silent: true }); } catch (e) {}
  } catch (e) {}
}
window.saveSettingsAction = saveSettingsAction;

async function setWebhookAction(platform) {
  try {
    toast(`در حال اتصال وب‌هوک ربات ${platform}...`, 'info');
    const r = await api('/api/webhook/set', { method: 'POST', body: { platform } });
    if (r.ok) {
      AudioFX.play('lock');
      toast(`وب‌هوک ربات ${platform === 'bale' ? 'بله' : 'تلگرام'} با موفقیت متصل شد! ✅`, 'ok');
    } else {
      toast(`خطا در اتصال: ${r.error || ''}`, 'err');
    }
  } catch (e) {}
}
window.setWebhookAction = setWebhookAction;

async function approvePay(id) {
  try {
    await api(`/api/payments/${id}/approve`, { method: 'POST' });
    AudioFX.play('lock');
    toast(`پرداخت شماره #${id} تایید شد ✅`, 'ok');
    loadAdmTab();
  } catch (e) {}
}
window.approvePay = approvePay;

async function rejectPay(id) {
  try {
    await api(`/api/payments/${id}/reject`, { method: 'POST' });
    toast(`پرداخت شماره #${id} رد شد ❌`, 'info');
    loadAdmTab();
  } catch (e) {}
}
window.rejectPay = rejectPay;

async function approvePrizeAction(id) {
  try {
    await api(`/api/prizes/${id}/approve`, { method: 'POST' });
    AudioFX.play('lock');
    toast(`جایزه شماره #${id} تایید و به کیف پول واریز شد ✅`, 'ok');
    loadAdmTab();
  } catch (e) {}
}
window.approvePrizeAction = approvePrizeAction;

async function rejectPrizeAction(id) {
  try {
    await api(`/api/prizes/${id}/reject`, { method: 'POST' });
    toast(`جایزه شماره #${id} رد شد ❌`, 'info');
    loadAdmTab();
  } catch (e) {}
}
window.rejectPrizeAction = rejectPrizeAction;

function changeWalletModal(userId, name) {
  modal(`
    <h3>💰 تغییر موجودی کیف پول</h3>
    <p class="msub">کاربر: <b>${esc(name)}</b> (شناسه: #${userId})</p>
    <div class="field">
      <label>مبلغ تغییر (تومان):</label>
      <input id="walDelta" type="number" class="ltr" placeholder="مثلاً: 20000 یا -10000 برای کسر">
      <div class="hint">برای افزایش رقم مثبت و برای کسر از کیف پول رقم منفی وارد کنید.</div>
    </div>
    <div class="field">
      <label>یادداشت تغییر (اختیاری):</label>
      <input id="walNote" placeholder="علت افزایش یا کسر">
    </div>
    <button class="btn blk good" onclick="doChangeWallet(${userId})">💾 ثبت تغییر در کیف پول</button>
  `);
}
window.changeWalletModal = changeWalletModal;

async function doChangeWallet(userId) {
  const delta = Number($('#walDelta').value);
  const note = $('#walNote').value.trim();
  if (!delta) return toast('مبلغ باید غیر صفر باشد', 'err');
  try {
    await api(`/api/users/${userId}/wallet`, { method: 'POST', body: { delta, note } });
    closeModal();
    AudioFX.play('lock');
    toast('کیف پول کاربر با موفقیت تغییر کرد ✅', 'ok');
    loadAdmTab();
  } catch (e) {}
}
window.doChangeWallet = doChangeWallet;

async function toggleRole(userId, curRole) {
  const newRole = curRole === 'admin' ? 'user' : 'admin';
  try {
    await api(`/api/users/${userId}/role`, { method: 'POST', body: { role: newRole } });
    toast('نقش کاربر تغییر کرد ✅', 'ok');
    loadAdmTab();
  } catch (e) {}
}
window.toggleRole = toggleRole;

async function toggleBan(userId, isBanned) {
  try {
    await api(`/api/users/${userId}/ban`, { method: 'POST', body: { banned: !isBanned } });
    toast(isBanned ? 'مسدودی کاربر رفع شد ✅' : 'کاربر مسدود شد ⛔', 'ok');
    loadAdmTab();
  } catch (e) {}
}
window.toggleBan = toggleBan;

/* ─────────── مودال ساخت روم جدید توسط ادمین ─────────── */
function newRoomModal() {
  modal(`
    <h3>➕ ساخت روم جدید</h3>
    <div class="field"><label>عنوان روم:</label><input id="nrTitle" placeholder="مثال: تورنمنت هفتگی اسنایپر"></div>
    <div class="frow">
      <div class="field">
        <label>حالت مسابقه:</label>
        <select id="nrMode" onchange="updateNrLayout()">
          ${Object.keys(MODES).map((k) => `<option value="${k}">${MODES[k].emoji} ${MODES[k].fa}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>نقشه:</label><input id="nrMap" placeholder="مثال: Crash / Isolated"></div>
    </div>
    <div class="frow">
      <div class="field"><label>تعداد تیم‌ها:</label><input id="nrTeams" type="number" value="2" min="2" max="50" oninput="updateNrLayout()"></div>
      <div class="field"><label>نفر در هر تیم:</label><input id="nrSize" type="number" value="4" min="1" max="20" oninput="updateNrLayout()"></div>
    </div>
    <div id="nrLayoutPreview" style="background:var(--bg2);padding:10px;border-radius:8px;margin-bottom:14px;font-size:12.5px;color:var(--acc2)"></div>
    <div class="frow">
      <div class="field"><label>ورودی هر بازیکن (تومان - ۰ برای رایگان):</label><input id="nrFee" type="number" value="20000"></div>
      <div class="field"><label>جایزه کل (تومان):</label><input id="nrPrize" type="number" value="100000"></div>
    </div>
    <div class="field"><label>زمان شروع:</label><input id="nrStart" placeholder="مثال: امروز ساعت ۲۱:۰۰"></div>
    <div class="field"><label>توضیحات و قوانین:</label><textarea id="nrDesc" rows="3" placeholder="توضیحات اختیاری..."></textarea></div>
    <button class="btn blk lg good" onclick="doCreateRoom()">🚀 ساخت و انتشار روم</button>
  `, true);
  updateNrLayout();
}
window.newRoomModal = newRoomModal;

function updateNrLayout() {
  const tCount = Number($('#nrTeams').value) || 2;
  const sCount = Number($('#nrSize').value) || 4;
  const total = tCount * sCount;
  const p = $('#nrLayoutPreview');
  if (p) p.innerHTML = `💡 چیدمان: <b>${fa(tCount)} تیم</b> × <b>${fa(sCount)} نفر</b> = مجموعاً <b>${fa(total)} بازیکن</b>`;
}

async function doCreateRoom() {
  const body = {
    title: $('#nrTitle').value.trim(),
    mode: $('#nrMode').value,
    map_name: $('#nrMap').value.trim(),
    teams: Number($('#nrTeams').value),
    team_size: Number($('#nrSize').value),
    entry_fee: Number($('#nrFee').value),
    prize_pool: Number($('#nrPrize').value),
    start_time: $('#nrStart').value.trim(),
    description: $('#nrDesc').value.trim()
  };
  if (!body.title) return toast('لطفاً عنوان روم را وارد کنید', 'err');
  try {
    await api('/api/rooms', { method: 'POST', body });
    closeModal();
    AudioFX.play('lock');
    toast('روم جدید با موفقیت ساخته و منتشر شد! 🎮', 'ok');
    location.hash = '#/rooms';
    route();
  } catch (e) {}
}
window.doCreateRoom = doCreateRoom;

/* ─────────── مودال ثبت جایزه جدید ─────────── */
function newPrizeModal() {
  modal(`
    <h3>🏆 ثبت جایزه جدید برای قهرمان</h3>
    <div class="field"><label>نام کاربری برنده:</label><input id="przUsername" placeholder="username"></div>
    <div class="field"><label>مبلغ جایزه (تومان):</label><input id="przAmount" type="number" placeholder="50000"></div>
    <div class="field"><label>توضیحات جایزه:</label><input id="przNote" placeholder="مثلاً: تیم اول تورنمنت بتل رویال"></div>
    <button class="btn blk good" onclick="doCreatePrize()">✅ ثبت و پرداخت جایزه</button>
  `);
}
window.newPrizeModal = newPrizeModal;

async function doCreatePrize() {
  const username = $('#przUsername').value.trim();
  const amount = Number($('#przAmount').value);
  const note = $('#przNote').value.trim();
  if (!username || !amount) return toast('نام کاربری و مبلغ الزامی است', 'err');
  try {
    await api('/api/prizes', { method: 'POST', body: { username, amount, note, approve_now: true } });
    closeModal();
    AudioFX.play('headshot');
    toast('جایزه با موفقیت ثبت و به کیف پول واریز شد 🏆', 'ok');
    loadAdmTab();
  } catch (e) {}
}
window.doCreatePrize = doCreatePrize;

/* ─────────── ویرایشگر سلاح‌های متای سیزن (Season Meta Editor) ─────────── */
function addMetaGunModal() {
  modal(`
    <h3>➕ افزودن سلاح باف شده سیزن</h3>
    <div class="field"><label>نام اسلحه:</label><input id="mgName" placeholder="مثال: BP50"></div>
    <div class="frow">
      <div class="field"><label>دسته اسلحه:</label>
        <select id="mgCat">
          <option value="ar">Assault Rifle (تهاجمی)</option>
          <option value="smg">SMG (مسلسل سبک)</option>
          <option value="sniper">Sniper (تک‌تیرانداز)</option>
          <option value="shotgun">Shotgun (شاتگان)</option>
          <option value="lmg">LMG (تیربار)</option>
        </select>
      </div>
      <div class="field"><label>ایموجی:</label><input id="mgEmoji" value="🔫"></div>
    </div>
    <div class="field"><label>کد گان‌اسمیت (Gunsmith Code):</label><input id="mgCode" class="ltr" placeholder="BP50-META-2026"></div>
    <div class="field"><label>توضیح فارسی (وضعیت باف):</label><input id="mgTypeFa" value="گان لیزری باف شده سیزن"></div>
    <div class="field"><label>۵ اتچمنت اصلی (با کاما جدا کنید):</label><input id="mgAtts" placeholder="لوله, قنداق, لیزر, مهمات, پرک"></div>
    <button class="btn blk good" onclick="doSaveMetaGun()">💾 ذخیره سلاح در لیست متا</button>
  `);
}
window.addMetaGunModal = addMetaGunModal;

function doSaveMetaGun() {
  const name = $('#mgName').value.trim();
  const cat = $('#mgCat').value;
  const emoji = $('#mgEmoji').value.trim() || '🔫';
  const code = $('#mgCode').value.trim() || 'CODM-META';
  const typeFa = $('#mgTypeFa').value.trim() || 'سلاح باف شده';
  const attsRaw = ($('#mgAtts').value || '').split(/[,،]/).map(x => x.trim()).filter(Boolean);

  if (!name) return toast('نام اسلحه الزامی است', 'err');

  const newGun = {
    id: 'gun_' + Date.now(),
    name,
    category: cat,
    typeFa,
    typeEn: 'Season Meta Buffed Gun',
    emoji,
    code,
    stats: { damage: 85, firerate: 80, accuracy: 82, mobility: 78, range: 75, control: 78 },
    attachments: attsRaw.length ? attsRaw.map((a, i) => ({ slotFa: `اتچمنت ${i+1}`, slotEn: `Slot ${i+1}`, name: a })) : [
      { slotFa: 'لوله', slotEn: 'Barrel', name: 'Tactical Suppressor' },
      { slotFa: 'قنداق', slotEn: 'Stock', name: 'No Stock' }
    ]
  };

  META_GUNS.unshift(newGun);
  localStorage.setItem('codm_custom_meta', JSON.stringify(META_GUNS));
  closeModal();
  AudioFX.play('lock');
  toast('سلاح باف شده جدید به متای سیزن اضافه شد! 🔫', 'ok');
  loadAdmTab();
}
window.doSaveMetaGun = doSaveMetaGun;

function deleteMetaGun(idx) {
  if (!confirm('آیا از حذف این لوداوت از متای سیزن اطمینان دارید؟')) return;
  META_GUNS.splice(idx, 1);
  localStorage.setItem('codm_custom_meta', JSON.stringify(META_GUNS));
  toast('سلاح حذف شد', 'info');
  loadAdmTab();
}
window.deleteMetaGun = deleteMetaGun;

/* ─────────── پیام همگانی ─────────── */
async function doBroadcastAction() {
  const text = $('#bcText').value.trim();
  if (!text) return toast('لطفاً متن پیام را وارد کنید', 'err');
  try {
    toast('در حال ارسال پیام همگانی به ربات‌ها...', 'info');
    const r = await api('/api/broadcast', { method: 'POST', body: { text } });
    AudioFX.play('lock');
    toast(`پیام همگانی با موفقیت برای ${r.sent || 0} کاربر ارسال شد 📢`, 'ok');
    $('#bcText').value = '';
  } catch (e) {}
}
window.doBroadcastAction = doBroadcastAction;

/* ─────────── ویو ۸: راهنما (Help) ─────────── */
function viewHelp() {
  const isEn = CUR_LANG === 'en';
  const cfg = S.cfg || {};
  $('#app').innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head reveal">
      <h2>📖 <span>${isEn ? 'PLATFORM GUIDE' : 'راهنمای جامع پلتفرم'}</span></h2>
      <p>${isEn ? 'How to participate in tournaments, pay via Bale bot, and claim cash prizes' : 'نحوه شرکت در مسابقات، پرداخت امن با ربات بله، و دریافت جوایز نقدی'}</p>
    </div>
    <div class="steps">
      <div class="step reveal rv-d1"><h3>۱. ساخت حساب یا استارت ربات</h3><p>در سایت ثبت‌نام کن یا در ربات بله/تلگرام /start بزن. هر دو به یک دیتابیس مشترک متصل‌اند.</p></div>
      <div class="step reveal rv-d2"><h3>۲. انتخاب اسلات روم</h3><p>روم مورد نظرت را باز کن و جایگاهت را در تیم دلخواهت قفل کن.</p></div>
      <div class="step reveal rv-d3"><h3>۳. پرداخت و تایید رسید در بله</h3><p>با کارت به کارت مبلغ را واریز کن و با دکمه مستقیم، عکس فیش را در ربات بله ارسال کن تا ادمین فوراً تایید کند.</p></div>
      <div class="step reveal rv-d4"><h3>۴. دریافت رمز روم و جایزه</h3><p>Room ID و رمز پیش از مسابقه ارسال شده و جوایز مستقیم به کیف پولت می‌آید.</p></div>
    </div>
    <div style="margin-top:40px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:24px" class="reveal">
      <h3 style="color:var(--acc2);margin-bottom:12px">🤖 لینک‌های مستقیم ربات‌ها و پشتیبانی:</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn bale sm" href="${cfg.bale_bot || 'https://ble.ir/codm_room_bot'}" target="_blank" rel="noopener">💬 ربات بله: @${esc(cfg.bale_bot_id || 'codm_room_bot')}</a>
        <a class="btn ghost sm" href="${cfg.tg_bot || 'https://t.me/codm_room_bot'}" target="_blank" rel="noopener">📱 ربات تلگرام: @${esc(cfg.tg_bot_id || 'codm_room_bot')}</a>
        <a class="btn ghost sm" href="${cfg.support_bot || 'https://t.me/offerspishnahadat_feedbackbot'}" target="_blank" rel="noopener">🛡 پشتیبانی</a>
      </div>
    </div>
  </section>`;
  Reveal.arm();
}

/* ─────────── مودال بیسیم تاکتیکال (Soundboard) ─────────── */
function tacticalRadioModal() {
  AudioFX.play('click');
  modal(`
    <h3>📻 بیسیم و دیالوگ‌های معروف کالاف دیوتی</h3>
    <p class="msub">پخش زنده آلارم‌ها و افکت‌های صوتی مسابقات نظامی</p>
    <div class="soundboard-grid">
      <div class="sfx-card" onclick="AudioFX.play('nuke')"><span class="sfx-icon-lg">☢️</span><span class="sfx-title">Tactical Nuke</span><span class="sfx-desc">آژیر بمب هسته‌ای</span></div>
      <div class="sfx-card" onclick="AudioFX.play('headshot')"><span class="sfx-icon-lg">🎯</span><span class="sfx-title">Headshot</span><span class="sfx-desc">چایم طلایی هدشات</span></div>
      <div class="sfx-card" onclick="AudioFX.play('reload')"><span class="sfx-icon-lg">⚙️</span><span class="sfx-title">Gun Reload</span><span class="sfx-desc">مسلح کردن اسلحه</span></div>
      <div class="sfx-card" onclick="AudioFX.play('lock')"><span class="sfx-icon-lg">🚀</span><span class="sfx-title">Target Lock</span><span class="sfx-desc">قفل موشک و اسلات</span></div>
      <div class="sfx-card" onclick="AudioFX.play('click')"><span class="sfx-icon-lg">📡</span><span class="sfx-title">UAV Radar</span><span class="sfx-desc">رادار ردیابی دشمن</span></div>
    </div>
  `);
}
window.tacticalRadioModal = tacticalRadioModal;

/* ─────────── افکت‌های بصری و سینمایی ─────────── */
const FX = (() => {
  const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  function boot() {
    const b = document.getElementById('boot');
    if (!b) return;
    try {
      if (sessionStorage.getItem('codm_boot')) { b.remove(); return; }
      sessionStorage.setItem('codm_boot', '1');
    } catch (_) {}

    b.classList.add('vis');
    const dismiss = () => { b.classList.add('out'); setTimeout(() => b.remove(), 700); };
    b.addEventListener('click', dismiss);
    setTimeout(dismiss, 1600);
  }

  function wipe() {
    const w = document.getElementById('wipe');
    if (!w) return;
    w.classList.remove('go');
    void w.offsetWidth;
    w.classList.add('go');
    setTimeout(() => w.classList.remove('go'), 550);
  }

  function cursorFX() {
    if (REDUCE || !FINE) return;
    const r = document.getElementById('reticle');
    if (!r) return;
    document.body.classList.add('ccur');
    r.classList.add('vis');

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;

    window.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target.closest && e.target.closest('button, a, .slot, .chip, input');
      r.classList.toggle('lock', !!target);
    }, { passive: true });

    (function loop() {
      x += (tx - x) * 0.28;
      y += (ty - y) * 0.28;
      r.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(loop);
    })();
  }

  function home() {
    const el = document.querySelector('.term');
    if (!el) return;
    const txt = el.dataset.text || '';
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      i++;
      el.textContent = txt.slice(0, i);
      if (i >= txt.length) clearInterval(timer);
    }, 20);
  }

  function replay() {
    try { sessionStorage.removeItem('codm_boot'); } catch (_) {}
    location.reload();
  }

  return { init: () => { boot(); cursorFX(); }, wipe, home, replay };
})();
window.FX = FX;

/* ─────────── راه‌اندازی اولیه اپلت ─────────── */
async function bootApp() {
  document.documentElement.lang = CUR_LANG;
  document.documentElement.dir = CUR_LANG === 'en' ? 'ltr' : 'rtl';
  $('#langTxt').textContent = CUR_LANG === 'fa' ? 'EN' : 'FA';
  AudioFX.updateBtn();

  try { S.cfg = await api('/api/public/config', { silent: true }); } catch (e) { S.cfg = null; }

  if (S.token) {
    try {
      const r = await api('/api/me', { silent: true });
      if (r && r.user) S.me = r.user;
    } catch (e) {
      S.me = null;
    }
  }

  renderTop();

  $('#sfxToggle').addEventListener('click', () => AudioFX.toggle());
  $('#langToggle').addEventListener('click', () => setLanguage(CUR_LANG === 'fa' ? 'en' : 'fa'));
  $('#burger').addEventListener('click', () => $('#mainnav').classList.toggle('openm'));
  $('#tacticalRadioBtn').addEventListener('click', () => tacticalRadioModal());
  $('#fxReplay').addEventListener('click', () => FX.replay());

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !e.target.closest('.topbar')) {
      $('#mainnav').classList.remove('openm');
    }
  });

  $('#year').textContent = new Date().getFullYear();
  FX.init();
  await route();
}

window.addEventListener('hashchange', route);
bootApp();
