/**
 * Lightweight client-side analytics tracker.
 * The ONLY analytics code loaded by the public storefront (plus the Meta
 * Pixel stub below). Dashboards live in /admin and never load on public pages.
 */

const DEDUP_MS = 2000
const SESSION_TTL_MS = 30 * 60 * 1000
let sessionId = ''
let sessionIsNew = false
let lastSent: Record<string, number> = {}
let initialized = false
const scrollSent: Record<number, boolean> = {}
let currentPage = ''
let pageStart = 0

export function getSessionId(): string {
  if (sessionId) return sessionId
  try {
    const now = Date.now()
    const raw = localStorage.getItem('tn_analytics_session')
    if (raw) {
      const [id, ts] = raw.split('|')
      if (id && now - Number(ts) < SESSION_TTL_MS) {
        sessionId = id
        return id
      }
    }
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('tn_analytics_session', id + '|' + now)
    sessionId = id
    sessionIsNew = true
    return id
  } catch {
    sessionId = sessionId || 'anon-' + Math.random().toString(36).slice(2)
    sessionIsNew = true
    return sessionId
  }
}

function detectSource(): { source: string; refHost: string } {
  try {
    const ref = document.referrer
    if (!ref) return { source: 'direct', refHost: '' }
    const h = new URL(ref).hostname.toLowerCase().replace(/^www\./, '')
    if (h === window.location.hostname) return { source: 'direct', refHost: '' }
    let source = 'referral'
    if (h.includes('facebook') || h.includes('fb.com')) source = 'facebook'
    else if (h.includes('instagram')) source = 'instagram'
    else if (h.includes('youtube')) source = 'youtube'
    else if (h.includes('tiktok')) source = 'tiktok'
    else if (h.includes('pinterest')) source = 'pinterest'
    else if (h.includes('wa.me') || h.includes('whatsapp')) source = 'whatsapp'
    else if (h.includes('google')) source = 'google'
    return { source, refHost: h }
  } catch {
    return { source: 'direct', refHost: '' }
  }
}

function detectDevice(): { device: string; os: string; browser: string } {
  const ua = navigator.userAgent
  const isMobile = /Mobi|Android|iPhone|iPod/i.test(ua)
  const isTablet = /iPad|Tablet|PlayBook/i.test(ua)
  let os = 'unknown'
  if (/Windows/i.test(ua)) os = 'windows'
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macos'
  else if (/Android/i.test(ua)) os = 'android'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'ios'
  else if (/Linux/i.test(ua)) os = 'linux'
  let browser = 'unknown'
  if (/Edg\//i.test(ua)) browser = 'edge'
  else if (/OPR\//i.test(ua)) browser = 'opera'
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'chrome'
  else if (/Firefox\//i.test(ua)) browser = 'firefox'
  else if (/Safari\//i.test(ua)) browser = 'safari'
  return { device: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop', os, browser }
}

function getParams(): Record<string, string> {
  try {
    const p = new URLSearchParams(window.location.search)
    const out: Record<string, string> = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid']) {
      const v = p.get(k)
      if (v) out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function queueFailed(payload: unknown) {
  try {
    const q = JSON.parse(localStorage.getItem('tn_track_queue') || '[]')
    q.push({ payload, at: Date.now() })
    localStorage.setItem('tn_track_queue', JSON.stringify(q.slice(-50)))
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(
      'tn_track_fail',
      String(Number(localStorage.getItem('tn_track_fail') || '0') + 1),
    )
  } catch {
    /* ignore */
  }
}

export function track(
  event: string,
  page?: string,
  meta: Record<string, unknown> = {},
  opts: { force?: boolean } = {},
) {
  if (typeof window === 'undefined') return
  const dedupKey =
    event + '|' + (page ?? '') + '|' + (meta._dedupKey ? String(meta._dedupKey) : '')
  const now = Date.now()
  if (!opts.force && lastSent[dedupKey] && now - lastSent[dedupKey] < DEDUP_MS) return
  lastSent[dedupKey] = now
  if (Object.keys(lastSent).length > 300) lastSent = {}

  const { source: refSource, refHost } = detectSource()
  const dev = detectDevice()
  const params = getParams()
  const source = params.utm_source && params.utm_source !== 'direct'
    ? params.utm_source
    : params.gclid
      ? 'google'
      : params.fbclid
        ? 'facebook'
        : refSource

  const payload = {
    event,
    page: page ?? window.location.pathname,
    session_id: getSessionId(),
    source,
    device: dev.device,
    os: dev.os,
    browser: dev.browser,
    url: window.location.href.slice(0, 500),
    ref_host: refHost,
    utm: {
      source: params.utm_source ?? undefined,
      medium: params.utm_medium ?? undefined,
      campaign: params.utm_campaign ?? undefined,
    },
    meta,
  }

  const body = JSON.stringify(payload)
  const send = (keepalive: boolean) => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive,
    })
      .then((r) => {
        if (!r.ok) throw new Error('http ' + r.status)
        // pipeline works again -> flush queued payloads
        flushQueue()
      })
      .catch(() => queueFailed(payload))
  }
  try {
    send(false)
  } catch {
    queueFailed(payload)
  }
}

function flushQueue() {
  try {
    const raw = localStorage.getItem('tn_track_queue')
    if (!raw) return
    const q = JSON.parse(raw)
    if (!Array.isArray(q) || q.length === 0) return
    localStorage.removeItem('tn_track_queue')
    localStorage.removeItem('tn_track_fail')
    for (const item of q.slice(-20)) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* ignore */
  }
}

/** Meta Pixel stub — activates only when NEXT_PUBLIC_META_PIXEL_ID is set at build time. */
function pixel(event: string, meta: Record<string, unknown> = {}) {
  try {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    if (!pixelId) return
    const win = window as unknown as Record<string, unknown>
    const fbq = win.fbq as ((...args: unknown[]) => void) | undefined
    if (!fbq) {
      const s = document.createElement('script')
      s.src = 'https://connect.facebook.net/en_US/fbevents.js'
      s.async = true
      document.head.appendChild(s)
      ;(win._fbq as unknown) = (win._fbq as unknown) || []
      const fbqInit = ((...args: unknown[]) =>
        ((win._fbq as unknown[]) || []).push(args)) as (...args: unknown[]) => void
      win.fbq = fbqInit
      fbqInit('init', pixelId)
      fbqInit('track', 'PageView')
      return
    }
    fbq('track', event, meta)
  } catch {
    /* ignore */
  }
}

/** Map internal events to Meta Pixel standard events. */
export function pixelFor(event: string, meta: Record<string, unknown> = {}) {
  switch (event) {
    case 'page_view':
      pixel('PageView')
      break
    case 'product_view':
      pixel('ViewContent', { content_name: meta.product_slug })
      break
    case 'add_to_cart':
      pixel('AddToCart', { content_name: meta.product_slug })
      break
    case 'buy_now':
    case 'affiliate_click':
    case 'deal_price_click':
      pixel('InitiateCheckout', { content_name: meta.product_slug })
      break
    case 'newsletter_subscribe':
      pixel('Lead')
      break
  }
}

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  getSessionId()
  if (sessionIsNew) track('session_start')
  flushQueue()

  currentPage = window.location.pathname
  pageStart = Date.now()
  const page = currentPage

  // Fire the page view 2.5s after load, asynchronously, without blocking.
  window.setTimeout(() => {
    track('page_view', page)
    pixelFor('page_view')
  }, 2500)

  // ---- scroll depth (25/50/75/100%) ----
  let ticking = false
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      const depth = Math.round(((window.scrollY + window.innerHeight) / (max + window.innerHeight)) * 100)
      for (const pct of [25, 50, 75, 100]) {
        if (depth >= pct && !scrollSent[pct]) {
          scrollSent[pct] = true
          track('scroll_depth', currentPage, { percent: pct })
        }
      }
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  // ---- time on page ----
  const sendTime = () => {
    const seconds = Math.round((Date.now() - pageStart) / 1000)
    if (seconds >= 2 && currentPage) {
      // no force: dedupe keeps pagehide + visibilitychange from double-sending
      track('time_on_page', currentPage, { seconds })
    }
  }
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') sendTime()
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', sendTime)

  // ---- Core Web Vitals / page load time ----
  try {
    let lcp = 0
    let cls = 0
    let fcp = 0
    let inp = 0
    let done = false
    const sendCwv = () => {
      if (done) return
      done = true
      track(
        'page_load',
        page,
        {
          lcp_ms: Math.round(lcp),
          cls: Math.round(cls * 1000) / 1000,
          fcp_ms: Math.round(fcp),
          inp_ms: Math.round(inp),
          nav_ms: Math.round(performance.now()),
        },
        { force: true },
      )
    }
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.entryType === 'largest-contentful-paint' && !e.startTime) continue
        if (e.entryType === 'largest-contentful-paint') lcp = e.startTime
      }
      window.setTimeout(sendCwv, 6000)
    })
    po.observe({ type: 'largest-contentful-paint', buffered: true })
    const poCls = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as { hadRecentInput?: boolean; value?: number }[]) {
        if (!e.hadRecentInput) cls += e.value ?? 0
      }
    })
    poCls.observe({ type: 'layout-shift', buffered: true })
    const poInp = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as PerformanceEventTiming[]) {
        inp = Math.max(inp, e.duration || 0)
      }
    })
    try {
      poInp.observe({ type: 'event', buffered: true })
    } catch {
      /* INP unsupported in this browser */
    }
    const paints = performance.getEntriesByType('paint')
    const f = paints.find((p) => p.name === 'first-contentful-paint')
    if (f) fcp = f.startTime
    window.addEventListener('load', () => window.setTimeout(sendCwv, 1000))
  } catch {
    /* performance observers unsupported */
  }

  // ---- JS errors ----
  const onError = (e: ErrorEvent) => {
    if (e.message && e.message.includes('analytics')) return
    track('js_error', page, { message: String(e.message || 'unknown').slice(0, 300) })
  }
  const onRejection = (e: PromiseRejectionEvent) => {
    track('js_error', page, { type: 'rejection', message: String(e.reason ?? '').slice(0, 300) })
  }
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)

  // ---- broken images ----
  document.addEventListener(
    'error',
    (e) => {
      const t = e.target as HTMLElement | null
      if (t && t.tagName === 'IMG') {
        const src = (t as HTMLImageElement).src || ''
        if (src) track('image_error', page, { src: src.slice(0, 300), _dedupKey: src })
      }
    },
    true,
  )

  // ---- tracking pipeline self-monitoring ----
  try {
    const fails = Number(localStorage.getItem('tn_track_fail') || '0')
    if (fails > 0) {
      track('tracking_fail', page, { count: fails })
      localStorage.removeItem('tn_track_fail')
    }
  } catch {
    /* ignore */
  }

  // ---- scroll listener fallback cleanup ----
  window.setTimeout(onScroll, 3000)
}

/**
 * Fire a page_view when Next.js App Router performs a client-side navigation
 * (usePathname changes). Keeps per-page stats accurate for new pages/posts/
 * products without any per-item setup.
 */
export function onRouteChange(pathname: string) {
  if (typeof window === 'undefined' || !initialized) return
  const p = pathname || window.location.pathname
  if (!p || p === currentPage) return
  // Flush the time spent on the page we are leaving: SPA navigations never
  // fire pagehide, so without this the previous page's time-on-page is lost
  // (and its exit never recorded).
  const seconds = Math.round((Date.now() - pageStart) / 1000)
  if (seconds >= 2 && currentPage) track('time_on_page', currentPage, { seconds })
  currentPage = p
  pageStart = Date.now()
  for (const k of Object.keys(scrollSent)) delete scrollSent[Number(k)]
  track('page_view', p)
  pixelFor('page_view')
}
