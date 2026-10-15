import React from 'react';

interface TickerProps {
  lang: 'fa' | 'en';
}

export const Ticker: React.FC<TickerProps> = ({ lang }) => {
  const isEn = lang === 'en';

  return (
    <div className="battle-ticker" id="battleTicker">
      <div className="ticker-label">
        <span className="live-dot"></span>
        <span>{isEn ? 'TACTICAL INTEL' : 'اطلاعات زنده نبرد'}</span>
      </div>
      <div className="ticker-content" id="tickerMarquee">
        {isEn ? (
          <>
            <span className="titem">⚡ CODM ROOMS SEASON META: DL Q33 & GRAU 5.56 TOP PICKS</span>
            <span className="titem">🏆 WEEKLY SNIPER 1v1 TOURNAMENT PRIZE POOL DEPOSITED</span>
            <span className="titem">🛡️ BALE & TELEGRAM BOT INSTANT RECEIPT VALIDATION ONLINE</span>
            <span className="titem">🎁 INVITE COMRADES VIA REFERRAL FOR 10,000 TOMAN WALLET REWARD</span>
          </>
        ) : (
          <>
            <span className="titem">⚡ متای سیزن کالاف دیوتی: اسنایپر DL Q33 و تفنگ Grau 5.56 در صدر جدول</span>
            <span className="titem">🏆 جایزه نقدی تورنمنت هفتگی اسنایپر ۱v۱ به حساب قهرمانان واریز شد</span>
            <span className="titem">🛡️ تایید سریع فیش واریز از طریق ربات رسمی بله و تلگرام فعال است</span>
            <span className="titem">🎁 با دعوت دوستان از طریق کد معرف اختصاصی، ۱۰,۰۰۰ تومان پاداش نقدی بگیر</span>
          </>
        )}
      </div>
    </div>
  );
};
