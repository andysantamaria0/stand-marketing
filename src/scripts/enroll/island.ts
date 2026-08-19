/**
 * The /enroll form island.
 *
 * Vanilla, framework-free, and loaded as a PROCESSED module script — this repo
 * has no `@astrojs/*` integration, so there are no `client:*` directives, and
 * `is:inline` / `define:vars` are both off the table because they skip Astro's
 * processing and would leave `import.meta.env.PUBLIC_ENROLL_API_BASE`
 * un-inlined (the form would then POST to the literal string "undefined").
 *
 * RENDERING RULE, NON-NEGOTIABLE: every user-entered string reaches the DOM via
 * `textContent`. `innerHTML` with user data is forbidden anywhere in this file.
 * Kid names are attacker-controlled strings rendered back on the success screen
 * of a public marketing domain, and they also flow into Klaviyo email
 * templates. There is no innerHTML assignment below; keep it that way.
 *
 * States: page1 -> submitting -> success (+ optional questions) -> done, plus
 * waitlist mode and an error/retry state. No navigation — one URL throughout.
 */

import { track, identifyFamily, currentDistinctId } from "./analytics";
import {
  ANY_DAY,
  API_BASE,
  COPY,
  MAX_KIDS,
  PROGRAM_MAX_AGE,
  PROGRAM_MIN_AGE,
  UTM_KEYS,
} from "./constants";

type Mode = "open" | "waitlist";

/** One validated kid, in the exact shape the API expects. */
interface KidPayload {
  name: string;
  age: number;
  days: string[];
}

const $ = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

/**
 * The mode the parent was actually SHOWN while filling the form — not the mode
 * the server rendered. The page always renders "open" (the fail-open rule), so
 * reading this from the DOM at boot alone would leave it permanently "open" and
 * make every waitlisted parent see the mid-session-flip copy. It is updated
 * when the availability swap happens.
 */
let shownMode: Mode = "open";
let submitting = false;
/**
 * True once page 1 has been left behind for the success screen. The headline
 * and lede live OUTSIDE `#enroll-page1`, so they stay on screen above the
 * success card — a late availability response must not rewrite them to the
 * waitlist copy over a parent who is already reading "You're on the list", nor
 * move `shownMode` out from under `showSuccess`'s three-way copy choice.
 */
let leftPage1 = false;
/** `enroll_full_seen` is a once-per-session beat, not once per render path. */
let fullSeenTracked = false;
let resumeToken: string | null = null;
let startedTracked = false;
let emailTracked = false;

/* ── validation, mirroring the server ─────────────────────────────────────
   The server is authoritative; this exists so a parent gets an answer without
   a round trip. Any rule that drifts from the server just means a 400 the
   parent could have been told about sooner. */

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Normalizes to a leading `+` and digits, or null.
 *
 * A leading `+` takes the international branch UNCONDITIONALLY — the parent
 * already told us the country code. Stripping it first and then applying the
 * ten-digits-is-US rule turns "+0123456789" into "+10123456789", a real number
 * in the wrong country.
 */
function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D+/g, "");
    if (digits.length < 7 || digits.length > 15) return null;
    return `+${digits}`;
  }

  let digits = trimmed.replace(/\D+/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  return `+1${digits}`;
}

/** The SMS helper's rule: `+`, a non-zero lead, 8-15 digits total. */
function isTextable(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

/* ── small DOM helpers ───────────────────────────────────────────────────── */

/** Shows or clears a field error. `textContent` only. */
function setError(el: HTMLElement | null, message: string): void {
  if (!el) return;
  el.textContent = message;
  el.hidden = message.length === 0;
}

function clearErrorsWithin(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>("[data-error]").forEach((el) => setError(el, ""));
}

/* ── kid blocks ──────────────────────────────────────────────────────────── */

function kidBlocks(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-kid-block]"));
}

/** Renumbers legends and hides the remove control when only one kid remains. */
function syncKidChrome(): void {
  const blocks = kidBlocks();
  blocks.forEach((block, index) => {
    const heading = `${COPY.form.kidLegend} ${index + 1}`;
    const legend = block.querySelector<HTMLElement>("[data-kid-legend]");
    if (legend) legend.textContent = heading;
    // The fieldset carries its accessible name as aria-label rather than a
    // <legend> (which would have to be the fieldset's first child, and the
    // remove button shares that line). Set in lockstep with the visible
    // heading, or removing a middle kid renames the box on screen and leaves
    // the announced name pointing at the wrong child.
    block.setAttribute("aria-label", heading);
    const remove = block.querySelector<HTMLButtonElement>("[data-kid-remove]");
    if (remove) remove.hidden = blocks.length <= 1;
  });

  const addButton = $<HTMLButtonElement>("enroll-add-kid");
  if (addButton) addButton.disabled = blocks.length >= MAX_KIDS;
}

/** Reads the day chips inside one kid block. */
function selectedDays(block: HTMLElement): string[] {
  return Array.from(block.querySelectorAll<HTMLButtonElement>("[data-day]"))
    .filter((chip) => chip.getAttribute("aria-pressed") === "true")
    .map((chip) => chip.dataset.day as string);
}

/**
 * Wires one kid block's chips, age notice and remove control.
 *
 * "Any day works" and specific days are mutually exclusive: picking one clears
 * the other. They are genuinely different demand signals — "flexible" is not
 * the same answer as "all six days" — so the value is never expanded.
 */
function wireKidBlock(block: HTMLElement): void {
  block.querySelectorAll<HTMLButtonElement>("[data-day]").forEach((chip) => {
    chip.addEventListener("click", () => {
      markStarted();
      const day = chip.dataset.day as string;
      const pressed = chip.getAttribute("aria-pressed") === "true";

      if (day === ANY_DAY.value) {
        block.querySelectorAll<HTMLButtonElement>("[data-day]").forEach((other) => {
          other.setAttribute("aria-pressed", "false");
        });
        chip.setAttribute("aria-pressed", pressed ? "false" : "true");
      } else {
        const anyChip = block.querySelector<HTMLButtonElement>(`[data-day="${ANY_DAY.value}"]`);
        anyChip?.setAttribute("aria-pressed", "false");
        chip.setAttribute("aria-pressed", pressed ? "false" : "true");
      }

      if (!pressed) {
        track("enroll_day_selected", { day, kid_index: kidBlocks().indexOf(block) });
      }
      setError(block.querySelector<HTMLElement>("[data-error='days']"), "");
    });
  });

  const ageInput = block.querySelector<HTMLInputElement>("[data-kid-age]");
  ageInput?.addEventListener("input", () => {
    markStarted();
    const notice = block.querySelector<HTMLElement>("[data-age-notice]");
    if (!notice) return;
    const age = Number(ageInput.value);
    // A soft notice, never a block: a 6-year-old sibling is a conversation, not
    // a rejection.
    const outOfBand =
      Number.isInteger(age) && age > 0 && (age < PROGRAM_MIN_AGE || age > PROGRAM_MAX_AGE);
    notice.hidden = !outOfBand;
  });

  block.querySelector<HTMLInputElement>("[data-kid-name]")?.addEventListener("input", markStarted);

  block.querySelector<HTMLButtonElement>("[data-kid-remove]")?.addEventListener("click", () => {
    if (kidBlocks().length <= 1) return;
    block.remove();
    syncKidChrome();
  });
}

function addKidBlock(): void {
  const template = $<HTMLTemplateElement>("enroll-kid-template");
  const container = $<HTMLElement>("enroll-kids");
  if (!template || !container || kidBlocks().length >= MAX_KIDS) return;

  const clone = template.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
  if (!clone) return;
  container.appendChild(clone);
  wireKidBlock(clone);
  syncKidChrome();
  track("enroll_kid_added", { kids_count: kidBlocks().length });
  clone.querySelector<HTMLInputElement>("[data-kid-name]")?.focus();
}

/* ── funnel beats ────────────────────────────────────────────────────────── */

function markStarted(): void {
  if (startedTracked) return;
  startedTracked = true;
  track("enroll_form_started", {});
}

/* ── mode ────────────────────────────────────────────────────────────────── */

/** Fires the waitlist-seen beat at most once per page load. */
function trackFullSeen(): void {
  if (fullSeenTracked) return;
  fullSeenTracked = true;
  track("enroll_full_seen", {});
}

/** Swaps the page into waitlist mode. Only ever called on a confirmed "full". */
function applyWaitlistMode(): void {
  // Availability is fetched at boot and never blocks the render, so its
  // response can land after the parent has already submitted. Past page 1 the
  // swap is strictly harmful: the destination is the server's answer by then,
  // and rewriting the still-visible headline would contradict the success copy.
  if (leftPage1) return;
  const root = $<HTMLElement>("enroll-root");
  if (!root || root.dataset.mode === "waitlist") return;
  root.dataset.mode = "waitlist";
  // The parent is now LOOKING at the waitlist headline, so their success copy
  // must be the waitlist one, not the "filled up just now" flip explanation.
  shownMode = "waitlist";

  const headline = $<HTMLElement>("enroll-headline");
  const lede = $<HTMLElement>("enroll-lede");
  if (headline) headline.textContent = COPY.waitlist.headline;
  if (lede) lede.textContent = COPY.waitlist.lede;
  trackFullSeen();
}

/**
 * Asks the API whether the semester is open.
 *
 * The page has ALREADY rendered in open mode by the time this runs. It swaps to
 * waitlist only on a confirmed `"full"`; any failure, timeout or unexpected
 * shape leaves the page open, because the server re-derives the real answer at
 * submit time anyway. Blocking the highest-friction surface on a round trip to
 * pick a headline would be a bad trade.
 */
async function checkAvailability(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/enroll/availability`, { method: "GET" });
    if (!res.ok) return;
    const data = (await res.json()) as { semester?: string };
    if (data.semester === "full") applyWaitlistMode();
  } catch {
    // Fail open. Deliberate.
  }
}

/* ── attribution ─────────────────────────────────────────────────────────── */

/** The five standard UTM keys off the current URL, or null when there are none. */
function readUtm(): Record<string, string> | null {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, 200);
  }
  return Object.keys(utm).length > 0 ? utm : null;
}

/* ── page 1 ──────────────────────────────────────────────────────────────── */

/** Collects and validates the form. Returns null and paints errors on failure. */
function collectPayload(): {
  email: string;
  phone: string;
  kids: KidPayload[];
  smsOptIn: boolean;
} | null {
  const form = $<HTMLFormElement>("enroll-form");
  if (!form) return null;
  clearErrorsWithin(form);

  let firstInvalid: HTMLElement | null = null;
  const fail = (errorEl: HTMLElement | null, field: HTMLElement | null, message: string) => {
    setError(errorEl, message);
    if (!firstInvalid) firstInvalid = field ?? errorEl;
  };

  const emailInput = $<HTMLInputElement>("enroll-email");
  const email = (emailInput?.value ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    fail($<HTMLElement>("enroll-email-error"), emailInput, COPY.errors.email);
  }

  const phoneInput = $<HTMLInputElement>("enroll-phone");
  const phone = normalizePhone(phoneInput?.value ?? "");
  const smsOptIn = $<HTMLInputElement>("enroll-sms")?.checked === true;
  if (phone === null) {
    fail($<HTMLElement>("enroll-phone-error"), phoneInput, COPY.errors.phone);
  } else if (smsOptIn && !isTextable(phone)) {
    // Refuse BEFORE submitting rather than storing consent for a number the SMS
    // provider would silently refuse to text.
    fail($<HTMLElement>("enroll-phone-error"), phoneInput, COPY.errors.phoneNotTextable);
  }

  const kids: KidPayload[] = [];
  for (const block of kidBlocks()) {
    const nameInput = block.querySelector<HTMLInputElement>("[data-kid-name]");
    const ageInput = block.querySelector<HTMLInputElement>("[data-kid-age]");
    const name = (nameInput?.value ?? "").trim();
    const age = Number(ageInput?.value);
    const days = selectedDays(block);

    if (name.length === 0 || name.length > 64) {
      fail(block.querySelector<HTMLElement>("[data-error='name']"), nameInput, COPY.errors.kidName);
    }
    if (!Number.isInteger(age) || age < 5 || age > 17) {
      fail(block.querySelector<HTMLElement>("[data-error='age']"), ageInput, COPY.errors.kidAge);
    }
    if (days.length === 0) {
      fail(block.querySelector<HTMLElement>("[data-error='days']"), null, COPY.errors.kidDays);
    }
    kids.push({ name, age, days });
  }

  if (firstInvalid) {
    (firstInvalid as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
    (firstInvalid as HTMLElement).focus?.();
    return null;
  }

  return { email, phone: phone as string, kids, smsOptIn };
}

/**
 * Renders the success screen for whichever destination the SERVER decided.
 *
 * Three copies, not two: a parent who filled the form in open mode and came
 * back waitlisted gets told what happened, rather than a confirmation that
 * quietly contradicts the headline they were reading a second ago.
 */
function showSuccess(waitlisted: boolean): void {
  const copy = !waitlisted
    ? COPY.success.open
    : shownMode === "open"
      ? COPY.success.flipped
      : COPY.success.waitlist;

  const title = $<HTMLElement>("success-title");
  const body = $<HTMLElement>("success-body");
  if (title) title.textContent = copy.title;
  if (body) body.textContent = copy.body;

  // Latch BEFORE the swap: an availability response arriving from here on must
  // not repaint the headline that stays visible above this card.
  leftPage1 = true;

  const page1 = $<HTMLElement>("enroll-page1");
  const success = $<HTMLElement>("enroll-success");
  if (page1) page1.hidden = true;
  if (success) success.hidden = false;
  if (waitlisted) trackFullSeen();
  success?.scrollIntoView({ behavior: "smooth", block: "start" });
  $<HTMLElement>("success-title")?.focus();
}

async function submitPage1(): Promise<void> {
  if (submitting) return;
  const payload = collectPayload();
  if (!payload) return;

  const submitButton = $<HTMLButtonElement>("enroll-submit");
  const formError = $<HTMLElement>("enroll-form-error");
  submitting = true;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = COPY.form.submitting;
  }
  setError(formError, "");
  track("enroll_cta_clicked", { cta_location: "page1_submit" });

  try {
    const res = await fetch(`${API_BASE}/api/enroll/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        utm: readUtm(),
        posthogDistinctId: currentDistinctId(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      id?: string;
      token?: string;
      waitlisted?: boolean;
      error?: string;
    };

    if (!res.ok || !data.ok || !data.id || !data.token) {
      // A 400 carries copy written for the parent; anything else gets the
      // generic retry line. Every field they typed is still on screen.
      setError(formError, res.status === 400 && data.error ? data.error : COPY.errors.submit);
      return;
    }

    resumeToken = data.token;
    identifyFamily(data.id, payload.email);
    track("enroll_step_completed", { step: 1 });
    showSuccess(data.waitlisted === true);
  } catch {
    setError(formError, COPY.errors.submit);
  } finally {
    submitting = false;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = COPY.form.submit;
    }
  }
}

/* ── page 2 ──────────────────────────────────────────────────────────────── */

function showDone(): void {
  const success = $<HTMLElement>("enroll-success");
  const done = $<HTMLElement>("enroll-done");
  if (success) success.hidden = true;
  if (done) done.hidden = false;
  done?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function submitDetails(): Promise<void> {
  if (submitting || !resumeToken) return;
  const detailsError = $<HTMLElement>("details-error");
  const button = $<HTMLButtonElement>("details-submit");
  const skip = $<HTMLButtonElement>("details-skip");
  submitting = true;
  if (button) button.disabled = true;
  if (skip) skip.disabled = true;
  setError(detailsError, "");

  try {
    // OMIT blank answers rather than sending "" / null. The server keeps a
    // three-way distinction: key absent means "leave what is stored alone",
    // key present but blank means "clear it" (see optionalText in the API's
    // validate.ts). Sending every field unconditionally collapses that, so a
    // returning parent — the PRD's headline flow, back to add a sibling — who
    // taps SEND on the empty optional form would erase the location and time
    // they gave last visit. Tapping SKIP would have preserved them, so the
    // more engaged parent lost more data, silently.
    const body: Record<string, string> = { token: resumeToken };
    const location = $<HTMLInputElement>("details-location")?.value.trim() ?? "";
    const time = $<HTMLSelectElement>("details-time")?.value ?? "";
    const otherCity = $<HTMLInputElement>("details-other")?.value.trim() ?? "";
    if (location) body.locationPreference = location;
    if (time) body.timePreference = time;
    if (otherCity) body.otherCity = otherCity;

    const res = await fetch(`${API_BASE}/api/enroll/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Includes a 404 from a token this tab rotated out of. The retry
      // affordance stays; their page-1 signup was saved either way.
      setError(detailsError, COPY.errors.details);
      return;
    }
    track("enroll_step_completed", { step: 2 });
    showDone();
  } catch {
    setError(detailsError, COPY.errors.details);
  } finally {
    submitting = false;
    if (button) button.disabled = false;
    if (skip) skip.disabled = false;
  }
}

/* ── boot ────────────────────────────────────────────────────────────────── */

function init(): void {
  const root = $<HTMLElement>("enroll-root");
  if (!root) return;
  shownMode = root.dataset.mode === "waitlist" ? "waitlist" : "open";

  kidBlocks().forEach(wireKidBlock);
  syncKidChrome();

  $<HTMLButtonElement>("enroll-add-kid")?.addEventListener("click", addKidBlock);

  // The PRD pins `enroll_form_started` to FIRST FOCUS, once per load. Binding
  // it only to `input`/`change` missed the parent who taps into a field and
  // leaves without typing — which is exactly the drop-off this beat is meant
  // to measure. `focusin` bubbles, so one listener covers every control; the
  // per-field listeners below stay as a floor for any control that gets a
  // value without ever taking focus.
  //
  // TARGET-FILTERED, and it must stay that way. The consent block's
  // privacy-policy anchor sits INSIDE this form, and clicking a link focuses
  // it in Chromium and Firefox — so a bare listener counts the parent who
  // reads the privacy policy and bounces as having started the form. That is
  // the one cohort this beat most needs to keep separate: it inflates
  // landed -> started and deflates started -> submitted, which is backwards
  // from the drop-off read the PRD buys it for. SUBMIT is deliberately IN the
  // list — focusing it is a real interaction, and counting it repairs a funnel
  // that could otherwise emit `enroll_cta_clicked` with no preceding start.
  const STARTED_CONTROLS = "input, select, textarea, [data-day], #enroll-add-kid, #enroll-submit";
  $<HTMLFormElement>("enroll-form")?.addEventListener("focusin", (event) => {
    if ((event.target as HTMLElement | null)?.closest?.(STARTED_CONTROLS)) markStarted();
  });

  const emailInput = $<HTMLInputElement>("enroll-email");
  emailInput?.addEventListener("input", markStarted);
  emailInput?.addEventListener("blur", () => {
    if (emailTracked || !isValidEmail(emailInput.value)) return;
    emailTracked = true;
    track("enroll_email_entered", {});
  });
  $<HTMLInputElement>("enroll-phone")?.addEventListener("input", markStarted);
  $<HTMLInputElement>("enroll-sms")?.addEventListener("change", markStarted);

  $<HTMLFormElement>("enroll-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitPage1();
  });

  $<HTMLFormElement>("details-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitDetails();
  });
  $<HTMLButtonElement>("details-skip")?.addEventListener("click", () => {
    // Guarded: skipping mid-save would swap in the done screen and take the
    // failed-save retry copy with it, so the parent would never learn their
    // answers did not land.
    if (submitting) return;
    track("enroll_details_skipped", {});
    showDone();
  });

  void checkAvailability();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
