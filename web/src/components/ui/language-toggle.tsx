import { useLanguage } from '@/contexts/language-context';
import './language-toggle.css';

export function LanguageToggle() {
  const { languageLabel, toggleLanguage } = useLanguage();

  return (
    <button type="button" className="language-toggle" onClick={toggleLanguage} aria-label="Change language">
      {languageLabel}
    </button>
  );
}
