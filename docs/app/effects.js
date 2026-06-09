import { MAX_VISUAL_RABBITS, VISUAL_RABBIT_PADDING, VISUAL_RABBIT_TOP_GAP } from "./config.js";
import { els } from "./dom.js";
import { currentFarmTier, pickFriendRabbitClass } from "./logic.js";
import { state } from "./state.js";
import { clamp, formatNumber } from "./utils.js";

let visualRabbits = [];
let messageTimer;

export function addVisualRabbit() {
  const rect = els.farm.getBoundingClientRect();
  const statsRect = els.farmStats.getBoundingClientRect();
  const minY = Math.max(
    VISUAL_RABBIT_PADDING,
    statsRect.bottom - rect.top + VISUAL_RABBIT_TOP_GAP
  );
  const safeMinY = Math.min(minY, Math.max(VISUAL_RABBIT_PADDING, rect.height - VISUAL_RABBIT_PADDING));
  const maxX = Math.max(0, rect.width - VISUAL_RABBIT_PADDING * 2);
  const maxY = Math.max(0, rect.height - safeMinY - VISUAL_RABBIT_PADDING);
  const rabbit = document.createElement("span");
  const direction = Math.random() < 0.5 ? "left" : "right";
  const friendClass = pickFriendRabbitClass();

  rabbit.className = `visual-rabbit visual-rabbit-${direction}${friendClass ? ` ${friendClass}` : ""}`;
  rabbit.style.left = `${VISUAL_RABBIT_PADDING + Math.random() * maxX}px`;
  rabbit.style.top = `${safeMinY + Math.random() * maxY}px`;
  rabbit.style.setProperty("--rabbit-tilt", `${Math.random() * 18 - 9}deg`);

  els.visualRabbitLayer.appendChild(rabbit);
  visualRabbits.push(rabbit);

  const visualLimit = Math.min(MAX_VISUAL_RABBITS, currentFarmTier().visualLimit);
  while (visualRabbits.length > visualLimit) {
    visualRabbits.shift()?.remove();
  }
}

export function spawnFloat(amount, event) {
  const float = document.createElement("span");
  float.className = `floating-bunny${state.activeBoost?.type === "upc" && state.activeBoost.expiresAt > Date.now() ? " floating-bunny-boosted" : ""}`;
  float.textContent = `+${formatNumber(amount)}`;

  const rect = els.farm.getBoundingClientRect();
  const x = event?.clientX ? event.clientX - rect.left : rect.width / 2;
  const y = event?.clientY ? event.clientY - rect.top : rect.height / 2;
  float.style.left = `${clamp(x, 32, rect.width - 32)}px`;
  float.style.top = `${clamp(y, 56, rect.height - 32)}px`;

  els.floatLayer.appendChild(float);
  setTimeout(() => float.remove(), 900);
}

export function showMessage(text) {
  clearTimeout(messageTimer);
  els.farmMessage.textContent = text;
  els.farmMessage.classList.add("farm-message-visible");
  messageTimer = setTimeout(() => {
    els.farmMessage.classList.remove("farm-message-visible");
  }, 3200);
}
