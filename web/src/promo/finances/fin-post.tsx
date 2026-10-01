import logo from '@/assets/logo.png';
import { copy } from '@/promo/locale';
import { backOut, easeIn, easeInOut, easeOut, enter, fadeUp, mix, popIn, slideIn, wave } from '@/promo/motion';
import { FinanceVisual } from '@/promo/finances/fin-card';
import { FIN_POST } from '@/promo/finances/fin-copy';
import { BEAT, FIN_OUTRO } from '@/promo/finances/fin-timeline';
import { useClock } from '@/promo/use-clock';
import { MASCOTS } from '@/social/mascots';
import { ArrowIcon, CheckIcon } from '@/social/post-frame';
import '@/social/social.css';
import '@/social/social-footer.css';
import '@/social/social-mascots.css';
import '@/social/visuals/cards.css';
import '@/promo/finances/fin.css';
import '@/promo/finances/fin-sales.css';

function AnimatedTitle({ time }: { time: number }) {
  const at = FIN_POST.title.indexOf(FIN_POST.accent);
  const words = [
    ...FIN_POST.title.slice(0, at).trim().split(' ').map((word) => ({ word, accent: false })),
    ...FIN_POST.accent.split(' ').map((word) => ({ word, accent: true })),
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

export function FinancePost({ square }: { square: boolean }) {
  const time = useClock();
  const mascot = MASCOTS.maia;
  const rise = enter(time, BEAT.mascot, 0.8, easeOut);
  const shine = enter(time, BEAT.shine, 0.8, easeInOut);
  const glow = time > BEAT.shine + 0.6 ? 0.5 + wave(time, 1.6, 0.5) : 0;
  const leave = enter(time, FIN_OUTRO + 0.1, 0.4, easeIn);

  return (
    <article className={`social-post is-dark ${square ? 'is-square' : 'is-portrait'} is-finances`} style={{ opacity: 1 - leave }}>
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
          <img src={FIN_POST.icon} alt="" />
          {FIN_POST.eyebrow}
        </span>
        <AnimatedTitle time={time} />
      </div>

      <FinanceVisual time={time} />

      <footer className="social-footer">
        <ul className="social-points">
          {FIN_POST.points.map((point, index) => {
            const p = enter(time, BEAT.points + index * 0.25, 0.45, backOut);
            return (
              <li key={point} style={{ opacity: Math.min(1, p * 1.5), transform: `translateX(${mix(-30, 0, Math.min(1, p))}px)` }}>
                <span style={{ display: 'flex', transform: `scale(${mix(0.3, 1, p)})` }}>
                  <CheckIcon />
                </span>
                <span>{point}</span>
              </li>
            );
          })}
        </ul>
        <span className="social-cta fin-cta" style={popIn(time, BEAT.cta, 0.55, 0.5)}>
          <span className="fin-cta-glow" style={{ opacity: glow }} />
          {copy.landing.hero.ctaPrimary}
          <ArrowIcon />
          <span className="fin-cta-clip">
            <span className="fin-cta-shine" style={{ transform: `translateX(${mix(-160, 520, shine)}px) skewX(-20deg)` }} />
          </span>
        </span>
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
