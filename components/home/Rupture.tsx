"use client";
import React, { useRef, useEffect } from 'react';

const Rupture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<any[]>([]);

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

    const addRupture = (e: MouseEvent) => {
      // 1. 速度检查：只有用力划（破坏力强），才会切开。
      const speed = Math.sqrt(Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2));
      if (speed < 15) return; 

      // 2. 核心：不画线，我们要画“伤口的形状”
      // 线条是 Shuttle 形的（两头尖、中间宽），模拟刺入感
      ripples.current.push({
        x: e.clientX,
        y: e.clientY,
        vx: e.movementX,
        vy: e.movementY,
        length: speed,
        life: 1.0,     // 生命值，1.0 是全开，0.0 是愈合
        baseWidth: Math.min(speed / 4, 6), // 伤口的口子有多宽
      });
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ripples.current.forEach((rip, index) => {
        // 3. 愈合节奏：线条自己变细、变短，而不是变透明
        rip.life -= 0.015; // 愈合速度：调小则愈合慢，调大则愈合快

        if (rip.life <= 0) {
          ripples.current.splice(index, 1);
          return;
        }

        ctx.save();
        
        // --- 核心黑科技 ---
        // 4. mixBlendMode='screen' 让光痕透出来，
        // 但我们要用 destination-out 来模拟黑色的裂缝
        ctx.globalCompositeOperation = 'destination-out'; 
        
        ctx.beginPath();
        // 5. 绘制裂缝的形状：一个两头尖、中间宽的椭圆
        // 随着生命（life）下降，宽度和长度同时收缩
        ctx.ellipse(
          rip.x - rip.vx * (1 - rip.life) * 0.1, 
          rip.y - rip.vy * (1 - rip.life) * 0.1, 
          rip.length * rip.life * 0.2, // 裂缝长度随时间收缩
          rip.baseWidth * rip.life,     // 裂缝宽度随时间收缩
          Math.atan2(rip.vy, rip.vx), 
          0, 
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // 这个颜色不重要，关键是把画面抠掉
        ctx.fill();
        
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', addRupture);
    animate();

    return () => {
      window.removeEventListener('mousemove', addRupture);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // 保持 z-index，让它浮在混凝土上面
      className="fixed inset-0 z-10 pointer-events-none opacity-90"
      style={{ mixBlendMode: 'normal' }} // 改回正常混合模式，让抠掉的地方显示黑色
    />
  );
};

export default Rupture;