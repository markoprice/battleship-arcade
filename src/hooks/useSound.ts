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

    // === IMPACT TRANSIENT (0-30ms) — loud sharp crack ===
    // Distorted square wave snap at high volume
    const impact = ctx.createOscillator();
    const impactGain = ctx.createGain();
    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    distortion.curve = curve;
    impact.type = 'square';
    impact.frequency.setValueAtTime(1200, now);
    impact.frequency.exponentialRampToValueAtTime(100, now + 0.03);
    impactGain.gain.setValueAtTime(0.6, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    impact.connect(distortion);
    distortion.connect(impactGain);
    impactGain.connect(ctx.destination);
    impact.start(now);
    impact.stop(now + 0.04);

    // === EXPLOSION BODY (20-250ms) — heavy low boom ===
    // Two detuned sawtooth oscillators for thickness
    for (const detune of [-10, 10]) {
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = 'sawtooth';
      boom.frequency.setValueAtTime(100, now + 0.015);
      boom.frequency.exponentialRampToValueAtTime(35, now + 0.25);
      boom.detune.setValueAtTime(detune, now);
      boomGain.gain.setValueAtTime(0.5, now + 0.015);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      boom.connect(boomGain);
      boomGain.connect(ctx.destination);
      boom.start(now + 0.015);
      boom.stop(now + 0.3);
    }

    // === NOISE CRUNCH (0-200ms) — filtered white noise for texture ===
    const noiseDur = 0.2;
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * noiseDur, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(800, now);
    bandpass.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    bandpass.Q.setValueAtTime(1.5, now);
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);
    noiseSrc.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(now);

    // === SUB BASS THUD (30-350ms) — you feel this one ===
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, now + 0.03);
    sub.frequency.exponentialRampToValueAtTime(25, now + 0.35);
    subGain.gain.setValueAtTime(0.5, now + 0.03);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now + 0.03);
    sub.stop(now + 0.38);
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
