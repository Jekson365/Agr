import logo from '@/assets/logo.png';
import ka from '@/locales/ka.json';
import type { SocialFormat } from '@/social/formats';
import { MASCOTS } from '@/social/mascots';
import type { SocialPost } from '@/social/posts';
import '@/social/social.css';
import '@/social/social-footer.css';
import '@/social/social-mascots.css';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
      <circle cx="12" cy="12" r="12" className="social-check-disc" />
      <path d="m7 12.5 3.2 3.2L17 9" fill="none" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="social-check-mark" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function Title({ text, accent }: { text: string; accent: string }) {
  const at = text.indexOf(accent);
  if (at < 0) return <h1 className="social-title">{text}</h1>;
  return (
    <h1 className="social-title">
      {text.slice(0, at)}
      <em>{accent}</em>
      {text.slice(at + accent.length)}
    </h1>
  );
}

export function PostFrame({ post, format }: { post: SocialPost; format: SocialFormat }) {
  const { Visual, Backdrop } = post;
  const mascot = MASCOTS[post.mascot];
  const visual = (
    <div className="social-visual">
      <Visual />
      {post.sticker && <img className="social-sticker" src={post.sticker} alt="" />}
    </div>
  );

  return (
    <article className={`social-post is-${post.theme} is-${format} is-${post.slug}`}>
      <div className="social-backdrop">{Backdrop ? <Backdrop format={format} /> : <span className="social-dots" />}</div>

      <header className="social-top">
        <span className="social-brand">
          <span className="social-brand-badge">
            <img src={logo} alt="" />
          </span>
          {ka.auth.appName}
        </span>
        <span className="social-url">mtabari.com.ge</span>
      </header>

      <div className="social-copy">
        <span className="social-eyebrow">
          <img src={post.icon} alt="" />
          {post.eyebrow}
        </span>
        <Title text={post.title} accent={post.accent} />
        <p className="social-body">{post.body}</p>
      </div>

      {!post.lowVisual && visual}

      <footer className="social-footer">
        {post.lowVisual && visual}
        <ul className="social-points">
          {post.points.map((point) => (
            <li key={point}>
              <CheckIcon />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <span className="social-cta">
          {ka.landing.hero.ctaPrimary}
          <ArrowIcon />
        </span>
      </footer>

      <img className={`social-mascot ${mascot.className}`} src={mascot.src} alt="" />
    </article>
  );
}
