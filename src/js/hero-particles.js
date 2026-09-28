import {
  animate,
  createTimeline,
  stagger,
  utils,
  createDrawable,
  createMotionPath,
} from "animejs";
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Hero particle grid: hundreds of tiny squares assemble from scattered
 * rotations into a wall, breathe on a loop, and BLAST APART (deconstruct)
 * when the visitor scrolls into the services section — then reassemble.
 * Pointer proximity shoves particles aside like water.
 */
export function initHeroParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;

  const ACID = { r: 200, g: 255, b: 46 };
  const WHITE = { r: 242, g: 244, b: 246 };

  const GRID = { cols: 34, rows: 18 };
  let particles = [];
  let running = true;
  let scattered = false;
  let phase = "assembling";

  const pointer = { x: -9999, y: -9999, active: false };

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function build() {
    particles = [];
    const cw = W / GRID.cols;
    const ch = H / GRID.rows;
    for (let r = 0; r < GRID.rows; r++) {
      for (let c = 0; c < GRID.cols; c++) {
        const homeX = cw * (c + 0.5);
        const homeY = ch * (r + 0.5);
        const acid = Math.random() < 0.14;
        const dim = 0.25 + Math.random() * 0.5;
        const col = acid ? ACID : WHITE;
        const alpha = acid ? 0.85 : dim * 0.5;
        particles.push({
          hx: homeX,
          hy: homeY,
          x: homeX,
          y: homeY,
          rot: 0,
          seed: Math.random() * Math.PI * 2,
          acid,
          dim,
          color: `rgba(${col.r},${col.g},${col.b},${alpha})`,
          size: 3 * (acid ? 1.15 : 1),
        });
      }
    }
  }

  // --- assemble / deconstruct (one batched tween over the whole array) ---
  function assemble() {
    if (reduced) return;
    phase = "assembling";
    animate(particles, {
      x: (p) => p.hx,
      y: (p) => p.hy,
      rot: 0,
      duration: () => utils.random(700, 1400),
      delay: stagger(2),
      ease: "outExpo",
      composition: "blend",
    });
  }

  function deconstruct() {
    if (reduced) return;
    phase = "scattered";
    animate(particles, {
      x: (p) => p.hx + utils.random(-260, 260),
      y: (p) => p.hy + utils.random(-200, 200),
      rot: () => utils.random(-135, 135),
      duration: () => utils.random(500, 900),
      delay: stagger(1),
      ease: "outExpo",
      composition: "blend",
    });
  }

  // --- pointer shove ---
  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  };
  const onPointerLeave = () => {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  window.addEventListener("blur", onPointerLeave, { passive: true });

  // --- scroll-driven deconstruct / reassemble ---
  const servicesEl = document.getElementById("services");
  let io = null;
  if (servicesEl && !reduced) {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !scattered) {
            scattered = true;
            deconstruct();
          } else if (!entry.isIntersecting && scattered) {
            scattered = false;
            assemble();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(servicesEl);
  }

  // --- render loop (paused whenever the hero is off-screen) ---
  let t = 0;
  let rafId = null;
  let heroVisible = true;

  function tick() {
    if (!running || !heroVisible) {
      rafId = null;
      return;
    }
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      // gentle breathing
      const bx = Math.sin(t * 0.9 + p.seed) * 2.2;
      const by = Math.cos(t * 0.7 + p.seed * 1.3) * 2.2;

      // pointer shove
      let px = 0;
      let py = 0;
      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        const R = 110;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) * 26;
          px = (dx / d) * f;
          py = (dy / d) * f;
        }
      }

      const tx = p.hx + bx + px;
      const ty = p.hy + by + py;
      p.x += (tx - p.x) * 0.09;
      p.y += (ty - p.y) * 0.09;
      p.rot += (0 - p.rot) * 0.08;

      const s = p.size;
      ctx.fillStyle = p.color;
      if (Math.abs(p.rot) > 0.08) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      } else {
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  function kick() {
    if (!rafId && running && heroVisible) rafId = requestAnimationFrame(tick);
  }

  new IntersectionObserver(
    (entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) kick();
    },
    { threshold: 0.02 }
  ).observe(canvas);

  resize();
  window.addEventListener("resize", resize);
  // start scattered, then assemble
  particles.forEach((p) => {
    p.x = p.hx + utils.random(-W, W) * 0.35;
    p.y = p.hy + utils.random(-H, H) * 0.35;
    p.rot = utils.random(-180, 180);
  });
  assemble();
  kick();

  return function destroy() {
    running = false;
    io?.disconnect();
    window.removeEventListener("resize", resize);
  };
}

/**
 * Hero entrance: staggered title lines, sub, actions; count-up stats;
 * anime.js v4 line-draw of the car contour + droplet riding a motion path.
 */
export function initHeroIntro() {
  // NOTE: hero text entrance is pure CSS (see .hero__line keyframes) — JS must
  // not gate the LCP element. JS handles only stats count-up + droplet sequence.

  // count-up stats: populate immediately if reduced-motion, else animate
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    if (isNaN(target)) return;

    if (reduced) {
      el.textContent = target.toFixed(dec) + suffix;
      return;
    }

    const counter = { v: 0 };
    animate(counter, {
      v: target,
      duration: 1600,
      delay: 500,
      ease: "outExpo",
      onUpdate: () => {
        el.textContent = counter.v.toFixed(dec) + suffix;
      },
    });
  });

  if (reduced) {
    return;
  }

  // contour line-draw + droplet (anime.js v4 SVG toolset)
  const trace = document.getElementById("heroTrace");
  const droplet = document.getElementById("heroDroplet");
  const contour = document.getElementById("heroCar");
  if (trace && droplet && contour) {
    const traceDrawable = createDrawable(trace);
    const path = createMotionPath(contour);
    droplet.style.opacity = "0";

    utils.set(droplet, { translateX: path.translateX(0), translateY: path.translateY(0) });

    const tl2 = createTimeline({ defaults: { ease: "inOutQuad" } });
    tl2
      .add(traceDrawable, { draw: ["0 0", "0 1"], duration: 2400 }, 900)
      .add(droplet, { opacity: [0, 1], duration: 300 }, 900)
      .add(
        droplet,
        {
          translateX: path.translateX,
          translateY: path.translateY,
          duration: 2400,
        },
        900
      )
      .add(droplet, { opacity: [1, 0], scale: [1, 0.4], duration: 400 });
  }
}
