import { soundPresets } from "./config.js";
import { collectClover, maybeSpawnClover } from "./clover.js";
import { els } from "./dom.js";
import { addVisualRabbit, spawnFloat } from "./effects.js";
import { currentUpc, currentUps, selectedSoundIndex } from "./logic.js";
import { checkMessages } from "./messages.js";
import { render } from "./render.js";
import { addRabbits, createDefaultState, saveState, setState, state } from "./state.js";
import { upgradeCarrot, upgradeFriend, upgradeHand, handleFarmTierClick } from "./upgrades.js";
import { playPyon } from "./audio.js";

// TODO: これ以降のモジュール分割は、新機能追加で責務が増えたタイミングで行う。
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
