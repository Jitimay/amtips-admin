export function formatBIF(amount: number | null | undefined): string {
  if (amount == null) return '0 BIF'
  return new Intl.NumberFormat('fr-BI').format(amount) + ' BIF'
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function statusClass(status: string): string {
  const map: Record<string, string> = {
    completed: 'status-completed',
    pending: 'status-pending',
    failed: 'status-failed',
    requested: 'status-requested',
    cancelled: 'status-cancelled',
  }
  return map[status] ?? 'status-pending'
}
