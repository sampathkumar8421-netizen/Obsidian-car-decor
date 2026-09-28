/**
 * BEFORE / AFTER — drag comparator, spring-follow handle.
 * The swipe motion itself explains the transformation.
 */

const EXAMPLES = [
  { id: "daily", label: "DAILY · DECON + CERAMIC", before: "BEFORE · 8 yrs of swirl", after: "AFTER · decon + ceramic", alt: false },
  { id: "suv", label: "SUV · FULL INTERIOR", before: "BEFORE · juice + crumbs", after: "AFTER · steam-cleaned", alt: true },
  { id: "classic", label: "CLASSIC · PAINT RESTORE", before: "BEFORE · oxidized", after: "AFTER · machine-polished", alt: false },
];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initGallery() {
  const frame = document.getElementById("baFrame");
  const afterPane = frame?.querySelector(".ba__pane--after");
  const handle = document.getElementById("baHandle");
  const nav = document.getElementById("baNav");
  if (!frame || !afterPane || !handle) return;

  let pos = 50;
  let target = 50;
  let raf = null;

  function apply(p) {
    afterPane.style.clipPath = `inset(0 0 0 ${p}%)`;
    handle.style.left = `${p}%`;
    handle.setAttribute("aria-valuenow", String(Math.round(p)));
  }

  function tick() {
    pos += (target - pos) * (reduced ? 1 : 0.2);
    apply(pos);
    if (Math.abs(target - pos) > 0.1) raf = requestAnimationFrame(tick);
    else {
      pos = target;
      apply(pos);
      raf = null;
    }
  }

  function seek(p) {
    target = Math.min(96, Math.max(4, p));
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function pointerPct(e) {
    const r = frame.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    return (x / r.width) * 100;
  }

  frame.addEventListener("pointerdown", (e) => {
    frame.setPointerCapture(e.pointerId);
    seek(pointerPct(e));
  });
  frame.addEventListener("pointermove", (e) => {
    if (e.buttons || e.pressure > 0) seek(pointerPct(e));
  });

  handle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { seek(pos - 6); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") { seek(pos + 6); e.preventDefault(); }
    else if (e.key === "Home") { seek(4); e.preventDefault(); }
    else if (e.key === "End") { seek(96); e.preventDefault(); }
    else if (e.key === "PageDown") { seek(pos - 20); e.preventDefault(); }
    else if (e.key === "PageUp") { seek(pos + 20); e.preventDefault(); }
  });

  const dots = [];
  EXAMPLES.forEach((ex, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (i === 0 ? " is-selected" : "");
    b.setAttribute("aria-pressed", String(i === 0));
    b.textContent = ex.label;
    b.addEventListener("click", () => {
      dots.forEach((d) => {
        d.classList.remove("is-selected");
        d.setAttribute("aria-pressed", "false");
      });
      b.classList.add("is-selected");
      b.setAttribute("aria-pressed", "true");

      frame.querySelector(".ba__tag--before").textContent = ex.before;
      frame.querySelector(".ba__tag--after").textContent = ex.after;
      frame.querySelector(".ba__car--after").classList.toggle("ba__car--alt", ex.alt);
      frame.querySelector(".ba__car--before").classList.toggle("ba__car--alt", ex.alt);

      seek(50);
      if (!reduced) {
        // intro sweep so the swap is noticed
        target = 74;
        pos = 50;
        setTimeout(() => seek(50), 320);
      }
    });
    dots.push(b);
    nav?.appendChild(b);
  });

  apply(pos);
}
