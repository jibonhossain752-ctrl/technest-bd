export function reportNewsletterSignup(
  email: string,
  source: 'section' | 'widget' | 'quick',
) {
  void fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
  }).catch(() => {})
}