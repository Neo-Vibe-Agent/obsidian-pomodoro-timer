interface SoundDef {
  notes: number[][];
  type?: OscillatorType;
}

const BUILT_IN_SOUNDS: Record<string, SoundDef> = {
  bell: {
    notes: [[523.25, 0.15], [659.25, 0.15], [783.99, 0.3]],
  },
  chime: {
    notes: [[880, 0.1], [1046.5, 0.1], [1318.5, 0.2], [1568, 0.3]],
  },
  ding: {
    notes: [[1000, 0.5]],
  },
  complete: {
    notes: [[523.25, 0.1], [659.25, 0.1], [783.99, 0.1], [1046.5, 0.3]],
  },
  // New sounds
  'soft-chime': {
    notes: [[440, 0.2], [554.37, 0.2], [659.25, 0.4]],
    type: 'sine',
  },
  'digital': {
    notes: [[800, 0.05], [1200, 0.05], [800, 0.05], [1200, 0.1]],
    type: 'square',
  },
  'zen-bowl': {
    notes: [[174.61, 0.8], [261.63, 0.6], [349.23, 0.5]],
    type: 'sine',
  },
  'raindrop': {
    notes: [[2000, 0.03], [1500, 0.04], [1800, 0.03], [1200, 0.05]],
    type: 'sine',
  },
  'level-up': {
    notes: [[261.63, 0.08], [329.63, 0.08], [392, 0.08], [523.25, 0.08], [659.25, 0.08], [783.99, 0.15]],
  },
  'warm-tone': {
    notes: [[220, 0.3], [277.18, 0.3], [329.63, 0.5]],
    type: 'triangle',
  },
  'alert': {
    notes: [[880, 0.1], [0, 0.05], [880, 0.1], [0, 0.05], [1175, 0.2]],
    type: 'square',
  },
  'success': {
    notes: [[392, 0.1], [523.25, 0.1], [659.25, 0.1], [783.99, 0.2], [1046.5, 0.3]],
  },
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playSound(soundName: string, volume: number): void {
  const sound = BUILT_IN_SOUNDS[soundName];
  if (!sound) return;

  try {
    const ctx = getAudioContext();
    let startTime = ctx.currentTime;
    const oscType = sound.type || 'sine';

    for (const [freq, duration] of sound.notes) {
      if (freq === 0) {
        // Silent gap
        startTime += duration;
        continue;
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = oscType;
      oscillator.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(volume * 0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);

      startTime += duration;
    }
  } catch (e) {
    console.warn('Pomodoro: Sound playback failed', e);
  }
}

export function getSoundNames(): string[] {
  return Object.keys(BUILT_IN_SOUNDS);
}
