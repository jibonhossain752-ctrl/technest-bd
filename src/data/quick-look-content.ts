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
}

export function getQuickLookGuide(slug: string): QuickLookGuide | undefined {
  return QUICK_LOOK_GUIDES[slug]
}
