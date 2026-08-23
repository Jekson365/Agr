import { useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { GUIDE_VIDEO } from '@/config/guide-videos';
import { useLanguage } from '@/contexts/language-context';
import './guide-video-button.css';

type Props = {
  /**
   * Which walkthrough to play — a key of {@link GUIDE_VIDEO}. The same key names its title under
   * `guide.<key>`, so putting one on a new page is a video, a translation and this one prop.
   */
  guide: string;
};

/**
 * A question mark beside a page's own action, playing the walkthrough for it.
 *
 * The button is always there — help that appears and disappears with whether a file has been
 * recorded is help nobody learns to look for. A guide not yet recorded says so when opened, which
 * is a smaller surprise than a control that is missing on some pages and not others.
 */
export function GuideVideoButton({ guide }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const src = GUIDE_VIDEO[guide];
  const title = t(`guide.${guide}`);

  /* One key per guide, its steps separated by newlines. A missing key renders as the key itself
     (there is no fallback language), which is exactly what says "this guide has no text yet". */
  const bodyKey = `guide.${guide}Body`;
  const body = t(bodyKey);
  const steps = body === bodyKey ? [] : body.split('\n').filter((line) => line.trim() !== '');

  return (
    <>
      <button
        type="button"
        className="guide-video-button"
        onClick={() => setOpen(true)}
        aria-label={t('guide.watch', { name: title })}
        title={t('guide.watch', { name: title })}
      >
        ?
      </button>

      <Modal open={open} onClose={() => setOpen(false)} size="wide" className="guide-video-modal">
        <h2 className="form-title">{title}</h2>
        <div className={steps.length > 0 ? 'guide-video-layout' : 'guide-video-layout alone'}>
          {/* Controls and nothing else: no autoplay, since a video that starts talking on its own
              is a surprise, and no loop, since a walkthrough has an end. */}
          {src ? (
            <video className="guide-video" src={src} controls playsInline preload="metadata" />
          ) : (
            <p className="guide-video-missing">{t('guide.notRecorded')}</p>
          )}

          {steps.length > 0 && (
            <ol className="guide-video-steps">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
            {t('common.close')}
          </button>
        </div>
      </Modal>
    </>
  );
}
