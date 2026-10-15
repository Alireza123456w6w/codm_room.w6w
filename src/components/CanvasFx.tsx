import React, { useEffect, useRef } from 'react';

export const CanvasFx: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      sz: number;
      a: number;
      va: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ['#ff9f1a', '#ff6b00', '#ffd08a', '#ff4757'];

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.4 - Math.random() * 0.9,
        sz: 1 + Math.random() * 2.5,
        a: 0.1 + Math.random() * 0.5,
        va: 0.003 + Math.random() * 0.008,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.va;
        if (p.a > 0.65 || p.a < 0.1) p.va = -p.va;
        if (p.y < 0) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.a));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="bg-fx">
      <canvas ref={canvasRef} id="fxCanvas" aria-hidden="true" />
      <div className="grid-fx" />
      <div className="glow-fx" />
      <div className="scan-fx" />
      <div className="vig-fx" />
    </div>
  );
};
