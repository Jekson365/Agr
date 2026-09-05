import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import mascotImage from '@/assets/mascot-intro.png';

import { LanguageToggle } from '@/components/ui/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { meatProductionTypeName } from '@/config/production';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { homePathFor } from '@/routes/home-path';
import { OnboardingActions } from './onboarding-actions';
import { OnboardingDone } from './onboarding-done';
import { emptyDraft, isStepReady, type OnboardingDraft } from './onboarding-draft';
import { OnboardingProgress } from './onboarding-progress';
import {
  activeFarms,
  markOnboardingDone,
  ONBOARDING_STEP_TEXT_KEY,
  type OnboardingStepKey,
} from './onboarding-status';
import { emptyProgress, submitErrorKey, submitOnboarding, type SubmitProgress } from './onboarding-submit';
import { FarmProfileStep } from './steps/farm-profile-step';
import { LandStep } from './steps/land-step';
import { LivestockStep } from './steps/livestock-step';
import { StockStep } from './steps/stock-step';
import { OnboardingWelcome } from './onboarding-welcome';
import { useOnboardingStatus } from './use-onboarding-status';
import './onboarding-page.css';
import './onboarding-step.css';

export function OnboardingPage() {
  const { user, signOut, updateProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const check = useOnboardingStatus();

  const [todo, setTodo] = useState<OnboardingStepKey[] | null>(null);
  const [index, setIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(() => emptyDraft(null));
  const [existingFarmId, setExistingFarmId] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<SubmitProgress | null>(null);

  useEffect(() => {
    if (check.pending || todo !== null) return;
    if (check.unfinished.length === 0) {
      navigate(homePathFor(user), { replace: true });
      return;
    }
    const farmId = activeFarms(check.farms)[0]?.id ?? null;
    setTodo(check.unfinished);
    setIndex(0);
    setDraft(emptyDraft(user));
    setExistingFarmId(farmId);
    progressRef.current = emptyProgress(farmId);
  }, [check, todo, navigate, user]);

  if (todo === null) {
    return null;
  }

  const current = todo[index];
  const isLast = index === todo.length - 1;
  const hasFarm = existingFarmId != null || todo.includes('land');

  function goToStep(step: OnboardingStepKey) {
    const position = todo!.indexOf(step);
    if (position !== -1 && position <= reached && !saving) {
      setIndex(position);
    }
  }

  function goToApp() {
    navigate(homePathFor(user), { replace: true });
  }

  async function handleNext() {
    if (saving) return;
    if (!isLast) {
      const next = index + 1;
      setIndex(next);
      setReached((prev) => Math.max(prev, next));
      return;
    }

    if (!user || progressRef.current == null) return;
    setSaving(true);
    setError(null);
    try {
      await submitOnboarding({
        steps: todo!,
        draft,
        user,
        progress: progressRef.current,
        updateProfile,
        meatTypeName: (groupName) => meatProductionTypeName(groupName, t),
      });
      markOnboardingDone(user.id);
      setFinished(true);
    } catch (err) {
      setError(t(submitErrorKey(err)));
    } finally {
      setSaving(false);
    }
  }

  function renderStep(step: OnboardingStepKey) {
    switch (step) {
      case 'profile':
        return (
          <FarmProfileStep value={draft.profile} onChange={(profile) => setDraft({ ...draft, profile })} />
        );
      case 'land':
        return <LandStep value={draft.land} onChange={(land) => setDraft({ ...draft, land })} />;
      case 'stock':
        return <StockStep value={draft.stock} onChange={(stock) => setDraft({ ...draft, stock })} />;
      case 'livestock':
        return (
          <LivestockStep
            value={draft.livestock}
            hasFarm={hasFarm}
            onChange={(livestock) => setDraft({ ...draft, livestock })}
          />
        );
    }
  }

  return (
    <div className="onboarding-page">
      <header className="onboarding-topbar">
        <span className="onboarding-brand">{t('onboarding.title')}</span>
        <div className="onboarding-topbar-actions">
          <ThemeToggle />
          <LanguageToggle />
          <button type="button" className="onboarding-signout" onClick={signOut}>
            {t('profile.logout')}
          </button>
        </div>
      </header>

      <div className="onboarding-shell">
        <div className="onboarding-card">
          {!started ? (
            <OnboardingWelcome onStart={() => setStarted(true)} />
          ) : (
            <>
              {!finished && (
                <div className="onboarding-header">
                  <span className="onboarding-header-icon">
                    <img src={mascotImage} alt={t('onboarding.welcomeMascotAlt')} />
                  </span>
                  <div className="onboarding-header-text">
                    <span className="onboarding-counter">
                      {t('onboarding.stepCounter', { current: index + 1, total: todo.length })}
                    </span>
                    <p className="onboarding-subtitle">{t(ONBOARDING_STEP_TEXT_KEY[current])}</p>
                  </div>
                </div>
              )}

              <OnboardingProgress
                steps={check.steps}
                todo={todo}
                index={index}
                reached={reached}
                onSelect={goToStep}
              />

              <div className="onboarding-body">
                {finished ? <OnboardingDone onContinue={goToApp} /> : renderStep(current)}
              </div>

              {!finished && (
                <OnboardingActions
                  error={error}
                  saving={saving}
                  disabled={!isStepReady(current, draft, hasFarm)}
                  canGoBack={index > 0}
                  isLast={isLast}
                  onBack={() => setIndex(index - 1)}
                  onNext={handleNext}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
