import logo from '@/assets/logo.png';
import { copy } from '@/promo/locale';
import { easeIn, easeOut, enter, mix, slideIn } from '@/promo/motion';
import { PHONE_BOX } from '@/promo/mobile/layout';
import { TabBar } from '@/promo/mobile/tab-bar';
import { Screens } from '@/promo/screens/screens';
import { OUTRO_START, STAGE_IN, windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';
import '@/promo/mobile/phone.css';

const AVATAR = (copy.landing.preview.greeting.split(', ')[1] ?? '').charAt(0);

function StatusIcons() {
  return (
    <span className="promo-phone-icons">
      <svg viewBox="0 0 24 16" width="30" height="20" fill="currentColor" aria-hidden="true">
        <rect x="0" y="10" width="4" height="6" rx="1" />
        <rect x="6" y="7" width="4" height="9" rx="1" />
        <rect x="12" y="4" width="4" height="12" rx="1" />
        <rect x="18" y="0" width="4" height="16" rx="1" />
      </svg>
      <span className="promo-phone-battery">
        <span />
      </span>
    </span>
  );
}

export function PhoneFrame() {
  const time = useClock();
  const rise = enter(time, STAGE_IN + 0.05, 0.85, easeOut);
  const leave = enter(time, OUTRO_START + 0.1, 0.4, easeIn);
  const shown = time >= STAGE_IN && leave < 1;
  const base = STAGE_IN + 0.3;

  return (
    <div
      className="promo-phone"
      style={{
        left: PHONE_BOX.x,
        top: PHONE_BOX.y,
        width: PHONE_BOX.width,
        height: PHONE_BOX.height,
        visibility: shown ? 'visible' : 'hidden',
        opacity: Math.min(enter(time, STAGE_IN + 0.05, 0.35), 1 - leave),
        transform: `perspective(2400px) translateY(${mix(260, 0, rise) + windowFloat(time)}px) rotateX(${mix(18, 0, rise)}deg) scale(${mix(0.9, 1, rise)})`,
      }}
    >
      <div className="promo-phone-screen">
        <div className="promo-phone-status">
          <span>9:41</span>
          <span className="promo-phone-island" />
          <StatusIcons />
        </div>

        <div className="promo-phone-header" style={slideIn(time, base, -20, 0.45)}>
          <img src={logo} alt="" />
          <span>{copy.auth.appName}</span>
          <span className="promo-phone-avatar">{AVATAR}</span>
        </div>

        <div className="promo-phone-main">
          <Screens />
        </div>

        <TabBar />
      </div>
    </div>
  );
}
