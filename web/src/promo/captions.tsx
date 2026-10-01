import rabbitIcon from '@/assets/animals/rabbit.png';
import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import logo from '@/assets/logo.png';
import animalsIcon from '@/assets/properties/animals.png';
import balanceIcon from '@/assets/properties/balance.png';
import { CAPTION_TEXT, type CaptionText } from '@/promo/caption-copy';
import { backOut, easeIn, enter, fadeUp, mix, slideIn } from '@/promo/motion';
import { screenEnd, screenStart } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

type CaptionCopy = CaptionText & { icon: string };

const CAPTIONS: CaptionCopy[] = [
  { icon: logo, ...CAPTION_TEXT.intro },
  { icon: harvestIcon, ...CAPTION_TEXT.harvest },
  { icon: balanceIcon, ...CAPTION_TEXT.grading },
  { icon: animalsIcon, ...CAPTION_TEXT.livestock },
  { icon: rabbitIcon, ...CAPTION_TEXT.breeding },
  { icon: reportIcon, ...CAPTION_TEXT.reports },
];

function Caption({ copy, start, end, className }: { copy: CaptionCopy; start: number; end: number; className: string }) {
  const time = useClock();
  const exit = enter(time, end - 0.04, 0.22, easeIn);
  const shown = time >= start && exit < 1;
  const words = copy.title.split(' ');

  return (
    <div
      className={className}
      style={{
        visibility: shown ? 'visible' : 'hidden',
        opacity: 1 - exit,
        transform: `translateY(${-30 * exit}px)`,
      }}
    >
      <div className="promo-caption-eyebrow" style={slideIn(time, start, -26, 0.45)}>
        <span
          className="promo-caption-icon"
          style={{ transform: `scale(${enter(time, start, 0.55, backOut)})` }}
        >
          <img src={copy.icon} alt="" />
        </span>
        {copy.eyebrow}
      </div>

      <h2 className="promo-caption-title">
        {words.map((word, index) => {
          const p = enter(time, start + 0.08 + index * 0.055, 0.5);
          return (
            <span key={index} className="promo-word">
              <span style={{ transform: `translateY(${mix(115, 0, p)}%)` }}>{word}</span>
            </span>
          );
        })}
      </h2>

      {copy.body && (
        <p className="promo-caption-body" style={fadeUp(time, start + 0.3, 18, 0.5)}>
          {copy.body}
        </p>
      )}
    </div>
  );
}

export function Captions({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const className = variant === 'mobile' ? 'promo-caption is-mobile' : 'promo-caption';

  return (
    <>
      {CAPTIONS.map((copy, index) => (
        <Caption
          key={copy.eyebrow}
          copy={copy}
          className={className}
          start={screenStart(index) + (index === 0 ? 0.3 : 0.1)}
          end={screenEnd(index)}
        />
      ))}
    </>
  );
}
