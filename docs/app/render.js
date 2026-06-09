import { farmTiers, friendSymbolSlots, soundPresets } from "./config.js";
import { els } from "./dom.js";
import {
  activeBoostType,
  calcCarrotCost,
  calcFriendCost,
  calcHandCost,
  currentCarrotRank,
  currentFarmTier,
  currentFriendRank,
  currentHandRank,
  currentUps,
  displayedFarmTier,
  selectedSoundIndex,
  updateUnlocks
} from "./logic.js";
import { state } from "./state.js";
import { clamp, formatRabbitCount, formatRabbits, formatRate } from "./utils.js";

let farmButtonsKey = "";

export function render() {
  updateUnlocks();
  const carrotRank = currentCarrotRank();
  const handRank = currentHandRank();
  const carrotCost = calcCarrotCost();
  const handCost = calcHandCost();
  const farmTier = currentFarmTier();
  const displayTier = displayedFarmTier();
  const friendCost = calcFriendCost();
  const boostType = activeBoostType();

  els.farmNameButton.textContent = state.settings.farmName;
  els.farmNameButton.style.setProperty("--farm-name-size", `${farmNameSize(state.settings.farmName)}rem`);
  document.title = state.settings.farmName;
  els.rabbitCount.textContent = formatRabbitCount(state.rabbits);
  els.perSecond.textContent = `毎秒 +${formatRate(currentUps())}`;
  els.rabbitCount.classList.toggle("boosted-stat", boostType === "double");
  els.perSecond.classList.toggle("boosted-stat", boostType === "ups");
  els.farmStats.classList.toggle("boosted-stat-box", Boolean(boostType));
  els.farm.className = `farm ${displayTier.className}`;
  els.carrotGem.className = `carrot carrot-card-gem ${carrotRank.className}`;

  els.carrotUpgradeTitle.textContent = `にんじんLv.${state.upgrades.carrotLevel}`;
  els.carrotUpgrade.disabled = !state.unlocks.carrot || state.rabbits < carrotCost;
  els.carrotUpgradeText.textContent = state.unlocks.carrot
    ? carrotRank.name
    : "まずは10回なでて解放";
  els.carrotCost.textContent = state.unlocks.carrot ? formatRabbits(carrotCost) : "LOCK";

  els.handUpgradeTitle.textContent = `なでる手Lv.${state.upgrades.handLevel}`;
  els.handUpgrade.disabled = !state.unlocks.hand || state.rabbits < handCost;
  els.handUpgradeText.textContent = state.unlocks.hand
    ? handRank.name
    : "30羽で解放";
  els.handCost.textContent = state.unlocks.hand ? formatRabbits(handCost) : "LOCK";

  els.farmUpgradeTitle.textContent = `ふぁーむLv.${state.upgrades.farmLevel}`;
  els.farmUpgradeText.textContent = state.unlocks.farm ? displayTier.name : "80羽で解放";
  renderFarmButtons();

  els.friendUpgradeTitle.textContent = `おともだちLv.${state.upgrades.friendLevel}`;
  els.friendUpgrade.disabled = !state.unlocks.friend || state.rabbits < friendCost;
  els.friendUpgradeText.textContent = state.unlocks.friend
    ? currentFriendRank().name
    : "150羽で解放";
  els.friendCost.textContent = state.unlocks.friend ? formatRabbits(friendCost) : "LOCK";
  renderFriendSymbols();
  renderBoostIndicator(Boolean(boostType));

  els.soundToggle.textContent = state.settings.soundEnabled ? "♪" : "×";
  els.soundToggle.setAttribute("aria-label", state.settings.soundEnabled ? "音をオフにする" : "音をオンにする");
  els.soundVariant.textContent = soundPresets[selectedSoundIndex()].label;
}

function farmNameSize(name) {
  const length = Math.max(1, Array.from(name).length);
  return clamp(12 / length, 0.52, 1.55);
}

function renderFarmButtons() {
  const affordability = farmTiers.map((tier, index) => index <= state.upgrades.farmLevel || state.rabbits >= tier.cost);
  const nextKey = JSON.stringify({
    level: state.upgrades.farmLevel,
    selected: displayedFarmTier().className,
    unlocked: state.unlocks.farm,
    affordability
  });
  if (nextKey === farmButtonsKey) return;
  farmButtonsKey = nextKey;
  els.farmTierButtons.innerHTML = "";
  farmTiers.forEach((tier, index) => {
    const button = document.createElement("button");
    const unlocked = index <= state.upgrades.farmLevel;
    const next = index === state.upgrades.farmLevel + 1;
    const selected = displayedFarmTier().className === tier.className;
    button.type = "button";
    button.className = `farm-tier-button${unlocked ? " farm-tier-unlocked" : ""}${next ? " farm-tier-next" : ""}${selected ? " farm-tier-selected" : ""}`;
    button.dataset.farmIndex = String(index);
    button.disabled = !unlocked && !(next && state.unlocks.farm && state.rabbits >= tier.cost);
    button.innerHTML = `<strong>${tier.name}</strong><small>${unlocked ? (selected ? "表示中" : "切替") : next ? formatRabbits(tier.cost) : "LOCK"}</small>`;
    els.farmTierButtons.appendChild(button);
  });
}

function renderBoostIndicator(hasBoost) {
  if (!hasBoost) {
    els.boostIndicator.classList.remove("boost-indicator-visible");
    els.boostIndicator.style.removeProperty("--boost-progress");
    return;
  }
  const remaining = Math.max(0, state.activeBoost.expiresAt - Date.now());
  const duration = state.activeBoost.duration || remaining || 1;
  const progress = clamp(remaining / duration, 0, 1);
  els.boostIndicator.textContent = state.activeBoost.type === "double" ? "✣" : "♣";
  els.boostIndicator.style.setProperty("--boost-progress", `${progress * 360}deg`);
  els.boostIndicator.classList.add("boost-indicator-visible");
}

function renderFriendSymbols() {
  els.friendSymbols.innerHTML = "";
  friendSymbolSlots.forEach((slot) => {
    const symbol = document.createElement("span");
    const unlocked = state.upgrades.friendLevel >= slot.min;
    symbol.className = `friend-symbol${slot.className ? ` ${slot.className}` : ""}${unlocked ? "" : " friend-symbol-locked"}`;
    els.friendSymbols.appendChild(symbol);
  });
}
