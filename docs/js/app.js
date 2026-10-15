/* ══════════════════════════════════════════════════════════
   CODM ROOMS — TACTICAL PLATFORM v1.5.2
   سایت چندزبانه (FA / EN) + پنل ادمین + متصل به Cloudflare Worker D1
   ویژگی‌های ویژه گیمرها:
   1. لوداوت‌های متای سیزن و گان‌اسمیت (Meta Gunsmith Studio)
   2. استودیو کارت گیمری و داگ‌تگ ۳D با قابلیت دانلود PNG
   3. افکت‌های صوتی تاکتیکال و بیسیم نظامی با Web Audio API
   4. پشتیبانی کامل از دسکتاپ و ناوبری مخصوص گوشی (Mobile Bottom Nav)
   5. حفظ ۱۰۰٪ سازگاری با Cloudflare Worker و دیتابیس D1
   ══════════════════════════════════════════════════════════ */
'use strict';

const FA_D = '۰۱۲۳۴۵۶۷۸۹';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fa = (n) => String(n).replace(/\d/g, (d) => FA_D[+d]);
const money = (n) => (Number(n) || 0).toLocaleString('en-US').replace(/,/g, '،');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
    heroSub: 'روم‌های کالاف دیوتی موبایل را اینجا پیدا کن، موقعیت اسکواد خودت را انتخاب کن، آنلاین بپرداز و در مسابقه قطعی شو. جوایز نقدی هم منتظر قهرمان‌هاست! 🏆',
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
    featPayTitle: 'پرداخت چندروشه',
    featPayDesc: 'کیف پول داخلی، کارت به کارت یا درگاه آنلاین — هرطور راحت هستی. وضعیت پرداخت لحظه‌ای آپدیت می‌شود.',
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
    step3Desc: 'از نقشه اسلات‌ها موقعیتت را انتخاب و ورودی را پرداخت کن.',
    step4Title: '🔓 وارد روم شو',
    step4Desc: 'Room ID و رمز به محض انتشار به تو اعلام می‌شود.',
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
    backToRooms: '« بازگشت به روم‌ها',
    tacticalRadio: 'بیسیم کالاف (Soundboard)'
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
    heroSub: 'Discover competitive CODM rooms, pick your tactical squad slot on live tactical maps, verify payments instantly, and win cash prize pools! 🏆',
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
    featPayTitle: 'Multi-Channel Checkout',
    featPayDesc: 'Wallet balance, Card-to-Card receipt upload, or online instant payment gateways.',
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
    backToRooms: '« Back to Rooms',
    tacticalRadio: 'Tactical Radio (Soundboard)'
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
  
  // Update header and navigation labels
  $('#langTxt').textContent = CUR_LANG === 'fa' ? 'EN' : 'FA';
  $('#navHome').textContent = t('navHome');
  $('#navRooms').textContent = t('navRooms');
  $('#navMeta').textContent = t('navMeta');
  $('#navDogtag').textContent = t('navDogtag');
  $('#navHelp').textContent = t('navHelp');
  
  // Update mobile bottom nav
  $('#mobNavHome').textContent = t('mobHome');
  $('#mobNavRooms').textContent = t('mobRooms');
  $('#mobNavMeta').textContent = t('mobMeta');
  $('#mobNavDogtag').textContent = t('mobDogtag');
  $('#mobNavProfile').textContent = t('mobProfile');
  
  // Re-render current page and top action bar
  renderTop();
  route();
  AudioFX.play('click');
}

/* ─────────── سیستم افکت‌های صوتی تاکتیکال (Web Audio API) ─────────── */
const AudioFX = (() => {
  let ctx = null;
  let enabled = localStorage.getItem('codm_sfx') !== 'false';

  function init() {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) ctx = new AudioContextClass();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function toggle() {
    enabled = !enabled;
    localStorage.setItem('codm_sfx', enabled ? 'true' : 'false');
    updateBtn();
    if (enabled) {
      init();
      play('click');
    }
    toast(enabled ? (CUR_LANG === 'en' ? '🔊 SFX Enabled' : '🔊 صدای تاکتیکال فعال شد') : (CUR_LANG === 'en' ? '🔇 SFX Muted' : '🔇 صدای بازی قطع شد'), 'info', 1800);
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
      const t = ctx.currentTime;

      if (type === 'click') {
        // Tactical high frequency chirp
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
      } else if (type === 'lock') {
        // Squad / Slot target lock chime
        [1100, 1760].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.06);
          g.gain.setValueAtTime(0.15, t + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.12);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t + idx * 0.06);
          osc.stop(t + idx * 0.06 + 0.12);
        });
      } else if (type === 'headshot') {
        // High crisp headshot chime
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, t);
        osc.frequency.exponentialRampToValueAtTime(3200, t + 0.15);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      } else if (type === 'nuke') {
        // Tactical Nuke alarm sweep
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(750, t + 0.4);
        osc.frequency.linearRampToValueAtTime(220, t + 0.8);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.85);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.85);
      } else if (type === 'gunshot') {
        // Sniper gunshot crack
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        noise.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        noise.start(t);
      } else if (type === 'reload') {
        // Gun cock & reload double click
        [0, 0.11].forEach((delay) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(700, t + delay);
          osc.frequency.exponentialRampToValueAtTime(300, t + delay + 0.04);
          g.gain.setValueAtTime(0.12, t + delay);
          g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.04);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t + delay);
          osc.stop(t + delay + 0.04);
        });
      }
    } catch (e) {}
  }

  return { init, toggle, play, updateBtn, isEnabled: () => enabled };
})();
window.AudioFX = AudioFX;

/* ─────────── تعاریف پایه روم‌ها ─────────── */
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

/* ─────────── لایه API با فالبک هوشمند ─────────── */
async function api(path, opts = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (S.token) h['Authorization'] = 'Bearer ' + S.token;

  // First try the configured worker URL if set
  if (S.api) {
    try {
      const r = await fetch(S.api + path, {
        method: opts.method || 'GET',
        headers: h,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
      });
      if (r.ok || r.status < 500) {
        const data = await r.json();
        if (data && data.ok) return data;
      }
    } catch (e) {
      // Fallback silently to server proxy
    }
  }

  // Fallback to local server proxy /api
  try {
    const localRes = await fetch(path, {
      method: opts.method || 'GET',
      headers: h,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    });
    const localData = await localRes.json();
    if (localData && localData.ok) return localData;
    throw new Error(localData.error || 'Server error');
  } catch (err) {
    if (!opts.silent) {
      toast(CUR_LANG === 'en' ? 'Server is syncing tactical data...' : 'در حال همگام‌سازی اطلاعات با سرور...', 'info');
    }
    throw err;
  }
}

/* ─────────── ابزار UI ─────────── */
function toast(msg, type = 'info', ms = 3200) {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  $('#toastRoot').appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = '.35s';
    setTimeout(() => t.remove(), 350);
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

/* ─────────── انیمیشن‌ها و Reveal ─────────── */
const Reveal = {
  io: null,
  arm() {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!els.length) return;
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
      }, { threshold: 0.1 });
    }
    els.forEach((el) => this.io.observe(el));
  }
};
window.Reveal = Reveal;

function countUp(el, target) {
  const n = Number(target) || 0;
  if (!el) return;
  const dur = 1000, t0 = performance.now();
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur);
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
      <div class="field"><label>${isEn ? 'Admin Passcode (Optional)' : 'کد مدیر (اختیاری — مخصوص ادمین‌ها)'}</label><input id="as" class="ltr" placeholder="Admin Secret"></div>` : ''}
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

/* ─────────── هدر و دکمه‌های اکشن ─────────── */
function renderTop() {
  const el = $('#topActions');
  const isEn = CUR_LANG === 'en';
  if (S.me) {
    el.innerHTML = `
      ${S.me.role === 'admin' ? `<a class="btn ghost sm" href="#/admin">🛡 <span class="topActionsAdminTxt">${t('adminPanel')}</span></a>` : ''}
      <div class="userchip" onclick="location.hash='#/profile'" title="${isEn ? 'My Profile' : 'حساب من'}">
        <span class="nm">${esc(S.me.display_name || S.me.username)}</span>
        <span class="wal">${isEn ? money(S.me.wallet) + ' T' : fa(money(S.me.wallet)) + ' ت'}</span>
      </div>`;
  } else {
    el.innerHTML = `<button class="btn sm" onclick="authModal('login')">${t('loginRegister')}</button>`;
  }
}
window.renderTop = renderTop;

/* ─────────── روتر SPA ─────────── */
async function route() {
  const h = (location.hash || '#/').slice(1);
  const app = $('#app');
  const parts = h.split('/').filter(Boolean);
  const rootPart = parts[0] || 'home';

  // Update desktop navigation active class
  $$('.mainnav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === rootPart));
  // Update mobile bottom nav active class
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
        <h2>${CUR_LANG === 'en' ? 'Signal Interrupted' : 'ارتباط با سرور برقرار نشد'}</h2>
        <p class="mut">${esc(e.message || '')}</p><br>
        <button class="btn" onclick="route()">🔄 ${CUR_LANG === 'en' ? 'Retry Connection' : 'تلاش دوباره'}</button>
      </div>`;
  }
}
window.route = route;

/* ─────────── ویو ۱: صفحه اصلی (Home) ─────────── */
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
        <button class="btn ghost lg" onclick="AudioFX.play('click');location.hash='#/meta'">${isEn ? '🔫 Meta Gunsmith' : '🔫 لوداوت‌های متای سیزن'}</button>
        <button class="btn ghost lg" onclick="AudioFX.play('click');location.hash='#/dogtag'">${isEn ? '🎖️ 3D Dogtag Card' : '🎖️ ساخت کارت گیمری'}</button>
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

/* ─────────── ویو ۳: جزئیات روم و اسلات‌مپ تاکتیکال ─────────── */
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

  // Group slots into teams
  const teams = {};
  (r.slots || []).forEach((s) => {
    (teams[s.team_label] = teams[s.team_label] || []).push(s);
  });

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
    </div>
  </div>`;
  Reveal.arm();
}

window.slotClick = (no, status, isMine, canJoin) => {
  AudioFX.play('click');
  if (!S.me) return authModal('login');
  if (isMine) return toast(CUR_LANG === 'en' ? 'This slot is already yours 🙂' : 'این جایگاه مال خودت است 🙂', 'info');
  if (status !== 'free') return toast(CUR_LANG === 'en' ? 'Slot already claimed — pick another' : 'این جایگاه رزرو شده — یکی دیگر را انتخاب کن', 'err');
  if (!canJoin) return toast(CUR_LANG === 'en' ? 'Tournament is currently closed' : 'این روم در وضعیت فعلی قابل ثبت‌نام نیست', 'err');

  // Trigger reservation modal
  const fee = CUR_ROOM.room.entry_fee;
  const isEn = CUR_LANG === 'en';
  AudioFX.play('lock');
  modal(`
    <h3>🎯 ${isEn ? `Lock Slot #${no}` : `رزرو موقعیت شماره ${fa(no)}`}</h3>
    <p class="msub">${isEn ? `Tournament: ${esc(CUR_ROOM.room.title)}` : `روم: ${esc(CUR_ROOM.room.title)}`}</p>
    <div style="background:var(--panel2);padding:14px;border-radius:8px;border:1px solid var(--line);margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>${t('entryFee')}:</span><b style="color:var(--acc2)">${fee > 0 ? (isEn ? money(fee) + ' Toman' : fa(money(fee)) + ' تومان') : t('free')}</b></div>
      <div style="display:flex;justify-content:space-between"><span>${isEn ? 'Your Wallet' : 'موجودی کیف پول شما'}:</span><b>${isEn ? money(S.me.wallet) + ' Toman' : fa(money(S.me.wallet)) + ' تومان'}</b></div>
    </div>
    <button class="btn blk lg good" onclick="doJoin(${CUR_ROOM.room.id}, ${no})">✅ ${isEn ? 'Confirm & Join' : 'تایید و ثبت‌نام نهایی'}</button>
  `);
};

async function doJoin(roomId, slotNo) {
  try {
    AudioFX.play('lock');
    await api(`/api/rooms/${roomId}/join`, { method: 'POST', body: { slot_no: slotNo, method: 'wallet' } });
    closeModal();
    AudioFX.play('headshot');
    toast(CUR_LANG === 'en' ? 'Slot confirmed successfully! 🎮' : 'جایگاه با موفقیت رزرو شد! 🎮', 'ok');
    viewRoom(roomId);
  } catch (e) {
    toast(e.message, 'err');
  }
}
window.doJoin = doJoin;

/* ─────────── ویو ۴: استودیو لوداوت‌های متای سیزن (Gunsmith Meta) ─────────── */
const META_GUNS = [
  {
    id: 'dlq33',
    name: 'DL Q33',
    category: 'sniper',
    typeFa: 'تک‌تیرانداز اسطوره‌ای',
    typeEn: 'Legendary Sniper Rifle',
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
    typeFa: 'شاتگان وان‌شات تکه‌تکه‌کننده',
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
    typeFa: 'رایفل لیزری بدون لگد',
    typeEn: 'Zero Recoil Tactical AR',
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
    typeFa: 'مسلسل سنگین رگباری دیوانه‌وار',
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
      <h1>🔫 <span>${isEn ? 'SEASON META' : 'متای سیزن'}</span> ${isEn ? 'GUNSMITH BUILDS' : 'کالاف دیوتی موبایل'}</h1>
      <p>${isEn ? 'Top-tier tournament approved loadouts with one-click Gunsmith codes and combat attachments' : 'بهترین اتچمنت‌های مسابقات رسمی با کدهای گان‌اسمیت و آمار دقیق قدرت سلاح'}</p>
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
            <span class="gun-tier-badge">S-TIER</span>
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

/* ─────────── ویو ۵: استودیو کارت گیمری و داگ‌تگ ۳D (Dogtag Generator) ─────────── */
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
      <p>${isEn ? 'Design your elite holographic soldier ID card, customize weapon camo foils, and download high-res PNG to share!' : 'کارت نظامی اختصاصی خودت را بساز، متالیک فویل را انتخاب کن و برای اشتراک‌گذاری در تلگرام و اینستاگرام با کیفیت بالا دانلود کن'}</p>
    </div>

    <div class="dogtag-grid">
      <!-- پیش‌نمایش سه‌بعدی کارت -->
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

      <!-- فرم تنظیمات کارت -->
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
  if (card) {
    card.className = `dogtag-card camo-${DT_DATA.camo}`;
  }
};

window.downloadDogtagPng = () => {
  AudioFX.play('click');
  const canvas = document.createElement('canvas');
  canvas.width = 860;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');

  // Background
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

  // Border
  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 820, 500);

  // Header
  ctx.fillStyle = '#ff9800';
  ctx.font = 'bold 30px "Russo One", sans-serif';
  ctx.fillText('CODM ROOMS | TACTICAL SOLDIER ID', 45, 75);

  // Rank Badge
  ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
  ctx.fillRect(620, 45, 190, 42);
  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = 2;
  ctx.strokeRect(620, 45, 190, 42);
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 20px "Russo One", sans-serif';
  ctx.fillText('👑 ' + DT_DATA.rank.toUpperCase(), 635, 74);

  // IGN
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px "Russo One", sans-serif';
  ctx.fillText(DT_DATA.ign, 45, 190);

  // UID & Clan
  ctx.fillStyle = '#ffb74d';
  ctx.font = '24px monospace';
  ctx.fillText('UID: ' + DT_DATA.uid, 45, 240);

  ctx.fillStyle = '#cfd8dc';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`CLAN: ${DT_DATA.clan}   |   ROLE: ${DT_DATA.role}`, 45, 290);

  // Stats Box
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

  // Download Trigger
  const a = document.createElement('a');
  a.download = `CODM_DOGTAG_${DT_DATA.ign}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  AudioFX.play('headshot');
  toast(CUR_LANG === 'en' ? 'Dogtag PNG downloaded! 🏆' : 'کارت گیمری با کیفیت بالا دانلود شد! 🏆', 'ok');
};

/* ─────────── مودال بیسیم و دیالوگ‌های معروف کالاف (Tactical Radio) ─────────── */
function tacticalRadioModal() {
  AudioFX.play('click');
  const isEn = CUR_LANG === 'en';
  modal(`
    <h3>📻 ${isEn ? 'CODM Tactical Radio & Callouts' : 'بیسیم و دیالوگ‌های معروف کالاف'}</h3>
    <p class="msub">${isEn ? 'Click any voice alert to broadcast realistic synthesized military radio sound effects' : 'برای پخش صداها و دیالوگ‌های معروف میدان نبرد روی دکمه‌ها کلیک کن'}</p>
    <div class="soundboard-grid">
      <div class="sfx-card" onclick="AudioFX.play('nuke')">
        <span class="sfx-icon-lg">☢️</span>
        <span class="sfx-title">${isEn ? 'Tactical Nuke' : 'تاکتیکال نیوک'}</span>
        <span class="sfx-desc">${isEn ? 'Incoming Nuke Warning' : 'هشدار انفجار اتمی'}</span>
      </div>
      <div class="sfx-card" onclick="AudioFX.play('headshot')">
        <span class="sfx-icon-lg">🎯</span>
        <span class="sfx-title">${isEn ? 'Headshot Hit' : 'هدشات طلایی'}</span>
        <span class="sfx-desc">${isEn ? 'Crisp sniper impact' : 'صدای لذت‌بخش هدشات'}</span>
      </div>
      <div class="sfx-card" onclick="AudioFX.play('gunshot')">
        <span class="sfx-icon-lg">🔫</span>
        <span class="sfx-title">${isEn ? 'Sniper Crack' : 'شلیک اسنایپر'}</span>
        <span class="sfx-desc">${isEn ? 'DL Q33 firing bolt' : 'شلیک سنگین تفنگ تک‌تیر'}</span>
      </div>
      <div class="sfx-card" onclick="AudioFX.play('reload')">
        <span class="sfx-icon-lg">⚙️</span>
        <span class="sfx-title">${isEn ? 'Weapon Cock' : 'مسلح کردن اسلحه'}</span>
        <span class="sfx-desc">${isEn ? 'Mag reload click-clack' : 'صدای خشاب‌گذاری تاکتیکال'}</span>
      </div>
      <div class="sfx-card" onclick="AudioFX.play('lock')">
        <span class="sfx-icon-lg">🚀</span>
        <span class="sfx-title">${isEn ? 'Target Lock' : 'قفل موشک'}</span>
        <span class="sfx-desc">${isEn ? 'Predator missile target' : 'قفل هدف پرداتور'}</span>
      </div>
      <div class="sfx-card" onclick="AudioFX.play('click')">
        <span class="sfx-icon-lg">📡</span>
        <span class="sfx-title">${isEn ? 'UAV Radar' : 'رادار پهپاد UAV'}</span>
        <span class="sfx-desc">${isEn ? 'Enemy sweep ping' : 'ردیابی دشمن روی مپ'}</span>
      </div>
    </div>
  `);
}
window.tacticalRadioModal = tacticalRadioModal;

/* ─────────── ویو ۶: پروفایل و کیف پول (Profile) ─────────── */
async function viewProfile() {
  if (!S.me) { authModal('login'); return; }
  const isEn = CUR_LANG === 'en';
  $('#app').innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head reveal">
      <h2>👤 <span>${isEn ? 'SOLDIER HQ' : 'حساب کاربری'}</span></h2>
      <p>${isEn ? 'Manage your balance, referrals, and active tournament roster' : 'مدیریت کیف پول، روم‌های شرکت‌کرده و پاداش دعوت'}</p>
    </div>
    <div style="max-width:700px;margin:0 auto;background:var(--panel);border:1px solid var(--line);clip-path:var(--clip);padding:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:18px">
        <div>
          <h2 style="font-size:22px;color:#fff">${esc(S.me.display_name || S.me.username)}</h2>
          <small class="mut">@${esc(S.me.username)}</small>
        </div>
        <div style="text-align:end">
          <div style="font-size:12px;color:var(--mut)">${isEn ? 'Wallet Balance' : 'موجودی کیف پول'}</div>
          <div style="font-size:24px;font-family:'Russo One',sans-serif;color:var(--acc2)">${isEn ? money(S.me.wallet) + ' T' : fa(money(S.me.wallet)) + ' تومان'}</div>
        </div>
      </div>
      <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" onclick="AudioFX.play('click');location.hash='#/rooms'">${t('heroBtnRooms')}</button>
        <button class="btn ghost" onclick="AudioFX.play('click');location.hash='#/dogtag'">${isEn ? '🎖️ My Dogtag' : '🎖️ کارت گیمری من'}</button>
        <button class="btn bad sm" style="margin-inline-start:auto" onclick="logout()">${isEn ? 'Sign Out' : 'خروج از حساب'}</button>
      </div>
    </div>
  </section>`;
  Reveal.arm();
}

/* ─────────── ویو ۷: پنل ادمین (Admin) ─────────── */
async function viewAdmin() {
  if (!S.me || S.me.role !== 'admin') {
    location.hash = '#/';
    return;
  }
  const isEn = CUR_LANG === 'en';
  $('#app').innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head reveal">
      <h2>🛡️ <span>${isEn ? 'ADMIN HEADQUARTERS' : 'پنل مدیریت کل'}</span></h2>
      <p>${isEn ? 'Manage rooms, tournament statuses, and platform configurations' : 'مدیریت روم‌ها، تایید پرداخت‌ها و تنظیمات سامانه'}</p>
    </div>
    <div style="max-width:800px;margin:0 auto;background:var(--panel);border:1px solid var(--line);clip-path:var(--clip);padding:24px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        <button class="btn" onclick="AudioFX.play('click');location.hash='#/rooms'">${isEn ? 'View Rooms' : 'مشاهده روم‌ها'}</button>
        <button class="btn ghost" onclick="AudioFX.play('click');location.hash='#/'">${isEn ? 'Home' : 'صفحه اصلی'}</button>
      </div>
      <div class="malert info">${isEn ? 'Connected to Cloudflare D1 Backend. All database mutations sync seamlessly with Telegram and Bale bots.' : 'متصل به سرور و دیتابیس D1 کلادفلر. تمامی اطلاعات به صورت لحظه‌ای با ربات‌های تلگرام و بله همگام است.'}</div>
    </div>
  </section>`;
  Reveal.arm();
}

/* ─────────── ویو ۸: راهنما (Help) ─────────── */
function viewHelp() {
  const isEn = CUR_LANG === 'en';
  $('#app').innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head reveal">
      <h2>📖 <span>${isEn ? 'PLATFORM GUIDE' : 'راهنمای پلتفرم'}</span></h2>
      <p>${isEn ? 'Complete walkthrough on tournament registrations and rewards' : 'نحوه ثبت‌نام، انتخاب موقعیت، اتصال به ربات‌ها و دریافت جوایز نقدی'}</p>
    </div>
    <div class="steps">
      <div class="step reveal rv-d1"><h3>۱. ${isEn ? 'Account Setup' : 'ساخت حساب یا استارت ربات'}</h3><p>${isEn ? 'Sign up on the site or send /start to our verified bots.' : 'در سایت ثبت‌نام کن یا در ربات تلگرام/بله /start بزن.'}</p></div>
      <div class="step reveal rv-d2"><h3>۲. ${isEn ? 'Pick Your Squad Slot' : 'انتخاب روم و اسلات'}</h3><p>${isEn ? 'Pick your tournament mode and choose your squad position.' : 'روم مورد نظرت را پیدا کن و موقعیتت را در تیم قفل کن.'}</p></div>
      <div class="step reveal rv-d3"><h3>۳. ${isEn ? 'Instant Verification' : 'پرداخت و تایید نهایی'}</h3><p>${isEn ? 'Pay via wallet balance or card transfer to get confirmed.' : 'با کیف پول یا کارت به کارت هزینه را پرداخت کن و قطعی شو.'}</p></div>
      <div class="step reveal rv-d4"><h3>۴. ${isEn ? 'Room Access & Prizes' : 'دریافت رمز و جایزه نقدی'}</h3><p>${isEn ? 'Room credentials sent prior to launch. Cash prizes deposited directly.' : 'Room ID و رمز برایت فرستاده می‌شود و جوایز مستقیم به کیف پولت می‌آید.'}</p></div>
    </div>
  </section>`;
  Reveal.arm();
}

/* ─────────── پک انیمیشن و افکت‌های بصری (FX) ─────────── */
const FX = (() => {
  const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  function boot() {
    const b = document.getElementById('boot');
    if (!b) return;
    try {
      if (sessionStorage.getItem('codm_boot')) {
        b.remove();
        return;
      }
      sessionStorage.setItem('codm_boot', '1');
    } catch (_) {}

    b.classList.add('vis');
    const dismiss = () => {
      b.classList.add('out');
      setTimeout(() => b.remove(), 700);
    };
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

  function init() {
    boot();
    cursorFX();
  }

  return { init, wipe, home, replay };
})();
window.FX = FX;

/* ─────────── راه‌اندازی اولیه اپلت ─────────── */
async function bootApp() {
  // Sync language state
  document.documentElement.lang = CUR_LANG;
  document.documentElement.dir = CUR_LANG === 'en' ? 'ltr' : 'rtl';
  $('#langTxt').textContent = CUR_LANG === 'fa' ? 'EN' : 'FA';
  AudioFX.updateBtn();

  // Try fetching current session if token exists
  if (S.token) {
    try {
      const r = await api('/api/me', { silent: true });
      if (r && r.user) S.me = r.user;
    } catch (e) {
      S.me = null;
    }
  }

  renderTop();

  // Wire header controls
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
