import { moduleInfo } from '@/config/farm-modules';
import { useLanguage } from '@/contexts/language-context';
import type { AdminUser } from '@/types/admin';
import './manager-modules.css';

export function ManagerModulesCell({ user }: { user: AdminUser }) {
  const { t } = useLanguage();

  if (!user.hasManagementAccess) {
    return <span className="manager-user-sub">—</span>;
  }
  if (user.needsModuleChoice) {
    return <span className="manager-user-sub">{t('manager.modulesNotChosen')}</span>;
  }

  const modules = user.allowedModules.map(moduleInfo);

  return (
    <span className="manager-modules">
      {modules.map((entry) => (
        <img key={entry.module} src={entry.icon} alt={t(entry.labelKey)} title={t(entry.labelKey)} />
      ))}
      {modules.length === 1 && <span className="manager-user-sub">{t(modules[0].labelKey)}</span>}
    </span>
  );
}
