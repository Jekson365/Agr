import type { ReactNode } from 'react';

import { formatLocalizedIsoDateTime } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { VisitSession } from '@/types/visit';
import { deviceLabel, formatClock, formatDuration, sourceLabel } from './visit-labels';

type Props = {
  session: VisitSession;
  onVisitor: (visitorId: string) => void;
};

type Fact = {
  key: string;
  label: string;
  value: ReactNode;
};

function dimensions(width: number, height: number): string {
  return width > 0 && height > 0 ? `${width} × ${height}` : '';
}

function mapLink(latitude: number | null, longitude: number | null): ReactNode {
  if (latitude == null || longitude == null) return '';
  const lat = latitude.toFixed(4);
  const lng = longitude.toFixed(4);
  return (
    <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=11/${lat}/${lng}`} target="_blank" rel="noreferrer">
      {lat}, {lng}
    </a>
  );
}

export function VisitorSessionDetails({ session, onVisitor }: Props) {
  const { t, language } = useLanguage();

  const facts: Fact[] = [
    { key: 'visitor', label: t('visitors.visitorId'), value: <span className="visitors-mono">{session.visitorId}</span> },
    { key: 'firstSeen', label: t('visitors.firstSeen'), value: formatLocalizedIsoDateTime(session.visitorFirstSeen, language) },
    { key: 'visits', label: t('visitors.visitCount'), value: session.visitorSessions },
    {
      key: 'user',
      label: t('visitors.user'),
      value: session.userId ? [session.userName, session.userContact].filter(Boolean).join(' · ') : t('visitors.guest'),
    },
    { key: 'ip', label: t('visitors.ip'), value: <span className="visitors-mono">{session.ip}</span> },
    { key: 'isp', label: t('visitors.isp'), value: session.isp },
    { key: 'region', label: t('visitors.region'), value: session.region },
    { key: 'coordinates', label: t('visitors.coordinates'), value: mapLink(session.latitude, session.longitude) },
    { key: 'browser', label: t('visitors.browser'), value: [session.browser, session.browserVersion].filter(Boolean).join(' ') },
    { key: 'os', label: t('visitors.os'), value: [session.os, session.osVersion].filter(Boolean).join(' ') },
    { key: 'device', label: t('visitors.device'), value: deviceLabel(session.device, t) },
    { key: 'screen', label: t('visitors.screen'), value: dimensions(session.screenWidth, session.screenHeight) },
    { key: 'viewport', label: t('visitors.viewport'), value: dimensions(session.viewportWidth, session.viewportHeight) },
    { key: 'language', label: t('visitors.language'), value: session.language },
    { key: 'timeZone', label: t('visitors.timeZone'), value: session.timeZone },
    { key: 'source', label: t('visitors.source'), value: sourceLabel(session.source, t) },
    { key: 'referrer', label: t('visitors.referrer'), value: session.referrer },
    {
      key: 'campaign',
      label: t('visitors.campaign'),
      value: [session.utmSource, session.utmMedium, session.utmCampaign].filter(Boolean).join(' / '),
    },
    { key: 'duration', label: t('visitors.duration'), value: formatDuration(session.startedAt, session.endedAt) },
  ];

  return (
    <div className="visitors-details">
      <dl className="visitors-facts">
        {facts
          .filter((fact) => fact.value !== '' && fact.value != null)
          .map((fact) => (
            <div key={fact.key} className="visitors-fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
      </dl>

      <div className="visitors-ua">
        <span>{t('visitors.userAgent')}</span>
        <code>{session.userAgent || '—'}</code>
      </div>

      <div className="visitors-steps">
        <h3>{t('visitors.path')}</h3>
        <ol>
          {session.steps.map((step, index) => (
            <li key={`${step.at}-${index}`}>
              <span className="visitors-mono">{formatClock(step.at)}</span>
              <span>{step.path}</span>
            </li>
          ))}
        </ol>
      </div>

      {session.visitorSessions > 1 && (
        <button type="button" className="retry-button" onClick={() => onVisitor(session.visitorId)}>
          {t('visitors.showVisitor')}
        </button>
      )}
    </div>
  );
}
