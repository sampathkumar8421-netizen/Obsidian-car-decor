import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * THE PROCESS — pinned section scrubbed by scroll.
 * 4 passes: foam bath, decon rinse, ceramic shield, cabin reset.
 * Each pass activates its FX layer in the SVG; HUD text syncs.
 */
export function initProcess() {
  const section = document.getElementById("process");
  if (!section) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hud = document.getElementById("processHud");
  const fx = {
    0: document.getElementById("fxFoam"),
    1: document.getElementById("fxRinse"),
    2: document.getElementById("fxShield"),
    3: document.getElementById("fxCabin"),
  };
  const steps = gsap.utils.toArray(".proc-step");

  const shield = document.getElementById("shieldPath");
  const shieldLen = shield ? shield.getTotalLength() : 0;

  if (reduced) {
    // Static: show ceramic shield and cabin reset as the resting state
    if (shield) {
      shield.style.strokeDasharray = "none";
      shield.style.strokeDashoffset = "0";
    }
    if (fx[2]) fx[2].style.opacity = "1";
    if (fx[3]) fx[3].style.opacity = "1";
    steps.forEach((s) => s.classList.add("is-active"));
    if (hud) hud.textContent = "ALL PASSES COMPLETED · CERAMIC SEALED";
    return;
  }

  // Prep: bubbles above the car, rinse drops above, shield hidden by dash
  const bubbles = gsap.utils.toArray("#fxFoam .bub");
  const drops = gsap.utils.toArray("#fxRinse .drop");
  if (shield) gsap.set(shield, { strokeDasharray: shieldLen, strokeDashoffset: shieldLen });
  gsap.set(bubbles, { opacity: 0, y: -60, scale: 0.4, transformOrigin: "center" });
  // Drops fall via transform (compositor-friendly) — animating y1/y2 attrs
  // mutates SVG geometry every frame and was the main scrub jank source.
  gsap.set(drops, { opacity: 0, y: -90 });
  if (fx[2]) gsap.set(fx[2], { opacity: 1 });
  if (fx[3]) gsap.set(fx[3], { opacity: 1 });

  const PASS_LABELS = [
    "PASS 01 / 04 — FOAM BATH",
    "PASS 02 / 04 — DECON RINSE",
    "PASS 03 / 04 — CERAMIC SHIELD",
    "PASS 04 / 04 — CABIN RESET",
  ];

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=2600",
      scrub: 0.4,
      pin: true,
      anticipatePin: 1,
    },
    defaults: { ease: "none" },
  });

  // PASS 1 — foam bubbles rise and settle onto the car
  tl.to(bubbles, {
    opacity: 1,
    y: 0,
    scale: 1,
    stagger: { each: 0.05, from: "random" },
    duration: 1.2,
  })
    .add(() => setStep(0), 0)
    // PASS 2 — rinse drops fall through and fade
    .to(drops, {
      opacity: 1,
      y: 0,
      stagger: 0.04,
      duration: 0.8,
    })
    .to(drops, { opacity: 0, y: 40, stagger: 0.03, duration: 0.6 }, ">-0.1")
    .to(bubbles, { opacity: 0, duration: 0.5 }, "<")
    .add(() => setStep(1), "<")
    // PASS 3 — ceramic shield draws across the roofline
    .to(shield, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" })
    .add(() => setStep(2), "<")
    // PASS 4 — cabin pieces scale in
    .fromTo(
      "#fxCabin .seat, #fxCabin .dash, #fxCabin .wheel2",
      { scale: 0, opacity: 0, transformOrigin: "center" },
      { scale: 1, opacity: 1, stagger: 0.12, duration: 0.9, ease: "back.out(2)" }
    )
    .add(() => setStep(3), "<");

  let current = -1;
  function setStep(i) {
    if (current === i) return;
    current = i;
    steps.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
    if (hud) hud.textContent = PASS_LABELS[i];
  }

  // Interactive step tabs: clicking or pressing enter scrolls directly to that pass
  steps.forEach((step, idx) => {
    step.setAttribute("role", "button");
    step.setAttribute("tabindex", "0");
    step.setAttribute("aria-label", `Jump to ${PASS_LABELS[idx]}`);
    const goToStep = () => {
      const st = tl.scrollTrigger;
      if (st) {
        const progress = [0, 0.28, 0.62, 0.95][idx];
        const targetScroll = st.start + progress * (st.end - st.start);
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    };
    step.addEventListener("click", goToStep);
    step.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToStep();
      }
    });
  });

  // Intro reveal of the two columns
  gsap.from(".process__copy > *", {
    opacity: 0,
    y: 40,
    stagger: 0.12,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: section, start: "top 70%" },
  });

  // Webfont swap changes text metrics -> re-measure pin spacers once fonts land
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

/**
 * General scroll reveals (anime-style easing via GSAP) + section head support.
 */
export function initReveals() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const els = gsap.utils.toArray("[data-reveal]");
  if (reduced) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }

  els.forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 82%" },
      onComplete: () => el.classList.add("is-in"),
    });
  });
}

/** Pointer-follow glow + subtle 3D tilt on service cards. */
export function initTilt() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    // quickTo reuses one tween per property instead of creating a tween per event
    const rxTo = gsap.quickTo(card, "rotationX", { duration: 0.35, ease: "power2.out" });
    const ryTo = gsap.quickTo(card, "rotationY", { duration: 0.35, ease: "power2.out" });
    gsap.set(card, { transformPerspective: 700 });
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      card.style.setProperty("--gx", `${x}px`);
      card.style.setProperty("--gy", `${y}px`);
      rxTo((y / r.height - 0.5) * -7);
      ryTo((x / r.width - 0.5) * 7);
    });
    card.addEventListener("pointerleave", () => {
      rxTo(0);
      ryTo(0);
    });
  });
}
