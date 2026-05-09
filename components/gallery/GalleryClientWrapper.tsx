"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { urlFor } from '@/lib/sanity.image';

// 👑 1. 导入你的主题引擎
import { useSensory } from '@/components/providers/GlobalSensoryProvider';

// 👑 2. 导入四大神级画廊模块
import ZAxisGallery from './ZAxisGallery';
import LiquidGallery from './LiquidGallery';
import PrismaticGallery from './PrismaticGallery'; // 极昼模式一：琉璃色散
import SilkGallery from './SilkGallery';           // 极昼模式二：浮空织物
import ModeToggleButton from './ModeToggleButton';

export default function GalleryClientWrapper({ items }: { items: any[] }) {
  const [viewMode, setViewMode] = useState<'z-axis' | 'liquid'>('z-axis');
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); 
  
  // 获取当前主题 (深渊 / 极昼)
  const { currentTheme } = useSensory();
  
  // 索引结界状态
  const [showIndex, setShowIndex] = useState(false);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  
  // 双重精准设备检测
  const [isPhone, setIsPhone] = useState(false);
  const [canHover, setCanHover] = useState(true);

  // 鼠标跟随系统的物理弹簧
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  useEffect(() => {
    setMounted(true);
    setIsPhone(window.innerWidth < 768);
    setCanHover(window.matchMedia("(hover: hover)").matches);
    
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!showIndex || !canHover) return;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showIndex, canHover, mouseX, mouseY]);

  useEffect(() => {
    if (showIndex) {
      setHoveredItemIndex(currentIndex);
    } else {
      setHoveredItemIndex(null);
    }
  }, [showIndex, currentIndex]);

  // 【核心黑科技】：手机端专属滑动雷达扫描
  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isPhone) return;
    const container = e.currentTarget;
    const itemElements = container.querySelectorAll('.haoye-index-item');
    const containerRect = container.getBoundingClientRect();
    
    // 设定“扫描线”在列表容器的中上部 (35% 处)
    const scanLine = containerRect.top + containerRect.height * 0.35; 
    
    let minDiff = Infinity;
    let activeIndex = hoveredItemIndex;

    itemElements.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const diff = Math.abs(scanLine - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        activeIndex = i;
      }
    });

    if (activeIndex !== hoveredItemIndex) {
      setHoveredItemIndex(activeIndex);
    }
  };

  if (!mounted) return <main className="relative w-full h-[100dvh] overflow-hidden bg-transparent" />;

  const hoveredImgUrl = hoveredItemIndex !== null && items[hoveredItemIndex]?.images?.[0] 
    ? urlFor(items[hoveredItemIndex].images[0]).width(800).quality(85).url() 
    : null;

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-transparent">
      
      {/* 👑 底层画廊渲染区：四维宇宙的终极分发 */}
      <AnimatePresence mode="wait">
        {viewMode === 'z-axis' ? (
          <motion.div
            // 根据主题改变 key，确保切换主题时强制卸载旧的 WebGL 组件
            key={`z-axis-${currentTheme}`} 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(12px)', scale: 0.95 }}
            transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {currentTheme === 'dark' ? (
              <ZAxisGallery items={items} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} onOpenIndex={() => setShowIndex(true)} />
            ) : (
              // 极昼模式的对标项：浮空织物 (传递的 props 做了向下兼容映射)
              <SilkGallery images={items} currentIndex={currentIndex} onIndexChange={setCurrentIndex} onOpenIndex={() => setShowIndex(true)} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`liquid-${currentTheme}`}
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(12px)' }}
            transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {currentTheme === 'dark' ? (
              <LiquidGallery items={items} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} onOpenIndex={() => setShowIndex(true)} />
            ) : (
              // 极昼模式的对标项：琉璃色散
              <PrismaticGallery images={items} currentIndex={currentIndex} onIndexChange={setCurrentIndex} onOpenIndex={() => setShowIndex(true)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 👑 把当前主题传递给按钮，让它能变色并显示灵魂文案 */}
      <ModeToggleButton 
        currentMode={viewMode} 
        theme={currentTheme} 
        onToggle={() => setViewMode(prev => prev === 'z-axis' ? 'liquid' : 'z-axis')} 
      />

      {/* 霜化结界微缩索引 (Frosted HUD Index) - 以下代码完全保留你的原样 */}
      <AnimatePresence>
        {showIndex && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center pointer-events-auto"
          >
            <div className="absolute inset-0 z-0" onClick={() => setShowIndex(false)} />
            
            {isPhone && (
              <div className="w-full h-[35vh] px-6 pt-10 flex-shrink-0 relative z-10">
                 <div className="w-full h-full relative rounded-[2px] overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
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

            <div 
              className={`relative z-10 w-full max-w-[1000px] px-6 md:px-12 overflow-y-auto overscroll-contain no-scrollbar 
                ${isPhone ? 'h-[65vh] pt-8' : 'h-[75vh] py-0'}`}
              onScroll={isPhone ? handleMobileScroll : undefined}
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
                  const isHoveredVisual = isPhone ? i === hoveredItemIndex : false; 

                  return (
                    <li key={i} className="haoye-index-item">
                      <button
                        onClick={() => {
                          setCurrentIndex(i);
                          setShowIndex(false);
                        }}
                        onMouseEnter={() => canHover && setHoveredItemIndex(i)}
                        onMouseLeave={() => canHover && setHoveredItemIndex(null)}
                        className={`group w-full flex items-center gap-6 py-4 border-b border-white/5 transition-all duration-500
                          ${isActive ? 'opacity-100' : 'opacity-40'} 
                          ${isHoveredVisual ? 'opacity-100 bg-white/5 px-4' : ''} 
                          ${canHover ? 'hover:px-4 hover:bg-white/5 hover:opacity-100' : ''}
                        `}
                      >
                        <span className="text-[10px] md:text-xs font-mono tracking-widest w-8 text-left">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        
                        <span className={`w-12 h-[1px] bg-white/20 transition-colors 
                          ${isHoveredVisual ? 'bg-white/60' : (canHover ? 'group-hover:bg-white/60' : '')}
                        `} />
                        
                        <h4 className="text-xl md:text-3xl font-light tracking-[0.2em] uppercase text-left flex-1 truncate">
                          {item.title ?? '未命名'}
                        </h4>
                        {isActive && <span className="text-[10px] font-mono tracking-widest hidden md:block">CURRENT</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              
              {isPhone && <div className="w-full h-[45vh] flex-shrink-0 pointer-events-none" aria-hidden="true" />}
              
            </div>

            {!isPhone && hoveredImgUrl && (
              <motion.img
                src={hoveredImgUrl}
                alt="preview"
                style={{ x: springX, y: springY }}
                className="fixed top-0 left-0 w-[300px] aspect-[4/3] object-cover pointer-events-none z-50 rounded-[2px] shadow-2xl origin-center -translate-x-1/2 -translate-y-1/2"
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