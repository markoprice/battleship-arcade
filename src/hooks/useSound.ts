import { useCallback, useRef } from 'react';

const audioCtx = () => {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
};

let sharedCtx: AudioContext | null = null;
const getCtx = () => {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = audioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume();
  }
  return sharedCtx;
};

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.3) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function useSound() {
  const sonarIntervalRef = useRef<number | null>(null);

  const playSonar = useCallback(() => {
    playTone(1200, 0.15, 'sine', 0.2);
    setTimeout(() => playTone(800, 0.3, 'sine', 0.15), 200);
  }, []);

  const startSonarLoop = useCallback(() => {
    if (sonarIntervalRef.current !== null) {
      clearInterval(sonarIntervalRef.current);
    }
    playSonar();
    sonarIntervalRef.current = window.setInterval(playSonar, 3000);
  }, [playSonar]);

  const stopSonarLoop = useCallback(() => {
    if (sonarIntervalRef.current !== null) {
      clearInterval(sonarIntervalRef.current);
      sonarIntervalRef.current = null;
    }
  }, []);

  const playExplosion = useCallback(() => {
    // Mario coin sound — two-note ascending square wave (B5 → E6), elongated
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Note 1: B5 (988 Hz) — staccato lead-in
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(988, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.setValueAtTime(0.25, now + 0.10);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // Note 2: E6 (1319 Hz) — longer sustain, gentle fade
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1319, now + 0.11);
    gain2.gain.setValueAtTime(0.25, now + 0.11);
    gain2.gain.setValueAtTime(0.25, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.11);
    osc2.stop(now + 0.55);
  }, []);

  const playSplash = useCallback(() => {
    // Brief, hollow "empty" tone — a soft low thud that feels like nothing happened
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }, []);

  const playShipSunk = useCallback(() => {
    // Crowd cheer - series of noise bursts with rising tones
    playNoise(0.5, 0.3);
    playTone(500, 0.3, 'square', 0.2);
    setTimeout(() => {
      playTone(600, 0.3, 'square', 0.2);
      playNoise(0.4, 0.25);
    }, 150);
    setTimeout(() => {
      playTone(800, 0.4, 'square', 0.25);
      playNoise(0.5, 0.3);
    }, 300);
  }, []);

  const playWin = useCallback(() => {
    // Victory fanfare - ascending notes
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.4, 'square', 0.25), i * 200);
    });
    setTimeout(() => playNoise(0.6, 0.2), 800);
  }, []);

  const playLose = useCallback(() => {
    // Descending sad tones
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.5, 'sawtooth', 0.2), i * 250);
    });
  }, []);

  const playSelect = useCallback(() => {
    playTone(800, 0.1, 'square', 0.15);
  }, []);

  const playRouletteTick = useCallback((pitch = 0) => {
    // Quick 8-bit tick that rises in pitch as roulette slows
    playTone(400 + pitch * 30, 0.06, 'square', 0.12);
  }, []);

  const playClickSound = useCallback(() => {
    playTone(500, 0.08, 'square', 0.1);
  }, []);

  const playStart = useCallback(() => {
    playTone(600, 0.1, 'square', 0.2);
    setTimeout(() => playTone(900, 0.15, 'square', 0.2), 120);
  }, []);

  /** Incoming hit — punchy arcade explosion when opponent strikes your ship */
  const playIncomingHit = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Layer 1: Impact crack — sharp initial transient (square wave snap)
    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(800, now);
    crack.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    crackGain.gain.setValueAtTime(0.45, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    crack.connect(crackGain);
    crackGain.connect(ctx.destination);
    crack.start(now);
    crack.stop(now + 0.06);

    // Layer 1b: Noise burst for the crack transient
    const crackBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackData.length; i++) crackData[i] = Math.random() * 2 - 1;
    const crackSrc = ctx.createBufferSource();
    crackSrc.buffer = crackBuf;
    const crackNoiseGain = ctx.createGain();
    crackNoiseGain.gain.setValueAtTime(0.5, now);
    crackNoiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    crackSrc.connect(crackNoiseGain);
    crackNoiseGain.connect(ctx.destination);
    crackSrc.start(now);

    // Layer 2: Compact explosion burst — low-mid frequency boom
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(150, now + 0.02);
    boom.frequency.exponentialRampToValueAtTime(50, now + 0.2);
    boomGain.gain.setValueAtTime(0.4, now + 0.02);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now + 0.02);
    boom.stop(now + 0.25);

    // Layer 2b: Explosion noise body
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    // Low-pass filter for chunky body
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(1200, now + 0.03);
    lpf.frequency.exponentialRampToValueAtTime(300, now + 0.25);
    noiseGain.gain.setValueAtTime(0.35, now + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noiseSrc.connect(lpf);
    lpf.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(now + 0.03);

    // Layer 3: Short rumble tail — sub-bass decay
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(60, now + 0.1);
    rumble.frequency.exponentialRampToValueAtTime(30, now + 0.35);
    rumbleGain.gain.setValueAtTime(0.25, now + 0.1);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(now + 0.1);
    rumble.stop(now + 0.38);
  }, []);

  return {
    startSonarLoop,
    stopSonarLoop,
    playExplosion,
    playSplash,
    playShipSunk,
    playWin,
    playLose,
    playSelect,
    playClickSound,
    playRouletteTick,
    playStart,
    playIncomingHit,
  };
}
