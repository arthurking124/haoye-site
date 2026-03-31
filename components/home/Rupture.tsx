"use client";
import React, { useRef, useEffect } from 'react';

const Rupture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lines = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const addLine = (e: MouseEvent) => {
      // 只有鼠标移动速度够快（破坏力够强），才会产生裂痕
      const speed = Math.sqrt(Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2));
      if (speed < 10) return; 

      lines.current.push({
        x: e.clientX,
        y: e.clientY,
        vx: e.movementX * 0.5,
        vy: e.movementY * 0.5,
        life: 1.0,      // 生命值，决定愈合时间
        width: Math.min(speed / 5, 4), // 裂痕宽度由速度决定
      });
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      lines.current.forEach((line, index) => {
        line.life -= 0.015; // 愈合速度：调小则愈合慢，调大则愈合快
        line.x += line.vx * 0.1;
        line.y += line.vy * 0.1 + 0.3; // +0.3 带来的微弱下沉，就是你说的“重生的重量”

        if (line.life <= 0) {
          lines.current.splice(index, 1);
          return;
        }

        ctx.beginPath();
        ctx.strokeStyle = `rgba(200, 200, 200, ${line.life * 0.4})`; // 极简灰，若隐若现
        ctx.lineWidth = line.width * line.life; // 愈合时线条变细
        ctx.lineCap = 'round';
        ctx.moveTo(line.x - line.vx, line.y - line.vy);
        ctx.lineTo(line.x, line.y);
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', addLine);
    animate();

    return () => {
      window.removeEventListener('mousemove', addLine);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-10 pointer-events-none opacity-60"
      style={{ mixBlendMode: 'screen' }} // 让光痕与混凝土背景产生自然的叠光效果
    />
  );
};

export default Rupture;