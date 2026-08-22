import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject, type SVGProps } from 'react';
import { Link } from 'react-router-dom';

import farmland from '@/assets/farmland-wide.webp';
import logo from '@/assets/logo.png';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  FAQ_ITEMS,
  HARVEST_FEATURES,
  MANAGE_CARDS,
  MAP_FEATURES,
  MAP_FIELDS,
  MAP_SAMPLE_CROPS,
  MAP_VIEWBOX,
  MARKET_CATEGORIES,
  MARKET_SAMPLES,
  // PACKET_ROWS,
  // PLAN_PACKETS,
  PREVIEW_BARS,
  PREVIEW_GREENHOUSE,
  PREVIEW_ICONS,
  PREVIEW_LIVESTOCK,
  REPORT_FEATURES,
  REPORT_SHARES,
  SEO_KEYWORDS,
  // type LandingPacket,
} from '@/config/landing';
import { useAuth } from '@/contexts/auth-context';
import { useCurrency } from '@/contexts/currency-context';
import { LANGUAGES, useLanguage, type Language } from '@/contexts/language-context';
import { homePathFor } from '@/routes/home-path';
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

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon width="18" height="18" {...props}>
      <path d="m6 9 6 6 6-6" />
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

/* --------------------------------------------------------------------- seo */

/**
 * Where the site is served from. Structured data and the canonical need absolute URLs and neither
 * may follow whichever host the bundle happens to run on, so the origin is written out rather than
 * read from `location` — kept in step with the canonical in index.html.
 */
const SITE_URL = 'https://mtabari.com.ge';

/**
 * Keeps the head in step with the language the page is actually being read in.
 *
 * index.html ships the Georgian tags statically, so a crawler that never runs the bundle still
 * reads a complete head. This only rewrites what is already there — appending would leave a second
 * copy of a tag index.html owns, and a page with two descriptions has none — so someone reading in
 * English gets an English tab title, snippet and link preview instead of the Georgian default.
 *
 * Nothing is restored on unmount: these values are the document's defaults, and every other route
 * is behind sign-in with nothing of its own to say.
 */
const OG_LOCALES: Record<Language, string> = { ka: 'ka_GE', en: 'en_US', de: 'de_DE' };

/** The languages the page can be read in, for the structured data. Taken from the picker rather
 *  than written out, so a fourth one is added in the one place it is already added. */
const CONTENT_LANGUAGES = LANGUAGES.map((option) => option.code);

function useLandingSeo() {
  const { t, language } = useLanguage();

  useEffect(() => {
    const title = t('landing.seo.title');
    const description = t('landing.seo.description');
    /* Link previews get the shorter line — Facebook and X cut a description off around 200
       characters, and a sentence that ends mid-word reads worse than a shorter whole one. */
    const shareDescription = t('landing.seo.shareDescription');
    const locale = OG_LOCALES[language];
    /* index.html carries a single alternate tag, so only one of the other two locales fits. */
    const alternate = Object.values(OG_LOCALES).find((value) => value !== locale) ?? locale;

    document.title = title;

    const set = (selector: string, content: string) => {
      document.head.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content);
    };

    set('meta[name="description"]', description);
    set('meta[property="og:title"]', title);
    set('meta[property="og:description"]', shareDescription);
    set('meta[property="og:locale"]', locale);
    set('meta[property="og:locale:alternate"]', alternate);
    set('meta[name="twitter:title"]', title);
    set('meta[name="twitter:description"]', shareDescription);
  }, [t, language]);
}

/**
 * What the page says about itself to a machine: the company behind it, the site, the product, and
 * the questions the FAQ section answers. Search engines and the answer engines that read schema.org
 * would otherwise have to infer all of it from the markup.
 *
 * The priced offers went out with the packets section below: a price marked up for a machine has to
 * be one the visitor can also read on the page, and pricing a plan the page no longer prints is
 * exactly what Google penalises. Restoring the section restores them — they are built from the same
 * `PLAN_PACKETS` the cards render from, so the two cannot drift. They are stated in GEL because that
 * is what `PLAN_PACKETS` holds; the currency toggle is a display conversion and must not reach the
 * markup. (Those figures are still the placeholders flagged in config/landing.ts. Correcting them
 * there corrects this too.)
 */
function useStructuredData(): string {
  const { t } = useLanguage();

  return useMemo(() => {
    const name = t('auth.appName');
    const description = t('landing.seo.description');
    const organization = `${SITE_URL}/#organization`;

    /* Escaping the angle bracket at the end: a `</script>` that found its way into the copy would
       otherwise close the tag early and spill the rest of the graph into the page as text. */
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': organization,
          name,
          url: `${SITE_URL}/`,
          description: t('auth.tagline'),
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo.png`,
            width: 512,
            height: 512,
          },
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          name,
          url: `${SITE_URL}/`,
          description,
          inLanguage: CONTENT_LANGUAGES,
          keywords: SEO_KEYWORDS,
          publisher: { '@id': organization },
        },
        {
          '@type': 'SoftwareApplication',
          '@id': `${SITE_URL}/#app`,
          name,
          url: `${SITE_URL}/`,
          description,
          applicationCategory: 'BusinessApplication',
          /* Machine-facing taxonomy rather than the badge's marketing line: this is the phrase a
             search engine matches the product against. */
          applicationSubCategory: 'Farm Management Software',
          operatingSystem: 'Web',
          inLanguage: CONTENT_LANGUAGES,
          keywords: SEO_KEYWORDS,
          publisher: { '@id': organization },
          featureList: MANAGE_CARDS.map((card) => t(`landing.manage.${card.id}.title`)),
          /* offers: PLAN_PACKETS.map((packet) => ({
            '@type': 'Offer',
            name: t(packet.nameKey),
            description: t(`landing.packets.${packet.id}.tagline`),
            price: packet.price,
            priceCurrency: 'GEL',
            url: `${SITE_URL}/#packets`,
            availability: 'https://schema.org/InStock',
          })), */
        },
        /* The FAQ section spelled out for a machine. Google stopped drawing FAQ rich results for
           ordinary sites in 2023, so this earns no stars in the result — the visible section below
           is what does the ranking. It is here because the answer engines that summarise a page
           read this graph in preference to parsing the markup, and a question already paired with
           its answer is the one shape they can quote without guessing. Built from `FAQ_ITEMS`, the
           same array the section renders from, so the two cannot fall out of step — which matters
           more than usual here: marking up an answer the page does not show is what Google reads
           as an attempt to game it. */
        {
          '@type': 'FAQPage',
          '@id': `${SITE_URL}/#faq`,
          inLanguage: CONTENT_LANGUAGES,
          mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: t(`landing.faq.${item.id}.q`),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t(`landing.faq.${item.id}.a`),
            },
          })),
        },
      ],
    }).replace(/</g, '\\u003c');
  }, [t]);
}

/* --------------------------------------------------------------- fragments */

function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  align = 'center',
}: {
  /** The heading's own id, so the section around it can name itself with `aria-labelledby`. */
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'left' ? 'landing-head landing-head-left' : 'landing-head'} data-reveal>
      <p className="landing-eyebrow">{eyebrow}</p>
      <h2 className="landing-h2" id={id}>
        {title}
      </h2>
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
  { id: 'farm', icon: PREVIEW_ICONS.farm, labelKey: 'dashboard.myFarm' },
  { id: 'harvest', icon: PREVIEW_ICONS.harvest, labelKey: 'dashboard.harvest' },
  { id: 'livestock', icon: PREVIEW_ICONS.livestock, labelKey: 'farm.livestock' },
  { id: 'greenhouse', icon: PREVIEW_ICONS.greenhouse, labelKey: 'farm.greenhouse' },
  { id: 'market', icon: PREVIEW_ICONS.market, labelKey: 'dashboard.marketplace' },
  { id: 'report', icon: PREVIEW_ICONS.report, labelKey: 'dashboard.report' },
];

const PREVIEW_TILES = [
  { icon: PREVIEW_ICONS.land, labelKey: 'farm.land' },
  { icon: PREVIEW_ICONS.plants, labelKey: 'farm.plantStock' },
  { icon: PREVIEW_ICONS.fruits, labelKey: 'farm.fruits' },
  { icon: PREVIEW_ICONS.livestock, labelKey: 'farm.livestock' },
  { icon: PREVIEW_ICONS.harvest, labelKey: 'dashboard.harvest' },
  { icon: PREVIEW_ICONS.balance, labelKey: 'farm.balance' },
];

/** Planned against actual for three crops — the comparison the harvest detail page draws. */
const HARVEST_ROWS = [
  { labelKey: 'landing.harvest.sampleTomato', planned: 1200, actual: 1340 },
  { labelKey: 'landing.harvest.sampleCucumber', planned: 800, actual: 742 },
  { labelKey: 'landing.harvest.sampleCabbage', planned: 400, actual: 455 },
];

/** One record in a preview screen: what it is on the left, the figure that matters on the right. */
function PreviewRow({ icon, name, meta, value }: { icon: string; name: string; meta?: string; value: string }) {
  return (
    <div className="preview-row">
      <span className="preview-row-icon">
        <img src={icon} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="preview-row-name">
        {name}
        {meta && <span className="preview-row-meta">{meta}</span>}
      </span>
      <span className="preview-row-value">{value}</span>
    </div>
  );
}

/** The opening screen: the numbers for the season, the shortcuts, and what the harvests earned. */
function PreviewFarm() {
  const { t } = useLanguage();

  return (
    <>
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
              <img src={tile.icon} alt="" loading="lazy" decoding="async" />
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
    </>
  );
}

/** What was gathered against what was planned, the same comparison the section further down draws. */
function PreviewHarvest() {
  const { t } = useLanguage();
  const max = Math.max(...HARVEST_ROWS.flatMap((row) => [row.planned, row.actual]));

  return (
    <div className="preview-card">
      <div className="preview-card-head">
        <span className="preview-card-title">{t('harvest.comparisonTitle')}</span>
        <span className="preview-card-sub">{t('landing.preview.chartSubtitle')}</span>
      </div>

      {HARVEST_ROWS.map((row) => {
        const variance = Math.round(((row.actual - row.planned) / row.planned) * 100);
        return (
          <div key={row.labelKey} className="preview-line">
            <div className="preview-line-head">
              <span className="preview-line-name">{t(row.labelKey)}</span>
              <span className="preview-line-figures">
                {row.actual.toLocaleString()} / {row.planned.toLocaleString()} {t('farm.unitKg')}
                <span className={variance < 0 ? 'landing-chip landing-chip-warn' : 'landing-chip'}>
                  {variance > 0 ? '+' : ''}
                  {variance}%
                </span>
              </span>
            </div>
            <span className="preview-track">
              <span className="preview-track-planned" style={{ width: `${(row.planned / max) * 100}%` }} />
              <span className="preview-track-actual" style={{ width: `${(row.actual / max) * 100}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Every group and its headcount. */
function PreviewLivestock() {
  const { t } = useLanguage();

  return (
    <div className="preview-card">
      <div className="preview-card-head">
        <span className="preview-card-title">{t('landing.preview.livestockTitle')}</span>
      </div>
      {PREVIEW_LIVESTOCK.map((group) => (
        <PreviewRow
          key={group.id}
          icon={group.icon}
          name={t(group.nameKey)}
          value={`${group.count} ${t('landing.preview.unitHead')}`}
        />
      ))}
    </div>
  );
}

/** What is growing under cover, and where. */
function PreviewGreenhouse() {
  const { t } = useLanguage();

  return (
    <div className="preview-card">
      <div className="preview-card-head">
        <span className="preview-card-title">{t('landing.preview.greenhouseTitle')}</span>
      </div>
      {PREVIEW_GREENHOUSE.map((bed) => (
        <PreviewRow
          key={bed.id}
          icon={bed.icon}
          name={t(bed.nameKey)}
          meta={`${t('landing.preview.section')} ${bed.section}`}
          value={`${bed.sqm} ${t('landing.preview.unitSqm')}`}
        />
      ))}
    </div>
  );
}

/** The listings this farm has out, priced in the visitor's own currency. */
function PreviewMarket() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="preview-card">
      <div className="preview-card-head">
        <span className="preview-card-title">{t('landing.preview.marketTitle')}</span>
      </div>
      {MARKET_SAMPLES.map((sample) => (
        <PreviewRow
          key={sample.id}
          icon={sample.icon}
          name={t(`landing.market.${sample.id}.title`)}
          meta={t(`landing.market.${sample.id}.location`)}
          value={`${formatPrice(sample.price)} / ${t(`landing.market.${sample.id}.unit`)}`}
        />
      ))}
    </div>
  );
}

/** Where the money came from, as the reports screen splits it. */
function PreviewReport() {
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

  return (
    <div className="preview-card">
      <div className="preview-card-head">
        <span className="preview-card-title">{t('landing.reports.chartTitle')}</span>
        <span className="preview-card-sub">{t('landing.preview.chartSubtitle')}</span>
      </div>
      <div className="preview-split">
        <div className="preview-donut" style={{ background: `conic-gradient(${stops})` }}>
          <span className="preview-donut-hole" />
        </div>
        <ul className="preview-donut-legend">
          {REPORT_SHARES.map((slice) => (
            <li key={slice.id}>
              <span className="landing-legend-dot" style={{ background: slice.color }} />
              <span className="preview-donut-legend-label">{labels[slice.id]}</span>
              <span className="preview-donut-legend-value">{slice.share}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const PREVIEW_SCREENS = {
  farm: PreviewFarm,
  harvest: PreviewHarvest,
  livestock: PreviewLivestock,
  greenhouse: PreviewGreenhouse,
  market: PreviewMarket,
  report: PreviewReport,
};

/**
 * A mocked-up window of the real dashboard. Its sidebar works: picking a section swaps the screen
 * under it, which is as close as a visitor gets to the app before signing up. Everything in it is
 * invented — the point is the shape of each screen, not the numbers on it.
 */
function AppPreview() {
  const { t } = useLanguage();
  const [screen, setScreen] = useState(PREVIEW_NAV[0].id);
  const active = PREVIEW_NAV.find((item) => item.id === screen) ?? PREVIEW_NAV[0];

  return (
    <div className="preview">
      <div className="preview-chrome">
        <span className="preview-dot" />
        <span className="preview-dot" />
        <span className="preview-dot" />
        <span className="preview-address">{t('auth.appName')}</span>
      </div>

      <div className="preview-body">
        <div className="preview-side">
          <div className="preview-side-brand">
            <img src={logo} alt="" loading="lazy" decoding="async" />
            <span>{t('auth.appName')}</span>
          </div>
          {PREVIEW_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === screen ? 'preview-side-link is-active' : 'preview-side-link'}
              aria-pressed={item.id === screen}
              onClick={() => setScreen(item.id)}
            >
              <img src={item.icon} alt="" loading="lazy" decoding="async" />
              <span>{t(item.labelKey)}</span>
            </button>
          ))}
        </div>

        <div className="preview-main">
          {/* The dashboard greets you by name; every other screen is titled by what it holds. */}
          <p className="preview-greeting">
            {active.id === 'farm' ? t('landing.preview.greeting') : t(active.labelKey)}
          </p>

          {/* Every screen is laid out, all in the one grid cell, and all but the chosen one is
              hidden. The tallest of them is therefore always what the frame is sized to — switching
              screens cannot resize the hero, whatever the language or the width. */}
          <div className="preview-screens">
            {PREVIEW_NAV.map((item) => {
              const Screen = PREVIEW_SCREENS[item.id as keyof typeof PREVIEW_SCREENS];
              return (
                <div
                  key={item.id}
                  className={item.id === screen ? 'preview-screen is-shown' : 'preview-screen'}
                >
                  <Screen />
                </div>
              );
            })}
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

/* One packet card: name, price, the caps it allows and a link into sign-up. Used only by the
   commented-out packets section — restoring it means bringing back the PACKET_ROWS, PLAN_PACKETS and
   LandingPacket imports, and the offers in the structured data above.

function PacketCard({ packet, index }: { packet: LandingPacket; index: number }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  A cap reads as a plain number, a number with its period, a size, or included/not — whichever
  the row asked for. `null` always means the plan lifts the cap entirely.
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
        A free plan has no billing period to name.
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

*/

/** The same planned-against-actual comparison as the preview's harvest screen, at section size. */
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

/**
 * The neighbourhood map, as the app draws it: your own land in green, a neighbour's in amber, other
 * farmers' in blue, and the panel that opens on whichever field was picked. Held still — the point
 * is the colours and what a field tells you, not the panning.
 */
function MapPanel() {
  const { t } = useLanguage();
  const picked = MAP_FIELDS.find((field) => field.selected);

  return (
    <div className="landing-map" aria-hidden="true">
      <img src={farmland} className="landing-map-bg" alt="" loading="lazy" decoding="async" />
      <span className="landing-map-scrim" />

      <svg
        className="landing-map-shapes"
        viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
        /* The panel holds the same ratio, so the outlines keep their shape and the pins below —
           placed as percentages of the same box — stay on top of them. */
        preserveAspectRatio="none"
      >
        {MAP_FIELDS.map((field) => (
          <polygon
            key={field.id}
            points={field.points}
            className={
              field.selected ? `landing-map-shape is-${field.owner} is-selected` : `landing-map-shape is-${field.owner}`
            }
          />
        ))}
      </svg>

      {MAP_FIELDS.map((field) => (
        <span
          key={field.id}
          className="landing-map-marker"
          style={{
            left: `${(field.pin.x / MAP_VIEWBOX.width) * 100}%`,
            top: `${(field.pin.y / MAP_VIEWBOX.height) * 100}%`,
          }}
        >
          <span className={`landing-map-pin is-${field.owner}`}>{field.initial}</span>
          <span className="landing-map-pin-name">{t(field.nameKey)}</span>
        </span>
      ))}

      <div className="landing-map-layers">
        <span className="landing-map-layer is-active">{t('landTerritory.satellite')}</span>
        <span className="landing-map-layer">{t('landTerritory.street')}</span>
      </div>

      {picked && (
        <div className="landing-map-card">
          <span className="landing-map-avatar">{picked.initial}</span>
          <span className="landing-map-card-head">
            <span className="landing-map-card-name">{t(picked.nameKey)}</span>
            {/* The two things the map knows about a stranger that a name alone does not say. */}
            <span className="landing-map-card-meta">
              {t('landing.market.tomato.location')} · {t('neighbours.away', { distance: '1.2 km' })}
            </span>
          </span>
          <span className="landing-map-add">{t('neighbours.add')}</span>

          <span className="landing-map-crops">
            {MAP_SAMPLE_CROPS.map((crop) => (
              <span key={crop.id} className="landing-map-crop">
                <img src={crop.icon} alt="" loading="lazy" decoding="async" />
                <span className="landing-map-crop-name">{t(crop.nameKey)}</span>
                <span className="landing-map-crop-area">
                  {crop.area} {t('farm.areaUnit')}
                </span>
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- page */

export function LandingPage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isAuthenticated, user } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled();
  const structuredData = useStructuredData();

  useReveal(rootRef);
  useLandingSeo();

  /* `wide` links drop out below 1100px, where the bar runs out of room before the nav collapses
     into the burger menu entirely. */
  const navLinks = [
    // { href: '#packets', label: t('landing.nav.packets') },
    { href: '#features', label: t('landing.nav.features') },
    { href: '#harvest', label: t('dashboard.harvest') },
    { href: '#marketplace', label: t('landing.nav.marketplace'), wide: true },
    { href: '#reports', label: t('landing.nav.reports'), wide: true },
    { href: '#map', label: t('landing.nav.map'), wide: true },
    { href: '#faq', label: t('landing.nav.faq'), wide: true },
    // { href: '#mobile', label: t('landing.nav.mobile'), wide: true },
  ];

  return (
    <div className="landing-page" ref={rootRef}>
      {/* Read out of the DOM, so it does not matter that it sits in the body rather than the head —
          and it must stay a plain <script>, since React only hoists the async ones. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

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
              <Link to={homePathFor(user)} className="landing-btn landing-btn-primary landing-btn-sm">
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
        <section id="hero" className="landing-hero" aria-labelledby="hero-title">
          {/* The largest thing on the first screen, so it is what Google times the page by. React
              only renders it once the bundle has run, by which point the browser has long finished
              guessing what to fetch — the priority hint is what puts it back at the front. */}
          <img src={farmland} className="landing-hero-bg" alt="" fetchPriority="high" decoding="async" />
          <span className="landing-hero-scrim" />

          <div className="landing-container">
            <p className="landing-hero-badge" data-reveal>
              <span className="landing-hero-badge-dot" />
              {t('landing.hero.badge')}
            </p>
            <h1 className="landing-hero-title" id="hero-title" data-reveal>
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

        {/* 2 — Available packets — commented out. Restoring it means bringing back PacketCard and
            the PACKET_ROWS / PLAN_PACKETS / LandingPacket imports above, the offers in the
            structured data, and the #packets links in the nav and the footer — and moving
            `landing-after-hero` back off the section below, since this one would be under the hero
            again.

        <section
          id="packets"
          className="landing-section landing-after-hero landing-alt"
          aria-labelledby="packets-title"
        >
          <div className="landing-container">
            <SectionHead
              id="packets-title"
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

        */}

        {/* 3 — Everything you can manage. First section under the hero while the packets are out, so
            it carries the extra top padding the overlapping preview card needs. */}
        <section id="features" className="landing-section landing-after-hero" aria-labelledby="features-title">
          <div className="landing-container">
            <SectionHead
              id="features-title"
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
        <section id="harvest" className="landing-section landing-alt" aria-labelledby="harvest-title">
          <div className="landing-container landing-split">
            <div className="landing-split-copy">
              <SectionHead
                id="harvest-title"
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
        <section id="marketplace" className="landing-section" aria-labelledby="marketplace-title">
          <div className="landing-container landing-split landing-split-reverse">
            <div className="landing-split-copy">
              <SectionHead
                id="marketplace-title"
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
        <section id="reports" className="landing-section landing-alt" aria-labelledby="reports-title">
          <div className="landing-container landing-split">
            <div className="landing-split-copy">
              <SectionHead
                id="reports-title"
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

        {/* 7 — The neighbourhood map */}
        <section id="map" className="landing-section" aria-labelledby="map-title">
          <div className="landing-container landing-split landing-split-reverse">
            <div className="landing-split-copy">
              <SectionHead
                id="map-title"
                eyebrow={t('landing.map.eyebrow')}
                title={t('landing.map.title')}
                lead={t('landing.map.subtitle')}
                align="left"
              />
              <ul className="landing-feature-list" data-reveal>
                {MAP_FEATURES.map((feature) => (
                  <FeatureRow
                    key={feature.id}
                    icon={feature.icon}
                    title={t(`landing.map.${feature.id}.title`)}
                    body={t(`landing.map.${feature.id}.body`)}
                  />
                ))}
              </ul>
            </div>
            <div className="landing-split-visual" data-reveal>
              <MapPanel />
            </div>
          </div>
        </section>

        {/* 8 — Mobile app — commented out until the store listings are live. Restoring it means
            bringing back PhonePreview, PHONE_TILES, PHONE_TABS, AndroidIcon and AppleIcon above,
            plus the #mobile links in the nav and the footer.

        <section id="mobile" className="landing-section" aria-labelledby="mobile-title">
          <div className="landing-container landing-split landing-split-reverse">
            <div className="landing-split-copy">
              <SectionHead
                id="mobile-title"
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

        {/* 9 — Frequently asked questions.

            The only prose on the page written in the words a stranger types into Google rather
            than the words the product uses about itself — see the note over FAQ_ITEMS. Native
            <details> rather than a scripted accordion, for two reasons: a collapsed answer is
            still in the DOM, so a crawler reads all seven whether or not it opens them, and the
            section still works for a reader the bundle never reached (the page is baked at build
            time, so there is one). */}
        <section id="faq" className="landing-section landing-alt" aria-labelledby="faq-title">
          <div className="landing-container">
            <SectionHead
              id="faq-title"
              eyebrow={t('landing.faq.eyebrow')}
              title={t('landing.faq.title')}
              lead={t('landing.faq.subtitle')}
            />

            <div className="landing-faq">
              {FAQ_ITEMS.map((item, index) => (
                <details
                  key={item.id}
                  className="landing-faq-item"
                  /* The first answer is open on arrival, so the section reads as an answer rather
                     than as a stack of closed bars. */
                  open={index === 0}
                  data-reveal
                  style={{ '--reveal-delay': `${index * 60}ms` } as CSSProperties}
                >
                  <summary className="landing-faq-summary">
                    {/* h3 under the section's h2: the questions are the headings a search engine
                        matches the query against, so they are headings, not styled spans. */}
                    <h3 className="landing-faq-question">{t(`landing.faq.${item.id}.q`)}</h3>
                    <ChevronIcon className="landing-faq-chevron" />
                  </summary>
                  <p className="landing-faq-answer">{t(`landing.faq.${item.id}.a`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 10 — Final call to action */}
        <section className="landing-final" aria-labelledby="cta-title">
          {/* Same file as the hero's, but the browser has no way to know that until it resolves the
              URL — lazy keeps it off the critical path either way. */}
          <img src={farmland} className="landing-final-bg" alt="" loading="lazy" decoding="async" />
          <span className="landing-final-scrim" />
          <div className="landing-container" data-reveal>
            <h2 className="landing-final-title" id="cta-title">
              {t('landing.cta.title')}
            </h2>
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
              <img src={logo} alt="" loading="lazy" decoding="async" />
              <span>{t('auth.appName')}</span>
            </a>
            <p>{t('auth.tagline')}</p>
          </div>

          {/* h2, not h4: these sit at the top level of the footer, and a document whose outline
              jumps a level or two is read as one with sections missing. The size is the CSS's. */}
          <div className="landing-footer-col">
            <h2>{t('landing.footer.product')}</h2>
            {/* <a href="#packets">{t('landing.nav.packets')}</a> */}
            <a href="#features">{t('landing.nav.features')}</a>
            <a href="#harvest">{t('dashboard.harvest')}</a>
            <a href="#marketplace">{t('landing.nav.marketplace')}</a>
            <a href="#reports">{t('landing.nav.reports')}</a>
            <a href="#map">{t('landing.nav.map')}</a>
            <a href="#faq">{t('landing.nav.faq')}</a>
          </div>

          <div className="landing-footer-col">
            <h2>{t('landing.footer.account')}</h2>
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
