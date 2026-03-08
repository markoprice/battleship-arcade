import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Fixed 1344x756 arcade cabinet canvas.
 * Centers content in the viewport with a dark bezel background.
 * All non-home screens should wrap their content in this component.
 */
export default function ArcadeCanvas({ children }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: '#050510' }}
    >
      <div
        style={{
          width: '1344px',
          height: '756px',
          maxWidth: '100vw',
          maxHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.8)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
