import { OutroScene } from '@/promo/outro-scene';
import { WineryPost } from '@/promo/winery/wn-post';
import { WINERY_OUTRO } from '@/promo/winery/wn-timeline';

const SQUARE = new URLSearchParams(window.location.search).get('format') === 'square';

export function WineryScenes() {
  return (
    <>
      <WineryPost square={SQUARE} />
      <OutroScene start={WINERY_OUTRO} />
    </>
  );
}
