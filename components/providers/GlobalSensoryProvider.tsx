'use client'
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { SensoryEngine } from '@/lib/SensoryEngine';
import { AnimatePresence, motion } from 'framer-motion';

interface SensoryContextType {
  engine: SensoryEngine | null;
  triggerTransition: (theme: 'dark' | 'light') => Promise<void>;
  currentTheme: 'dark' | 'light';
  isTransitioning: boolean;
}

const SensoryContext = createContext<SensoryContextType | undefined>(undefined);

export const GlobalSensoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engine, setEngine] = useState<SensoryEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 👑 初始化引擎但不发声，等待用户物理授权
  useEffect(() => {
    const eng = SensoryEngine.getInstance();
    setEngine(eng);
    
    // 👑 修正了加载路径：只加载你 public 文件夹里真实存在的文件
    Promise.all([
      eng.loadSound('/audio/ryuichi.mp3', 'darkTheme'),
      eng.loadSound('/audio/ambre1.mp3', 'lightTheme'),
      eng.loadSound('/audio/portal.mp3', 'collapse'), 
      // 暂时注释掉不存在的交互音效，等以后有了文件再解开
      // eng.loadSound('/sounds/crystal_hover.mp3', 'crystalHover'),
    ]).then(() => {
      console.log("Quantum Sensory Engine: Assets Loaded");
    });
  }, []);

  // 👑 破壁唤醒：用户第一次点击时真正激活系统
  const handleEnter = useCallback(() => {
    if (!engine) return;
    engine.unlock();
    engine.switchThemeMusic('darkTheme');
    setIsReady(true);
  }, [engine]);

  const triggerTransition = useCallback(async (newTheme: 'dark' | 'light') => {
    if (isTransitioning || !engine) return;
    setIsTransitioning(true);

    // 1. 声音情绪开始下潜（低通滤波生效）
    engine.setCollapseEmotion(true);
    // 2. 触发坍缩撕裂音效
    engine.fireSpatialParticle('collapse', window.innerWidth / 2, window.innerHeight / 2, 1.2);

    // 3. 视觉奇点汇聚等待...
    await new Promise(r => setTimeout(r, 1200));
    
    setCurrentTheme(newTheme);
    engine.switchThemeMusic(newTheme === 'dark' ? 'darkTheme' : 'lightTheme');

    // 4. 视觉奇点爆发等待...
    await new Promise(r => setTimeout(r, 800));
    
    // 5. 情绪浮出水面，声音恢复通透
    engine.setCollapseEmotion(false);
    setIsTransitioning(false);
  }, [engine, isTransitioning]);

  return (
    <SensoryContext.Provider value={{ engine, triggerTransition, currentTheme, isTransitioning }}>
      {children}
      
      {/* 👑 神级阻断层：解决 100% 的 Autoplay 报错问题 */}
      <AnimatePresence>
        {!isReady && (
          <motion.div 
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0a0a0c] text-white cursor-pointer"
            onClick={handleEnter}
          >
            <div className="flex flex-col items-center tracking-[0.5em]">
              <span className="text-sm font-mono opacity-50 mb-4 animate-pulse">SYSTEM AWAITING</span>
              <span className="text-2xl font-light">TOUCH TO ENTER THE ABYSS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SensoryContext.Provider>
  );
};

export const useSensory = () => {
  const context = useContext(SensoryContext);
  if (!context) throw new Error("useSensory must be used within GlobalSensoryProvider");
  return context;
};