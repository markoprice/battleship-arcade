import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import homeBg from '../assets/01-home_bg.jpg';

// Chill ominous 8-bit ambient loop for the home screen
function useHomeAmbient() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    let melodyInterval: ReturnType<typeof setInterval> | null = null;
    let melodyTimeout: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const startAmbient = () => {
      if (startedRef.current || !mounted) return;
      startedRef.current = true;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;

      // Resume if suspended (autoplay policy)
      if (ctx.state === 'suspended') ctx.resume();

      // Master volume — keep it quiet and atmospheric
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2); // fade in
      master.connect(ctx.destination);

      // Deep bass drone
      const bass = ctx.createOscillator();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(55, ctx.currentTime); // low A
      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0.3, ctx.currentTime);
      bass.connect(bassGain);
      bassGain.connect(master);
      bass.start();
      nodesRef.current.push(bass);

      // Slow LFO on bass frequency for subtle movement
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(3, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(bass.frequency);
      lfo.start();
      nodesRef.current.push(lfo);

      // Pad layer — square wave chord (minor)
      const padNotes = [110, 131, 165]; // A2, C3 (minor third), E3
      padNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.connect(g);
        g.connect(master);
        osc.start();
        nodesRef.current.push(osc);
      });

      // Slow melodic arpeggio — single notes cycling every ~4s
      const melody = [220, 262, 196, 247]; // A3, C4, G3, B3
      let melodyIdx = 0;
      const melodyOsc = ctx.createOscillator();
      melodyOsc.type = 'square';
      melodyOsc.frequency.setValueAtTime(melody[0], ctx.currentTime);
      const melodyGainNode = ctx.createGain();
      melodyGainNode.gain.setValueAtTime(0, ctx.currentTime);
      melodyOsc.connect(melodyGainNode);
      melodyGainNode.connect(master);
      melodyOsc.start();
      nodesRef.current.push(melodyOsc);

      // Cycle melody notes with fade in/out
      melodyInterval = setInterval(() => {
        if (ctx.state === 'closed') return;
        melodyIdx = (melodyIdx + 1) % melody.length;
        const now = ctx.currentTime;
        melodyGainNode.gain.setValueAtTime(0, now);
        melodyGainNode.gain.linearRampToValueAtTime(0.08, now + 0.3);
        melodyGainNode.gain.linearRampToValueAtTime(0, now + 3.5);
        melodyOsc.frequency.setValueAtTime(melody[melodyIdx], now);
      }, 4000);

      // Trigger first note after a beat
      melodyTimeout = setTimeout(() => {
        if (ctx.state === 'closed') return;
        const now = ctx.currentTime;
        melodyGainNode.gain.setValueAtTime(0, now);
        melodyGainNode.gain.linearRampToValueAtTime(0.08, now + 0.3);
        melodyGainNode.gain.linearRampToValueAtTime(0, now + 3.5);
      }, 1500);
    };

    // Try starting immediately (works if user already interacted with page)
    startAmbient();

    // Also listen for any user interaction to unlock audio
    const unlock = () => {
      startAmbient();
      // Also resume if context was suspended
      if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('mousemove', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    return () => {
      mounted = false;
      document.removeEventListener('click', unlock);
      document.removeEventListener('mousemove', unlock);
      document.removeEventListener('keydown', unlock);
      if (melodyInterval) clearInterval(melodyInterval);
      if (melodyTimeout) clearTimeout(melodyTimeout);
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== 'closed') {
        try {
          nodesRef.current.forEach((n) => {
            try { (n as OscillatorNode).stop(); } catch { /* already stopped */ }
          });
        } catch { /* ignore */ }
        nodesRef.current = [];
        ctx.close();
      }
      startedRef.current = false;
    };
  }, []);
}

interface Props {
  onStart: () => void;
}

export default function HomeScreen({ onStart }: Props) {
  useHomeAmbient();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgBounds, setImgBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const updateBounds = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const nw = img.naturalWidth || 1;
    const nh = img.naturalHeight || 1;
    const scale = Math.min(cw / nw, ch / nh);
    const rw = nw * scale;
    const rh = nh * scale;
    setImgBounds({ left: (cw - rw) / 2, top: (ch - rh) / 2, width: rw, height: rh });
  }, []);

  useEffect(() => {
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [updateBounds]);

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ backgroundColor: '#0a0a1a' }}
    >
      {/* Background image: contain so full height is always visible */}
      <img
        ref={imgRef}
        src={homeBg}
        alt="Battleship"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
        style={{ pointerEvents: 'none' }}
        onLoad={updateBounds}
      />

      {/* Button positioned within the rendered image bounds */}
      {imgBounds && (
        <div
          className="absolute z-10 flex items-center justify-center"
          style={{
            left: `${imgBounds.left}px`,
            top: `${imgBounds.top + imgBounds.height * 0.78}px`,
            width: `${imgBounds.width}px`,
            height: `${imgBounds.height * 0.2}px`,
            pointerEvents: 'none',
          }}
        >
          <motion.button
            onClick={onStart}
            className="tracking-wider cursor-pointer transition-transform duration-200 hover:scale-[1.08] active:scale-95"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#FFD700',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: '3px solid #FFD700',
              padding: `${Math.max(8, imgBounds.height * 0.03)}px ${Math.max(16, imgBounds.width * 0.05)}px`,
              fontSize: `${Math.max(14, Math.min(32, imgBounds.width * 0.035))}px`,
              textShadow: '0 0 20px rgba(255, 215, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.3)',
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 15px rgba(255, 215, 0, 0.1)',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto',
            }}
            animate={{
              boxShadow: [
                '0 0 8px rgba(255, 215, 0, 0.15), inset 0 0 8px rgba(255, 215, 0, 0.03)',
                '0 0 25px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.1)',
                '0 0 8px rgba(255, 215, 0, 0.15), inset 0 0 8px rgba(255, 215, 0, 0.03)',
              ],
              borderColor: [
                'rgba(255, 215, 0, 0.4)',
                'rgba(255, 215, 0, 0.9)',
                'rgba(255, 215, 0, 0.4)',
              ],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            PRESS START
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
