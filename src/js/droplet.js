import { createTimeline, createDrawable, createMotionPath, utils } from "animejs";

/**
 * A water droplet rides the car silhouette while a gloss trace is drawn
 * behind it — explains "coating & shine" without words.
 */
export function initDroplet() {
  const scene = document.getElementById("dropletScene");
  const droplet = document.getElementById("droplet");
  const trace = document.getElementById("tracePath");
  const contour = document.getElementById("carContour");
  if (!scene || !droplet || !trace || !contour) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    droplet.style.opacity = "1";
    trace.style.opacity = "1";
    return;
  }

  const traceDrawable = createDrawable(trace);
  const path = createMotionPath(contour);

  droplet.style.opacity = "0";
  utils.set(droplet, { translateX: path.translateX(0), translateY: path.translateY(0) });

  const timeline = createTimeline({ defaults: { ease: "inOutQuad" } });
  timeline
    .add(traceDrawable, { draw: ["0 0", "0 1"], duration: 2400 }, 300)
    .add(droplet, { opacity: [0, 1], duration: 300 }, 300)
    .add(
      droplet,
      {
        translateX: path.translateX,
        translateY: path.translateY,
        duration: 2400,
      },
      300
    )
    .add(droplet, { opacity: [1, 0], scale: [1, 0.4], duration: 400 });
}
