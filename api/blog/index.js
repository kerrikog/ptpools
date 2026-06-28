const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

export default async function handler(req, res) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_posts?published=eq.true&select=title,slug,seo_description,hero_image_url,published_at&order=published_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  )
  const posts = await response.json()

  res.setHeader('Content-Type', 'text/html')
  res.send(renderIndex(posts))
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
    .site-header { padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; background: rgba(6,24,48,0.97); border-bottom: 1px solid rgba(31,138,140,0.15); }
    .site-header img { height: 70px; }
    .back-link { color: var(--teal); font-size: 14px; text-decoration: none; letter-spacing: 0.5px; }
    .page-title { font-family: 'Oswald', sans-serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .page-sub { color: rgba(255,255,255,0.5); font-size: 15px; }
    .blog-header { max-width: 900px; margin: 60px auto 48px; padding: 0 24px; }
    .post-grid { max-width: 900px; margin: 0 auto; padding: 0 24px 100px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .post-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(31,138,140,0.15); border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: border-color 0.2s, transform 0.2s; display: flex; flex-direction: column; }
    .post-card:hover { border-color: rgba(31,138,140,0.45); transform: translateY(-2px); }
    .post-card img { width: 100%; height: 180px; object-fit: cover; }
    .post-card-body { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .post-card-date { color: var(--teal); font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; }
    .post-card-title { font-family: 'Oswald', sans-serif; font-size: 1.3rem; font-weight: 700; text-transform: uppercase; line-height: 1.2; color: #fff; }
    .post-card-desc { color: rgba(255,255,255,0.55); font-size: 14px; line-height: 1.6; flex: 1; }
    .post-card-link { color: var(--teal); font-size: 13px; font-weight: 600; letter-spacing: 0.5px; margin-top: 4px; }
    .empty { color: rgba(255,255,255,0.4); padding: 60px 24px; text-align: center; max-width: 900px; margin: 0 auto; }
    .site-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 28px 40px; display: flex; justify-content: space-between; align-items: center; }
    .site-footer img { height: 60px; opacity: 0.7; }
    .site-footer p { color: rgba(255,255,255,0.2); font-size: 12px; }
  </style>
</head>
<body>
  <header class="site-header">
    <a href="/"><img src="/assets/images/logo-dark.png" alt="PT Pools"></a>
    <a href="/" class="back-link">← Home</a>
  </header>

  <div class="blog-header">
    <h1 class="page-title">From the Blog</h1>
    <p class="page-sub">Aquatic therapy tips, exercises, and recovery guides.</p>
  </div>

  ${posts.length === 0
    ? `<div class="empty">No articles yet — check back soon.</div>`
    : `<div class="post-grid">
        ${posts.map(post => `
          <a class="post-card" href="/blog/${esc(post.slug)}">
            ${post.hero_image_url ? `<img src="${esc(post.hero_image_url)}" alt="${esc(post.title)}">` : ''}
            <div class="post-card-body">
              <div class="post-card-date">${formatDate(post.published_at)}</div>
              <div class="post-card-title">${esc(post.title)}</div>
              ${post.seo_description ? `<div class="post-card-desc">${esc(post.seo_description)}</div>` : ''}
              <div class="post-card-link">Read Article →</div>
            </div>
          </a>`).join('')}
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

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
