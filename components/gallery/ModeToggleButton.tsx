"use client";

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ModeToggleButtonProps {
  currentMode: 'z-axis' | 'liquid';
  theme?: 'dark' | 'light'; // 👑 接收主题，用于反相变色
  onToggle: () => void;
}

export default function ModeToggleButton({ currentMode, theme = 'dark', onToggle }: ModeToggleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - (left + width / 2)) * 0.4; 
    const y = (e.clientY - (top + height / 2)) * 0.4;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  // 👑 获取注入灵魂的文案
  const getModeLabel = () => {
    if (theme === 'dark') {
      return currentMode === 'liquid' ? '[ 流体 / LIQUID ]' : '[ 坠落 / Z-AXIS ]';
    } else {
      return currentMode === 'liquid' ? '[ 琉璃 / PRISM ]' : '[ 织物 / SILK ]';
    }
  };

  // 👑 极致的主题颜色适配 (Light主题下变黑，Dark主题下变白)
  const strokeActive = theme === 'dark' ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
  const strokeInactive = theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const dropShadowHover = theme === 'dark' 
    ? 'drop-shadow(0px 8px 16px rgba(255,255,255,0.25))' 
    : 'drop-shadow(0px 8px 16px rgba(0,0,0,0.25))';
  const dropShadowIdle = theme === 'dark' 
    ? 'drop-shadow(0px 4px 10px rgba(0,0,0,0.6))' 
    : 'drop-shadow(0px 4px 10px rgba(0,0,0,0.1))';
  const bgGlass = theme === 'dark' ? 'bg-white/10' : 'bg-black/5';
  const textClass = theme === 'dark' ? 'text-white/80' : 'text-black/80';

  return (
    <div
      ref={containerRef}
      className="fixed bottom-28 right-10 z-[999] w-24 h-24 flex flex-col items-center justify-center cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onToggle}
    >
      <motion.div
        animate={{ x: mousePosition.x, y: mousePosition.y, scale: isHovered ? 1.15 : 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        whileTap={{ scale: 0.85, rotate: -5 }}
        className="relative flex items-center justify-center w-9 h-9"
      >
        <motion.div
          animate={{ rotate: currentMode === 'liquid' ? 180 : 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="relative w-7.5 h-7.5 flex items-center justify-center"
        >
          <div className={`absolute inset-0 backdrop-blur-md ${bgGlass}`}
            style={{ 
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              filter: isHovered ? dropShadowHover : dropShadowIdle,
              transition: 'filter 0.4s ease, background-color 0.4s ease'
            }}
          />
          <svg className="absolute inset-0 w-full h-full drop-shadow-lg" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
            <polygon 
              points="50,4 96,96 4,96" 
              stroke={currentMode === 'liquid' ? strokeActive : strokeInactive}
              strokeWidth="3" fill="transparent" strokeLinejoin="round" style={{ transition: 'stroke 0.6s ease' }}
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* 👑 绝对悬浮的灵魂文案 */}
      <motion.div
        animate={{ 
          opacity: isHovered ? 1 : 0.2, 
          y: isHovered ? 4 : 0 
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`absolute -bottom-4 whitespace-nowrap font-mono text-[10px] tracking-widest select-none transition-colors duration-500 ${textClass}`}
      >
        {getModeLabel()}
      </motion.div>
    </div>
  );
}