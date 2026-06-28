import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabase'

interface Post {
  id: string
  title: string
  slug: string
  body: string
  hero_image_url: string
  seo_description: string
  category_id: string | null
  published: boolean
  published_at: string | null
  created_at: string
}

interface Category {
  id: string
  name: string
}

const emptyForm = { title: '', slug: '', body: '', hero_image_url: '', seo_description: '', category_id: '', published: false }

export default function BlogPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'editor' | 'categories'>('list')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [newCat, setNewCat] = useState('')
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => { loadPosts(); loadCategories() }, [])

  async function loadPosts() {
    const { data } = await supabaseAdmin.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data ?? [])
  }

  async function loadCategories() {
    const { data } = await supabaseAdmin.from('categories').select('*').order('name')
    setCategories(data ?? [])
  }

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function handleTitleChange(val: string) {
    setForm(f => ({ ...f, title: val, slug: editing ? f.slug : autoSlug(val) }))
  }

  async function handleSave() {
    if (!form.title || !form.slug || !form.body) { setMsg('Title, slug, and body are required.'); return }
    setSaving(true)
    setMsg('')
    const payload = {
      ...form,
      category_id: form.category_id || null,
      published_at: form.published ? new Date().toISOString() : null
    }
    if (editing) {
      await supabaseAdmin.from('blog_posts').update(payload).eq('id', editing)
    } else {
      await supabaseAdmin.from('blog_posts').insert(payload)
    }
    await loadPosts()
    setForm(emptyForm)
    setEditing(null)
    setView('list')
    setSaving(false)
  }

  function handleEdit(post: Post) {
    setForm({ title: post.title, slug: post.slug, body: post.body, hero_image_url: post.hero_image_url ?? '', seo_description: post.seo_description ?? '', category_id: post.category_id ?? '', published: post.published })
    setEditing(post.id)
    setView('editor')
  }

  async function togglePublish(post: Post) {
    await supabaseAdmin.from('blog_posts').update({ published: !post.published, published_at: !post.published ? new Date().toISOString() : null }).eq('id', post.id)
    loadPosts()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return
    await supabaseAdmin.from('blog_posts').delete().eq('id', id)
    loadPosts()
  }

  async function addCategory() {
    if (!newCat.trim()) return
    await supabaseAdmin.from('categories').insert({ name: newCat.trim() })
    setNewCat('')
    loadCategories()
  }

  async function saveCategory() {
    if (!editingCat || !editingCat.name.trim()) return
    await supabaseAdmin.from('categories').update({ name: editingCat.name.trim() }).eq('id', editingCat.id)
    setEditingCat(null)
    loadCategories()
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Posts using it will be uncategorized.')) return
    await supabaseAdmin.from('categories').delete().eq('id', id)
    loadCategories()
  }

  function getCatName(id: string | null) {
    return categories.find(c => c.id === id)?.name ?? ''
  }

  // CATEGORIES VIEW
  if (view === 'categories') return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>Categories</h1>
        <button style={styles.btnGhost} onClick={() => setView('list')}>← Back to Posts</button>
      </div>

      <div style={styles.catWrap}>
        <div style={styles.catAddRow}>
          <input style={{ ...styles.input, flex: 1 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name…" onKeyDown={e => e.key === 'Enter' && addCategory()} />
          <button style={styles.btnPrimary} onClick={addCategory}>Add</button>
        </div>

        {categories.length === 0 && <p style={styles.empty}>No categories yet.</p>}

        <div style={styles.catList}>
          {categories.map(cat => (
            <div key={cat.id} style={styles.catRow}>
              {editingCat?.id === cat.id ? (
                <>
                  <input style={{ ...styles.input, flex: 1 }} value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && saveCategory()} autoFocus />
                  <button style={styles.btnPrimary} onClick={saveCategory}>Save</button>
                  <button style={styles.btnGhost} onClick={() => setEditingCat(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={styles.catName}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={styles.btnSmall} onClick={() => setEditingCat(cat)}>Rename</button>
                    <button style={{ ...styles.btnSmall, color: '#FF6B35' }} onClick={() => deleteCategory(cat.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // EDITOR VIEW
  if (view === 'editor') return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>{editing ? 'Edit Post' : 'New Post'}</h1>
        <button style={styles.btnGhost} onClick={() => { setView('list'); setForm(emptyForm); setEditing(null) }}>← Back</button>
      </div>

      <div style={styles.editorGrid}>
        <div style={styles.editorMain}>
          <label style={styles.label}>Title</label>
          <input style={styles.input} value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Post title" />

          <label style={styles.label}>Slug <span style={styles.hint}>(auto-generated, editable)</span></label>
          <input style={styles.input} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-friendly-slug" />

          <label style={styles.label}>Body <span style={styles.hint}>(HTML allowed)</span></label>
          <textarea style={{ ...styles.input, ...styles.textarea }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your post here…" />
        </div>

        <div style={styles.editorSide}>
          <label style={styles.label}>Category</label>
          <select style={{ ...styles.input, cursor: 'pointer' }} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
            <option value="">— None —</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <label style={styles.label}>Hero Image URL</label>
          <input style={styles.input} value={form.hero_image_url} onChange={e => setForm(f => ({ ...f, hero_image_url: e.target.value }))} placeholder="https://…" />
          {form.hero_image_url && <img src={form.hero_image_url} alt="" style={styles.preview} />}

          <label style={styles.label}>SEO Description</label>
          <textarea style={{ ...styles.input, height: 80 }} value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} placeholder="155 characters max for Google…" maxLength={155} />
          <div style={styles.charCount}>{form.seo_description.length}/155</div>

          <label style={styles.toggleRow}>
            <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
            <span style={{ color: form.published ? '#1F8A8C' : 'rgba(255,255,255,0.5)', marginLeft: 8 }}>
              {form.published ? 'Published' : 'Draft'}
            </span>
          </label>

          {msg && <p style={styles.error}>{msg}</p>}
          <button style={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  )

  // LIST VIEW
  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>Blog Posts</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={styles.btnGhost} onClick={() => setView('categories')}>Manage Categories</button>
          <button style={styles.btnPrimary} onClick={() => { setForm(emptyForm); setEditing(null); setView('editor') }}>+ New Post</button>
        </div>
      </div>

      {posts.length === 0 && <p style={styles.empty}>No posts yet. Hit New Post to write your first one.</p>}

      <div style={styles.postList}>
        {posts.map(post => (
          <div key={post.id} style={styles.postRow}>
            <div style={styles.postInfo}>
              <div style={styles.postTitle}>{post.title}</div>
              <div style={styles.postMeta}>
                /{post.slug}
                {getCatName(post.category_id) && <span style={styles.catChip}>{getCatName(post.category_id)}</span>}
                · {post.published ? <span style={{ color: '#1F8A8C' }}>Published</span> : <span style={{ color: '#FF6B35' }}>Draft</span>}
              </div>
            </div>
            <div style={styles.postActions}>
              <a style={styles.btnSmall} href={`https://ptpools.us/blog/${post.slug}`} target="_blank" rel="noreferrer">View</a>
              <button style={styles.btnSmall} onClick={() => togglePublish(post)}>{post.published ? 'Unpublish' : 'Publish'}</button>
              <button style={styles.btnSmall} onClick={() => handleEdit(post)}>Edit</button>
              <button style={{ ...styles.btnSmall, color: '#FF6B35' }} onClick={() => handleDelete(post.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  h1: { color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 },
  editorGrid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' },
  editorMain: { display: 'flex', flexDirection: 'column', gap: 16 },
  editorSide: { display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(31,138,140,0.2)', borderRadius: 12, padding: 24 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  hint: { color: 'rgba(255,255,255,0.35)', textTransform: 'none', letterSpacing: 0, fontSize: 11 },
  input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(31,138,140,0.25)', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' },
  textarea: { minHeight: 400, resize: 'vertical' },
  preview: { width: '100%', borderRadius: 8, marginTop: 4 },
  charCount: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'right', marginTop: -8 },
  toggleRow: { display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff', fontSize: 14 },
  btnPrimary: { padding: '12px 20px', background: '#1F8A8C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' },
  btnGhost: { padding: '10px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' },
  btnSmall: { padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif', textDecoration: 'none', display: 'inline-block' },
  error: { color: '#FF6B35', fontSize: 13, margin: 0 },
  empty: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
  postList: { display: 'flex', flexDirection: 'column', gap: 12 },
  postRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(31,138,140,0.15)', borderRadius: 10, padding: '16px 20px' },
  postInfo: { flex: 1 },
  postTitle: { color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4 },
  postMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catChip: { background: 'rgba(31,138,140,0.2)', color: '#1F8A8C', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
  postActions: { display: 'flex', gap: 8 },
  catWrap: { maxWidth: 500 },
  catAddRow: { display: 'flex', gap: 10, marginBottom: 20 },
  catList: { display: 'flex', flexDirection: 'column', gap: 8 },
  catRow: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(31,138,140,0.15)', borderRadius: 8, padding: '12px 16px' },
  catName: { color: '#fff', fontSize: 15, flex: 1 },
}
