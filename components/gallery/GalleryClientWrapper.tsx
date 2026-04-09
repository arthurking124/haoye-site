"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ZAxisGallery from './ZAxisGallery';
import LiquidGallery from './LiquidGallery';
import ModeToggleButton from './ModeToggleButton';

export default function GalleryClientWrapper({ items }: { items: any[] }) {
  const [viewMode, setViewMode] = useState<'z-axis' | 'liquid'>('z-axis');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 👑 顶级物理锁：进入画廊的一瞬间，彻底锁死全局原生滚动！
    document.body.style.overflow = 'hidden';
    
    // 当用户离开画廊页面（比如切回首页时），归还滚动权限
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted) {
    return <main className="relative w-full h-screen overflow-hidden bg-transparent" />;
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-transparent">
      <AnimatePresence mode="wait">
        {viewMode === 'z-axis' ? (
          <motion.div
            key="z-axis"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(12px)', scale: 0.95 }}
            transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <ZAxisGallery items={items} />
          </motion.div>
        ) : (
          <motion.div
            key="liquid"
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(12px)' }}
            transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <LiquidGallery items={items} />
          </motion.div>
        )}
      </AnimatePresence>

      <ModeToggleButton 
        currentMode={viewMode} 
        onToggle={() => setViewMode(prev => prev === 'z-axis' ? 'liquid' : 'z-axis')} 
      />
    </main>
  );
}