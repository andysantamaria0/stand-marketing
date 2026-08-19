/**
 * Thin typed wrapper over posthog-js for the /enroll funnel.
 *
 * NAMING AUTHORITY LIVES IN THE APP. This site has no shared event registry
 * with app.standkids.com, but both surfaces report into the SAME PostHog
 * project — so the app's `src/lib/posthog/events.ts` is the authority for every
 * `enroll_*` name below. Renaming one here without a matching pass there
 * silently forks the funnel. That drift is accepted for now; this comment is
 * the guardrail.
 *
 * Deliberately does NOT call `posthog.init`. `src/scripts/analytics.ts` already
 * initialised it for the whole site with options chosen on purpose, and /enroll
 * is same-origin with every other page, so identity continuity from a marketing
 * pageview is automatic. A second init would break it.
 *
 * PII rule, same as the app: kid names and phone numbers never reach ANALYTICS.
 * They are of course POSTed to the API — that is the product — but no event
 * below carries either one. Client events carry counts and enum values only;
 * unlike the server's `enroll_email_captured`, nothing here sends an age. The
 * one identifier that does ride along is the parent's email, attached as a
 * PostHog PERSON property by `identifyFamily` after a successful submit.
 */

import posthog from "posthog-js";

/** Every client event this page fires, with the exact properties it carries. */
type EnrollEvents = {
  /** First interaction with any field. Once per page load. */
  enroll_form_started: Record<string, never>;
  /** First blur of a syntactically valid email — the most diagnostic beat
   *  between "started" and "submitted". */
  enroll_email_entered: Record<string, never>;
  enroll_kid_added: { kids_count: number };
  enroll_day_selected: { day: string; kid_index: number };
  enroll_step_completed: { step: 1 | 2 };
  enroll_details_skipped: Record<string, never>;
  /** Waitlist mode rendered — either on load or after a mid-session flip. */
  enroll_full_seen: Record<string, never>;
  enroll_cta_clicked: { cta_location: string };
};

/**
 * Fires one event. Best-effort by construction: an ad blocker, a failed init,
 * or a PostHog outage must never break the form. Analytics is not the product.
 */
export function track<E extends keyof EnrollEvents>(
  event: E,
  properties?: EnrollEvents[E]
): void {
  try {
    posthog.capture(event, properties);
  } catch {
    // Non-critical. Swallowed on purpose.
  }
}

/**
 * Ties the funnel to the family's row after a successful page-1 submit.
 *
 * The id authorizes nothing — the write capability for page 2 is the separate
 * resume token — so it is safe as a distinct id. Email rides as a person
 * property; kid names and phone never do.
 */
export function identifyFamily(id: string, email: string): void {
  try {
    posthog.identify(`enroll-${id}`, { email });
  } catch {
    // Non-critical.
  }
}

/** The current distinct id, so the server event can join to the same person. */
export function currentDistinctId(): string | null {
  try {
    return posthog.get_distinct_id() ?? null;
  } catch {
    return null;
  }
}
