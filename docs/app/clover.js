import {
  CLOVER_COOLDOWN_MS,
  CLOVER_SPAWN_CHANCE,
  CLOVER_VISIBLE_MS,
  FIVE_LEAF_SPAWN_CHANCE,
  VISUAL_RABBIT_PADDING,
  VISUAL_RABBIT_TOP_GAP
} from "./config.js";
import { els } from "./dom.js";
import { showMessage } from "./effects.js";
import { render } from "./render.js";
import { saveState, state } from "./state.js";
import { playPyon } from "./audio.js";

let cloverTimer;

export function maybeSpawnClover() {
  if (state.rabbits < 80) return;
  state.unlocks.clover = true;
  if (state.activeBoost && state.activeBoost.expiresAt > Date.now()) return;
  if (Date.now() < state.cloverCooldownUntil) return;
  if (els.cloverButton.classList.contains("clover-visible")) return;
  if (Math.random() > CLOVER_SPAWN_CHANCE) return;
  showClover(Math.random() < FIVE_LEAF_SPAWN_CHANCE / CLOVER_SPAWN_CHANCE ? "five" : "four");
}

export function collectClover(event) {
  event.stopPropagation();
  if (!els.cloverButton.classList.contains("clover-visible")) return;
  hideClover();
  state.stats.totalCloverTapped += 1;
  const cloverType = els.cloverButton.dataset.cloverType;
  const boost = cloverType === "five"
    ? { type: "double", multiplier: 2, duration: 3000 + Math.random() * 2000, label: "いつつばのくろーばー！少しの間なでるたびにうさぎが倍になる！" }
    : Math.random() < 0.5
      ? { type: "ups", multiplier: 2, duration: 60000, label: "60秒のあいだうさぎがたくさんやってくる！" }
      : { type: "upc", multiplier: 5, duration: 30000, label: "30秒間なでるごとにもっとうさぎがやってくる！" };
  state.activeBoost = {
    type: boost.type,
    multiplier: boost.multiplier,
    duration: boost.duration,
    expiresAt: Date.now() + boost.duration
  };
  state.cloverCooldownUntil = state.activeBoost.expiresAt + CLOVER_COOLDOWN_MS;
  showMessage(boost.label);
  playPyon(1.32);
  saveState();
  render();
}

function showClover(type) {
  const rect = els.farm.getBoundingClientRect();
  const statsRect = els.farmStats.getBoundingClientRect();
  const minY = Math.max(VISUAL_RABBIT_PADDING, statsRect.bottom - rect.top + VISUAL_RABBIT_TOP_GAP);
  const safeMinY = Math.min(minY, Math.max(VISUAL_RABBIT_PADDING, rect.height - VISUAL_RABBIT_PADDING));
  const maxX = Math.max(0, rect.width - VISUAL_RABBIT_PADDING * 2);
  const maxY = Math.max(0, rect.height - safeMinY - VISUAL_RABBIT_PADDING);
  els.cloverButton.style.left = `${VISUAL_RABBIT_PADDING + Math.random() * maxX}px`;
  els.cloverButton.style.top = `${safeMinY + Math.random() * maxY}px`;
  els.cloverButton.dataset.cloverType = type;
  els.cloverButton.textContent = type === "five" ? "✣" : "♣";
  els.cloverButton.classList.add("clover-visible");
  clearTimeout(cloverTimer);
  cloverTimer = setTimeout(hideClover, CLOVER_VISIBLE_MS);
}

function hideClover() {
  els.cloverButton.classList.remove("clover-visible");
}
