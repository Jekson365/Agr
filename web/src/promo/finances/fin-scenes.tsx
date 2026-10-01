import { FinancePost } from '@/promo/finances/fin-post';
import { FIN_OUTRO } from '@/promo/finances/fin-timeline';
import { OutroScene } from '@/promo/outro-scene';

const SQUARE = new URLSearchParams(window.location.search).get('format') === 'square';

export function FinancesScenes() {
  return (
    <>
      <FinancePost square={SQUARE} />
      <OutroScene start={FIN_OUTRO} />
    </>
  );
}
