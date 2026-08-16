import IMAGE_VARIANTS from '@/data/imageVariants'

export function responsiveSrcset(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined
  const base = imageUrl.split('/').pop()
  if (!base) return undefined
  const widths = IMAGE_VARIANTS[base]
  if (!widths?.length) return undefined
  return widths
    .map((w) => `${imageUrl.replace(/\.webp$/, '')}-${w}w.webp ${w}w`)
    .join(', ')
}