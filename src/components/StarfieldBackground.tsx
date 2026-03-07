import { useEffect, useRef } from 'react';
import bgImage from '../assets/background.png';

interface Twinkle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  phase: number;
  speed: number;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const twinklesRef = useRef<Twinkle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create a sparse set of twinkle points
    twinklesRef.current = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.55, // mostly in sky area
      radius: Math.random() * 2 + 1,
      opacity: 0,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.008,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const t of twinklesRef.current) {
        t.phase += t.speed;
        // Smooth sine-based fade — mostly dim, occasionally bright
        t.opacity = Math.max(0, Math.sin(t.phase) * 0.7);

        if (t.opacity > 0.02) {
          // Soft glow
          const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.radius * 4);
          gradient.addColorStop(0, `rgba(200, 220, 255, ${t.opacity})`);
          gradient.addColorStop(0.5, `rgba(180, 200, 255, ${t.opacity * 0.3})`);
          gradient.addColorStop(1, 'rgba(180, 200, 255, 0)');
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Bright core
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${t.opacity})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <>
      <img
        src={bgImage}
        alt=""
        className="fixed inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />
    </>
  );
}
