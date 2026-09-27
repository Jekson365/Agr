import logo from '@/assets/logo.png';
import ka from '@/locales/ka.json';
import { easeInOut, enter, fadeUp, mix, popIn, wave } from '@/promo/motion';
import { OUTRO_START } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';
import '@/promo/outro.css';

const LETTERS = Array.from(ka.auth.appName);

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function OutroScene() {
  const time = useClock();
  const start = OUTRO_START;
  const cover = enter(time, start, 0.42, easeInOut);
  const shine = enter(time, start + 1.25, 0.7, easeInOut);
  const glow = time > start + 1.1 ? 0.5 + wave(time, 1.6, 0.5) : 0;

  return (
    <div className="promo-outro" style={{ visibility: time >= start ? 'visible' : 'hidden' }}>
      <span
        className="promo-outro-veil"
        style={{ opacity: cover, backdropFilter: `blur(${mix(0, 16, cover)}px)`, WebkitBackdropFilter: `blur(${mix(0, 16, cover)}px)` }}
      />

      <div className="promo-outro-copy">
        <span className="promo-outro-badge" style={popIn(time, start + 0.3, 0.6, 0.2)}>
          <img src={logo} alt="" />
        </span>
        <h2 className="promo-outro-name">
          {LETTERS.map((letter, index) => {
            const p = enter(time, start + 0.42 + index * 0.05, 0.5);
            return (
              <span key={index} style={{ opacity: p, transform: `translateY(${mix(60, 0, p)}px)`, filter: `blur(${mix(10, 0, p)}px)` }}>
                {letter}
              </span>
            );
          })}
        </h2>
        <p className="promo-outro-tagline" style={fadeUp(time, start + 0.64, 20)}>
          {ka.auth.tagline}
        </p>
        <span className="promo-outro-cta" style={popIn(time, start + 0.76, 0.55, 0.5)}>
          <span className="promo-outro-cta-glow" style={{ opacity: glow }} />
          {ka.landing.hero.ctaPrimary}
          <ArrowIcon />
          <span className="promo-outro-cta-clip">
            <span className="promo-outro-shine" style={{ transform: `translateX(${mix(-220, 620, shine)}px) skewX(-20deg)` }} />
          </span>
        </span>
        <p className="promo-outro-url" style={fadeUp(time, start + 0.9, 16)}>
          mtabari.com.ge
        </p>
      </div>
    </div>
  );
}
