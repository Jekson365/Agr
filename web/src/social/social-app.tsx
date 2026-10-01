import { LANGUAGE } from '@/promo/locale';
import { CoverFrame } from '@/social/cover-frame';
import { COVER_SIZE, SOCIAL_FORMATS, type SocialFormat } from '@/social/formats';
import { PostFrame } from '@/social/post-frame';
import { SOCIAL_POSTS } from '@/social/posts';
import '@/social/social-app.css';

function readSelection() {
  const params = new URLSearchParams(window.location.search);
  const post = SOCIAL_POSTS.find((item) => item.slug === params.get('post'));
  const format: SocialFormat = params.get('format') === 'square' ? 'square' : 'portrait';
  return { post, format, cover: params.get('format') === 'cover' };
}

export function SocialApp() {
  const { post, format, cover } = readSelection();

  if (cover || post) {
    return <div className="social-single">{post ? <PostFrame post={post} format={format} /> : <CoverFrame />}</div>;
  }

  return (
    <div className="social-gallery">
      <section className="social-gallery-row">
        <h2>
          {COVER_SIZE.width}×{COVER_SIZE.height}
        </h2>
        <a className="social-gallery-cover" href={`?lang=${LANGUAGE}&format=cover`}>
          <CoverFrame />
        </a>
      </section>
      {(Object.keys(SOCIAL_FORMATS) as SocialFormat[]).map((kind) => (
        <section key={kind} className="social-gallery-row">
          <h2>
            {SOCIAL_FORMATS[kind].width}×{SOCIAL_FORMATS[kind].height}
          </h2>
          <div className="social-gallery-grid">
            {SOCIAL_POSTS.map((item) => (
              <a
                key={item.slug}
                className="social-gallery-item"
                href={`?lang=${LANGUAGE}&post=${item.slug}&format=${kind}`}
              >
                <PostFrame post={item} format={kind} />
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
