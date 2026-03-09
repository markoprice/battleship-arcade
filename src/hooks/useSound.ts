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
    // Mario coin sound — two-note ascending square wave (B5 → E6)
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Note 1: B5 (988 Hz) — short staccato
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(988, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.setValueAtTime(0.25, now + 0.06);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Note 2: E6 (1319 Hz) — slightly longer, sustains then fades
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1319, now + 0.07);
    gain2.gain.setValueAtTime(0.25, now + 0.07);
    gain2.gain.setValueAtTime(0.25, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.3);
  }, []);

  const playSplash = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // 1) Soft water entry — gentle filtered noise burst (0–60ms)
    //    Simulates small object breaking the water surface
    const entryLen = 0.06;
    const entryBufSize = Math.ceil(ctx.sampleRate * entryLen);
    const entryBuf = ctx.createBuffer(1, entryBufSize, ctx.sampleRate);
    const entryData = entryBuf.getChannelData(0);
    for (let i = 0; i < entryBufSize; i++) {
      entryData[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const entrySrc = ctx.createBufferSource();
    entrySrc.buffer = entryBuf;
    const entryBpf = ctx.createBiquadFilter();
    entryBpf.type = 'bandpass';
    entryBpf.frequency.setValueAtTime(2000, now);
    entryBpf.frequency.exponentialRampToValueAtTime(600, now + entryLen);
    entryBpf.Q.setValueAtTime(0.8, now);
    const entryGain = ctx.createGain();
    entryGain.gain.setValueAtTime(0.18, now);
    entryGain.gain.exponentialRampToValueAtTime(0.001, now + entryLen);
    entrySrc.connect(entryBpf);
    entryBpf.connect(entryGain);
    entryGain.connect(ctx.destination);
    entrySrc.start(now);
    entrySrc.stop(now + entryLen);

    // 2) Splash body — bandpass-filtered noise with gentle upward sweep (20–220ms)
    //    Simulates water droplets scattering upward
    const splashStart = 0.02;
    const splashLen = 0.2;
    const splashBufSize = Math.ceil(ctx.sampleRate * splashLen);
    const splashBuf = ctx.createBuffer(1, splashBufSize, ctx.sampleRate);
    const splashData = splashBuf.getChannelData(0);
    for (let i = 0; i < splashBufSize; i++) {
      splashData[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const splashSrc = ctx.createBufferSource();
    splashSrc.buffer = splashBuf;
    const splashBpf = ctx.createBiquadFilter();
    splashBpf.type = 'bandpass';
    splashBpf.frequency.setValueAtTime(800, now + splashStart);
    splashBpf.frequency.linearRampToValueAtTime(2500, now + splashStart + 0.06);
    splashBpf.frequency.exponentialRampToValueAtTime(400, now + splashStart + splashLen);
    splashBpf.Q.setValueAtTime(0.5, now + splashStart);
    const splashGain = ctx.createGain();
    splashGain.gain.setValueAtTime(0.001, now + splashStart);
    splashGain.gain.linearRampToValueAtTime(0.14, now + splashStart + 0.03);
    splashGain.gain.exponentialRampToValueAtTime(0.001, now + splashStart + splashLen);
    splashSrc.connect(splashBpf);
    splashBpf.connect(splashGain);
    splashGain.connect(ctx.destination);
    splashSrc.start(now + splashStart);
    splashSrc.stop(now + splashStart + splashLen);

    // 3) Ripple fade — soft low-pass filtered noise decay (100–450ms)
    //    Smooth watery tail like ripples settling
    const rippleStart = 0.1;
    const rippleLen = 0.35;
    const rippleBufSize = Math.ceil(ctx.sampleRate * rippleLen);
    const rippleBuf = ctx.createBuffer(1, rippleBufSize, ctx.sampleRate);
    const rippleData = rippleBuf.getChannelData(0);
    for (let i = 0; i < rippleBufSize; i++) {
      rippleData[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const rippleSrc = ctx.createBufferSource();
    rippleSrc.buffer = rippleBuf;
    const rippleLpf = ctx.createBiquadFilter();
    rippleLpf.type = 'lowpass';
    rippleLpf.frequency.setValueAtTime(1800, now + rippleStart);
    rippleLpf.frequency.exponentialRampToValueAtTime(200, now + rippleStart + rippleLen);
    rippleLpf.Q.setValueAtTime(0.3, now + rippleStart);
    const rippleGain = ctx.createGain();
    rippleGain.gain.setValueAtTime(0.001, now + rippleStart);
    rippleGain.gain.linearRampToValueAtTime(0.08, now + rippleStart + 0.04);
    rippleGain.gain.exponentialRampToValueAtTime(0.001, now + rippleStart + rippleLen);
    rippleSrc.connect(rippleLpf);
    rippleLpf.connect(rippleGain);
    rippleGain.connect(ctx.destination);
    rippleSrc.start(now + rippleStart);
    rippleSrc.stop(now + rippleStart + rippleLen);

    // 4) Subtle airy high-freq shimmer — tiny droplet sparkle (50–250ms)
    const shimmerStart = 0.05;
    const shimmerLen = 0.2;
    const shimmerBufSize = Math.ceil(ctx.sampleRate * shimmerLen);
    const shimmerBuf = ctx.createBuffer(1, shimmerBufSize, ctx.sampleRate);
    const shimmerData = shimmerBuf.getChannelData(0);
    for (let i = 0; i < shimmerBufSize; i++) {
      shimmerData[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const shimmerSrc = ctx.createBufferSource();
    shimmerSrc.buffer = shimmerBuf;
    const shimmerHpf = ctx.createBiquadFilter();
    shimmerHpf.type = 'highpass';
    shimmerHpf.frequency.setValueAtTime(3000, now + shimmerStart);
    shimmerHpf.frequency.exponentialRampToValueAtTime(5000, now + shimmerStart + shimmerLen);
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.001, now + shimmerStart);
    shimmerGain.gain.linearRampToValueAtTime(0.04, now + shimmerStart + 0.03);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + shimmerStart + shimmerLen);
    shimmerSrc.connect(shimmerHpf);
    shimmerHpf.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerSrc.start(now + shimmerStart);
    shimmerSrc.stop(now + shimmerStart + shimmerLen);
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
  };
}
