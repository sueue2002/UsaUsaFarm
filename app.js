const STORAGE_KEY = "usa-usa-farm-state-v1";

const carrotTiers = [
  { name: "ふつうのにんじん", className: "carrot-normal", gain: 0.2, cost: 25 },
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

const defaultState = {
  rabbits: 0,
  carrotLevel: 0,
  handLevel: 0,
  sound: true,
  soundVariant: 0
};

let state = loadState();
let audioContext;
let soundBuffers = [];
let lastTick = performance.now();
let lastAutoSave = performance.now();
let lastUiUpdate = performance.now();

const soundPresets = [
  { label: "音色 A", start: 520, mid: 610, end: 760, duration: 0.18, volume: 0.18 },
  { label: "音色 B", start: 470, mid: 650, end: 920, duration: 0.16, volume: 0.15 },
  { label: "音色 C", start: 620, mid: 560, end: 880, duration: 0.22, volume: 0.13 }
];

const els = {
  rabbitCount: document.getElementById("rabbitCount"),
  perSecond: document.getElementById("perSecond"),
  perPet: document.getElementById("perPet"),
  carrotGem: document.getElementById("carrotGem"),
  carrotName: document.getElementById("carrotName"),
  carrotHint: document.getElementById("carrotHint"),
  carrotUpgrade: document.getElementById("carrotUpgrade"),
  carrotUpgradeText: document.getElementById("carrotUpgradeText"),
  carrotCost: document.getElementById("carrotCost"),
  handUpgrade: document.getElementById("handUpgrade"),
  handUpgradeText: document.getElementById("handUpgradeText"),
  handCost: document.getElementById("handCost"),
  petButton: document.getElementById("petButton"),
  floatLayer: document.getElementById("floatLayer"),
  soundToggle: document.getElementById("soundToggle"),
  sampleSound: document.getElementById("sampleSound"),
  soundVariant: document.getElementById("soundVariant"),
  resetGame: document.getElementById("resetGame")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentCarrot() {
  return carrotTiers[state.carrotLevel];
}

function currentHand() {
  return handTiers[state.handLevel];
}

function formatNumber(value) {
  if (value < 1000) {
    return value.toLocaleString("ja-JP", { maximumFractionDigits: value < 10 ? 1 : 0 });
  }
  if (value < 1000000) {
    return `${(value / 1000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}千`;
  }
  return `${(value / 1000000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}百万`;
}

function render() {
  const carrot = currentCarrot();
  const hand = currentHand();
  const nextCarrot = carrotTiers[state.carrotLevel + 1];
  const nextHand = handTiers[state.handLevel + 1];

  els.rabbitCount.textContent = formatNumber(state.rabbits);
  els.perSecond.textContent = `+${formatNumber(carrot.gain)}`;
  els.perPet.textContent = `+${formatNumber(hand.gain)}`;
  els.carrotName.textContent = carrot.name;
  els.carrotHint.textContent = `毎秒 +${formatNumber(carrot.gain)} / なでる +${formatNumber(hand.gain)}`;

  els.carrotGem.className = `carrot ${carrot.className}`;

  els.carrotUpgrade.disabled = !nextCarrot || state.rabbits < nextCarrot.cost;
  els.carrotUpgradeText.textContent = nextCarrot ? `${nextCarrot.name}を解放` : "最高ランクです";
  els.carrotCost.textContent = nextCarrot ? `${formatNumber(nextCarrot.cost)}羽` : "MAX";

  els.handUpgrade.disabled = !nextHand || state.rabbits < nextHand.cost;
  els.handUpgradeText.textContent = nextHand ? `${nextHand.name}へ強化` : "最高ランクです";
  els.handCost.textContent = nextHand ? `${formatNumber(nextHand.cost)}羽` : "MAX";

  els.soundToggle.textContent = state.sound ? "♪" : "×";
  els.soundToggle.setAttribute("aria-label", state.sound ? "音をオフにする" : "音をオンにする");
  els.soundVariant.textContent = soundPresets[state.soundVariant].label;
}

function addRabbits(amount) {
  state.rabbits += amount;
  saveState();
  render();
}

function petRabbit() {
  addRabbits(currentHand().gain);
  spawnBunny();
  playPyon();
}

function spawnBunny() {
  const bunny = document.createElement("span");
  bunny.className = "floating-bunny";
  bunny.textContent = "+うさ";
  bunny.style.left = `${26 + Math.random() * 48}%`;
  bunny.style.top = `${44 + Math.random() * 18}%`;
  els.floatLayer.appendChild(bunny);
  setTimeout(() => bunny.remove(), 900);
}

function upgradeCarrot() {
  const next = carrotTiers[state.carrotLevel + 1];
  if (!next || state.rabbits < next.cost) return;
  state.rabbits -= next.cost;
  state.carrotLevel += 1;
  playPyon(1.08);
  saveState();
  render();
}

function upgradeHand() {
  const next = handTiers[state.handLevel + 1];
  if (!next || state.rabbits < next.cost) return;
  state.rabbits -= next.cost;
  state.handLevel += 1;
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
  if (!state.sound) return;
  ensureAudio();

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = soundBuffers[state.soundVariant];
  source.playbackRate.value = rate;
  gain.gain.value = 0.85;
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
}

function resetGame() {
  if (!confirm("うさぎの数と強化をリセットしますか？")) return;
  state = { ...defaultState, sound: state.sound };
  saveState();
  render();
}

function tick(now) {
  const elapsed = (now - lastTick) / 1000;
  lastTick = now;
  if (elapsed > 0) {
    state.rabbits += currentCarrot().gain * elapsed;
    if (now - lastUiUpdate > 250) {
      render();
      lastUiUpdate = now;
    }
    if (now - lastAutoSave > 1000) {
      saveState();
      lastAutoSave = now;
    }
  }
  requestAnimationFrame(tick);
}

els.petButton.addEventListener("click", petRabbit);
els.carrotUpgrade.addEventListener("click", upgradeCarrot);
els.handUpgrade.addEventListener("click", upgradeHand);
els.soundToggle.addEventListener("click", () => {
  state.sound = !state.sound;
  saveState();
  render();
});
els.sampleSound.addEventListener("click", () => playPyon());
els.soundVariant.addEventListener("click", () => {
  state.soundVariant = (state.soundVariant + 1) % soundPresets.length;
  saveState();
  render();
  playPyon();
});
els.resetGame.addEventListener("click", resetGame);
window.addEventListener("beforeunload", saveState);

render();
requestAnimationFrame(tick);
