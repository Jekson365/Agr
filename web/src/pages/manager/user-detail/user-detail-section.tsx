import { useLanguage } from '@/contexts/language-context';
import './user-detail-items.css';

export type DetailItem = {
  key: string;
  image: string;
  title: string;
  subtitle: string;
  value: string;
  removed: boolean;
};

type Props = {
  title: string;
  items: DetailItem[];
};

export function UserDetailSection({ title, items }: Props) {
  const { t } = useLanguage();
  const live = items.filter((item) => !item.removed).length;

  return (
    <section className="user-detail-card">
      <h2 className="user-detail-title">
        {title}
        <span className="user-detail-count">{live}</span>
      </h2>

      {items.length === 0 ? (
        <p className="user-detail-empty">{t('managerUser.empty')}</p>
      ) : (
        <ul className="user-detail-list">
          {items.map((item) => (
            <li key={item.key} className={item.removed ? 'user-detail-item removed' : 'user-detail-item'}>
              <img className="user-detail-icon" src={item.image} alt="" />
              <div className="user-detail-item-text">
                <span className="user-detail-item-title">{item.title}</span>
                {item.subtitle && <span className="manager-user-sub">{item.subtitle}</span>}
              </div>
              <span className="user-detail-item-value">{item.value}</span>
              {item.removed && <span className="user-detail-removed">{t('managerUser.removed')}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
