/* ══════════════════════════════════════════════════════════
   CODM ROOMS — SPA v1.0
   سایت + پنل ادمین — متصل به Cloudflare Worker با دیتابیس D1
   ══════════════════════════════════════════════════════════ */
'use strict';

const FA_D = '۰۱۲۳۴۵۶۷۸۹';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fa = (n) => String(n).replace(/\d/g, (d) => FA_D[+d]);
const money = (n) => (Number(n) || 0).toLocaleString('en-US').replace(/,/g, '،');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MODES = {
  tdm: { fa: 'نبرد تیمی TDM', emoji: '🔫', def_teams: 2, def_size: 5 },
  snd: { fa: 'جستجو و نابودی S&D', emoji: '💣', def_teams: 2, def_size: 4 },
  snd6: { fa: 'جستجو و نابودی ۶v۶', emoji: '💣', def_teams: 2, def_size: 6 },
  dom: { fa: 'سلطه DOM', emoji: '🚩', def_teams: 2, def_size: 5 },
  gun: { fa: 'گانفایت ۲v۲', emoji: '🤝', def_teams: 2, def_size: 2 },
  one: { fa: 'تک‌به‌تک 1v1', emoji: '⚔️', def_teams: 2, def_size: 1 },
  sniper: { fa: 'اسنایپر 1v1', emoji: '🎯', def_teams: 2, def_size: 1 },
  knife: { fa: 'چاقو فقط 1v1', emoji: '🔪', def_teams: 2, def_size: 1 },
  br: { fa: 'بتل رویال BR', emoji: '🪂', def_teams: 4, def_size: 4 },
  custom: { fa: 'سفارشی', emoji: '🎮', def_teams: 2, def_size: 4 }
};
const RSTATUS = { open: ['باز', 'open'], full: ['تکمیل ظرفیت', 'full'], running: ['در حال اجرا', 'running'], finished: ['پایان یافت', 'finished'], cancelled: ['لغو شد', 'cancelled'] };
const PAY_KIND = { entry: '🎮 ورودی روم', topup: '💰 شارژ کیف پول' };
const PAY_METHOD = { wallet: '💼 کیف پول', card: '💳 کارت به کارت', online: '🏦 درگاه', free: '🎁 رایگان' };

const S = {
  api: localStorage.getItem('codm_api') || (window.CODM_CFG && window.CODM_CFG.API_URL) || '',
  token: localStorage.getItem('codm_token') || '',
  me: null,
  cfg: null
};

/* ─────────── لایه API ─────────── */
async function api(path, opts = {}) {
  if (!S.api) { apiConfigModal(); throw new Error('no-api'); }
  const h = { 'Content-Type': 'application/json' };
  if (S.token) h['Authorization'] = 'Bearer ' + S.token;
  let r;
  try {
    r = await fetch(S.api + path, { method: opts.method || 'GET', headers: h, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  } catch (e) {
    toast('ارتباط با سرور برقرار نشد — آدرس Worker را بررسی کن', 'err');
    throw e;
  }
  let data = {};
  try { data = await r.json(); } catch (e) {}
  if (!data.ok) {
    if (r.status === 401 && S.token) { logout(false); }
    const msg = data.error || 'خطای ناشناخته (' + r.status + ')';
    if (!opts.silent) toast(msg, 'err');
    throw Object.assign(new Error(msg), { data });
  }
  return data;
}

/* ─────────── ابزار UI ─────────── */
function toast(msg, type = 'info', ms = 3400) {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  $('#toastRoot').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.4s'; setTimeout(() => t.remove(), 400); }, ms);
}
function modal(html, wide) {
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'modal-ov';
  ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><button class="mclose" onclick="closeModal()">✕</button>${html}</div>`;
  ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(); });
  $('#modalRoot').appendChild(ov);
  document.body.style.overflow = 'hidden';
  if ($('#nrTeams')) updLayoutHint();
}
function closeModal() { const m = $('.modal-ov'); if (m) m.remove(); document.body.style.overflow = ''; }
window.closeModal = closeModal;
function copyTxt(txt, btn) {
  navigator.clipboard.writeText(txt).then(() => { toast('کپی شد ✅', 'ok', 1600); }).catch(() => {});
}
window.copyTxt = copyTxt;

/* ─────────── انیمیشن‌ها ─────────── */
const Reveal = {
  io: null,
  arm() {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
    if (!this.io) this.io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); this.io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    els.forEach((el) => this.io.observe(el));
  }
};
window.Reveal = Reveal;
/* شمارنده متحرک آمار */
function countUp(el, target) {
  const n = Number(target) || 0;
  if (!el) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches || n <= 0) { el.textContent = fa(money(n)); return; }
  const dur = 1100, t0 = performance.now();
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = fa(money(Math.round(n * eased)));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
window.countUp = countUp;
function armStats() {
  document.querySelectorAll('[data-cnt]').forEach((el) => { if (el.dataset.done) return; el.dataset.done = '1'; countUp(el, el.dataset.cnt); });
}

/* ─────────── تنظیم آدرس سرور ─────────── */
function apiConfigModal(msg) {
  modal(`
    <h3>⚙️ اتصال به سرور</h3>
    <p class="msub">${msg || 'آدرس Worker خود را وارد کن (از README مراحل دیپلوی را ببین). مثال:'} <code class="ltr">https://codm-rooms.xxx.workers.dev</code></p>
    <div class="malert info">این آدرس فقط یک بار روی همین مرورگر ذخیره می‌شود. برای همه کاربران، بهتر است در فایل <b>config.js</b> مخزن تنظیم شود.</div>
    <div class="field"><label>آدرس Worker</label><input id="apiIn" class="ltr" placeholder="https://xxx.workers.dev" value="${esc(S.api)}"></div>
    <button class="btn blk" onclick="saveApi()">💾 ذخیره و اتصال</button>
  `);
}
window.saveApi = async () => {
  let v = $('#apiIn').value.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(v)) return toast('آدرس باید با https:// شروع شود', 'err');
  toast('در حال بررسی اتصال...', 'info', 1500);
  try {
    const r = await fetch(v + '/api/health');
    const j = await r.json();
    if (!j.ok) throw new Error();
    S.api = v; localStorage.setItem('codm_api', v);
    closeModal();
    toast('اتصال موفق! ' + (j.service || ''), 'ok');
    boot();
  } catch (e) { toast('این آدرس پاسخ نداد — Worker را چک کن', 'err'); }
};
window.saveApi && (window.apiConfigModal = apiConfigModal);

/* ─────────── احراز هویت ─────────── */
function authModal(tab = 'login') {
  if (!S.api) return apiConfigModal();
  modal(`
    <h3>${tab === 'login' ? '🔐 ورود' : '🪖 ساخت حساب جدید'}</h3>
    <p class="msub">${tab === 'login' ? 'به میدان نبرد خوش برگشتی، سرباز!' : 'حساب بساز و در روم‌ها ثبت‌نام کن.'}</p>
    <div class="field"><label>نام کاربری (انگلیسی)</label><input id="au" class="ltr" placeholder="username" autocomplete="username"></div>
    <div class="field"><label>رمز عبور</label><input id="ap" type="password" class="ltr" placeholder="••••••" autocomplete="current-password"></div>
    ${tab === 'register' ? `<div class="field"><label>نام نمایشی (اختیاری)</label><input id="ad" placeholder="مثلاً: Sniper_King"></div>
    <div class="field"><label>کد مدیر (اختیاری — فقط برای مدیریت)</label><input id="as" class="ltr" placeholder="اگر ادمین هستی کد را وارد کن"></div>` : ''}
    <div id="authErr"></div>
    <button class="btn blk lg" onclick="doAuth('${tab}')">${tab === 'login' ? '🔓 ورود' : '⚔️ ثبت‌نام'}</button>
    <p class="msub" style="text-align:center;margin-top:14px">${tab === 'login' ? 'حساب نداری؟' : 'قبلاً ثبت‌نام کرده‌ای؟'}
      <a href="javascript:void(0)" style="color:var(--acc);font-weight:700" onclick="authModal('${tab === 'login' ? 'register' : 'login'}')">${tab === 'login' ? 'ثبت‌نام کن' : 'وارد شو'}</a></p>
  `);
}
window.authModal = authModal;
async function doAuth(tab) {
  const username = $('#au').value.trim(), password = $('#ap').value;
  try {
    let r;
    if (tab === 'login') r = await api('/api/login', { method: 'POST', body: { username, password } });
    else {
      r = await api('/api/register', { method: 'POST', body: { username, password, display_name: $('#ad').value.trim(), admin_secret: $('#as') ? $('#as').value.trim() : '' } });
      if (r.is_first_admin) toast('👑 شما اولین کاربر هستید — مدیر کل شدید!', 'ok', 5000);
    }
    S.token = r.token; localStorage.setItem('codm_token', r.token);
    S.me = r.user;
    closeModal();
    toast((tab === 'login' ? 'خوش برگشتی ' : 'خوش آمدی ') + (r.user.display_name || r.user.username) + ' 🪖', 'ok');
    boot(); route();
  } catch (e) {
    $('#authErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`;
  }
}
window.doAuth = doAuth;
function logout(go = true) {
  api('/api/logout', { method: 'POST', silent: true }).catch(() => {});
  S.token = ''; S.me = null; localStorage.removeItem('codm_token');
  renderTop();
  if (go) { location.hash = '#/'; route(); }
}
window.logout = logout;

/* ─────────── هدر ─────────── */
function renderTop() {
  const el = $('#topActions');
  if (S.me) {
    el.innerHTML = `
      ${S.me.role === 'admin' ? `<a class="btn ghost sm" href="#/admin">🛡 <span class="topActionsAdminTxt">پنل مدیریت</span></a>` : ''}
      <div class="userchip" onclick="location.hash='#/profile'" title="حساب من">
        <span class="nm">${esc(S.me.display_name || S.me.username)}</span>
        <span class="wal">${money(S.me.wallet)} ت</span>
      </div>`;
  } else {
    el.innerHTML = `<button class="btn sm" onclick="authModal('login')">🔐 ورود / ثبت‌نام</button>`;
  }
}
window.renderTop = renderTop;

/* ─────────── روتر ─────────── */
async function route() {
  const h = (location.hash || '#/').slice(1);
  const app = $('#app');
  const parts = h.split('/').filter(Boolean);
  $$('.mainnav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === (parts[0] || 'home')));
  window.scrollTo({ top: 0 });
  try {
    if (!parts.length) await viewHome();
    else if (parts[0] === 'rooms') await viewRooms();
    else if (parts[0] === 'room' && parts[1]) await viewRoom(num2(parts[1]));
    else if (parts[0] === 'profile') await viewProfile();
    else if (parts[0] === 'admin') await viewAdmin();
    else if (parts[0] === 'help') viewHelp();
    else viewHome();
  } catch (e) {
    if (e && e.message === 'no-api') return;
    app.innerHTML = `<div class="empty"><div class="big">💀</div><h2>مشکلی پیش آمد</h2><p class="mut">${esc(e.message || '')}</p><br><button class="btn" onclick="route()">🔄 تلاش دوباره</button></div>`;
  }
}
window.route = route;
function num2(v) { const n = parseInt(v, 10); return isFinite(n) ? n : 0; }

/* ─────────── صفحه خانه ─────────── */
async function viewHome() {
  let stats = { users: 0, rooms: 0, entries: 0, prizesPaid: 0 };
  try { stats = await api('/api/public/stats'); } catch (e) {}
  $('#app').innerHTML = `
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-in">
      <span class="hero-kicker">🎯 پلتفرم شماره ۱ روم‌های CODM موبایل</span>
      <h1>به <span class="glow">میدان نبرد</span> خوش آمدی، سرباز!</h1>
      <p class="sub">روم‌های کالاف دیوتی موبایل را اینجا پیدا کن، موقعیت خودت را انتخاب کن، آنلاین بپرداز و در روم قطعی شو. جوایز نقدی هم منتظر قهرمان‌هاست! 🏆</p>
      <div class="hero-cta">
        <button class="btn lg" onclick="location.hash='#/rooms'">🎮 ورود به روم‌ها</button>
        ${S.me ? `<button class="btn ghost lg" onclick="location.hash='#/profile'">👤 حساب من</button>` : `<button class="btn ghost lg" onclick="authModal('register')">🪖 ساخت حساب رایگان</button>`}
      </div>
      <div class="hero-badges">
        <div class="hbadge">⚡ ثبت‌نام آنی</div>
        <div class="hbadge">💳 پرداخت امن</div>
        <div class="hbadge">🔔 اطلاع‌رسانی خودکار ربات</div>
        <div class="hbadge">🏆 جوایز نقدی تضمینی</div>
      </div>
    </div>
  </section>
  <div class="stats-strip"><div class="stats-grid">
    <div class="stat"><div class="v" data-cnt="${num2(stats.users)}">۰</div><div class="l">🪖 سرباز ثبت‌نام‌شده</div></div>
    <div class="stat"><div class="v" data-cnt="${num2(stats.rooms)}">۰</div><div class="l">🎮 روم برگزارشده</div></div>
    <div class="stat"><div class="v" data-cnt="${num2(stats.entries)}">۰</div><div class="l">🎯 ورودی قطعی</div></div>
    <div class="stat"><div class="v" data-cnt="${num2(stats.prizesPaid)}">۰</div><div class="l">🏆 جوایز پرداخت‌شده (تومان)</div></div>
  </div></div>
  <section class="sec">
    <div class="sec-head reveal"><h2>چرا <span>CODM ROOMS</span>؟</h2><p>هر چیزی که برای یک تورنمنت حرفه‌ای لازم داری، یک‌جا</p></div>
    <div class="feat-grid">
      <div class="feat reveal rv-d1"><div class="ic">🗺</div><h3>انتخاب موقعیت روی نقشه</h3><p>مثل بازی واقعی! اسلات‌مپ زنده هر روم را ببین، تیم و جایگاهت را خودت انتخاب کن و رزروش کن.</p></div>
      <div class="feat reveal rv-d2"><div class="ic">💳</div><h3>پرداخت چندروشه</h3><p>کیف پول داخلی، کارت به کارت یا درگاه آنلاین — هرطور راحت هستی. وضعیت پرداخت لحظه‌ای آپدیت می‌شود.</p></div>
      <div class="feat reveal rv-d3"><div class="ic">🤖</div><h3>ربات تلگرام + بله</h3><p>همه‌چیز از داخل ربات هم انجام می‌شود! ثبت‌نام، پرداخت، اطلاع‌رسانی Room ID و جوایز — با یک دیتابیس مشترک با سایت.</p></div>
      <div class="feat reveal rv-d4"><div class="ic">🏆</div><h3>جوایز نقدی شفاف</h3><p>جوایز قهرمان‌ها توسط مدیریت تایید و مستقیماً به کیف پول واریز می‌شود. همه‌چیز قابل رهگیری است.</p></div>
    </div>
  </section>
  <section class="sec" style="padding-top:10px">
    <div class="sec-head reveal"><h2>چهار قدم تا <span>میدان</span></h2></div>
    <div class="steps">
      <div class="step reveal rv-d1"><h3>🪖 حساب بساز</h3><p>با ایمیل و رمز، در کمتر از ۳۰ ثانیه. یا فقط در ربات /start بزن.</p></div>
      <div class="step reveal rv-d2"><h3>🎮 روم را انتخاب کن</h3><p>TDM، S&D، بتل رویال و ده‌ها حالت دیگر — روم دلخواهت را پیدا کن.</p></div>
      <div class="step reveal rv-d3"><h3>🎯 جایگاهت را بگیر</h3><p>از نقشه اسلات‌ها موقعیتت را انتخاب و ورودی را پرداخت کن.</p></div>
      <div class="step reveal rv-d4"><h3>🔓 وارد روم شو</h3><p>Room ID و رمز، لحظه انتشار به تو اطلاع داده می‌شود. موفق باشی!</p></div>
    </div>
  </section>
  <div class="cta-box reveal"><div class="cta-in">
    <h2>آماده‌ای قهرمان بشی؟ 🔥</h2>
    <p>همین الان اولین رومت را رزرو کن — جایگاه‌ها محدودند!</p>
    <button class="btn lg" onclick="location.hash='#/rooms'">🎯 مشاهده روم‌های باز</button>
  </div></div>`;
  Reveal.arm(); armStats();
}

/* ─────────── لیست روم‌ها ─────────── */
const RF = { status: 'open', mode: 'all' };
async function viewRooms() {
  $('#app').innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head reveal"><h2>🎮 <span>روم‌های نبرد</span></h2><p>روم دلخواهت را انتخاب کن و جایگاهت را رزرو کن</p></div>
    <div class="filters" id="rfilters"></div>
    <div class="rooms-grid" id="roomsGrid"><div class="empty" style="grid-column:1/-1;padding:40px">⏳ در حال بارگذاری...</div></div>
  </section>`;
  renderFilters();
  await loadRooms();
}
function renderFilters() {
  const st = [['open', '🟢 باز'], ['all', 'همه'], ['full', '🟡 تکمیل'], ['running', '🔴 در جریان'], ['finished', '⚫️ پایان']];
  const modes = [['all', 'همه حالت‌ها'], ...Object.keys(MODES).map((k) => [k, MODES[k].fa])];
  $('#rfilters').innerHTML =
    st.map(([v, l]) => `<button class="chip ${RF.status === v ? 'on' : ''}" onclick="setF('status','${v}')">${l}</button>`).join('') +
    `<select class="chip" onchange="setF('mode',this.value)">${modes.map(([v, l]) => `<option value="${v}" ${RF.mode === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
}
window.setF = (k, v) => { RF[k] = v; renderFilters(); loadRooms(); };
async function loadRooms() {
  const g = $('#roomsGrid');
  if (!g) return;
  try {
    const r = await api(`/api/rooms?status=${RF.status}&mode=${RF.mode}`);
    if (!(r.rooms || []).length) { g.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">🕹</div><h3>رومی با این فیلترها پیدا نشد</h3><p class="mut">فیلترها را عوض کن یا بعداً سر بزن</p></div>`; Reveal.arm(); return; }
    g.innerHTML = r.rooms.map((rm, i) => roomCard(rm).replace('class="room-card"', `class="room-card reveal rv-d${(i % 5) + 1}"`)).join('');
    Reveal.arm();
  } catch (e) { g.innerHTML = `<div class="empty" style="grid-column:1/-1">⚠️ خطا در دریافت روم‌ها</div>`; }
}
function roomCard(rm) {
  const m = MODES[rm.mode] || MODES.custom;
  const pct = rm.total ? Math.round((rm.paid / rm.total) * 100) : 0;
  const [stl, stc] = RSTATUS[rm.status] || [rm.status, 'finished'];
  return `
  <div class="room-card" onclick="location.hash='#/room/${rm.id}'">
    <div class="room-top">
      <div class="room-mode">${m.emoji}</div>
      <div class="room-tt"><h3>${esc(rm.title)}</h3><div class="mm">${m.fa}${rm.map_name ? ' • 🗺 ' + esc(rm.map_name) : ''}</div></div>
      <span class="rbadge ${stc}">${stl}</span>
    </div>
    <div class="room-mid">
      <div><span class="k">💰 ورودی: </span><span class="v fee">${rm.entry_fee > 0 ? fa(money(rm.entry_fee)) + ' ت' : 'رایگان'}</span></div>
      <div><span class="k">🏆 جایزه: </span><span class="v prize">${rm.prize_pool > 0 ? fa(money(rm.prize_pool)) + ' ت' : '—'}</span></div>
      <div><span class="k">👥 چیدمان: </span><span class="v">${fa(rm.teams)}×${fa(rm.team_size)}</span></div>
      <div><span class="k">🕒 شروع: </span><span class="v">${esc(rm.start_time) || '—'}</span></div>
    </div>
    <div class="slotbar">
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      <div class="lbl"><span>${fa(rm.paid)}/${fa(rm.total)} بازیکن</span><span>${fa(pct)}٪ پر شده</span></div>
    </div>
    <div class="room-bot"><button class="btn blk sm">🎯 مشاهده و رزرو جایگاه</button></div>
  </div>`;
}

/* ─────────── جزئیات روم + اسلات‌مپ ─────────── */
let CUR_ROOM = null;
async function viewRoom(id) {
  const app = $('#app');
  app.innerHTML = `<div class="roomwrap"><div class="empty" style="padding:40px">⏳ در حال بارگذاری روم...</div></div>`;
  let r;
  try { r = await api('/api/rooms/' + id); } catch (e) { return; }
  CUR_ROOM = r;
  const rm = r.room, m = MODES[rm.mode] || MODES.custom;
  const [stl, stc] = RSTATUS[rm.status] || [rm.status, 'finished'];
  const pct = r.counts.total ? Math.round((r.counts.paid / r.counts.total) * 100) : 0;
  const mySlot = (r.slots || []).find((s) => S.me && s.user_id === S.me.id);
  const teams = {};
  (r.slots || []).forEach((s) => { (teams[s.team_label] = teams[s.team_label] || []).push(s); });
  let codemap = '';
  if (rm.room_id && rm.room_pass) {
    const canSee = S.me && (S.me.role === 'admin' || mySlot && mySlot.status === 'paid');
    codemap = `<div class="codemap"><div class="row"><span>🔓 اطلاعات روم ${canSee ? '' : '<small class="mut">(فقط برای بازیکنان قطعی)</small>'}</span></div>
      ${canSee ? `<div class="row"><span>🆔 Room ID:</span><code>${esc(rm.room_id)}</code><button class="copybtn" onclick="copyTxt('${esc(rm.room_id)}')">📋 کپی</button></div>
      <div class="row"><span>🔑 رمز:</span><code>${esc(rm.room_pass)}</code><button class="copybtn" onclick="copyTxt('${esc(rm.room_pass)}')">📋 کپی</button></div>`
      : `<div class="row mut" style="font-size:12.5px">🔒 برای دیدن اطلاعات، اول در این روم قطعی شو.</div>`}</div>`;
  }
  const adminBar = S.me && S.me.role === 'admin' ? `
    <div class="roomdesc" style="border-color:rgba(255,159,26,.45)">
      <b>🛡 ابزار مدیریت:</b>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn sm info" onclick="publishModal(${rm.id}, '${esc(rm.room_id)}', '${esc(rm.room_pass)}')">🔓 ارسال ID/Pass</button>
        <button class="btn sm good" onclick="roomStatus(${rm.id},'running','شروع شد')">▶️ شروع</button>
        <button class="btn sm ghost" onclick="roomStatus(${rm.id},'finished','پایان یافت')">🏁 پایان</button>
        <button class="btn sm bad" onclick="roomStatus(${rm.id},'cancelled','لغو شد')">❌ لغو + بازگشت وجه</button>
        <button class="btn sm ghost" onclick="editRoomModal(${rm.id})">✏️ ویرایش</button>
        <button class="btn sm ghost" onclick="delRoom(${rm.id})">🗑 حذف</button>
      </div>
    </div>` : '';
  app.innerHTML = `
  <div class="roomwrap">
    <div class="crumb" onclick="location.hash='#/rooms'">« بازگشت به روم‌ها</div>
    <div class="room-hero reveal">
      <div class="info">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div class="room-mode" style="width:56px;height:56px;font-size:27px">${m.emoji}</div>
          <div><h1>${esc(rm.title)}</h1><span class="rbadge ${stc}">${stl}</span></div>
        </div>
        <div class="meta">
          <span>🎮 <b>${m.fa}</b></span>
          ${rm.map_name ? `<span>🗺 نقشه: <b>${esc(rm.map_name)}</b></span>` : ''}
          <span>👥 <b>${fa(rm.teams)} تیم × ${fa(rm.team_size)} نفر</b></span>
          ${rm.start_time ? `<span>🕒 شروع: <b>${esc(rm.start_time)}</b></span>` : ''}
          ${rm.creator ? `<span>👤 برگزارکننده: <b>${esc(rm.creator)}</b></span>` : ''}
        </div>
      </div>
      <div class="pricebox">
        <div class="pp">${rm.entry_fee > 0 ? fa(money(rm.entry_fee)) : 'رایگان'}<small style="font-size:11px;color:var(--mut)">${rm.entry_fee > 0 ? ' تومان' : ''}</small></div>
        <div class="pl">ورودی هر بازیکن</div>
        ${rm.prize_pool > 0 ? `<div style="margin-top:10px;font-size:13px;color:var(--good)">🏆 جایزه: ${fa(money(rm.prize_pool))} تومان</div>` : ''}
      </div>
    </div>
    ${rm.description ? `<div class="roomdesc">📝 <b>توضیحات:</b> ${esc(rm.description)}</div>` : ''}
    ${rm.rules ? `<div class="roomdesc">📜 <b>قوانین:</b> ${esc(rm.rules)}</div>` : ''}
    ${codemap}
    ${mySlot ? `<div class="roomdesc" style="border-color:rgba(255,159,26,.5)">🎯 <b>جایگاه تو:</b> ${esc(mySlot.team_label)} / شماره ${fa(mySlot.slot_no)} — ${mySlot.status === 'paid' ? '✅ قطعی شد' : '⏳ در انتظار تایید پرداخت'} ${rm.status === 'open' ? `<button class="btn sm bad" style="margin-inline-start:10px" onclick="leaveRoom(${rm.id})">↩️ انصراف</button>` : ''}</div>` : ''}
    <div class="slots-title reveal"><h2>🎯 نقشه موقعیت‌ها</h2><span class="hint">🟢 آزاد — ⏳ در انتظار پرداخت — 🔒 قطعی</span></div>
    ${Object.keys(teams).map((tl) => `
      <div class="team-sec">
        <div class="team-lbl">🪖 ${esc(tl)}</div>
        <div class="slotrow">${teams[tl].map((s, si) => {
          const isMine = S.me && s.user_id === S.me.id;
          const who = s.status === 'free' ? 'آزاد' : (isMine ? 'تو!' : (s.status === 'pending' ? 'رزرو موقت' : esc(s.display_name || s.username || 'بازیکن')));
          return `<div class="slot ${s.status} ${isMine ? 'mine' : ''}" style="--si:${si}" onclick="slotClick(${s.slot_no},'${s.status}',${isMine},${rm.status === 'open' ? 1 : 0})">
            <div class="no">${fa(s.slot_no)}</div><div class="who">${who}</div></div>`;
        }).join('')}</div>
      </div>`).join('')}
    <div class="players-list">
      <h3>✅ بازیکنان قطعی (${fa(r.counts.paid)}/${fa(r.counts.total)})</h3>
      <div class="bar" style="height:7px;background:var(--bg2);border-radius:100px;overflow:hidden;border:1px solid var(--line);margin-bottom:14px"><div class="fill" style="height:100%;width:${pct}%;background:var(--grad)"></div></div>
      <div class="plist">${(r.slots || []).filter((s) => s.status === 'paid').map((s) => `<div class="pitem"><span class="pn">${fa(s.slot_no)}</span><span>${esc(s.display_name || s.username || '—')}</span><small class="mut">${esc(s.team_label)}</small></div>`).join('') || '<span class="mut">هنوز کسی قطعی نشده — اولین نفر باش! 🔥</span>'}</div>
      ${S.me && S.me.role === 'admin' && (r.slots || []).some((s) => s.status !== 'free') ? `<div style="margin-top:14px"><b style="font-size:13px">🛡 حذف بازیکن:</b><div class="plist" style="margin-top:10px">${(r.slots || []).filter((s) => s.status !== 'free').map((s) => `<button class="btn sm ghost" onclick="removeSlot(${rm.id},${s.slot_no})">✖ ${fa(s.slot_no)} - ${esc(s.display_name || s.username || '?')}</button>`).join('')}</div></div>` : ''}
    </div>
    ${adminBar}
  </div>`;
  Reveal.arm();
}
window.slotClick = (no, status, isMine, canJoin) => {
  if (!S.me) return authModal('login');
  if (isMine) return toast('این جایگاه مال خودت است 🙂', 'info');
  if (status !== 'free') return toast('این جایگاه رزرو شده — یکی دیگر را انتخاب کن', 'err');
  if (!canJoin) return toast('این روم در وضعیت فعلی قابل ثبت‌نام نیست', 'err');
  joinModal(CUR_ROOM.room.id, no);
};
async function joinModal(roomId, slotNo) {
  const fee = CUR_ROOM.room.entry_fee;
  const cfg = S.cfg || {};
  if (fee === 0) {
    modal(`<h3>🎯 ثبت‌نام رایگان</h3><p class="msub">موقعیت ${fa(slotNo)} — این روم رایگان است. قطعی شود؟</p>
      <button class="btn blk good" onclick="doJoin(${roomId},${slotNo},'free')">✅ بله، ثبت‌نام کن</button>`);
    return;
  }
  const opts = [`<button class="payopt" onclick="doJoin(${roomId},${slotNo},'wallet')"><span class="pi">💼</span><span class="pt"><b>کیف پول داخلی</b><small>موجودی: ${money(S.me.wallet)} تومان — پرداخت آنی و قطعی</small></span></button>`];
  if (cfg.has_card) opts.push(`<button class="payopt" onclick="payCard(${roomId},${slotNo})"><span class="pi">💳</span><span class="pt"><b>کارت به کارت</b><small>شماره کارت را می‌گیری، بعد از واریز کد پیگیری را ثبت می‌کنی</small></span></button>`);
  if (cfg.has_gateway) opts.push(`<button class="payopt" onclick="doJoin(${roomId},${slotNo},'online')"><span class="pi">🏦</span><span class="pt"><b>درگاه پرداخت آنلاین</b><small>پرداخت امن با کارت بانکی</small></span></button>`);
  modal(`<h3>🎯 رزرو موقعیت ${fa(slotNo)}</h3>
    <p class="msub">ورودی این روم: <b style="color:var(--acc)">${money(fee)} تومان</b> — روش پرداخت را انتخاب کن:</p>
    ${S.me.wallet >= fee ? '' : '<div class="malert info">💡 موجودی کیف پولت کافی نیست؛ می‌توانی از کارت/درگاه بپردازی یا کیف پولت را شارژ کنی.</div>'}
    ${opts.join('')}`);
}
window.doJoin = async (roomId, slotNo, method) => {
  try {
    const r = await api(`/api/rooms/${roomId}/join`, { method: 'POST', body: { slot_no: slotNo, method } });
    if (r.status === 'paid') { closeModal(); toast('🎉 ' + r.message, 'ok', 4500); await refreshMe(); route(); }
    else if (r.status === 'pending') {
      if (method === 'card' && r.card) cardModal(r.payment_id, r.card, r.fee, roomId);
      else if (method === 'online' && r.gateway_url) gatewayModal(r.payment_id, r.gateway_url, r.fee, roomId);
    }
  } catch (e) { if (e.data && e.data.need === 'topup') topupModal(); }
};
window.payCard = (roomId, slotNo) => { doJoin(roomId, slotNo, 'card'); };
function cardModal(payId, card, fee, roomId) {
  modal(`<h3>💳 پرداخت کارت به کارت</h3>
    <p class="msub">مبلغ <b style="color:var(--acc)">${money(fee)} تومان</b> را به کارت زیر واریز کن و سپس کد پیگیری تراکنش را وارد کن:</p>
    <div class="cardinfo">
      <div class="cnum">${esc(card.number)}</div>
      <div class="cnm">👤 ${esc(card.name) || '—'} ${card.bank ? '• 🏦 ' + esc(card.bank) : ''}</div>
      <button class="copybtn" onclick="copyTxt('${esc(card.number)}')">📋 کپی شماره کارت</button>
    </div>
    <div class="field"><label>🧾 کد پیگیری / آخر ۴ رقم تراکنش</label><input id="refIn" placeholder="مثال: 839201"></div>
    <div id="payErr"></div>
    <button class="btn blk" onclick="submitRef(${payId},${roomId})">✅ ثبت پرداخت</button>`);
}
function gatewayModal(payId, url, fee, roomId) {
  modal(`<h3>🏦 پرداخت آنلاین</h3>
    <p class="msub">مبلغ <b style="color:var(--acc)">${money(fee)} تومان</b> — به درگاه برو، پرداخت کن و کد پیگیری را برگردان:</p>
    <a class="btn blk info" href="${esc(url)}" target="_blank" rel="noopener">🏦 رفتن به درگاه پرداخت</a>
    <div class="field" style="margin-top:14px"><label>🧾 کد پیگیری تراکنش</label><input id="refIn" placeholder="مثال: 839201"></div>
    <div id="payErr"></div>
    <button class="btn blk" onclick="submitRef(${payId},${roomId})">✅ ثبت پرداخت</button>`);
}
window.submitRef = async (payId, roomId) => {
  const ref = $('#refIn').value.trim();
  if (!ref) return toast('کد پیگیری را وارد کن', 'err');
  try {
    await api(`/api/payments/${payId}/ref`, { method: 'POST', body: { ref_code: ref } });
    closeModal();
    toast('✅ رسید ثبت شد — پس از تایید مدیریت مطلع می‌شوی', 'ok', 5000);
    route();
  } catch (e) {
    if ($('#payErr')) $('#payErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`;
  }
};
window.leaveRoom = async (roomId) => {
  if (!confirm('مطمئنی می‌خوای انصراف بدی؟ اگر پرداخت کرده باشی، پولت به کیف پولت برمی‌گردد.')) return;
  try { await api(`/api/rooms/${roomId}/leave`, { method: 'POST' }); toast('انصرافت ثبت شد ✅', 'ok'); await refreshMe(); route(); } catch (e) {}
};
window.removeSlot = async (roomId, slotNo) => {
  if (!confirm(`حذف بازیکن موقعیت ${slotNo}؟ (وجهش به کیف پولش برمی‌گردد)`)) return;
  try { await api(`/api/rooms/${roomId}/remove`, { method: 'POST', body: { slot_no: slotNo } }); toast('بازیکن حذف شد ✅', 'ok'); route(); } catch (e) {}
};
window.publishModal = (roomId, rid2, rpass) => {
  modal(`<h3>🔓 ارسال اطلاعات روم</h3>
    <p class="msub">Room ID و رمز را وارد کن — برای همه بازیکنان قطعی (سایت + هر دو ربات) ارسال می‌شود:</p>
    <div class="field"><label>🆔 Room ID</label><input id="pubId" class="ltr" value="${esc(rid2 || '')}" placeholder="مثال: 12345678"></div>
    <div class="field"><label>🔑 رمز روم</label><input id="pubPass" class="ltr" value="${esc(rpass || '')}" placeholder="مثال: 9101"></div>
    <div id="pubErr"></div>
    <button class="btn blk good" onclick="doPublish(${roomId})">📢 ذخیره و ارسال به بازیکنان</button>`);
};
window.doPublish = async (roomId) => {
  try {
    const r = await api(`/api/rooms/${roomId}/publish`, { method: 'POST', body: { room_id: $('#pubId').value.trim(), room_pass: $('#pubPass').value.trim() } });
    closeModal();
    toast(`اطلاعات برای ${fa(r.notified)} بازیکن ارسال شد ✅`, 'ok', 4500);
    route();
  } catch (e) { $('#pubErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`; }
};
window.roomStatus = async (roomId, st, label) => {
  if (st === 'cancelled' && !confirm('روم لغو شود؟ وجوه همه بازیکنان قطعی به کیف پولشان برمی‌گردد.')) return;
  try { await api(`/api/rooms/${roomId}/status`, { method: 'POST', body: { status: st } }); toast('وضعیت روم: ' + label, 'ok'); route(); } catch (e) {}
};
window.delRoom = async (roomId) => {
  if (!confirm('حذف کامل روم؟ این عمل بازگشت‌پذیر نیست!')) return;
  try { await api(`/api/rooms/${roomId}`, { method: 'DELETE' }); toast('روم حذف شد', 'ok'); location.hash = '#/admin'; } catch (e) {}
};

/* ─────────── راهنما ─────────── */
function viewHelp() {
  $('#app').innerHTML = `
  <section class="sec" style="max-width:860px">
    <div class="sec-head"><h2>📖 <span>راهنمای کامل</span></h2></div>
    <div class="plist-card"><h3>🪖 شروع سریع</h3>
      <p class="mut" style="line-height:2.2;font-size:14px">
      ۱. حساب بساز (دکمه «ورود / ثبت‌نام» بالای سایت) یا فقط در ربات تلگرام/بله <code class="ltr">/start</code> بزن.<br>
      ۲. از بخش «روم‌ها» روم موردنظرت را باز کن.<br>
      ۳. روی یک موقعیت آزاد 🟢 کلیک کن و روش پرداخت را انتخاب کن.<br>
      ۴. پس از قطعی شدن، اسمت در لیست بازیکنان می‌آید و Room ID هنگام انتشار برایت ارسال می‌شود.</p>
    </div>
    <div class="plist-card"><h3>💳 روش‌های پرداخت</h3>
      <p class="mut" style="line-height:2.2;font-size:14px">
      <b style="color:var(--txt)">💼 کیف پول:</b> پرداخت آنی و قطعی. از بخش پروفایل شارژ کن.<br>
      <b style="color:var(--txt)">💳 کارت به کارت:</b> واریز کن و کد پیگیری ثبت کن؛ بعد از تایید مدیریت قطعی می‌شود.<br>
      <b style="color:var(--txt)">🏦 درگاه آنلاین:</b> پرداخت امن و سپس ثبت کد پیگیری.</p>
    </div>
    <div class="plist-card"><h3>🔗 اتصال سایت و ربات</h3>
      <p class="mut" style="line-height:2.2;font-size:14px">
      اگر در ربات <code class="ltr">/link</code> بزنی، یک کد می‌گیری. آن کد را در «پروفایل» سایت وارد کن تا حساب‌ها یکی شوند؛ موجودی و روم‌هایت در هر دو جا یکی نمایش داده می‌شود.</p>
    </div>
    <div class="plist-card"><h3>⚠️ قوانین مهم</h3>
      <p class="mut" style="line-height:2.2;font-size:14px">
      • بعد از شروع روم، انصراف و بازگشت وجه ممکن نیست.<br>
      • تقلب باعث حذف دائمی و ضبط موجودی می‌شود.<br>
      • در صورت مشکل، از بات پشتیبانی در پایین صفحه کمک بگیر.</p>
    </div>
  </section>`;
}

/* ─────────── پروفایل ─────────── */
async function refreshMe() {
  if (!S.token) return;
  try { const r = await api('/api/me', { silent: true }); S.me = r.user; S.meData = r; renderTop(); } catch (e) {}
}
window.refreshMe = refreshMe;
async function viewProfile() {
  if (!S.me) return authModal('login');
  await refreshMe();
  const d = S.meData || { entries: [], transactions: [], prizes: [] };
  $('#app').innerHTML = `
  <div class="profwrap">
    <div class="prof-grid">
      <div>
        <div class="pcard">
          <div class="av">🪖</div>
          <h2>${esc(S.me.display_name || S.me.username)}</h2>
          <span class="rl ${S.me.role === 'admin' ? 'adm' : 'usr'}">${S.me.role === 'admin' ? '🛡 مدیر' : '👤 سرباز'}</span>
          <div class="walletbox"><div class="wl">💼 موجودی کیف پول</div><div class="wv">${money(S.me.wallet)} <small style="font-size:12px">تومان</small></div>
            <button class="btn sm blk" style="margin-top:12px" onclick="topupModal()">➕ شارژ کیف پول</button></div>
          <div style="margin-top:16px;font-size:12.5px;line-height:2.2" class="mut">
            📛 یوزرنیم: <b class="ltr">${esc(S.me.username)}</b><br>
            🎮 آیدی کالاف: <b>${esc(S.me.codm_id) || '—'}</b><br>
            📱 تلگرام: <b>${S.me.telegram_id ? '✅ متصل' : '—'}</b> &nbsp; 💬 بله: <b>${S.me.bale_id ? '✅ متصل' : '—'}</b>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
            <button class="btn sm ghost" onclick="editProfileModal()">✏️ ویرایش پروفایل</button>
            ${!S.me.telegram_id && !S.me.bale_id ? `<button class="btn sm ghost" onclick="linkModal()">🔗 اتصال ربات</button>` : ''}
            <button class="btn sm ghost" onclick="logout()">🚪 خروج</button>
          </div>
        </div>
      </div>
      <div>
        <div class="plist-card"><h3>🎮 روم‌های من</h3>
          ${d.entries.length ? d.entries.map((e) => `
            <div class="entry-item">
              <div class="ei-t"><b>${esc(e.title)}</b><small>${esc(e.team_label)} / شماره ${fa(e.slot_no)} • ${RSTATUS[e.room_status] ? RSTATUS[e.room_status][0] : e.room_status} • ${e.status === 'paid' ? '✅ قطعی' : '⏳ در انتظار پرداخت'}${e.code_id ? ' • 🆔 ' + esc(e.code_id) : ''}</small></div>
              ${e.room_status === 'open' ? `<button class="btn sm bad" onclick="leaveRoom(${e.room_id})">↩️ انصراف</button>` : ''}
              <button class="btn sm ghost" onclick="location.hash='#/room/${e.room_id}'">👁</button>
            </div>`).join('') : '<span class="mut">هنوز در رومی ثبت‌نام نکرده‌ای — <a href="#/rooms" style="color:var(--acc)">برو روم بگیر! 🎮</a></span>'}
        </div>
        <div class="plist-card"><h3>🏆 جوایز من</h3>
          ${d.prizes.length ? d.prizes.map((z) => `<div class="tx-item"><span>${z.status === 'approved' ? '✅' : z.status === 'pending' ? '⏳' : '❌'} ${esc(z.note || 'جایزه')}</span><span class="tx-amt ${z.status === 'approved' ? 'plus' : ''}">${money(z.amount)} ت</span></div>`).join('') : '<span class="mut">هنوز جایزه‌ای نداری</span>'}
        </div>
        <div class="plist-card"><h3>📋 تراکنش‌های اخیر</h3>
          ${d.transactions.length ? d.transactions.map((t) => `<div class="tx-item"><span>${t.kind === 'topup' ? '💰 شارژ' : t.kind === 'entry' ? '🎮 ورودی روم' : t.kind === 'prize' ? '🏆 جایزه' : t.kind === 'refund' ? '↩️ بازگشت وجه' : t.kind === 'register' ? '🪖 ثبت‌نام' : esc(t.kind)}</span><span class="tx-amt ${num2(t.amount) >= 0 ? 'plus' : 'minus'}">${num2(t.amount) >= 0 ? '+' : ''}${money(t.amount)}</span></div>`).join('') : '<span class="mut">تراکنشی ثبت نشده</span>'}
        </div>
      </div>
    </div>
  </div>`;
}
window.linkModal = () => {
  modal(`<h3>🔗 اتصال اکانت ربات</h3>
    <p class="msub">در ربات تلگرام یا بله دستور <code class="ltr">/link</code> را بزن، کد ۹ رقمی را بگیر و اینجا وارد کن. موجودی و اطلاعات ربات‌ات با سایت یکی می‌شود.</p>
    <div class="field"><label>🔑 کد اتصال</label><input id="linkIn" class="ltr" placeholder="W6WXXXXXX"></div>
    <div id="linkErr"></div>
    <button class="btn blk" onclick="doLink()">🔗 اتصال</button>`);
};
window.doLink = async () => {
  try {
    const r = await api('/api/link', { method: 'POST', body: { code: $('#linkIn').value.trim() } });
    S.me = r.user; closeModal(); toast('اکانت‌ها متصل شد ✅', 'ok'); route();
  } catch (e) { $('#linkErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`; }
};
window.editProfileModal = () => {
  modal(`<h3>✏️ ویرایش پروفایل</h3>
    <div class="field"><label>نام نمایشی</label><input id="epD" value="${esc(S.me.display_name || '')}"></div>
    <div class="field"><label>🎮 آیدی کالاف (اختیاری)</label><input id="epC" class="ltr" value="${esc(S.me.codm_id || '')}" placeholder="CODM ID"></div>
    <div class="field"><label>🔑 رمز عبور جدید (اختیاری)</label><input id="epP" type="password" class="ltr" placeholder="برای تغییر پر کن"></div>
    <div id="epErr"></div>
    <button class="btn blk" onclick="doEditProfile()">💾 ذخیره</button>`);
};
window.doEditProfile = async () => {
  try {
    const b = { display_name: $('#epD').value.trim(), codm_id: $('#epC').value.trim() };
    if ($('#epP').value) b.password = $('#epP').value;
    const r = await api('/api/me/update', { method: 'POST', body: b });
    S.me = r.user; closeModal(); toast('پروفایل بروزرسانی شد ✅', 'ok'); route();
  } catch (e) { $('#epErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`; }
};
function topupModal() {
  const cfg = S.cfg || {};
  const min = cfg.min_topup || 50000;
  const methods = [];
  if (cfg.has_card) methods.push(`<button class="payopt" onclick="topupMethod('card')"><span class="pi">💳</span><span class="pt"><b>کارت به کارت</b><small>واریز + ثبت کد پیگیری</small></span></button>`);
  if (cfg.has_gateway) methods.push(`<button class="payopt" onclick="topupMethod('online')"><span class="pi">🏦</span><span class="pt"><b>درگاه آنلاین</b><small>پرداخت امن</small></span></button>`);
  modal(`<h3>💵 شارژ کیف پول</h3>
    <p class="msub">حداقل شارژ: <b style="color:var(--acc)">${money(min)} تومان</b></p>
    ${methods.length ? methods.join('') : '<div class="malert info">فعلاً روش پرداختی فعال نیست — با پشتیبانی تماس بگیر.</div>'}`);
}
window.topupMethod = (method) => {
  const min = (S.cfg && S.cfg.min_topup) || 50000;
  modal(`<h3>💵 مبلغ شارژ</h3>
    <div class="field"><label>مبلغ (تومان)</label><input id="tuAmount" type="number" class="ltr" min="${min}" value="${min}"></div>
    <div id="tuErr"></div>
    <button class="btn blk" onclick="doTopup('${method}')">ادامه ➡️</button>`);
};
window.doTopup = async (method) => {
  const amount = parseInt($('#tuAmount').value, 10);
  try {
    const r = await api('/api/topup', { method: 'POST', body: { amount, method } });
    if (r.card) cardModal(r.payment_id, r.card, amount, null);
    else if (r.gateway_url) gatewayModal(r.payment_id, r.gateway_url, amount, null);
  } catch (e) { $('#tuErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`; }
};

/* ─────────── پنل ادمین ─────────── */
const AT = { tab: 'dash' };
async function viewAdmin() {
  if (!S.me) return authModal('login');
  if (S.me.role !== 'admin') { $('#app').innerHTML = `<div class="empty"><div class="big">🚫</div><h2>دسترسی محدود</h2><p class="mut">این بخش فقط برای مدیرهاست</p></div>`; return; }
  $('#app').innerHTML = `
  <section class="sec" style="padding-top:38px">
    <div class="sec-head"><h2>🛡 <span>مرکز فرماندهی</span></h2><p>مدیریت کامل پلتفرم — روم‌ها، پرداخت‌ها، جوایز و کاربران</p></div>
    <div class="admtabs" id="admTabs"></div>
    <div id="admBody"><div class="empty" style="padding:30px">⏳</div></div>
  </section>`;
  renderAdmTabs();
  await loadAdm();
}
function renderAdmTabs() {
  const tabs = [['dash', '📊 داشبورد'], ['rooms', '🎮 روم‌ها'], ['pays', '🔔 پرداخت‌ها'], ['prizes', '🏆 جوایز'], ['users', '👥 کاربران'], ['settings', '⚙️ تنظیمات'], ['bc', '📢 پیام همگانی']];
  $('#admTabs').innerHTML = tabs.map(([k, l]) => `<button class="admtab ${AT.tab === k ? 'on' : ''}" onclick="AT.tab='${k}';renderAdmTabs();loadAdm()">${l}</button>`).join('');
}
window.AT = AT;
window.renderAdmTabs = renderAdmTabs;
async function loadAdm() {
  const b = $('#admBody');
  try {
    if (AT.tab === 'dash') {
      const s = await api('/api/stats');
      b.innerHTML = `<div class="adm-stats">
        <div class="astat"><div class="v">${fa(money(s.users))}</div><div class="l">👥 کاربران (امروز: ${fa(money(s.todayUsers))})</div></div>
        <div class="astat"><div class="v">${fa(money(s.rooms))}</div><div class="l">🎮 روم‌ها (${fa(money(s.openRooms))} باز)</div></div>
        <div class="astat good"><div class="v">${fa(money(s.entries))}</div><div class="l">🎯 ورودی قطعی</div></div>
        <div class="astat good"><div class="v">${fa(money(s.revenue))}</div><div class="l">💵 درآمد ورودی‌ها (ت)</div></div>
        <div class="astat"><div class="v">${fa(money(s.topups))}</div><div class="l">📈 شارژ تاییدشده (ت)</div></div>
        <div class="astat"><div class="v">${fa(money(s.prizesPaid))}</div><div class="l">🏆 جوایز پرداختی (ت)</div></div>
        <div class="astat warn"><div class="v">${fa(money(s.pendingPayments))}</div><div class="l">🔔 پرداخت در انتظار</div></div>
        <div class="astat warn"><div class="v">${fa(money(s.pendingPrizes))}</div><div class="l">🏆 جایزه در انتظار</div></div>
        <div class="astat"><div class="v">${fa(money(s.walletTotal))}</div><div class="l">💼 موجودی کل کاربران (ت)</div></div>
        <div class="astat"><div class="v">${fa(money(s.runningRooms))}</div><div class="l">🔴 روم در حال اجرا</div></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
        <button class="btn" onclick="roomCreateModal()">➕ ساخت روم جدید</button>
        <button class="btn ghost" onclick="AT.tab='pays';renderAdmTabs();loadAdm()">🔔 بررسی پرداخت‌ها</button>
        <button class="btn ghost" onclick="webhookModal()">🔗 اتصال وب‌هوک ربات‌ها</button>
      </div>`;
    } else if (AT.tab === 'rooms') {
      const r = await api('/api/rooms?status=all&mode=all');
      b.innerHTML = `<div style="margin-bottom:14px"><button class="btn" onclick="roomCreateModal()">➕ ساخت روم جدید</button></div>
      <div class="tblwrap"><table class="tbl"><thead><tr><th>#</th><th>عنوان</th><th>حالت</th><th>ظرفیت</th><th>ورودی</th><th>جایزه</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
      ${(r.rooms || []).map((rm) => `<tr><td>${fa(rm.id)}</td><td><b>${esc(rm.title)}</b></td><td>${(MODES[rm.mode] || MODES.custom).fa}</td>
        <td>${fa(rm.paid)}/${fa(rm.total)}</td><td>${rm.entry_fee > 0 ? money(rm.entry_fee) : 'رایگان'}</td><td>${rm.prize_pool > 0 ? money(rm.prize_pool) : '—'}</td>
        <td><span class="rbadge ${rm.status}">${RSTATUS[rm.status] ? RSTATUS[rm.status][0] : rm.status}</span></td>
        <td style="white-space:nowrap"><button class="btn sm ghost" onclick="location.hash='#/room/${rm.id}'">👁</button> <button class="btn sm ghost" onclick="editRoomModal(${rm.id})">✏️</button></td></tr>`).join('') || '<tr><td colspan="8" class="mut" style="text-align:center;padding:30px">رومی نیست — اولین روم را بساز!</td></tr>'}
      </tbody></table></div>`;
    } else if (AT.tab === 'pays') {
      const r = await api('/api/payments?status=all&kind=all');
      b.innerHTML = `<div class="tblwrap"><table class="tbl"><thead><tr><th>#</th><th>نوع</th><th>کاربر</th><th>روم</th><th>مبلغ</th><th>روش</th><th>کد پیگیری</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
      ${(r.payments || []).map((x) => `<tr><td>${fa(x.id)}</td><td>${PAY_KIND[x.kind] || x.kind}</td><td>${esc(x.display_name || x.username || '—')}</td><td>${esc(x.room_title || '—')}</td>
        <td><b>${money(x.amount)}</b></td><td>${PAY_METHOD[x.method] || x.method}</td><td class="ltr">${x.proof_file_id ? '<span class="proofbadge" title="عکس رسید در ربات ارسال شده">📸</span> ' : ''}${esc(x.ref_code || '—')}</td>
        <td><span class="tag ${x.status}">${x.status === 'pending' ? '⏳ در انتظار' : x.status === 'approved' ? '✅ تایید' : '❌ رد'}</span></td>
        <td>${x.status === 'pending' ? `<button class="btn sm good" onclick="payAct(${x.id},'approve')">✅</button> <button class="btn sm bad" onclick="payAct(${x.id},'reject')">❌</button>` : '—'}</td></tr>`).join('') || '<tr><td colspan="9" class="mut" style="text-align:center;padding:30px">پرداختی ثبت نشده</td></tr>'}
      </tbody></table></div>`;
    } else if (AT.tab === 'prizes') {
      const r = await api('/api/prizes?status=all');
      b.innerHTML = `<div style="margin-bottom:14px"><button class="btn" onclick="prizeModal()">➕ دادن جایزه</button></div>
      <div class="tblwrap"><table class="tbl"><thead><tr><th>#</th><th>کاربر</th><th>مبلغ</th><th>توضیح</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
      ${(r.prizes || []).map((x) => `<tr><td>${fa(x.id)}</td><td>${esc(x.display_name || x.username || '—')}</td><td><b>${money(x.amount)}</b></td><td>${esc(x.note || '—')}</td>
        <td><span class="tag ${x.status}">${x.status === 'pending' ? '⏳' : x.status === 'approved' ? '✅ پرداخت شد' : '❌ رد'}</span></td>
        <td>${x.status === 'pending' ? `<button class="btn sm good" onclick="prizeAct(${x.id},'approve')">✅ تایید</button> <button class="btn sm bad" onclick="prizeAct(${x.id},'reject')">❌</button>` : '—'}</td></tr>`).join('') || '<tr><td colspan="6" class="mut" style="text-align:center;padding:30px">جایزه‌ای ثبت نشده</td></tr>'}
      </tbody></table></div>`;
    } else if (AT.tab === 'users') {
      b.innerHTML = `<div style="margin-bottom:14px"><input id="usrQ" placeholder="🔍 جستجو: یوزرنیم / آیدی..." style="width:100%;max-width:340px;padding:11px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;color:var(--txt);font-family:inherit" oninput="searchUsers(this.value)"></div>
      <div id="usrList"><div class="empty" style="padding:20px">⏳</div></div>`;
      await loadUsers('');
    } else if (AT.tab === 'settings') {
      const r = await api('/api/settings');
      const st = r.settings || {};
      b.innerHTML = `
      <div class="malert info">💡 توکن‌ها را از @BotFather تلگرام یا BotFather بله بگیر. درگاه به شکل <b class="ltr">https://pay.example.com/{amount}</b> باشد؛ اگر کاری تنظیم نشود، دکمه‌اش در سایت و ربات‌ها <b>خودکار مخفی می‌شود</b>.</div>
      <div class="set-grid">
        ${[['tg_token', '🤖 توکن ربات تلگرام'], ['bale_token', '💬 توکن ربات بله'], ['card_number', '💳 شماره کارت (کارت به کارت)'], ['card_name', '👤 نام صاحب کارت'], ['bank_name', '🏦 نام بانک'], ['gateway_url', '🏦 آدرس درگاه ({amount})'], ['website_url', '🌐 آدرس این سایت'], ['announce_channel', '📣 کانال اعلان روم جدید'], ['min_topup', '⬇️ حداقل شارژ (تومان)'], ['support_bot', '🛡 لینک بات پشتیبانی'], ['shop_bot', '🛒 لینک بات فروشگاه'], ['welcome', '👋 متن خوش‌آمد ربات']].map(([k, l]) => `
        <div class="setrow"><label>${l}</label><input id="set_${k}" value="${esc(st[k] || '')}"></div>`).join('')}
      </div>
      <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
        <button class="btn" onclick="saveSettings()">💾 ذخیره تنظیمات</button>
        <button class="btn ghost" onclick="webhookModal()">🔗 اتصال خودکار وب‌هوک‌ها</button>
      </div>`;
    } else if (AT.tab === 'bc') {
      b.innerHTML = `
      <div class="malert info">پیام برای همه کاربران (تلگرام + بله) دسته‌ای ارسال می‌شود. برای ارسال به بازیکنان یک روم خاص، از ربات استفاده کن.</div>
      <div class="plist-card">
        <div class="field"><label>📝 متن پیام</label><textarea id="bcText" rows="5" placeholder="متن پیام همگانی..."></textarea></div>
        <button class="btn" onclick="doBroadcast()">📤 ارسال</button>
        <div id="bcRes" style="margin-top:12px"></div>
      </div>`;
    }
  } catch (e) { b.innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`; }
}
window.loadAdm = loadAdm;
let usrTimer = null;
window.searchUsers = (q) => { clearTimeout(usrTimer); usrTimer = setTimeout(() => loadUsers(q), 350); };
async function loadUsers(q) {
  const el = $('#usrList');
  if (!el) return;
  try {
    const r = await api('/api/users?q=' + encodeURIComponent(q || ''));
    el.innerHTML = `<div class="tblwrap"><table class="tbl"><thead><tr><th>#</th><th>کاربر</th><th>موجودی</th><th>ورودی‌ها</th><th>اتصال</th><th>نقش</th><th>عملیات</th></tr></thead><tbody>
    ${(r.users || []).map((x) => `<tr><td>${fa(x.id)}</td><td><b>${esc(x.display_name || x.username)}</b><br><small class="mut ltr">@${esc(x.username)}</small></td>
      <td>${money(x.wallet)}</td><td>${fa(x.entries)}</td>
      <td>${x.telegram_id ? '📱' : ''}${x.bale_id ? ' 💬' : ''}${!x.telegram_id && !x.bale_id ? '—' : ''}</td>
      <td>${x.banned ? '<span class="tag rejected">⛔️ مسدود</span>' : `<span class="tag ${x.role === 'admin' ? 'pending' : 'usr'}">${x.role === 'admin' ? '🛡 ادمین' : '👤 کاربر'}</span>`}</td>
      <td style="white-space:nowrap">
        <button class="btn sm ghost" onclick="toggleRole(${x.id},'${x.role}')">${x.role === 'admin' ? '👤' : '🛡'}</button>
        <button class="btn sm ghost" onclick="toggleBan(${x.id},${x.banned ? 0 : 1})">${x.banned ? '✅' : '⛔️'}</button>
        <button class="btn sm ghost" title="جایزه" onclick="prizeModal(${x.id},'${esc(x.display_name || x.username)}')">🏆</button>
      </td></tr>`).join('') || '<tr><td colspan="7" class="mut" style="text-align:center;padding:30px">کاربری یافت نشد</td></tr>'}
    </tbody></table></div>`;
  } catch (e) { el.innerHTML = '⚠️'; }
}
window.loadUsers = loadUsers;
window.toggleRole = async (id, role) => {
  try { await api(`/api/users/${id}/role`, { method: 'POST', body: { role: role === 'admin' ? 'user' : 'admin' } }); toast('نقش تغییر کرد ✅', 'ok'); loadUsers($('#usrQ') ? $('#usrQ').value : ''); } catch (e) {}
};
window.toggleBan = async (id, banned) => {
  try { await api(`/api/users/${id}/ban`, { method: 'POST', body: { banned: !!banned } }); toast('وضعیت کاربر تغییر کرد ✅', 'ok'); loadUsers($('#usrQ') ? $('#usrQ').value : ''); } catch (e) {}
};
window.payAct = async (id, act) => {
  try { await api(`/api/payments/${id}/${act}`, { method: 'POST' }); toast(act === 'approve' ? 'تایید شد و کاربر مطلع گردید ✅' : 'رد شد و کاربر مطلع گردید', 'ok'); loadAdm(); } catch (e) {}
};
window.prizeAct = async (id, act) => {
  try { await api(`/api/prizes/${id}/${act}`, { method: 'POST' }); toast(act === 'approve' ? 'جایزه پرداخت شد ✅' : 'رد شد', 'ok'); loadAdm(); } catch (e) {}
};
window.saveSettings = async () => {
  const keys = ['tg_token', 'bale_token', 'card_number', 'card_name', 'bank_name', 'gateway_url', 'website_url', 'announce_channel', 'min_topup', 'support_bot', 'shop_bot', 'welcome'];
  const body = {};
  keys.forEach((k) => { body[k] = $('#set_' + k).value; });
  try { await api('/api/settings', { method: 'POST', body }); toast('تنظیمات ذخیره شد ✅', 'ok'); await api('/api/public/config', { silent: true }).then((c) => { S.cfg = c; }); } catch (e) {}
};
window.webhookModal = () => {
  modal(`<h3>🔗 اتصال خودکار وب‌هوک‌ها</h3>
    <p class="msub">اول توکن‌های دو ربات را در تنظیمات ذخیره کن، سپس توکن ادمین سایت (همان که لاگین هستی) برای تایید استفاده می‌شود.</p>
    <div class="field"><label>🔐 توکن ادمین (Bearer)</label><input id="whTok" class="ltr" value="${esc(S.token)}" placeholder="توکن ورود سایت"></div>
    <div id="whRes"></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn info" style="flex:1" onclick="doHook('telegram')">📱 اتصال تلگرام</button>
      <button class="btn info" style="flex:1" onclick="doHook('bale')">💬 اتصال بله</button>
    </div>
    <button class="btn ghost blk" style="margin-top:10px" onclick="checkHooks()">🔄 بررسی وضعیت فعلی</button>
    <p class="msub" style="margin-top:12px">⚠️ هیچ‌گاه setWebhook را با آدرس خالی نزن — اتصال ربات قطع می‌شود. این دکمه‌ها آدرس صحیح را خودکار ست می‌کنند.</p>`);
};
window.doHook = async (platform) => {
  const t = $('#whTok').value.trim();
  $('#whRes').innerHTML = '<p class="mut">⏳ در حال اتصال...</p>';
  try {
    const r = await fetch(S.api + '/api/webhook/set', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t }, body: JSON.stringify({ platform }) });
    const j = await r.json();
    $('#whRes').innerHTML = j.ok ? '<div class="malert ok">✅ اتصال با موفقیت انجام شد!</div>' : `<div class="malert err">❌ ${esc(j.error || 'خطا')}</div>`;
  } catch (e) { $('#whRes').innerHTML = `<div class="malert err">❌ ${esc(e.message)}</div>`; }
};
window.checkHooks = async () => {
  const t = $('#whTok').value.trim();
  $('#whRes').innerHTML = '<p class="mut">⏳ بررسی...</p>';
  try {
    const r = await fetch(S.api + '/api/webhook/status', { headers: { 'Authorization': 'Bearer ' + t } });
    const j = await r.json();
    if (j.ok) $('#whRes').innerHTML = `
      <div class="malert ${j.telegram.connected ? 'ok' : 'err'}">📱 تلگرام: ${j.telegram.connected ? '✅ متصل به ' + esc(j.telegram.info.url) : '❌ متصل نیست'}</div>
      <div class="malert ${j.bale.connected ? 'ok' : 'err'}">💬 بله: ${j.bale.connected ? '✅ متصل به ' + esc(j.bale.info.url) : '❌ متصل نیست'}</div>`;
  } catch (e) { $('#whRes').innerHTML = `<div class="malert err">❌ ${esc(e.message)}</div>`; }
};
window.doBroadcast = async (offset = 0) => {
  try {
    const r = await api('/api/broadcast', { method: 'POST', body: { text: $('#bcText').value, target: 'all', offset } });
    const res = $('#bcRes');
    if (r.remaining > 0) {
      res.innerHTML = `<div class="malert info">📤 ارسال شد: ${fa(money(r.offset))}/${fa(money(r.total))} — ادامه بده:</div><button class="btn" onclick="doBroadcast(${r.offset})">▶️ ادامه ارسال (${fa(money(r.remaining))} باقی‌مانده)</button>`;
    } else {
      res.innerHTML = `<div class="malert ok">✅ پیام همگانی کامل ارسال شد (${fa(money(r.total))} کاربر)</div>`;
    }
  } catch (e) { $('#bcRes').innerHTML = `<div class="malert err">${esc(e.message)}</div>`; }
};

/* ─────────── ساخت/ویرایش روم ─────────── */
window.roomCreateModal = () => roomFormModal(null);
window.editRoomModal = async (id) => {
  try {
    const r = await api('/api/rooms/' + id);
    roomFormModal(r.room);
  } catch (e) {}
};
function roomFormModal(rm) {
  rm = rm || {};
  modal(`<h3>${rm.id ? '✏️ ویرایش روم' : '➕ ساخت روم جدید'}</h3>
    <p class="msub">چیدمان = تعداد تیم‌ها × تعداد بازیکن در هر تیم (مثال: ۲۵ تیم دو نفره = ۵۰ نفره)</p>
    <div class="field"><label>📝 عنوان روم *</label><input id="nrT" value="${esc(rm.title || '')}" placeholder="مثال: جام قهرمانان شبانه"></div>
    <div class="frow">
      <div class="field"><label>🎮 حالت بازی</label><select id="nrM">${Object.keys(MODES).map((k) => `<option value="${k}" ${rm.mode === k ? 'selected' : ''}>${MODES[k].emoji} ${MODES[k].fa}</option>`).join('')}</select></div>
      <div class="field"><label>🗺 نقشه</label><input id="nrMap" value="${esc(rm.map_name || '')}" placeholder="مثال: Ismail"></div>
    </div>
    <div class="frow">
      <div class="field"><label>👥 تعداد تیم‌ها (تا ۵۰)</label><input id="nrTeams" type="number" min="2" max="50" value="${rm.teams || 2}" oninput="updLayoutHint()"></div>
      <div class="field"><label>👤 بازیکن در هر تیم (تا ۲۰)</label><input id="nrSize" type="number" min="1" max="20" value="${rm.team_size || 4}" oninput="updLayoutHint()"></div>
    </div>
    <div id="layoutHint" class="layout-hint"></div>
    <div class="frow">
      <div class="field"><label>💰 ورودی (تومان)</label><input id="nrFee" type="number" min="0" value="${rm.entry_fee || 0}"></div>
      <div class="field"><label>🏆 جایزه کل (تومان)</label><input id="nrPrize" type="number" min="0" value="${rm.prize_pool || 0}"></div>
    </div>
    <div class="field"><label>🕒 زمان شروع (متن آزاد)</label><input id="nrTime" value="${esc(rm.start_time || '')}" placeholder="مثال: امشب ساعت 21:00"></div>
    <div class="field"><label>📝 توضیحات</label><textarea id="nrDesc" rows="2">${esc(rm.description || '')}</textarea></div>
    <div class="field"><label>📜 قوانین</label><textarea id="nrRules" rows="2">${esc(rm.rules || '')}</textarea></div>
    ${rm.id && rm.status === 'open' ? `<div class="malert warn" style="background:rgba(255,192,72,.08);border:1px solid rgba(255,192,72,.35);color:var(--warn)">⚠️ اگر چیدمان را تغییر دهی، رزروهای قبلی پاک می‌شوند!</div>` : ''}
    <div id="nrErr"></div>
    <button class="btn blk lg" onclick="saveRoom(${rm.id || 0})">${rm.id ? '💾 ذخیره تغییرات' : '🚀 ساخت روم'}</button>`, true);
}
window.updLayoutHint = () => {
  const el = $('#layoutHint');
  if (!el || !$('#nrTeams')) return;
  const t = parseInt($('#nrTeams').value, 10) || 0;
  const s = parseInt($('#nrSize').value, 10) || 0;
  const total = t * s;
  let msg = `${fa(t)} تیم × ${fa(s)} نفر = <b>${fa(total)} بازیکن</b>`, cls = 'ok';
  if (t < 2 || t > 50) { msg = 'تعداد تیم‌ها باید بین ۲ تا ۵۰ باشد'; cls = 'err'; }
  else if (s < 1 || s > 20) { msg = 'بازیکن در هر تیم باید بین ۱ تا ۲۰ باشد'; cls = 'err'; }
  else if (total > 250) { msg = `حداکثر ظرفیت هر روم ۲۵۰ بازیکن است (الان ${fa(total)})`; cls = 'err'; }
  el.innerHTML = msg;
  el.className = 'layout-hint ' + cls;
};
window.saveRoom = async (id) => {
  const b = {
    title: $('#nrT').value.trim(), mode: $('#nrM').value, map_name: $('#nrMap').value.trim(),
    teams: parseInt($('#nrTeams').value, 10), team_size: parseInt($('#nrSize').value, 10),
    entry_fee: parseInt($('#nrFee').value, 10) || 0, prize_pool: parseInt($('#nrPrize').value, 10) || 0,
    start_time: $('#nrTime').value.trim(), description: $('#nrDesc').value.trim(), rules: $('#nrRules').value.trim()
  };
  if (!b.title) return $('#nrErr').innerHTML = '<div class="malert err">عنوان الزامی است</div>';
  try {
    if (id) {
      const cur = CUR_ROOM && CUR_ROOM.room.id === id ? CUR_ROOM.room : null;
      if (cur && (cur.teams !== b.teams || cur.team_size !== b.team_size)) {
        if (!confirm('چیدمان تغییر کرد! رزروهای فعلی پاک می‌شوند. ادامه؟')) return;
        b.reset_slots = true;
      }
      await api('/api/rooms/' + id, { method: 'PUT', body: b });
      toast('روم ویرایش شد ✅', 'ok');
    } else {
      const r = await api('/api/rooms', { method: 'POST', body: b });
      toast('روم ساخته شد! 🎉', 'ok');
      closeModal();
      location.hash = '#/room/' + r.id;
      return;
    }
    closeModal(); route();
  } catch (e) { $('#nrErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`; }
};
window.prizeModal = (userId, name) => {
  modal(`<h3>🏆 دادن جایزه</h3>
    <p class="msub">جایزه پس از تایید، مستقیماً به کیف پول بازیکن واریز و او مطلع می‌شود.</p>
    <div class="field"><label>کاربر (یوزرنیم یا #آیدی)</label><input id="pzU" class="ltr" value="${userId ? '#' + userId : ''}" placeholder="مثال: sniper_king یا #12"></div>
    <div class="field"><label>💰 مبلغ (تومان)</label><input id="pzA" type="number" min="1000" placeholder="100000"></div>
    <div class="field"><label>📝 توضیح</label><input id="pzN" placeholder="مثال: قهرمان روم شماره ۵"></div>
    <div id="pzErr"></div>
    <button class="btn blk good" onclick="doPrize('${esc(name || '')}')">🏆 ثبت و پرداخت جایزه</button>`);
};
window.doPrize = async (name) => {
  const u = $('#pzU').value.trim();
  const body = { amount: parseInt($('#pzA').value, 10) || 0, note: $('#pzN').value.trim(), approve_now: true };
  if (u.startsWith('#')) body.user_id = parseInt(u.slice(1), 10); else body.username = u.replace('@', '');
  if (!body.amount) return $('#pzErr').innerHTML = '<div class="malert err">مبلغ معتبر وارد کن</div>';
  try {
    await api('/api/prizes', { method: 'POST', body });
    closeModal();
    toast(`جایزه ${money(body.amount)} تومانی پرداخت شد ${name ? 'به ' + name : ''} 🏆`, 'ok', 4500);
    if (AT.tab) loadAdm();
  } catch (e) { $('#pzErr').innerHTML = `<div class="malert err">${esc(e.message)}</div>`; }
};

/* ─────────── راه‌اندازی ─────────── */
async function boot() {
  try { S.cfg = await api('/api/public/config', { silent: true }); } catch (e) { S.cfg = null; }
  if (S.token) {
    try { const r = await api('/api/me', { silent: true }); S.me = r.user; S.meData = r; }
    catch (e) { S.me = null; }
  }
  renderTop();
}
window.addEventListener('hashchange', route);
$('#burger').addEventListener('click', () => $('#mainnav').classList.toggle('openm'));
document.addEventListener('click', (e) => { if (window.innerWidth <= 960 && !e.target.closest('.topbar')) $('#mainnav').classList.remove('openm'); });
$('#year').textContent = new Date().getFullYear();
boot().then(route);



