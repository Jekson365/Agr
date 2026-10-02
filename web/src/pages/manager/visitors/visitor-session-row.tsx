import { formatLocalizedIsoDateTime } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { VisitSession } from '@/types/visit';
import { VisitFlag } from './visit-flag';
import { deviceLabel, formatDuration, placeLabel, sourceLabel } from './visit-labels';
import { VisitorSessionDetails } from './visitor-session-details';

type Props = {
  session: VisitSession;
  open: boolean;
  onToggle: () => void;
  onVisitor: (visitorId: string) => void;
};

export function VisitorSessionRow({ session, open, onToggle, onVisitor }: Props) {
  const { t, language } = useLanguage();

  const browser = [session.browser, session.browserVersion].filter(Boolean).join(' ');
  const system = [[session.os, session.osVersion].filter(Boolean).join(' '), deviceLabel(session.device, t)]
    .filter(Boolean)
    .join(' · ');
  const returning = session.visitorSessions > 1;

  return (
    <>
      <tr
        className={open ? 'visitors-row open' : 'visitors-row'}
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        <td className="visitors-nowrap">{formatLocalizedIsoDateTime(session.startedAt, language)}</td>
        <td>
          <span className="visitors-place">
            <VisitFlag code={session.countryCode} />
            {placeLabel(session.city, session.countryCode, session.country, language, t)}
          </span>
        </td>
        <td>
          <div className="visitors-mono">{session.ip || '—'}</div>
          <div className="manager-user-sub">{session.isp}</div>
        </td>
        <td>
          <div>{browser || t('visitors.unknown')}</div>
          <div className="manager-user-sub">{system}</div>
        </td>
        <td>{sourceLabel(session.source, t)}</td>
        <td className="numeric">
          <div>{session.pageViews}</div>
          <div className="manager-user-sub">{formatDuration(session.startedAt, session.endedAt)}</div>
        </td>
        <td>
          {session.userId ? (
            <>
              <div className="visitors-user">{session.userName || session.userContact || `#${session.userId}`}</div>
              <div className="manager-user-sub">{session.userContact}</div>
            </>
          ) : (
            <div>{t('visitors.guest')}</div>
          )}
          <span className={returning ? 'visitors-badge returning' : 'visitors-badge'}>
            {returning ? t('visitors.returningVisitor', { count: session.visitorSessions }) : t('visitors.newVisitor')}
          </span>
        </td>
      </tr>
      {open && (
        <tr className="visitors-detail-row">
          <td colSpan={7}>
            <VisitorSessionDetails session={session} onVisitor={onVisitor} />
          </td>
        </tr>
      )}
    </>
  );
}
