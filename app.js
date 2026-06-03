const STORAGE_KEY = "usa-usa-farm-state-v1";
const BACKUP_KEY = `${STORAGE_KEY}-backup`;
const SAVE_VERSION = 1;
const MAX_VISUAL_RABBITS = 120;
const VISUAL_RABBIT_PADDING = 26;

const carrotTiers = [
  { name: "ふつうのにんじん", className: "carrot-normal", gain: 0.2, cost: 10 },
  { name: "ルビーのにんじん", className: "carrot-ruby", gain: 0.8, cost: 120 },
  { name: "ガーネットのにんじん", className: "carrot-garnet", gain: 2.4, cost: 520 },
  { name: "トパーズのにんじん", className: "carrot-topaz", gain: 7, cost: 1800 },
  { name: "エメラルドのにんじん", className: "carrot-emerald", gain: 18, cost: 6200 },
  { name: "サファイアのにんじん", className: "carrot-sapphire", gain: 45, cost: 18000 },
  { name: "ダイヤのにんじん", className: "carrot-diamond", gain: 120, cost: 60000 }
];

const handTiers = [
  { name: "そっとなでる", gain: 1, cost: 15 },
  { name: "ふわふわなで", gain: 3, cost: 90 },
  { name: "ぽかぽかなで", gain: 8, cost: 420 },
  { name: "きらきらなで", gain: 22, cost: 1600 },
  { name: "夢ごこちなで", gain: 60, cost: 5200 },
  { name: "ダイヤなで", gain: 160, cost: 22000 }
];

const soundPresets = [
  { id: "A", label: "音色 A", start: 520, mid: 610, end: 760, duration: 0.18, volume: 0.18 },
  { id: "B", label: "音色 B", start: 470, mid: 650, end: 920, duration: 0.16, volume: 0.15 },
  { id: "C", label: "音色 C", start: 620, mid: 560, end: 880, duration: 0.22, volume: 0.13 }
];

const defaultState = {
  version: SAVE_VERSION,
  rabbits: 0,
  carrotTier: -1,
  handTier: 0,
  selectedSound: "C",
  soundEnabled: true,
  unlocked: {
    carrot: false,
    hand: true
  },
  stats: {
    totalClicks: 0,
    totalRabbitsEarned: 0
  },
  updatedAt: 0
};

let state = loadState();
let audioContext;
let soundBuffers = [];
let visualRabbits = [];
let lastTick = performance.now();
let lastAutoSave = performance.now();
let lastUiUpdate = performance.now();

const els = {
  rabbitCount: document.getElementById("rabbitCount"),
  perSecond: document.getElementById("perSecond"),
  carrotGem: document.getElementById("carrotGem"),
  carrotName: document.getElementById("carrotName"),
  carrotHint: document.getElementById("carrotHint"),
  carrotUpgrade: document.getElementById("carrotUpgrade"),
  carrotUpgradeText: document.getElementById("carrotUpgradeText"),
  carrotCost: document.getElementById("carrotCost"),
  handUpgrade: document.getElementById("handUpgrade"),
  handUpgradeText: document.getElementById("handUpgradeText"),
  handCost: document.getElementById("handCost"),
  farm: document.getElementById("farm"),
  visualRabbitLayer: document.getElementById("visualRabbitLayer"),
  floatLayer: document.getElementById("floatLayer"),
  soundToggle: document.getElementById("soundToggle"),
  sampleSound: document.getElementById("sampleSound"),
  soundVariant: document.getElementById("soundVariant"),
  resetGame: document.getElementById("resetGame")
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultState();

  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return createDefaultState();
    localStorage.setItem(BACKUP_KEY, raw);
    return normalizeState(saved);
  } catch {
    return createDefaultState();
  }
}

function createDefaultState() {
  return structuredClone(defaultState);
}

function normalizeState(saved) {
  const migrated = saved.version ? saved : migrateLegacyState(saved);
  const selectedSound = soundPresets.some((preset) => preset.id === migrated.selectedSound)
    ? migrated.selectedSound
    : defaultState.selectedSound;

  return {
    version: SAVE_VERSION,
    rabbits: Math.max(0, Number(migrated.rabbits) || 0),
    carrotTier: clamp(Number.isFinite(migrated.carrotTier) ? migrated.carrotTier : -1, -1, carrotTiers.length - 1),
    handTier: clamp(Number.isFinite(migrated.handTier) ? migrated.handTier : 0, 0, handTiers.length - 1),
    selectedSound,
    soundEnabled: migrated.soundEnabled !== false,
    unlocked: {
      carrot: Boolean(migrated.unlocked?.carrot),
      hand: migrated.unlocked?.hand !== false
    },
    stats: {
      totalClicks: Math.max(0, Number(migrated.stats?.totalClicks) || 0),
      totalRabbitsEarned: Math.max(0, Number(migrated.stats?.totalRabbitsEarned) || 0)
    },
    updatedAt: Number(migrated.updatedAt) || Date.now()
  };
}

function migrateLegacyState(saved) {
  const soundIndex = Number.isFinite(saved.soundVariant) ? saved.soundVariant : 2;
  return {
    version: SAVE_VERSION,
    rabbits: saved.rabbits,
    carrotTier: Number.isFinite(saved.carrotLevel) ? saved.carrotLevel : -1,
    handTier: Number.isFinite(saved.handLevel) ? saved.handLevel : 0,
    selectedSound: soundPresets[clamp(soundIndex, 0, soundPresets.length - 1)].id,
    soundEnabled: saved.sound !== false,
    unlocked: {
      carrot: Number.isFinite(saved.carrotLevel) && saved.carrotLevel >= 0,
      hand: true
    },
    stats: {
      totalClicks: 0,
      totalRabbitsEarned: Math.max(0, Number(saved.rabbits) || 0)
    },
    updatedAt: Date.now()
  };
}

function saveState() {
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentCarrot() {
  return state.carrotTier >= 0 ? carrotTiers[state.carrotTier] : null;
}

function currentHand() {
  return handTiers[state.handTier];
}

function selectedSoundIndex() {
  return Math.max(0, soundPresets.findIndex((preset) => preset.id === state.selectedSound));
}

function formatNumber(value) {
  const abs = Math.abs(value);
  if (abs < 1000) {
    return value.toLocaleString("ja-JP", { maximumFractionDigits: value < 10 ? 1 : 0 });
  }

  const units = ["k", "M", "G", "T", "P", "E"];
  let scaled = value;
  let unitIndex = -1;
  while (Math.abs(scaled) >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  return `${scaled.toLocaleString("ja-JP", {
    maximumFractionDigits: Math.abs(scaled) < 10 ? 1 : 0
  })}${units[unitIndex]}`;
}

function formatRabbits(value) {
  return `${formatNumber(value)}羽`;
}

function currentUps() {
  return currentCarrot()?.gain ?? 0;
}

function currentUpc() {
  return currentHand().gain;
}

function render() {
  const carrot = currentCarrot();
  const nextCarrot = carrotTiers[state.carrotTier + 1];
  const nextHand = handTiers[state.handTier + 1];

  els.rabbitCount.textContent = formatRabbits(state.rabbits);
  els.perSecond.textContent = `毎秒 +${formatRabbits(currentUps())}`;
  els.carrotName.textContent = carrot?.name ?? "にんじん未解放";
  els.carrotHint.textContent = carrot
    ? `毎秒 +${formatRabbits(carrot.gain)}`
    : "まずは10回ほどなでて解放";

  els.carrotGem.className = `carrot ${carrot?.className ?? "carrot-normal carrot-locked"}`;

  els.carrotUpgrade.disabled = !nextCarrot || state.rabbits < nextCarrot.cost;
  els.carrotUpgradeText.textContent = nextCarrot ? `${nextCarrot.name}を解放` : "最高ランクです";
  els.carrotCost.textContent = nextCarrot ? formatRabbits(nextCarrot.cost) : "MAX";

  els.handUpgrade.disabled = !nextHand || state.rabbits < nextHand.cost;
  els.handUpgradeText.textContent = nextHand ? `${nextHand.name}へ強化` : "最高ランクです";
  els.handCost.textContent = nextHand ? formatRabbits(nextHand.cost) : "MAX";

  els.soundToggle.textContent = state.soundEnabled ? "♪" : "×";
  els.soundToggle.setAttribute("aria-label", state.soundEnabled ? "音をオフにする" : "音をオンにする");
  els.soundVariant.textContent = soundPresets[selectedSoundIndex()].label;
}

function addRabbits(amount) {
  state.rabbits += amount;
  state.stats.totalRabbitsEarned += amount;
}

function petRabbit(event) {
  const gain = currentUpc();
  addRabbits(gain);
  state.stats.totalClicks += 1;
  addVisualRabbit();
  spawnFloat(gain, event);
  playPyon();
  saveState();
  render();
}

function addVisualRabbit() {
  const rect = els.farm.getBoundingClientRect();
  const maxX = Math.max(0, rect.width - VISUAL_RABBIT_PADDING * 2);
  const maxY = Math.max(0, rect.height - VISUAL_RABBIT_PADDING * 2);
  const rabbit = document.createElement("span");
  const scale = 0.82 + Math.random() * 0.36;

  rabbit.className = "visual-rabbit";
  rabbit.style.left = `${VISUAL_RABBIT_PADDING + Math.random() * maxX}px`;
  rabbit.style.top = `${VISUAL_RABBIT_PADDING + Math.random() * maxY}px`;
  rabbit.style.setProperty("--rabbit-scale", scale.toFixed(2));
  rabbit.style.setProperty("--rabbit-tilt", `${Math.random() * 18 - 9}deg`);

  els.visualRabbitLayer.appendChild(rabbit);
  visualRabbits.push(rabbit);

  while (visualRabbits.length > MAX_VISUAL_RABBITS) {
    visualRabbits.shift()?.remove();
  }
}

function spawnFloat(amount, event) {
  const float = document.createElement("span");
  float.className = "floating-bunny";
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
  const next = carrotTiers[state.carrotTier + 1];
  if (!next || state.rabbits < next.cost) return;
  state.rabbits -= next.cost;
  state.carrotTier += 1;
  state.unlocked.carrot = true;
  playPyon(1.08);
  saveState();
  render();
}

function upgradeHand() {
  const next = handTiers[state.handTier + 1];
  if (!next || state.rabbits < next.cost) return;
  state.rabbits -= next.cost;
  state.handTier += 1;
  playPyon(1.16);
  saveState();
  render();
}

function ensureAudio() {
  audioContext ||= new AudioContext();
  if (!soundBuffers.length) {
    soundBuffers = soundPresets.map(createPyonBuffer);
  }
}

function createPyonBuffer(preset) {
  const sampleRate = audioContext.sampleRate;
  const length = Math.ceil(sampleRate * preset.duration);
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let phase = 0;

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const progress = t / preset.duration;
    const eased = progress * progress;
    const frequency = progress < 0.42
      ? preset.start + (preset.mid - preset.start) * (progress / 0.42)
      : preset.mid + (preset.end - preset.mid) * ((progress - 0.42) / 0.58);
    const attack = Math.min(1, progress / 0.08);
    const release = Math.max(0, 1 - eased);
    const envelope = attack * release * preset.volume;
    phase += (2 * Math.PI * frequency) / sampleRate;
    data[i] = Math.sin(phase) * envelope;
  }

  return buffer;
}

function playPyon(rate = 1) {
  if (!state.soundEnabled) return;
  ensureAudio();

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = soundBuffers[selectedSoundIndex()];
  source.playbackRate.value = rate;
  gain.gain.value = 0.85;
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
}

function resetGame() {
  if (!confirm("うさぎの数と強化をリセットしますか？")) return;
  state = {
    ...createDefaultState(),
    soundEnabled: state.soundEnabled,
    selectedSound: state.selectedSound
  };
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
els.soundToggle.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  saveState();
  render();
});
els.sampleSound.addEventListener("click", () => playPyon());
els.soundVariant.addEventListener("click", () => {
  const nextIndex = (selectedSoundIndex() + 1) % soundPresets.length;
  state.selectedSound = soundPresets[nextIndex].id;
  saveState();
  render();
  playPyon();
});
els.resetGame.addEventListener("click", resetGame);
window.addEventListener("beforeunload", saveState);

saveState();
render();
requestAnimationFrame(tick);
