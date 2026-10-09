import farmland from '@/assets/farmland-wide.png';
import logo from '@/assets/logo.png';
import { copy, LANGUAGE } from '@/promo/locale';
import { EN_COVER } from '@/social/copy/en';
import { KA_COVER } from '@/social/copy/ka';
import type { PostSlug } from '@/social/copy/post-copy';
import { Title } from '@/social/post-frame';
import { SOCIAL_POSTS } from '@/social/posts';
import '@/social/social.css';
import '@/social/social-cover.css';

const COVER = LANGUAGE === 'en' ? EN_COVER : KA_COVER;
const AREAS: PostSlug[] = ['crops', 'livestock', 'orchard', 'winery'];
const CHIPS = AREAS.flatMap((slug) => SOCIAL_POSTS.filter((post) => post.slug === slug));

export function CoverFrame() {
  return (
    <article className="social-post social-cover">
      <img className="social-cover-land" src={farmland} alt="" />
      <span className="social-cover-shade" />

      <div className="social-cover-card">
        <span className="social-brand">
          <span className="social-brand-badge">
            <img src={logo} alt="" />
          </span>
          {copy.auth.appName}
        </span>
        <Title text={COVER.title} accent={COVER.accent} />
        <ul className="social-cover-areas">
          {CHIPS.map((chip) => (
            <li key={chip.slug} className="social-eyebrow">
              <img src={chip.icon} alt="" />
              {chip.eyebrow}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
