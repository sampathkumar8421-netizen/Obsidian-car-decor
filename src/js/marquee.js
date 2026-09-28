import { createTimer, utils } from "animejs";

const WORDS = [
  "HAND WASH",
  "IRON REMOVER",
  "CLAY BAR",
  "MACHINE POLISH",
  "CERAMIC",
  "STEAM",
  "ENZYME",
  "GLASS",
];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initMarquee() {
  const track = document.getElementById("marqueeTrack");
  if (!track) return;

  const build = () => WORDS.map((w) => `<span>${w}</span><b>◆</b>`).join("");
  track.innerHTML = build() + build(); // doubled for seamless wrap

  if (reduced) return;

  let x = 0;
  let timer = null;
  let isHovered = false;
  const half = () => track.scrollWidth / 2;

  const strip = track.parentElement;
  strip?.addEventListener("pointerenter", () => { isHovered = true; }, { passive: true });
  strip?.addEventListener("pointerleave", () => { isHovered = false; }, { passive: true });

  function start() {
    if (timer) {
      timer.play();
      return;
    }
    timer = createTimer({
      onUpdate: () => {
        if (isHovered) return;
        x -= 0.6;
        const h = half();
        if (h > 0 && -x >= h) x += h;
        utils.set(track, { translateX: x });
      },
    });
  }

  function stop() {
    timer?.pause();
  }

  // Ticks only while the strip is on screen — scrolling elsewhere costs nothing.
  new IntersectionObserver(
    (entries) => {
      entries[0].isIntersecting ? start() : stop();
    },
    { threshold: 0 }
  ).observe(track);
}
