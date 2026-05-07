'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { SensoryEngine } from '@/lib/SensoryEngine';

interface SensoryContextType {
  engine: SensoryEngine | null;
  triggerTransition: (theme: 'dark' | 'light') => Promise<void>;
  currentTheme: 'dark' | 'light';
  isTransitioning: boolean;
  unlockEngine: () => void; 
  isAssetsLoaded: boolean; 
}

const SensoryContext = createContext<SensoryContextType | undefined>(undefined);

export const GlobalSensoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engine, setEngine] = useState<SensoryEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  
  const isReadyRef = useRef(false);

  useEffect(() => {
    const eng = SensoryEngine.getInstance();
    setEngine(eng);
    
    Promise.all([
      eng.loadSound('/audio/ryuichi.mp3', 'darkTheme'),
      eng.loadSound('/audio/ambre1.mp3', 'lightTheme'),
      eng.loadSound('/audio/portal.mp3', 'collapse'), 
    ]).then(() => {
      console.log("Quantum Sensory Engine: Assets Ready");
      setIsAssetsLoaded(true);
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        eng.suspendAndMute();
      } else {
        if (isReadyRef.current) {
          eng.resumeAndUnmute(); 
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []); 

  const unlockEngine = useCallback(() => {
    // 👑 终极防御：如果资源没加载完，或者引擎已启动，绝对拒绝执行！
    if (!engine || isReadyRef.current || !isAssetsLoaded) return;
    
    engine.unlock(); // 这里会触发你刚才加的 playInstantFeedback() 的“滴”声
    engine.switchThemeMusic(currentTheme === 'dark' ? 'darkTheme' : 'lightTheme');
    
    setIsReady(true);
    isReadyRef.current = true;
  }, [engine, currentTheme, isAssetsLoaded]); // 添加 isAssetsLoaded 依赖

  const triggerTransition = useCallback(async (newTheme: 'dark' | 'light') => {
    if (isTransitioning || !engine || currentTheme === newTheme) return;
    setIsTransitioning(true);
    engine.setCollapseEmotion(true);
    engine.fireSpatialParticle('collapse', window.innerWidth / 2, window.innerHeight / 2, -3.0, 1.2);
    await new Promise(r => setTimeout(r, 1200));
    setCurrentTheme(newTheme);
    engine.switchThemeMusic(newTheme === 'dark' ? 'darkTheme' : 'lightTheme');
    await new Promise(r => setTimeout(r, 800));
    engine.setCollapseEmotion(false);
    setIsTransitioning(false);
  }, [engine, isTransitioning, currentTheme]);

  return (
    <SensoryContext.Provider value={{ engine, triggerTransition, currentTheme, isTransitioning, unlockEngine, isAssetsLoaded }}>
      {children}
    </SensoryContext.Provider>
  );
};

export const useSensory = () => {
  const context = useContext(SensoryContext);
  if (!context) throw new Error("useSensory must be used within GlobalSensoryProvider");
  return context;
};