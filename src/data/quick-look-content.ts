/**
 * Long-form Quick Look content, keyed by product slug.
 *
 * RULES (standing rules — see memory.md):
 * - Every spec, number and claim is traceable to the product's own listing data
 *   or a named manufacturer / retailer source (see `specSource` in
 *   src/data/quick-look.ts). Unknown specs stay OUT. Estimates are labelled as
 *   estimates. Nothing is copied from another site or project.
 * - Each product's text is written from scratch for a US reader. No shared
 *   template with the product name swapped in.
 * - No price numbers appear in this copy. Amazon prices change constantly, so
 *   the page shows the call to action instead (see src/lib/site.ts).
 * - The FAQ array here drives BOTH the visible FAQ cards and the FAQPage
 *   JSON-LD, so the marked-up text always matches what a reader sees.
 * - The page's product name is the only H1; this section starts at H2 and never
 *   skips a level. Aim for roughly 1,000 words of prose per guide — long enough
 *   to answer the buyer's questions, short enough that nothing is padded.
 */

export interface QuickLookLink {
  label: string
  description: string
  href: string
}

export interface QuickLookGuide {
  /** Bare product name, used in headings the component builds. */
  productName: string
  /** H2 that opens the guide section. */
  heading: string
  /** Direct-answer lead: what it is and who it suits, in two or three sentences. */
  lead: string
  overview: string[]
  /** Where to buy and what the price does — never a number. */
  priceSection: { heading: string; paragraphs: string[] }
  /** Optional verified key facts, rendered as a semantic <dl>. */
  keyFacts?: { term: string; detail: string }[]
  features: { heading: string; title: string; body: string }[]
  buyers: { heading: string; should: string[]; skip: string[] }
  pros: { heading: string; pros: string[]; cons: string[] }
  buyingTips: { heading: string; paragraphs: string[] }
  faqs: { question: string; answer: string }[]
  /** "Keep exploring" cards. Blog posts are deliberately left out — the
   *  cross-link reverse lookup adds those, so no link renders twice. */
  links: QuickLookLink[]
}

export const QUICK_LOOK_GUIDES: Record<string, QuickLookGuide> = {
  'sony-wh-1000xm5-headphones': {
    productName: 'Sony WH-1000XM5',
    heading: 'Sony WH-1000XM5 specs, features and buying guide',
    lead: 'The Sony WH-1000XM5 is an over-ear wireless noise-canceling headphone with a closed 30 mm driver, a touch-sensitive control panel and up to 30 hours of playback with noise canceling switched on. It suits commuters, long-haul flyers and anyone working in an open office who wants the room to go quiet without putting anything in their ears.',
    overview: [
      'It is one of the best-known models in Sony’s 1000X line. Sony rates the battery at up to 30 hours with noise canceling on and up to 40 hours with it off, and quotes a ten-minute quick charge for up to five hours — enough to cover a commute you forgot to plug in for. A full recharge over USB-C takes about three and a half hours.',
      'Two things are worth knowing before the rest of this page. The headset is not waterproof — Sony’s help guide says so, and warns that charging it while it is wet with rain or sweat can damage it, so this is a desk, plane and train headphone rather than a gym one. And the price moves constantly, so no figure appears here; the button on this page opens the live listing instead.',
      'Everything below comes from Sony’s published specification sheet and help guide plus the product’s own Amazon listing data. We do not run headphone measurements, so treat the notes on sound and noise canceling as what the hardware is built to do rather than results we measured.',
    ],
    priceSection: {
      heading: 'What the Sony WH-1000XM5 costs',
      paragraphs: [
        'Amazon adjusts prices constantly, so this page shows no number rather than one that may already be out of date — the listing is the only place a current price is accurate. One pattern is worth knowing: this model is discounted often, especially around major sale events, and the drop is usually temporary. If you need headphones today, buying at list price costs more than waiting a few weeks.',
      ],
    },
    keyFacts: [
      { term: 'Driver unit', detail: '30 mm, closed dynamic over-ear' },
      { term: 'Playback time', detail: 'Up to 30 hours with noise canceling on' },
      { term: 'With noise canceling off', detail: 'Up to 40 hours' },
      { term: 'Charge time', detail: 'Approx. 3.5 hours over USB-C' },
      { term: 'Weight', detail: 'Approx. 250 g (8.82 oz)' },
      { term: 'Wired listening', detail: '3.5 mm cable included' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'Noise canceling that re-tunes itself',
        body: 'Sony’s listing credits the WH-1000XM5 with an Auto NC Optimizer, which adjusts the noise canceling to your surroundings and to how the headphones are sitting on your head. That matters more than it sounds: a seal changes when you put on glasses, a hat or a scarf, and a fixed profile gets weaker as soon as it does. Microphones on both sides do the listening and cover calls as well, so there is no boom arm to unfold before you can talk.',
      },
      {
        heading: 'Key features explained',
        title: 'Up to 30 hours, and a fast top-up',
        body: 'Sony rates the battery at up to 30 hours with noise canceling on and up to 40 hours with it off. Those are manufacturer figures measured under set conditions and they will not match your own number exactly, because volume, codec and temperature all move the needle. Practically, a full charge covers roughly a week of commuting, and ten minutes plugged in is quoted at up to five hours of playback.',
      },
      {
        heading: 'Key features explained',
        title: 'Touch controls on the ear cup',
        body: 'The right ear cup is a touch panel rather than a row of buttons. Per Sony’s help guide, a double tap plays and pauses, a forward or backward swipe skips tracks, and a swipe up or down changes the volume. It is quick once it becomes habit and it removes the guesswork of hunting for a small button. The trade-off is that a tap meant for the volume also lands when you adjust the headphones.',
      },
      {
        heading: 'Key features explained',
        title: 'Two devices, and a cable when you need one',
        body: 'Multipoint keeps the headset connected to two devices at once, so a laptop and a phone can both reach it without re-pairing: the music pauses when a call comes in and resumes afterwards. The box also includes a 3.5 mm cable, and Sony’s help guide documents wired listening with the headset switched off — which is what makes it a decent travel headphone, since a flat battery does not lock you out.',
      },
    ],
    buyers: {
      heading: 'Who should buy the Sony WH-1000XM5, and who should skip it',
      should: [
        'Commuters and frequent flyers who want engine and train noise pushed down without wearing earbuds.',
        'Open-office workers who need to drop into focus without moving desks.',
        'Anyone on a lot of calls: the microphones are built in, so there is nothing to unfold first.',
        'People juggling a laptop and a phone, because multipoint holds both connections at once.',
      ],
      skip: [
        'Anyone who trains or runs in them — Sony states the headset is not waterproof.',
        'Sweaty commuters: the same warning applies to charging them while they are damp.',
        'People who need a headphone that folds into a coat pocket — this one travels in its case.',
        'Buyers who want the lowest price on noise canceling — the budget tier has closed much of the gap and costs far less.',
      ],
    },
    pros: {
      heading: 'Sony WH-1000XM5 pros and cons',
      pros: [
        'Up to 30 hours with noise canceling on, up to 40 hours with it off',
        'Ten-minute quick charge for up to five hours, per Sony',
        'Auto NC Optimizer re-tunes as your seal changes',
        'Multipoint keeps two devices connected at once',
        'Touch controls and a 3.5 mm cable for wired listening',
      ],
      cons: [
        'Not waterproof, and Sony warns against charging it while wet',
        'Does not fold down, so it travels in its case rather than a pocket',
        'The touch panel reacts when you adjust the headphones',
        'Battery figures are Sony’s own ratings, not independent measurements',
      ],
    },
    buyingTips: {
      heading: 'Buying the Sony WH-1000XM5 in the US',
      paragraphs: [
        'Popular headphones attract counterfeits and mismatched listings, so buy from a seller you can trace and read the warranty terms on the listing itself. If it does not state that the item is an authorized Sony product with a Sony warranty, treat that as the reason to look elsewhere rather than a detail to sort out later. Sony sells more than one version of this headset in different regions and the contents of the box are not identical between them — the carrying case is the accessory that disappears first — so check the "what’s in the box" section of the exact listing you are buying. Then think about how you will use it: if it lives in a bag the case matters, and if you want in-flight movie audio, confirm the 3.5 mm lead is included rather than a charging cable alone.',
      ],
    },
    faqs: [
      {
        question: 'Is the Sony WH-1000XM5 waterproof?',
        answer:
          'No. Sony’s help guide states that the headset is not waterproof, and warns that charging it while it is wet with rain or sweat can cause damage. Keep it out of the rain and let it dry before plugging it in.',
      },
      {
        question: 'How long does the WH-1000XM5 battery last?',
        answer:
          'Sony rates it at up to 30 hours of playback with noise canceling on and up to 40 hours with it off. Those are manufacturer figures, so your own runtime varies with volume, codec and temperature.',
      },
      {
        question: 'How long does the WH-1000XM5 take to charge?',
        answer:
          'About three and a half hours for a full charge over USB-C. Sony also quotes a quick charge of ten minutes for up to five hours of playback.',
      },
      {
        question: 'Can the WH-1000XM5 connect to two devices at once?',
        answer:
          'Yes. It supports multipoint, so a laptop and a phone both stay connected and audio switches to whichever device starts playing or rings.',
      },
      {
        question: 'Can you use the WH-1000XM5 wired?',
        answer:
          'Yes. A 3.5 mm headphone cable is included, and Sony’s help guide documents wired listening with the headset switched off, so a flat battery does not stop you listening.',
      },
      {
        question: 'Which Bluetooth codecs does the WH-1000XM5 support?',
        answer:
          'SBC, AAC and LDAC. LDAC carries more data than standard Bluetooth audio and needs a compatible source, such as a recent Android phone.',
      },
    ],
    links: [
      {
        label: 'Audio & wearables',
        href: '/shop/audio-wearables',
        description: 'Every headphone, earbud and wearable the store carries.',
      },
      {
        label: 'Full product listing',
        href: '/product/sony-wh-1000xm5-headphones',
        description: 'The shop page for this headphone, with current price on Amazon.',
      },
      {
        label: 'Today’s deals',
        href: '/deals',
        description: 'The catalog filtered down to products that are discounted right now.',
      },
      {
        label: 'All Quick Look spec sheets',
        href: '/quick-look',
        description: 'Browse the rest of the Quick Look section.',
      },
    ],
  },
}

export function getQuickLookGuide(slug: string): QuickLookGuide | undefined {
  return QUICK_LOOK_GUIDES[slug]
}
