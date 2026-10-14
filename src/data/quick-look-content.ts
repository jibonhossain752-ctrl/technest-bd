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
}

export function getQuickLookGuide(slug: string): QuickLookGuide | undefined {
  return QUICK_LOOK_GUIDES[slug]
}
