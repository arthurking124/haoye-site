"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import ZAxisGallery from './ZAxisGallery';
import LiquidGallery from './LiquidGallery';
import ModeToggleButton from './ModeToggleButton';
import { urlFor } from '@/lib/sanity.image';

export default function GalleryClientWrapper({ items }: { items: any[] }) {
  const [viewMode, setViewMode] = useState<'z-axis' | 'liquid'>('z-axis');
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); 
  
  // 索引结界状态
  const [showIndex, setShowIndex] = useState(false);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  
  // 设备检测状态
  const [isMobile, setIsMobile] = useState(false);

  // 鼠标跟随系统的物理弹簧 (仅电脑端起效)
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  useEffect(() => {
    setMounted(true);
    // 精准检测是否为移动端 (屏幕宽度小于 768px 或 触控设备)
    setIsMobile(window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 监听桌面端鼠标移动
  useEffect(() => {
    if (!showIndex || isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showIndex, isMobile, mouseX, mouseY]);

  // 打开 Index 时，自动预加载当前图片的预览
  useEffect(() => {
    if (showIndex) {
      setHoveredItemIndex(currentIndex);
    } else {
      setHoveredItemIndex(null);
    }
  }, [showIndex, currentIndex]);

  // 【核心黑科技】：移动端滑动雷达扫描
  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const container = e.currentTarget;
    const itemElements = container.querySelectorAll('.haoye-index-item');
    const containerRect = container.getBoundingClientRect();
    
    // 设定一条“扫描线”在列表容器的中上部 (35% 处)
    const scanLine = containerRect.top + containerRect.height * 0.35; 
    
    let minDiff = Infinity;
    let activeIndex = hoveredItemIndex;

    itemElements.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const diff = Math.abs(scanLine - itemCenter);
      // 找出距离扫描线最近的那个列表项
      if (diff < minDiff) {
        minDiff = diff;
        activeIndex = i;
      }
    });

    if (activeIndex !== hoveredItemIndex) {
      setHoveredItemIndex(activeIndex);
    }
  };

  if (!mounted) return <main className="relative w-full h-screen overflow-hidden bg-transparent" />;

  // 获取需要预览的图片 URL
  const hoveredImgUrl = hoveredItemIndex !== null && items[hoveredItemIndex]?.images?.[0] 
    ? urlFor(items[hoveredItemIndex].images[0]).width(800).quality(85).url() 
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
            <ZAxisGallery items={items} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} onOpenIndex={() => setShowIndex(true)} />
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
            <LiquidGallery items={items} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} onOpenIndex={() => setShowIndex(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      <ModeToggleButton currentMode={viewMode} onToggle={() => setViewMode(prev => prev === 'z-axis' ? 'liquid' : 'z-axis')} />

      {/* 2. 顶级设计：霜化结界微缩索引 (Frosted HUD Index) */}
      <AnimatePresence>
        {showIndex && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center pointer-events-auto"
          >
            {/* 关闭按钮点击层 */}
            <div className="absolute inset-0 z-0" onClick={() => setShowIndex(false)} />
            
            {/* ================================================= */}
            {/* 📱 手机端专属：顶部雷达监视器 (Monitor) */}
            {/* ================================================= */}
            {isMobile && (
              <div className="w-full h-[35vh] px-6 pt-10 flex-shrink-0 relative z-10">
                 <div className="w-full h-full relative rounded-sm overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
                   <AnimatePresence mode="wait">
                     {hoveredImgUrl ? (
                       <motion.img 
                         key={hoveredImgUrl}
                         src={hoveredImgUrl}
                         initial={{ opacity: 0, scale: 1.05 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.4 }}
                         className="absolute inset-0 w-full h-full object-cover"
                       />
                     ) : (
                       <div key="empty" className="absolute inset-0 flex items-center justify-center text-[10px] tracking-widest text-white/30 font-mono">
                         NO PREVIEW
                       </div>
                     )}
                   </AnimatePresence>
                 </div>
              </div>
            )}

            {/* ================================================= */}
            {/* 📜 文本列表容器 */}
            {/* ================================================= */}
            <div 
              className={`relative z-10 w-full max-w-[1000px] px-6 md:px-12 overflow-y-auto overscroll-contain no-scrollbar 
                ${isMobile ? 'h-[65vh] pt-8 pb-24' : 'h-[75vh] py-0'}`}
              onScroll={isMobile ? handleMobileScroll : undefined}
            >
              
              <div className="flex justify-between items-end mb-12 md:mb-16 border-b border-white/20 pb-6">
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
                  // 移动端通过滑动雷达判断是否 Hover，桌面端通过真实的鼠标 Hover 判断
                  const isHoveredVisual = isMobile ? i === hoveredItemIndex : false; 

                  return (
                    <li key={i} className="haoye-index-item">
                      <button
                        onClick={() => {
                          setCurrentIndex(i);
                          setShowIndex(false); // 瞬间跃迁，并关闭索引
                        }}
                        onMouseEnter={() => !isMobile && setHoveredItemIndex(i)}
                        onMouseLeave={() => !isMobile && setHoveredItemIndex(null)}
                        className={`group w-full flex items-center gap-6 py-4 border-b border-white/5 transition-all duration-500 hover:px-4 hover:bg-white/5 
                          ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'} 
                          ${isHoveredVisual ? 'opacity-100 bg-white/5 px-4' : ''}
                        `}
                      >
                        <span className="text-[10px] md:text-xs font-mono tracking-widest w-8 text-left">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className={`w-12 h-[1px] bg-white/20 transition-colors ${isHoveredVisual ? 'bg-white/60' : 'group-hover:bg-white/60'}`} />
                        <h4 className="text-xl md:text-3xl font-light tracking-[0.2em] uppercase text-left flex-1 truncate">
                          {item.title ?? '未命名'}
                        </h4>
                        {isActive && <span className="text-[10px] font-mono tracking-widest hidden md:block">CURRENT</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ================================================= */}
            {/* 💻 电脑端专属：鼠标跟随悬浮微缩图 */}
            {/* ================================================= */}
            {!isMobile && hoveredImgUrl && (
              <motion.img
                src={hoveredImgUrl}
                alt="preview"
                style={{ x: springX, y: springY }}
                className="fixed top-0 left-0 w-[300px] aspect-[4/3] object-cover pointer-events-none z-50 rounded-sm shadow-2xl origin-center -translate-x-1/2 -translate-y-1/2"
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