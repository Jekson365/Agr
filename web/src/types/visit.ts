export type VisitDevice = 'Desktop' | 'Mobile' | 'Tablet' | 'Bot';

export type VisitBucketUnit = 'Hour' | 'Day' | 'Week' | 'Month';

export type VisitInput = {
  visitorId: string;
  sessionId: string;
  path: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  language: string;
  timeZone: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  touchPoints: number;
  webdriver: boolean;
};

export type VisitFilter = {
  days: number;
  includeBots: boolean;
  search?: string;
  visitorId?: string;
};

export type VisitBucket = {
  start: string;
  views: number;
  visitors: number;
};

export type VisitCount = {
  key: string;
  detail: string;
  visitors: number;
  views: number;
};

export type VisitPoint = {
  latitude: number;
  longitude: number;
  city: string;
  countryCode: string;
  visitors: number;
};

export type VisitSummary = {
  pageViews: number;
  visitors: number;
  sessions: number;
  returningVisitors: number;
  signedInUsers: number;
  bots: number;
  unit: VisitBucketUnit;
  buckets: VisitBucket[];
  countries: VisitCount[];
  cities: VisitCount[];
  pages: VisitCount[];
  sources: VisitCount[];
  browsers: VisitCount[];
  systems: VisitCount[];
  devices: VisitCount[];
  points: VisitPoint[];
};

export type VisitStep = {
  path: string;
  at: string;
};

export type VisitSession = {
  sessionId: string;
  visitorId: string;
  startedAt: string;
  endedAt: string;
  pageViews: number;
  userId: number | null;
  userName: string;
  userContact: string;
  ip: string;
  countryCode: string;
  country: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isp: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: VisitDevice;
  userAgent: string;
  language: string;
  timeZone: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  source: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  visitorFirstSeen: string;
  visitorSessions: number;
  steps: VisitStep[];
};

export type VisitSessionList = {
  items: VisitSession[];
  total: number;
  page: number;
  pageSize: number;
};
