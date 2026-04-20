'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  useEffect(() => {
    const eng = SensoryEngine.getInstance();
    setEngine(eng);
    
    Promise.all([
      eng.loadSound('/audio/ryuichi.mp3', 'darkTheme'),
      eng.loadSound('/audio/ambre1.mp3', 'lightTheme'),
      eng.loadSound('/audio/portal.mp3', 'collapse'), 
    ]).then(() => {
      console.log("Quantum Sensory Engine: Assets Loaded");
    });

    // 🏆 顶级优化 3：注册页面可见性生命周期监听，做个“懂事”的顶级网站
    const handleVisibilityChange = () => {
      if (document.hidden) {
        eng.suspendAndMute();
      } else {
        // 只有在用户已经解锁系统的情况下，切回 Tab 才恢复音频
        if (isReady) eng.resumeAndUnmute(); 
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isReady]); // 将 isReady 作为依赖，确保恢复逻辑正确执行

  const handleEnter = useCallback(() => {
    if (!engine) return;
    engine.unlock();
    engine.switchThemeMusic('darkTheme');
    setIsReady(true);
  }, [engine]);

  const triggerTransition = useCallback(async (newTheme: 'dark' | 'light') => {
    // 🏆 顶级优化 4：极其严格的状态锁。防止用户疯狂点击导致 AudioParam 包络线计算错乱产生爆音
    if (isTransitioning || !engine || currentTheme === newTheme) return;
    
    setIsTransitioning(true);

    engine.setCollapseEmotion(true);
    // 🏆 顶级优化 2：触发坍缩时，注入 -3.0 的 Z 轴深度。声音会从空旷的深渊处传来。
    engine.fireSpatialParticle('collapse', window.innerWidth / 2, window.innerHeight / 2, -3.0, 1.2);

    await new Promise(r => setTimeout(r, 1200));
    
    setCurrentTheme(newTheme);
    engine.switchThemeMusic(newTheme === 'dark' ? 'darkTheme' : 'lightTheme');

    await new Promise(r => setTimeout(r, 800));
    
    engine.setCollapseEmotion(false);
    setIsTransitioning(false);
  }, [engine, isTransitioning, currentTheme]);

  return (
    <SensoryContext.Provider value={{ engine, triggerTransition, currentTheme, isTransitioning }}>
      {children}
      
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