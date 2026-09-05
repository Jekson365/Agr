import { useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { Modal } from '@/components/ui/modal';
import { PAGE_HELP } from '@/config/page-help';
import { useLanguage } from '@/contexts/language-context';
import './guide-button.css';

/**
 * The question mark in the top bar: what this page is for and how to work it, in words.
 *
 * It is in the shell rather than on each page, so every route carries it in the same corner —
 * help that sits somewhere different on each screen is help nobody learns to reach for. Which
 * page it is describing comes from the route, through the same PAGE_HELP table the guide texts
 * are keyed by.
 */
export function GuideButton() {
  const location = useLocation();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const entry = PAGE_HELP.find(({ pattern }) => matchPath(pattern, location.pathname));

  // Never left open across a navigation: the text would be describing the page just left.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (!entry) return null;

  /* One key per page, its steps separated by newlines. A missing key renders as the key itself
     (there is no fallback language), which is what says "this page has no steps written yet" —
     the summary above them is always there. */
  const stepsKey = `guide.${entry.key}Body`;
  const stepsText = t(stepsKey);
  const steps = stepsText === stepsKey ? [] : stepsText.split('\n').filter((line) => line.trim() !== '');

  return (
    <>
      <button
        type="button"
        className="guide-button"
        onClick={() => setOpen(true)}
        aria-label={t('guide.open')}
        title={t('guide.open')}
      >
        ?
      </button>

      <Modal open={open} onClose={() => setOpen(false)} className="guide-modal">
        <h2 className="form-title">{t('help.heading')}</h2>

        <p className="guide-summary">{t(`help.${entry.key}`)}</p>

        {steps.length > 0 && (
          <>
            <h3 className="guide-steps-title">{t('guide.stepsTitle')}</h3>
            <ol className="guide-steps">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
            {t('common.close')}
          </button>
        </div>
      </Modal>
    </>
  );
}
