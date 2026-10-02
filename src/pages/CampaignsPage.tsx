import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'

export default function CampaignsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [form, setForm] = useState({ title: '', body: '', userId: '', type: 'announcement' })
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }

  async function sendNotification() {
    if (!form.title || !form.body) return
    setSending(true)
    setMsg('')

    let targetUserIds: string[] = []
    if (form.userId) {
      targetUserIds = [form.userId]
    } else {
      // Send to all profiles
      const { data: profiles } = await supabase.from('profiles').select('id')
      targetUserIds = (profiles ?? []).map(p => p.id)
    }

    const payload = targetUserIds.map(user_id => ({
      user_id,
      title: form.title,
      body: form.body,
      type: form.type,
      is_read: false,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('notifications').insert(payload)
    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg(`Successfully sent notification to ${targetUserIds.length} user(s)!`)
      setForm({ title: '', body: '', userId: '', type: 'announcement' })
      setShowForm(false)
      load()
    }
    setSending(false)
  }

  async function deleteNotification(id: string) {
    setDeleting(id)
    await supabase.from('notifications').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>In-App & Push Notifications</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Broadcast announcements and notifications to users</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} />Refresh
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #22d3a5, #16a085)' }}
          >
            <Plus size={14} />New Notification
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Send In-App Broadcast / Push Notification</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Title</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Notification title"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%' }}>
                <option value="announcement">Announcement</option>
                <option value="system">System Notice</option>
                <option value="tip_update">Tip Update</option>
                <option value="payout">Payout Update</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Target User ID (Optional)</label>
              <input
                value={form.userId}
                onChange={e => setForm({ ...form, userId: e.target.value })}
                placeholder="Leave blank for ALL users"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Message Body</label>
            <textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              placeholder="Notification body text..."
              rows={3}
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14,
                outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>
          {msg && <p style={{ color: msg.startsWith('Error') ? '#ef4444' : '#22d3a5', marginBottom: 12, fontSize: 14 }}>{msg}</p>}
          <button className="btn-primary" onClick={sendNotification} disabled={sending}>
            {sending ? 'Sending…' : '📣 Broadcast Notification'}
          </button>
        </div>
      )}

      <div className="glass" style={{ padding: '0 0 4px' }}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Body</th>
              <th>Type</th>
              <th>User ID</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading notifications…</td></tr>
            ) : notifications.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No notifications found</td></tr>
            ) : notifications.map(n => (
              <tr key={n.id}>
                <td style={{ fontWeight: 600 }}>{n.title}</td>
                <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 13 }}>{n.body}</td>
                <td><span className="status-badge status-requested">{n.type ?? 'general'}</span></td>
                <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{n.user_id ? n.user_id.slice(0, 8) + '…' : 'All Users'}</td>
                <td><span className={`status-badge ${n.is_read ? 'status-completed' : 'status-pending'}`}>{n.is_read ? 'Read' : 'Unread'}</span></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(n.created_at)}</td>
                <td>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    disabled={deleting === n.id}
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
