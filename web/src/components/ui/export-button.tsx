import { NavLink } from 'react-router-dom';

import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import './export-button.css';

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M12 11v6" />
      <path d="m9.5 14.5 2.5 2.5 2.5-2.5" />
    </svg>
  );
}

export function ExportButton() {
  const { t } = useLanguage();
  const { user } = useAuth();

  if (user?.hasManagementAccess === false) return null;

  const label = t('export.button');

  return (
    <NavLink
      to="/export"
      className={({ isActive }) => (isActive ? 'export-button active' : 'export-button')}
      aria-label={label}
      title={label}
    >
      <ExportIcon />
    </NavLink>
  );
}
