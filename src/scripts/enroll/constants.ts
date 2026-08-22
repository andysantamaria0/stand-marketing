/**
 * Every string and config value the /enroll page uses, in one place.
 *
 * This file is JY's to edit at handoff — layout, copy and question wording are
 * his. What is NOT his to change without a registry pass on the app side: the
 * API contract (field names, request/response shapes), the day and time values,
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

/** Selectable days, in render order. Values are the API contract. */
export const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
] as const;

/** The flexible-parent escape hatch. One tap instead of six. */
export const ANY_DAY = { value: "any", label: "Any day works" } as const;

/**
 * Time-of-day options on the optional questions. Values are the API contract.
 *
 * "Weekend mornings" (`weekend_am`) was removed 8/19: the working class plan is
 * Sat 12-2pm, i.e. midday, so the option was offering a slot we do not intend
 * to run. Removed from the server's TIME_VALUES in the same pass, so the value
 * is refused rather than merely un-offered. Re-adding it means re-adding it in
 * BOTH repos.
 */
export const TIMES = [
  { value: "afternoon", label: "Afternoons" },
  { value: "evening", label: "Evenings" },
  { value: "flexible", label: "Flexible" },
] as const;

/** Hard ceiling per family, mirroring the server. */
export const MAX_KIDS = 4;

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
    headline: "STAND IS OPENING IN LOS ANGELES!",
    lede: "Register to get started and updates about our LA space and program.",
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
    kidDaysLabel: "What days would you be interested in?",
    addKid: "+ Add another kid",
    removeKid: "Remove",
    smsConsent:
      "I would like to receive promotional SMS messages. I can reply STOP to unsubscribe.",
    privacyPrefix: "By submitting this form, you agree to our ",
    privacyLinkText: "Privacy Policy",
    privacyHref: "/privacy",
    privacySuffix: ".",
    submit: "SUBMIT",
    submitting: "Sending...",
  },

  errors: {
    email: "Enter a valid email address.",
    phone: "That number doesn't look right — 10 digits, or start with + for non-US.",
    phoneNotTextable: "That number can't receive texts — fix it or untick the box.",
    kidName: "Each kid needs a first name.",
    kidAge: "Each kid needs an age between 5 and 17.",
    kidDays: "Pick at least one day that could work (or 'Any day works').",
    submit: "Something hiccuped on our end — your info is still here, try again.",
    details: "Couldn't save that — tap to retry.",
  },

  /** Shown, never blocking, when an age falls outside the program band. */
  ageNotice: `${PROGRAM_NAME} is built for ages ${PROGRAM_MIN_AGE}-${PROGRAM_MAX_AGE} — if your kid is close, we'll make it work.`,

  /**
   * On success the page's persistent headline (#enroll-headline) becomes the
   * confirmation — there is no separate success-title element on the screen.
   */
  success: {
    /** Empty body = the island hides the line; the headline says it all. */
    open: {
      headline: "Good, you're on the list!",
      body: "",
    },
  },

  details: {
    intro: "A few optional questions for you, you can skip no hard feelings!",
    locationLabel: "Where in LA works best for you?",
    locationPlaceholder: "Neighborhood or area",
    timeLabel: "What time of day usually works?",
    timePlaceholder: "Choose a time of day",
    otherCityLabel: "Not in LA? Tell us where you'd want STAND to open.",
    otherCityPlaceholder: "City",
    submit: "Send",
    skip: "Skip",
    done: "Thanks! We'll be in touch.",
  },
} as const;
