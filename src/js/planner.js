import { animate, stagger } from "animejs";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const VEHICLES = [
  { id: "coupe", label: "Coupe / Hatch", priceMult: 1 },
  { id: "sedan", label: "Sedan / Wagon", priceMult: 1.15 },
  { id: "suv", label: "SUV / Crossover", priceMult: 1.35 },
  { id: "truck", label: "Truck / Van", priceMult: 1.5 },
];

export const SERVICES = [
  { id: "wash", label: "Hand wash & decon", base: 59, minutes: 90 },
  { id: "correction", label: "Machine correction", base: 189, minutes: 240 },
  { id: "ceramic", label: "Ceramic armor", base: 349, minutes: 480 },
  { id: "interior", label: "Cave-level interior", base: 129, minutes: 180 },
];

export const PACKAGES = [
  { id: "shine", name: "Shine Reset", combo: ["wash"], price: 49, minutes: 90 },
  { id: "guardian", name: "Guardian", combo: ["wash", "ceramic"], price: 359, minutes: 540 },
  { id: "full", name: "Full Guardian", combo: ["wash", "correction", "ceramic"], price: 549, minutes: 780 },
  { id: "cabin", name: "Cabin Revive", combo: ["wash", "interior"], price: 164, minutes: 240 },
];

const state = {
  vehicle: VEHICLES[1],
  services: new Set(["wash"]),
};

const fmt = (n) => "$" + Math.round(n);

function hrs(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`;
}

function matchPackage() {
  const combo = [...state.services].sort().join("+");
  return PACKAGES.find((p) => [...p.combo].sort().join("+") === combo) || null;
}

export function initPlanner(onChange) {
  const vehicleWrap = document.getElementById("vehicleChips");
  const serviceWrap = document.getElementById("serviceChips");
  const priceEl = document.getElementById("plannerPrice");
  const timeEl = document.getElementById("plannerTime");
  const pkgBox = document.getElementById("plannerPkg");
  const pkgName = document.getElementById("plannerPkgName");
  const pkgSave = document.getElementById("plannerPkgSave");
  if (!vehicleWrap || !serviceWrap || !priceEl) return;

  let shown = { v: 0 };

  function makeChip(label, price, pressed) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.setAttribute("aria-pressed", String(pressed));
    b.innerHTML =
      `<span>${label}</span>` +
      (price ? `<span class="chip__price">${price}</span>` : "");
    return b;
  }

  VEHICLES.forEach((v) => {
    const b = makeChip(v.label, null, v.id === state.vehicle.id);
    b.addEventListener("click", () => {
      state.vehicle = v;
      vehicleWrap.querySelectorAll(".chip").forEach((c) =>
        c.setAttribute("aria-pressed", String(c === b))
      );
      pop(b);
      update();
    });
    vehicleWrap.appendChild(b);
  });

  SERVICES.forEach((s) => {
    const b = makeChip(s.label, "from " + fmt(s.base), state.services.has(s.id));
    b.addEventListener("click", () => {
      state.services.has(s.id)
        ? state.services.delete(s.id)
        : state.services.add(s.id);
      b.setAttribute("aria-pressed", String(state.services.has(s.id)));
      pop(b);
      update();
    });
    serviceWrap.appendChild(b);
  });

  function pop(el) {
    if (reduced) return;
    animate(el, { scale: [1, 0.92, 1.04, 1], duration: 420, ease: "outQuad" });
  }

  function compute() {
    const pkg = matchPackage();
    let price = 0;
    let mins = 0;
    if (pkg) {
      price = pkg.price * state.vehicle.priceMult;
      mins = pkg.minutes;
    } else {
      SERVICES.forEach((s) => {
        if (state.services.has(s.id)) {
          price += s.base * state.vehicle.priceMult;
          mins += s.minutes * (state.vehicle.priceMult > 1 ? 1.15 : 1);
        }
      });
    }
    return { pkg, price, mins: Math.round(mins) };
  }

  function update() {
    const { pkg, price, mins } = compute();
    const none = state.services.size === 0;

    // spring the number — cause (pick) -> effect (price)
    const from = shown.v;
    const to = none ? 0 : price;
    shown.v = to;
    if (reduced) {
      priceEl.textContent = none ? "—" : fmt(price);
    } else {
      const counter = { v: from };
      animate(counter, {
        v: to,
        duration: 650,
        ease: "outExpo",
        onUpdate: (self) => {
          const v = counter.v;
          priceEl.textContent = v < 1 ? "—" : fmt(v);
        },
      });
      animate(priceEl, { scale: [1, 1.05, 1], duration: 380, ease: "outQuad" });
    }

    if (timeEl) timeEl.textContent = none ? "Pick at least one service" : `≈ ${hrs(mins)} at your place`;

    if (pkg && !none && pkgBox) {
      const raw =
        SERVICES.filter((s) => pkg.combo.includes(s.id)).reduce(
          (t, s) => t + s.base,
          0
        ) * state.vehicle.priceMult;
      const save = Math.round(raw - price);
      pkgBox.hidden = false;
      if (pkgName) pkgName.textContent = pkg.name;
      if (pkgSave) pkgSave.textContent = `You save ${fmt(save)} vs booking separately`;
      if (!reduced) animate(pkgBox, { opacity: [0, 1], translateY: [10, 0], duration: 380, ease: "outQuad" });
    } else if (pkgBox) {
      pkgBox.hidden = true;
    }

    onChange?.(currentPlan());
  }

  function currentPlan() {
    const { pkg, price, mins } = compute();
    const names = SERVICES.filter((s) => state.services.has(s.id)).map((s) => s.label);
    return {
      valid: state.services.size > 0,
      vehicle: state.vehicle.label,
      services: names,
      pkg: pkg ? pkg.name : null,
      price: state.services.size ? fmt(price) : null,
      minutes: mins,
    };
  }

  update();
  return { currentPlan };
}
