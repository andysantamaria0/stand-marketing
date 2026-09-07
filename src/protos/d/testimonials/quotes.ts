// Real family testimonial copy (received from JY, Sep 7 2026) — replaces the
// FPO ExtraBio placeholders. Safe to promote.
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
      'At first I didn’t know what I wanted to make. Then I had an idea, and STAND helped me turn it into an actual business.',
    byline: 'Ripley, 12',
  },
  {
    bg: 'testimonial-mustard',
    w: 971,
    h: 697,
    quote:
      'Watching my child turn an idea into a real business was so rewarding. STAND helped them become more confident sharing their ideas, working through challenges, and making decisions on their own.',
    byline: 'Ashley, parent of Myer, 13',
  },
  {
    bg: 'testimonial-yellow',
    w: 957,
    h: 702,
    quote:
      'STAND gave my child the confidence to take their ideas seriously and actually do something with them.',
    byline: 'Brett, parent of Ryan, 10',
  },
];
