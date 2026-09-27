import { wave } from '@/promo/motion';
import { useClock } from '@/promo/use-clock';

export function StageBackground() {
  const time = useClock();

  return (
    <div className="promo-bg">
      <span
        className="promo-bg-blob is-green"
        style={{ transform: `translate(${wave(time, 9, 50)}px, ${wave(time, 11, 36, 2)}px)` }}
      />
      <span
        className="promo-bg-blob is-amber"
        style={{ transform: `translate(${wave(time, 10, -44, 1)}px, ${wave(time, 8, 30)}px)` }}
      />
      <span className="promo-bg-dots" style={{ backgroundPosition: `${time * 6}px ${time * 3}px` }} />
    </div>
  );
}
