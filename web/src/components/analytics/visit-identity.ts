import type { VisitInput } from '@/types/visit';

const VISITOR_KEY = 'farm.visit.visitor';
const SESSION_KEY = 'farm.visit.session';
const SESSION_IDLE_MS = 30 * 60 * 1000;

type Attribution = Pick<VisitInput, 'referrer' | 'utmSource' | 'utmMedium' | 'utmCampaign'>;

type StoredSession = Attribution & { id: string; at: number };

const NO_ATTRIBUTION: Attribution = { referrer: '', utmSource: '', utmMedium: '', utmCampaign: '' };

let memoryVisitor: string | null = null;
let memorySession: StoredSession | null = null;
let firstView = true;

function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function parseSession(raw: string | null): StoredSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as StoredSession;
    return typeof value.id === 'string' && typeof value.at === 'number' ? value : null;
  } catch {
    return null;
  }
}

function externalReferrer(): string {
  try {
    const referrer = document.referrer;
    return referrer && new URL(referrer).origin !== window.location.origin ? referrer : '';
  } catch {
    return '';
  }
}

function landingAttribution(): Attribution {
  if (!firstView) return NO_ATTRIBUTION;
  const params = new URLSearchParams(window.location.search);
  const clickSource = params.has('fbclid') ? 'facebook' : params.has('gclid') ? 'google' : '';
  return {
    referrer: externalReferrer(),
    utmSource: params.get('utm_source') ?? clickSource,
    utmMedium: params.get('utm_medium') ?? '',
    utmCampaign: params.get('utm_campaign') ?? '',
  };
}

function currentVisitor(): string {
  const id = readStorage(VISITOR_KEY) ?? memoryVisitor ?? randomId();
  memoryVisitor = id;
  writeStorage(VISITOR_KEY, id);
  return id;
}

function currentSession(): StoredSession {
  const now = Date.now();
  const stored = parseSession(readStorage(SESSION_KEY)) ?? memorySession;
  const session =
    stored && now - stored.at < SESSION_IDLE_MS
      ? { ...stored, at: now }
      : { ...landingAttribution(), id: randomId(), at: now };
  memorySession = session;
  writeStorage(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function buildVisit(path: string): VisitInput {
  const session = currentSession();
  firstView = false;
  return {
    visitorId: currentVisitor(),
    sessionId: session.id,
    path,
    referrer: session.referrer,
    utmSource: session.utmSource,
    utmMedium: session.utmMedium,
    utmCampaign: session.utmCampaign,
    language: navigator.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    touchPoints: navigator.maxTouchPoints,
    webdriver: navigator.webdriver === true,
  };
}
