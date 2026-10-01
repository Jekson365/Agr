import logo from '@/assets/logo.png';
import { copy } from '@/promo/locale';
import { backOut, easeIn, enter, fadeUp, mix, slideIn } from '@/promo/motion';
import { CYCLE_CAPTIONS, type CycleCaption } from '@/promo/harvest/cycle-copy';
import { CAPTION_STARTS, CYCLE_OUTRO } from '@/promo/harvest/cycle-timeline';
import { useClock } from '@/promo/use-clock';

function Caption({ caption, start, end, time }: { caption: CycleCaption; start: number; end: number; time: number }) {
  const exit = enter(time, end - 0.04, 0.22, easeIn);
  const shown = time >= start && exit < 1;

  return (
    <div
      className="cycle-caption"
      style={{ visibility: shown ? 'visible' : 'hidden', opacity: 1 - exit, transform: `translateY(${-24 * exit}px)` }}
    >
      <span className="cycle-caption-icon" style={{ transform: `scale(${enter(time, start, 0.55, backOut)})` }}>
        <img src={caption.icon} alt="" />
      </span>
      <div className="cycle-caption-text">
        <div className="cycle-caption-eyebrow" style={slideIn(time, start, -22, 0.45)}>
          {caption.eyebrow}
        </div>
        <h2 className="cycle-caption-title">
          {caption.title.split(' ').map((word, index) => {
            const p = enter(time, start + 0.08 + index * 0.05, 0.5);
            return (
              <span key={index} className="promo-word">
                <span style={{ transform: `translateY(${mix(115, 0, p)}%)` }}>{word}</span>
              </span>
            );
          })}
        </h2>
        <p className="cycle-caption-body" style={fadeUp(time, start + 0.25, 14, 0.45)}>
          {caption.body}
        </p>
      </div>
    </div>
  );
}

type BandProps = { captions: CycleCaption[]; starts: number[]; end: number };

export function CaptionBand({ captions, starts, end }: BandProps) {
  const time = useClock();

  return (
    <>
      <div className="cycle-brand" style={fadeUp(time, 0.1, 12, 0.5)}>
        <img src={logo} alt="" />
        <span>{copy.auth.appName}</span>
      </div>
      {captions.map((caption, index) => (
        <Caption
          key={index}
          caption={caption}
          start={starts[index]}
          end={starts[index + 1] ?? end}
          time={time}
        />
      ))}
    </>
  );
}

export function CycleCaptions() {
  return <CaptionBand captions={CYCLE_CAPTIONS} starts={CAPTION_STARTS} end={CYCLE_OUTRO} />;
}
