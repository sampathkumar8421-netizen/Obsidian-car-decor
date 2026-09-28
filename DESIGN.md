# OBSIDIAN Detail Co. — Design System

Dark, heavy, animated. Night-shift garage energy: near-black base, acid-green
signal color, mono-labeled UI chrome, and motion borrowed from the anime.js
landing page — assemble/deconstruct particle fields, line-drawn SVG, pinned
scroll-scrubbed sequences, and a real-time 3D studio.

## Mode

**Experience, bending into Persuade.** The artifacts (particles, process, 3D car)
lead from the first viewport; the interface recedes. Booking remains the goal —
every section still routes to the planner/ticket.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#090a0c` | page background |
| `--bg-2` | `#0e1013` | panels, cards, process band |
| `--bg-3` | `#14171b` | elevated surfaces |
| `--ink` | `#f2f4f6` | primary text |
| `--ink-soft` | `#9aa4ae` | secondary text |
| `--line` | `#262b31` | hairline borders |
| `--acid` | `#c8ff2e` | signal color: CTAs, active states, FX traces |
| `--acid-soft` | `rgba(200,255,46,.14)` | selected chips, toggle fills |
| `--err` / `--ok` | `#ff5470` / `#45e6a0` | validation |

Acid is rationed: one CTA per viewport, one glowing trace per scene. Everything
else is ink on black.

## Type

- Display/UI: `"Space Grotesk"` — uppercase headings, tight tracking (-0.03em)
- Labels/HUD: `"JetBrains Mono"` — 0.6–0.72rem, +0.18em letter-spacing
- Hero: `clamp(2.7rem, 7.2vw, 5.4rem)`; H2 `clamp(1.9rem, 4vw, 3.2rem)`
- Body stays sentence-case for readability; chrome is uppercase.

## Motion architecture (the point of this site)

| Layer | Engine | Where |
|---|---|---|
| Preloader: line-drawn hexagon, staggered wordmark, blast-out | anime.js v4 (`createDrawable`, timeline, `stagger`) | `loader.js` |
| Hero particle field: 600-square grid assembles, breathes, shoves away from the pointer, DECONSTRUCTS on scroll into services and reassembles behind you | anime.js v4 batched tweens + canvas raf | `hero-particles.js` |
| Hero intro: staggered lines, count-up stats, droplet rides the car contour via motion path while the gloss trace draws | anime.js v4 (`createMotionPath`, `createDrawable`) | `hero-particles.js` |
| Marquee: infinite service ticker | anime.js v4 `createTimer` | `marquee.js` |
| Process: pinned section scrubbed through 4 detailing passes (foam rise, rinse drops, ceramic trace draws, cabin pieces pop) with HUD sync | GSAP + ScrollTrigger | `process.js` |
| Studio: drag-orbit 3D car, paint swatches, ceramic/wax/wheel toggles, decon slider that scrubs paint from swirly-matte to glassy | three.js (lazy-loaded chunk) | `studio3d.js` |
| Cards: pointer-tracked glow + 3D tilt | GSAP quickTo-style tweens | `process.js` |
| Re price / validation / confirmation | anime.js v4 + native WAAPI | `planner.js`, `booking.js` |

Rules: motion guides or explains (cause → effect), never replays after settling,
and everything collapses to static/final states under `prefers-reduced-motion`.
Three.js is a separate chunk loaded only when the visitor approaches the studio.

## Shape & spacing

- Radius 16px; hairlines `--line`; glows only around acid elements
- Container `min(1160px, 92vw)`; section pad `clamp(4.5rem, 9vw, 8rem)`
- Buttons: pill, 48px (54px hero), acid fill with dark ink text
