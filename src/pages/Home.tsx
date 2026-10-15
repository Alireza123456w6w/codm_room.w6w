import React, { useEffect, useState } from 'react';
import { User, PublicStats } from '../types';
import { I18N, money, fa } from '../i18n/translations';
import { ApiService } from '../services/api';
import { AudioFX } from '../services/audio';

interface HomeProps {
  user: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  setCurrentTab: (tab: string) => void;
  lang: 'fa' | 'en';
}

export const Home: React.FC<HomeProps> = ({
  user,
  onOpenAuth,
  setCurrentTab,
  lang
}) => {
  const [stats, setStats] = useState<PublicStats>({
    users: 1420,
    rooms: 86,
    openRooms: 4,
    entries: 384,
    prizesPaid: 45000000
  });

  const t = I18N[lang];
  const isEn = lang === 'en';

  useEffect(() => {
    ApiService.getPublicStats()
      .then((data) => {
        if (data.users > 0) setStats(data);
      })
      .catch(() => {});
  }, []);

  const handleNav = (tab: string) => {
    AudioFX.play('click');
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* ── هیرو سینمایی تاکتیکال ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-in">
          <div className="hero-kicker">
            <span>🎯</span>
            <span>{t.heroKicker}</span>
          </div>

          <h1>
            {t.heroTitle1}{' '}
            <span className="glow">{t.heroBattlefield}</span>{' '}
            {t.heroTitle2}
          </h1>

          <p className="sub">{t.heroSub}</p>

          <div className="hero-cta">
            <button
              className="btn lg"
              onClick={() => handleNav('rooms')}
            >
              {t.heroBtnRooms}
            </button>

            {user ? (
              <button
                className="btn ghost lg"
                onClick={() => handleNav('profile')}
              >
                {t.heroBtnAccount}
              </button>
            ) : (
              <button
                className="btn ghost lg"
                onClick={() => onOpenAuth('register')}
              >
                {t.heroBtnRegister}
              </button>
            )}
          </div>

          {/* نوار اتصال سریع ربات‌های رسمی */}
          <div className="hero-bot-bar">
            <div className="hbb-title">
              {isEn ? '🤖 OFFICIAL TOURNAMENT & PAYMENT BOTS' : '🤖 ربات‌های رسمی ثبت‌نام و تایید خودکار رسید'}
            </div>
            <div className="hbb-links">
              <a
                href="https://ble.ir/codm_room_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn bale"
              >
                💬 {isEn ? 'Bale Bot: @codm_room_bot' : 'ربات بله: @codm_room_bot'}
                <span className="hbb-badge">{isEn ? 'RECEIPTS' : 'تایید فیش'}</span>
              </a>
              <a
                href="https://t.me/codm_room_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn tg-btn"
              >
                📱 {isEn ? 'Telegram: @codm_room_bot' : 'ربات تلگرام: @codm_room_bot'}
                <span className="hbb-badge">{isEn ? 'TOURNAMENTS' : 'روم‌ها'}</span>
              </a>
            </div>
          </div>

          <div className="hero-badges">
            <div className="hbadge">
              <span>⚡</span>
              <b>{t.badgeReg}</b>
            </div>
            <div className="hbadge">
              <span>💳</span>
              <b>{t.badgePay}</b>
            </div>
            <div className="hbadge">
              <span>🔔</span>
              <b>{t.badgeBot}</b>
            </div>
            <div className="hbadge">
              <span>🏆</span>
              <b>{t.badgePrize}</b>
            </div>
          </div>
        </div>
      </section>

      {/* ── آمار نبردها ── */}
      <section className="stats-strip">
        <div className="stats-grid">
          <div className="stat">
            <div className="v">{isEn ? money(stats.users) : fa(money(stats.users))}</div>
            <div className="l">{t.statUsers}</div>
          </div>
          <div className="stat">
            <div className="v">{isEn ? money(stats.rooms) : fa(money(stats.rooms))}</div>
            <div className="l">{t.statRooms}</div>
          </div>
          <div className="stat">
            <div className="v">{isEn ? money(stats.entries) : fa(money(stats.entries))}</div>
            <div className="l">{t.statEntries}</div>
          </div>
          <div className="stat">
            <div className="v">{isEn ? money(stats.prizesPaid) : fa(money(stats.prizesPaid))}</div>
            <div className="l">{t.statPrizes}</div>
          </div>
        </div>
      </section>

      {/* ── چرا پلتفرم ما ── */}
      <section className="sec">
        <div className="sec-head">
          <h2>
            {t.whyTitle} <span>CODM ROOMS</span>؟
          </h2>
          <p>{t.whySub}</p>
        </div>

        <div className="feat-grid">
          <div className="feat">
            <div className="ic">🗺️</div>
            <h3>{t.featMapTitle}</h3>
            <p>{t.featMapDesc}</p>
          </div>

          <div className="feat">
            <div className="ic">💳</div>
            <h3>{t.featPayTitle}</h3>
            <p>{t.featPayDesc}</p>
          </div>

          <div className="feat">
            <div className="ic">🤖</div>
            <h3>{t.featBotTitle}</h3>
            <p>{t.featBotDesc}</p>
          </div>

          <div className="feat">
            <div className="ic">🏆</div>
            <h3>{t.featPrizeTitle}</h3>
            <p>{t.featPrizeDesc}</p>
          </div>

          <div className="feat">
            <div className="ic">🎁</div>
            <h3>{t.featRefTitle}</h3>
            <p>{t.featRefDesc}</p>
          </div>

          <div className="feat">
            <div className="ic">🎖️</div>
            <h3>{isEn ? '3D Gamer Dogtag' : 'داگ‌تگ و کارت گیمری ۳D'}</h3>
            <p>
              {isEn
                ? 'Design your personalized 3D holographic soldier dogtag card with ranks, clan tags, and favorite loadouts.'
                : 'کارت گیمری هولوگرافیک و اختصاصی خودت را بساز، رنک و کلن را نمایش بده و با دوستانت به اشتراک بگذار.'}
            </p>
          </div>
        </div>
      </section>

      {/* ── چهار قدم تا پیروزی ── */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-head">
          <h2>
            <span>{t.stepsTitle}</span>
          </h2>
          <p>{isEn ? 'From enlistment to champion victory in 4 tactical steps' : 'از ثبت‌نام تا قهرمانی در چهار گام ساده'}</p>
        </div>

        <div className="steps">
          <div className="step">
            <h3>{t.step1Title}</h3>
            <p>{t.step1Desc}</p>
          </div>
          <div className="step">
            <h3>{t.step2Title}</h3>
            <p>{t.step2Desc}</p>
          </div>
          <div className="step">
            <h3>{t.step3Title}</h3>
            <p>{t.step3Desc}</p>
          </div>
          <div className="step">
            <h3>{t.step4Title}</h3>
            <p>{t.step4Desc}</p>
          </div>
        </div>
      </section>

      {/* ── دعوت به اقدام (CTA) ── */}
      <section className="cta-box">
        <div className="cta-in">
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaSub}</p>
          <button
            className="btn lg"
            onClick={() => handleNav('rooms')}
          >
            {t.ctaBtn}
          </button>
        </div>
      </section>
    </div>
  );
};
