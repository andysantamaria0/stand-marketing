/**
 * Every string and config value the /enroll page uses, in one place.
 *
 * This file is JY's to edit at handoff — layout, copy and question wording are
 * his. What is NOT his to change without a registry pass on the app side: the
 * API contract (field names, request/response shapes), the day values,
 * and the analytics event names. Those are a cross-repo contract; the app's
 * `src/lib/posthog/events.ts` and `src/lib/klaviyo/events.ts` are the authority.
 *
 * SQUARE BRACKETS mean "final wording pending". The real program name, dates
 * and address drop in here, in one edit, and nowhere else.
 */

/** Working name. Replace the bracketed value; do not scatter the literal. */
export const PROGRAM_NAME = "[Founders Program]";

/** Where the API lives. Env so localhost and previews are testable without a code edit. */
export const API_BASE = import.meta.env.PUBLIC_ENROLL_API_BASE || "https://app.standkids.com";

/**
 * Selectable days, in render order. Values are the API contract.
 *
 * "Any day works" (`any`) was removed 8/25: too ambiguous to schedule against,
 * and this question exists to tell us which specific days to run. The server's
 * DAY_VALUES drops it in a paired pass, HELD until this page is live - a
 * tightened page against a permissive server is safe, the reverse breaks the
 * live form. Re-adding it means re-adding it in BOTH repos.
 */
export const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
] as const;

/** Hard ceiling per family, mirroring the server. */
export const MAX_KIDS = 4;

/**
 * Days one kid may pick, mirroring the server. The chips roll rather than
 * refuse: a third pick evicts the oldest. The server answers a third day with
 * a 400, so this is a floor on the parent's behalf, not the only gate.
 */
export const MAX_DAYS = 2;

/**
 * The hard accept band, mirroring the server's MIN/MAX_ACCEPTED_AGE. Outside
 * it the server answers 400, so the client blocks first with the SAME bounds —
 * a mismatch here shows a parent an error the server would not have given (or
 * a 400 the client should have caught).
 */
export const MIN_AGE = 5;
export const MAX_AGE = 17;

/** The program's age band. Outside it shows a soft notice and never blocks. */
export const PROGRAM_MIN_AGE = 8;
export const PROGRAM_MAX_AGE = 13;

/** The five standard attribution keys forwarded to the API. */
export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export const COPY = {
  meta: {
    title: `Enroll — ${PROGRAM_NAME} | Stand`,
    description: `Save your kid's spot in ${PROGRAM_NAME}. Tell us who's coming and which days work — it takes about a minute.`,
  },

  open: {
    eyebrow: PROGRAM_NAME,
    /**
     * The leading "STAND" is deliberately NOT in this string: the h1 renders
     * the wordmark in its place (`.title-logo` in enroll.astro), and this is
     * the rest of the sentence. It is written into #enroll-headline-text and
     * never into the h1 itself — see setHeadlineText() in island.ts.
     */
    headline: "is opening in Los Angeles!",
    lede: "Register to get updates about our LA space and program.",
  },

  form: {
    emailLabel: "Your email",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Your phone number",
    phonePlaceholder: "(310) 555-1234",
    kidLegend: "Kid",
    kidNameLabel: "Kid's name",
    kidNamePlaceholder: "Their first name",
    kidAgeLabel: "Age",
    kidAgePlaceholder: "10",
    kidDaysLabel: "Pick up to two days that you would be interested in:",
    addKid: "+ Add another kid",
    removeKid: "Remove",
    smsConsent:
      "I would like to receive promotional SMS messages. I can reply STOP to unsubscribe.",
    privacyPrefix: "By submitting this form, you agree to our ",
    privacyLinkText: "Privacy Policy",
    /**
     * Absolute on purpose. This repo has no `privacy.astro` — production serves
     * /privacy from elsewhere on the domain — so a relative href 404s in
     * `astro dev` and in previews while working fine live. Absolute makes the
     * link correct in every environment. Points at `www.` because that is what
     * production answers on; an apex visitor crosses to the subdomain, which is
     * acceptable for a policy page outside the signup flow.
     */
    privacyHref: "https://www.standkids.com/privacy",
    privacySuffix: ".",
    submit: "SUBMIT",
    submitting: "Sending...",
  },

  errors: {
    email: "Enter a valid email address.",
    phone: "That number doesn't look right — 10 digits, or start with + for non-US.",
    phoneNotTextable: "That number can't receive texts - please update it or untick the box.",
    kidName: "Please be sure to include their first name.",
    kidAge: "Be sure to include their age.",
    kidDays: "Pick at least one day.",
    submit: "Something hiccuped on our end — your info is still here, try again.",
    details: "That didn't save - please try again.",
  },

  /** Shown, never blocking, when an age falls outside the program band. */
  ageNotice: `Our first cohort is built for ages ${PROGRAM_MIN_AGE}-${PROGRAM_MAX_AGE}. If your kid is close, we'll do our best to make it work!`,

  /**
   * On success the page's persistent headline (#enroll-headline) becomes the
   * confirmation — there is no separate success-title element on the screen.
   */
  success: {
    /** Empty body = the island hides the line; the headline says it all. */
    open: {
      headline: "You're on the list!",
      body: "",
    },
  },

  details: {
    intro: "Few more quick questions for you!",
    locationLabel: "Where in LA works best for you?",
    locationPlaceholder: "Neighborhood or area",
    otherCityLabel: "Not in LA? Tell us where you'd want STAND to open.",
    otherCityPlaceholder: "City",
    submit: "Send",
    skip: "Skip",
    done: "Thanks! We'll be in touch soon.",
  },
} as const;
