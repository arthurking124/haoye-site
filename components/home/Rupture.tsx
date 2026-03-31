"use client";
import React, { useRef, useEffect } from 'react';

const Rupture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paths = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const addPoint = (e: MouseEvent) => {
      // 速度门槛：只有快速划动才算“刀割”
      const speed = Math.sqrt(Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2));
      if (speed < 5) return; 

      paths.current.push({
        x: e.clientX,
        y: e.clientY,
        prevX: e.clientX - e.movementX,
        prevY: e.clientY - e.movementY,
        life: 1.0, 
        width: Math.min(speed / 3, 5), // 划得越快，伤口越深
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      paths.current.forEach((p, index) => {
        p.life -= 0.02; // 愈合速度：调小则愈合更慢（比如 0.01）

        if (p.life <= 0) {
          paths.current.splice(index, 1);
          return;
        }

        ctx.beginPath();
        // 核心：模拟伤口愈合时的收缩感
        // 线条宽度随 life 减小，颜色随 life 变暗
        ctx.lineWidth = p.width * p.life; 
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.life * 0.5})`; // 裂缝透出的光
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // 增加一点点的“裂纹”细节，让它看起来像切开的石头
        if (p.life > 0.8) {
           ctx.lineWidth = 0.5;
           ctx.strokeStyle = `rgba(255, 255, 255, ${p.life * 0.2})`;
           ctx.lineTo(p.x + (Math.random() - 0.5) * 10, p.y + (Math.random() - 0.5) * 10);
           ctx.stroke();
        }
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', addPoint);
    animate();

    return () => {
      window.removeEventListener('mousemove', addPoint);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ mixBlendMode: 'plus-lighter', filter: 'blur(0.5px)' }} 
    />
  );
};

export default Rupture;