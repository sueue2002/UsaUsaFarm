const STORAGE_KEY = "usa-usa-farm-state-v1";
const BACKUP_KEY = `${STORAGE_KEY}-backup`;
const SAVE_VERSION = 2;
const MAX_VISUAL_RABBITS = 120;
const VISUAL_RABBIT_PADDING = 26;
const VISUAL_RABBIT_TOP_GAP = 18;

const carrotRanks = [
  { min: 95, name: "ダイヤのにんじん", className: "carrot-diamond" },
  { min: 70, name: "サファイアのにんじん", className: "carrot-sapphire" },
  { min: 50, name: "エメラルドのにんじん", className: "carrot-emerald" },
  { min: 35, name: "トパーズのにんじん", className: "carrot-topaz" },
  { min: 20, name: "ガーネットのにんじん", className: "carrot-garnet" },
  { min: 10, name: "ルビーのにんじん", className: "carrot-ruby" },
  { min: 1, name: "ふつうのにんじん", className: "carrot-normal" },
  { min: 0, name: "にんじん未解放", className: "carrot-normal carrot-locked" }
];

const handRanks = [
  { min: 55, name: "月あかりのなで手" },
  { min: 35, name: "夢ごこちクッション" },
  { min: 22, name: "うさぎブラシ" },
  { min: 12, name: "ぽかぽかミトン" },
  { min: 5, name: "ふわふわ手袋" },
  { min: 0, name: "そっとなでる" }
];

const soundPresets = [
  { id: "A", label: "音色 A", start: 520, mid: 610, end: 760, duration: 0.18, volume: 0.18 },
  { id: "B", label: "音色 B", start: 470, mid: 650, end: 920, duration: 0.16, volume: 0.15 },
  { id: "C", label: "音色 C", start: 620, mid: 560, end: 880, duration: 0.22, volume: 0.13 }
];

const messageRules = [
  { id: "clicks-10", test: (s) => s.stats.totalClicks >= 10, text: "うさぎがあつまってきた！" },
  { id: "rabbits-50", test: (s) => s.rabbits >= 50, text: "ちいさなふぁーむがにぎやかになってきた" },
  { id: "rabbits-100", test: (s) => s.rabbits >= 100, text: "お庭がもふもふしてきた" },
  { id: "rabbits-1k", test: (s) => s.rabbits >= 1000, text: "うさぎでいっぱい！" },
  { id: "rabbits-10k", test: (s) => s.rabbits >= 10000, text: "ふぁーむがふわふわに包まれている" },
  { id: "carrot-10", test: (s) => s.upgrades.carrotLevel >= 10, text: "ルビーのにんじんを見つけた！" },
  { id: "hand-10", test: (s) => s.upgrades.handLevel >= 10, text: "なでるのが上手になってきた" }
];

const defaultState = {
  version: SAVE_VERSION,
  rabbits: 0,
  upgrades: {
    carrotLevel: 0,
    handLevel: 0,
    farmLevel: 0,
    friendLevel: 0
  },
  unlocks: {
    carrot: false,
    hand: false,
    farm: false,
    friend: false,
    clover: false,
    achievements: false
  },
  settings: {
    soundEnabled: true,
    selectedSound: "C",
    selectedBackground: null,
    farmName: "うさうさふぁーむ"
  },
  stats: {
    totalClicks: 0,
    totalRabbitsEarned: 0,
    totalCloverTapped: 0,
    maxRabbitsHeld: 0
  },
  seenMessages: [],
  unlockedBackgrounds: [],
  updatedAt: 0
};

let state = loadState();
let audioContext;
let soundBuffers = [];
let visualRabbits = [];
let messageTimer;
let lastTick = performance.now();
let lastAutoSave = performance.now();
let lastUiUpdate = performance.now();

const els = {
  farmNameButton: document.getElementById("farmNameButton"),
  rabbitCount: document.getElementById("rabbitCount"),
  perSecond: document.getElementById("perSecond"),
  carrotGem: document.getElementById("carrotGem"),
  carrotUpgrade: document.getElementById("carrotUpgrade"),
  carrotUpgradeText: document.getElementById("carrotUpgradeText"),
  carrotCost: document.getElementById("carrotCost"),
  handUpgrade: document.getElementById("handUpgrade"),
  handUpgradeText: document.getElementById("handUpgradeText"),
  handCost: document.getElementById("handCost"),
  farm: document.getElementById("farm"),
  farmStats: document.getElementById("farmStats"),
  farmMessage: document.getElementById("farmMessage"),
  visualRabbitLayer: document.getElementById("visualRabbitLayer"),
  floatLayer: document.getElementById("floatLayer"),
  soundToggle: document.getElementById("soundToggle"),
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
  if (saved.version === 2) return normalizeV2State(saved);
  return normalizeV2State(migrateLegacyState(saved));
}

function normalizeV2State(saved) {
  const selectedSound = soundPresets.some((preset) => preset.id === saved.settings?.selectedSound)
    ? saved.settings.selectedSound
    : defaultState.settings.selectedSound;

  return {
    version: SAVE_VERSION,
    rabbits: Math.max(0, Number(saved.rabbits) || 0),
    upgrades: {
      carrotLevel: Math.max(0, Math.floor(Number(saved.upgrades?.carrotLevel) || 0)),
      handLevel: Math.max(0, Math.floor(Number(saved.upgrades?.handLevel) || 0)),
      farmLevel: clamp(Math.floor(Number(saved.upgrades?.farmLevel) || 0), 0, 6),
      friendLevel: Math.max(0, Math.floor(Number(saved.upgrades?.friendLevel) || 0))
    },
    unlocks: {
      carrot: Boolean(saved.unlocks?.carrot),
      hand: Boolean(saved.unlocks?.hand),
      farm: Boolean(saved.unlocks?.farm),
      friend: Boolean(saved.unlocks?.friend),
      clover: Boolean(saved.unlocks?.clover),
      achievements: Boolean(saved.unlocks?.achievements)
    },
    settings: {
      soundEnabled: saved.settings?.soundEnabled !== false,
      selectedSound,
      selectedBackground: saved.settings?.selectedBackground ?? null,
      farmName: String(saved.settings?.farmName || defaultState.settings.farmName).slice(0, 24)
    },
    stats: {
      totalClicks: Math.max(0, Number(saved.stats?.totalClicks) || 0),
      totalRabbitsEarned: Math.max(0, Number(saved.stats?.totalRabbitsEarned) || 0),
      totalCloverTapped: Math.max(0, Number(saved.stats?.totalCloverTapped) || 0),
      maxRabbitsHeld: Math.max(0, Number(saved.stats?.maxRabbitsHeld) || 0)
    },
    seenMessages: Array.isArray(saved.seenMessages) ? saved.seenMessages : [],
    unlockedBackgrounds: Array.isArray(saved.unlockedBackgrounds) ? saved.unlockedBackgrounds : [],
    updatedAt: Number(saved.updatedAt) || Date.now()
  };
}

function migrateLegacyState(saved) {
  const soundIndex = Number.isFinite(saved.soundVariant) ? saved.soundVariant : 2;
  const legacyCarrotLevel = Number.isFinite(saved.carrotTier)
    ? Math.max(0, saved.carrotTier + 1)
    : Math.max(0, Number(saved.carrotLevel) || 0);
  const legacyHandLevel = Number.isFinite(saved.handTier)
    ? Math.max(0, saved.handTier)
    : Math.max(0, Number(saved.handLevel) || 0);

  return {
    ...createDefaultState(),
    rabbits: saved.rabbits,
    upgrades: {
      carrotLevel: legacyCarrotLevel,
      handLevel: legacyHandLevel,
      farmLevel: 0,
      friendLevel: 0
    },
    unlocks: {
      ...defaultState.unlocks,
      carrot: legacyCarrotLevel > 0 || saved.unlocked?.carrot === true,
      hand: legacyHandLevel > 0 || saved.unlocked?.hand === true
    },
    settings: {
      soundEnabled: saved.soundEnabled ?? saved.sound ?? true,
      selectedSound: saved.selectedSound ?? soundPresets[clamp(soundIndex, 0, soundPresets.length - 1)].id,
      selectedBackground: null,
      farmName: defaultState.settings.farmName
    },
    stats: {
      ...defaultState.stats,
      totalClicks: Number(saved.stats?.totalClicks) || 0,
      totalRabbitsEarned: Math.max(0, Number(saved.stats?.totalRabbitsEarned ?? saved.rabbits) || 0),
      maxRabbitsHeld: Math.max(0, Number(saved.rabbits) || 0)
    },
    updatedAt: Date.now()
  };
}

function saveState() {
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function calcCarrotCost(level = state.upgrades.carrotLevel) {
  return Math.floor(10 * Math.pow(1.17, level));
}

function calcCarrotUPS(level = state.upgrades.carrotLevel) {
  let total = 0;
  for (let i = 0; i < level; i += 1) {
    total += 0.2 * Math.pow(1.1, i);
  }
  return total;
}

function calcHandCost(level = state.upgrades.handLevel) {
  return Math.floor(15 * Math.pow(1.2, level));
}

function calcHandUPC(level = state.upgrades.handLevel) {
  return Math.floor(1 + 0.75 * Math.pow(level, 1.35));
}

function calcFarmMultiplier() {
  return 1;
}

function calcFriendRate() {
  return state.upgrades.friendLevel * 0.05;
}

function currentCarrotRank() {
  return carrotRanks.find((rank) => state.upgrades.carrotLevel >= rank.min);
}

function currentHandRank() {
  return handRanks.find((rank) => state.upgrades.handLevel >= rank.min);
}

function selectedSoundIndex() {
  return Math.max(0, soundPresets.findIndex((preset) => preset.id === state.settings.selectedSound));
}

function formatNumber(value, options = {}) {
  const abs = Math.abs(value);
  if (abs < 1000) {
    const digits = options.precise
      ? (abs < 100 ? 2 : 1)
      : 0;
    return value.toLocaleString("ja-JP", {
      minimumFractionDigits: options.precise && abs > 0 && abs < 10 ? 2 : 0,
      maximumFractionDigits: digits
    });
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

function formatRabbits(value, options = {}) {
  return `${formatNumber(value, options)}羽`;
}

function currentUpc() {
  return calcHandUPC();
}

function currentUps() {
  const carrotUPS = calcCarrotUPS() * calcFarmMultiplier();
  const friendUPS = currentUpc() * calcFriendRate();
  return carrotUPS + friendUPS;
}

function updateUnlocks() {
  if (state.stats.totalClicks >= 10) state.unlocks.carrot = true;
  if (state.rabbits >= 30 || state.upgrades.handLevel > 0) state.unlocks.hand = true;
  if (state.rabbits >= 80 || state.upgrades.farmLevel > 0) state.unlocks.farm = true;
  if (state.rabbits >= 150 || state.upgrades.friendLevel > 0) state.unlocks.friend = true;
  if (state.rabbits >= 1000) state.unlocks.achievements = true;
}

function render() {
  updateUnlocks();
  const carrotRank = currentCarrotRank();
  const handRank = currentHandRank();
  const carrotCost = calcCarrotCost();
  const handCost = calcHandCost();

  els.farmNameButton.textContent = state.settings.farmName;
  document.title = state.settings.farmName;
  els.rabbitCount.textContent = formatRabbits(state.rabbits, { precise: true });
  els.perSecond.textContent = `毎秒 +${formatRabbits(currentUps(), { precise: true })}`;
  els.carrotGem.className = `carrot carrot-card-gem ${carrotRank.className}`;

  els.carrotUpgrade.disabled = !state.unlocks.carrot || state.rabbits < carrotCost;
  els.carrotUpgradeText.textContent = state.unlocks.carrot
    ? `${carrotRank.name} Lv.${state.upgrades.carrotLevel + 1} / 毎秒 +${formatRabbits(calcCarrotUPS(), { precise: true })}`
    : "まずは10回なでて解放";
  els.carrotCost.textContent = state.unlocks.carrot ? formatRabbits(carrotCost) : "LOCK";

  els.handUpgrade.disabled = !state.unlocks.hand || state.rabbits < handCost;
  els.handUpgradeText.textContent = state.unlocks.hand
    ? `${handRank.name} Lv.${state.upgrades.handLevel + 1} / なでる +${formatRabbits(currentUpc())}`
    : "30羽で解放";
  els.handCost.textContent = state.unlocks.hand ? formatRabbits(handCost) : "LOCK";

  els.soundToggle.textContent = state.settings.soundEnabled ? "♪" : "×";
  els.soundToggle.setAttribute("aria-label", state.settings.soundEnabled ? "音をオフにする" : "音をオンにする");
  els.soundVariant.textContent = soundPresets[selectedSoundIndex()].label;
}

function addRabbits(amount) {
  state.rabbits += amount;
  state.stats.totalRabbitsEarned += amount;
  state.stats.maxRabbitsHeld = Math.max(state.stats.maxRabbitsHeld, state.rabbits);
}

function petRabbit(event) {
  const gain = currentUpc();
  addRabbits(gain);
  state.stats.totalClicks += 1;
  addVisualRabbit();
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

  rabbit.className = `visual-rabbit visual-rabbit-${direction}`;
  rabbit.style.left = `${VISUAL_RABBIT_PADDING + Math.random() * maxX}px`;
  rabbit.style.top = `${safeMinY + Math.random() * maxY}px`;
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

function checkMessages() {
  for (const rule of messageRules) {
    if (state.seenMessages.includes(rule.id) || !rule.test(state)) continue;
    state.seenMessages.push(rule.id);
    showMessage(rule.text);
    break;
  }
}

function showMessage(text) {
  clearTimeout(messageTimer);
  els.farmMessage.textContent = text;
  els.farmMessage.classList.add("farm-message-visible");
  messageTimer = setTimeout(() => {
    els.farmMessage.classList.remove("farm-message-visible");
  }, 3200);
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
  if (!state.settings.soundEnabled) return;
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
    settings: { ...createDefaultState().settings, ...state.settings }
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
