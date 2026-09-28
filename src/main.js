import { initLoader, LOADER_SKIPPED } from "./js/loader.js";
import { initHeroParticles, initHeroIntro } from "./js/hero-particles.js";
import { initMarquee } from "./js/marquee.js";
import { initProcess, initReveals, initTilt } from "./js/process.js";
import { initGallery } from "./js/gallery.js";
import { initPlanner } from "./js/planner.js";
import { initBooking } from "./js/booking.js";

/* ---------- lazy 3D studio (three.js isolated in dedicated chunk) ---------- */
let studioStarted = false;
function setupStudioObserver() {
  const el = document.getElementById("studio");
  if (!el || studioStarted) return;
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !studioStarted) {
        studioStarted = true;
        io.disconnect();
        import("./js/studio3d.js")
          .then(({ initStudio }) => initStudio())
          .catch((e) => console.warn("[obsidian] studio failed:", e));
      }
    },
    { rootMargin: "350px 0px" }
  );
  io.observe(el);
}

/* ---------- nav ---------- */
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");
const mobileMenu = document.getElementById("mobileMenu");

const onScroll = () => nav?.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const closeMenu = () => {
  if (mobileMenu && !mobileMenu.hidden) {
    mobileMenu.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open menu");
  }
};

const openMenu = () => {
  if (mobileMenu) {
    mobileMenu.hidden = false;
    toggle?.setAttribute("aria-expanded", "true");
    toggle?.setAttribute("aria-label", "Close menu");
  }
};

toggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!mobileMenu) return;
  mobileMenu.hidden ? openMenu() : closeMenu();
});

mobileMenu?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", closeMenu)
);

// Close menu on Escape or click outside
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

document.addEventListener("click", (e) => {
  if (
    mobileMenu &&
    !mobileMenu.hidden &&
    !mobileMenu.contains(e.target) &&
    !toggle?.contains(e.target)
  ) {
    closeMenu();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMenu();
}, { passive: true });

/* ---------- reviews (sample data) ---------- */
const REVIEWS = [
  {
    stars: 5,
    text: "Ten years of highway film gone in an afternoon. The ceramic beading after the first rain was genuinely fun to watch.",
    who: "MARCUS T. · FULL GUARDIAN · SUV",
  },
  {
    stars: 5,
    text: "They detailed my daughter's booster-seat disaster without a single comment. Cabin smells new. Booking again in spring.",
    who: "PRIYA S. · CABIN REVIVE · SEDAN",
  },
  {
    stars: 4,
    text: "Ran 40 minutes late, but texted ahead and made it right with an extra wheel detail. The paint feels like glass now.",
    who: "DAN K. · SHINE RESET · COUPE",
  },
];

const grid = document.getElementById("reviewGrid");
if (grid) {
  grid.innerHTML = "";
  REVIEWS.forEach((r) => {
    const art = document.createElement("article");
    art.className = "review";
    art.setAttribute("data-reveal", "");
    art.innerHTML = `
      <p class="review__stars"><span role="img" aria-label="${r.stars} out of 5 stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</span></p>
      <p>${r.text}</p>
      <p class="review__who">${r.who}</p>
    `;
    grid.appendChild(art);
  });
}

// Planner CTA smoothly focuses the first booking field
document.getElementById("plannerToBooking")?.addEventListener("click", () => {
  setTimeout(() => {
    document.getElementById("bName")?.focus();
  }, 400);
});

/* ---------- planner + booking ---------- */
let plan = { valid: false };
let refreshBooking = () => {};

initPlanner((p) => {
  plan = p;
  refreshBooking();
});

initBooking(
  () => plan,
  (refresh) => {
    if (typeof refresh === "function") refreshBooking = refresh;
  }
);

/* ---------- boot ---------- */
function safe(fn, label) {
  try {
    fn();
  } catch (e) {
    console.warn(`[obsidian] ${label} failed:`, e);
  }
}

function onPageReady() {
  // 1. Reveal hero animations dynamically as the preloader clears
  safe(initHeroIntro, "heroIntro");
  safe(initHeroParticles, "heroParticles");

  // 2. Initialize offscreen sections in the background for buttery-smooth scrolling
  requestAnimationFrame(() => {
    safe(initMarquee, "marquee");
    safe(initReveals, "reveals");
    safe(initTilt, "tilt");
    safe(initGallery, "gallery");
    safe(initProcess, "process");
    safe(setupStudioObserver, "studio");
  });

  // 3. Defer three.js chunk prefetch until page is fully idle
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => import("./js/studio3d.js"), { timeout: 6000 });
  }
}

// Preloader orchestrates the smooth sequence
safe(() => initLoader(onPageReady), "loader");
