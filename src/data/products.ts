export interface Product {
  id: string
  slug: string
  name: string
  category: string
  categorySlug: string
  price: number
  oldPrice?: number
  image: string
  badge?: 'hot' | 'new' | 'sale'
  rating: number
  reviews: number
  isFlashSale?: boolean
  isNew?: boolean
  description: string
  features: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    slug: 'apple-macbook-air-m2',
    name: 'Apple MacBook Air M2',
    category: 'Laptops & PCs',
    categorySlug: 'laptops',
    price: 999,
    oldPrice: 1099,
    image: '💻',
    badge: 'hot',
    rating: 4.9,
    reviews: 320,
    isFlashSale: true,
    description:
      'The Apple MacBook Air with the M2 chip delivers incredible performance in a thin and light design. Perfect for work, study and creative tasks.',
    features: [
      'Apple M2 chip with 8-core CPU',
      '13.6-inch Liquid Retina display',
      'Up to 18 hours of battery life',
      '8GB unified memory, 256GB SSD',
      'MagSafe charging and 2x Thunderbolt ports',
    ],
  },
  {
    id: 'p2',
    slug: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    price: 1199,
    image: '📱',
    badge: 'new',
    rating: 4.8,
    reviews: 415,
    isNew: true,
    description:
      'Samsung Galaxy S24 Ultra with Galaxy AI — the ultimate Android flagship with an incredible 200MP camera and built-in S Pen.',
    features: [
      '6.8-inch Dynamic AMOLED 2X display',
      '200MP main camera with 100x zoom',
      'Galaxy AI features built-in',
      '5000mAh battery, Snapdragon 8 Gen 3',
      'S Pen included',
    ],
  },
  {
    id: 'p3',
    slug: 'sony-wh-1000xm5',
    name: 'Sony WH-1000XM5 Headphones',
    category: 'Audio & Wearables',
    categorySlug: 'audio-wearables',
    price: 349,
    oldPrice: 399,
    image: '🎧',
    badge: 'sale',
    rating: 4.7,
    reviews: 260,
    isFlashSale: true,
    description:
      'Industry-leading noise cancelling headphones with exceptional sound quality, comfort and up to 30 hours of battery life.',
    features: [
      'Industry-leading noise cancellation',
      'Up to 30 hours battery life',
      'Hi-Res Audio support',
      'Multipoint connection',
      'Comfortable lightweight design',
    ],
  },
  {
    id: 'p4',
    slug: 'logitech-mx-master-3s',
    name: 'Logitech MX Master 3S',
    category: 'Accessories',
    categorySlug: 'accessories',
    price: 99,
    image: '🖱️',
    rating: 4.6,
    reviews: 190,
    description:
      'The ultimate productivity mouse with an 8K DPI sensor, quiet clicks and Flow cross-computer control.',
    features: [
      '8K DPI optical sensor',
      'Silent clicks',
      'MagSpeed electromagnetic scrolling',
      'Flow across computers and OS',
      'USB-C fast charging',
    ],
  },
  {
    id: 'p5',
    slug: 'keychron-k2-keyboard',
    name: 'Keychron K2 Mechanical Keyboard',
    category: 'Gaming Gear',
    categorySlug: 'gaming',
    price: 89,
    oldPrice: 99,
    image: '⌨️',
    badge: 'sale',
    rating: 4.8,
    reviews: 145,
    isFlashSale: true,
    description:
      'A hot-swappable wireless mechanical keyboard with RGB backlight and long-lasting battery. Great for both typing and gaming.',
    features: [
      'Hot-swappable switches',
      'Wireless Bluetooth + wired mode',
      'RGB backlighting',
      'Aluminum frame',
      '4000mAh battery',
    ],
  },
  {
    id: 'p6',
    slug: 'anker-65w-gan-charger',
    name: 'Anker 65W GaN Charger',
    category: 'Accessories',
    categorySlug: 'accessories',
    price: 39,
    oldPrice: 49,
    image: '🔌',
    rating: 4.5,
    reviews: 530,
    description:
      'A compact dual-port GaN charger that can fast-charge your laptop, phone and more from a single plug.',
    features: [
      '65W total output',
      '2x USB-C + 1x USB-A',
      'GaN II technology, compact size',
      'ActiveShield 2.0 safety',
      'PD 3.0 fast charging',
    ],
  },
  {
    id: 'p7',
    slug: 'playstation-5-console',
    name: 'PlayStation 5 Console',
    category: 'Gaming Gear',
    categorySlug: 'gaming',
    price: 499,
    image: '🎮',
    badge: 'hot',
    rating: 4.9,
    reviews: 280,
    isNew: true,
    description:
      'Experience lightning-fast loading with the PS5 SSD and immersive 3D audio in the latest AAA games.',
    features: [
      'Custom 8-core AMD CPU',
      'Ultra-fast SSD storage',
      'Ray tracing support',
      'DualSense haptic feedback',
      'Backwards compatible',
    ],
  },
  {
    id: 'p8',
    slug: 'apple-watch-series-9',
    name: 'Apple Watch Series 9',
    category: 'Audio & Wearables',
    categorySlug: 'audio-wearables',
    price: 399,
    oldPrice: 429,
    image: '⌚',
    badge: 'sale',
    rating: 4.7,
    reviews: 210,
    description:
      'Stay healthy and connected with advanced health sensors, a brighter display and the S9 chip.',
    features: [
      'Retina display, 2000 nits',
      'Health and fitness tracking',
      'ECG and blood oxygen app',
      'S9 SiP chip',
      'Crash detection',
    ],
  },
  {
    id: 'p9',
    slug: 'canon-eos-r50-camera',
    name: 'Canon EOS R50 Camera',
    category: 'Cameras',
    categorySlug: 'cameras',
    price: 699,
    image: '📷',
    rating: 4.6,
    reviews: 120,
    description:
      'A compact mirrorless camera with 4K video, superb autofocus and a lightweight body made for creators.',
    features: [
      '24.2MP APS-C sensor',
      '4K 30fps video',
      'Dual Pixel CMOS AF II',
      'Vari-angle touchscreen',
      '3.4fps continuous shooting',
    ],
  },
  {
    id: 'p10',
    slug: 'tp-link-archer-ax55-router',
    name: 'TP-Link Archer AX55 Router',
    category: 'Networking',
    categorySlug: 'networking',
    price: 89,
    image: '📡',
    rating: 4.4,
    reviews: 175,
    description:
      'A high-speed Wi-Fi 6 router that keeps your whole home connected with low latency and great coverage.',
    features: [
      'Wi-Fi 6 (AX3000) speed',
      '4x Gigabit LAN ports',
      'OFDMA & MU-MIMO',
      'TP-Link HomeShield security',
      'App-based setup',
    ],
  },
  {
    id: 'p11',
    slug: 'xiaomi-robot-vacuum-s10',
    name: 'Xiaomi Robot Vacuum S10',
    category: 'Smart Home',
    categorySlug: 'smart-home',
    price: 249,
    image: '🏠',
    rating: 4.5,
    reviews: 95,
    isNew: true,
    description:
      'An intelligent robot vacuum with laser navigation, strong suction and mopping that keeps your floors spotless.',
    features: [
      'LDS laser navigation',
      '4000Pa suction power',
      'Vacuum + mop in one',
      'App control and scheduling',
      '2.5L large dust bag',
    ],
  },
  {
    id: 'p12',
    slug: 'dell-inspiron-15-laptop',
    name: 'Dell Inspiron 15 Laptop',
    category: 'Laptops & PCs',
    categorySlug: 'laptops',
    price: 699,
    image: '🖥️',
    rating: 4.5,
    reviews: 210,
    description:
      'A dependable 15-inch everyday laptop with a fast processor, big display and all the ports you need.',
    features: [
      'Intel Core i5-1340P',
      '16GB RAM, 512GB SSD',
      '15.6" FHD display',
      'Backlit keyboard',
      'Wi-Fi 6 and Bluetooth 5.3',
    ],
  },
  {
    id: 'p13',
    slug: 'xiaomi-redmi-note-13',
    name: 'Xiaomi Redmi Note 13 Pro',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    price: 299,
    oldPrice: 329,
    image: '🤳',
    badge: 'sale',
    rating: 4.6,
    reviews: 620,
    description:
      'A best-value smartphone with a stunning AMOLED display, 200MP camera and all-day battery.',
    features: [
      '6.67" 120Hz AMOLED display',
      '200MP triple camera',
      '67W fast charging',
      'Snapdragon 7s Gen 2',
      '5100mAh battery',
    ],
  },
  {
    id: 'p14',
    slug: 'jbl-flip-6-speaker',
    name: 'JBL Flip 6 Speaker',
    category: 'Audio & Wearables',
    categorySlug: 'audio-wearables',
    price: 129,
    image: '🔊',
    rating: 4.7,
    reviews: 340,
    description:
      'A rugged, waterproof portable Bluetooth speaker with rich, powerful sound and long battery life.',
    features: [
      'IP67 waterproof & dustproof',
      '12 hours playtime',
      'Rich JBL Original Pro sound',
      'PartyBoost pairing',
      'USB-C charging',
    ],
  },
  {
    id: 'p15',
    slug: 'msi-katana-15-gaming-laptop',
    name: 'MSI Katana 15 Gaming Laptop',
    category: 'Laptops & PCs',
    categorySlug: 'laptops',
    price: 1299,
    oldPrice: 1399,
    image: '🎒',
    badge: 'hot',
    rating: 4.8,
    reviews: 88,
    isFlashSale: true,
    description:
      'A powerful gaming laptop with RTX graphics and a 144Hz display for smooth, high-framerate gaming.',
    features: [
      'Intel Core i7-13620H',
      'NVIDIA RTX 4060 8GB',
      '15.6" 144Hz FHD display',
      '16GB DDR5 RAM, 1TB SSD',
      'Cooler Boost 5 cooling',
    ],
  },
  {
    id: 'p16',
    slug: 'google-nest-hub-smart-display',
    name: 'Google Nest Hub Smart Display',
    category: 'Smart Home',
    categorySlug: 'smart-home',
    price: 99,
    image: '🖼️',
    rating: 4.4,
    reviews: 130,
    description:
      'Control your smart home, follow recipes and stream video with this handy 7-inch smart display.',
    features: [
      '7-inch touch display',
      'Built-in Google Assistant',
      'Matter & Thread support',
      'Sleep sensing',
      'Video calling support',
    ],
  },
]

export interface ShopView {
  slug: string
  name: string
  description: string
}

export const SHOP_VIEWS: ShopView[] = [
  {
    slug: 'featured',
    name: 'Featured',
    description: 'Best-sellers our customers love',
  },
  {
    slug: 'flash-sale',
    name: 'Flash Sale',
    description: 'Limited-time deals ending soon — grab them fast',
  },
  {
    slug: 'new-arrivals',
    name: 'New Arrivals',
    description: 'Fresh off the shelf — be the first to own them',
  },
]

export const FLASH_SALE_IDS = PRODUCTS.filter((p) => p.isFlashSale).map((p) => p.id)
export const NEW_ARRIVALS_IDS = PRODUCTS.filter((p) => p.isNew).map((p) => p.id)

export const getProductById = (id: string): Product | undefined =>
  PRODUCTS.find((p) => p.id === id)

export const getProductBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((p) => p.slug === slug)

export const getRelatedProducts = (product: Product, limit = 4): Product[] =>
  PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
  ).slice(0, limit)

export const getShopViewBySlug = (slug: string): ShopView | undefined =>
  SHOP_VIEWS.find((v) => v.slug === slug)

export const formatUSD = (value: number): string =>
  `$${value.toLocaleString('en-US')}`
