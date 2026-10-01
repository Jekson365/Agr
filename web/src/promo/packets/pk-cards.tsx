import { PACKET_ROWS, PLAN_PACKETS, type LandingPacket } from '@/config/landing';
import { tr } from '@/promo/locale';
import { backOut, easeInOut, easeOut, enter, mix } from '@/promo/motion';
import {
  BADGE_AT,
  CARD_ZOOM,
  CARDS_BOX,
  CARDS_IN,
  focusIndex,
  PACKETS_OUTRO,
  PRICE_DELAY,
  ROW_STEP,
  ROWS_DELAY,
} from '@/promo/packets/pk-timeline';
import { useClock } from '@/promo/use-clock';
import '@/components/farm/packets-modal.css';
import '@/promo/packets/pk.css';

type Focus = { lift: number; dim: number; since: number | null };

function capLabel(packet: LandingPacket, row: (typeof PACKET_ROWS)[number]): string {
  const value = packet.limits[row.id];
  if (row.kind === 'boolean') return tr(value ? 'profile.limitIncluded' : 'profile.limitNotIncluded');
  if (value === null) return tr('profile.limitUnlimited');
  if (row.kind === 'storage') return `${value} MB`;
  if (row.kind === 'perDay') return `${value} ${tr('landing.packets.perDay')}`;
  return String(value);
}

function focusFor(time: number, index: number): Focus {
  const focus = focusIndex(time);
  if (!focus) return { lift: 0, dim: 0, since: null };
  const p = enter(time, focus.since, 0.45, easeInOut);
  return focus.index === index ? { lift: p, dim: 0, since: focus.since } : { lift: 0, dim: p, since: null };
}

function bump(time: number, start: number): number {
  return 1 + 0.22 * Math.sin(Math.PI * enter(time, start, 0.38, easeOut));
}

function Card({ packet, index, time }: { packet: LandingPacket; index: number; time: number }) {
  const start = CARDS_IN[index];
  const rise = enter(time, start, 0.7, easeOut);
  const price = enter(time, start + PRICE_DELAY, 0.9, easeOut);
  const badge = enter(time, BADGE_AT, 0.5, backOut);
  const { lift, dim, since } = focusFor(time, index);
  const shine = since == null ? 0 : enter(time, since + 0.05, 0.8, easeInOut);

  return (
    <article
      className={packet.featured ? 'packet-card pk-card is-featured' : 'packet-card pk-card'}
      style={{
        opacity: Math.min(1, rise * 1.4) * mix(1, 0.42, dim),
        transform: `translateY(${mix(90, 0, rise) - 14 * lift}px) scale(${mix(0.92, 1, rise) * mix(1, 1.05, lift) * mix(1, 0.96, dim)})`,
        boxShadow: `0 0 0 ${3 * lift}px var(--color-green), 0 ${mix(14, 34, lift)}px ${mix(30, 60, lift)}px var(--color-shadow-strong)`,
      }}
    >
      {shine > 0 && shine < 1 && (
        <span className="pk-shine" style={{ transform: `translateX(${mix(-130, 260, shine)}%) skewX(-18deg)` }} />
      )}

      <div className="packet-head">
        <h3 className="packet-name">{tr(packet.nameKey)}</h3>
        {packet.featured && (
          <span className="packet-badge" style={{ opacity: Math.min(1, badge * 1.5), transform: `scale(${mix(0.3, 1, badge)})` }}>
            {tr('landing.packets.badge')}
          </span>
        )}
      </div>
      <p className="packet-tagline">{tr(`landing.packets.${packet.id}.tagline`)}</p>
      <p className="packet-price">
        <span className="packet-amount" style={since == null ? undefined : { transform: `scale(${bump(time, since)})` }}>
          ₾{Math.round(packet.price * price)}
        </span>
        {packet.price > 0 && <span className="packet-period">{tr('landing.packets.perMonth')}</span>}
      </p>
      <dl className="packet-rows">
        {PACKET_ROWS.map((row, rowIndex) => {
          const shown = enter(time, start + ROWS_DELAY + rowIndex * ROW_STEP, 0.4, easeOut);
          const off = row.kind === 'boolean' && !packet.limits[row.id];
          const pop = since == null ? 1 : bump(time, since + 0.12 + rowIndex * 0.07);
          return (
            <div key={row.id} className="packet-row" style={{ opacity: shown, transform: `translateX(${mix(-18, 0, shown)}px)` }}>
              <dt>{tr(row.labelKey)}</dt>
              <dd className={off ? 'packet-off' : undefined} style={{ transform: `scale(${pop})` }}>
                {capLabel(packet, row)}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}

export function PacketCards() {
  const time = useClock();
  const leave = enter(time, PACKETS_OUTRO + 0.1, 0.4);

  return (
    <div
      className="pk-stage"
      style={{
        left: CARDS_BOX.x,
        top: CARDS_BOX.y,
        width: CARDS_BOX.width,
        opacity: 1 - leave,
        visibility: leave < 1 ? 'visible' : 'hidden',
      }}
    >
      <div className="packets-grid" style={{ zoom: CARD_ZOOM }}>
        {PLAN_PACKETS.map((packet, index) => (
          <Card key={packet.id} packet={packet} index={index} time={time} />
        ))}
      </div>
    </div>
  );
}
