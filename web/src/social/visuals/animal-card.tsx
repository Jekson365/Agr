import cowIcon from '@/assets/animals/cow.png';
import { formatIsoDayNumeric } from '@/components/ui/date-utils';
import { formatCount } from '@/promo/figures';
import { copy, LANGUAGE } from '@/promo/locale';
import { EN_ANIMAL } from '@/social/copy/en';
import { KA_ANIMAL } from '@/social/copy/ka';
import { EarTag, FemaleIcon, MaleIcon, StethoscopeIcon, SyringeIcon } from '@/social/visuals/animal-icons';
import '@/social/visuals/cards.css';
import '@/social/visuals/animal-card.css';
import '@/social/visuals/animal-tree.css';

const LABELS = LANGUAGE === 'en' ? EN_ANIMAL : KA_ANIMAL;
const { livestockDetail, history, farm } = copy;

const HERD = ['GE-0421', 'GE-0388', 'GE-0512'];
const MORE = 21;
const [CODE] = HERD;

const WEIGHTS = [402, 418, 431, 447, 456, 468, 474, 486];
const CURRENT = WEIGHTS[WEIGHTS.length - 1];
const GAIN = CURRENT - WEIGHTS[WEIGHTS.length - 2];
const SPARK = { width: 584, height: 46 };

const VISITS = [
  { Icon: SyringeIcon, label: LABELS.vaccination, date: '2026-09-12' },
  { Icon: StethoscopeIcon, label: LABELS.checkup, date: '2026-08-03' },
];

const PARENTS = [
  { code: 'GE-0112', Icon: FemaleIcon, tone: 'is-female' },
  { code: 'GE-0087', Icon: MaleIcon, tone: 'is-male' },
];

function sparkPoints() {
  const low = Math.min(...WEIGHTS) - 4;
  const high = Math.max(...WEIGHTS) + 4;
  return WEIGHTS.map((weight, index) => ({
    x: (index / (WEIGHTS.length - 1)) * (SPARK.width - 12) + 6,
    y: SPARK.height - ((weight - low) / (high - low)) * SPARK.height,
  }));
}

function WeightChart() {
  const points = sparkPoints();
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg className="passport-spark" viewBox={`0 0 ${SPARK.width} ${SPARK.height}`} aria-hidden="true">
      <polygon className="passport-spark-area" points={`${points[0].x},${SPARK.height} ${line} ${last.x},${SPARK.height}`} />
      <polyline className="passport-spark-line" points={line} />
      <circle className="passport-spark-dot" cx={last.x} cy={last.y} r="7" />
    </svg>
  );
}

function FamilyTree() {
  return (
    <div className="passport-tree">
      <span className="passport-tree-parents">
        {PARENTS.map(({ code, Icon, tone }) => (
          <span key={code} className={`passport-node ${tone}`}>
            <Icon />
            {code}
          </span>
        ))}
      </span>
      <span className="passport-tree-link" />
      <span className="passport-node is-self">
        <FemaleIcon />
        {CODE}
      </span>
    </div>
  );
}

export function AnimalCard() {
  return (
    <>
      <div className="social-card passport-card">
        <div className="passport-herd">
          {HERD.map((code, index) => (
            <span key={code} className={index === 0 ? 'passport-herd-chip is-active' : 'passport-herd-chip'}>
              <img src={cowIcon} alt="" />
              {code}
            </span>
          ))}
          <span className="passport-herd-chip is-more">+{MORE}</span>
        </div>

        <div className="passport-head">
          <span className="passport-avatar">
            <img src={cowIcon} alt="" />
          </span>
          <span className="passport-name">
            <strong>{CODE}</strong>
            <span>
              {farm.cow} · 3{livestockDetail.yearShort} 2{livestockDetail.monthShort}
            </span>
          </span>
          <span className="passport-gender">
            <FemaleIcon />
            {livestockDetail.female}
          </span>
        </div>

        <div className="passport-section">
          <div className="passport-weight-head">
            <span className="passport-section-title">{history.title}</span>
            <span className="passport-weight-now">
              {history.current} <strong>{formatCount(CURRENT)} {farm.unitKg}</strong>
            </span>
            <span className="social-chip">
              {history.gain} +{GAIN} {farm.unitKg}
            </span>
          </div>
          <WeightChart />
        </div>

        <div className="passport-columns">
          <div className="passport-section">
            <span className="passport-section-title">{history.medicalTab}</span>
            {VISITS.map(({ Icon, label, date }) => (
              <span key={label} className="passport-visit">
                <Icon />
                <strong>{label}</strong>
                <span>{formatIsoDayNumeric(date)}</span>
              </span>
            ))}
          </div>
          <div className="passport-section">
            <span className="passport-section-title">{LABELS.genetics}</span>
            <FamilyTree />
          </div>
        </div>
      </div>
      <EarTag prefix="GE" number="0421" />
    </>
  );
}
