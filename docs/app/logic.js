import { CLOVER_COOLDOWN_MS, carrotRanks, farmTiers, friendRanks, friendRabbitClasses, handRanks, soundPresets } from "./config.js";
import { state } from "./state.js";

export function calcCarrotCost(level = state.upgrades.carrotLevel) {
  return Math.floor(10 * Math.pow(1.17, level) + 6 * level);
}

export function calcCarrotUPS(level = state.upgrades.carrotLevel) {
  let total = 0;
  for (let i = 0; i < level; i += 1) {
    total += 0.2 * Math.pow(1.1, i);
  }
  return total;
}

export function calcHandCost(level = state.upgrades.handLevel) {
  return Math.floor(15 * Math.pow(1.2, level) + 8 * level);
}

export function calcHandUPC(level = state.upgrades.handLevel) {
  return Math.floor(1 + 0.75 * Math.pow(level, 1.35));
}

export function calcFarmMultiplier() {
  return farmTiers[state.upgrades.farmLevel]?.multiplier ?? 1;
}

export function calcFriendRate() {
  return state.upgrades.friendLevel * 0.05;
}

export function calcFriendCost(level = state.upgrades.friendLevel) {
  return Math.floor(150 * Math.pow(1.25, level));
}

export function currentFarmTier() {
  return farmTiers[state.upgrades.farmLevel] ?? farmTiers[0];
}

export function displayedFarmTier() {
  return farmTiers.find((tier) => tier.className === state.settings.selectedBackground)
    ?? currentFarmTier();
}

export function currentCarrotRank() {
  return carrotRanks.find((rank) => state.upgrades.carrotLevel >= rank.min);
}

export function currentHandRank() {
  return handRanks.find((rank) => state.upgrades.handLevel >= rank.min);
}

export function currentFriendRank() {
  return friendRanks.find((rank) => state.upgrades.friendLevel >= rank.min);
}

export function selectedSoundIndex() {
  return Math.max(0, soundPresets.findIndex((preset) => preset.id === state.settings.selectedSound));
}

export function currentBoost(type) {
  if (!state.activeBoost || state.activeBoost.expiresAt <= Date.now()) {
    if (state.activeBoost) {
      state.cloverCooldownUntil = Math.max(state.cloverCooldownUntil, Date.now() + CLOVER_COOLDOWN_MS);
    }
    state.activeBoost = null;
    return 1;
  }
  return state.activeBoost.type === type ? state.activeBoost.multiplier : 1;
}

export function currentUpc() {
  return calcHandUPC() * currentBoost("upc");
}

export function currentUps() {
  const carrotUPS = calcCarrotUPS() * calcFarmMultiplier();
  const friendUPS = calcHandUPC() * calcFriendRate();
  return (carrotUPS + friendUPS) * currentBoost("ups");
}

export function activeBoostType() {
  if (!state.activeBoost || state.activeBoost.expiresAt <= Date.now()) {
    currentBoost("ups");
    return null;
  }
  return state.activeBoost.type;
}

export function updateUnlocks() {
  if (state.stats.totalClicks >= 10) state.unlocks.carrot = true;
  if (state.rabbits >= 30 || state.upgrades.handLevel > 0) state.unlocks.hand = true;
  if (state.rabbits >= 80 || state.upgrades.farmLevel > 0) state.unlocks.farm = true;
  if (state.rabbits >= 150 || state.upgrades.friendLevel > 0) state.unlocks.friend = true;
  if (state.rabbits >= 1000) state.unlocks.achievements = true;
}

export function pickFriendRabbitClass() {
  const roll = Math.random();
  let threshold = 0;
  for (const item of friendRabbitClasses) {
    if (state.upgrades.friendLevel < item.min) continue;
    threshold += item.chance;
    if (roll < threshold) return item.className;
  }
  return "";
}
