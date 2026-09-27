import rabbitIcon from '@/assets/animals/rabbit.png';
import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import logo from '@/assets/logo.png';
import animalsIcon from '@/assets/properties/animals.png';
import balanceIcon from '@/assets/properties/balance.png';
import ka from '@/locales/ka.json';
import { backOut, easeIn, enter, fadeUp, mix, slideIn } from '@/promo/motion';
import { screenEnd, screenStart } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

type CaptionCopy = { icon: string; eyebrow: string; title: string; body: string };

const [breedingTitle, breedingBody] = ka.help.breeding.split('. ');

const CAPTIONS: CaptionCopy[] = [
  {
    icon: logo,
    eyebrow: ka.landing.hero.badge,
    title: ka.landing.hero.title,
    body: ka.landing.cta.subtitle,
  },
  {
    icon: harvestIcon,
    eyebrow: ka.landing.harvest.eyebrow,
    title: ka.landing.harvest.title,
    body: ka.landing.harvest.subtitle,
  },
  {
    icon: balanceIcon,
    eyebrow: ka.harvestGrading.title,
    title: ka.landing.harvest.quality.title,
    body: ka.landing.harvest.quality.body,
  },
  {
    icon: animalsIcon,
    eyebrow: ka.farm.livestock,
    title: ka.landing.manage.livestock.title,
    body: ka.landing.manage.livestock.body,
  },
  {
    icon: rabbitIcon,
    eyebrow: ka.breedingEvent.title,
    title: breedingTitle,
    body: breedingBody.split(' — ')[0],
  },
  {
    icon: reportIcon,
    eyebrow: ka.landing.reports.eyebrow,
    title: ka.landing.reports.title,
    body: ka.landing.reports.harvest.body,
  },
];

function Caption({ copy, start, end }: { copy: CaptionCopy; start: number; end: number }) {
  const time = useClock();
  const exit = enter(time, end - 0.04, 0.22, easeIn);
  const shown = time >= start && exit < 1;
  const words = copy.title.split(' ');

  return (
    <div
      className="promo-caption"
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

      <p className="promo-caption-body" style={fadeUp(time, start + 0.3, 18, 0.5)}>
        {copy.body}
      </p>
    </div>
  );
}

export function Captions() {
  return (
    <>
      {CAPTIONS.map((copy, index) => (
        <Caption
          key={copy.eyebrow}
          copy={copy}
          start={screenStart(index) + (index === 0 ? 0.3 : 0.1)}
          end={screenEnd(index)}
        />
      ))}
    </>
  );
}
