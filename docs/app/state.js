import { BACKUP_KEY, SAVE_VERSION, STORAGE_KEY, defaultState, farmTiers, soundPresets } from "./config.js";
import { clamp } from "./utils.js";

export let state = loadState();

export function setState(nextState) {
  state = nextState;
}

export function createDefaultState() {
  return structuredClone(defaultState);
}

export function saveState() {
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addRabbits(amount) {
  state.rabbits += amount;
  state.stats.totalRabbitsEarned += amount;
  state.stats.maxRabbitsHeld = Math.max(state.stats.maxRabbitsHeld, state.rabbits);
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
      farmLevel: clamp(Math.floor(Number(saved.upgrades?.farmLevel) || 0), 0, farmTiers.length - 1),
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
    activeBoost: normalizeBoost(saved.activeBoost),
    cloverCooldownUntil: Number(saved.cloverCooldownUntil) || 0,
    updatedAt: Number(saved.updatedAt) || Date.now()
  };
}

function normalizeBoost(boost) {
  if (!boost || typeof boost !== "object") return null;
  if (!["ups", "upc", "double"].includes(boost.type)) return null;
  if (!Number.isFinite(boost.multiplier) || !Number.isFinite(boost.expiresAt)) return null;
  return boost.expiresAt > Date.now() ? boost : null;
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
