const BUILT_IN_SOUNDS: Record<string, number[][]> = {
  bell: [
    [523.25, 0.15],  // C5
    [659.25, 0.15],  // E5
    [783.99, 0.3],   // G5
  ],
  chime: [
    [880, 0.1],      // A5
    [1046.5, 0.1],   // C6
    [1318.5, 0.2],   // E6
    [1568, 0.3],     // G6
  ],
  ding: [
    [1000, 0.5],
  ],
  complete: [
    [523.25, 0.1],
    [659.25, 0.1],
    [783.99, 0.1],
    [1046.5, 0.3],
  ],
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playSound(soundName: string, volume: number): void {
  const notes = BUILT_IN_SOUNDS[soundName];
  if (!notes) return;

  try {
    const ctx = getAudioContext();
    let startTime = ctx.currentTime;

    for (const [freq, duration] of notes) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
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
