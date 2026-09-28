/**
 * Booking form: inline validation with motion feedback, ticket carried from
 * the planner, animated confirmation. Demo only — wire the submit handler
 * to your backend or a form service to go live.
 */

import { animate } from "animejs";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const validators = {
  name: (v) =>
    v.trim().length >= 2 ? "" : "Please enter your name (2+ characters).",
  phone: (v) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length < 7) return "Enter a phone number we can text.";
    if (digits.length > 15) return "That number looks too long.";
    return "";
  },
  date: (v) => {
    if (!v) return "Pick a date for the detail.";
    const parts = v.split("-");
    if (parts.length !== 3) return "Please enter a valid date.";
    const d = new Date(v + "T23:59:59");
    if (isNaN(d.getTime())) return "Please enter a valid date.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return "That date is in the past.";
    const max = new Date();
    max.setDate(max.getDate() + 90);
    max.setHours(23, 59, 59, 999);
    if (d > max) return "Within the next 90 days, please.";
    return "";
  },
};

export function initBooking(getPlan, onReady) {
  const form = document.getElementById("bookingForm");
  const done = document.getElementById("bookingDone");
  const doneText = document.getElementById("bookingDoneText");
  const planBox = document.getElementById("bookingPlan");
  const planText = document.getElementById("bookingPlanText");
  const resetBtn = document.getElementById("bookingReset");
  if (!form) return;

  const fields = ["name", "phone", "date"].map((name) => {
    const input = form.elements[name];
    const wrap = input?.closest(".field");
    const msg = wrap?.querySelector(".field__msg");
    return { name, input, wrap, msg };
  });

  function validateField(f, show) {
    const err = validators[f.name](f.input.value);
    if (err) {
      f.wrap?.classList.add("is-invalid");
      f.wrap?.classList.remove("is-valid");
      if (f.msg) f.msg.textContent = show ? err : "";
      return false;
    }
    f.wrap?.classList.remove("is-invalid");
    f.wrap?.classList.add("is-valid");
    if (f.msg) f.msg.textContent = "OK";
    return true;
  }

  fields.forEach((f) => {
    f.input?.addEventListener("blur", () => {
      if (f.input.value) validateField(f, true);
    });
    f.input?.addEventListener("input", () => {
      if (f.wrap?.classList.contains("is-invalid")) validateField(f, true);
    });
  });

  function shake(f) {
    if (reduced || !f.wrap) return;
    f.wrap.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-7px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 280, easing: "ease-out" }
    );
  }

  const dateInput = form.elements.date;
  if (dateInput) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  function refreshPlan() {
    const plan = getPlan?.();
    if (!plan) return;
    if (plan.valid) {
      planBox.hidden = false;
      const bits = [plan.vehicle, ...plan.services];
      if (plan.pkg) bits.push(`${plan.pkg} package`);
      planText.textContent = bits.join(" · ") + " · " + plan.price;
    } else {
      planBox.hidden = true;
    }
  }
  refreshPlan();
  onReady?.(refreshPlan);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let firstBad = null;
    fields.forEach((f) => {
      const ok = validateField(f, true);
      if (!ok && !firstBad) firstBad = f;
    });
    if (firstBad) {
      shake(firstBad);
      firstBad.input?.focus();
      return;
    }

    const plan = getPlan?.();
    form.hidden = true;
    planBox.hidden = true;
    done.hidden = false;
    doneText.textContent = plan?.valid
      ? `We'll text you within the hour to confirm your ${plan.vehicle.toLowerCase()} — ${plan.services.join(", ").toLowerCase()}${plan.pkg ? ` (${plan.pkg})` : ""}.`
      : "We'll text you within the hour to confirm your slot.";

    if (!reduced) {
      const ring = done.querySelector(".done-ring");
      const check = done.querySelector(".done-check");
      animate(ring, { strokeDashoffset: [200, 0], duration: 550, ease: "outQuad" });
      animate(check, { strokeDashoffset: [200, 0], duration: 380, delay: 380, ease: "outQuad" });
      animate(done, { opacity: [0, 1], scale: [0.94, 1], duration: 420, ease: "outQuad" });
    }

    console.info("[demo] booking request:", {
      name: form.elements.name.value,
      phone: form.elements.phone.value,
      date: form.elements.date.value,
      notes: form.elements.notes.value,
      plan,
    });
  });

  resetBtn?.addEventListener("click", () => {
    form.reset();
    fields.forEach((f) => {
      f.wrap?.classList.remove("is-invalid", "is-valid");
      if (f.msg) f.msg.textContent = "";
    });
    done.hidden = true;
    form.hidden = false;
    refreshPlan();
    form.elements.name?.focus();
  });
}
