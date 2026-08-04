export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  author: string
  emoji: string
  readTime: string
  content: string[]
}

export const POSTS: BlogPost[] = [
  {
    slug: 'how-to-choose-the-perfect-laptop-in-2026',
    title: 'How to Choose the Perfect Laptop in 2026',
    excerpt:
      'From processors to displays, here is everything you need to know before buying your next laptop in Bangladesh.',
    category: 'Buying Guide',
    date: '2026-07-28',
    author: 'TechNest BD Team',
    emoji: '💻',
    readTime: '6 min read',
    content: [
      'Buying a laptop can feel overwhelming with so many options on the market. The good news is that by focusing on your actual needs, you can narrow down the choices quickly.',
      'First, decide what you will use the laptop for. Students and office workers need portability and battery life, while creators and gamers need performance and graphics power. Budget should be set before you start comparing specs.',
      'Next, look at the processor. For everyday tasks, a modern Intel Core i5 or AMD Ryzen 5 is plenty. Creative work and gaming benefit from Core i7/i9 or Ryzen 7/9 chips with more cores and threads.',
      'RAM and storage matter just as much. We recommend at least 8GB of RAM, though 16GB is becoming the sweet spot. For storage, an SSD is essential — it makes your system feel dramatically faster than an older hard drive.',
      'Finally, check the display, ports and build quality. A 1080p IPS panel with good brightness is ideal for most users. Make sure the laptop has the ports you need, such as USB-C, HDMI and a headphone jack.',
      'Once you know what you need, compare prices across genuine sellers and look for official warranty. That combination gives you the best value for your money.',
    ],
  },
  {
    slug: 'top-5-budget-smartphones-this-month',
    title: 'Top 5 Budget Smartphones This Month',
    excerpt:
      'Great camera, big battery and smooth display — all without breaking the bank. Our monthly picks under BDT 40,000.',
    category: 'Roundup',
    date: '2026-07-15',
    author: 'Sadia Nahar',
    emoji: '📱',
    readTime: '4 min read',
    content: [
      'Budget smartphones have come a long way. This month, we picked the five best phones under BDT 40,000 that offer the most value for everyday users.',
      'The Xiaomi Redmi Note 13 Pro tops our list with a 200MP camera, AMOLED display and 67W fast charging. It is hard to beat at this price point.',
      'For those who prefer a cleaner software experience, the Samsung Galaxy A-series remains a solid choice with long software support and reliable performance.',
      'Gamers on a budget will appreciate phones with 120Hz displays and capable mid-range chips, which are now widely available from brands like Poco and Realme.',
      'When buying a budget phone, focus on battery life, display quality and software updates rather than raw specs on paper.',
      'Remember to buy from a genuine seller to get proper warranty and after-sales support. Check our shop for this month\'s best deals.',
    ],
  },
  {
    slug: 'how-to-extend-your-phone-battery-life',
    title: '10 Easy Ways to Extend Your Phone Battery Life',
    excerpt:
      'Simple settings changes and habits that can make your phone last noticeably longer on a single charge.',
    category: 'Tips & Tricks',
    date: '2026-07-02',
    author: 'Mahir Islam',
    emoji: '🔋',
    readTime: '5 min read',
    content: [
      'A phone that barely lasts a day is frustrating. Luckily, a few small changes can significantly improve your battery life.',
      'Start by reducing screen brightness and using adaptive brightness. The display is often the biggest power drain on any phone.',
      'Turn off background app refresh for apps you rarely use, and disable location services for apps that do not need them.',
      'Use Wi-Fi instead of mobile data when possible, and switch to Airplane mode in areas with poor signal — your phone burns battery constantly searching for a network.',
      'Enable battery saver mode and restrict notifications from apps you do not care about. Dark mode can also help on OLED screens.',
      'Avoid letting your battery drop to zero regularly. Keeping it between 20% and 80% extends the overall lifespan of the battery.',
    ],
  },
  {
    slug: 'what-is-wi-fi-6-and-why-it-matters',
    title: 'What is Wi-Fi 6 and Why It Matters for Your Home',
    excerpt:
      'Faster speeds, lower latency and better support for many devices — here is why Wi-Fi 6 routers are worth the upgrade.',
    category: 'Explainer',
    date: '2026-06-20',
    author: 'TechNest BD Team',
    emoji: '📡',
    readTime: '5 min read',
    content: [
      'Wi-Fi 6, also known as 802.11ax, is the newest generation of wireless networking. It brings major improvements over Wi-Fi 5, especially in homes with many connected devices.',
      'The biggest benefit is speed. Wi-Fi 6 can deliver multi-gigabit throughput, though real-world speeds depend on your internet plan and devices.',
      'More importantly, Wi-Fi 6 handles congestion much better. Technologies like OFDMA and MU-MIMO let your router talk to many devices at once without slowing down.',
      'Latency is also lower, which is great for gaming, video calls and smart home devices. Battery life improves too, thanks to Target Wake Time.',
      'To take full advantage, both your router and your devices need to support Wi-Fi 6. Most modern phones, laptops and TVs already do.',
      'If you have many devices at home or work from home, upgrading to a Wi-Fi 6 router is one of the best tech upgrades you can make.',
    ],
  },
  {
    slug: 'buying-guide-gaming-gear-in-bangladesh',
    title: 'Gaming Gear Buying Guide for Beginners',
    excerpt:
      'Keyboards, mice, headsets and more — how to build your first gaming setup on a budget in Bangladesh.',
    category: 'Buying Guide',
    date: '2026-06-05',
    author: 'Rakib Ahmed',
    emoji: '🎮',
    readTime: '7 min read',
    content: [
      'A great gaming setup does not need to cost a fortune. With a little planning, you can build a solid starter kit that covers all the essentials.',
      'Start with the peripheral you touch the most: the mouse. Look for a comfortable shape, reliable sensor and a couple of extra buttons. Wired mice offer the best value at entry level.',
      'For keyboards, mechanical options from brands like Keychron deliver a satisfying typing and gaming experience. Hot-swappable models let you customize switches later.',
      'A headset with a good microphone is important for team games. Prioritize comfort for long sessions and look for models with clear voice capture.',
      'Don\'t forget the desk setup — a large mouse pad, a stable desk and good lighting make a huge difference in comfort.',
      'Buy from a store that offers genuine warranty. Your gear is an investment, and proper after-sales support protects it.',
    ],
  },
]

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  POSTS.find((p) => p.slug === slug)
