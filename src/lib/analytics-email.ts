import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export interface EmailSendResult {
  ok: boolean
  previewUrl?: string
  messageId?: string
  mode: 'smtp' | 'ethereal' | 'skipped'
}

function renderEmailHtml(payload: Record<string, unknown>): string {
  const n = (v: unknown) => Number(v ?? 0)
  const rows = [
    ['Date', String(payload.date ?? '')],
    ['Visitors', String(n(payload.visitors))],
    ['Unique Visitors', String(n(payload.unique_visitors))],
    ['Page Views', String(n(payload.page_views))],
    ['Sessions', String(n(payload.sessions))],
    ['Affiliate Clicks', String(n(payload.affiliate_clicks))],
    ['Add to Cart', String(n(payload.add_to_cart))],
    ['Newsletter Subscribes', String(n(payload.newsletter_subscribes))],
    ['Bounce Rate', String(payload.bounce_rate ?? 0) + '%'],
  ]
  const topPages = (payload.top_pages as { page: string; views: number }[] | undefined) ?? []
  const bySource = (payload.by_source as Record<string, number> | undefined) ?? {}
  const pageRows = topPages
    .map((p) => `<tr><td>${p.page}</td><td>${p.views}</td></tr>`)
    .join('')
  const sourceRows = Object.entries(bySource)
    .map(([s, v]) => `<tr><td>${s}</td><td>${v}</td></tr>`)
    .join('')
  return `
<h2>GadgetErea Daily Analytics Report — ${String(payload.date ?? '')}</h2>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
${rows.map(([k, v]) => `<tr><th align="left">${k}</th><td>${v}</td></tr>`).join('')}
</table>
<h3>Top Pages</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
<tr><th align="left">Page</th><th>Views</th></tr>${pageRows || '<tr><td colspan="2">—</td></tr>'}
</table>
<h3>Views by Source</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
<tr><th align="left">Source</th><th>Views</th></tr>${sourceRows || '<tr><td colspan="2">—</td></tr>'}
</table>
`
}

function renderEmailText(payload: Record<string, unknown>): string {
  const n = (v: unknown) => Number(v ?? 0)
  const topPages = (payload.top_pages as { page: string; views: number }[] | undefined) ?? []
  const bySource = (payload.by_source as Record<string, number> | undefined) ?? {}
  return [
    `GadgetErea Daily Analytics Report — ${String(payload.date ?? '')}`,
    '',
    `Visitors: ${n(payload.visitors)}`,
    `Unique Visitors: ${n(payload.unique_visitors)}`,
    `Page Views: ${n(payload.page_views)}`,
    `Sessions: ${n(payload.sessions)}`,
    `Affiliate Clicks: ${n(payload.affiliate_clicks)}`,
    `Add to Cart: ${n(payload.add_to_cart)}`,
    `Newsletter Subscribes: ${n(payload.newsletter_subscribes)}`,
    `Bounce Rate: ${String(payload.bounce_rate ?? 0)}%`,
    '',
    'Top Pages:',
    ...topPages.map((p) => `  ${p.page} — ${p.views}`),
    '',
    'Views by Source:',
    ...Object.entries(bySource).map(([s, v]) => `  ${s} — ${v}`),
  ].join('\n')
}

/**
 * Send the daily analytics report to the admin.
 * - Real SMTP when SMTP_HOST is configured.
 * - Otherwise an Ethereal test inbox (set forceTest to send anyway).
 */
export async function sendDailyReportEmail(
  payload: Record<string, unknown>,
  opts: { forceTest?: boolean } = {},
): Promise<EmailSendResult> {
  const to = process.env.REPORT_EMAIL || 'admin@technest-bd.com'
  const smtpHost = process.env.SMTP_HOST

  if (!smtpHost && !opts.forceTest) {
    return { ok: false, mode: 'skipped', messageId: undefined }
  }

  let transporter: Transporter
  let previewUrl: string | undefined
  if (smtpHost) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: String(process.env.SMTP_SECURE ?? '') === '1',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
        : undefined,
    })
  } else {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    previewUrl = undefined
  }

  const dateStr = String(payload.date ?? '')
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'GadgetErea Analytics <no-reply@technest-bd.com>',
    to,
    subject: `GadgetErea Daily Analytics Report — ${dateStr}`,
    text: renderEmailText(payload),
    html: renderEmailHtml(payload),
  })
  if (!smtpHost) {
    const url = nodemailer.getTestMessageUrl(info)
    previewUrl = typeof url === 'string' ? url : undefined
  }
  return { ok: true, mode: smtpHost ? 'smtp' : 'ethereal', previewUrl, messageId: info.messageId }
}
