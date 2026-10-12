import { useEffect, useState } from 'react'
import { Mail, Send, RefreshCw, Users, FileText } from 'lucide-react'

const TEMPLATES: { name: string; subject: string; html: string }[] = [
  {
    name: 'Welcome — Votre code est prêt',
    subject: 'Votre code est prêt. Voici comment vous en servir.',
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#111;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:8px;">
    <span style="font-size:22px;font-weight:700;color:#111;">amTips</span><br/>
    <span style="font-size:13px;color:#555;font-style:italic;">le menu qui se scanne</span>
  </div>
  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;"/>

  <p style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Objet</p>
  <p style="font-size:13px;color:#333;margin-top:0;">Votre code est prêt. Voici comment vous en servir.</p>

  <p style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Aperçu</p>
  <p style="font-size:13px;color:#333;margin-top:0;">Vous avez installé amTips. Et maintenant ?</p>

  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;"/>

  <h1 style="font-size:26px;font-weight:700;line-height:1.3;margin-bottom:16px;">Votre code est prêt.<br/>Voici comment vous en servir.</h1>

  <p>Bonjour,</p>
  <p>Vous faites partie des premières personnes à avoir installé l'application — merci.</p>
  <p>Pour que vous ne restiez pas bloqué, nous avons préparé <strong>trois vidéos de moins d'une minute</strong>.<br/>Regardez celles qui vous concernent, laissez les autres.</p>

  <p style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;margin:28px 0 12px;">LES 3 VIDÉOS</p>

  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:32px;vertical-align:top;padding:12px 0;border-top:1px solid #eee;font-weight:700;font-size:18px;">1</td>
      <td style="padding:12px 16px;border-top:1px solid #eee;">
        <strong>C'est quoi, au juste ?</strong><br/>
        <span style="font-size:13px;color:#555;">Tout comprendre en moins d'une minute.</span><br/>
        <a href="{LIEN_VIDEO_1}" style="font-size:13px;color:#111;">Regarder →</a>
      </td>
    </tr>
    <tr>
      <td style="width:32px;vertical-align:top;padding:12px 0;border-top:1px solid #eee;font-weight:700;font-size:18px;">2</td>
      <td style="padding:12px 16px;border-top:1px solid #eee;">
        <strong>Envoyer un soutien</strong><br/>
        <span style="font-size:13px;color:#555;">On scanne, on choisit le montant, on paie par mobile money. Celui qui envoie n'installe rien.</span><br/>
        <a href="{LIEN_VIDEO_2}" style="font-size:13px;color:#111;">Regarder →</a>
      </td>
    </tr>
    <tr>
      <td style="width:32px;vertical-align:top;padding:12px 0;border-top:1px solid #eee;font-weight:700;font-size:18px;">3</td>
      <td style="padding:12px 16px;border-top:1px solid #eee;">
        <strong>Cartes et campagnes</strong><br/>
        <span style="font-size:13px;color:#555;">Un anniversaire à fêter, une cause à soutenir : vous créez, vous partagez, et chacun participe depuis son téléphone.</span><br/>
        <a href="{LIEN_VIDEO_3}" style="font-size:13px;color:#111;">Regarder →</a>
      </td>
    </tr>
  </table>

  <p style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;margin:28px 0 12px;">3 CONSEILS POUR BIEN DÉMARRER</p>
  <p style="font-size:13px;color:#333;">Mettez votre code ou votre lien là où il est visible directement — <strong>votre statut, votre story</strong>.</p>
  <p style="font-size:13px;color:#333;">L'endroit où le plus de gens le verront, sans effort de votre part.</p>
  <p style="font-size:13px;color:#333;">Ajoutez-le en bas de vos publications.</p>

  <hr style="border:none;border-top:1px solid #ddd;margin:28px 0;"/>

  <p style="font-size:13px;color:#555;">Une story, une vidéo, une photo : le code travaille pendant que vous dormez.</p>
  <p style="font-size:13px;color:#333;"><strong>Faites un premier essai avec un proche.</strong><br/>Demandez-lui de vous envoyer 500 BIF. Vous comprendrez tout en trente secondes — et lui aussi.</p>

  <div style="text-align:center;margin:28px 0;">
    <a href="{LIEN_APP}" style="display:inline-block;background:#6c63ff;color:#fff;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">Ouvrir l'application</a>
  </div>

  <p style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;margin:28px 0 12px;">LES QUESTIONS QU'ON NOUS POSE</p>

  <p style="font-size:13px;"><strong>Est-ce que je dois donner mon numéro ?</strong><br/>
  Non. Vous ne le saisissez qu'au moment de retirer votre argent.</p>

  <p style="font-size:13px;"><strong>Est-ce qu'on m'envoie quelque chose ?</strong><br/>
  Non. Il scanne votre code et paie depuis son navigateur.</p>

  <p style="font-size:13px;"><strong>Est-ce que ça coûte quelque chose ?</strong><br/>
  L'application et la création de votre code sont gratuites. Une commission est prélevée sur les montants reçus.</p>

  <p style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;margin:28px 0 12px;">LE SOIR DU LANCEMENT</p>
  <div style="border:1px dashed #ccc;padding:16px;border-radius:6px;font-size:13px;color:#888;margin-bottom:16px;">
    Bandeau photo du lancement : <a href="{LIEN_IMAGE_LANCEMENT}" style="color:#6c63ff;">{LIEN_IMAGE_LANCEMENT}</a>
  </div>

  <p style="font-size:13px;">Le 2 octobre, nous avons présenté l'application à Bujumbura. Si vous étiez là, vous êtes probablement sur l'une de ces photos.</p>
  <p style="font-size:13px;"><a href="{LIEN_ALBUM_PHOTOS}" style="color:#111;">Voir l'album →</a></p>

  <p style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;margin:28px 0 12px;">UN BLOCAGE ? ÉCRIVEZ-NOUS.</p>
  <p style="font-size:13px;">Nous sommes une petite équipe et nous répondons à tout le monde.</p>
  <p style="font-size:13px;">
    <a href="mailto:{ADRESSE_SUPPORT}" style="color:#111;">{ADRESSE_SUPPORT}</a> —
    <a href="https://wa.me/{NUMERO_SUPPORT}" style="color:#111;">WhatsApp</a>
  </p>

  <p style="font-size:13px;margin-top:28px;">Merci d'être là dès le début.</p>
  <p style="font-size:13px;"><strong>L'équipe amTips</strong><br/><span style="color:#555;">Bujumbura</span></p>

  <hr style="border:none;border-top:1px solid #ddd;margin:28px 0;"/>

  <div style="text-align:center;font-size:13px;color:#555;">
    <a href="{LIEN_INSTAGRAM}" style="color:#111;margin:0 8px;">Instagram</a> —
    <a href="{LIEN_FACEBOOK}" style="color:#111;margin:0 8px;">Facebook</a> —
    <a href="{LIEN_TIKTOK}" style="color:#111;margin:0 8px;">TikTok</a>
  </div>
  <div style="text-align:center;margin:8px 0;">
    <a href="https://amtips.app" style="color:#111;font-size:13px;">amtips.app</a>
  </div>
  <p style="text-align:center;font-size:12px;color:#888;margin-top:12px;">
    Vous recevez cet e-mail parce que vous avez créé un compte sur amtips.app.
    <a href="{LIEN_DESINSCRIPTION}" style="color:#888;">Se désinscrire</a>
  </p>
</div>`,
  },
]

export default function MailPage() {
  const [emails, setEmails] = useState<string[]>([])
  const [loadingEmails, setLoadingEmails] = useState(true)
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [tab, setTab] = useState<'compose' | 'preview'>('compose')

  async function fetchEmails() {
    setLoadingEmails(true)
    const res = await fetch('/api/firebase-users')
    const data = await res.json()
    setEmails(data.emails ?? [])
    setLoadingEmails(false)
  }

  useEffect(() => { fetchEmails() }, [])

  async function sendTo(targets: string[]) {
    return fetch('/api/mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, html, emails: targets }),
    })
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !html.trim() || !testEmail.trim()) return
    setSendingTest(true)
    setMsg(null)
    const res = await sendTo([testEmail.trim()])
    const data = await res.json()
    setMsg(res.ok ? { text: `✅ Test sent to ${testEmail}!`, ok: true } : { text: `❌ ${data.error}`, ok: false })
    setSendingTest(false)
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !html.trim()) return
    setSending(true)
    setMsg(null)
    const res = await sendTo(emails)
    const data = await res.json()
    if (res.ok) {
      setMsg({ text: `✅ Sent to ${data.sent} user(s)!`, ok: true })
      setSubject('')
      setHtml('')
    } else {
      setMsg({ text: `❌ ${data.error}`, ok: false })
    }
    setSending(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Broadcast Email</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Send email to all registered users</p>
        </div>
        <button className="btn-primary" onClick={fetchEmails} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Recipients */}
      <div className="glass" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #22d3a5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{loadingEmails ? '…' : emails.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Recipients (all registered users)</div>
        </div>
      </div>

      {/* Templates */}
      <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <FileText size={16} style={{ color: 'var(--accent-purple)' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Templates</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button
              key={t.name}
              className="btn-secondary"
              onClick={() => { setSubject(t.subject); setHtml(t.html); setTab('compose') }}
              style={{ fontSize: 13 }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="glass" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Mail size={18} style={{ color: 'var(--accent-purple)' }} />
          <h2 style={{ fontWeight: 600, fontSize: 16 }}>Compose</h2>
          {/* Tab toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {(['compose', 'preview'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '4px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                  background: tab === t ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                  color: tab === t ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {t === 'compose' ? 'Edit' : 'Preview'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" style={{ width: '100%' }} />
        </div>

        {tab === 'compose' ? (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Body (HTML)</label>
            <textarea
              value={html}
              onChange={e => setHtml(e.target.value)}
              placeholder="<p>Hello,</p>"
              rows={16}
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)',
                fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace',
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Preview</label>
            <div
              style={{ background: '#fff', color: '#111', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', minHeight: 100 }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}

        {msg && <p style={{ color: msg.ok ? '#22d3a5' : '#ef4444', marginBottom: 16, fontSize: 14 }}>{msg.text}</p>}

        {/* Test send */}
        <form onSubmit={handleTest} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="Test email address…"
            type="email"
            required
            style={{ flex: 1 }}
          />
          <button
            className="btn-secondary"
            type="submit"
            disabled={sendingTest || !subject.trim() || !html.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', opacity: sendingTest ? 0.7 : 1 }}
          >
            <Send size={14} />{sendingTest ? 'Sending…' : 'Send Test'}
          </button>
        </form>

        {/* Broadcast */}
        <form onSubmit={handleBroadcast}>
          <button
            className="btn-primary"
            type="submit"
            disabled={sending || loadingEmails || emails.length === 0 || !subject.trim() || !html.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: sending ? 0.7 : 1 }}
          >
            <Send size={14} />{sending ? `Sending to ${emails.length} users…` : `Broadcast to ${emails.length} users`}
          </button>
        </form>
      </div>
    </div>
  )
}
