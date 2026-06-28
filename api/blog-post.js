const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

export default async function handler(req, res) {
  const { slug } = req.query

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=*`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  )
  const posts = await response.json()
  const post = posts[0]

  if (!post) {
    res.status(404).send(html404())
    return
  }

  res.setHeader('Content-Type', 'text/html')
  res.send(renderPost(post))
}

function renderPost(post) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(post.title)} | PT Pools Blog</title>
  <meta name="description" content="${esc(post.seo_description || '')}">
  <meta property="og:title" content="${esc(post.title)}">
  <meta property="og:description" content="${esc(post.seo_description || '')}">
  ${post.hero_image_url ? `<meta property="og:image" content="${esc(post.hero_image_url)}">` : ''}
  <meta property="og:url" content="https://ptpools.us/blog/${esc(post.slug)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root { --navy: #09244D; --teal: #1F8A8C; --orange: #FF6B35; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #061830; color: #fff; }
    /* NAV */
    .site-header { padding: 20px 40px; display: flex; align-items: center; gap: 40px; background: rgba(6,24,48,0.97); border-bottom: 1px solid rgba(31,138,140,0.15); }
    .site-header img { height: 60px; }
    nav { display: flex; align-items: center; gap: 28px; flex: 1; }
    nav a { color: rgba(255,255,255,0.65); font-size: 14px; text-decoration: none; letter-spacing: 0.5px; transition: color 0.2s; }
    nav a:hover, nav a.active { color: #fff; }
    .nav-cta { margin-left: auto; padding: 9px 20px; background: var(--orange); color: #fff !important; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.5px; }
    /* LAYOUT */
    .page-wrap { max-width: 1100px; margin: 48px auto; padding: 0 24px 100px; display: grid; grid-template-columns: 1fr 280px; gap: 48px; align-items: start; }
    /* ARTICLE */
    .hero-img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 16px; margin-bottom: 36px; }
    .post-title { font-family: 'Oswald', sans-serif; font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; line-height: 1.1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
    .post-date { color: var(--teal); font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 1px solid rgba(31,138,140,0.2); }
    .post-body { font-size: 1.02rem; line-height: 1.85; color: rgba(255,255,255,0.82); }
    .post-body h2 { font-family: 'Oswald', sans-serif; font-size: 1.5rem; font-weight: 700; text-transform: uppercase; color: #fff; margin: 40px 0 14px; }
    .post-body h3 { font-size: 1.1rem; font-weight: 600; color: var(--teal); margin: 28px 0 10px; }
    .post-body p { margin-bottom: 18px; }
    .post-body ul, .post-body ol { margin: 0 0 18px 24px; }
    .post-body li { margin-bottom: 8px; }
    .post-body a { color: var(--teal); }
    .post-body strong { color: #fff; font-weight: 600; }
    .cta-box { margin-top: 56px; background: rgba(31,138,140,0.08); border: 1px solid rgba(31,138,140,0.3); border-radius: 16px; padding: 36px; text-align: center; }
    .cta-box h3 { font-family: 'Oswald', sans-serif; font-size: 1.4rem; text-transform: uppercase; margin-bottom: 10px; }
    .cta-box p { color: rgba(255,255,255,0.6); margin-bottom: 22px; font-size: 14px; }
    .cta-btn { display: inline-block; padding: 13px 28px; background: var(--orange); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
    /* SIDEBAR */
    .sidebar { display: flex; flex-direction: column; gap: 24px; position: sticky; top: 24px; }
    .sidebar-ad { border-radius: 14px; overflow: hidden; border: 1px solid rgba(31,138,140,0.2); text-decoration: none; display: block; transition: border-color 0.2s; }
    .sidebar-ad:hover { border-color: rgba(31,138,140,0.5); }
    .sidebar-ad img { width: 100%; display: block; }
    .sidebar-ad-body { padding: 18px; background: rgba(255,255,255,0.04); }
    .sidebar-ad-body h4 { font-family: 'Oswald', sans-serif; font-size: 1.1rem; text-transform: uppercase; margin-bottom: 6px; color: #fff; }
    .sidebar-ad-body p { color: rgba(255,255,255,0.55); font-size: 13px; line-height: 1.5; margin-bottom: 14px; }
    .sidebar-ad-btn { display: block; text-align: center; padding: 10px; background: var(--orange); color: #fff; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; border-radius: 8px; }
    /* FOOTER */
    .site-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 28px 40px; display: flex; justify-content: space-between; align-items: center; }
    .site-footer img { height: 60px; opacity: 0.7; }
    .site-footer p { color: rgba(255,255,255,0.2); font-size: 12px; }
    @media (max-width: 768px) {
      .page-wrap { grid-template-columns: 1fr; }
      .sidebar { position: static; }
      .site-header { padding: 16px 20px; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <a href="/"><img src="/assets/images/logo-dark.png" alt="PT Pools"></a>
    <nav>
      <a href="/">Home</a>
      <a href="/blog" class="active">Blog</a>
      <a href="/#notify" class="nav-cta">Get Notified</a>
    </nav>
  </header>

  <div class="page-wrap">
    <article>
      ${post.hero_image_url ? `<img class="hero-img" src="${esc(post.hero_image_url)}" alt="${esc(post.title)}">` : ''}
      <h1 class="post-title">${esc(post.title)}</h1>
      <div class="post-date">${formatDate(post.published_at)}</div>
      <div class="post-body">${post.body}</div>

      <div class="cta-box">
        <h3>Join the Waitlist</h3>
        <p>Be first in line when TheraTank launches on Kickstarter — early backers get the best price.</p>
        <a href="/#notify" class="cta-btn">Notify Me at Launch</a>
      </div>
    </article>

    <aside class="sidebar">
      <a class="sidebar-ad" href="/#notify">
        <picture>
          <source srcset="/assets/images/theratank-render.webp" type="image/webp">
          <img src="/assets/images/theratank-render.png" alt="TheraTank by PT Pools">
        </picture>
        <div class="sidebar-ad-body">
          <h4>TheraTank</h4>
          <p>54" water depth. Drop-stitch inflatable. Sets up solo. Coming to Kickstarter.</p>
          <span class="sidebar-ad-btn">Early Bird — $749</span>
        </div>
      </a>
    </aside>
  </div>

  <footer class="site-footer">
    <img src="/assets/images/logo-dark.png" alt="PT Pools">
    <p>&copy; 2026 PT Pools. TheraTank is a trademark of PT Pools.</p>
  </footer>
</body>
</html>`
}

function html404() {
  return `<!DOCTYPE html><html><head><title>Not Found | PT Pools</title></head><body style="background:#061830;color:#fff;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px"><h1>Article not found</h1><a href="/blog" style="color:#1F8A8C">← Back to blog</a></body></html>`
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
