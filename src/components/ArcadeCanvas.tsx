import { useState, useEffect, useCallback, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

// Internal design resolution — all child components use fixed px relative to this.
const DESIGN_W = 1344;
const DESIGN_H = 756;
const ASPECT = DESIGN_W / DESIGN_H; // 16:9

/**
 * 16:9 arcade cabinet canvas.
 * Fills as much of the viewport as possible while keeping 16:9 aspect ratio.
 * Internally renders at 1344×756 and CSS-scales to fit — like shrinking a photo.
 */
export default function ArcadeCanvas({ children }: Props) {
  const getScale = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Largest 16:9 box that fits in the viewport
    let w = vw;
    let h = vw / ASPECT;
    if (h > vh) {
      h = vh;
      w = vh * ASPECT;
    }
    return w / DESIGN_W; // scale factor from design size to actual size
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
          width: `${DESIGN_W}px`,
          height: `${DESIGN_H}px`,
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
