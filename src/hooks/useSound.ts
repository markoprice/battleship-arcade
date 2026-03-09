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
    const ctx = getCtx();
    const now = ctx.currentTime;

    // --- Master compressor for that chunky compressed arcade feel ---
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(0, now);
    compressor.ratio.setValueAtTime(16, now);
    compressor.attack.setValueAtTime(0.001, now);
    compressor.release.setValueAtTime(0.05, now);
    compressor.connect(ctx.destination);

    // 1) Sharp percussive attack — metallic crack (0–30ms)
    const attackOsc = ctx.createOscillator();
    const attackGain = ctx.createGain();
    attackOsc.type = 'square';
    attackOsc.frequency.setValueAtTime(900, now);
    attackOsc.frequency.exponentialRampToValueAtTime(120, now + 0.03);
    attackGain.gain.setValueAtTime(0.7, now);
    attackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    attackOsc.connect(attackGain);
    attackGain.connect(compressor);
    attackOsc.start(now);
    attackOsc.stop(now + 0.04);

    // 2) Explosion body — filtered noise burst with bite (0–250ms)
    const bodyLen = 0.25;
    const bodyBufSize = Math.ceil(ctx.sampleRate * bodyLen);
    const bodyBuf = ctx.createBuffer(1, bodyBufSize, ctx.sampleRate);
    const bodyData = bodyBuf.getChannelData(0);
    for (let i = 0; i < bodyBufSize; i++) {
      // Slightly clipped noise for distortion
      bodyData[i] = Math.max(-0.8, Math.min(0.8, (Math.random() * 2 - 1) * 1.3));
    }
    const bodySrc = ctx.createBufferSource();
    bodySrc.buffer = bodyBuf;
    const bodyBpf = ctx.createBiquadFilter();
    bodyBpf.type = 'bandpass';
    bodyBpf.frequency.setValueAtTime(1200, now);
    bodyBpf.frequency.exponentialRampToValueAtTime(200, now + bodyLen);
    bodyBpf.Q.setValueAtTime(1.5, now);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.65, now);
    bodyGain.gain.setValueAtTime(0.65, now + 0.01);
    bodyGain.gain.exponentialRampToValueAtTime(0.05, now + bodyLen);
    bodySrc.connect(bodyBpf);
    bodyBpf.connect(bodyGain);
    bodyGain.connect(compressor);
    bodySrc.start(now);
    bodySrc.stop(now + bodyLen);

    // 3) Bass punch — deep thud that drops fast (0–200ms)
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(180, now);
    bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    bassGain.gain.setValueAtTime(0.6, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    bassOsc.connect(bassGain);
    bassGain.connect(compressor);
    bassOsc.start(now);
    bassOsc.stop(now + 0.2);

    // 4) Low rumble tail — fading growl (100–400ms)
    const rumbleLen = 0.3;
    const rumbleBufSize = Math.ceil(ctx.sampleRate * rumbleLen);
    const rumbleBuf = ctx.createBuffer(1, rumbleBufSize, ctx.sampleRate);
    const rumbleData = rumbleBuf.getChannelData(0);
    for (let i = 0; i < rumbleBufSize; i++) rumbleData[i] = Math.random() * 2 - 1;
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = rumbleBuf;
    const rumbleLpf = ctx.createBiquadFilter();
    rumbleLpf.type = 'lowpass';
    rumbleLpf.frequency.setValueAtTime(300, now + 0.1);
    rumbleLpf.frequency.exponentialRampToValueAtTime(60, now + 0.1 + rumbleLen);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.001, now);
    rumbleGain.gain.linearRampToValueAtTime(0.35, now + 0.1);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + rumbleLen);
    rumbleSrc.connect(rumbleLpf);
    rumbleLpf.connect(rumbleGain);
    rumbleGain.connect(compressor);
    rumbleSrc.start(now);
    rumbleSrc.stop(now + 0.1 + rumbleLen);

    // 5) Metallic debris clink — two short high-freq pings after the blast
    const clinkDelay = 0.18;
    for (let i = 0; i < 2; i++) {
      const t = now + clinkDelay + i * 0.07;
      const clinkOsc = ctx.createOscillator();
      const clinkGain = ctx.createGain();
      clinkOsc.type = 'square';
      clinkOsc.frequency.setValueAtTime(2800 + i * 600, t);
      clinkOsc.frequency.exponentialRampToValueAtTime(1200 + i * 400, t + 0.04);
      clinkGain.gain.setValueAtTime(0.12 - i * 0.03, t);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      clinkOsc.connect(clinkGain);
      clinkGain.connect(compressor);
      clinkOsc.start(t);
      clinkOsc.stop(t + 0.05);
    }
  }, []);

  const playSplash = useCallback(() => {
    playNoise(0.2, 0.15);
    playTone(400, 0.2, 'sine', 0.1);
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
