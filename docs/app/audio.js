import { soundPresets } from "./config.js";
import { selectedSoundIndex } from "./logic.js";
import { state } from "./state.js";

let audioContext;
let soundBuffers = [];

export function playPyon(rate = 1) {
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
