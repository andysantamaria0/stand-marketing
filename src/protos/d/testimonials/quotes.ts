// FPO testimonial copy — carried verbatim from the Figma-era ExtraBio deck
// (node 113:244). No real quotes exist yet (first LA cohort is fall 2026);
// swap for real family quotes before any of these variants is promoted.
export interface Quote {
  bg: 'testimonial-pink' | 'testimonial-mustard' | 'testimonial-yellow';
  /** Intrinsic px of the paper asset — Proto A sizes its scraps by these. */
  w: number;
  h: number;
  quote: string;
  byline: string;
}

export const QUOTES: Quote[] = [
  {
    bg: 'testimonial-pink',
    w: 1024,
    h: 762,
    quote:
      'Watching her take orders, handle her own money, and stay proud of something she built herself. That’s the stuff you can’t teach in a classroom.',
    byline: 'Parent of Lily, age 12',
  },
  {
    bg: 'testimonial-mustard',
    w: 971,
    h: 697,
    quote:
      'I thought starting a business would be easy. Then I had to make decisions, set prices, and keep going when it got hard. STAND helped me figure it out.',
    byline: 'Ryan, age 10',
  },
  {
    bg: 'testimonial-yellow',
    w: 957,
    h: 702,
    quote:
      'He cared about every detail - the name, the logo, the product, the packaging. STAND turned his creativity into something structured.',
    byline: 'Parent of Leo, 13',
  },
];
