export const CATEGORY_BADGE: Record<string, string> = {
  'Buying Guide': 'badge-yellow',
  Roundup: 'badge-orange',
  'Tips & Tricks': 'badge-navy',
  Explainer: 'badge-teal',
}

export function categoryBadgeClass(category: string): string {
  return CATEGORY_BADGE[category] ?? 'badge-navy'
}
