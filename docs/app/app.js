import {
  CLOVER_COOLDOWN_MS,
  CLOVER_SPAWN_CHANCE,
  CLOVER_VISIBLE_MS,
  FIVE_LEAF_SPAWN_CHANCE,
  MAX_VISUAL_RABBITS,
  VISUAL_RABBIT_PADDING,
  VISUAL_RABBIT_TOP_GAP,
  farmTiers,
  messageRules,
  soundPresets
} from "./config.js";
import { els } from "./dom.js";
import {
  calcCarrotCost,
  calcFriendCost,
  calcHandCost,
  currentFarmTier,
  currentUpc,
  currentUps,
  pickFriendRabbitClass,
  selectedSoundIndex
} from "./logic.js";
import { render } from "./render.js";
import { addRabbits, createDefaultState, saveState, setState, state } from "./state.js";
import { clamp, formatNumber } from "./utils.js";
import { playPyon } from "./audio.js";

let visualRabbits = [];
let messageTimer;
let cloverTimer;
let lastTick = performance.now();
let lastAutoSave = performance.now();
let lastUiUpdate = performance.now();

function petRabbit(event) {
  let gain = currentUpc();
  const beforeRabbits = state.rabbits;
  addRabbits(gain);
  if (state.activeBoost?.type === "double" && state.activeBoost.expiresAt > Date.now()) {
    addRabbits(state.rabbits);
    gain = state.rabbits - beforeRabbits;
  }
  state.stats.totalClicks += 1;
  addVisualRabbit();
  maybeSpawnClover();
  spawnFloat(gain, event);
  playPyon();
  checkMessages();
  saveState();
  render();
}

function addVisualRabbit() {
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

function spawnFloat(amount, event) {
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

function upgradeCarrot() {
  const cost = calcCarrotCost();
  if (!state.unlocks.carrot || state.rabbits < cost) return;
  state.rabbits -= cost;
  state.upgrades.carrotLevel += 1;
  playPyon(1.08);
  checkMessages();
  saveState();
  render();
}

function upgradeHand() {
  const cost = calcHandCost();
  if (!state.unlocks.hand || state.rabbits < cost) return;
  state.rabbits -= cost;
  state.upgrades.handLevel += 1;
  playPyon(1.16);
  checkMessages();
  saveState();
  render();
}

function handleFarmTierClick(event) {
  const button = event.target.closest(".farm-tier-button");
  if (!button) return;
  const index = Number(button.dataset.farmIndex);
  const tier = farmTiers[index];
  if (!tier) return;

  if (index <= state.upgrades.farmLevel) {
    state.settings.selectedBackground = tier.className;
    saveState();
    render();
    return;
  }

  if (!state.unlocks.farm || index !== state.upgrades.farmLevel + 1 || state.rabbits < tier.cost) return;
  state.rabbits -= tier.cost;
  state.upgrades.farmLevel = index;
  state.settings.selectedBackground = tier.className;
  state.unlockedBackgrounds = [...new Set([...state.unlockedBackgrounds, tier.className])];
  playPyon(1.12);
  checkMessages();
  saveState();
  render();
}

function upgradeFriend() {
  const cost = calcFriendCost();
  if (!state.unlocks.friend || state.rabbits < cost) return;
  state.rabbits -= cost;
  state.upgrades.friendLevel += 1;
  playPyon(1.2);
  checkMessages();
  saveState();
  render();
}

function checkMessages() {
  for (const rule of messageRules) {
    if (state.seenMessages.includes(rule.id) || !rule.test(state)) continue;
    state.seenMessages.push(rule.id);
    showMessage(rule.text);
    break;
  }
}

function maybeSpawnClover() {
  if (state.rabbits < 80) return;
  state.unlocks.clover = true;
  if (state.activeBoost && state.activeBoost.expiresAt > Date.now()) return;
  if (Date.now() < state.cloverCooldownUntil) return;
  if (els.cloverButton.classList.contains("clover-visible")) return;
  if (Math.random() > CLOVER_SPAWN_CHANCE) return;
  showClover(Math.random() < FIVE_LEAF_SPAWN_CHANCE / CLOVER_SPAWN_CHANCE ? "five" : "four");
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

function collectClover(event) {
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

function showMessage(text) {
  clearTimeout(messageTimer);
  els.farmMessage.textContent = text;
  els.farmMessage.classList.add("farm-message-visible");
  messageTimer = setTimeout(() => {
    els.farmMessage.classList.remove("farm-message-visible");
  }, 3200);
}

function resetGame() {
  if (!confirm("うさぎの数と強化をリセットしますか？")) return;
  const defaultSettings = createDefaultState().settings;
  setState({
    ...createDefaultState(),
    settings: { ...defaultSettings, ...state.settings }
  });
  saveState();
  render();
}

function tick(now) {
  const elapsed = (now - lastTick) / 1000;
  lastTick = now;
  const ups = currentUps();

  if (elapsed > 0 && ups > 0) {
    addRabbits(ups * elapsed);
  }

  if (now - lastUiUpdate > 250) {
    render();
    lastUiUpdate = now;
  }
  if (now - lastAutoSave > 1000) {
    checkMessages();
    saveState();
    lastAutoSave = now;
  }

  requestAnimationFrame(tick);
}

els.farm.addEventListener("click", petRabbit);
els.farm.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  petRabbit();
});
els.carrotUpgrade.addEventListener("click", upgradeCarrot);
els.handUpgrade.addEventListener("click", upgradeHand);
els.farmTierButtons.addEventListener("click", handleFarmTierClick);
els.friendUpgrade.addEventListener("click", upgradeFriend);
els.cloverButton.addEventListener("click", collectClover);
els.farmNameButton.addEventListener("click", () => {
  const nextName = prompt("ふぁーむ名を入力してください", state.settings.farmName);
  if (nextName === null) return;
  const trimmed = nextName.trim();
  if (!trimmed) return;
  state.settings.farmName = trimmed.slice(0, 24);
  saveState();
  render();
});
els.soundToggle.addEventListener("click", () => {
  state.settings.soundEnabled = !state.settings.soundEnabled;
  saveState();
  render();
});
els.soundVariant.addEventListener("click", () => {
  const nextIndex = (selectedSoundIndex() + 1) % soundPresets.length;
  state.settings.selectedSound = soundPresets[nextIndex].id;
  saveState();
  render();
  playPyon();
});
els.resetGame.addEventListener("click", resetGame);
window.addEventListener("beforeunload", saveState);

saveState();
render();
requestAnimationFrame(tick);
