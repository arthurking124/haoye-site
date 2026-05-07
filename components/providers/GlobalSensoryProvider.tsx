'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { SensoryEngine } from '@/lib/SensoryEngine';

interface SensoryContextType {
  engine: SensoryEngine | null;
  triggerTransition: (theme: 'dark' | 'light') => Promise<void>;
  currentTheme: 'dark' | 'light';
  isTransitioning: boolean;
  unlockEngine: () => void; // 暴露给 GenesisLoading 触发
}

const SensoryContext = createContext<SensoryContextType | undefined>(undefined);

export const GlobalSensoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engine, setEngine] = useState<SensoryEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const isReadyRef = useRef(false);

  useEffect(() => {
    // 1. 初始化引擎单例
    const eng = SensoryEngine.getInstance();
    setEngine(eng);
    
    // 2. 预加载核心感官素材 (确保路径与你 public 文件夹一致)
    Promise.all([
      eng.loadSound('/audio/ryuichi.mp3', 'darkTheme'),
      eng.loadSound('/audio/ambre1.mp3', 'lightTheme'),
      eng.loadSound('/audio/portal.mp3', 'collapse'), 
    ]).then(() => {
      console.log("Quantum Sensory Engine: Assets Ready");
    });

    // 3. 处理生命周期：当页面切出时静音，切回时恢复
    const handleVisibilityChange = () => {
      if (document.hidden) {
        eng.suspendAndMute();
      } else {
        // 只有当用户已经解锁过（isReadyRef.current 为真）时才恢复声音
        if (isReadyRef.current) {
          eng.resumeAndUnmute(); 
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []); 

  /**
   * 👑 核心方法：解锁全站感官权限
   * 由 GenesisLoading 组件在用户第一次点击屏幕时调用。
   * 它会激活 AudioContext 并启动背景音乐。
   */
  const unlockEngine = useCallback(() => {
    if (!engine || isReadyRef.current) return;
    
    engine.unlock();
    // 根据当前主题启动背景乐
    engine.switchThemeMusic(currentTheme === 'dark' ? 'darkTheme' : 'lightTheme');
    
    setIsReady(true);
    isReadyRef.current = true;
  }, [engine, currentTheme]);

  /**
   * 👑 核心方法：执行宇宙级转场（主题切换）
   * 包含声音包络线的变化、空间粒子音效的触发、以及主题状态的延迟切换。
   */
  const triggerTransition = useCallback(async (newTheme: 'dark' | 'light') => {
    if (isTransitioning || !engine || currentTheme === newTheme) return;
    
    setIsTransitioning(true);
    
    // 1. 声音进入“潜水”模式 (开启低通滤波)
    engine.setCollapseEmotion(true);
    
    // 2. 在屏幕中心触发一次空间音效
    engine.fireSpatialParticle('collapse', window.innerWidth / 2, window.innerHeight / 2, -3.0, 1.2);

    // 3. 等待视觉动画的前半段完成 (1.2s)
    await new Promise(r => setTimeout(r, 1200));
    
    // 4. 切换底层背景乐，并平滑淡入
    setCurrentTheme(newTheme);
    engine.switchThemeMusic(newTheme === 'dark' ? 'darkTheme' : 'lightTheme');

    // 5. 等待视觉动画完成 (0.8s)
    await new Promise(r => setTimeout(r, 800));
    
    // 6. 声音浮出水面 (恢复全频率)
    engine.setCollapseEmotion(false);
    setIsTransitioning(false);
  }, [engine, isTransitioning, currentTheme]);

  return (
    <SensoryContext.Provider value={{ engine, triggerTransition, currentTheme, isTransitioning, unlockEngine }}>
      {/* 👑 Awwwards 级设计准则：
        Provider 内部不应该包含任何硬编码的遮罩 UI 或按钮 UI。
        所有的感官反馈都应该无缝地注入到现有的组件（如 Header, GenesisLoading）中。
      */}
      {children}
    </SensoryContext.Provider>
  );
};

export const useSensory = () => {
  const context = useContext(SensoryContext);
  if (!context) throw new Error("useSensory must be used within GlobalSensoryProvider");
  return context;
};