import React from 'react';
import { I18N } from '../i18n/translations';

interface HelpProps {
  lang: 'fa' | 'en';
}

export const Help: React.FC<HelpProps> = ({ lang }) => {
  const isEn = lang === 'en';

  return (
    <div className="sec">
      <div className="sec-head">
        <h2>
          📖 <span>{isEn ? 'TOURNAMENT FIELD MANUAL' : 'راهنمای جامع و قوانین میدان نبرد'}</span>
        </h2>
        <p>
          {isEn
            ? 'Everything you need to know about joining custom rooms, verifying payments, and claiming cash prize pools.'
            : 'همه چیز درباره نحوه ثبت‌نام در روم‌ها، تایید رسید در ربات بله، قوانین مسابقات و دریافت جوایز نقدی.'}
        </p>
      </div>

      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ color: 'var(--acc)', fontSize: '18px', fontWeight: 900, marginBottom: '12px' }}>
            🪖 {isEn ? '1. Creating Profile & Authentication' : '۱. ساخت حساب و ورود به پلتفرم'}
          </h3>
          <p className="mut" style={{ lineHeight: 2, fontSize: '14px' }}>
            {isEn
              ? 'You can register in 30 seconds using an English username and password. You can also start @codm_room_bot on Bale or Telegram to automatically create and synchronize your soldier profile.'
              : 'ثبت‌نام در پلتفرم کمتر از ۳۰ ثانیه زمان می‌برد. نام کاربری انگلیسی و رمز عبور دلخواه خود را وارد کنید. همچنین با ارسال دستور /start در ربات بله یا تلگرام، حساب شما به صورت خودکار ساخته می‌شود.'}
          </p>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ color: 'var(--acc)', fontSize: '18px', fontWeight: 900, marginBottom: '12px' }}>
            🎯 {isEn ? '2. Reserving Squad Slot on Tactical Map' : '۲. انتخاب موقعیت و جایگاه روی اسلات‌مپ'}
          </h3>
          <p className="mut" style={{ lineHeight: 2, fontSize: '14px' }}>
            {isEn
              ? 'Browse open rooms in the Rooms section. Click "View & Lock Slot" to open the live interactive squad board. Choose your preferred team (Team A, Team B, etc.) and click an open green slot to secure your seat.'
              : 'از بخش روم‌ها، تورنمنت مورد نظر را انتخاب کرده و روی «مشاهده و رزرو جایگاه» کلیک کنید. چیدمان تیم‌ها و اسکوادها به صورت زنده نمایش داده می‌شود. روی هر جایگاه سبز خالی کلیک کنید تا وارد فرایند ثبت‌نام شوید.'}
          </p>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ color: 'var(--acc)', fontSize: '18px', fontWeight: 900, marginBottom: '12px' }}>
            💳 {isEn ? '3. Payment & Automated Bot Verification' : '۳. پرداخت و تایید فیش توسط ربات بله و تلگرام'}
          </h3>
          <p className="mut" style={{ lineHeight: 2, fontSize: '14px' }}>
            {isEn
              ? 'You can pay using wallet balance or card-to-card. For card payments, transfer the exact fee and send the receipt photo to our official Bale bot (@codm_room_bot). Because text-only tracking codes cannot be verified, sending the receipt photo is strictly required. Once verified, you will receive an automated confirmation message right inside the bot!'
              : 'پرداخت از طریق موجودی کیف پول یا کارت‌به‌کارت انجام می‌شود. برای واریز کارت‌به‌کارت، مبلغ دقیق ورودی را انتقال داده و عکس فیش رسید واریز را در ربات رسمی بله (@codm_room_bot) بفرستید (به دلیل غیرقابل پیگیری بودن کدهای پیگیری متنی، ارسال تصویر رسید الزامی است). به محض بررسی و تایید توسط مدیریت، پیام تاییدیه خودکار در همان ربات برای شما ارسال می‌شود.'}
          </p>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ color: 'var(--acc)', fontSize: '18px', fontWeight: 900, marginBottom: '12px' }}>
            🔓 {isEn ? '4. Accessing Room ID & Password' : '۴. دریافت آیدی و رمز روم (Room ID / Pass)'}
          </h3>
          <p className="mut" style={{ lineHeight: 2, fontSize: '14px' }}>
            {isEn
              ? 'Prior to tournament start, the admin publishes the private Room ID and Password. It will instantly unlock in your Profile tickets and will be sent via direct message to your Telegram/Bale bot.'
              : 'پیش از آغاز مسابقه، آیدی و رمز ورود توسط مدیریت در سیستم ثبت می‌شود. این اطلاعات در صفحه روم و همچنین در بخش بلیت‌های حساب کاربری شما آنلاک می‌شود و پیام آن مستقیماً در ربات برای شما فرستاده خواهد شد.'}
          </p>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ color: 'var(--acc)', fontSize: '18px', fontWeight: 900, marginBottom: '12px' }}>
            🏆 {isEn ? '5. Cash Prize Payouts' : '۵. نحوه دریافت جوایز نقدی'}
          </h3>
          <p className="mut" style={{ lineHeight: 2, fontSize: '14px' }}>
            {isEn
              ? 'Winning players have their cash prizes credited directly into their platform wallet, which can be withdrawn to their bank card or used for future tournament entries.'
              : 'پس از پایان مسابقه و مشخص شدن تیم قهرمان، مبلغ جایزه توسط مدیریت مستقیماً به کیف پول برندگان واریز می‌شود که می‌توانند آن را برای ثبت‌نام در روم‌های بعدی استفاده کرده یا درخواست تسویه ثبت نمایند.'}
          </p>
        </div>
      </div>
    </div>
  );
};
