/**
 * Legacy animation helpers — preserved for compatibility.
 * Primary reveals and hovers are handled in process.js.
 */
import { animate } from "animejs";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initReveals() {
  const revealables = document.querySelectorAll("[data-reveal]");
  if (reduced) {
    revealables.forEach((el) => el.classList.add("is-in"));
    return;
  }

  // Hero + any load-marked elements: play on page load, lightly staggered.
  const loadEls = [...document.querySelectorAll('[data-reveal="load"]')];
  loadEls.forEach((el, i) => {
    el.classList.add("is-in");
    animate(el, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 600,
      delay: 80 * i,
      ease: "outCubic",
    });
  });

  // Scroll reveals: fade up once via IntersectionObserver
  const scrollEls = document.querySelectorAll('[data-reveal], [data-reveal="scroll"]');
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add("is-in");
          animate(el, {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 550,
            ease: "outCubic",
          });
          obs.unobserve(el);
        }
      });
    },
    { threshold: 0.2 }
  );

  scrollEls.forEach((el) => {
    if (el.closest('[data-reveal="load"]') || el.dataset.reveal === "load") return;
    observer.observe(el);
  });
}

/** Service cards lift on hover; icon gives a small confirmation nudge. */
export function initHovers() {
  if (reduced) return;

  document.querySelectorAll(".service").forEach((card) => {
    const icon = card.querySelector(".service__icon svg");
    card.addEventListener("mouseenter", () => {
      animate(card, { translateY: -4, duration: 250, ease: "outQuad" });
      if (icon) animate(icon, { scale: [1, 1.12, 1], duration: 400, ease: "outQuad" });
    });
    card.addEventListener("mouseleave", () => {
      animate(card, { translateY: 0, duration: 300, ease: "outQuad" });
    });
  });
}
