let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(
  frequency: number,
  duration: number,
  delay = 0,
  volume = 0.22,
  type: OscillatorType = 'sine',
): void {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ac.currentTime + delay);
  gain.gain.setValueAtTime(volume, ac.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
  osc.start(ac.currentTime + delay);
  osc.stop(ac.currentTime + delay + duration + 0.01);
}

/** Three ascending tones — correct match. */
export function playCorrect(): void {
  tone(523.25, 0.14);           // C5
  tone(659.25, 0.14, 0.10);    // E5
  tone(783.99, 0.22, 0.20);    // G5
}

/** Two descending tones — wrong match. */
export function playWrong(): void {
  tone(330.00, 0.10, 0,    0.18, 'square'); // E4
  tone(261.63, 0.18, 0.11, 0.18, 'square'); // C4
}

/** Short victory fanfare — win. */
export function playWin(): void {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => tone(f, 0.25, i * 0.13));
}
