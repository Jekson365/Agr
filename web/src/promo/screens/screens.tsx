import { easeIn, enter, mix } from '@/promo/motion';
import { BreedingScreen } from '@/promo/screens/breeding-screen';
import { DashboardScreen } from '@/promo/screens/dashboard-screen';
import { GradingScreen } from '@/promo/screens/grading-screen';
import { HarvestScreen } from '@/promo/screens/harvest-screen';
import { LivestockScreen } from '@/promo/screens/livestock-screen';
import { ReportScreen } from '@/promo/screens/report-screen';
import { LAST_SCREEN, screenEnd, screenStart } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';
import '@/promo/screens/screens.css';

const SCREENS = [DashboardScreen, HarvestScreen, GradingScreen, LivestockScreen, BreedingScreen, ReportScreen];

export function Screens() {
  const time = useClock();

  return (
    <>
      {SCREENS.map((Screen, index) => {
        const start = screenStart(index);
        const incoming = index === 0 ? 1 : enter(time, start + 0.06, 0.36);
        const outgoing = index === LAST_SCREEN ? 0 : enter(time, screenEnd(index), 0.2, easeIn);
        const shown = time >= start && outgoing < 1;

        return (
          <div
            key={index}
            className="promo-screen"
            style={{
              visibility: shown ? 'visible' : 'hidden',
              opacity: incoming * (1 - outgoing),
              transform: `translateX(${mix(56, 0, incoming) - 44 * outgoing}px)`,
            }}
          >
            <Screen start={start} />
          </div>
        );
      })}
    </>
  );
}
