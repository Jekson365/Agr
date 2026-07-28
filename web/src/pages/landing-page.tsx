import { useEffect, useRef, useState, type CSSProperties, type RefObject, type SVGProps } from 'react';
import { Link } from 'react-router-dom';

import farmland from '@/assets/farmland-wide.png';
import logo from '@/assets/logo.png';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  HARVEST_FEATURES,
  MANAGE_CARDS,
  MARKET_CATEGORIES,
  MARKET_SAMPLES,
  PACKET_ROWS,
  PLAN_PACKETS,
  PREVIEW_BARS,
  PREVIEW_ICONS,
  REPORT_FEATURES,
  REPORT_SHARES,
  type LandingPacket,
} from '@/config/landing';
import { useAuth } from '@/contexts/auth-context';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import './landing-page.css';

/* ------------------------------------------------------------------ icons */
/* Line icons for the abstract claims (benefits, checkmarks, chrome). Anything that names a real
   part of the app uses its own illustrated asset instead — see @/config/landing. */

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon width="18" height="18" {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

/* Store badges — used only by the commented-out mobile section.

function AndroidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 11a6 6 0 0 1 12 0v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7Z" />
      <path d="m7.5 5.5 1.6 2.2M16.5 5.5l-1.6 2.2" />
      <path d="M10 11h.01M14 11h.01" />
    </Icon>
  );
}

function AppleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M16 12.6c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.5 2 1-.1 1.4-.6 2.6-.6s1.5.6 2.6.6 1.7-1 2.4-1.9c.7-1.1 1-2.1 1-2.2-.1 0-2.1-.8-2.1-3.2Z" />
      <path d="M14 5.5c.6-.7.9-1.7.8-2.5-.8 0-1.8.5-2.4 1.2-.5.6-1 1.6-.8 2.5.9.1 1.8-.4 2.4-1.2Z" />
    </Icon>
  );
}

*/

/** Opens the login screen on its register tab — every "start free" link means "sign me up". */
const SIGN_UP_STATE = { mode: 'register' as const };

/* ------------------------------------------------------------------ hooks */

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Fades blocks in as they scroll into view. Everything marked `data-reveal` starts hidden in CSS,
 * so a visitor with reduced motion (or without IntersectionObserver) gets it all revealed at once
 * rather than a blank page.
 */
function useReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

/** Adds a solid background to the header once the hero has scrolled under it. */
function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrolled;
}

/* --------------------------------------------------------------- fragments */

function SectionHead({
  eyebrow,
  title,
  lead,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'left' ? 'landing-head landing-head-left' : 'landing-head'} data-reveal>
      <p className="landing-eyebrow">{eyebrow}</p>
      <h2 className="landing-h2">{title}</h2>
      {lead && <p className="landing-lead">{lead}</p>}
    </div>
  );
}

/** Row of illustrated icon + title + body, used by the split sections. */
function FeatureRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <li className="landing-feature-row">
      <span className="landing-feature-icon">
        <img src={icon} alt="" loading="lazy" decoding="async" />
      </span>
      <span>
        <strong className="landing-feature-title">{title}</strong>
        <span className="landing-feature-body">{body}</span>
      </span>
    </li>
  );
}

const PREVIEW_NAV = [
  { icon: PREVIEW_ICONS.farm, labelKey: 'dashboard.myFarm' },
  { icon: PREVIEW_ICONS.harvest, labelKey: 'dashboard.harvest' },
  { icon: PREVIEW_ICONS.livestock, labelKey: 'farm.livestock' },
  { icon: PREVIEW_ICONS.greenhouse, labelKey: 'farm.greenhouse' },
  { icon: PREVIEW_ICONS.market, labelKey: 'dashboard.marketplace' },
  { icon: PREVIEW_ICONS.report, labelKey: 'dashboard.report' },
];

const PREVIEW_TILES = [
  { icon: PREVIEW_ICONS.land, labelKey: 'farm.land' },
  { icon: PREVIEW_ICONS.plants, labelKey: 'farm.plantStock' },
  { icon: PREVIEW_ICONS.fruits, labelKey: 'farm.fruits' },
  { icon: PREVIEW_ICONS.livestock, labelKey: 'farm.livestock' },
  { icon: PREVIEW_ICONS.harvest, labelKey: 'dashboard.harvest' },
  { icon: PREVIEW_ICONS.balance, labelKey: 'farm.balance' },
];

/** A mocked-up window of the real dashboard: sidebar, greeting, quick access, harvest revenue. */
function AppPreview() {
  const { t } = useLanguage();

  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-chrome">
        <span className="preview-dot" />
        <span className="preview-dot" />
        <span className="preview-dot" />
        <span className="preview-address">{t('auth.appName')}</span>
      </div>

      <div className="preview-body">
        <div className="preview-side">
          <div className="preview-side-brand">
            <img src={logo} alt="" />
            <span>{t('auth.appName')}</span>
          </div>
          {PREVIEW_NAV.map((item, index) => (
            <div key={item.labelKey} className={index === 0 ? 'preview-side-link is-active' : 'preview-side-link'}>
              <img src={item.icon} alt="" />
              <span>{t(item.labelKey)}</span>
            </div>
          ))}
        </div>

        <div className="preview-main">
          <p className="preview-greeting">{t('landing.preview.greeting')}</p>

          <div className="preview-stats">
            <div className="preview-stat">
              <span className="preview-stat-label">{t('landing.preview.statYield')}</span>
              <span className="preview-stat-value">{t('landing.preview.statYieldValue')}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">{t('landing.preview.statHarvests')}</span>
              <span className="preview-stat-value">{t('landing.preview.statHarvestsValue')}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">{t('landing.preview.statNet')}</span>
              <span className="preview-stat-value preview-stat-accent">{t('landing.preview.statNetValue')}</span>
            </div>
          </div>

          <p className="preview-label">{t('dashboard.quickAccess')}</p>
          <div className="preview-tiles">
            {PREVIEW_TILES.map((tile) => (
              <div key={tile.labelKey} className="preview-tile">
                <span className="preview-tile-icon">
                  <img src={tile.icon} alt="" />
                </span>
                <span className="preview-tile-label">{t(tile.labelKey)}</span>
              </div>
            ))}
          </div>

          <div className="preview-card">
            <div className="preview-card-head">
              <span className="preview-card-title">{t('report.harvestRevenueTitle')}</span>
              <span className="preview-card-sub">{t('landing.preview.chartSubtitle')}</span>
            </div>
            <div className="preview-chart">
              {PREVIEW_BARS.map((height, index) => (
                <span
                  key={index}
                  className={index === PREVIEW_BARS.length - 2 ? 'preview-bar is-peak' : 'preview-bar'}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* The phone mock and its data — used only by the commented-out mobile section.

const PHONE_TILES = [
  { icon: PREVIEW_ICONS.land, labelKey: 'farm.land' },
  { icon: PREVIEW_ICONS.livestock, labelKey: 'farm.livestock' },
  { icon: PREVIEW_ICONS.harvest, labelKey: 'dashboard.harvest' },
  { icon: PREVIEW_ICONS.market, labelKey: 'dashboard.marketplace' },
];

const PHONE_TABS = [
  { icon: PREVIEW_ICONS.farm, labelKey: 'tabs.home' },
  { icon: PREVIEW_ICONS.harvest, labelKey: 'dashboard.harvest' },
  { icon: PREVIEW_ICONS.market, labelKey: 'tabs.market' },
  { icon: PREVIEW_ICONS.calendar, labelKey: 'dashboard.calendar' },
];

The mobile app, mocked in the same way — same records, smaller screen.

function PhonePreview() {
  const { t } = useLanguage();

  return (
    <div className="phone" aria-hidden="true">
      <span className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-top">
          <img src={logo} alt="" />
          <span>{t('auth.appName')}</span>
        </div>
        <p className="phone-greeting">{t('landing.preview.greeting')}</p>

        <div className="phone-tiles">
          {PHONE_TILES.map((tile) => (
            <div key={tile.labelKey} className="phone-tile">
              <img src={tile.icon} alt="" loading="lazy" decoding="async" />
              <span>{t(tile.labelKey)}</span>
            </div>
          ))}
        </div>

        <div className="phone-card">
          <span className="phone-card-title">{t('landing.preview.phoneToday')}</span>
          <span className="phone-card-row">
            <span className="phone-card-dot" />
            {t('dashboard.harvest')}
          </span>
          <span className="phone-card-row">
            <span className="phone-card-dot phone-card-dot-amber" />
            {t('dashboard.calendar')}
          </span>
        </div>

        <div className="phone-tabs">
          {PHONE_TABS.map((tab, index) => (
            <span key={tab.labelKey} className={index === 0 ? 'phone-tab is-active' : 'phone-tab'}>
              <img src={tab.icon} alt="" loading="lazy" decoding="async" />
              <span>{t(tab.labelKey)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

*/

/** One packet card: name, price, the caps it allows and a link into sign-up. */
function PacketCard({ packet, index }: { packet: LandingPacket; index: number }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  /* A cap reads as a plain number, a number with its period, a size, or included/not — whichever
     the row asked for. `null` always means the plan lifts the cap entirely. */
  const capLabel = (row: (typeof PACKET_ROWS)[number]) => {
    const value = packet.limits[row.id];
    if (row.kind === 'boolean') {
      return t(value ? 'profile.limitIncluded' : 'profile.limitNotIncluded');
    }
    if (value === null) return t('profile.limitUnlimited');
    if (row.kind === 'storage') return `${value} MB`;
    if (row.kind === 'perDay') return `${value} ${t('landing.packets.perDay')}`;
    return String(value);
  };

  return (
    <article
      className={packet.featured ? 'landing-card landing-packet is-featured' : 'landing-card landing-packet'}
      data-reveal
      style={{ '--reveal-delay': `${index * 80}ms` } as CSSProperties}
    >
      {packet.featured && <span className="landing-packet-badge">{t('landing.packets.badge')}</span>}

      <h3 className="landing-packet-name">{t(packet.nameKey)}</h3>
      <p className="landing-packet-tagline">{t(`landing.packets.${packet.id}.tagline`)}</p>

      <p className="landing-packet-price">
        <span className="landing-packet-amount">{formatPrice(packet.price)}</span>
        {/* A free plan has no billing period to name. */}
        {packet.price > 0 && <span className="landing-packet-period">{t('landing.packets.perMonth')}</span>}
      </p>

      <dl className="landing-packet-rows">
        {PACKET_ROWS.map((row) => {
          const off = row.kind === 'boolean' && !packet.limits[row.id];
          return (
            <div key={row.id} className="landing-packet-row">
              <dt>{t(row.labelKey)}</dt>
              <dd className={off ? 'landing-packet-off' : undefined}>{capLabel(row)}</dd>
            </div>
          );
        })}
      </dl>

      <Link
        to="/login"
        state={SIGN_UP_STATE}
        className={
          packet.featured ? 'landing-btn landing-btn-primary' : 'landing-btn landing-btn-outline'
        }
      >
        {t(packet.price === 0 ? 'landing.nav.startFree' : 'landing.packets.cta')}
      </Link>
    </article>
  );
}

/** Planned against actual for three crops — the comparison the harvest detail page draws. */
const HARVEST_ROWS = [
  { labelKey: 'landing.harvest.sampleTomato', planned: 1200, actual: 1340 },
  { labelKey: 'landing.harvest.sampleCucumber', planned: 800, actual: 742 },
  { labelKey: 'landing.harvest.sampleCabbage', planned: 400, actual: 455 },
];

function HarvestPanel() {
  const { t } = useLanguage();
  const max = Math.max(...HARVEST_ROWS.flatMap((row) => [row.planned, row.actual]));

  return (
    <div className="landing-panel" aria-hidden="true">
      <div className="landing-panel-head">
        <span className="landing-panel-title">{t('harvest.comparisonTitle')}</span>
        <span className="landing-panel-legend">
          <span className="landing-legend-item">
            <span className="landing-legend-dot landing-legend-dot-planned" />
            {t('harvest.comparisonPlanned')}
          </span>
          <span className="landing-legend-item">
            <span className="landing-legend-dot" />
            {t('harvest.comparisonActual')}
          </span>
        </span>
      </div>

      {HARVEST_ROWS.map((row) => {
        const variance = Math.round(((row.actual - row.planned) / row.planned) * 100);
        return (
          <div key={row.labelKey} className="landing-panel-row">
            <div className="landing-panel-row-head">
              <span className="landing-panel-row-name">{t(row.labelKey)}</span>
              <span className="landing-panel-row-figures">
                {row.actual.toLocaleString()} / {row.planned.toLocaleString()} {t('farm.unitKg')}
                <span className={variance < 0 ? 'landing-chip landing-chip-warn' : 'landing-chip'}>
                  {variance > 0 ? '+' : ''}
                  {variance}%
                </span>
              </span>
            </div>
            <div className="landing-panel-track">
              <span className="landing-panel-fill-planned" style={{ width: `${(row.planned / max) * 100}%` }} />
              <span className="landing-panel-fill-actual" style={{ width: `${(row.actual / max) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Revenue split by farming category, as the reports page draws it. */
function ReportDonut() {
  const { t } = useLanguage();
  const labels: Record<string, string> = {
    crop: t('report.categoryCrop'),
    fruit: t('report.categoryFruit'),
    livestock: t('report.categoryLivestock'),
  };

  let cursor = 0;
  const stops = REPORT_SHARES.map((slice) => {
    const from = cursor;
    cursor += slice.share;
    return `${slice.color} ${from}% ${cursor}%`;
  }).join(', ');
  const leading = REPORT_SHARES[0];

  return (
    <div className="landing-panel landing-donut-panel" aria-hidden="true">
      <span className="landing-panel-title">{t('landing.reports.chartTitle')}</span>
      <div className="landing-donut-wrap">
        <div className="landing-donut" style={{ background: `conic-gradient(${stops})` }}>
          <div className="landing-donut-hole">
            <span className="landing-donut-value">{leading.share}%</span>
            <span className="landing-donut-label">{labels[leading.id]}</span>
          </div>
        </div>
        <ul className="landing-donut-legend">
          {REPORT_SHARES.map((slice) => (
            <li key={slice.id}>
              <span className="landing-legend-dot" style={{ background: slice.color }} />
              <span className="landing-donut-legend-label">{labels[slice.id]}</span>
              <span className="landing-donut-legend-value">{slice.share}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- page */

export function LandingPage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled();

  useReveal(rootRef);

  /* `wide` links drop out below 1100px, where the bar runs out of room before the nav collapses
     into the burger menu entirely. */
  const navLinks = [
    { href: '#packets', label: t('landing.nav.packets') },
    { href: '#features', label: t('landing.nav.features') },
    { href: '#harvest', label: t('dashboard.harvest') },
    { href: '#marketplace', label: t('landing.nav.marketplace'), wide: true },
    { href: '#reports', label: t('landing.nav.reports'), wide: true },
    // { href: '#mobile', label: t('landing.nav.mobile'), wide: true },
  ];

  return (
    <div className="landing-page" ref={rootRef}>
      <header className={scrolled ? 'landing-header is-scrolled' : 'landing-header'}>
        <div className="landing-container landing-header-inner">
          <a href="#hero" className="landing-brand">
            <img src={logo} alt="" />
            <span>{t('auth.appName')}</span>
          </a>

          <nav className="landing-nav">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={link.wide ? 'landing-nav-link is-wide' : 'landing-nav-link'}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="landing-header-actions">
            <ThemeToggle />
            <LanguageToggle />
            {isAuthenticated ? (
              <Link to="/" className="landing-btn landing-btn-primary landing-btn-sm">
                {t('landing.nav.openApp')}
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn landing-btn-ghost landing-btn-sm landing-login-link">
                  {t('landing.nav.login')}
                </Link>
                <Link to="/login" state={SIGN_UP_STATE} className="landing-btn landing-btn-primary landing-btn-sm">
                  {t('landing.nav.startFree')}
                </Link>
              </>
            )}
            <button
              type="button"
              className="landing-menu-btn"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="landing-menu">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            {!isAuthenticated && (
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                {t('landing.nav.login')}
              </Link>
            )}
          </nav>
        )}
      </header>

      <main>
        {/* 1 — Hero */}
        <section id="hero" className="landing-hero">
          <img src={farmland} className="landing-hero-bg" alt="" />
          <span className="landing-hero-scrim" />

          <div className="landing-container">
            <p className="landing-hero-badge" data-reveal>
              <span className="landing-hero-badge-dot" />
              {t('landing.hero.badge')}
            </p>
            <h1 className="landing-hero-title" data-reveal>
              {t('landing.hero.title')}
            </h1>
            <p className="landing-hero-text" data-reveal>
              {t('landing.hero.subtitle')}
            </p>

            <div className="landing-hero-actions" data-reveal>
              <Link to="/login" state={SIGN_UP_STATE} className="landing-btn landing-btn-primary landing-btn-lg">
                {t('landing.hero.ctaPrimary')}
                <ArrowIcon />
              </Link>
              <a href="#features" className="landing-btn landing-btn-glass landing-btn-lg">
                {t('landing.hero.ctaSecondary')}
              </a>
            </div>

            <p className="landing-hero-note" data-reveal>
              {t('landing.hero.note')}
            </p>

            <ul className="landing-hero-trust" data-reveal>
              <li>
                <CheckIcon width={16} height={16} /> {t('landing.hero.trust1')}
              </li>
              <li>
                <CheckIcon width={16} height={16} /> {t('landing.hero.trust2')}
              </li>
              <li>
                <CheckIcon width={16} height={16} /> {t('landing.hero.trust3')}
              </li>
            </ul>

            <div className="landing-hero-preview" data-reveal>
              <AppPreview />
            </div>
          </div>
        </section>

        {/* 2 — Available packets. Sits directly under the hero, so it carries the extra top
            padding the overlapping preview card needs. */}
        <section id="packets" className="landing-section landing-after-hero landing-alt">
          <div className="landing-container">
            <SectionHead
              eyebrow={t('landing.packets.eyebrow')}
              title={t('landing.packets.title')}
              lead={t('landing.packets.subtitle')}
            />

            <div className="landing-packets">
              {PLAN_PACKETS.map((packet, index) => (
                <PacketCard key={packet.id} packet={packet} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* 3 — Everything you can manage */}
        <section id="features" className="landing-section">
          <div className="landing-container">
            <SectionHead
              eyebrow={t('landing.manage.eyebrow')}
              title={t('landing.manage.title')}
              lead={t('landing.manage.subtitle')}
            />

            <div className="landing-manage-rows">
              {MANAGE_CARDS.map((card, index) => (
                <article
                  key={card.id}
                  className="landing-card landing-manage-row"
                  /* Copy always comes first in the DOM (the icon is decorative); every other row
                     swaps the two columns so the section reads text — icon, icon — text, … */
                  data-layout={index % 2 === 0 ? 'text-first' : 'icon-first'}
                  data-reveal
                  style={{ '--reveal-delay': `${index * 80}ms` } as CSSProperties}
                >
                  <div className="landing-manage-copy">
                    <h3 className="landing-card-title">{t(`landing.manage.${card.id}.title`)}</h3>
                    <p className="landing-card-body">{t(`landing.manage.${card.id}.body`)}</p>
                    <ul className="landing-points">
                      {Array.from({ length: card.points }, (_, i) => (
                        <li key={i}>
                          <CheckIcon width={16} height={16} />
                          {t(`landing.manage.${card.id}.point${i + 1}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className="landing-card-icon">
                    <img src={card.icon} alt="" loading="lazy" decoding="async" />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — Harvest management */}
        <section id="harvest" className="landing-section landing-alt">
          <div className="landing-container landing-split">
            <div className="landing-split-copy">
              <SectionHead
                eyebrow={t('landing.harvest.eyebrow')}
                title={t('landing.harvest.title')}
                lead={t('landing.harvest.subtitle')}
                align="left"
              />
              <ul className="landing-feature-list" data-reveal>
                {HARVEST_FEATURES.map((feature) => (
                  <FeatureRow
                    key={feature.id}
                    icon={feature.icon}
                    title={t(`landing.harvest.${feature.id}.title`)}
                    body={t(`landing.harvest.${feature.id}.body`)}
                  />
                ))}
              </ul>
            </div>
            <div className="landing-split-visual" data-reveal>
              <HarvestPanel />
            </div>
          </div>
        </section>

        {/* 5 — Marketplace */}
        <section id="marketplace" className="landing-section">
          <div className="landing-container landing-split landing-split-reverse">
            <div className="landing-split-copy">
              <SectionHead
                eyebrow={t('landing.market.eyebrow')}
                title={t('landing.market.title')}
                lead={t('landing.market.subtitle')}
                align="left"
              />
              <div className="landing-market-grid" data-reveal>
                {MARKET_CATEGORIES.map((category) => (
                  <div key={category.id} className="landing-market-card">
                    <span className="landing-market-icon">
                      <img src={category.icon} alt="" loading="lazy" decoding="async" />
                    </span>
                    <strong>{t(`landing.market.${category.id}.title`)}</strong>
                    <span>{t(`landing.market.${category.id}.body`)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-split-visual" data-reveal>
              <div className="landing-listings" aria-hidden="true">
                {MARKET_SAMPLES.map((sample) => (
                  <div key={sample.id} className="landing-listing">
                    <span className="landing-listing-image">
                      <img src={sample.icon} alt="" loading="lazy" decoding="async" />
                    </span>
                    <span className="landing-listing-body">
                      <span className="landing-listing-title">{t(`landing.market.${sample.id}.title`)}</span>
                      <span className="landing-listing-price">
                        {formatPrice(sample.price)} / {t(`landing.market.${sample.id}.unit`)}
                      </span>
                      <span className="landing-listing-meta">{t(`landing.market.${sample.id}.location`)}</span>
                    </span>
                    <span className="landing-listing-badge">
                      {sample.id === 'tractor' ? t('market.typeRent') : t('market.typeSale')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6 — Reporting & analytics */}
        <section id="reports" className="landing-section landing-alt">
          <div className="landing-container landing-split">
            <div className="landing-split-copy">
              <SectionHead
                eyebrow={t('landing.reports.eyebrow')}
                title={t('landing.reports.title')}
                lead={t('landing.reports.subtitle')}
                align="left"
              />
              <ul className="landing-feature-list" data-reveal>
                {REPORT_FEATURES.map((feature) => (
                  <FeatureRow
                    key={feature.id}
                    icon={feature.icon}
                    title={t(`landing.reports.${feature.id}.title`)}
                    body={t(`landing.reports.${feature.id}.body`)}
                  />
                ))}
              </ul>
            </div>
            <div className="landing-split-visual" data-reveal>
              <ReportDonut />
            </div>
          </div>
        </section>

        {/* 7 — Mobile app — commented out until the store listings are live. Restoring it means
            bringing back PhonePreview, PHONE_TILES, PHONE_TABS, AndroidIcon and AppleIcon above,
            plus the #mobile links in the nav and the footer.

        <section id="mobile" className="landing-section">
          <div className="landing-container landing-split landing-split-reverse">
            <div className="landing-split-copy">
              <SectionHead
                eyebrow={t('landing.mobile.eyebrow')}
                title={t('landing.mobile.title')}
                lead={t('landing.mobile.subtitle')}
                align="left"
              />
              <ul className="landing-feature-list" data-reveal>
                <FeatureRow
                  icon={PREVIEW_ICONS.scanner}
                  title={t('landing.mobile.android.title')}
                  body={t('landing.mobile.android.body')}
                />
                <FeatureRow
                  icon={PREVIEW_ICONS.harvest}
                  title={t('landing.mobile.offline.title')}
                  body={t('landing.mobile.offline.body')}
                />
                <FeatureRow
                  icon={PREVIEW_ICONS.report}
                  title={t('landing.mobile.sync.title')}
                  body={t('landing.mobile.sync.body')}
                />
              </ul>

              Store badges are static until the listings are live — wire them to the store URLs.
              <div className="landing-stores" data-reveal>
                <span className="landing-store">
                  <AndroidIcon />
                  {t('landing.mobile.storeAndroid')}
                </span>
                <span className="landing-store">
                  <AppleIcon />
                  {t('landing.mobile.storeIos')}
                </span>
              </div>
            </div>

            <div className="landing-split-visual landing-phone-wrap" data-reveal>
              <PhonePreview />
            </div>
          </div>
        </section>

        */}

        {/* 8 — Final call to action */}
        <section className="landing-final">
          <img src={farmland} className="landing-final-bg" alt="" />
          <span className="landing-final-scrim" />
          <div className="landing-container" data-reveal>
            <h2 className="landing-final-title">{t('landing.cta.title')}</h2>
            <p className="landing-final-text">{t('landing.cta.subtitle')}</p>
            <div className="landing-hero-actions">
              <Link to="/login" state={SIGN_UP_STATE} className="landing-btn landing-btn-primary landing-btn-lg">
                {t('landing.cta.button')}
                <ArrowIcon />
              </Link>
            </div>
            <p className="landing-hero-note">{t('landing.cta.note')}</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <a href="#hero" className="landing-brand">
              <img src={logo} alt="" />
              <span>{t('auth.appName')}</span>
            </a>
            <p>{t('auth.tagline')}</p>
          </div>

          <div className="landing-footer-col">
            <h4>{t('landing.footer.product')}</h4>
            <a href="#packets">{t('landing.nav.packets')}</a>
            <a href="#features">{t('landing.nav.features')}</a>
            <a href="#harvest">{t('dashboard.harvest')}</a>
            <a href="#marketplace">{t('landing.nav.marketplace')}</a>
            <a href="#reports">{t('landing.nav.reports')}</a>
          </div>

          <div className="landing-footer-col">
            <h4>{t('landing.footer.account')}</h4>
            <Link to="/login">{t('landing.nav.login')}</Link>
            <Link to="/login" state={SIGN_UP_STATE}>
              {t('landing.nav.startFree')}
            </Link>
            {/* <a href="#mobile">{t('landing.nav.mobile')}</a> */}
          </div>
        </div>

        <div className="landing-container landing-footer-bottom">
          <span>
            © {new Date().getFullYear()} {t('auth.appName')}. {t('landing.footer.rights')}
          </span>
        </div>
      </footer>
    </div>
  );
}
