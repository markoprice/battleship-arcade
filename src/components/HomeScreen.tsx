import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import homeBg from '../assets/01-home_bg.jpg';

interface Props {
  onStart: () => void;
}

export default function HomeScreen({ onStart }: Props) {
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
