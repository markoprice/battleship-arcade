import { useState, useEffect, useCallback, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const CANVAS_W = 1344;
const CANVAS_H = 756;

/**
 * Fixed 1344x756 arcade cabinet canvas.
 * Scales the whole picture down (like shrinking a photo) when the viewport is
 * smaller than 1344x756, so you always see the full canvas — never zoomed/cropped.
 */
export default function ArcadeCanvas({ children }: Props) {
  const getScale = useCallback(() => {
    const sx = window.innerWidth / CANVAS_W;
    const sy = window.innerHeight / CANVAS_H;
    return Math.min(sx, sy, 1); // never scale UP beyond 1
  }, []);

  const [scale, setScale] = useState(getScale);

  useEffect(() => {
    const onResize = () => setScale(getScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getScale]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: '#050510' }}
    >
      <div
        style={{
          width: `${CANVAS_W}px`,
          height: `${CANVAS_H}px`,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.8)',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
