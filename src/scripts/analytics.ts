/**
 * Marketing-site analytics (standkids.com).
 *
 * Uses the SAME PostHog project as the app so the two surfaces can be
 * correlated in one place. Note: the app deliberately runs `persistence:
 * "memory"` for its child-directed COPPA posture, so PostHog identities do NOT
 * merge across the standkids.com -> app.standkids.com hop via a shared cookie.
 * The cross-domain join key is `utm_term` (the founder-email recipient number,
 * forwarded onto app CTAs by the layout's attribution script) — match a
 * marketing-site pageview to the app conversion on that value.
 *
 * Cookieless here too (`persistence: "memory"`): we only need the landing
 * pageview + its UTM params, not cross-visit identity — which keeps the site
 * consent-banner-free and consistent with the app's privacy stance.
 */
import posthog from "posthog-js";

// Public client key (same one the app ships in its bundle) — safe to embed.
const POSTHOG_KEY = "phc_MjHNKJ0lDx0zCbEaqTnjx0qljAzj15yghhrUUvFZexT";
const POSTHOG_HOST = "https://us.i.posthog.com";

if (typeof window !== "undefined") {
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      persistence: "memory", // cookieless — no banner, no cross-visit identity
      autocapture: false, // pageviews + UTMs are all we need; keep it lean
      capture_pageview: true, // carries utm_source/medium/campaign/content/term
      capture_pageleave: false,
      disable_session_recording: true,
    });
  } catch {
    // Analytics is non-critical — an ad blocker or init failure must never
    // break the marketing page.
  }
}
