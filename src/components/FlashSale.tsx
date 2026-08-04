import Link from 'next/link'
import { getProductById, FLASH_SALE_IDS } from '@/data/products'
import ProductGrid from './ProductGrid'
import CountdownTimer from './ui/CountdownTimer'

export default function FlashSale() {
  const flashProducts = FLASH_SALE_IDS.map(getProductById).filter(
    (p) => p !== undefined,
  )

  return (
    <section className="flash-sale">
      <div className="container">
        <div className="section-head">
          <h2>⚡ Flash Sale</h2>
          <p>Sale ends in:</p>
          <CountdownTimer />
        </div>
        <ProductGrid products={flashProducts} />
        <div className="section-more">
          <Link href="/shop/flash-sale" className="btn btn-primary">
            View All Deals
          </Link>
        </div>
      </div>
    </section>
  )
}
