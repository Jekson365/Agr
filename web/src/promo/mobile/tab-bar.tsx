import { easeInOut, easeOut, enter, fadeUp, mix } from '@/promo/motion';
import { TAB_HEIGHT, TAB_ICON_CENTER, TAB_WIDTH } from '@/promo/mobile/layout';
import { activeIndex, NAV_ITEMS } from '@/promo/nav';
import { clickTime, STAGE_IN } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

function TabRipple({ index }: { index: number }) {
  const time = useClock();
  const click = clickTime(index);
  if (time < click || time > click + 0.55) return null;
  const grow = enter(time, click, 0.55, easeOut);
  const size = mix(24, 170, grow);

  return (
    <span
      className="promo-tab-ripple"
      style={{
        width: size,
        height: size,
        left: TAB_WIDTH * (index + 0.5) - size / 2,
        top: TAB_ICON_CENTER - size / 2,
        opacity: 0.3 * (1 - grow),
      }}
    />
  );
}

export function TabBar() {
  const time = useClock();
  const active = activeIndex(time);
  const moved = active === 0 ? 1 : enter(time, clickTime(active), 0.32, easeInOut);
  const pillIndex = mix(Math.max(active - 1, 0), active, moved);
  const base = STAGE_IN + 0.3;

  return (
    <div className="promo-tabs" style={{ height: TAB_HEIGHT }}>
      <span
        className="promo-tab-pill"
        style={{ left: pillIndex * TAB_WIDTH + 8, width: TAB_WIDTH - 16, opacity: enter(time, base + 0.2, 0.3) }}
      />

      {NAV_ITEMS.map((item, index) => (
        <div
          key={item.label}
          className={index === active ? 'promo-tab is-active' : 'promo-tab'}
          style={{ left: index * TAB_WIDTH, width: TAB_WIDTH, ...fadeUp(time, base + 0.08 + index * 0.05, 18, 0.45) }}
        >
          <img src={item.icon} alt="" />
          <span>{item.label}</span>
        </div>
      ))}

      {NAV_ITEMS.map((item, index) => (index === 0 ? null : <TabRipple key={item.label} index={index} />))}

      <span className="promo-tabs-home" />
    </div>
  );
}
