/**
 * Marketing-site analytics (standkids.com).
 *
 * Uses the SAME PostHog project as the app so the two surfaces can be
 * correlated in one place. The app deliberately runs `persistence: "memory"`
 * for its child-directed COPPA posture; the marketing site's audience is
 * PARENTS/ADULTS (not children), so here we use a persistent first-party
 * identifier to measure NEW vs RETURNING visitors and real unique counts —
 * which cookieless ("memory") mode cannot do (it logs every pageview as a
 * brand-new person). US-only audience: first-party product analytics needs
 * disclosure, not opt-in consent, and the `CookieNotice` banner + the privacy
 * policy provide that disclosure.
 *
 * Cross-domain attribution is unchanged: identities still do NOT merge across
 * the standkids.com -> app.standkids.com hop (separate origins, and the app is
 * cookieless). The join key remains `utm_term` (the founder-email recipient
 * number, forwarded onto app CTAs by the layout's attribution script) — match a
 * marketing-site pageview to the app conversion on that value.
 */
import posthog from "posthog-js";

// Public client key (same one the app ships in its bundle) — safe to embed.
const POSTHOG_KEY = "phc_MjHNKJ0lDx0zCbEaqTnjx0qljAzj15yghhrUUvFZexT";
const POSTHOG_HOST = "https://us.i.posthog.com";

if (typeof window !== "undefined") {
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Persistent first-party id (cookie + localStorage) so new-vs-returning
      // and unique visitors are real. Disclosed via the CookieNotice banner.
      persistence: "localStorage+cookie",
      autocapture: false, // pageviews + UTMs are all we need; keep it lean
      capture_pageview: true, // carries utm_source/medium/campaign/content/term
      capture_pageleave: true, // on so bounce rate + session duration are accurate
      disable_session_recording: true,
    });
  } catch {
    // Analytics is non-critical — an ad blocker or init failure must never
    // break the marketing page.
  }
}
