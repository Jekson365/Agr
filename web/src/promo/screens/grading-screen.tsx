import tomatoIcon from '@/assets/goods/tomato.png';
import { rangeText } from '@/components/farm/assessment/criteria-draft';
import { ASSESSMENT_GRADE_COLOR, ASSESSMENT_GRADE_FILL } from '@/config/assessment-grades';
import ka from '@/locales/ka.json';
import { formatCount } from '@/promo/figures';
import { easeInOut, enter, fadeUp, popIn, slideIn } from '@/promo/motion';
import { useClock } from '@/promo/use-clock';
import type { AssessmentGrade } from '@/types/harvest-assessment';
import '@/promo/screens/grading.css';

type Range = [number | null, number | null];

type GradeRow = { grade: AssessmentGrade; size: Range; weight: Range; quantity: number; wasted: number };

const ROWS: GradeRow[] = [
  { grade: 'A', size: [70, 90], weight: [180, 240], quantity: 700, wasted: 6 },
  { grade: 'B', size: [55, 70], weight: [130, 180], quantity: 400, wasted: 10 },
  { grade: 'C', size: [40, 55], weight: [90, 130], quantity: 150, wasted: 14 },
  { grade: 'D', size: [null, 40], weight: [null, 90], quantity: 40, wasted: 20 },
];

const WASTED = ROWS.reduce((sum, row) => sum + row.wasted, 0);
const TOTAL = ROWS.reduce((sum, row) => sum + row.quantity, 0) + WASTED;
const MAX = Math.max(...ROWS.map((row) => row.quantity));

const { upTo, unitSize, unitWeight } = ka.assessment;

function figure(template: string, amount: number): string {
  return template.replace('{amount}', formatCount(amount)).replace('{unit}', ka.farm.unitKg);
}

export function GradingScreen({ start }: { start: number }) {
  const time = useClock();
  const base = start + 0.14;
  const split = enter(time, base + 0.3, 0.8, easeInOut);

  return (
    <>
      <h3 className="promo-screen-title" style={fadeUp(time, base, 16)}>
        {ka.harvestGrading.title}
      </h3>

      <div className="promo-card promo-grading" style={fadeUp(time, base + 0.04, 24)}>
        <div className="promo-grading-head">
          <span className="promo-row-icon">
            <img src={tomatoIcon} alt="" />
          </span>
          <strong>{ka.landing.harvest.sampleTomato}</strong>
          <span className="promo-chip is-muted" style={popIn(time, base + 0.18, 0.4, 0.6)}>
            {figure(ka.harvestGrading.harvested, TOTAL)}
          </span>
          <span className="promo-chip" style={popIn(time, base + 0.26, 0.4, 0.6)}>
            {figure(ka.harvestGrading.graded, TOTAL * enter(time, base + 0.3, 0.8))}
          </span>
        </div>

        <span className="promo-grading-split" style={{ clipPath: `inset(0 ${100 - split * 100}% 0 0 round 999px)` }}>
          {ROWS.map((row) => (
            <span key={row.grade} style={{ flexGrow: row.quantity, background: ASSESSMENT_GRADE_COLOR[row.grade] }} />
          ))}
          <span className="is-wasted" style={{ flexGrow: WASTED }} />
        </span>

        <div className="promo-grading-row is-header" style={fadeUp(time, base + 0.2, 8, 0.4)}>
          <span>{ka.assessment.colGrade}</span>
          <span>{ka.assessment.colSize}</span>
          <span>{ka.assessment.colWeight}</span>
          <span>{ka.harvestGrading.colQuantity}</span>
          <span>{ka.harvestGrading.colWasted}</span>
        </div>

        {ROWS.map((row, index) => {
          const at = base + 0.26 + index * 0.07;
          const grow = enter(time, at + 0.1, 0.6);
          return (
            <div key={row.grade} className="promo-grading-row" style={slideIn(time, at, 50, 0.45)}>
              <span
                className="promo-grade"
                style={{ background: ASSESSMENT_GRADE_FILL[row.grade], color: ASSESSMENT_GRADE_COLOR[row.grade] }}
              >
                {row.grade}
              </span>
              <span>{rangeText(row.size[0], row.size[1], upTo, unitSize)}</span>
              <span>{rangeText(row.weight[0], row.weight[1], upTo, unitWeight)}</span>
              <span className="promo-grading-amount">
                <span className="promo-grading-track">
                  <span
                    style={{ width: `${(row.quantity / MAX) * 100 * grow}%`, background: ASSESSMENT_GRADE_COLOR[row.grade] }}
                  />
                </span>
                <strong>
                  {formatCount(row.quantity * grow)} {ka.farm.unitKg}
                </strong>
              </span>
              <span className="promo-grading-wasted">
                {formatCount(row.wasted * grow)} {ka.farm.unitKg}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
