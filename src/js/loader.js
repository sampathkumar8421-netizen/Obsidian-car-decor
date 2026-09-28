const SKIP =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  (typeof location !== "undefined" && location.search.includes("skip=1"));

export const LOADER_SKIPPED = SKIP;

const STATUS = [
  "01 / 04 · INITIALIZING SCAN",
  "02 / 04 · DECONTAMINATING SURFACE",
  "03 / 04 · LEVELING CLEARCOAT",
  "04 / 04 · CURING CERAMIC ARMOR",
  "SURFACE SEALED · READY",
];

/**
 * Silky-smooth continuous power curve:
 * Combines an energetic initial response with a smooth Hermite S-curve.
 * First derivative is strictly positive everywhere on [0, 1), guaranteeing
 * zero dead-stops, zero hitching, and perfectly continuous fluid motion.
 */
function calcProgress(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Blend: 35% ease-out power curve + 65% smoothstep
  return 0.35 * (1 - Math.pow(1 - t, 2.4)) + 0.65 * (3 * t * t - 2 * t * t * t);
}

/**
 * Preloader — high-performance, cinematic loading experience.
 *
 * Stage 1: Active, high-energy loading sequence runs immediately from frame 0 (~1.25s).
 *          Laser spark traces and seals the hexagonal armor in real time.
 * Stage 2: 100% completion state locks in with "SURFACE SEALED · READY" (180ms hold).
 * Stage 3: Silky cinematic cross-dissolve (480ms): landing page gracefully emerges
 *          underneath the dissolving preloader before scroll unlocks.
 */
export function initLoader(onComplete) {
  const loader = document.getElementById("loader");

  const unlockScroll = () => {
    document.documentElement.classList.remove("is-loading");
    document.body?.classList.remove("is-loading", "is-revealing");
  };

  if (!loader) {
    unlockScroll();
    onComplete?.();
    return;
  }

  if (SKIP) {
    loader.remove();
    unlockScroll();
    onComplete?.();
    return;
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    loader.remove();
    unlockScroll();
  };

  const mainHex = document.getElementById("loaderMainHex");
  const innerHex = document.getElementById("loaderInnerHex");
  const rotator = document.getElementById("loaderRotator");
  const sat = document.getElementById("loaderSat");
  const glow = document.getElementById("loaderGlow");
  const core = document.getElementById("loaderCore");
  const bar = document.getElementById("loaderBar");
  const status = document.getElementById("loaderStatus");
  const pct = document.getElementById("loaderPct");

  if (!mainHex || !innerHex) {
    finish();
    onComplete?.();
    return;
  }

  const mainLen = mainHex.getTotalLength ? mainHex.getTotalLength() : 480;
  const innerLen = innerHex.getTotalLength ? innerHex.getTotalLength() : 280;

  // Set up stroke dash arrays so stroke dynamically welds into view
  mainHex.style.strokeDasharray = `${mainLen} ${mainLen}`;
  innerHex.style.strokeDasharray = `${innerLen} ${innerLen}`;
  mainHex.style.strokeDashoffset = String(mainLen);
  innerHex.style.strokeDashoffset = String(innerLen);

  // Safety fallback timeout
  const cap = setTimeout(() => {
    finish();
    onComplete?.();
  }, 4000);

  // Active Loading Timeline: 1250ms duration (fast, punchy, diagnostic cadence)
  const DURATION = 1250;
  const startTime = performance.now();
  let rafId = null;

  function updateLoading(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, Math.max(0, elapsed / DURATION));
    const progress = calcProgress(t);

    // 1. Digital Monospace Percentage (0% -> 100%)
    const pctValue = Math.min(100, Math.round(progress * 100));
    if (pct) pct.textContent = `${pctValue}%`;

    // 2. High-glow Progress Bar
    if (bar) bar.style.transform = `scaleX(${progress})`;

    // 3. Diagnostic Status Readout
    if (status) {
      if (progress >= 0.98) {
        status.textContent = STATUS[4];
        status.style.color = "var(--acid)";
        status.style.textShadow = "0 0 10px rgba(200, 255, 46, 0.7)";
      } else if (progress >= 0.78) {
        status.textContent = STATUS[3];
      } else if (progress >= 0.50) {
        status.textContent = STATUS[2];
      } else if (progress >= 0.20) {
        status.textContent = STATUS[1];
      } else {
        status.textContent = STATUS[0];
      }
    }

    // 4. Spark laser-welds the perimeter at the head of the drawing stroke
    const currentDist = progress * mainLen;
    if (sat && mainHex.getPointAtLength) {
      const pt = mainHex.getPointAtLength(progress >= 1 ? 0 : Math.min(currentDist, mainLen - 0.01));
      sat.setAttribute("cx", String(pt.x));
      sat.setAttribute("cy", String(pt.y));
    }

    // 5. Hexagon Stroke: actively drawn in real-time as the spark travels
    const strokeOffset = Math.max(0, (1 - progress) * mainLen);
    mainHex.style.strokeDashoffset = String(strokeOffset);

    // 6. Inner counter-hex stroke trace
    const innerOffset = Math.max(0, (1 - progress) * innerLen);
    innerHex.style.strokeDashoffset = String(innerOffset);

    // 7. Core rotator: 60-degree precision rotation locked to progress
    if (rotator) {
      const degrees = progress * 60;
      rotator.style.transform = `rotate(${degrees}deg)`;
    }

    // 8. Ambient glow breathing and expanding
    if (glow) {
      const pulse = 0.45 + progress * 0.45 + Math.sin(progress * Math.PI * 3) * 0.1;
      glow.style.opacity = String(Math.min(1, Math.max(0.3, pulse)));
      glow.style.transform = `scale(${0.9 + progress * 0.3})`;
    }

    // 9. Center core polygon pulse
    if (core) {
      const s = 1 + Math.sin(progress * Math.PI * 4) * 0.18;
      core.style.transform = `scale(${s})`;
    }

    if (t < 1) {
      rafId = requestAnimationFrame(updateLoading);
    } else {
      // STAGE 2: 100% SEALED STATE
      clearTimeout(cap);

      if (pct) {
        pct.textContent = "100%";
        pct.style.color = "#ffffff";
        pct.style.textShadow = "0 0 16px var(--acid), 0 0 32px var(--acid)";
      }
      if (bar) {
        bar.style.transform = "scaleX(1)";
        bar.style.boxShadow = "0 0 20px #ffffff, 0 0 40px var(--acid)";
      }
      if (status) {
        status.textContent = "SURFACE SEALED · READY";
        status.style.color = "var(--acid)";
        status.style.textShadow = "0 0 12px rgba(200, 255, 46, 0.8)";
      }
      mainHex.style.strokeDashoffset = "0";
      innerHex.style.strokeDashoffset = "0";
      if (rotator) rotator.style.transform = "rotate(60deg)";
      if (sat && mainHex.getPointAtLength) {
        const pt = mainHex.getPointAtLength(0);
        sat.setAttribute("cx", String(pt.x));
        sat.setAttribute("cy", String(pt.y));
      }
      loader.classList.add("loader--sealed");

      // Brief tactical lock-in beat (180ms) to savor the completed 100% state
      setTimeout(() => {
        // STAGE 3: Silky cinematic cross-dissolve transition (480ms)
        // 1. Loader begins smooth dissolve & blur
        loader.classList.add("is-exiting");

        // 2. Landing page simultaneously starts smooth reveal beneath the dissolving loader
        document.body?.classList.add("is-revealing");
        onComplete?.();

        // 3. When cross-dissolve completes, cleanly remove loader & unlock scrollbar
        setTimeout(finish, 480);
      }, 180);
    }
  }

  // Launch loading animation instantly on frame 0
  rafId = requestAnimationFrame(updateLoading);
}
