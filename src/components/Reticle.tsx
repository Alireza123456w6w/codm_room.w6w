import React, { useEffect, useState } from 'react';

export const Reticle: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    const onMouseDown = () => setActive(true);
    const onMouseUp = () => setActive(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (pos.x < 0) return null;

  return (
    <div
      id="reticle"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `translate(-50%, -50%) scale(${active ? 0.85 : 1})`,
        display: 'block'
      }}
      aria-hidden="true"
    >
      <i className="rr"></i>
      <i className="rdot"></i>
      <i className="rt1"></i>
      <i className="rt2"></i>
      <i className="rt3"></i>
      <i className="rt4"></i>
    </div>
  );
};
