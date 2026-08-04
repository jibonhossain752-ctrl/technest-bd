interface Brand {
  name: string
  mark: string
}

const BRANDS: Brand[] = [
  { name: 'Apple', mark: '' },
  { name: 'Samsung', mark: 'S' },
  { name: 'Xiaomi', mark: 'M' },
  { name: 'Sony', mark: 'S' },
  { name: 'HP', mark: '' },
  { name: 'Dell', mark: '' },
  { name: 'Lenovo', mark: '' },
  { name: 'Asus', mark: '' },
  { name: 'Logitech', mark: '' },
  { name: 'Anker', mark: '' },
]

export default function BrandStrip() {
  return (
    <section className="brands" aria-label="Brands we sell">
      <div className="container">
        <div className="brand-row">
          {BRANDS.map((brand) => (
            <span key={brand.name} className="brand-logo" title={brand.name}>
              {brand.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
