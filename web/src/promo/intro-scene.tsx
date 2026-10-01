import farmland from '@/assets/farmland-wide.webp';
import logo from '@/assets/logo.png';
import { copy } from '@/promo/locale';
import { backOut, easeIn, easeOut, enter, fadeUp, mix } from '@/promo/motion';
import { INTRO_END } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';
import '@/promo/intro.css';

export type IntroLayout = { badge: { x: number; y: number }; image: string; portal: number; copyTop: number };

const DESKTOP_INTRO: IntroLayout = { badge: { x: 960, y: 380 }, image: farmland, portal: 1250, copyTop: 535 };
const BADGE_RADIUS = 118;
const PORTAL_START = 1.62;
const LETTERS = Array.from(copy.auth.appName);

export function IntroScene({ layout = DESKTOP_INTRO }: { layout?: IntroLayout }) {
  const time = useClock();
  const spot = layout.badge;
  const badge = enter(time, 0.12, 0.7, backOut);
  const markOut = enter(time, 1.44, 0.18, easeIn);
  const textOut = enter(time, 1.46, 0.3, easeIn);
  const ring = enter(time, 0.42, 0.9, easeOut);
  const hole = time < PORTAL_START ? 0 : mix(BADGE_RADIUS, layout.portal, enter(time, PORTAL_START, 0.6, (p) => p * p));
  const mask = hole > 0 ? `radial-gradient(circle at ${spot.x}px ${spot.y}px, transparent ${hole}px, black ${hole + 1}px)` : 'none';

  return (
    <div
      className="promo-intro"
      style={{ visibility: time < INTRO_END ? 'visible' : 'hidden', maskImage: mask, WebkitMaskImage: mask }}
    >
      <img
        className="promo-intro-bg"
        src={layout.image}
        alt=""
        style={{ transform: `scale(${mix(1.18, 1.04, enter(time, 0, INTRO_END, easeOut))})` }}
      />
      <span className="promo-intro-scrim" />

      <span
        className="promo-intro-ring"
        style={{
          left: spot.x,
          top: spot.y,
          opacity: 0.7 * (1 - ring) * (time > 0.42 ? 1 : 0),
          transform: `translate(-50%, -50%) scale(${mix(1, 1.9, ring)})`,
        }}
      />
      <span
        className="promo-intro-badge"
        style={{ left: spot.x, top: spot.y, transform: `translate(-50%, -50%) scale(${badge}) rotate(${mix(-16, 0, badge)}deg)` }}
      >
        <img src={logo} alt="" style={{ opacity: 1 - markOut, transform: `scale(${1 - 0.35 * markOut})` }} />
      </span>

      <div className="promo-intro-copy" style={{ top: layout.copyTop, opacity: 1 - textOut, transform: `translateY(${50 * textOut}px)` }}>
        <h1 className="promo-intro-name">
          {LETTERS.map((letter, index) => {
            const p = enter(time, 0.3 + index * 0.06, 0.55);
            return (
              <span
                key={index}
                style={{ opacity: p, transform: `translateY(${mix(70, 0, p)}px)`, filter: `blur(${mix(12, 0, p)}px)` }}
              >
                {letter}
              </span>
            );
          })}
        </h1>
        <p className="promo-intro-tagline" style={fadeUp(time, 0.62, 24, 0.55)}>
          {copy.auth.tagline}
        </p>
      </div>
    </div>
  );
}
