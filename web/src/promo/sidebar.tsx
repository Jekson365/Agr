import logo from '@/assets/logo.png';
import { copy } from '@/promo/locale';
import { easeInOut, easeOut, enter, mix, slideIn } from '@/promo/motion';
import { activeIndex, NAV_ITEMS } from '@/promo/nav';
import {
  clickTime,
  NAV_HEIGHT,
  navIndent,
  NAV_STEP,
  NAV_TOP,
  SIDEBAR_WIDTH,
  STAGE_IN,
} from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

function Ripple({ index }: { index: number }) {
  const time = useClock();
  const click = clickTime(index);
  if (time < click || time > click + 0.55) return null;
  const grow = enter(time, click, 0.55, easeOut);
  const size = mix(20, 150, grow);

  return (
    <span
      className="promo-side-ripple"
      style={{
        width: size,
        height: size,
        left: 96 + navIndent(index) - size / 2,
        top: NAV_TOP + index * NAV_STEP + NAV_HEIGHT / 2 - size / 2,
        opacity: 0.32 * (1 - grow),
      }}
    />
  );
}

export function Sidebar() {
  const time = useClock();
  const active = activeIndex(time);
  const moved = active === 0 ? 1 : enter(time, clickTime(active), 0.32, easeInOut);
  const pillIndex = mix(Math.max(active - 1, 0), active, moved);
  const base = STAGE_IN + 0.3;

  return (
    <div className="promo-side" style={{ width: SIDEBAR_WIDTH }}>
      <div className="promo-side-brand" style={slideIn(time, base, -20, 0.45)}>
        <img src={logo} alt="" />
        <span>{copy.auth.appName}</span>
      </div>

      <span
        className="promo-side-pill"
        style={{
          top: NAV_TOP + pillIndex * NAV_STEP,
          left: 14 + mix(navIndent(Math.max(active - 1, 0)), navIndent(active), moved),
          height: NAV_HEIGHT,
          opacity: enter(time, base + 0.2, 0.3),
        }}
      />

      {NAV_ITEMS.map((item, index) => (
        <div
          key={item.label}
          className={index === active ? 'promo-side-link is-active' : 'promo-side-link'}
          style={{
            top: NAV_TOP + index * NAV_STEP,
            left: 14 + navIndent(index),
            height: NAV_HEIGHT,
            ...slideIn(time, base + 0.08 + index * 0.05, -24, 0.45),
          }}
        >
          <img src={item.icon} alt="" />
          <span>{item.label}</span>
        </div>
      ))}

      {NAV_ITEMS.map((item, index) => (index === 0 ? null : <Ripple key={item.label} index={index} />))}
    </div>
  );
}
