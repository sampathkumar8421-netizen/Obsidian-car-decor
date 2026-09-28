import * as THREE from "three";

/**
 * THE STUDIO — real-time 3D preview.
 * Procedural car (no external assets): body shell, cabin, wheels.
 * Interactions:
 *  - drag to orbit
 *  - paint swatches (instant material color)
 *  - finish toggles: ceramic (clearcoat), wax (sheen boost), wheels-off black
 *  - decon slider: 0% = matte, swirly, dirty paint; 100% = corrected, glassy
 *  - package cards pulse when their combo matches current toggles
 */
export function initStudio(onStateChange) {
  const canvas = document.getElementById("studioCanvas");
  if (!canvas) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hint = document.getElementById("studioHint");
  const deconRange = document.getElementById("deconRange");
  const deconPct = document.getElementById("deconPct");
  const swatchWrap = document.getElementById("paintSwatches");
  const toggleWrap = document.getElementById("finishToggles");
  const pkgWrap = document.getElementById("studioPkgs");
  const stage = canvas.parentElement;

  // ---------- renderer / scene ----------
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    console.warn("[obsidian] WebGL unavailable:", err);
    if (stage) {
      const fb = document.createElement("div");
      fb.className = "studio__hint";
      fb.style.top = "50%";
      fb.style.left = "50%";
      fb.style.transform = "translate(-50%, -50%)";
      fb.textContent = "3D PREVIEW REQUIRES WEBGL SUPPORT";
      stage.appendChild(fb);
    }
    return;
  }
  // 1.5 cap: big win on 4K/retina displays, no visible quality loss in a dark scene
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(6.4, 2.6, 7.2);
  camera.lookAt(0, 0.55, 0);

  // ---------- lights ----------
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(5, 8, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8ff2e, 1.1);
  rim.position.set(-6, 4, -6);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffffff, 0.5, 30);
  fill.position.set(-3, 2, 5);
  scene.add(fill);

  // Soft circular glow floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 64),
    new THREE.MeshBasicMaterial({ color: 0x0e1013 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.005;
  scene.add(floor);

  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(3.4, 3.55, 96),
    new THREE.MeshBasicMaterial({
      color: 0xc8ff2e,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    })
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.002;
  scene.add(glowRing);

  // ---------- procedural car ----------
  const car = new THREE.Group();
  scene.add(car);

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: 0x8a1f2d,
    metalness: 0.72,
    roughness: 0.42,
    clearcoat: 0,
    clearcoatRoughness: 0.35,
  });

  // NOTE: no `transmission` — transmissive materials force an extra render
  // pass per frame and were the main cause of studio scroll jank.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0e12,
    metalness: 0.2,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });

  const trimMat = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, metalness: 0.4, roughness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0b0d10, metalness: 0.55, roughness: 0.5 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x9aa4ae, metalness: 0.9, roughness: 0.25 });

  // body: rounded low shell via extruded profile
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-2.3, 0.32);
  bodyShape.lineTo(-2.3, 0.72);
  bodyShape.bezierCurveTo(-2.0, 0.98, -1.2, 1.02, -0.55, 1.02);
  bodyShape.bezierCurveTo(0.1, 1.02, 0.5, 0.94, 1.05, 0.9);
  bodyShape.bezierCurveTo(1.8, 0.86, 2.2, 0.72, 2.3, 0.5);
  bodyShape.lineTo(2.3, 0.32);
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 1.9,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.14,
    bevelSegments: 6,
    curveSegments: 24,
  });
  bodyGeo.translate(0, 0, -0.95);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.rotation.y = Math.PI / 2;
  car.add(body);

  // cabin
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.95, 0.98);
  cabinShape.lineTo(-0.62, 1.46);
  cabinShape.bezierCurveTo(-0.2, 1.58, 0.45, 1.56, 0.78, 1.44);
  cabinShape.lineTo(1.05, 1.0);
  cabinShape.closePath();
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 1.62,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 18,
  });
  cabinGeo.translate(0, 0, -0.81);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.rotation.y = Math.PI / 2;
  car.add(cabin);

  // wheels
  function makeWheel(x, z) {
    const g = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 40), wheelMat);
    tire.rotation.x = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 24), hubMat);
    hub.rotation.x = Math.PI / 2;
    g.add(tire, hub);
    g.position.set(x, 0.42, z);
    car.add(g);
    return g;
  }
  const wheels = [
    makeWheel(-1.45, 0.98),
    makeWheel(1.45, 0.98),
    makeWheel(-1.45, -0.98),
    makeWheel(1.45, -0.98),
  ];

  // headlight strip
  const lightStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.07, 1.3),
    new THREE.MeshBasicMaterial({ color: 0xfff7cc })
  );
  lightStrip.position.set(2.42, 0.62, 0);
  car.add(lightStrip);
  const tailStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.07, 1.3),
    new THREE.MeshBasicMaterial({ color: 0xff3355 })
  );
  tailStrip.position.set(-2.42, 0.62, 0);
  car.add(tailStrip);

  // swirl texture overlay (visible when decon = 0, fades to 100)
  const swirlCanvas = document.createElement("canvas");
  swirlCanvas.width = swirlCanvas.height = 256;
  const sctx = swirlCanvas.getContext("2d");
  sctx.fillStyle = "rgba(255,255,255,0)";
  sctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) {
    sctx.strokeStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"}, ${0.05 + Math.random() * 0.1})`;
    sctx.lineWidth = 1 + Math.random() * 2;
    sctx.beginPath();
    const cx = Math.random() * 256;
    const cy = Math.random() * 256;
    const r = 4 + Math.random() * 16;
    sctx.arc(cx, cy, r, Math.random() * 6, Math.random() * 6 + 2);
    sctx.stroke();
  }
  const swirlTex = new THREE.CanvasTexture(swirlCanvas);
  swirlTex.wrapS = swirlTex.wrapT = THREE.RepeatWrapping;
  swirlTex.repeat.set(3, 2);

  // ---------- state + UI ----------
  const PAINTS = [
    { name: "Crimson", hex: 0x8a1f2d },
    { name: "Obsidian", hex: 0x0b0d10 },
    { name: "Glacier", hex: 0xbfcdd6 },
    { name: "Acid", hex: 0x9db31e },
    { name: "Cobalt", hex: 0x1d3a8f },
    { name: "Sand", hex: 0xb59a6a },
  ];
  const FINISHES = [
    { id: "ceramic", label: "CERAMIC ARMOR", meta: "3-YR · $349" },
    { id: "wax", label: "CARNAUBA WAX", meta: "2-MO · $49" },
    { id: "wheels", label: "CERAMIC WHEELS", meta: "+$89" },
  ];
  const state = {
    decon: 0,
    ceramic: false,
    wax: false,
    wheels: false,
    paint: PAINTS[0].hex,
  };

  // swirl overlay: slightly larger transparent copy of the body (defined before apply)
  const swirlMat = new THREE.MeshPhysicalMaterial({
    map: swirlTex,
    transparent: true,
    opacity: 0.55,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
  });
  const swirlMesh = new THREE.Mesh(bodyGeo.clone(), swirlMat);
  swirlMesh.rotation.y = Math.PI / 2;
  swirlMesh.scale.setScalar(1.012);
  car.add(swirlMesh);

  PAINTS.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + (i === 0 ? " is-active" : "");
    b.style.background = `#${p.hex.toString(16).padStart(6, "0")}`;
    b.title = p.name;
    b.setAttribute("aria-label", `Paint: ${p.name}`);
    b.setAttribute("aria-pressed", String(i === 0));
    b.addEventListener("click", () => {
      swatchWrap?.querySelectorAll(".swatch").forEach((s) => {
        s.classList.remove("is-active");
        s.setAttribute("aria-pressed", "false");
      });
      b.classList.add("is-active");
      b.setAttribute("aria-pressed", "true");
      state.paint = p.hex;
      apply();
    });
    swatchWrap?.appendChild(b);
  });

  const toggleBtns = {};
  FINISHES.forEach((f) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tgl";
    b.innerHTML = `<span>${f.label}</span><span class="tgl__meta">${f.meta}</span>`;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      state[f.id] = !state[f.id];
      b.setAttribute("aria-pressed", String(state[f.id]));
      b.classList.toggle("is-on", state[f.id]);
      apply();
    });
    toggleBtns[f.id] = b;
    toggleWrap?.appendChild(b);
  });

  const PKGS = [
    { name: "SHINE RESET", combo: { wax: true, ceramic: false, wheels: false }, price: "$84" },
    { name: "FULL GUARDIAN", combo: { ceramic: true, wheels: true, wax: false }, price: "$438" },
    { name: "GUARDIAN", combo: { ceramic: true, wax: false, wheels: false }, price: "$349" },
  ];
  const pkgEls = [];
  PKGS.forEach((p) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "pkg";
    el.setAttribute("aria-label", `Apply ${p.name} package`);
    el.innerHTML = `<h4>${p.name}</h4><p>${p.price} · click to apply</p>`;
    el.addEventListener("click", () => {
      Object.entries(p.combo).forEach(([k, v]) => {
        state[k] = v;
        if (toggleBtns[k]) {
          toggleBtns[k].setAttribute("aria-pressed", String(v));
          toggleBtns[k].classList.toggle("is-on", v);
        }
      });
      apply();
    });
    pkgWrap?.appendChild(el);
    pkgEls.push({ el, p });
  });

  function updatePkgs() {
    pkgEls.forEach(({ el, p }) => {
      const hit = Object.entries(p.combo).every(([k, v]) => state[k] === v);
      if (hit && !el.classList.contains("is-hit")) {
        el.classList.add("is-hit");
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
      } else if (!hit) {
        el.classList.remove("is-hit");
      }
    });
  }

  function apply() {
    // paint
    paintMat.color.setHex(state.paint);
    // decon drives the base look: matte + swirly at 0, glassy at 100
    const d = state.decon / 100;
    paintMat.roughness = Math.min(0.65, Math.max(0.08, 0.62 - 0.5 * d + (state.wax ? -0.12 : 0)));
    paintMat.metalness = 0.5 + 0.25 * d;
    paintMat.clearcoat = state.ceramic ? 1.0 : 0.35 * d;
    paintMat.clearcoatRoughness = state.ceramic ? 0.06 : 0.35;
    wheelMat.color.setHex(state.wheels ? 0x15181c : 0x0b0d10);
    hubMat.color.setHex(state.wheels ? 0xc8ff2e : 0x9aa4ae);
    swirlMat.opacity = (1 - d) * 0.55;
    glowRing.material.opacity = 0.12 + 0.25 * d;
    updatePkgs();
    onStateChange?.({ ...state });
  }

  deconRange?.addEventListener("input", () => {
    state.decon = parseInt(deconRange.value, 10);
    if (deconPct) deconPct.textContent = `${state.decon}%`;
    apply();
  });

  // ---------- drag orbit ----------
  let targetRotY = 0.6;
  let targetRotX = 0.0;
  let curRotY = 0.6;
  let curRotX = 0.0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    hint && (hint.textContent = "RELEASE TO SETTLE");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    targetRotY += (e.clientX - lastX) * 0.008;
    targetRotX += (e.clientY - lastY) * 0.005;
    targetRotX = Math.max(-0.25, Math.min(0.35, targetRotX));
    lastX = e.clientX;
    lastY = e.clientY;
  });
  const endDrag = () => {
    dragging = false;
    hint && (hint.textContent = "DRAG TO ORBIT");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);

  // Render loop: runs ONLY while the stage is on screen. Scrolling past the
  // studio costs zero GPU/CPU — the loop fully stops.
  let stageVisible = false;
  let rafId = null;

  function animateLoop(t) {
    rafId = null;
    if (!stageVisible) return;
    const dt = Math.min((t - (animateLoop.last || t)) / 1000, 0.05);
    animateLoop.last = t;
    if (!dragging && !reduced) targetRotY += dt * 0.12;
    curRotY += (targetRotY - curRotY) * 0.08;
    curRotX += (targetRotX - curRotX) * 0.08;
    car.rotation.y = curRotY;
    car.rotation.x = curRotX;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animateLoop);
  }

  new IntersectionObserver(
    (entries) => {
      stageVisible = entries[0].isIntersecting;
      if (stageVisible && !rafId) {
        animateLoop.last = performance.now();
        rafId = requestAnimationFrame(animateLoop);
      }
    },
    { threshold: 0.05 }
  ).observe(stage);

  // resize
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  apply();
  if (hint) hint.textContent = "DRAG TO ORBIT";
}
