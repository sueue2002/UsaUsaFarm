import { farmTiers } from "./config.js";
import { playPyon } from "./audio.js";
import { checkMessages } from "./messages.js";
import { calcCarrotCost, calcFriendCost, calcHandCost } from "./logic.js";
import { render } from "./render.js";
import { saveState, state } from "./state.js";

export function upgradeCarrot() {
  const cost = calcCarrotCost();
  if (!state.unlocks.carrot || state.rabbits < cost) return;
  state.rabbits -= cost;
  state.upgrades.carrotLevel += 1;
  playPyon(1.08);
  checkMessages();
  saveState();
  render();
}

export function upgradeHand() {
  const cost = calcHandCost();
  if (!state.unlocks.hand || state.rabbits < cost) return;
  state.rabbits -= cost;
  state.upgrades.handLevel += 1;
  playPyon(1.16);
  checkMessages();
  saveState();
  render();
}

export function handleFarmTierClick(event) {
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

export function upgradeFriend() {
  const cost = calcFriendCost();
  if (!state.unlocks.friend || state.rabbits < cost) return;
  state.rabbits -= cost;
  state.upgrades.friendLevel += 1;
  playPyon(1.2);
  checkMessages();
  saveState();
  render();
}
