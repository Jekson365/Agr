import logo from '@/assets/logo.png';
import { copy } from '@/promo/locale';
import { easeIn, easeInOut, easeOut, enter, fadeUp, mix, popIn, slideIn, wave } from '@/promo/motion';
import { WineryVisual } from '@/promo/winery/wn-card';
import { WN_POST } from '@/promo/winery/wn-copy';
import { BEAT, WINERY_OUTRO } from '@/promo/winery/wn-timeline';
import { useClock } from '@/promo/use-clock';
import { MASCOTS } from '@/social/mascots';
import { ArrowIcon } from '@/social/post-frame';
import '@/social/social.css';
import '@/social/social-footer.css';
import '@/social/social-mascots.css';
import '@/social/visuals/cards.css';
import '@/promo/winery/wn.css';

function RisingTitle({ time }: { time: number }) {
  const at = WN_POST.title.indexOf(WN_POST.accent);
  const words = [
    ...WN_POST.title.slice(0, at).trim().split(' ').map((word) => ({ word, accent: false })),
    ...WN_POST.accent.split(' ').map((word) => ({ word, accent: true })),
  ];

  return (
    <h1 className="social-title">
      {words.map(({ word, accent }, index) => {
        const p = enter(time, BEAT.title + index * 0.07, 0.55, easeOut);
        return (
          <span key={index} className="promo-word">
            <span style={{ transform: `translateY(${mix(115, 0, p)}%)` }}>{accent ? <em>{word}</em> : word}</span>
          </span>
        );
      })}
    </h1>
  );
}

function Cta({ time }: { time: number }) {
  const shine = enter(time, BEAT.shine, 0.8, easeInOut);
  const glow = time > BEAT.shine + 0.6 ? 0.5 + wave(time, 1.6, 0.5) : 0;

  return (
    <span className="social-cta wn-cta" style={popIn(time, BEAT.cta, 0.55, 0.5)}>
      <span className="wn-cta-glow" style={{ opacity: glow }} />
      {copy.landing.hero.ctaPrimary}
      <ArrowIcon />
      <span className="wn-cta-clip">
        <span className="wn-cta-shine" style={{ transform: `translateX(${mix(-160, 520, shine)}px) skewX(-20deg)` }} />
      </span>
    </span>
  );
}

export function WineryPost({ square }: { square: boolean }) {
  const time = useClock();
  const mascot = MASCOTS.tomaWine;
  const rise = enter(time, BEAT.mascot, 0.8, easeOut);
  const leave = enter(time, WINERY_OUTRO + 0.1, 0.4, easeIn);

  return (
    <article className={`social-post is-dark ${square ? 'is-square' : 'is-portrait'} is-wine-flow`} style={{ opacity: 1 - leave }}>
      <div className="social-backdrop">
        <span className="social-dots" style={{ backgroundPosition: `${time * 6}px ${time * 3}px` }} />
      </div>

      <header className="social-top">
        <span className="social-brand" style={slideIn(time, BEAT.brand, -24, 0.5)}>
          <span className="social-brand-badge">
            <img src={logo} alt="" />
          </span>
          {copy.auth.appName}
        </span>
        <span className="social-url" style={fadeUp(time, BEAT.brand + 0.15, -14, 0.5)}>
          mtabari.com.ge
        </span>
      </header>

      <div className="social-copy">
        <span className="social-eyebrow" style={popIn(time, BEAT.eyebrow, 0.5, 0.6)}>
          <img src={WN_POST.icon} alt="" />
          {WN_POST.eyebrow}
        </span>
        <RisingTitle time={time} />
      </div>

      <WineryVisual time={time} />

      <footer className="social-footer">
        <Cta time={time} />
      </footer>

      <img
        className={`social-mascot ${mascot.className}`}
        src={mascot.src}
        alt=""
        style={{ opacity: Math.min(1, rise * 1.5), translate: `0 ${mix(160, 0, rise) + wave(time, 4.5, 6)}px` }}
      />
    </article>
  );
}
