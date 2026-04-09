"use client";

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ModeToggleButtonProps {
  currentMode: 'z-axis' | 'liquid';
  onToggle: () => void;
}

export default function ModeToggleButton({ currentMode, onToggle }: ModeToggleButtonProps) {
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

  return (
    <div
      ref={containerRef}
      className="fixed bottom-10 right-10 z-[999] w-32 h-32 flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onToggle}
    >
      <motion.div
        animate={{ x: mousePosition.x, y: mousePosition.y, scale: isHovered ? 1.15 : 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        whileTap={{ scale: 0.85, rotate: -5 }}
        className="relative flex items-center justify-center w-12 h-12"
      >
        <motion.div
          animate={{ rotate: currentMode === 'liquid' ? 180 : 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="relative w-10 h-10 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md"
            style={{ 
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              filter: isHovered ? 'drop-shadow(0px 8px 16px rgba(255,255,255,0.25))' : 'drop-shadow(0px 4px 10px rgba(0,0,0,0.6))',
              transition: 'filter 0.4s ease'
            }}
          />
          <svg className="absolute inset-0 w-full h-full drop-shadow-lg" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
            <polygon 
              points="50,4 96,96 4,96" 
              stroke={currentMode === 'liquid' ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)"}
              strokeWidth="3" fill="transparent" strokeLinejoin="round" style={{ transition: 'stroke 0.6s ease' }}
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}