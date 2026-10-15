import React from 'react';
import { AudioFX } from '../services/audio';

interface SoundboardModalProps {
  onClose: () => void;
  lang: 'fa' | 'en';
}

interface SoundItem {
  id: string;
  icon: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  soundType: 'click' | 'lock' | 'headshot' | 'nuke' | 'reload' | 'radio' | 'uav' | 'emp';
  voiceText?: string;
  voiceTextEn?: string;
}

const SOUNDS: SoundItem[] = [
  {
    id: 'uav',
    icon: '🛰️',
    title: 'پهپاد شناسایی (UAV)',
    titleEn: 'Friendly UAV Online',
    desc: 'شناسایی موقعیت دشمنان',
    descEn: 'Scanning hostile coordinates',
    soundType: 'uav',
    voiceText: 'UAV Online — موقعیت دشمنان روی مینی‌مپ ردیابی شد!',
    voiceTextEn: 'Friendly UAV online, scanning battlefield!'
  },
  {
    id: 'nuke',
    icon: '☢️',
    title: 'بمب هسته‌ای تاکتیکال (NUKE)',
    titleEn: 'Tactical Nuke Ready',
    desc: 'صدای هشدار و انفجار نوک',
    descEn: 'Warning! Tactical Nuke inbound',
    soundType: 'nuke',
    voiceText: '⚠️ هشدار: بمب هسته‌ای تاکتیکال فعال شد!',
    voiceTextEn: 'Tactical Nuke ready! Mission accomplished.'
  },
  {
    id: 'headshot',
    icon: '🎯',
    title: 'شلیک هدشات (Headshot)',
    titleEn: 'Sniper Headshot Ding',
    desc: 'صدای شیرین کیل با اسنایپر',
    descEn: 'Target eliminated, headshot confirmed',
    soundType: 'headshot',
    voiceText: 'هدف با موفقیت هدشات شد! 💥',
    voiceTextEn: 'Headshot! One shot, one kill.'
  },
  {
    id: 'lock',
    icon: '🔒',
    title: 'قفل موقعیت (Target Locked)',
    titleEn: 'Squad Slot Locked',
    desc: 'تایید رزرو جایگاه در روم',
    descEn: 'Squad position secured',
    soundType: 'lock',
    voiceText: 'موقعیت اسکواد با موفقیت قفل شد.',
    voiceTextEn: 'Target locked, slot secured.'
  },
  {
    id: 'reload',
    icon: '🔄',
    title: 'تعویض خشاب (Tactical Reload)',
    titleEn: 'Tactical Reload',
    desc: 'خشاب‌گذاری سریع تفنگ',
    descEn: 'Reloading weapon, cover me!',
    soundType: 'reload',
    voiceText: 'در حال خشاب‌گذاری — کاورم کن!',
    voiceTextEn: 'Reloading! Watch my six.'
  },
  {
    id: 'emp',
    icon: '⚡',
    title: 'پالس الکترومغناطیسی (EMP)',
    titleEn: 'EMP Systems Disrupt',
    desc: 'از کار انداختن سیستم‌های راداری',
    descEn: 'Hostile radar systems disabled',
    soundType: 'emp',
    voiceText: 'پالس EMP فعال شد — تجهیزات الکترونیکی دشمن مختل شدند!',
    voiceTextEn: 'EMP blast dispatched! Systems offline.'
  },
  {
    id: 'radio',
    icon: '📻',
    title: 'دستور حمله اسکواد (Attack Order)',
    titleEn: 'Bravo Six Going Dark',
    desc: 'بیسیم کاپیتان پرایس',
    descEn: 'Bravo squad push the objective',
    soundType: 'radio',
    voiceText: 'تیم براوو، حمله به منطقه هدف را آغاز کنید!',
    voiceTextEn: 'Bravo Six, going dark.'
  },
  {
    id: 'click',
    icon: '🔘',
    title: 'ماشه و کلیک تاکتیکال',
    titleEn: 'Trigger Safety Release',
    desc: 'آزادسازی ضامن سلاح',
    descEn: 'Tactical button response',
    soundType: 'click',
    voiceText: 'ضامن سلاح آزاد شد.',
    voiceTextEn: 'Weapons free, engage at will.'
  }
];

export const SoundboardModal: React.FC<SoundboardModalProps> = ({ onClose, lang }) => {
  const isEn = lang === 'en';

  const handlePlay = (item: SoundItem) => {
    AudioFX.play(item.soundType);
  };

  return (
    <div className="modal-ov" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal wide">
        <button className="mclose" onClick={onClose} aria-label="بستن">✕</button>

        <h3>{isEn ? '📻 Tactical Radio Soundboard' : '📻 بیسیم و دیالوگ‌های تاکتیکال کالاف'}</h3>
        <p className="msub">
          {isEn
            ? 'Interactive audio soundboard with Call of Duty Mobile tactical cues and weapon sound synthesizer.'
            : 'بیسیم نظامی و افکت‌های صوتی سینمایی کالاف دیوتی موبایل — روی هر صدا کلیک کن تا پخش شود.'}
        </p>

        <div className="soundboard-grid">
          {SOUNDS.map((s) => (
            <div
              key={s.id}
              className="sfx-card"
              onClick={() => handlePlay(s)}
            >
              <div className="sfx-icon-lg">{s.icon}</div>
              <div className="sfx-title">{isEn ? s.titleEn : s.title}</div>
              <div className="sfx-desc">{isEn ? s.descEn : s.desc}</div>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--acc2)',
                  marginTop: '4px',
                  background: 'rgba(255,159,26,0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
              >
                ▶ {isEn ? 'PLAY' : 'پخش'}
              </span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button className="btn ghost" onClick={onClose}>
            {isEn ? 'Close Radio' : 'بستن بیسیم'}
          </button>
        </div>
      </div>
    </div>
  );
};
