const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

export default async function handler(req, res) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.status(500).send('Missing environment variables: SUPABASE_URL or SUPABASE_ANON_KEY')
      return
    }
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?published=eq.true&select=title,slug,seo_description,hero_image_url,published_at,categories(name)&order=published_at.desc`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    const data = await response.json()
    if (!Array.isArray(data)) {
      res.status(500).send(`Supabase error: ${JSON.stringify(data)}`)
      return
    }
    res.setHeader('Content-Type', 'text/html')
    res.send(renderIndex(data))
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`)
  }
}

function renderIndex(posts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog | PT Pools</title>
  <meta name="description" content="Aquatic therapy tips, exercises, and recovery guides from PT Pools.">
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
    .nav-cta { margin-left: auto; padding: 9px 20px; background: var(--orange); color: #fff !important; border-radius: 8px; font-weight: 600; font-size: 13px; }

    /* HERO HEADER */
    .blog-hero { padding: 64px 60px 48px; display: flex; align-items: flex-end; justify-content: space-between; max-width: 1300px; margin: 0 auto; }
    .blog-hero-title { font-family: 'Oswald', sans-serif; font-size: clamp(2.2rem, 4vw, 3.4rem); font-weight: 700; text-transform: uppercase; line-height: 1.1; }
    .blog-hero-title span { color: var(--teal); }
    .blog-hero-sub { color: rgba(255,255,255,0.5); font-size: 15px; margin-top: 12px; max-width: 400px; line-height: 1.6; }
    .view-all-btn { flex-shrink: 0; padding: 14px 32px; background: var(--orange); color: #fff; text-decoration: none; font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border-radius: 8px; white-space: nowrap; }
    .view-all-btn:hover { background: #e85c28; }

    /* GRID */
    .post-grid { max-width: 1300px; margin: 0 auto; padding: 0 60px 100px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }

    /* CARD */
    .post-card { background: #0a1f3d; text-decoration: none; color: inherit; display: flex; flex-direction: column; border: 1px solid rgba(31,138,140,0.12); transition: transform 0.2s, border-color 0.2s; }
    .post-card:hover { transform: translateY(-4px); border-color: rgba(31,138,140,0.4); }

    .card-img-wrap { position: relative; overflow: hidden; aspect-ratio: 16/10; background: #0d2d5c; }
    .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
    .post-card:hover .card-img-wrap img { transform: scale(1.04); }
    .card-no-img { width: 100%; height: 100%; background: linear-gradient(135deg, #0d2d5c, #1F8A8C22); display: flex; align-items: center; justify-content: center; }
    .card-no-img svg { opacity: 0.15; }

    .card-badge { position: absolute; top: 14px; left: 14px; background: var(--teal); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 5px 12px; border-radius: 4px; }
    .card-hover-overlay { position: absolute; inset: 0; background: rgba(6,24,48,0.55); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.25s; }
    .card-hover-overlay span { font-family: 'Oswald', sans-serif; font-size: 1.1rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #fff; border-bottom: 2px solid var(--orange); padding-bottom: 4px; }
    .post-card:hover .card-hover-overlay { opacity: 1; }

    .card-body { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .card-tag { font-size: 12px; font-weight: 700; color: var(--teal); text-transform: uppercase; letter-spacing: 1.5px; }
    .card-title { font-family: 'Oswald', sans-serif; font-size: 1.35rem; font-weight: 700; text-transform: uppercase; line-height: 1.25; color: #fff; }
    .card-desc { color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.6; flex: 1; }
    .card-link { color: var(--orange); font-size: 13px; font-weight: 600; letter-spacing: 0.5px; margin-top: 4px; display: flex; align-items: center; gap: 6px; }

    .empty { color: rgba(255,255,255,0.4); padding: 80px 24px; text-align: center; }

    /* FOOTER */
    .site-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 28px 40px; display: flex; justify-content: space-between; align-items: center; }
    .site-footer img { height: 60px; opacity: 0.7; }
    .site-footer p { color: rgba(255,255,255,0.2); font-size: 12px; }

    @media (max-width: 900px) {
      .post-grid { grid-template-columns: repeat(2, 1fr); padding: 0 24px 80px; }
      .blog-hero { padding: 48px 24px 36px; flex-direction: column; align-items: flex-start; gap: 24px; }
    }
    @media (max-width: 580px) {
      .post-grid { grid-template-columns: 1fr; }
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

  <div class="blog-hero">
    <div>
      <h1 class="blog-hero-title">Our Latest <span>Blog Posts</span></h1>
      <p class="blog-hero-sub">Aquatic therapy tips, exercises, and recovery guides from PT Pools.</p>
    </div>
    <a href="/blog" class="view-all-btn">View All Posts</a>
  </div>

  ${posts.length === 0
    ? `<div class="empty">No articles yet — check back soon.</div>`
    : `<div class="post-grid">
        ${posts.map(post => {
          return `
          <a class="post-card" href="/blog/${esc(post.slug)}">
            <div class="card-img-wrap">
              ${post.hero_image_url
                ? `<img src="${esc(post.hero_image_url)}" alt="${esc(post.title)}" loading="lazy">`
                : `<div class="card-no-img"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`}
              ${post.categories?.name ? `<div class="card-badge">${esc(post.categories.name)}</div>` : ''}
              <div class="card-hover-overlay"><span>Read Article</span></div>
            </div>
            <div class="card-body">
              <div class="card-tag">Aquatic Therapy</div>
              <div class="card-title">${esc(post.title)}</div>
              ${post.seo_description ? `<div class="card-desc">${esc(post.seo_description)}</div>` : ''}
              <div class="card-link">Read Article <span>→</span></div>
            </div>
          </a>`}).join('')}
      </div>`}

  <footer class="site-footer">
    <img src="/assets/images/logo-dark.png" alt="PT Pools">
    <p>&copy; 2026 PT Pools. TheraTank is a trademark of PT Pools.</p>
  </footer>
</body>
</html>`
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
