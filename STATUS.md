# Stand Marketing — Pilot Page Faye Reskin

**Last updated:** 2026-05-05 (shipped first pass)
**Status:** Shipped to main as a first-pass reskin. Several visual deltas from Faye's Figma still to chase — see "Followups" below.

## Followups (next pass)

Things still off vs. Figma `mpwEYKDykSzSPkHSIKTDv5` node `6:59` and the screenshots Andy reviewed 2026-05-05:

- **Marketplace booth grid** — biggest gap.
  - Brand-name font: I'm using Bagel Fat One; Faye's "maya's bakery" wordmark may be a different chunky display face. Confirm or swap.
  - Cell aspect ratio is 360:503 (3:4) per Figma — verify it reads right at the live width.
  - Yellow placeholder cell (#ffc400) is empty per Figma; consider if we want a simple shape (purple cap silhouette appeared in an earlier user screenshot but is not in the `6:59` node data — may be from a sibling node not yet pulled).
  - Type sizes and spacing inside text cards (eyebrow margin, brand-name margin, body line-height) eyeballed, not measured. Should pull `get_design_context` on a single text node and match.
  - Hover/active states on cells absent — Figma is static, but we should decide.
- **Hero**
  - Wordmark + sign composition: sign now hangs off bottom of "d". Angle/scale eyeballed; verify against Faye when she has a sign-on-wordmark variant (currently her hero is just the sign on cream, no wordmark — this is our deviation from her design at Andy's request).
  - ViewBox expanded to `80 385 1700 360` to stop cutting off t/d tops; revisit if any clipping remains at extreme widths.
- **About Us hand**
  - The cream/white shape next to the mustard panel is the Figma `Rectangle 21` placeholder, not the actual artwork. The real artwork is a nested node (`Asset 4@3000x-8 1`, id `6:32`) — refetch and replace.
- **Build? section**
  - Stack indents tightened and script repositioned, but type weight on "what / will / you" may want one notch lighter to match Faye's serif feel exactly. Eyeball vs. her render at full width.
- **Stripes**
  - Now vertical pickets, 64px tall. Could be wider/thicker — confirm against Faye's rendered band height.
- **Form** (Join the Waitlist)
  - Faye has label + input only (no submit button). I kept a red "Save my spot" pill for conversion clarity. Decision pending — Andy aware, accepted for now.
- **Marketplace section header**
  - "Shop Marketplace" CTA links to `/marketplace.html` which still uses the OLD grid. The new booth chrome (3:4 cells, no borders, Bagel Fat One wordmarks) should be ported there too.

## Goal

Reskin `pilot.html` to match the "FAYE WEBSITE" Figma design.

- **Figma file:** https://www.figma.com/design/mpwEYKDykSzSPkHSIKTDv5/Stand-Website-Build?node-id=6-13&m=dev
- **fileKey:** `mpwEYKDykSzSPkHSIKTDv5`
- **nodeId:** `6:13` (1437×4936px frame, "FAYE WEBSITE")
- **Target file:** `/Users/andrewsantamaria/dev/andy-projects/stand-marketing/pilot.html`

## Assets pulled (in `figma-faye/`)

- `asset-logo.png` — Stand wordmark
- `asset-image14-girl.png` — photo of girl writing (CEO section)
- `asset-group39-hero-bag.png` — paper bag illustration ("open Business")
- `asset-rect21-red-hand.png` — red pointing hand (About Us section)
- `asset-rect25.png`
- `asset-tile1-pink.png`, `asset-tile2-magenta.png` — booth tile imagery
- `asset-build-script.png` — "Build?" script lockup
- `_screenshot-fullpage.png` — full Figma render, 1437×4936 → downscaled 299×1024

## Progress

- [x] Audited existing pilot.html (1083 lines, see git for prior version)
- [x] Pulled Figma design context + assets
- [x] Saved screenshot, parsed metadata XML (saved to /tmp/figma-faye-metadata.xml)
- [x] Define design tokens from Figma (see Decisions below)
- [x] Reskin pilot.html section by section (rewritten 2026-05-05)
- [ ] Visual diff against Figma screenshot — server running at http://localhost:4242/pilot.html

## Decisions (2026-05-05)

- **Fonts:** Fraunces (headlines, Google Fonts), Pangram Sans (eyebrows/buttons/UI, local at `/brand-2026-04-20/fonts/live/PPPangramSans-*.otf`), Helvetica Neue (body), Piepie (booth tile titles, copied from `stand-app/src/fonts/PiepieW01-Regular.ttf`).
- **Dropped fonts:** Bagel Fat One, Yellowtail.
- **Editorial New + Hanno** specified by Brand Guidelines v1.0 — NOT staged in repo, deferred. Fraunces is the visual analog for Editorial New until license is sourced.
- **Colors:** existing `:root` palette preserved. Figma's button yellow `#f9f06c` snapped to brand `--postit #F7F080`.
- **Sections shipped:** nav, paper-bag hero, mustard About + waitlist row, green stripe, red CEO band w/ photo + Become a CEO button, green stripe, "what will you Build?" cream, green stripe, Marketplace headline + Shop Marketplace button + 4-tile booth grid, green stripe, footer.
- **Sections dropped:** manifesto ("We're not just consuming"), booths/flow (4-tile flow section), closing waitlist (consolidated into About).
- **Waitlist forms:** one consolidated form in About panel. CEO button scrolls to it via `#waitlist`.
- **Booth tiles:** kept real founders (Azzy/Theo/Rio/Maya, 4 across), adopted new chrome (square image, 3px black border, alternating cream/green bg, Piepie 60px-ish title).

## Notes

- `get_design_context` on the root node returns >70K chars; must fetch by section subtree.
- Major frame children identified in metadata:
  - `6:641` Group 39 — paper bag hero illustration (940, 457, 291×338)
  - `6:634` "Build?" — script lockup (308, 2852, 951×272)
  - `6:59` Group 8 — marketplace area (0, 3804, 1439×1006)
  - `6:621/624/627/630` — booth tile groups (303×429 each)
  - `6:354/97/47` — green stripe dividers between sections
- Design has NO Figma variables defined; treat tokens as observed-from-screenshot.
- Existing `:root` palette in pilot.html (cream/red/mustard/black/postit/green/blue/pink/white) covers the palette already — palette OK as-is.

## Section map (Figma y-coords → pilot.html section)

| Figma y | Section in design | Maps to pilot.html |
|---|---|---|
| 0–98 | Top nav | `<nav>` |
| 98–893 | Paper-bag hero ("open Business") | `.hero` (replaces sticker-stack slogan) |
| 891–1871 | Mustard "About Us" w/ red hand + waitlist | `.intro` + `.hero-form` (consolidated) |
| 1872–2559 | Red CEO band, green stripe top/bottom | `.ceo` (full visual reskin) |
| 2559–3245 | "what will you Build?" cream | `.closing` headline (copy change: "stand for" → "Build?") |
| 3245–3804 | Green marketplace eyebrow + "Shop Marketplace" | `.marketplace-preview` header |
| 3804–4810 | 6 booth tiles (placeholder copy) | `.booth-grid` (4 → 6 tiles) |
| 4810–4936 | Footer green stripe | `<footer>` |

## Open questions for user

1. The Figma drops the existing **manifesto** ("We're not just consuming. We're building.") and the standalone **booths/flow** section. Confirm we're removing them rather than keeping a hybrid.
2. The Figma's hero copy is much shorter ("Stand® is a business in a box. Kids land on an idea, name it, brand it, design and make real products, price them, launch a storefront, and take real payments from real customers.") — this is identical to the current `.intro` copy. Confirm hero subhead also gets replaced.
3. Marketplace tiles in Figma show "maya's bakery" repeated 6× as placeholders — keep current real founders (Azzy/Theo/Rio/Maya) and just adopt the new tile chrome?
4. Headline "what will you Build?" replaces "what will you stand for?". Confirm.

## Resume command

In a new session:
```
cat stand-marketing/STATUS.md
```
