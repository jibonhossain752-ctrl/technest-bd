import Link from 'next/link'
import type { QuickLookGuide } from '@/data/quick-look-content'
import { getPostsForProduct, postHref } from '@/data/quick-look-links'
import { SITE } from '@/lib/site'

interface QuickLookGuideProps {
  guide: QuickLookGuide
  /** Product slug — the key the cross-link reverse lookup uses. */
  productSlug: string
}

/**
 * Long-form buying-guide section for /quick-look/[slug] — rendered below the
 * spec sheet.
 *
 * Section order is the shared Quick Look structure: overview with a
 * direct-answer lead, price and availability, key features explained, who
 * should buy and skip, pros and cons, buying tips, FAQ, related blog posts,
 * then the internal-link cards.
 *
 * Rules this component follows (see memory.md):
 * - The page's H1 is the product title in QuickLookDetail, so this section
 *   starts at H2 and sub-parts use H3/H4 — heading levels never skip.
 * - All text is server-rendered and visible by default: no accordions, nothing
 *   collapsed, so the FAQ markup matches what a reader actually sees.
 * - Blog cards come from the cross-link reverse lookup (max 2), and any post
 *   already linked in the guide's own "Keep exploring" cards is filtered out so
 *   no link renders twice on one page.
 * - Blog posts are excluded from the data's own `links` array on purpose —
 *   that block is the reverse lookup's job.
 */
export default function QuickLookGuideSection({ guide, productSlug }: QuickLookGuideProps) {
  const relatedPosts = getPostsForProduct(productSlug).filter(
    (post) => !guide.links.some((link) => link.href === postHref(post)),
  )

  return (
    <section className="ql-guide" aria-label="Buying guide">
      <div className="container">
        <h2 className="ql-guide-heading">{guide.heading}</h2>
        <p className="ql-guide-lead">{guide.lead}</p>

        {guide.overview.map((paragraph) => (
          <p className="ql-body" key={paragraph.slice(0, 40)}>
            {paragraph}
          </p>
        ))}

        <div className="ql-block">
          <h3>{guide.priceSection.heading}</h3>
          {/* The money section is the guide's buying surface, so the Amazon
              Associates disclosure appears here in plain visible text as well
              as beside the buy button above. */}
          <p className="ql-disclosure">{SITE.amazonDisclosure}</p>
          {guide.priceSection.paragraphs.map((paragraph) => (
            <p className="ql-body" key={paragraph.slice(0, 40)}>
              {paragraph}
            </p>
          ))}

          {guide.keyFacts && guide.keyFacts.length > 0 && (
            <dl className="ql-facts">
              {guide.keyFacts.map((fact) => (
                <div className="ql-fact" key={fact.term}>
                  <dt>{fact.term}</dt>
                  <dd>{fact.detail}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {guide.features.length > 0 && (
          <div className="ql-block">
            <h3>{guide.features[0].heading}</h3>
            <div className="ql-card-grid">
              {guide.features.map((feature) => (
                <div className="ql-card" key={feature.title}>
                  <h4>{feature.title}</h4>
                  <p>{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ql-block">
          <h3>{guide.buyers.heading}</h3>
          <div className="ql-card-grid">
            <div className="ql-card">
              <h4>Who should buy the {guide.productName}</h4>
              <ul className="ql-list check">
                {guide.buyers.should.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="ql-card">
              <h4>Who should skip it</h4>
              <ul className="ql-list cross">
                {guide.buyers.skip.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="ql-block">
          <h3>{guide.pros.heading}</h3>
          <div className="ql-card-grid">
            <div className="ql-card">
              <h4>Pros</h4>
              <ul className="ql-list check">
                {guide.pros.pros.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="ql-card">
              <h4>Cons</h4>
              <ul className="ql-list cross">
                {guide.pros.cons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="ql-block">
          <h3>{guide.buyingTips.heading}</h3>
          {guide.buyingTips.paragraphs.map((paragraph) => (
            <p className="ql-body" key={paragraph.slice(0, 40)}>
              {paragraph}
            </p>
          ))}
        </div>

        <div className="ql-block">
          <h3>Frequently asked questions: {guide.productName}</h3>
          <div className="ql-faq-grid">
            {guide.faqs.map((faq) => (
              <div className="ql-faq" key={faq.question}>
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="ql-block">
            <h3>From our blog</h3>
            <div className="ql-card-grid">
              {relatedPosts.map((post) => (
                <Link className="ql-card ql-link-card" key={post.slug} href={postHref(post)}>
                  <h4>{post.title}</h4>
                  <p>
                    {post.category} · {post.readTime}
                  </p>
                  <span className="ql-link-cta">Read the article →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="ql-block">
          <h3>Keep exploring</h3>
          <div className="ql-card-grid three">
            {guide.links.map((link) => (
              <Link className="ql-card ql-link-card" key={link.href} href={link.href}>
                <h4>{link.label}</h4>
                <p>{link.description}</p>
                <span className="ql-link-cta">View →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
