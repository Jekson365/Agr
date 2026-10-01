import cabbageIcon from '@/assets/goods/cabbage.png';
import cucumberIcon from '@/assets/goods/cucumber.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import logo from '@/assets/logo.png';
import { formatCount } from '@/promo/figures';
import { copy, LANGUAGE } from '@/promo/locale';
import { EN_PAPERWORK } from '@/social/copy/en';
import { KA_PAPERWORK } from '@/social/copy/ka';
import { ArrowIcon, CheckIcon, CrossIcon, MoonIcon, SunIcon } from '@/social/visuals/paperwork-icons';
import '@/social/visuals/cards.css';
import '@/social/visuals/paperwork-card.css';
import '@/social/visuals/paperwork-app.css';

const LABELS = LANGUAGE === 'en' ? EN_PAPERWORK : KA_PAPERWORK;

const ROWS = [
  { icon: tomatoIcon, name: copy.farm.stockTomato, amount: 1340, struck: '1320', scrawl: '1340' },
  { icon: cucumberIcon, name: copy.farm.stockCucumber, amount: 742, struck: '', scrawl: '742?' },
  { icon: cabbageIcon, name: copy.farm.stockCabbage, amount: 455, struck: '545', scrawl: '455' },
];

const TOTAL = ROWS.reduce((sum, row) => sum + row.amount, 0);

function PaperSide() {
  return (
    <div className="paperwork-panel is-paper">
      <span className="paperwork-label is-paper">
        <CrossIcon />
        {LABELS.paper}
      </span>

      <div className="paperwork-desk">
        <div className="paperwork-sheet">
          {ROWS.map((row) => (
            <span key={row.name} className="paperwork-scrawl">
              <img src={row.icon} alt="" />
              {row.struck && <s>{row.struck}</s>}
              {row.scrawl}
            </span>
          ))}
          <span className="paperwork-scrawl is-sum">Σ = ?</span>
          <span className="paperwork-stain" />
        </div>

        <div className="paperwork-excel">
          <span className="paperwork-excel-bar">
            <i>fx</i>=SUM(B1:B9)
          </span>
          <span className="paperwork-excel-grid">
            <b />
            <b>A</b>
            <b>B</b>
            <b>1</b>
            <span>1340</span>
            <span>742</span>
            <b>2</b>
            <span className="is-error">#REF!</span>
            <span className="is-error">#VALUE!</span>
          </span>
        </div>
      </div>

      <span className="paperwork-time is-night">
        <MoonIcon />
        {LABELS.paperTime}
      </span>
    </div>
  );
}

function AppSide() {
  return (
    <div className="paperwork-panel is-app">
      <span className="paperwork-label is-app">
        <img src={logo} alt="" />
        {copy.auth.appName}
      </span>

      <div className="paperwork-rows">
        {ROWS.map((row) => (
          <span key={row.name} className="paperwork-row">
            <img src={row.icon} alt="" />
            <strong>{row.name}</strong>
            <span>
              {formatCount(row.amount)} {copy.farm.unitKg}
            </span>
          </span>
        ))}
        <span className="paperwork-total">
          <span>{copy.landing.preview.statYield}</span>
          <strong>
            {formatCount(TOTAL)} {copy.farm.unitKg}
          </strong>
          <CheckIcon />
        </span>
      </div>

      <span className="paperwork-time is-day">
        <SunIcon />
        {LABELS.appTime}
      </span>
    </div>
  );
}

export function PaperworkCard() {
  return (
    <div className="social-card paperwork-card">
      <PaperSide />
      <span className="paperwork-arrow">
        <ArrowIcon />
      </span>
      <AppSide />
    </div>
  );
}
