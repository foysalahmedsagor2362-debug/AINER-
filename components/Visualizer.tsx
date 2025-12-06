import React, { useEffect, useRef } from 'react';

const Visualizer: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    const draw = () => {
      if (!active) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.fillStyle = 'rgba(9, 9, 11, 0.2)'; // Fade out effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 2;

      const centerY = canvas.height / 2;
      
      for (let x = 0; x < canvas.width; x++) {
        // Create a sine wave that moves
        const y = centerY + Math.sin(x * 0.02 + t) * Math.cos(x * 0.01 + t * 0.5) * 50;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      t += 0.1;
      animationId = requestAnimationFrame(draw);
    };

    if (active) {
        draw();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => cancelAnimationFrame(animationId);
  }, [active]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={200} 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none"
    />
  );
};

export default Visualizer;
