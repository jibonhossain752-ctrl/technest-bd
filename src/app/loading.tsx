export default function Loading() {
  return (
    <div className="loading-page" aria-label="Loading" role="status">
      <div className="container">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton-grid" style={{ marginTop: 40 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton skeleton-img" />
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line btn" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
