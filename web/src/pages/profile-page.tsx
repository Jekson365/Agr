import { useEffect } from 'react';

import '@/components/farm/farm-crud.css';
import { ProfileForm } from '@/components/profile/profile-form';
import { ProfileSummaryCard } from '@/components/profile/profile-summary-card';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import './profile-page.css';

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-fill">
      <div className="page-fill-header">
        <div className="page-header">
          <h1 className="page-title">{t('profile.title')}</h1>
        </div>
      </div>

      <div className="page-fill-scroll">
        <div className="profile-layout">
          <ProfileSummaryCard />
          <ProfileForm />
        </div>
      </div>
    </div>
  );
}
