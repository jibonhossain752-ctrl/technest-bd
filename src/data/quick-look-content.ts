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
 * - No prices appear in this copy, and the absence of one is never explained
 *   either: the listing is one click away and the button label says so.
 *   Listing-warranty text is never repeated — those terms belong to the seller.
 * - The FAQ array here drives BOTH the visible FAQ cards and the FAQPage
 *   JSON-LD, so the marked-up text always matches what a reader sees.
 * - The page's product name is the only H1; this section starts at H2 and never
 *   skips a level. Aim for roughly 2,200–2,600 words of visible prose per guide
 *   (spec tables and link cards are not part of that count): depth where buyers
 *   actually have questions, never padding.
 */

export interface QuickLookLink {
  label: string
  description: string
  href: string
}

/**
 * A comparison table inside a guide section. The first cell of every row is the
 * row header, so the table reads correctly for a screen reader.
 */
export interface QuickLookTable {
  head: string[]
  rows: string[][]
}

/**
 * One optional guide section: an H3 with prose plus any sub-parts the product
 * needs. Every part renders through classes the page already uses, so a deeper
 * guide needs no new layout.
 */
export interface QuickLookSection {
  heading: string
  paragraphs?: string[]
  /** H4 sub-sections with their own prose (one rival, one troubleshooting topic). */
  subsections?: { heading: string; paragraphs: string[] }[]
  /** Card row: H4 title plus prose. */
  cards?: { title: string; body: string }[]
  table?: QuickLookTable
}

export interface QuickLookGuide {
  /** Bare product name, used in headings the component builds. */
  productName: string
  /** H2 that opens the guide section. */
  heading: string
  /** Direct-answer lead: what it is and who it suits, in two or three sentences. */
  lead: string
  overview: string[]
  /** Where to buy and what to check — never a number, never a price explanation. */
  priceSection: { heading: string; paragraphs: string[] }
  /** Optional verified key facts, rendered as a semantic <dl>. */
  keyFacts?: { term: string; detail: string }[]
  features: { heading: string; title: string; body: string }[]
  buyers: { heading: string; should: string[]; skip: string[] }
  pros: { heading: string; pros: string[]; cons: string[] }
  buyingTips: { heading: string; paragraphs: string[] }
  faqs: { question: string; answer: string }[]
  /** Extra sections rendered after the key features and before "who should buy".
   *  Use for the deep answers a buyer arrives with: daily use, the app,
   *  comparisons, documented fixes, care. */
  deepDive?: QuickLookSection[]
  /** Extra sections rendered after "who should buy" and before pros and cons. */
  useCases?: QuickLookSection[]
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
      'It is one of the best-known models in Sony’s 1000X line. Sony rates the battery at up to 30 hours with noise canceling on and 40 with it off, and quotes a ten-minute quick charge for up to five hours — enough to cover a commute you forgot to plug in for.',
      'Two things are worth knowing before the rest of this page. The headset is not waterproof, so this is a desk, plane and train headphone rather than a gym one. And it does not fold: Sony stores it in the supplied carrying case.',
      'Everything below comes from Sony’s help guide and specification sheet plus the product’s own listing data. We do not run headphone measurements, so the notes on sound and cancellation are what the hardware is built to do, not results we measured.',
    ],
    priceSection: {
      heading: 'What to check before you buy the Sony WH-1000XM5',
      paragraphs: [
        'Sony’s own help guide describes two box versions of this headset. The WH-1000XM5 ships with a carrying case and the WH-1000XM5SA with a carrying pouch, and both include the headphone cable and the USB charging cable. Check which one a listing sells before ordering.',
        'Check the seller too. This is a popular model sold in regional versions, and a listing that is vague about who is selling it has details worth settling before the money moves.',
      ],
    },
    keyFacts: [
      { term: 'Driver unit', detail: '30 mm, closed dynamic over-ear' },
      { term: 'Playback time', detail: 'Up to 30 hours with noise canceling on (AAC)' },
      { term: 'With noise canceling off', detail: 'Up to 40 hours (AAC)' },
      { term: 'Charge time', detail: 'Approx. 3.5 hours over USB-C' },
      { term: 'Weight', detail: 'Approx. 250 g (8.82 oz)' },
      { term: 'Bluetooth', detail: 'Version 5.2 — SBC, AAC and LDAC' },
      { term: 'Multipoint', detail: 'Two devices connected at once' },
      { term: 'Wired listening', detail: 'Headphone cable included' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'Noise canceling that re-tunes itself',
        body: 'Sony’s listing credits the WH-1000XM5 with an Auto NC Optimizer, which adjusts the noise canceling to your surroundings and to how the headphones sit on your head. That matters more than it sounds: the seal changes when you put on glasses, a hat or a scarf, and a fixed profile gets weaker as soon as it does.',
      },
      {
        heading: 'Key features explained',
        title: 'Up to 30 hours, and a fast top-up',
        body: 'Sony rates the battery at up to 30 hours with noise canceling on and 40 with it off — manufacturer figures measured under set conditions, so your own number will differ with volume, codec and temperature. Practically, a full charge covers roughly a week of commuting.',
      },
      {
        heading: 'Key features explained',
        title: 'Touch controls on the ear cup',
        body: 'The right ear cup is a touch panel rather than a row of buttons. Per Sony’s help guide, a double tap plays and pauses, a swipe forward or back skips tracks, and a swipe up or down changes the volume. It is quick once it becomes habit; the trade-off is that a tap meant for the volume also lands when you adjust the headphones.',
      },
      {
        heading: 'Key features explained',
        title: 'Two devices, and a cable when you need one',
        body: 'Multipoint keeps the headset connected to two devices at once, so a laptop and a phone can both reach it without re-pairing. The box also includes a headphone cable, and Sony’s guide documents wired listening with the headset switched off — a flat battery does not lock you out.',
      },
    ],
    deepDive: [
      {
        heading: 'Sound and noise canceling in daily use',
        paragraphs: [
          'Sony describes noise canceling as an antiphase signal that reduces the noise around you rather than erasing it, and names the target: low-frequency sound such as engines, trains and air conditioning. The effect is easiest to notice on a bus, a plane or a subway platform, and easy to miss in a quiet room.',
          'The same page states the limit just as plainly: cancellation is “not as effective for higher frequencies, such as human voices”, so an open office loses the hum of the air handling and keeps the conversation. The Auto NC Optimizer re-tunes as your seal changes, and Adaptive Sound Control can switch to Ambient Sound Mode by itself when it detects walking or running; if cancellation seems to fade, Sony’s remedy is to turn that off and enable cancellation by hand.',
        ],
      },
      {
        heading: 'Calls, microphones and multipoint',
        paragraphs: [
          'Each ear cup holds internal and external noise-canceling microphones plus voice pickup microphones, which feed the cancellation and carry your voice on calls and in Speak-to-Chat. Sony describes them as omnidirectional, so there is nothing to swing into place before you talk.',
          'With “Connect to 2 devices simultaneously” on, multipoint holds two connections and plays from one at a time: music pauses when a call arrives on either, and moving audio across means stopping playback on one and starting it on the other. Add a third device and the connection to whichever played last is kept, the other is dropped.',
        ],
      },
      {
        heading: 'Fit, comfort and design',
        paragraphs: [
          ' Sony lists the headset at about 250 g (8.82 oz), and the ear cups ride on sliders so they sit around the ear rather than pressing on it.',
          'The design does not fold. Sony’s storage instruction is to put it in the supplied carrying case, which has a divider and a holder that keep the two cables apart. Sony also states the headset is not waterproof and warns that charging it while wet can cause a malfunction.',
        ],
      },
      {
        heading: 'Battery and charging in real use',
        paragraphs: [
          'Sony publishes listening time by codec, and the spread is worth knowing. With AAC — what an iPhone or a Mac sends — the guide lists up to 30 hours with noise canceling on and 40 with it off; on LDAC, up to 26 and 36; SBC sits between at 28 and 38. Ambient Sound Mode is listed at the cancellation-on figure, and wired listening with the headset switched on at 28 hours with cancellation, 38 without.',
          'Three minutes on the charger is quoted at about an hour of playback, ten minutes at about five hours, and a USB Power Delivery adapter rated 9 V / 2.3 A or more takes the three-minute figure to roughly three hours. A full charge takes about three and a half. It cannot play while charging — Sony states operations, Bluetooth playback included, are unavailable on charge — and plugging in switches it off. Charging happens between 5 °C and 35 °C (41–95 °F); an adapter rated at least 1.5 A is recommended, and a USB hub is the one case Sony warns may not charge properly.',
        ],
        table: {
          head: ['Listening time, per Sony', 'Noise canceling on', 'Noise canceling off'],
          rows: [
            ['AAC (iPhone, most laptops)', 'Up to 30 hours', 'Up to 40 hours'],
            ['LDAC (Android, high-resolution)', 'Up to 26 hours', 'Up to 36 hours'],
            ['SBC', 'Up to 28 hours', 'Up to 38 hours'],
            ['Headphone cable, headset switched on', 'Up to 28 hours', 'Up to 38 hours'],
          ],
        },
      },
      {
        heading: 'The Sony Headphones Connect app and what it adds',
        paragraphs: [
          'The app carries the settings the buttons cannot reach: the equalizer, the cancellation and Ambient Sound Mode controls, Adaptive Sound Control, Speak-to-Chat, DSEE Extreme, the 360 Reality Audio setup, a display of the codec in use, and the multipoint switch. Firmware reaches the headset through it too.',
          'What the guide does not document matters just as much. The codecs are SBC, AAC and LDAC and the profiles A2DP, AVRCP, HFP and HSP, with nothing beyond that list; Windows gets Swift Pair on version 1803 or later, and no Google Fast Pair support is documented; and no codec limitation for multipoint is stated.',
        ],
      },
      {
        heading: 'How the Sony WH-1000XM5 compares',
        paragraphs: [
          'Three headphones come up most often next to this one. Everything in the table is what each maker publishes about its own product, not a verdict — which one fits depends on your phone, your ears and how you travel.',
        ],
        table: {
          head: [
            'Spec, as published',
            'Sony WH-1000XM5',
            'Sony WH-1000XM4',
            'Bose QuietComfort Ultra (2nd Gen)',
            'Apple AirPods Max 2',
          ],
          rows: [
            ['Weight', 'Approx. 250 g', 'Not stated on the pages checked', '0.583 lb (about 264 g)', '386.2 g'],
            [
              'Battery, cancellation on',
              'Up to 30 h (AAC) / 26 h (LDAC)',
              'Up to 30 h (AAC)',
              'Up to 30 h; 23 h with Immersive Audio',
              'Up to 20 h',
            ],
            ['Battery, cancellation off', 'Up to 40 h (AAC) / 36 h (LDAC)', 'Up to 38 h (AAC)', 'Up to 45 h', 'Not stated'],
            ['Quick charge', '3 min → up to 1 h; 10 min → up to 5 h', '10 min → up to 5 h', '15 min → up to 3 h', '5 min → about 1.5 h'],
            ['Charging port', 'USB Type-C', 'USB Type-C', 'USB-C', 'USB-C'],
            ['Bluetooth', 'Version 5.2', 'Not stated on the pages checked', 'Version 5.4', 'Version 5.3'],
            ['Codecs', 'SBC, AAC, LDAC', 'SBC, AAC, LDAC', 'SBC, AAC, aptX Adaptive', 'Not stated'],
            ['Folds', 'No folding step in Sony’s guide; stored in its case', 'Yes — Sony’s guide folds it flat', 'Bose describes a foldable design', 'Not stated'],
            ['Carry case', 'Carrying case (the XM5SA ships a pouch)', 'Supplied carrying case', 'Carry case', 'Smart Case'],
            ['Devices at once', 'Two (multipoint)', 'Two (multipoint)', 'Two (multipoint)', 'Not stated'],
            ['Companion app', 'Sony | Headphones Connect', 'Sony | Headphones Connect', 'Bose app', 'Not stated'],
          ],
        },
        subsections: [
          {
            heading: 'Against the Sony WH-1000XM4',
            paragraphs: [
              'The clearest published difference is how they travel: the XM4 folds flat and the XM5 is stored in its case. Cancellation-on battery is the same on both at up to 30 hours with AAC, the XM4 is listed at up to 38 hours with cancellation off against the XM5’s 40, and it charges in about three hours against three and a half. Both quote ten minutes for up to five hours and list LDAC.',
            ],
          },
          {
            heading: 'Against the Bose QuietComfort Ultra Headphones',
            paragraphs: [
              'Bose lists its current model at 0.583 lb — about 264 g — against Sony’s 250 g, with up to 30 hours in Quiet and Aware Mode, 23 with Immersive Audio on and up to 45 with cancellation off. Bose quotes three hours for a full charge and fifteen minutes for three hours of play, lists aptX Adaptive where Sony lists LDAC, says the design folds, and calls its case a carry case.',
            ],
          },
          {
            heading: 'Against the Apple AirPods Max',
            paragraphs: [
              'Apple’s specification page describes the AirPods Max 2: 386.2 g, up to 20 hours with Active Noise Cancellation on, nine microphones, charging over USB-C and five minutes for around an hour and a half of listening. Apple lists Active Noise Cancellation, Transparency mode and Adaptive Audio, but states no codec list, no device count and no companion app.',
            ],
          },
        ],
      },
      {
        heading: 'Common problems and fixes from Sony’s help guide',
        paragraphs: [
          'Sony maintains a troubleshooting section for this exact model. These are its own steps; anything it leaves undocumented is left out.',
        ],
        subsections: [
          {
            heading: 'Pairing a second device, and pairing that fails',
            paragraphs: [
              'Hold power for about five seconds — the indicator flashes blue twice and the voice prompt says “Pairing” — then choose WH-1000XM5 and enter 0000 if asked. If the device never sees it: move within about a metre, delete the old pairing record, restart the device, reset the headset, then initialize and pair again.',
            ],
          },
          {
            heading: 'Reset compared with initialize',
            paragraphs: [
              'A reset keeps your settings and pairings: connect the supplied USB Type-C cable to a power outlet and hold power and NC/AMB together. Initializing wipes them: with the headset off and unplugged, hold both buttons for about seven seconds until the blue indicator flashes four times, then pair every device again.',
            ],
          },
          {
            heading: 'A firmware update that will not finish',
            paragraphs: [
              'Updates run through the app, and a stalled one is usually environmental: close other apps, charge both devices, keep them close, avoid wireless LAN and other Bluetooth devices, turn off power saving, and disconnect other Bluetooth devices such as a watch.',
            ],
          },
          {
            heading: 'Sound that skips or drops out',
            paragraphs: [
              'Set playback quality to “Priority on stable connection” first, then remove obstacles, move away from wireless LAN and crowd interference, close background apps, reconnect, turn Service Link off and reset. A brief pause when Adaptive Sound Control changes state is documented as normal.',
            ],
          },
          {
            heading: 'No sound, one side quiet, or a headset that will not switch on',
            paragraphs: [
              'Check that music runs over A2DP and calls over HFP or HSP, check the multipoint toggle, exit Speak-to-Chat, restart the device, then reset and finally initialize. A headset that will not turn on is often charging: it cannot power up with the cable connected, so unplug it first.',
            ],
          },
        ],
      },
      {
        heading: 'Care, ear pads and accessories',
        paragraphs: [
          'Cleaning is short: a soft dry cloth, or one dampened with diluted neutral detergent and wrung out well for a real build-up. Thinner, benzene and alcohol damage the finish, so no alcohol wipes on the ear cups.',
          'The ear pads are the wear item. Sony notes they can deteriorate with long-term use and storage, but documents no way to detach or fit them and lists no replacement pads, so this page cannot give you a part number — Sony support is the documented route.',
          'The box holds the headset, a headphone cable about 1.2 m long, a USB Type-C cable (USB-A to USB-C) about 20 cm long, and the carrying case. Sony’s storage note is to switch the headset off before it goes in a bag, because wearing detection can otherwise react to the movement.',
        ],
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
        'People who need a headphone that folds into a coat pocket — this one travels in its case.',
      ],
    },
    useCases: [
      {
        heading: 'Which WH-1000XM5 buyer are you?',
        cards: [
          {
            title: 'Commuters and subway riders',
            body: 'The cancellation is built for steady low-frequency noise, so trains, buses and station ventilation are where it works best, while announcements still come through. If a crowded platform makes playback stutter, Sony’s own fix is the stable-connection setting in the app.',
          },
          {
            title: 'Remote workers and call-heavy days',
            body: 'Ambient Sound Mode keeps the room audible without taking the headset off, Speak-to-Chat pauses playback when you talk, and the built-in microphones mean nothing has to unfold before a call. Multipoint holds the laptop and the phone at once.',
          },
          {
            title: 'Frequent flyers',
            body: 'The wired mode is the part that matters in the air: connect the supplied cable, switch the headset on, and cancellation keeps working where Bluetooth is restricted. A full top-up takes about three and a half hours.',
          },
          {
            title: 'Gamers and high-resolution listeners',
            body: 'Sony documents no low-latency or gaming mode for this model, so treat it as a music and call headphone. For high-resolution listening take the wired route: with the cable connected and the headset on, Sony lists a 4 Hz–40,000 Hz frequency response (JEITA), and over Bluetooth, LDAC at up to 990 kbps.',
          },
        ],
      },
    ],
    pros: {
      heading: 'Sony WH-1000XM5 pros and cons',
      pros: [
        'Up to 30 hours with noise canceling on, up to 40 hours with it off',
        'Ten-minute quick charge for up to five hours, per Sony',
        'Auto NC Optimizer re-tunes as your seal changes',
        'Multipoint keeps two devices connected at once',
        'Touch controls and a cable for wired listening',
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
        'Fit comes before specs. The cancellation is calibrated against the seal the ear cups make, so how they sit on your head — and whether glasses, a hat or a scarf are in the way — changes the result more than any number on this page. That makes the return terms on the listing worth a look, because a pair that will not seal on you is the one thing this page cannot predict.',
        'Charging gear is the other practical detail: an adapter rated at least 1.5 A, and USB Power Delivery at 9 V / 2.3 A or more if you want the three-minute top-up at full speed. Plug straight into the adapter, not a hub.',
      ],
    },
    faqs: [
      {
        question: 'Is the Sony WH-1000XM5 waterproof?',
        answer:
          'No. Sony’s help guide states that the headset is not waterproof, and warns that charging it while wet with rain or sweat can cause a malfunction. Let it dry before plugging it in.',
      },
      {
        question: 'How long does the WH-1000XM5 battery last?',
        answer:
          'Sony publishes it by codec: with AAC, up to 30 hours with canceling on and 40 with it off; with LDAC, up to 26 and 36 hours.',
      },
      {
        question: 'How long does the WH-1000XM5 take to charge?',
        answer:
          'About three and a half hours over USB Type-C. Sony also quotes roughly an hour of playback after three minutes on the charger, and about five hours after ten minutes.',
      },
      {
        question: 'Can you listen to the WH-1000XM5 while it charges?',
        answer:
          'No. Sony states that headset operations, Bluetooth playback included, cannot be performed while the headset is charging, and that starting a charge switches it off.',
      },
      {
        question: 'Can the WH-1000XM5 connect to two devices at once?',
        answer:
          'Yes. With multipoint on in the app it holds two connections, plays from one at a time, and switches to whichever device starts playing or rings. Up to eight devices can be paired.',
      },
      {
        question: 'Can you use the WH-1000XM5 wired?',
        answer:
          'Yes. A headphone cable is included. Connecting it turns Bluetooth off, but canceling keeps working while the headset is switched on — which makes it usable where Bluetooth is restricted.',
      },
      {
        question: 'Which Bluetooth codecs does the WH-1000XM5 support?',
        answer:
          'SBC, AAC and LDAC over Bluetooth 5.2, with A2DP, AVRCP, HFP and HSP as the profiles. LDAC needs a compatible source such as a recent Android phone, and the app shows which codec is in use.',
      },
      {
        question: 'Does the WH-1000XM5 noise canceling block voices?',
        answer:
          'Not well, and Sony says so: it works mainly on low-frequency noise such as engines and air conditioning and is “not as effective for higher frequencies, such as human voices”, so conversation comes through.',
      },
      {
        question: 'Does the Sony WH-1000XM5 fold?',
        answer:
          'No folding step appears in Sony’s help guide. It is stored in the supplied carrying case, which has a divider and a cable holder; the WH-1000XM5SA ships a pouch instead.',
      },
      {
        question: 'How do you reset the Sony WH-1000XM5?',
        answer:
          'A reset keeps your settings and pairings: connect the supplied USB Type-C cable to a power outlet and hold power and NC/AMB together. Initializing erases them — with the headset off and unplugged, hold both buttons for about seven seconds until the blue indicator flashes four times.',
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

  'apple-airpods-pro-3': {
    productName: 'AirPods Pro 3',
    heading: 'Apple AirPods Pro 3 specs, features and buying guide',
    lead: "The AirPods Pro 3 is Apple's third-generation in-ear headphone, built around the H2 chip with active noise cancellation, a heart-rate sensor for workouts and a set of hearing health tools. It suits anyone who wants one small earbud for commuting, calls and training, and who already carries an iPhone.",
    overview: [
      'Apple sells it as a single product rather than a family: one model with the USB-C MagSafe charging case, five sizes of silicone ear tip and no wired version. What separates it from earlier AirPods Pro models is the heart-rate sensor, the hearing health tools and, in Apple\u2019s own comparison, up to twice the noise reduction of AirPods Pro 2.',
      "Two limits are worth knowing before the feature list. Apple states that the earbuds are not waterproof or sweatproof \u2014 the IP57 rating covers dust, sweat and splashes rather than swimming or showering \u2014 and the USB-C charge cable is listed as sold separately, so the case arrives without one.",
      "Everything on this page comes from Apple\u2019s own specification, hearing health and newsroom pages, named in the sources note below. None of it was measured by us: the battery hours and the noise-cancellation multiples are Apple\u2019s published figures, taken under set conditions.",
    ],
    priceSection: {
      heading: 'What to check before you buy the AirPods Pro 3',
      paragraphs: [
        'The hearing features are the part of this product most likely to surprise a buyer, because Apple ties them to software: the Hearing Test, Hearing Aid and Hearing Protection tools work through a paired iPhone, and Apple notes that availability can vary by region. If those tools are the reason you are buying, settle your iPhone model and its software version first.',
        'Also worth settling before ordering: whether the listing bundles a USB-C cable, since Apple lists it separately, and which ear-tip sizes are included. The seal the tips make is what the noise cancellation is calibrated against, so it is the single most important fit detail here \u2014 and the tips are the cheapest part to change if the fit is wrong.',
      ],
    },
    keyFacts: [
      { term: 'Chip', detail: 'Apple H2 headphone chip' },
      { term: 'Noise cancellation', detail: 'Apple claims up to 2x more than AirPods Pro 2' },
      { term: 'Listening time', detail: 'Up to 8 hours with noise cancellation on' },
      { term: 'With the charging case', detail: 'Up to 24 hours' },
      { term: 'Resistance', detail: 'IP57 on the earbuds and the case' },
      { term: 'Bluetooth', detail: 'Version 5.3' },
      { term: 'Ear tips', detail: 'Five sizes: XXS, XS, S, M and L' },
      { term: 'Weight', detail: '5.55 g per earbud, 43.99 g for the case' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'Hearing health tools built into an earbud',
        body: 'Apple groups three features under hearing health: a Hearing Test, a Hearing Aid feature and Hearing Protection. Apple notes that availability can vary by region, and says Conversation Boost switches on automatically while the Hearing Aid feature is in use, which is a different behaviour from Conversation Awareness dipping the volume when someone speaks to you.',
      },
      {
        heading: 'Key features explained',
        title: 'A heart-rate sensor, without a watch',
        body: 'Apple lists a heart-rate sensor in each earbud for workouts, and says it can track heart rate and calories burned across up to 50 workout types in the Fitness app. That is the feature most likely to replace a watch strap for indoor training.',
      },
      {
        heading: 'Key features explained',
        title: 'Adaptive Audio and Conversation Awareness',
        body: 'Apple lists Adaptive Audio, Transparency mode, Adaptive EQ, Personalized Volume, Loud Sound Reduction, Voice Isolation and Conversation Awareness. Adaptive Audio moves between cancellation and transparency as your surroundings change, and Conversation Awareness lowers playback when you start talking to someone nearby, then restores it afterwards.',
      },
      {
        heading: 'Key features explained',
        title: 'A case that charges from more than a cable',
        body: "Apple says the USB-C MagSafe charging case takes a USB-C cable, a MagSafe charger, an Apple Watch charger or a Qi-certified charger, and that five minutes in the case is good for around an hour of listening. The case itself carries a speaker and a lanyard loop, and it is rated IP57 alongside the earbuds.",
      },
    ],
    deepDive: [
      {
        heading: 'What the hearing health features actually do',
        paragraphs: [
          'Apple presents the hearing tools as a set rather than a single feature. The Hearing Test checks your hearing through the earbuds, the Hearing Aid feature then uses the same hardware to bring the sounds around you up for people with perceived mild to moderate hearing loss, and Hearing Protection handles the opposite case by reducing loud environmental sound.',
          'Two practical consequences follow. The first is that these are software features delivered through the iPhone they are paired to, so the device and its software version matter as much as the earbuds. The second is where to expect the features: Apple states that availability can vary by region, which is worth checking before you buy for that reason alone.',
        ],
      },
      {
        heading: 'Noise cancellation, Transparency and what Apple claims',
        paragraphs: [
          "Apple frames the noise cancellation as a comparison against its own earlier products rather than a measurement: up to twice the noise reduction of AirPods Pro 2 and up to four times that of the original AirPods Pro. Those are Apple's claims about Apple hardware, and no independent number is published beside them.",
          'The modes sit on a dial rather than as separate switches. Adaptive Audio mixes cancellation and transparency as your environment changes, Transparency pipes the room back in deliberately, and Loud Sound Reduction takes the edge off sudden loud noise. Voice Isolation is the call-side feature: it works on your voice rather than on the room.',
        ],
      },
      {
        heading: 'Battery, charging and what the case adds',
        paragraphs: [
          'Apple publishes listening time by mode rather than as one headline figure, and the spread across those modes is the useful part \u2014 a workout with heart-rate sensing and a call in Transparency mode draw very different amounts of power from the same battery.',
          'The case is what makes an eight-hour earbud practical: Apple quotes up to 24 hours of listening with the case included. A five-minute stop in the case is listed at around an hour of playback, and the case can take a USB-C cable, MagSafe, an Apple Watch charger or a Qi pad \u2014 but not a spare cable from a phone, because Apple lists the USB-C cable as a separate purchase.',
        ],
        table: {
          head: ["Apple's rating by mode", 'Listening time'],
          rows: [
            ['Noise cancellation on', 'Up to 8 hours'],
            ['Spatial Audio with head tracking', 'Up to 7.5 hours'],
            ['Workouts with heart-rate sensing', 'Up to 6.5 hours'],
            ['Transparency mode with Hearing Aid', 'Up to 10 hours'],
            ['Noise cancellation on, with the charging case', 'Up to 24 hours'],
          ],
        },
      },
      {
        heading: 'Water, sweat and what IP57 covers',
        paragraphs: [
          'Apple rates both the earbuds and the charging case IP57 under the IEC 60529 standard, and explains that rating as a maximum depth of one metre for up to 30 minutes. In other words it is built for sweat, rain and a dropped earbud in a puddle, not for laps in a pool.',
          "Apple's own wording is the part to keep: it states the products are not waterproof or sweatproof, that they are not designed for swimming or showering, and that resistance is not permanent \u2014 it can diminish with wear. Apple also advises against charging them while wet, which is the one habit that actually damages them.",
        ],
      },
    ],
    buyers: {
      heading: 'Who should buy the AirPods Pro 3, and who should skip it',
      should: [
        'You already carry an iPhone: the hearing tools, Live Translation and quick pairing are all built around Apple\u2019s ecosystem.',
        'You want one small earbud for commuting, calls and training rather than three separate pairs.',
        'You want noise cancellation in an in-ear design, where the seal does more of the work than it can in an over-ear headphone.',
        'Tracking heart rate during workouts without wearing a watch is something you would genuinely use.',
      ],
      skip: [
        'You swim or shower in your earbuds: Apple states these are not waterproof or sweatproof.',
        'You need a cable in the box, because Apple lists the USB-C charge cable as sold separately.',
        'You use an Android phone, since everything Apple documents here is written around Apple devices.',
        'You would rather not think about charging: the earbuds are rated at up to 8 hours, with the case supplying the rest.',
      ],
    },
    useCases: [
      {
        heading: 'Where the AirPods Pro 3 fits',
        cards: [
          {
            title: 'Commuting and open-plan work',
            body: 'Transparency and Adaptive Audio let the room back in without taking an earbud out, and Conversation Awareness lowers the volume the moment someone speaks to you.',
          },
          {
            title: 'Running and gym sessions',
            body: 'The IP57 rating covers sweat, and Apple lists up to 6.5 hours of listening when heart-rate sensing is running during a workout. Not for the pool, in Apple\u2019s own words.',
          },
          {
            title: 'Anyone curious about their hearing',
            body: 'The Hearing Test and Hearing Aid tools run from the paired iPhone, and Apple notes that availability can vary by region \u2014 worth checking before buying for that reason alone.',
          },
        ],
      },
    ],
    pros: {
      heading: 'Apple AirPods Pro 3 pros and cons',
      pros: [
        'Apple claims up to twice the noise reduction of AirPods Pro 2',
        'Hearing Test, Hearing Aid and Hearing Protection built in',
        'Heart-rate sensing across up to 50 workout types in the Fitness app',
        'IP57 on the earbuds and the charging case, so sweat and rain are covered',
        'Charges from USB-C, MagSafe, an Apple Watch charger or any Qi pad',
      ],
      cons: [
        'Apple states the earbuds are not waterproof or sweatproof',
        'The USB-C charge cable is not included',
        'Live Translation needs an Apple Intelligence-enabled iPhone on iOS 26 or later',
        'Hearing feature availability varies by region, per Apple',
      ],
    },
    buyingTips: {
      heading: 'Buying the AirPods Pro 3 in the US',
      paragraphs: [
        'Fit decides more here than on most earbuds. Five sizes ship in the box, from XXS to L, and the seal those tips make is what the noise cancellation works against \u2014 so if you know your ear canals are unusually narrow or wide, plan on trying sizes rather than living with whichever pair comes fitted.',
        'Then check two details on the listing itself: that it is the AirPods Pro 3 rather than an earlier generation, since the three share a family name, and whether a USB-C cable is bundled, because Apple does not put one in the box.',
      ],
    },
    faqs: [
      {
        question: 'Are the AirPods Pro 3 waterproof?',
        answer:
          'No. Apple rates the earbuds and the case IP57, which Apple explains as up to one metre of water for up to 30 minutes, and states they are not waterproof or sweatproof and are not designed for swimming or showering.',
      },
      {
        question: 'How long does the AirPods Pro 3 battery last?',
        answer:
          'Apple lists up to 8 hours with noise cancellation on, 7.5 hours with Spatial Audio and head tracking, 6.5 hours during workouts with heart-rate sensing, and 10 hours in Transparency mode using the Hearing Aid feature. With the charging case the total is up to 24 hours.',
      },
      {
        question: 'Do the AirPods Pro 3 come with a charging cable?',
        answer:
          'No. Apple lists the USB-C charge cable as sold separately. The box carries the earbuds, the USB-C MagSafe charging case and five sizes of ear tip.',
      },
      {
        question: 'What sizes of ear tip come in the box?',
        answer: 'Five: XXS, XS, S, M and L. The silicone tips are replaceable, and the seal they make affects both noise cancellation and bass.',
      },
      {
        question: 'Can the AirPods Pro 3 measure heart rate?',
        answer:
          'Yes. Apple lists a built-in heart-rate sensor and says it can track heart rate and calories burned during workouts, with up to 50 workout types in the Fitness app.',
      },
      {
        question: 'Do the AirPods Pro 3 work as hearing aids?',
        answer:
          'They include a Hearing Aid feature alongside a Hearing Test and Hearing Protection. Apple notes that feature availability can vary by region, and says Conversation Boost turns on automatically while the Hearing Aid feature is in use.',
      },
      {
        question: 'What is the difference between the AirPods Pro 3 and AirPods Pro 2?',
        answer:
          "Apple's own comparison is the safe source: it claims up to twice the noise reduction of AirPods Pro 2 on the newer model, and it lists heart-rate sensing and the hearing health tools on the AirPods Pro 3.",
      },
      {
        question: 'Does Live Translation work on every iPhone?',
        answer:
          'No. Apple states that Live Translation requires an Apple Intelligence-enabled iPhone running iOS 26 or later, and that language and region availability apply.',
      },
    ],
    links: [
      {
        label: 'Audio & wearables',
        href: '/shop/audio-wearables',
        description: 'Every headphone, earbud and wearable the store carries.',
      },
      {
        label: "Today's deals",
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

  'dji-osmo-action-5-pro': {
    productName: 'DJI Osmo Action 5 Pro',
    heading: 'DJI Osmo Action 5 Pro specs, features and buying guide',
    lead: 'The DJI Osmo Action 5 Pro is a small, mount-anywhere action camera with a 1/1.3-inch sensor, 4K recording at up to 120 fps and an OLED touchscreen on each side. It suits riders, divers, hikers and anyone who wants to clamp a camera to something and forget about it, with a 20 m depth rating before the waterproof case goes on.',
    overview: [
      "DJI's own specification table is the source for everything below. The headline hardware is a 1/1.3-inch CMOS sensor, a 155-degree lens with an f/2.8 aperture, 10-bit recording in D-Log M or HLG, and 64 GB of built-in storage of which 47 GB is available to use.",
      "What separates it from a phone camera is not image quality but what it survives and how it mounts: a 146 g body, an IP68 rating for the camera and its case, an operating range from -20 C to 45 C, and DJI's own quick-release clips alongside an adapter mount for third-party accessories.",
      'Two gaps are worth knowing before the feature list. DJI publishes no charging time on its specifications or FAQ pages, so none appears here, and DJI states that electronic stabilisation is not available in Timelapse or Slow Motion modes. Where a number is missing from this page, it is because the manufacturer does not publish it.',
    ],
    priceSection: {
      heading: 'What to check before you buy the DJI Osmo Action 5 Pro',
      paragraphs: [
        'The bundle matters more here than on most cameras, because DJI sells the model as part of combinations that add batteries, mounts and cases. The depth rating is the detail to watch: the camera alone is rated to 20 m, and DJI says the waterproof case takes it to 60 m. If you plan to dive, check which parts a listing includes before ordering.',
        'Storage is the other one. The camera carries 47 GB of usable built-in memory, enough for a morning rather than a holiday, so a microSD card is effectively part of the purchase. DJI lists support up to 1 TB, and cards are not included.',
      ],
    },
    keyFacts: [
      { term: 'Sensor', detail: '1/1.3-inch CMOS' },
      { term: 'Stills', detail: 'Up to 40 MP (7296 x 5472)' },
      { term: 'Video', detail: '4K at up to 120 fps, 1080p at up to 240 fps' },
      { term: 'Stabilisation', detail: 'RockSteady 3.0, RockSteady 3.0+, HorizonBalancing and HorizonSteady' },
      { term: 'Storage', detail: '64 GB built in with 47 GB available, plus microSD to 1 TB' },
      { term: 'Battery', detail: '1950 mAh, up to 240 minutes of recording per DJI' },
      { term: 'Water resistance', detail: 'To 20 m without a case, 60 m with the waterproof case' },
      { term: 'Weight', detail: '146 g' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'Two screens, including a front one for framing yourself',
        body: 'DJI fits a 1.46-inch front touchscreen and a 2.5-inch rear one, both rated 800 cd/m2 typical brightness, with the rear panel reaching 1000 cd/m2 peak. For vlogging, or for a helmet or handlebar mount, that means you can check the framing without pulling the camera off its mount.',
      },
      {
        heading: 'Key features explained',
        title: 'Stabilisation modes with published limits',
        body: 'RockSteady 3.0, RockSteady 3.0+, HorizonBalancing and HorizonSteady are the four modes DJI lists. The limits are the useful part: HorizonSteady works at 1080p or 2.7K (16:9) at 60 fps or below, HorizonBalancing adds 4K (16:9) at the same frame rates, and DJI states that electronic stabilisation does not apply in Timelapse or Slow Motion.',
      },
      {
        heading: 'Key features explained',
        title: 'Colour for footage you plan to grade',
        body: 'The camera records 10-bit video in D-Log M or HLG at up to 120 Mbps in MP4 (HEVC). D-Log M is the flat profile, intended to hold highlight and shadow detail for grading later; HLG is the version for HDR playback without a grading step.',
      },
      {
        heading: 'Key features explained',
        title: 'Built-in storage and a battery rated for cold',
        body: 'DJI gives 64 GB of internal memory with 47 GB usable, which means the camera records out of the box, and a 1950 mAh battery it lists at up to 240 minutes recording 1080p/24 at 25 C with the screens and Wi-Fi off. DJI also quotes up to 3.6 hours at -20 C in the same conditions \u2014 both are laboratory figures rather than field results.',
      },
    ],
    deepDive: [
      {
        heading: 'Stabilisation in practice, and by the book',
        paragraphs: [
          "The slow-motion modes are where the limits bite first. DJI lists 4K at 120 fps, 2.7K at 120 fps and 1080p at 120 fps as 4x slow motion, and 1080p at 240 fps as 8x, all recorded natively \u2014 but none of those allow electronic stabilisation. DJI also describes a 1080p/960 \"32x\" super slow motion that is produced by interpolating frames of already-recorded footage, not captured at 960 fps.",
          'Match the mode to the mount and the limits stop mattering. HorizonSteady is the one to pick when the horizon has to stay level, such as a camera on a handlebar or a helmet, but it tops out at 1080p or 2.7K (16:9) at 60 fps. If you want 4K with a locked horizon, HorizonBalancing covers that at 60 fps or below.',
        ],
      },
      {
        heading: 'Using it in and around water',
        paragraphs: [
          'The depth rating is stated in two parts: to 20 m with the camera as it comes, and to 60 m with the waterproof case. DJI recommends the case for long underwater sessions or where water impact is strong, and rates both the camera and the case IP68.',
          'DJI also names what the camera is not built for: hot springs, extreme underwater environments and corrosive or unknown liquids. The published operating range is -20 C to 45 C, and charging should happen between 5 C and 40 C \u2014 worth knowing if you shoot in winter and want to top the battery up outdoors.',
        ],
      },
      {
        heading: 'Storage, audio and power across a shoot day',
        paragraphs: [
          'With 47 GB usable internally and microSD support to 1 TB, the camera can be shot with on day one and given a card later. Audio comes from three built-in microphones recording 48 kHz 16-bit AAC, and DJI documents connecting a third-party microphone over the camera\u2019s USB-C port with a suitable cable.',
          'Charging is the one place DJI is silent on numbers. Its FAQ says the camera supports fast charging with a 30 W USB-C charger, sold separately, and the specifications table lists no charging duration at all. Anyone planning long days should carry spare batteries and plan around that missing figure rather than guess at it.',
        ],
      },
    ],
    buyers: {
      heading: 'Who should buy the DJI Osmo Action 5 Pro, and who should skip it',
      should: [
        'You mount a camera to a helmet, handlebar or chest harness and want something that survives the trip.',
        'You want to frame yourself: the front touchscreen is unusual in a camera this size.',
        'You shoot in cold weather and need a camera rated to -20 C.',
        'You grade your footage and want 10-bit D-Log M rather than a baked-in look.',
      ],
      skip: [
        'You need a published charging time before you buy \u2014 DJI does not publish one.',
        'Your shots are mostly timelapses or slow motion, because DJI states electronic stabilisation is off in both.',
        'You dive past 60 m, which is beyond the camera and case rating DJI gives.',
        'You expect native 4K at 240 fps: DJI lists 1080p as the top slow-motion capture rate.',
      ],
    },
    useCases: [
      {
        heading: 'Where the Osmo Action 5 Pro fits',
        cards: [
          {
            title: 'Riders and drivers',
            body: 'A handlebar or helmet mount, a 146 g body and HorizonSteady at 60 fps or below keep the footage level without a gimbal.',
          },
          {
            title: 'Snorkelling and shallow dives',
            body: 'To 20 m without a housing and 60 m with DJI\u2019s case, with IP68 on both \u2014 and DJI\u2019s own warning against hot springs and corrosive water.',
          },
          {
            title: 'Hiking and travel',
            body: '47 GB built in means the first day is covered before a card is bought, and DJI rates the battery at up to 240 minutes per charge.',
          },
        ],
      },
    ],
    pros: {
      heading: 'DJI Osmo Action 5 Pro pros and cons',
      pros: [
        '1/1.3-inch sensor with stills up to 40 MP',
        '4K at up to 120 fps, and 1080p at up to 240 fps',
        'Four stabilisation modes with the frame-rate limits published',
        '47 GB of usable built-in storage plus microSD support to 1 TB',
        'Two OLED touchscreens, including a front one for framing',
        'Rated to 20 m without a housing and to -20 C operation',
      ],
      cons: [
        'DJI publishes no charging time for the camera',
        'Electronic stabilisation is unavailable in Timelapse and Slow Motion',
        'HorizonSteady and HorizonBalancing stop at 60 fps or below',
        'Runtime and cold-weather figures come from DJI laboratory testing',
      ],
    },
    buyingTips: {
      heading: 'Buying the DJI Osmo Action 5 Pro in the US',
      paragraphs: [
        'Decide the water question first, because it changes what you need in the box. If the camera is for rain, mud and the odd splash, the 20 m rating on its own is more than enough. If it is for diving, you need DJI\u2019s waterproof case to reach the 60 m rating, and that case is not part of every combination DJI ships.',
        'Then match the mode list to what you actually shoot. HorizonSteady stops at 1080p or 2.7K at 60 fps or below, so a 4K slow-motion clip gets no horizon lock at all, and neither mode survives in Timelapse. Finally, budget for a microSD card: the 47 GB inside will get you started, and DJI supports cards up to 1 TB.',
      ],
    },
    faqs: [
      {
        question: 'Is the DJI Osmo Action 5 Pro waterproof?',
        answer:
          'Yes, to 20 m without a housing and to 60 m with DJI\u2019s waterproof case. DJI rates the camera and the case IP68 and warns against hot springs, extreme underwater environments and corrosive liquids.',
      },
      {
        question: 'How long does the Osmo Action 5 Pro battery last?',
        answer:
          'DJI quotes up to 240 minutes recording 1080p/24 at 25 C with RockSteady on and the screens and Wi-Fi off, and up to 3.6 hours at -20 C under the same conditions. Both are laboratory measurements, not field results.',
      },
      {
        question: 'How long does the Osmo Action 5 Pro take to charge?',
        answer:
          'DJI does not publish a charging time on its specifications or FAQ pages. It states that a 30 W USB-C charger is supported and sold separately.',
      },
      {
        question: 'Can the Osmo Action 5 Pro record 4K at 120 fps?',
        answer:
          'Yes, in both 16:9 and 4:3 at 4K, and at 2.7K. The highest native frame rate DJI lists is 1080p at 240 fps for 8x slow motion; the 1080p/960 \u201c32x\u201d mode DJI describes is produced from recorded footage by frame interpolation.',
      },
      {
        question: 'Does the Osmo Action 5 Pro have built-in storage?',
        answer:
          'Yes: 64 GB in total, with 47 GB available to use, plus microSD support for cards up to 1 TB.',
      },
      {
        question: 'Does the Osmo Action 5 Pro have a front screen?',
        answer:
          'Yes. DJI lists a 1.46-inch front OLED touchscreen and a 2.5-inch rear one, with the rear panel rated up to 1000 cd/m2 peak brightness.',
      },
      {
        question: 'Do the stabilisation modes work in every shooting mode?',
        answer:
          'No. DJI states electronic stabilisation is not supported in Timelapse or Slow Motion, and HorizonSteady and HorizonBalancing are limited to 1080p, 2.7K or 4K (16:9) at 60 fps or below.',
      },
    ],
    links: [
      {
        label: 'Cameras',
        href: '/shop/cameras',
        description: 'Cameras and imaging gear the store carries.',
      },
      {
        label: "Today's deals",
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

  'samsung-galaxy-tab-s10-ultra': {
    productName: 'Galaxy Tab S10 Ultra',
    heading: 'Samsung Galaxy Tab S10 Ultra specs, features and buying guide',
    lead: 'The Samsung Galaxy Tab S10 Ultra is a 14.6-inch tablet with a 120 Hz Dynamic AMOLED 2X display, up to 16 GB of memory, an S Pen in the box and IP68 water and dust resistance. It suits people who want one large screen for notes, drawing and split-screen work instead of a laptop plus a tablet.',
    overview: [
      'Samsung sells it as the largest member of the Tab S10 family, and the size is the point: a 14.6-inch 2960 x 1848 panel at up to 120 Hz, with the anti-reflection treatment Samsung lists for the series. The rest of the package is arranged around that screen, from the quad speakers to the S Pen that ships in the box.',
      'Battery and durability are the second half of the story. Samsung rates the battery at 11,200 mAh with up to 16 hours of video playback, supports 45 W Super Fast Charging and rates the tablet IP68 \u2014 with the included S Pen rated IP68 as well.',
      'One thing this sheet deliberately leaves out: Samsung does not publish a processor name on its US pages for this model, so no chip row appears here. Where a figure is missing from this page, the manufacturer does not state it.',
    ],
    priceSection: {
      heading: 'What to check before you buy the Galaxy Tab S10 Ultra',
      paragraphs: [
        'Two accessories decide how you will actually use it. The S Pen is included, so writing and sketching work out of the box; the 45 W charger is not, and Samsung lists it separately, so a first-time buyer should plan for that.',
        'Memory is the other fork. Samsung lists the Ultra with up to 16 GB of RAM and storage of 256 GB, 512 GB or 1 TB, and the US pages do not spell out which RAM and storage combinations are sold there. If a specific pairing matters \u2014 16 GB with 1 TB, say \u2014 check what a given listing actually is rather than assuming.',
      ],
    },
    keyFacts: [
      { term: 'Display', detail: '14.6-inch Dynamic AMOLED 2X, 2960 x 1848' },
      { term: 'Refresh rate', detail: 'Up to 120 Hz' },
      { term: 'Memory', detail: 'Up to 16 GB of RAM' },
      { term: 'Storage', detail: '256 GB, 512 GB or 1 TB, plus microSD to 1.5 TB' },
      { term: 'Battery', detail: '11,200 mAh, up to 16 hours of video playback per Samsung' },
      { term: 'Charging', detail: '45 W Super Fast Charging support, charger sold separately' },
      { term: 'S Pen', detail: 'Included in the box' },
      { term: 'Weight', detail: '718 g for the Wi-Fi model' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'A 14.6-inch panel that keeps up with a stylus',
        body: 'The screen is a Dynamic AMOLED 2X panel at 2960 x 1848 with a refresh rate up to 120 Hz; Samsung measures it as 14.6 inches across the full rectangle and 14.5 inches once the rounded corners are accounted for. The anti-reflection treatment Samsung lists for the series matters more on a screen this size, because there is simply more glass to catch a window.',
      },
      {
        heading: 'Key features explained',
        title: 'The S Pen is in the box, and it is IP68 rated',
        body: 'Samsung includes the S Pen with the Ultra and rates it IP68 alongside the tablet. Because it needs no charging and no pairing, it is the accessory most likely to be used every day \u2014 notes, annotations and sketches without reaching for a bag.',
      },
      {
        heading: 'Key features explained',
        title: 'Battery sized for a large screen',
        body: 'An 11,200 mAh cell is what a 14.6-inch display needs, and Samsung quotes up to 16 hours of video playback from it. Charging is supported at 45 W Super Fast Charging, with the charger sold separately \u2014 worth knowing before the tablet arrives.',
      },
      {
        heading: 'Key features explained',
        title: 'Galaxy AI features aimed at notes and screenshots',
        body: 'Samsung lists Circle to Search, Note Assist \u2014 transcription, organising and summarising notes \u2014 Sketch to Image and Transcript assist, plus Gallery tools including Portrait Studio, Live Effects and Instant Slow-mo, and translation of website and PDF text.',
      },
    ],
    deepDive: [
      {
        heading: 'A large screen for notes, drawing and split-screen work',
        paragraphs: [
          'The case for a tablet this size is not portability, it is canvas. At 2960 x 1848 with a refresh rate up to 120 Hz, two documents side by side stay readable, and the S Pen makes annotation as direct as it is on paper \u2014 which is why Samsung pairs the pen with the transcription and summarising tools in Note Assist.',
          'The trade is weight and bulk: Samsung lists 718 g for the Wi-Fi model and a thickness of 5.4 mm. That is light for the screen area and heavy for one hand, so it is a device that lives on a desk or in a bag rather than in a pocket.',
        ],
      },
      {
        heading: 'Battery, charging and how Samsung measures its numbers',
        paragraphs: [
          'Samsung\u2019s 16-hour video figure is not a mixed-use number: it describes local 720p video played full screen with Wi-Fi and mobile data off and set brightness and volume. Real use \u2014 streaming, split-screen work and a bright screen outdoors \u2014 will draw more, which is why the 11,200 mAh capacity is the more useful fact to carry in your head.',
          'Charging support tops out at 45 W Super Fast Charging, and the charger is a separate purchase. Nothing in Samsung\u2019s published pages suggests the tablet charges faster with a different accessory, so the practical advice is simply to allow for the charger in the budget.',
        ],
      },
      {
        heading: 'Durability: what IP68 covers and what it does not',
        paragraphs: [
          'Samsung rates the tablet IP68 and describes water resistance in up to 5 feet of water for up to 30 minutes, with the device rinsed of residue and dried afterwards. The S Pen carries the same IP68 rating, which is unusual for a stylus and useful in a kitchen or on a wet campsite table.',
          'Samsung also states plainly that water and dust resistance is not permanent and can be reduced by physical damage or wear. That is the sentence to remember: the rating covers an accident, not a habit, and it is not a licence to use the tablet as a poolside device.',
        ],
      },
    ],
    buyers: {
      heading: 'Who should buy the Galaxy Tab S10 Ultra, and who should skip it',
      should: [
        'You want a large canvas for handwritten notes, sketches and annotation, with the S Pen included.',
        'You want one screen for streaming, browsing and light split-screen work rather than two devices.',
        'You keep a tablet in places where a splash is possible: IP68 covers the tablet and the S Pen.',
        'You need expandable storage \u2014 microSD support is listed up to 1.5 TB.',
      ],
      skip: [
        'You need the processor published before you buy: Samsung\u2019s US pages for this model do not name it.',
        'You expect a charger in the box \u2014 the 45 W Super Fast Charger is sold separately.',
        'You want to one-hand the tablet: Samsung lists 718 g for the Wi-Fi model.',
        'You need a keyboard included; Samsung lists keyboard accessories separately.',
      ],
    },
    useCases: [
      {
        heading: 'Where the Tab S10 Ultra fits',
        cards: [
          {
            title: 'Note-taking and study',
            body: 'A 14.6-inch canvas with the S Pen included, plus Note Assist for transcription and automatic formatting of what you wrote.',
          },
          {
            title: 'Drawings, sketches and annotated documents',
            body: 'Sketch to Image and the S Pen sit alongside a 120 Hz panel, so strokes land where you put them rather than a frame later.',
          },
          {
            title: 'Streaming and shared screens',
            body: 'Quad speakers with Dolby Atmos and an 11,200 mAh battery rated at up to 16 hours of video playback on Samsung\u2019s own measurement.',
          },
        ],
      },
    ],
    pros: {
      heading: 'Samsung Galaxy Tab S10 Ultra pros and cons',
      pros: [
        '14.6-inch Dynamic AMOLED 2X display at up to 120 Hz',
        'Up to 16 GB of memory and storage up to 1 TB',
        'microSD support up to 1.5 TB',
        '11,200 mAh battery with 45 W Super Fast Charging support',
        'S Pen included, and IP68 rated like the tablet',
        'Quad speakers with Dolby Atmos',
      ],
      cons: [
        'Samsung does not name the processor on its US pages for this model',
        'The 45 W charger is sold separately',
        'US RAM and storage pairings are not published by Samsung',
        'No operating-system version or upgrade promise is stated on the US pages reviewed',
        '718 g is a two-handed device in practice',
      ],
    },
    buyingTips: {
      heading: 'Buying the Galaxy Tab S10 Ultra in the US',
      paragraphs: [
        'Start with the two things that ship differently: the S Pen is included and the 45 W charger is not, so a first purchase really is the tablet plus a charger. If you already own a Samsung fast charger of that rating, this is the one place where the price you see is not the whole cost of getting started.',
        'Then settle memory and storage. Samsung sells the Ultra with up to 16 GB of RAM and 256 GB, 512 GB or 1 TB of storage but does not publish which pairings reach the US, so read the listing for the combination you want rather than assuming the line-up mirrors another region. A microSD card up to 1.5 TB is the inexpensive way to add room for video, and it is sold separately.',
      ],
    },
    faqs: [
      {
        question: 'Does the Galaxy Tab S10 Ultra come with an S Pen?',
        answer:
          'Yes. Samsung includes the S Pen with the Ultra, and rates it IP68 alongside the tablet, so it works the same way after a splash.',
      },
      {
        question: 'Is the Galaxy Tab S10 Ultra waterproof?',
        answer:
          'Samsung rates it IP68 and describes water resistance in up to 5 feet of water for up to 30 minutes, advising that the device is rinsed of residue and dried afterwards. Samsung also states that resistance is not permanent and can be reduced by damage or wear.',
      },
      {
        question: 'What processor does the Galaxy Tab S10 Ultra use?',
        answer:
          'Samsung\u2019s US pages for this model do not name the processor, so this sheet does not publish one. Check the listing you are buying from for the chip it states.',
      },
      {
        question: 'How big is the Galaxy Tab S10 Ultra battery, and how long does it last?',
        answer:
          'Samsung lists an 11,200 mAh typical capacity and up to 16 hours of video playback. That figure is Samsung\u2019s own measurement of local 720p playback with Wi-Fi and mobile data off at set brightness and volume, not a mixed-use estimate.',
      },
      {
        question: 'Does the Galaxy Tab S10 Ultra support a microSD card?',
        answer:
          'Yes, cards up to 1.5 TB, sold separately. The tablet itself comes with 256 GB, 512 GB or 1 TB of built-in storage depending on the model.',
      },
      {
        question: 'How much RAM does the Galaxy Tab S10 Ultra have?',
        answer:
          'Samsung lists up to 16 GB of RAM for the Ultra. It does not publish which RAM and storage combinations are sold in the US, so check the configuration on the listing itself.',
      },
      {
        question: 'Is a charger included with the Galaxy Tab S10 Ultra?',
        answer:
          'No. Samsung lists the 45 W Super Fast Charger as sold separately, while charging itself is supported at 45 W.',
      },
      {
        question: 'What Galaxy AI features does the Tab S10 Ultra have?',
        answer:
          'Samsung lists Circle to Search, Note Assist, Sketch to Image and Transcript assist, along with Gallery tools including Portrait Studio, Live Effects and Instant Slow-mo, and translation of website and PDF text.',
      },
    ],
    links: [
      {
        label: 'Laptops & PCs',
        href: '/shop/laptops',
        description: 'Tablets, laptops and desktop PCs the store carries.',
      },
      {
        label: 'Galaxy S26 Ultra spec sheet',
        href: '/quick-look/samsung-galaxy-s26-ultra',
        description: 'Another Samsung spec sheet \u2014 the flagship phone this tablet pairs with.',
      },
      {
        label: "Today's deals",
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

  'samsung-galaxy-s26-ultra': {
    productName: 'Galaxy S26 Ultra',
    heading: 'Samsung Galaxy S26 Ultra specs, features and buying guide',
    lead: "The Samsung Galaxy S26 Ultra is Samsung's flagship phone for 2026: a 6.9-inch QHD+ display with a built-in Privacy Display, a 200 MP main camera and the Snapdragon 8 Elite Gen 5 for Galaxy. It suits anyone who wants the largest Samsung screen, the S Pen that comes with it, and does not mind a big phone.",
    overview: [
      'Samsung sells the model in three US configurations: 12 GB of memory with 256 GB or 512 GB of storage, and 16 GB with 1 TB. The display is a 6.9-inch Dynamic AMOLED 2X panel at QHD+ with an adaptive refresh rate up to 120 Hz, which Samsung measures as 6.7 inches once the rounded corners are taken into account.',
      'The feature Samsung leads with is the Privacy Display, which Samsung says makes the screen appear dark when it is viewed from an angle \u2014 a hardware answer to reading a message on a train. Around it sit four rear cameras led by a 200 MP sensor, a 5,000 mAh battery supporting up to 60 W wired charging, IP68 protection and the S Pen the Ultra line is known for.',
      'Two things this sheet does not carry, because Samsung does not publish them on its US pages: the phone weight, and the exact pixel resolution behind the \u201cQHD+\u201d label. Where a figure is missing on this page, the manufacturer does not state it.',
    ],
    priceSection: {
      heading: 'What to check before you buy the Galaxy S26 Ultra',
      paragraphs: [
        'Storage and memory arrive as one choice rather than two: 12 GB of RAM comes with 256 GB or 512 GB, and 16 GB comes with 1 TB. If the extra memory is what you want, the 1 TB model is the only route to it in Samsung\u2019s US line-up.',
        'Then the S Pen, which Samsung states does not support Bluetooth or Air Actions on this model. That rules it out as a remote shutter or a gesture controller; it remains a writing and drawing tool. Charging is the last number to plan around: the phone supports Super Fast Charging 3.0 up to 60 W over a cable and up to 25 W wirelessly.',
      ],
    },
    keyFacts: [
      { term: 'Display', detail: '6.9-inch Dynamic AMOLED 2X at QHD+' },
      { term: 'Refresh rate', detail: 'Up to 120 Hz, adaptive' },
      { term: 'Processor', detail: 'Snapdragon 8 Elite Gen 5 for Galaxy' },
      { term: 'Main camera', detail: '200 MP wide at f/1.4' },
      { term: 'Battery', detail: '5,000 mAh' },
      { term: 'Wired charging', detail: 'Super Fast Charging 3.0 up to 60 W' },
      { term: 'Wireless charging', detail: 'Up to 25 W, plus Wireless PowerShare' },
      { term: 'Durability', detail: 'IP68 with an Armor Aluminum frame and Gorilla Armor 2' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'A Privacy Display built into the panel',
        body: 'Samsung\u2019s headline addition for this generation is a display feature rather than a software toggle: the Privacy Display makes the screen appear dark when viewed from an angle, which is the situation a phone faces on a plane or a crowded train. Samsung lists it alongside the usual QHD+ resolution and 120 Hz adaptive refresh.',
      },
      {
        heading: 'Key features explained',
        title: 'Four cameras led by a 200 MP sensor',
        body: 'The main camera is a 200 MP wide sensor at f/1.4, next to a 50 MP ultra wide at f/1.9 and a quad telephoto system built from 50 MP at f/2.9 and a 10 MP sensor. The front camera is 12 MP. Those are Samsung\u2019s published figures; the optical zoom factors Samsung prints may vary by model and region, so check the listing if zoom length matters to you.',
      },
      {
        heading: 'Key features explained',
        title: 'Snapdragon 8 Elite Gen 5 for Galaxy',
        body: 'Samsung names the Snapdragon 8 Elite Gen 5 for Galaxy as the chip in the S26 Ultra, which is the version customised for Galaxy devices. Memory and storage are paired: 12 GB with 256 GB or 512 GB, and 16 GB with 1 TB in the US line-up.',
      },
      {
        heading: 'Key features explained',
        title: 'Charging that splits into three numbers',
        body: 'A 5,000 mAh battery carries Super Fast Charging 3.0 up to 60 W over a cable, Super Fast Wireless Charging up to 25 W on a pad, and Wireless PowerShare for topping up another device on the back of the phone.',
      },
    ],
    deepDive: [
      {
        heading: 'What the Privacy Display does, in Samsung\u2019s own words',
        paragraphs: [
          'Samsung describes the feature simply: the display appears dark when the phone is viewed from an angle, so a passer-by at your side gets less of the screen than you do. That is a panel-level change rather than an app or a filter, which is why Samsung lists it with the display specifications rather than with the software features.',
          'The practical benefit is narrow and real: it is for reading something private next to strangers. It is not a substitute for a screen lock, and Samsung does not present it as one.',
        ],
      },
      {
        heading: 'The camera system, by the numbers',
        paragraphs: [
          'Samsung\u2019s US material lists a 200 MP wide camera at f/1.4 \u2014 a wider aperture than the ultra wide and telephoto lenses beside it, which is what makes the main sensor the one to reach for indoors. The ultra wide is 50 MP at f/1.9, and the quad telephoto system pairs a 50 MP f/2.9 lens with a 10 MP sensor.',
          'The front camera is 12 MP. Samsung does not publish an aperture for the 10 MP telephoto or the front camera in the US material reviewed for this sheet, so those two numbers stay out rather than being filled in from elsewhere.',
        ],
      },
      {
        heading: 'Battery, charging and durability',
        paragraphs: [
          'The capacity is 5,000 mAh, with up to 60 W over a cable and up to 25 W on a wireless pad; Wireless PowerShare lets the phone charge another device on its back. As always, those are Samsung\u2019s own ratings rather than independently measured results, and real charging speeds depend on the charger and cable used.',
          'For durability Samsung lists IP68 water and dust resistance, an Armor Aluminum frame and Corning Gorilla Armor 2 on the front and back. Samsung does not describe the S26 Ultra frame as titanium, so this sheet does not either, and Samsung adds the usual caution that water resistance can be reduced by physical damage.',
        ],
      },
    ],
    buyers: {
      heading: 'Who should buy the Galaxy S26 Ultra, and who should skip it',
      should: [
        'You want the largest Samsung screen with the S Pen included rather than sold separately.',
        'You want the 16 GB / 1 TB configuration that exists only on the top model of this line.',
        'Reading something private in a crowd is a real concern and the Privacy Display appeals to you.',
        'You want 200 MP stills, IP68 protection and Gorilla Armor 2 in one device.',
      ],
      skip: [
        'You need the phone weight before buying: Samsung does not publish it on its US pages for this model.',
        'You want S Pen remote shutter or gesture control, since Samsung states the S Pen does not support Bluetooth or Air Actions.',
        'You want a compact phone \u2014 the display measures 6.9 inches across the full rectangle.',
        'You need the exact pixel resolution rather than the QHD+ label Samsung publishes.',
      ],
    },
    useCases: [
      {
        heading: 'Where the Galaxy S26 Ultra fits',
        cards: [
          {
            title: 'Notes, markup and sketches',
            body: 'The S Pen ships with the phone and stores inside it, so an idea can be written down without unlocking anything else.',
          },
          {
            title: 'Photography on the move',
            body: 'A 200 MP f/1.4 main camera with a 50 MP ultra wide and a quad telephoto system, backed by 5,000 mAh and 60 W charging.',
          },
          {
            title: 'Privacy in public',
            body: 'Samsung\u2019s Privacy Display darkens the screen to anyone reading it from the side \u2014 the most specific new feature on this model.',
          },
        ],
      },
    ],
    pros: {
      heading: 'Samsung Galaxy S26 Ultra pros and cons',
      pros: [
        '6.9-inch QHD+ Dynamic AMOLED 2X display with a built-in Privacy Display',
        '200 MP f/1.4 main camera plus a 50 MP ultra wide and a quad telephoto system',
        'Snapdragon 8 Elite Gen 5 for Galaxy, with up to 16 GB of RAM and 1 TB of storage',
        '5,000 mAh with up to 60 W wired, 25 W wireless and Wireless PowerShare',
        'IP68, Armor Aluminum frame and Corning Gorilla Armor 2',
        'S Pen included with the phone',
      ],
      cons: [
        'Samsung does not publish the phone weight or full dimensions on its US pages',
        'The S Pen does not support Bluetooth or Air Actions on this model',
        'The exact pixel resolution is not published, so the sheet uses QHD+ as Samsung does',
        'Battery and charging numbers are Samsung ratings rather than independent measurements',
      ],
    },
    buyingTips: {
      heading: 'Buying the Galaxy S26 Ultra in the US',
      paragraphs: [
        'Decide memory first, because it cannot be added later: 16 GB of RAM comes only with the 1 TB model in Samsung\u2019s US line-up, and the other two configurations carry 12 GB. If you keep a phone for several years, that is the fork worth paying attention to.',
        'After that, treat the S Pen as a writing tool rather than a remote. Samsung states clearly that the S Pen for this model does not support Bluetooth or Air Actions, so anything you were planning to control from across the room is out \u2014 and if that matters, it is better to know before ordering than after.',
      ],
    },
    faqs: [
      {
        question: 'What processor does the Galaxy S26 Ultra use?',
        answer:
          'The Snapdragon 8 Elite Gen 5 for Galaxy, the version Samsung says is customised for Galaxy devices, according to its US comparison material for this model.',
      },
      {
        question: 'How much RAM and storage does the Galaxy S26 Ultra have?',
        answer:
          'Samsung\u2019s US configurations are 12 GB of RAM with 256 GB or 512 GB of storage, and 16 GB of RAM with 1 TB.',
      },
      {
        question: 'Does the Galaxy S26 Ultra come with an S Pen?',
        answer:
          'Yes, the phone includes an S Pen. Samsung states that the S Pen for this model does not support Bluetooth or Air Actions, so remote shutter and gesture controls are not available.',
      },
      {
        question: 'What is the Privacy Display on the Galaxy S26 Ultra?',
        answer:
          'A display feature Samsung says makes the screen appear dark when it is viewed from an angle, so people beside you see less of what is on screen.',
      },
      {
        question: 'How fast does the Galaxy S26 Ultra charge?',
        answer:
          'Samsung lists Super Fast Charging 3.0 up to 60 W over a cable, Super Fast Wireless Charging up to 25 W, and Wireless PowerShare for charging another device.',
      },
      {
        question: 'Is the Galaxy S26 Ultra waterproof?',
        answer:
          'It carries an IP68 water and dust resistance rating, alongside an Armor Aluminum frame and Corning Gorilla Armor 2. Samsung cautions that water resistance can be reduced by physical damage.',
      },
      {
        question: 'What cameras does the Galaxy S26 Ultra have?',
        answer:
          'A 200 MP wide camera at f/1.4, a 50 MP ultra wide at f/1.9 and a quad telephoto system pairing a 50 MP f/2.9 lens with a 10 MP sensor, plus a 12 MP front camera.',
      },
      {
        question: 'Does the Galaxy S26 Ultra have a titanium frame?',
        answer:
          'Samsung\u2019s US material for this model describes an Armor Aluminum frame with Corning Gorilla Armor 2, and does not identify the frame as titanium.',
      },
    ],
    links: [
      {
        label: 'Smartphones',
        href: '/shop/smartphones',
        description: 'Every phone the store carries.',
      },
      {
        label: 'Galaxy Tab S10 Ultra spec sheet',
        href: '/quick-look/samsung-galaxy-tab-s10-ultra',
        description: 'The other Samsung spec sheet \u2014 the tablet that shares the S Pen.',
      },
      {
        label: "Today's deals",
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

  'honor-robot-phone': {
    productName: 'HONOR Robot Phone',
    heading: 'HONOR Robot Phone specs, features and buying guide',
    lead: 'The HONOR Robot Phone is a 6.31-inch handset whose rear camera sits on a motorised gimbal arm that lifts out of the body, so the camera can turn and track without you moving the phone. It is aimed at people who shoot video and take photos on a phone and want the framing to behave like a small gimbal rather than a fixed lens.',
    overview: [
      'The moving camera is the whole idea. HONOR describes a 4-DoF motorised system with a 3-axis mechanical gimbal stabilisation system it calls the Titanium Agile Gimbal, carrying a 200 MP main sensor. The same phone also carries a 200 MP periscope telephoto and a 50 MP ultra wide, so the gimbal arm is an addition to a full camera set rather than a replacement for one.',
      'Around that, HONOR lists specifications that read like a current flagship: a 6.31-inch LTPO OLED panel with an adaptive 1-120 Hz refresh rate and a 6,800-nit peak brightness, the Snapdragon 8 Elite Gen 5, up to 16 GB of memory with 1 TB of storage, and a 7,060 mAh battery with 120 W wired and 50 W wireless HONOR SuperCharge.',
      'Two facts matter before the feature list. The first is where it is sold: HONOR\u2019s own pages and launch announcement point to China, with pre-orders from 12 August 2026 and sales from 18 August, and no HONOR US sales page for the model was found. The second is durability: HONOR lists IP54, which covers splashes rather than immersion. Everything below is HONOR\u2019s own published data, named in the sources note on this page.',
    ],
    priceSection: {
      heading: 'What to check before you buy the HONOR Robot Phone',
      paragraphs: [
        'The market question comes first, and HONOR\u2019s own pages answer it: the model is listed for sale in China, and HONOR\u2019s launch announcement describes Chinese pre-orders and a Chinese on-sale date. No HONOR US sales page for the Robot Phone was found, and the US address on HONOR\u2019s site redirects to its global site. If you are buying from outside HONOR\u2019s listed market, you are buying an imported device, and the software experience, the app ecosystem and the update schedule are the things to think through before ordering.',
        'The second thing to settle is the gimbal itself. A motorised camera arm is a moving part, and HONOR publishes no service-life figure or drop rating for it. It is also the reason the phone is 9.59 mm thick and around 248 g, so it changes how the device feels in a pocket long before it changes how a photo looks.',
      ],
    },
    keyFacts: [
      { term: 'Display', detail: '6.31-inch LTPO OLED, 1216 x 2640, 1-120 Hz' },
      { term: 'Processor', detail: 'Snapdragon 8 Elite Gen 5' },
      { term: 'Memory and storage', detail: '12 GB + 512 GB, or 16 GB + 1 TB' },
      { term: 'Rear cameras', detail: '200 MP gimbal main, 50 MP ultra wide, 200 MP periscope telephoto' },
      { term: 'Gimbal', detail: '4-DoF motorised arm with 3-axis mechanical stabilisation' },
      { term: 'Battery', detail: '7,060 mAh' },
      { term: 'Charging', detail: '120 W wired, 50 W wireless' },
      { term: 'Water and dust', detail: 'IP54' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'A camera on a motorised arm',
        body: 'HONOR describes four degrees of freedom on the rear camera module and a 3-axis mechanical gimbal, which is a different approach to stabilisation from the sensor-shift systems most phones use: the hardware moves the whole camera rather than the sensor inside it. HONOR says the arm can track subjects and locate a voice source, and it publishes hands-free gesture controls as part of the same idea \u2014 the camera turns to follow rather than you turning the phone.',
      },
      {
        heading: 'Key features explained',
        title: 'Three high-resolution rear cameras',
        body: 'The gimbal carries a 200 MP sensor with a 1/1.28-inch size, an f/1.6 aperture and optical image stabilisation. Beside it sit a 50 MP ultra wide at f/2.0 with a 122-degree field of view, and a 200 MP periscope telephoto on a 1/1.4-inch sensor at f/2.6 with 2.7x optical zoom and optical stabilisation of its own. HONOR lists digital zoom to 200x, which is an interpolated figure rather than an optical one.',
      },
      {
        heading: 'Key features explained',
        title: 'A 7,060 mAh battery with 120 W charging',
        body: 'The capacity is large for a phone this size, and HONOR pairs it with 120 W wired and 50 W wireless HONOR SuperCharge. Those are HONOR\u2019s ratings rather than measured results, and HONOR does not publish a charging-time figure on the specification pages reviewed, so the wattage tells you the class of charging rather than how long a fill takes.',
      },
      {
        heading: 'Key features explained',
        title: 'MagicOS 10 with YOYO Robot Mode',
        body: 'The software is MagicOS 10 on Android 16, and HONOR groups the robot-camera behaviours under YOYO Robot Mode: multimodal perception, gesture recognition, AI subject tracking, voice-source localisation, auto execution and live-stream or video-call tracking. HONOR also lists Camera Agent, Magic Pose and AI-assisted composition among the shooting features.',
      },
    ],
    deepDive: [
      {
        heading: 'What the robotic camera changes about shooting',
        paragraphs: [
          'A phone camera normally moves when you move. HONOR\u2019s design separates those two things: the arm can change the camera\u2019s angle while the handset stays where it is, which is why subject tracking and gesture control matter more here than they would on a fixed module. For filming yourself, or for leaving the phone on a table while you move around, that is the difference between holding a conversation with a subject and pointing a lens at one.',
          'The trade-offs are physical. Every moving part is a part that can wear, and HONOR publishes no durability figure for the mechanism. The module also makes the phone thicker than a conventional handset at 9.59 mm and heavier at about 248 g. If most of your photography is quick snapshots, the mechanism is doing expensive work you may never ask it to do.',
        ],
      },
      {
        heading: 'The three rear cameras, side by side',
        paragraphs: [
          'HONOR\u2019s specification page gives enough detail to compare the rear cameras directly, which is worth doing because the three lenses are built for different jobs rather than being the same sensor at three lengths.',
        ],
        table: {
          head: ['Rear camera, per HONOR', 'Sensor', 'Aperture', 'Stabilisation'],
          rows: [
            ['Gimbal main, 200 MP', '1/1.28-inch', 'f/1.6', 'Optical, on the motorised arm'],
            ['Ultra wide, 50 MP', 'Not stated by HONOR', 'f/2.0', 'Not stated by HONOR'],
            ['Periscope telephoto, 200 MP', '1/1.4-inch', 'f/2.6', 'Optical'],
          ],
        },
      },
      {
        heading: 'Display, size and what the numbers mean in the hand',
        paragraphs: [
          'The panel is a 6.31-inch LTPO OLED at 1216 x 2640 with an adaptive refresh rate between 1 and 120 Hz, and HONOR quotes a 6,800-nit peak brightness. Peak brightness figures describe small highlights rather than a full white screen, so treat it as a measure of outdoor legibility rather than of how bright the whole display gets.',
          'The frame measures 151.43 by 72.86 by 9.59 mm at about 248 g. A 6.31-inch screen is compact by current flagship standards, which makes the phone easier to hold with one hand than its weight suggests \u2014 but the depth and the weight both come from the camera system, so the Robot Phone is a device you choose for what the arm does.',
        ],
      },
      {
        heading: 'Software support, and the one number HONOR does not give',
        paragraphs: [
          'The operating system is MagicOS 10 based on Android 16. HONOR publishes a seven-year Android and security-update commitment for its Magic series, but that announcement is about the Magic series and does not establish a Robot Phone schedule; HONOR\u2019s current security-update bulletin page does not list the Robot Phone either. If you keep phones for five years, that gap is worth weighing before you buy a first-generation moving camera.',
          'What HONOR does publish is the feature list: YOYO Robot Mode, gesture controls, AI subject tracking, voice-source localisation, auto execution, and camera-side tools including Magic Pose and AI-assisted composition. Those are the parts of the software that depend on the hardware, which is why they are the parts least likely to appear on another phone.',
        ],
      },
    ],
    buyers: {
      heading: 'Who should buy the HONOR Robot Phone, and who should skip it',
      should: [
        'You film yourself or track moving subjects and want the camera to do the turning.',
        'You want a compact 6.31-inch flagship with a genuinely different camera system.',
        'You are comfortable buying a device whose listed market is China, and understand what that means for apps and software.',
        'You want a large battery in a small body: 7,060 mAh with 120 W wired charging.',
      ],
      skip: [
        'You need a phone sold and supported in your own market by HONOR \u2014 HONOR lists China for this model.',
        'You want water protection beyond splashes: HONOR lists IP54.',
        'You need a published operating-system update commitment, which HONOR does not state for this model.',
        'You dislike moving parts in a device you will keep for years; HONOR publishes no durability rating for the gimbal.',
      ],
    },
    useCases: [
      {
        heading: 'Where the Robot Phone fits',
        cards: [
          {
            title: 'Filming yourself',
            body: 'The arm turns the camera to the subject, so a phone propped on a desk can follow you instead of you re-framing it every few seconds.',
          },
          {
            title: 'Live streaming and video calls',
            body: 'HONOR lists live-stream and video-call tracking alongside voice-source localisation, which is the pair of features that makes the gimbal useful after the novelty wears off.',
          },
          {
            title: 'Photographers who want reach',
            body: 'A 200 MP periscope telephoto with 2.7x optical zoom sits next to the 200 MP main camera, so the long lens is a real sensor rather than a crop.',
          },
        ],
      },
    ],
    pros: {
      heading: 'HONOR Robot Phone pros and cons',
      pros: [
        'A 4-DoF motorised gimbal camera with 3-axis mechanical stabilisation',
        '200 MP gimbal main camera and a 200 MP periscope telephoto',
        '6.31-inch LTPO OLED at 1-120 Hz with 6,800-nit peak brightness',
        'Snapdragon 8 Elite Gen 5 with up to 16 GB of memory and 1 TB of storage',
        '7,060 mAh battery with 120 W wired and 50 W wireless charging',
        'Hands-free gesture controls and subject tracking',
      ],
      cons: [
        'HONOR lists China as the sales market, and no US sales page for the model was found',
        'IP54 only, which covers splashes rather than immersion',
        'No Robot Phone-specific operating-system update commitment is published',
        'No durability or service-life figure is published for the moving camera arm',
        'Battery and charging figures are HONOR ratings rather than independent measurements',
      ],
    },
    buyingTips: {
      heading: 'Buying the HONOR Robot Phone',
      paragraphs: [
        'Start with the market, because everything else depends on it. HONOR\u2019s own pages list the Robot Phone in China, and the launch announcement describes Chinese pre-orders from 12 August 2026 and sales from 18 August. If you are buying outside that market, work out the software and support position first, and check what radio bands the version you are buying covers against your own carrier \u2014 HONOR does not publish a US-market variant of this model.',
        'Then decide whether you want the moving camera at all. It is the reason the phone is thicker and heavier than its screen size suggests, and it is the feature that has no published durability rating. If the answer is yes, the rest of the specification \u2014 Snapdragon 8 Elite Gen 5, up to 16 GB and 1 TB, a 6.31-inch 120 Hz panel and a 7,060 mAh battery \u2014 is a current flagship specification, so you are buying the mechanism rather than settling for the hardware around it.',
      ],
    },
    faqs: [
      {
        question: 'What is the HONOR Robot Phone?',
        answer:
          'A 6.31-inch Android phone whose rear camera sits on a motorised 4-DoF gimbal arm with 3-axis mechanical stabilisation, carrying a 200 MP main sensor. HONOR announced it on 12 August 2026.',
      },
      {
        question: 'Is the HONOR Robot Phone sold in the US?',
        answer:
          'No HONOR US sales page for the model was found, and the US address on HONOR\u2019s site redirects to its global site. HONOR\u2019s own pages and launch announcement point to China, with sales starting 18 August 2026.',
      },
      {
        question: 'How many cameras does the Robot Phone have?',
        answer:
          'Three on the back: a 200 MP gimbal main camera on a 1/1.28-inch sensor at f/1.6, a 50 MP ultra wide at f/2.0 with a 122-degree field of view, and a 200 MP periscope telephoto on a 1/1.4-inch sensor at f/2.6 with 2.7x optical zoom. The front camera is 50 MP.',
      },
      {
        question: 'What is 4-DoF on the Robot Phone camera?',
        answer:
          'It describes four degrees of freedom of movement in HONOR\u2019s motorised camera arm, which HONOR pairs with a 3-axis mechanical gimbal stabilisation system it calls the Titanium Agile Gimbal.',
      },
      {
        question: 'Is the HONOR Robot Phone waterproof?',
        answer:
          'HONOR lists IP54 for this model, which protects against dust and splashes rather than immersion. It is not a phone to take swimming.',
      },
      {
        question: 'How long does the Robot Phone battery last?',
        answer:
          'HONOR lists a 7,060 mAh capacity with 120 W wired and 50 W wireless HONOR SuperCharge. HONOR does not publish a battery-life or charging-time figure on the pages reviewed for this sheet.',
      },
      {
        question: 'What software does the HONOR Robot Phone run?',
        answer:
          'MagicOS 10 based on Android 16, with YOYO Robot Mode, gesture recognition, AI subject tracking, voice-source localisation and hands-free gesture controls.',
      },
      {
        question: 'How long will the Robot Phone get software updates?',
        answer:
          'HONOR does not state a Robot Phone-specific operating-system or security-update commitment. Its published seven-year commitment covers the Magic series, and HONOR\u2019s current security-update bulletin does not list the Robot Phone.',
      },
    ],
    links: [
      {
        label: 'Smartphones',
        href: '/shop/smartphones',
        description: 'Every phone the store carries.',
      },
      {
        label: 'Galaxy S26 Ultra spec sheet',
        href: '/quick-look/samsung-galaxy-s26-ultra',
        description: 'Another flagship spec sheet, for comparison.',
      },
      {
        label: 'All Quick Look spec sheets',
        href: '/quick-look',
        description: 'Browse the rest of the Quick Look section.',
      },
    ],
  },

  'apple-iphone-17-pro-max': {
    productName: 'iPhone 17 Pro Max',
    heading: 'Apple iPhone 17 Pro Max specs, features and buying guide',
    lead: 'The iPhone 17 Pro Max is Apple\u2019s 6.9-inch flagship from 2025, built around the A19 Pro chip and a 48 MP Pro Fusion camera system that reaches 8x optical-quality zoom. It suits anyone who wants the largest iPhone display, the longest battery Apple rates in this generation, and a camera system that covers everything from wide to long without switching phones.',
    overview: [
      'The display is a 6.9-inch OLED Super Retina XDR panel at 2868 x 1320, with ProMotion running adaptively up to 120 Hz and an Always-On display. The chip is the A19 Pro, which Apple lists as a 6-core CPU with two performance and four efficiency cores, a 6-core GPU with Neural Accelerators and a 16-core Neural Engine.',
      'The camera system is where the model distinguishes itself: three 48 MP sensors \u2014 a Fusion Main at f/1.78, a Fusion Ultra Wide at f/2.2 and a Fusion Telephoto at f/2.8 on a tetraprism design \u2014 covering an 8x optical-quality zoom in, a 16x range and up to 40x digital. Storage runs from 256 GB to 2 TB.',
      'One availability fact belongs up front. Apple\u2019s current iPhone line-up page lists iPhone 18 Pro, iPhone Air, iPhone 17 and iPhone 17e, and does not include the iPhone 17 Pro Max, so Apple no longer presents this model as current, even though its technical specifications page for it remains live. Everything below comes from Apple\u2019s own pages, named in the sources note on this page.',
    ],
    priceSection: {
      heading: 'What to check before you buy the iPhone 17 Pro Max',
      paragraphs: [
        'The first thing to settle is which generation you are buying. Apple\u2019s current line-up page promotes the iPhone 18 Pro and does not list the 17 Pro Max, so a listing for this model is selling a previous-generation phone. That does not make it a bad buy \u2014 the specification is unchanged and Apple\u2019s support page for it is live \u2014 but it does mean comparing it with what replaced it before deciding.',
        'Then check the details that vary by model rather than by listing. Storage runs from 256 GB to 2 TB, and the battery and camera figures Apple publishes are identical across the Pro Max line-up, so capacity is the main thing a listing will change. US models use dual eSIM and, per Apple, are not compatible with physical SIM cards at all.',
      ],
    },
    keyFacts: [
      { term: 'Display', detail: '6.9-inch OLED Super Retina XDR, 2868 x 1320 at 460 ppi' },
      { term: 'Refresh rate', detail: 'ProMotion, adaptive up to 120 Hz, Always-On' },
      { term: 'Chip', detail: 'A19 Pro: 6-core CPU, 6-core GPU, 16-core Neural Engine' },
      { term: 'Storage', detail: '256 GB, 512 GB, 1 TB or 2 TB' },
      { term: 'Rear cameras', detail: 'Three 48 MP sensors: Fusion Main, Ultra Wide and Telephoto' },
      { term: 'Zoom', detail: '8x optical-quality in and up to 40x digital' },
      { term: 'Battery', detail: 'Up to 39 hours of video playback, per Apple' },
      { term: 'Weight', detail: '233 g (8.22 oz)' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'A vapor chamber, which is new for this design',
        body: 'Apple says the phone has an Apple-designed vapor chamber laser-welded into the aluminum chassis with deionized water sealed inside, moving heat away from the A19 Pro and into the unibody. Apple attributes up to 40% better sustained performance than the previous generation to the chip paired with that chamber \u2014 a claim about long sessions rather than peak speed.',
      },
      {
        heading: 'Key features explained',
        title: 'Three 48 MP cameras instead of three different sensors',
        body: 'Apple calls it a 48 MP Pro Fusion camera system: a main camera at 24 mm and f/1.78, an ultra wide at 13 mm and f/2.2 with a 120-degree field of view, and a telephoto at 100 mm and f/2.8 on a tetraprism design with 3D sensor-shift stabilisation. The same main sensor also produces a 12 MP 48 mm 2x shot, and the telephoto produces a 12 MP 200 mm 8x shot.',
      },
      {
        heading: 'Key features explained',
        title: 'Video aimed at people who finish in an editor',
        body: 'Apple lists 4K Dolby Vision at up to 120 fps on the Fusion Main camera, slo-mo at 4K up to 120 fps and 1080p up to 240 fps, and ProRes up to 4K at 120 fps with external recording, alongside ProRes RAW, Apple Log 2, ACES and Genlock. Cinematic mode reaches 4K at 30 fps and Action mode 2.8K at 60 fps.',
      },
      {
        heading: 'Key features explained',
        title: 'Charging, in three numbers',
        body: 'Apple rates the battery at up to 39 hours of video playback and up to 35 hours of streamed video. Charging is up to 50% in 20 minutes with a 40 W-or-higher adapter and a USB-C cable, or up to 50% in 30 minutes on MagSafe with a 30 W-or-higher adapter, with MagSafe and Qi2 wireless charging at up to 25 W.',
      },
    ],
    deepDive: [
      {
        heading: 'Display, size and the Always-On panel',
        paragraphs: [
          'At 6.9 inches and 460 ppi, this is the largest and sharpest display Apple ships in the 17 Pro generation, with ProMotion adapting the refresh rate up to 120 Hz and an Always-On mode that keeps information visible without waking the phone. Those are the two features that make the size usable rather than merely large.',
          'The body measures 163.4 by 78.0 by 8.75 mm at 233 g, in an aluminum unibody with Ceramic Shield 2 on the front and Ceramic Shield on the back. That is a two-handed device for most people, which is the trade for the screen and the battery.',
        ],
      },
      {
        heading: 'The camera system, zoom by zoom',
        paragraphs: [
          'Apple\u2019s optical-quality language is doing specific work here: the main camera covers 1x at 24 mm and produces a 2x shot at 48 mm, while the telephoto covers 4x at 100 mm and produces an 8x shot at 200 mm. The result is an 8x optical-quality zoom in, a 16x optical-quality range across the three cameras, and digital zoom to 40x on top of that.',
          'The front camera is an 18 MP Center Stage sensor at f/1.9 with autofocus, which Apple lists with 4K Dolby Vision video up to 60 fps and ProRes recording up to 4K at 60 fps with external recording. The macro, time-lapse and Night mode time-lapse modes sit alongside them; the last of those is worth knowing about because it is the mode that benefits most from the vapor chamber during long exposures.',
        ],
        table: {
          head: ['Camera, per Apple', 'Sensor', 'Focal length', 'Aperture'],
          rows: [
            ['Fusion Main', '48 MP', '24 mm', 'f/1.78'],
            ['Fusion Ultra Wide', '48 MP', '13 mm, 120 degrees', 'f/2.2'],
            ['Fusion Telephoto', '48 MP', '100 mm, 4x', 'f/2.8'],
            ['Front, Center Stage', '18 MP', 'Not stated by Apple', 'f/1.9'],
          ],
        },
      },
      {
        heading: 'Battery and charging in practice',
        paragraphs: [
          'Apple\u2019s headline is up to 39 hours of video playback, with up to 35 hours for streamed video, and it does not publish an audio-playback figure on the US technology-specifications page for this model. As always those are Apple\u2019s ratings under set conditions, so your own number will track how much screen time and camera time the day contains.',
          'Charging divides into wired and wireless. Wired, Apple quotes up to 50% in 20 minutes with a 40 W-or-higher adapter; on MagSafe, up to 50% in 30 minutes with a 30 W-or-higher adapter, with wireless charging peaking at 25 W on MagSafe or Qi2. The adapter and cable are what a listing will not tell you, so they are worth checking with the order.',
        ],
      },
      {
        heading: 'Connectivity, SIMs and Apple Intelligence',
        paragraphs: [
          'The port is USB-C with USB 3 support up to 10 Gb/s and DisplayPort, which is the detail that matters if you move ProRes files off the phone rather than over the air. Wireless is Wi-Fi 7 with 2x2 MIMO, Bluetooth 6, Thread for smart-home accessories, and 5G including sub-6GHz and mmWave.',
          'US models use dual eSIM and Apple states they are not compatible with physical SIM cards. On the software side, Apple highlighted Live Translation for text and audio across Messages, FaceTime and Phone, and visual intelligence for acting on what is on screen, and it describes Apple Intelligence as beta with feature and language availability that may vary.',
        ],
      },
    ],
    buyers: {
      heading: 'Who should buy the iPhone 17 Pro Max, and who should skip it',
      should: [
        'You want the largest iPhone display with ProMotion and an Always-On screen.',
        'You shoot video seriously and want ProRes, Apple Log 2 and 4K at 120 fps.',
        'You need optical-quality reach beyond 4x without giving up the wide cameras.',
        'You want Apple\u2019s longest video-playback rating in this generation.',
      ],
      skip: [
        'You always want Apple\u2019s newest generation: the current line-up page lists the iPhone 18 Pro, not this model.',
        'You need a physical SIM card slot \u2014 US models are dual eSIM only.',
        'You want a phone you can comfortably use one-handed at 233 g and 6.9 inches.',
        'You need a published audio-playback battery figure, which Apple does not list for this model.',
      ],
    },
    useCases: [
      {
        heading: 'Where the iPhone 17 Pro Max fits',
        cards: [
          {
            title: 'Video on the move',
            body: 'ProRes up to 4K at 120 fps with external recording, 4K Dolby Vision, and a USB-C port rated to 10 Gb/s for getting the files off the phone.',
          },
          {
            title: 'Photography across distances',
            body: 'Three 48 MP sensors covering 13 mm to 100 mm, with 8x optical-quality zoom and up to 40x digital on top.',
          },
          {
            title: 'Long days away from a charger',
            body: 'Up to 39 hours of video playback per Apple, with up to 50% back in 20 minutes on a 40 W-or-higher adapter.',
          },
        ],
      },
    ],
    pros: {
      heading: 'Apple iPhone 17 Pro Max pros and cons',
      pros: [
        '6.9-inch OLED Super Retina XDR at up to 120 Hz with Always-On',
        'A19 Pro with a 6-core CPU, 6-core GPU and 16-core Neural Engine',
        'Three 48 MP rear cameras with an 8x optical-quality zoom',
        'Up to 39 hours of video playback and up to 50% charge in 20 minutes',
        'IP68 to 6 metres, with Ceramic Shield 2 on the front',
        'A vapor chamber Apple says improves sustained performance',
      ],
      cons: [
        'No longer in Apple\u2019s current iPhone line-up',
        '233 g and 6.9 inches make it a two-handed phone',
        'US models are dual eSIM with no physical SIM support',
        'Apple publishes no audio-playback hour figure for this model',
        'Battery and charging numbers are Apple ratings rather than independent measurements',
      ],
    },
    buyingTips: {
      heading: 'Buying the iPhone 17 Pro Max in the US',
      paragraphs: [
        'Since Apple\u2019s line-up page has moved on to the iPhone 18 Pro, the useful question is not whether this phone is current but whether it does the job you need at the storage tier you want. The camera system, the display and the A19 Pro are unchanged by the arrival of a newer model, and Apple\u2019s technical-specifications page for it remains the reference \u2014 so compare the specification, not the generation number.',
        'Two practical points before ordering. Storage is the only hardware variable a listing changes, running from 256 GB to 2 TB, so pick the tier deliberately: ProRes footage at 4K is what eats capacity fastest. And because US models are dual eSIM with no physical SIM tray, set the phone up with your carrier\u2019s eSIM process rather than expecting to move a card across.',
      ],
    },
    faqs: [
      {
        question: 'What chip does the iPhone 17 Pro Max use?',
        answer:
          'The A19 Pro, which Apple lists as a 6-core CPU with two performance and four efficiency cores, a 6-core GPU with Neural Accelerators, and a 16-core Neural Engine.',
      },
      {
        question: 'How big is the iPhone 17 Pro Max display?',
        answer:
          '6.9 inches diagonally on an OLED Super Retina XDR panel at 2868 x 1320 and 460 ppi, with ProMotion adapting the refresh rate up to 120 Hz and an Always-On display.',
      },
      {
        question: 'Does the iPhone 17 Pro Max have a physical SIM slot?',
        answer:
          'No. Apple states that US models use dual eSIM and are not compatible with physical SIM cards.',
      },
      {
        question: 'How much zoom does the iPhone 17 Pro Max have?',
        answer:
          'Apple specifies 8x optical-quality zoom in, 2x optical zoom out, a 16x optical-quality zoom range and digital zoom up to 40x. The telephoto is a 48 MP sensor at 100 mm (4x), which also produces a 12 MP 200 mm 8x shot.',
      },
      {
        question: 'How long does the iPhone 17 Pro Max battery last?',
        answer:
          'Apple rates it at up to 39 hours of video playback and up to 35 hours of streamed video playback. Apple does not publish an audio-playback figure for this model on its US technology-specifications page.',
      },
      {
        question: 'How fast does the iPhone 17 Pro Max charge?',
        answer:
          'Apple quotes up to 50% in 20 minutes with a 40 W-or-higher adapter and a USB-C cable, or up to 50% in 30 minutes on MagSafe with a 30 W-or-higher adapter. Wireless charging reaches 25 W on MagSafe or Qi2.',
      },
      {
        question: 'Is the iPhone 17 Pro Max still sold by Apple?',
        answer:
          'Apple\u2019s current iPhone line-up page lists the iPhone 18 Pro, iPhone Air, iPhone 17 and iPhone 17e, and does not include the iPhone 17 Pro Max, so Apple does not present it as a current model. Its technical-specifications page for the model is still published.',
      },
      {
        question: 'Is the iPhone 17 Pro Max waterproof?',
        answer:
          'It carries an IP68 rating under IEC 60529, which Apple specifies as a maximum depth of 6 metres for up to 30 minutes in laboratory conditions.',
      },
    ],
    links: [
      {
        label: 'Smartphones',
        href: '/shop/smartphones',
        description: 'Every phone the store carries.',
      },
      {
        label: 'iPad Air 11-inch (M3) spec sheet',
        href: '/quick-look/apple-ipad-air-11-m3',
        description: 'The Apple tablet spec sheet, if you are pairing the two.',
      },
      {
        label: "Today's deals",
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

  'vivo-x300-pro': {
    productName: 'vivo X300 Pro',
    heading: 'vivo X300 Pro specs, features and buying guide',
    lead: 'The vivo X300 Pro is a camera-first flagship: a 6.78-inch AMOLED display with an LTPO refresh rate between 1 and 120 Hz, a MediaTek Dimensity 9500, and three ZEISS-branded rear cameras led by a 200 MP telephoto. It suits someone who wants long-range reach and a big battery, and who is ready to look past a US-market gap.',
    overview: [
      'The camera hardware is the reason this phone exists in its segment. vivo lists a 50 MP main camera on a Sony LYT-828 sensor at f/1.57, a 50 MP ultra wide on a JN1 sensor at f/2.0, and a 200 MP telephoto on an HPB sensor at f/2.67 with 3.5x optical zoom and optical stabilisation, all three branded under ZEISS.',
      'The rest of the specification is current-flagship work: a 6.78-inch AMOLED at 2800 x 1260 and 452 ppi with 4,500-nit local peak brightness, 16 GB of LPDDR5X Ultra memory with 512 GB of UFS 4.1 storage, and a 6,510 mAh battery charged at 90 W over a cable or 40 W on a pad.',
      'One thing has to be said plainly, and vivo\u2019s own site is the source for it. vivo\u2019s official country selector does not list the United States, and no vivo US sales or support listing for the X300 Pro was found. It is sold in vivo\u2019s global, India and Europe markets. Everything below is vivo\u2019s published data, and where vivo does not state a value, this sheet leaves it out rather than filling it in.',
    ],
    priceSection: {
      heading: 'What to check before you buy the vivo X300 Pro',
      paragraphs: [
        'The market is the first question, because it changes the rest of the decision. vivo sells the X300 Pro through its global, India and Europe channels, and its country selector does not include the United States, so a US buyer is looking at an import. That affects how the phone is serviced, which radio bands the version you buy covers, and which accessories and regional software it ships with.',
        'The second thing to check is the battery figure, because vivo publishes two. Its global and India specification pages list 6,510 mAh typical and state that the figure applies to markets outside Europe, while vivo\u2019s Europe page lists 5,440 mAh typical for the same model name. Whichever region you are buying from, that is the number your device is built to.',
      ],
    },
    keyFacts: [
      { term: 'Display', detail: '6.78-inch AMOLED, 2800 x 1260 at 452 ppi' },
      { term: 'Refresh rate', detail: 'LTPO, adaptive 1-120 Hz' },
      { term: 'Chipset', detail: 'MediaTek Dimensity 9500' },
      { term: 'Memory and storage', detail: '16 GB LPDDR5X Ultra with 512 GB UFS 4.1' },
      { term: 'Telephoto', detail: '200 MP ZEISS APO at f/2.67 with 3.5x optical zoom' },
      { term: 'Battery', detail: '6,510 mAh typical outside Europe, per vivo' },
      { term: 'Charging', detail: '90 W wired FlashCharge and 40 W wireless' },
      { term: 'Durability', detail: 'IP68 and IP69' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'A 200 MP telephoto with ZEISS branding',
        body: 'The long camera is the standout: a 200 MP sensor at f/2.67 with autofocus, optical image stabilisation and 3.5x optical zoom, which vivo markets under the ZEISS APO name. A sensor that dense at that focal length is unusual, and the optical zoom figure is credited to vivo\u2019s India specification page rather than inferred from the lens.',
      },
      {
        heading: 'Key features explained',
        title: 'The main camera is stabilised, not just big',
        body: 'vivo calls the main camera a ZEISS Gimbal-Grade 50 MP module on a Sony LYT-828 sensor at f/1.57 with optical image stabilisation. It is the widest aperture in the system, which is what makes it the low-light default; the ultra wide sits at f/2.0 with autofocus and a 119-degree view.',
      },
      {
        heading: 'Key features explained',
        title: 'A battery with two official figures',
        body: 'vivo lists 6,510 mAh typical for markets outside Europe and 5,440 mAh typical on its Europe page. Charging is 90 W wired FlashCharge and 40 W wireless on both. Publishing both figures rather than one is the reason this sheet lists them separately instead of picking a favourite.',
      },
      {
        heading: 'Key features explained',
        title: 'IP68 and IP69, which are not the same thing',
        body: 'vivo rates the X300 Pro to both standards. IP68 covers dust and immersion; IP69 covers protection against high-pressure, high-temperature water jets. Together they describe a phone built for wet conditions, though neither rating is a licence to take it swimming.',
      },
    ],
    deepDive: [
      {
        heading: 'The camera system, sensor by sensor',
        paragraphs: [
          'vivo\u2019s specification pages are specific about two of the three sensors and silent about the third maker, which is worth passing on rather than papering over. The main camera is a Sony LYT-828, the ultra wide is a JN1 and the telephoto is identified as an HPB; vivo does not name the maker of the HPB on the pages reviewed.',
          'The front camera is a 50 MP JN1 at f/2.0 with autofocus and ZEISS branding, which is a higher-resolution selfie camera than most flagships carry. Between them, the four cameras cover 119 degrees at the wide end and 3.5x optical at the long end.',
        ],
        table: {
          head: ['Camera, per vivo', 'Sensor', 'Aperture', 'Notes'],
          rows: [
            ['Main, 50 MP', 'Sony LYT-828', 'f/1.57', 'ZEISS Gimbal-Grade, optical stabilisation'],
            ['Ultra wide, 50 MP', 'JN1', 'f/2.0', 'Autofocus, 119 degrees'],
            ['Telephoto, 200 MP', 'HPB', 'f/2.67', 'ZEISS APO, 3.5x optical'],
            ['Front, 50 MP', 'JN1', 'f/2.0', 'Autofocus, 92 degrees, ZEISS'],
          ],
        },
      },
      {
        heading: 'Display, brightness and what 452 ppi buys you',
        paragraphs: [
          'The panel is a 6.78-inch AMOLED at 2800 x 1260, which vivo measures at 452 ppi, with an LTPO refresh rate adapting between 1 and 120 Hz. LTPO is the reason a phone this size can hold a high refresh rate without draining the battery during a static screen, because the display drops to 1 Hz when nothing is moving.',
          'vivo also publishes a 4,500-nit local peak brightness figure. As with every peak number, it describes small highlights rather than a full-screen white, so read it as outdoor legibility. The body is 161.98 by 75.48 by 7.99 mm at 226 g, which is thin for the battery inside it.',
        ],
      },
      {
        heading: 'Software, connectivity and the small omissions',
        paragraphs: [
          'The operating system is OriginOS 6 on Android 16, with a 3D ultrasonic fingerprint sensor, Wi-Fi 6 and Wi-Fi 7, Bluetooth 6.0, NFC, USB 3.2 Gen 1 and an infrared blaster. vivo lists Hi-Fi audio as not supported and FM as not supported, and states that storage is not expandable, so the 512 GB in the reviewed configuration is what you get.',
          'One practical detail belongs in a buying guide rather than a footnote: vivo says the phone supports Bluetooth and digital USB-C earphones but not analogue wired earphones, and that 3.5 mm analogue headphones need a separately purchased USB-C adapter with a built-in DAC. If you still use wired headphones, that is an extra item to plan for.',
        ],
      },
      {
        heading: 'Where the X300 Pro fits against its own family and the US market',
        paragraphs: [
          'vivo positions the X300 Pro as the camera-led option in its X300 line, and the specification backs that up: a 200 MP telephoto is the part most phones in this class do not have. If you compare it with other flagships, compare the optical zoom factors and aperture sizes, because those are the figures the manufacturers publish and the ones that change what a photo looks like.',
          'The market question is separate from the hardware. vivo\u2019s country selector omits the United States, and its international-warranty eligibility page does not cover the US either, so a US buyer is importing. That is not a reason to avoid the phone, but it is a reason to check the version, the bands and the support path before ordering rather than after.',
        ],
      },
    ],
    buyers: {
      heading: 'Who should buy the vivo X300 Pro, and who should skip it',
      should: [
        'You want long-range reach from a 200 MP telephoto with 3.5x optical zoom.',
        'You shoot in low light and want the widest aperture in the system as your main camera.',
        'You want a large battery and fast charging: 6,510 mAh with 90 W wired outside Europe.',
        'You are comfortable importing, and you have checked the version and its bands.',
      ],
      skip: [
        'You need a phone sold and supported in the US \u2014 vivo\u2019s country selector does not list it.',
        'You want expandable storage, which vivo states is not supported.',
        'You use 3.5 mm analogue headphones without wanting a USB-C DAC adapter.',
        'You need the battery figure to be the same in every market; vivo publishes two.',
      ],
    },
    useCases: [
      {
        heading: 'Where the X300 Pro fits',
        cards: [
          {
            title: 'Long-range photography',
            body: 'A 200 MP telephoto at 3.5x optical and a stabilised 50 MP main camera cover everything between 119 degrees and a compressed portrait.',
          },
          {
            title: 'Travel and full days out',
            body: 'A 6,510 mAh battery with 90 W wired charging, plus IP68 and IP69 protection against rain and spray.',
          },
          {
            title: 'Video and calls',
            body: 'A 50 MP autofocus front camera and Wi-Fi 7 with Bluetooth 6.0, in a 7.99 mm body that weighs 226 g.',
          },
        ],
      },
    ],
    pros: {
      heading: 'vivo X300 Pro pros and cons',
      pros: [
        '200 MP ZEISS APO telephoto with 3.5x optical zoom and optical stabilisation',
        '50 MP main camera on a Sony LYT-828 sensor at f/1.57',
        '6.78-inch AMOLED with an LTPO 1-120 Hz refresh rate',
        'Dimensity 9500 with 16 GB of LPDDR5X Ultra memory and 512 GB of UFS 4.1 storage',
        '6,510 mAh with 90 W wired and 40 W wireless charging outside Europe',
        'IP68 and IP69 ratings, and a 3D ultrasonic fingerprint sensor',
      ],
      cons: [
        'vivo\u2019s country selector does not list the United States',
        'Two different official battery figures depending on region',
        'No expandable storage, per vivo',
        'No speaker configuration is published for this model',
        'Analogue wired earphones need a separately purchased USB-C adapter with a DAC',
      ],
    },
    buyingTips: {
      heading: 'Buying the vivo X300 Pro',
      paragraphs: [
        'Work out the region first. vivo\u2019s site divides its products by market, and the X300 Pro is listed for its global, India and Europe channels. The version you buy decides the battery capacity you get, because vivo publishes 6,510 mAh outside Europe and 5,440 mAh on its Europe page, and it also decides which bands the phone supports \u2014 something neither this page nor vivo\u2019s global specification can settle for your carrier.',
        'Then decide whether the camera is worth the compromises. You are buying a 200 MP telephoto with 3.5x optical zoom, a stabilised 50 MP main camera and a 6,510 mAh battery in a 7.99 mm body; in exchange you take no expandable storage, no published speaker configuration, and a wired-headphone situation that needs an adapter. If the camera is not the reason, a mainstream US-market phone will be simpler to own.',
      ],
    },
    faqs: [
      {
        question: 'Is the vivo X300 Pro sold in the US?',
        answer:
          'No vivo US sales or support listing for the X300 Pro was found, and vivo\u2019s official country selector does not list the United States. The model is listed for vivo\u2019s global, India and Europe markets.',
      },
      {
        question: 'What is the X300 Pro battery capacity?',
        answer:
          'vivo publishes two figures: 6,510 mAh typical for markets outside Europe, and 5,440 mAh typical on its Europe specification page. Both versions are listed with 90 W wired FlashCharge and 40 W wireless charging.',
      },
      {
        question: 'How much optical zoom does the X300 Pro have?',
        answer:
          '3.5x optical on the 200 MP ZEISS APO telephoto, which vivo specifies at f/2.67 with autofocus and optical image stabilisation.',
      },
      {
        question: 'What chip does the vivo X300 Pro use?',
        answer:
          'The MediaTek Dimensity 9500, an 8-core chipset, paired in the configuration vivo publishes with 16 GB of LPDDR5X Ultra memory and 512 GB of UFS 4.1 storage.',
      },
      {
        question: 'Does the vivo X300 Pro support a microSD card?',
        answer: 'No. vivo states that expandable storage is not supported on this model.',
      },
      {
        question: 'Is the X300 Pro waterproof?',
        answer:
          'It carries both IP68 and IP69 ratings. IP68 covers dust and immersion, while IP69 covers protection against high-pressure, high-temperature water jets.',
      },
      {
        question: 'Can I use wired headphones with the X300 Pro?',
        answer:
          'Only digital USB-C earphones directly. vivo states that analogue 3.5 mm earphones need a separately purchased USB-C adapter with a built-in DAC.',
      },
      {
        question: 'How fast does the vivo X300 Pro charge?',
        answer:
          'vivo lists 90 W wired FlashCharge and 40 W wireless charging. vivo does not publish a charging-time figure on the specification pages reviewed for this sheet.',
      },
    ],
    links: [
      {
        label: 'Smartphones',
        href: '/shop/smartphones',
        description: 'Every phone the store carries.',
      },
      {
        label: 'Galaxy S26 Ultra spec sheet',
        href: '/quick-look/samsung-galaxy-s26-ultra',
        description: 'A US-market flagship spec sheet to compare it with.',
      },
      {
        label: "Today's deals",
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

  'apple-ipad-air-11-m3': {
    productName: 'iPad Air 11-inch (M3)',
    heading: 'Apple iPad Air 11-inch (M3) specs, features and buying guide',
    lead: 'The 11-inch iPad Air with the M3 chip is the middle of Apple\u2019s tablet range: a Liquid Retina display at 264 ppi, 8 GB of memory, Apple Pencil Pro support and a front camera that finally sits in the landscape edge. It suits people who want one light device for notes, reading, video and light work rather than a laptop.',
    overview: [
      'Apple introduced this model on 4 March 2025, with devices arriving from 12 March. The display measures 10.86 inches diagonally as a rectangle, which Apple markets as 11 inches, at 2360 x 1640 and 264 ppi with 500 nits of brightness, P3 wide colour, True Tone, full lamination and an antireflective coating.',
      'Inside are the M3 with an 8-core CPU split between four performance and four efficiency cores, a 9-core GPU and a 16-core Neural Engine, plus 8 GB of memory. Storage runs from 128 GB to 1 TB, and the whole thing weighs 460 g at 6.1 mm thick.',
      'Two facts shape a purchase. Apple\u2019s current iPad Air page now promotes the M4 generation, so the M3 model this sheet describes is a previous generation even though Apple\u2019s technical-specifications page for it is live. And Apple lists a 20 W USB-C power adapter in the box, with no faster charging figure published. Everything below is Apple\u2019s own data, named in the sources note on this page.',
    ],
    priceSection: {
      heading: 'What to check before you buy the iPad Air 11-inch (M3)',
      paragraphs: [
        'Start with the generation question, because it changes the comparison. Apple\u2019s current iPad Air page promotes the M4 model, and the M3 remains documented on Apple Support. That means the specification on this page is accurate for the model named, and it also means checking what the newer generation changed before deciding that the older one is the bargain.',
        'The Pencil is the other thing to settle, and it is not a small one on a tablet. This iPad Air takes Apple Pencil Pro and Apple Pencil (USB-C), which are two different products with different features, and neither ships in the box. The keyboard is a third purchase: Apple lists the Magic Keyboard for iPad Air as the compatible option. Between a Pencil and a keyboard the accessories can matter as much as the storage tier.',
      ],
    },
    keyFacts: [
      { term: 'Display', detail: '11-inch Liquid Retina, 2360 x 1640 at 264 ppi, 500 nits' },
      { term: 'Chip', detail: 'Apple M3: 8-core CPU, 9-core GPU, 16-core Neural Engine' },
      { term: 'Memory', detail: '8 GB' },
      { term: 'Storage', detail: '128 GB, 256 GB, 512 GB or 1 TB' },
      { term: 'Front camera', detail: 'Landscape 12 MP Center Stage at f/2.0' },
      { term: 'Battery', detail: '28.93 Wh, up to 10 hours of web surfing or video' },
      { term: 'Port', detail: 'USB-C with USB 3 support up to 10 Gb/s' },
      { term: 'Weight', detail: '460 g (1.01 lb)' },
    ],
    features: [
      {
        heading: 'Key features explained',
        title: 'The front camera moved to the landscape edge',
        body: 'The front camera is a 12 MP Center Stage sensor at f/2.0, and Apple\u2019s connector diagram places it at the right of the display in landscape. That is the orientation a video call actually happens in when the tablet is propped on a keyboard, and it is the change that matters most for anyone who spends the day on calls.',
      },
      {
        heading: 'Key features explained',
        title: 'An M3 rather than a mobile chip',
        body: 'The M3 is the same silicon family Apple puts in Macs, listed here with an 8-core CPU, a 9-core GPU and a 16-core Neural Engine, paired with 8 GB of memory. That combination is what lets a tablet this thin run tablet apps and desktop-class software without the usual compromise.',
      },
      {
        heading: 'Key features explained',
        title: 'Apple Pencil Pro and Magic Keyboard support',
        body: 'Apple lists Apple Pencil Pro and Apple Pencil (USB-C) as compatible, and the Magic Keyboard for iPad Air as the keyboard option. Pencil Pro adds the squeeze and barrel-roll style interactions that the USB-C Pencil does not have, so the two are not interchangeable if those matter to your workflow.',
      },
      {
        heading: 'Key features explained',
        title: 'USB-C at USB 3 speed',
        body: 'The port is USB-C with USB 3 support up to 10 Gb/s, which is worth noting because plenty of tablets make you choose between a modern connector and a fast one. It is the same speed class Apple quotes on its phones, and it makes external drives and card readers usable rather than painful.',
      },
    ],
    deepDive: [
      {
        heading: 'The display, and what 500 nits means day to day',
        paragraphs: [
          'Apple specifies 500 nits of brightness on a 2360 x 1640 panel at 264 ppi, with P3 wide colour, True Tone, full lamination and an antireflective coating. The lamination is the part that changes how the tablet feels in use: it removes the visible gap between the glass and the picture, which is why the screen reads as closer to your finger than an entry-level iPad\u2019s.',
          'Brightness is the honest limit. 500 nits is comfortable indoors and adequate in shade, and it is well below what Apple\u2019s phone panels reach. If you plan to use the tablet outdoors in direct sun, compare that figure with whatever else you are considering.',
        ],
      },
      {
        heading: 'Battery, charging and the adapter in the box',
        paragraphs: [
          'The battery is a 28.93-watt-hour unit that Apple rates at up to 10 hours of web surfing on Wi-Fi or video watching, and at up to 9 hours of web surfing on cellular models. Those are Apple\u2019s own figures under set conditions, and like all tablet numbers they move with screen brightness and with how much you use the Pencil.',
          'Apple lists a 20 W USB-C power adapter in the box and publishes no faster-charging figure for this model on the technical-specifications page, so there is no fast-charge promise to compare against. Charging through a computer\u2019s USB-C port is also documented, which is useful when travelling with a laptop rather than a wall adapter.',
        ],
      },
      {
        heading: 'Storage tiers, and why 128 GB is the wrong end for some buyers',
        paragraphs: [
          'Storage runs from 128 GB to 1 TB across four tiers: 128 GB, 256 GB, 512 GB or 1 TB. Because the memory is fixed at 8 GB on every tier, the storage is the only thing the extra spend buys \u2014 which is worth knowing, because it is easy to assume a larger tier also means a faster device.',
          'The tier that makes sense depends on what you put on it. Video editing, downloaded shows and offline maps are what consume a tablet, and none of those can be solved later without replacing the device. If you are unsure, 256 GB is the tier that avoids the 128 GB question entirely; if the tablet is mostly a screen for streaming and notes, 128 GB stays workable.',
        ],
      },
      {
        heading: 'Where it sits in Apple\u2019s range now',
        paragraphs: [
          'Apple\u2019s current iPad Air product page promotes the M4 generation, and the M3 remains in Apple\u2019s model comparison and on Apple Support. That is a normal lifecycle for a tablet: the hardware stays documented and supported, and the marketing moves on. For a buyer the practical consequence is that a spec-sheet comparison across generations is now necessary rather than optional.',
          'The fixed points in this model are the 10.86-inch display, the M3 and its 8 GB of memory, the landscape front camera, the two Pencil options, the Magic Keyboard, Wi-Fi 6E, Bluetooth 5.3, USB 3 speeds over USB-C, Touch ID in the top button, and 460 g at 6.1 mm. Those are what you are buying, whichever generation number is on the box.',
        ],
      },
    ],
    buyers: {
      heading: 'Who should buy the iPad Air 11-inch (M3), and who should skip it',
      should: [
        'You want a light tablet for notes and sketching, with Apple Pencil Pro support.',
        'You take a lot of video calls and want the front camera in the landscape edge.',
        'You want desktop-class silicon in a 460 g body rather than an entry-level tablet chip.',
        'You move files: USB-C at USB 3 speeds up to 10 Gb/s is unusual at this size.',
      ],
      skip: [
        'You always want Apple\u2019s current generation \u2014 the iPad Air page now promotes the M4 model.',
        'You need a Pencil or a keyboard in the box: neither is included.',
        'You want more than 8 GB of memory, which Apple does not offer on this model.',
        'You need water or dust protection, which Apple does not rate for the iPad Air.',
      ],
    },
    useCases: [
      {
        heading: 'Where the iPad Air 11-inch (M3) fits',
        cards: [
          {
            title: 'Study and note-taking',
            body: 'Apple Pencil Pro support with a laminated 264 ppi display, in a tablet that weighs 460 g and is 6.1 mm thick.',
          },
          {
            title: 'Video calls and remote work',
            body: 'A landscape 12 MP Center Stage front camera, plus a Magic Keyboard for iPad Air when you want a real keyboard.',
          },
          {
            title: 'Reading, streaming and travel',
            body: 'Up to 10 hours of web surfing or video per Apple, with charging over USB-C from a wall adapter or a laptop.',
          },
        ],
      },
    ],
    pros: {
      heading: 'Apple iPad Air 11-inch (M3) pros and cons',
      pros: [
        'Apple M3 with an 8-core CPU, 9-core GPU and 16-core Neural Engine',
        '11-inch Liquid Retina display at 2360 x 1640, 264 ppi and 500 nits',
        'Landscape 12 MP Center Stage front camera',
        'Apple Pencil Pro and Apple Pencil (USB-C) support',
        'USB-C with USB 3 support up to 10 Gb/s',
        '460 g and 6.1 mm, with Wi-Fi 6E and Bluetooth 5.3',
      ],
      cons: [
        'No longer the current generation: Apple\u2019s iPad Air page promotes the M4 model',
        'Memory is fixed at 8 GB on every storage tier',
        'A 20 W adapter is listed in the box, with no faster-charging figure published',
        'No water or dust resistance rating is stated by Apple',
        'Pencil and keyboard are separate purchases',
      ],
    },
    buyingTips: {
      heading: 'Buying the iPad Air 11-inch (M3) in the US',
      paragraphs: [
        'Decide the accessories with the tablet rather than after it, because they are the difference between a tablet and a work device here. Apple Pencil Pro and Apple Pencil (USB-C) are both supported but are not the same product, and the Magic Keyboard for iPad Air is a third item. If you are buying this as a laptop replacement, budget for all three and compare the total against a laptop.',
        'Then pick storage on what you will actually store. Memory is 8 GB on every tier, so the money buys capacity alone: 128 GB suits streaming and notes, while video, downloads and large app libraries push you to 256 GB or beyond. And because Apple\u2019s current iPad Air page now promotes the M4 generation, check what changed in it before deciding the M3 is the value option \u2014 the specification above is the honest baseline for the comparison.',
      ],
    },
    faqs: [
      {
        question: 'What chip does the iPad Air 11-inch (M3) use?',
        answer:
          'Apple\u2019s M3, listed with an 8-core CPU split between four performance and four efficiency cores, a 9-core GPU and a 16-core Neural Engine, alongside 8 GB of memory.',
      },
      {
        question: 'How big is the iPad Air 11-inch (M3) screen?',
        answer:
          'Apple markets it as 11 inches and lists the display as 10.86 inches diagonally as a rectangle, at 2360 x 1640 and 264 ppi, with 500 nits of brightness.',
      },
      {
        question: 'Does the iPad Air 11-inch (M3) work with Apple Pencil Pro?',
        answer:
          'Yes, and with Apple Pencil (USB-C) as well. Neither is included in the box, and the two Pencils have different features, so pick deliberately.',
      },
      {
        question: 'What is the battery life of the iPad Air 11-inch (M3)?',
        answer:
          'Apple rates the 28.93-watt-hour battery at up to 10 hours of web surfing on Wi-Fi or video watching, and up to 9 hours of web surfing on cellular models.',
      },
      {
        question: 'How much storage does the iPad Air 11-inch (M3) come with?',
        answer:
          '128 GB, 256 GB, 512 GB or 1 TB. Memory is 8 GB on every tier, so storage is the only thing the larger tiers add.',
      },
      {
        question: 'Is a charger included with the iPad Air 11-inch (M3)?',
        answer:
          'Apple lists a 20 W USB-C power adapter in the box. The technical-specifications page states no faster-charging figure for this model.',
      },
      {
        question: 'Is the iPad Air 11-inch (M3) waterproof?',
        answer: 'Apple states no water or dust resistance rating for the iPad Air, so treat it as a device to keep away from water.',
      },
      {
        question: 'Is the iPad Air 11-inch (M3) still sold by Apple?',
        answer:
          'Apple\u2019s current iPad Air page promotes the M4 generation, so the M3 is a previous generation. Apple still publishes its technical specifications and lists it in the iPad comparison tool.',
      },
    ],
    links: [
      {
        label: 'Laptops & PCs',
        href: '/shop/laptops',
        description: 'Tablets, laptops and desktop PCs the store carries.',
      },
      {
        label: 'iPhone 17 Pro Max spec sheet',
        href: '/quick-look/apple-iphone-17-pro-max',
        description: 'The Apple phone spec sheet, if you are pairing the two.',
      },
      {
        label: "Today's deals",
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
