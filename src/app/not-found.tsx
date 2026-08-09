import Link from 'next/link'
import NotFoundTracker from '@/components/NotFoundTracker'

export default function NotFound() {
  return (
    <section className="not-found container">
      <NotFoundTracker />
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className="btn btn-primary">
        Back to Home
      </Link>
    </section>
  )
}
