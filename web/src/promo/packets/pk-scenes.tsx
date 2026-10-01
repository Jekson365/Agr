import { CaptionBand } from '@/promo/harvest/cycle-captions';
import { OutroScene } from '@/promo/outro-scene';
import { PacketCards } from '@/promo/packets/pk-cards';
import { PACKET_CAPTIONS } from '@/promo/packets/pk-copy';
import { CAPTION_STARTS, PACKETS_OUTRO } from '@/promo/packets/pk-timeline';
import { StageBackground } from '@/promo/stage-background';
import '@/promo/harvest/cycle.css';

export function PacketsScenes() {
  return (
    <>
      <StageBackground />
      <CaptionBand captions={PACKET_CAPTIONS} starts={CAPTION_STARTS} end={PACKETS_OUTRO} />
      <PacketCards />
      <OutroScene start={PACKETS_OUTRO} />
    </>
  );
}
