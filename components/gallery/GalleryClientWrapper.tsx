"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import ZAxisGallery from './ZAxisGallery';
import LiquidGallery from './LiquidGallery';
import ModeToggleButton from './ModeToggleButton';
import { urlFor } from '@/lib/sanity.image';

export default function GalleryClientWrapper({ items }: { items: any[] }) {
  // --- 全局状态中心 ---
  const [viewMode, setViewMode] = useState<'z-axis' | 'liquid'>('z-axis');
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); // 提取出来的核心指针
  
  // --- 索引 (HUD Index) 状态 ---
  const [showIndex, setShowIndex] = useState(false);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);

  // --- 鼠标跟随系统的物理弹簧 ---
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 监听鼠标移动，只在 Index 打开时生效
  useEffect(() => {
    if (!showIndex) return;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showIndex, mouseX, mouseY]);

  if (!mounted) return <main className="relative w-full h-screen overflow-hidden bg-transparent" />;

  // 获取悬停的图片 URL
  const hoveredImgUrl = hoveredItemIndex !== null && items[hoveredItemIndex]?.images?.[0] 
    ? urlFor(items[hoveredItemIndex].images[0]).width(600).quality(80).url() 
    : null;

  return (
    <main className="relative w-full h-screen overflow-hidden bg-transparent">
      
      {/* 1. 底层画廊渲染区 */}
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
            <ZAxisGallery 
              items={items} 
              currentIndex={currentIndex} 
              setCurrentIndex={setCurrentIndex} 
              onOpenIndex={() => setShowIndex(true)}
            />
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
            <LiquidGallery 
              items={items} 
              currentIndex={currentIndex} 
              setCurrentIndex={setCurrentIndex} 
              onOpenIndex={() => setShowIndex(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ModeToggleButton 
        currentMode={viewMode} 
        onToggle={() => setViewMode(prev => prev === 'z-axis' ? 'liquid' : 'z-axis')} 
      />

      {/* 2. 顶级设计：霜化结界微缩索引 (Frosted HUD Index) */}
      <AnimatePresence>
        {showIndex && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center pointer-events-auto"
          >
            {/* 关闭按钮点击层 */}
            <div className="absolute inset-0 z-0" onClick={() => setShowIndex(false)} />
            
            {/* 列表容器 */}
            <div className="relative z-10 w-full max-w-[1000px] h-[75vh] px-6 md:px-12 overflow-y-auto overscroll-contain no-scrollbar">
              
              <div className="flex justify-between items-end mb-16 border-b border-white/20 pb-6">
                <h3 className="text-sm font-mono tracking-[0.4em] text-[var(--site-faint)]">ARCHIVE INDEX</h3>
                <button 
                  onClick={() => setShowIndex(false)}
                  className="text-xs font-mono tracking-widest text-white hover:text-[var(--site-faint)] transition-colors"
                >
                  [ CLOSE ]
                </button>
              </div>

              <ul className="flex flex-col gap-2">
                {items.map((item, i) => {
                  const isActive = i === currentIndex;
                  return (
                    <li key={i}>
                      <button
                        onClick={() => {
                          setCurrentIndex(i);
                          setShowIndex(false); // 瞬间跃迁，并关闭索引
                        }}
                        onMouseEnter={() => setHoveredItemIndex(i)}
                        onMouseLeave={() => setHoveredItemIndex(null)}
                        className={`group w-full flex items-center gap-3 md:gap-6 py-4 border-b border-white/5 transition-all duration-500 md:hover:px-4 hover:bg-white/5 ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                      >
                        <span className="text-[10px] md:text-xs font-mono tracking-widest w-6 md:w-8 text-left">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="w-8 md:w-12 h-[1px] bg-white/20 group-hover:bg-white/60 transition-colors" />
                        
                        <h4 className="text-xl md:text-3xl font-light tracking-[0.2em] uppercase text-left flex-1 truncate">
                          {item.title ?? '未命名'}
                        </h4>

                        {/* 移动端专属缩略图（仅在手机端 block，电脑端 hidden） */}
                        <div className="block md:hidden w-16 h-10 ml-2 flex-shrink-0 overflow-hidden rounded-[2px] opacity-80">
                          {item.images?.[0] && (
                            <img 
                              src={urlFor(item.images[0]).width(200).quality(80).url()} 
                              alt={item.title ?? 'preview'}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {isActive && <span className="text-[10px] font-mono tracking-widest hidden md:block">CURRENT</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 鼠标跟随：悬浮微缩图 (仅电脑端显示) */}
            {hoveredImgUrl && (
              <motion.img
                src={hoveredImgUrl}
                alt="preview"
                style={{ x: springX, y: springY }}
                className="fixed top-0 left-0 w-[260px] aspect-[4/3] object-cover pointer-events-none z-50 rounded-sm shadow-2xl opacity-0 md:opacity-100 origin-center -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}