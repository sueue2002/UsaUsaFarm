export const STORAGE_KEY = "usa-usa-farm-state-v1";
export const BACKUP_KEY = `${STORAGE_KEY}-backup`;
export const SAVE_VERSION = 2;
export const MAX_VISUAL_RABBITS = 300;
export const VISUAL_RABBIT_PADDING = 26;
export const VISUAL_RABBIT_TOP_GAP = 18;
export const CLOVER_VISIBLE_MS = 10000;
export const CLOVER_SPAWN_CHANCE = 0.006;
export const FIVE_LEAF_SPAWN_CHANCE = 0.0004;
export const CLOVER_COOLDOWN_MS = 60000;

export const carrotRanks = [
  { min: 95, name: "ダイヤのにんじん", className: "carrot-diamond" },
  { min: 70, name: "サファイアのにんじん", className: "carrot-sapphire" },
  { min: 50, name: "エメラルドのにんじん", className: "carrot-emerald" },
  { min: 35, name: "トパーズのにんじん", className: "carrot-topaz" },
  { min: 20, name: "ガーネットのにんじん", className: "carrot-garnet" },
  { min: 10, name: "ルビーのにんじん", className: "carrot-ruby" },
  { min: 1, name: "ふつうのにんじん", className: "carrot-normal" },
  { min: 0, name: "にんじん未解放", className: "carrot-normal carrot-locked" }
];

export const handRanks = [
  { min: 55, name: "月あかりのなで手" },
  { min: 35, name: "夢ごこちクッション" },
  { min: 22, name: "うさぎブラシ" },
  { min: 12, name: "ぽかぽかミトン" },
  { min: 5, name: "ふわふわ手袋" },
  { min: 0, name: "そっとなでる" }
];

export const friendRanks = [
  { min: 75, name: "きんいろうさぎがやってきた！" },
  { min: 50, name: "そらいろうさぎがやってきた！" },
  { min: 30, name: "ももいろうさぎがやってきた！" },
  { min: 15, name: "ちゃいろうさぎがやってきた！" },
  { min: 5, name: "はいいろうさぎがやってきた！" },
  { min: 0, name: "おともだちはまだいない" }
];

export const friendRabbitClasses = [
  { min: 5, chance: 0.05, className: "visual-rabbit-gray" },
  { min: 15, chance: 0.03, className: "visual-rabbit-brown" },
  { min: 30, chance: 0.02, className: "visual-rabbit-pink" },
  { min: 50, chance: 0.01, className: "visual-rabbit-sky" },
  { min: 75, chance: 0.001, className: "visual-rabbit-gold" }
];

export const friendSymbolSlots = [
  { min: 0, className: "" },
  { min: 5, className: "visual-rabbit-gray" },
  { min: 15, className: "visual-rabbit-brown" },
  { min: 30, className: "visual-rabbit-pink" },
  { min: 50, className: "visual-rabbit-sky" },
  { min: 75, className: "visual-rabbit-gold" }
];

export const soundPresets = [
  { id: "A", label: "ぴょんっ！", start: 520, mid: 610, end: 760, duration: 0.18, volume: 0.18 },
  { id: "B", label: "ぴょいっ！", start: 470, mid: 650, end: 920, duration: 0.16, volume: 0.15 },
  { id: "C", label: "ぴょこっ！", start: 620, mid: 560, end: 880, duration: 0.22, volume: 0.13 }
];

export const farmTiers = [
  { name: "うさぎ小屋", cost: 0, multiplier: 1, visualLimit: 30, className: "farm-stage-hutch" },
  { name: "ちいさなお庭", cost: 80, multiplier: 1.25, visualLimit: 50, className: "farm-stage-garden" },
  { name: "花いっぱいのお庭", cost: 450, multiplier: 1.6, visualLimit: 70, className: "farm-stage-flowers" },
  { name: "うさぎ公園", cost: 2400, multiplier: 2.05, visualLimit: 120, className: "farm-stage-park" },
  { name: "ひろい草原", cost: 15000, multiplier: 2.7, visualLimit: 170, className: "farm-stage-meadow" },
  { name: "うさぎの丘", cost: 90000, multiplier: 3.6, visualLimit: 230, className: "farm-stage-hill" },
  { name: "うさぎ王国", cost: 600000, multiplier: 4.8, visualLimit: 300, className: "farm-stage-kingdom" }
];

export const messageRules = [
  { id: "rabbits-10", test: (s) => s.rabbits >= 10, text: "うさぎがあつまってきた！" },
  { id: "rabbits-50", test: (s) => s.rabbits >= 50, text: "ちいさなふぁーむがにぎやかになってきた" },
  { id: "rabbits-100", test: (s) => s.rabbits >= 100, text: "お庭がもふもふしてきた" },
  { id: "rabbits-1k", test: (s) => s.rabbits >= 1000, text: "うさぎでいっぱい！" },
  { id: "rabbits-10k", test: (s) => s.rabbits >= 10000, text: "ふぁーむがふわふわに包まれている" },
  { id: "carrot-10", test: (s) => s.upgrades.carrotLevel >= 10, text: "ルビーのにんじんを見つけた！" },
  { id: "clicks-60", test: (s) => s.stats.totalClicks >= 60, text: "なでるのが上手になってきた" },
  { id: "friend-1", test: (s) => s.upgrades.friendLevel >= 1, text: "おともだちが手伝いにきた！" },
  { id: "farm-1", test: (s) => s.upgrades.farmLevel >= 1, text: "ちいさなお庭に広がった！" }
];

export const defaultState = {
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
  activeBoost: null,
  cloverCooldownUntil: 0,
  updatedAt: 0
};
