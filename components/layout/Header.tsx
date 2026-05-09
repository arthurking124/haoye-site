'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import GhostAnchor from '@/components/ui/GhostAnchor'
import WebGLRiftCanvas from '@/components/ui/WebGLRift'
import { useSensory } from '@/components/providers/GlobalSensoryProvider'

const THEME_EVENT = 'haoye-theme-change'
const SOUND_KEY = 'haoye-sound'

const NAVS = [
  { href: '/images', label: '影', sub: 'VISIONS' },
  { href: '/poems', label: '诗', sub: 'POEMS' },
  { href: '/notes', label: '与', sub: 'NOTES' },
  { href: '/about', label: '我', sub: 'ABOUT' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false) 
  const [soundEnabled, setSoundEnabled] = useState(true)

  // 👑 获取底层引擎和全站主题状态
  const { engine, triggerTransition, currentTheme } = useSensory()

  useEffect(() => {
    // 这里不再处理 Theme 的 DOM，因为 layout.tsx 和 Provider 已经完美接管了！
    
    // 👑 声音初始化：同步 UI 状态与底层引擎状态
    const savedSound = window.localStorage.getItem(SOUND_KEY)
    const initialSoundEnabled = savedSound ? savedSound === 'on' : true
    setSoundEnabled(initialSoundEnabled)

    // 将初始状态注入底层硬件
    if (engine) {
      engine.isMuted = !initialSoundEnabled
      engine.masterGain.gain.setValueAtTime(initialSoundEnabled ? 1.0 : 0.001, engine.context.currentTime)
    }

    setMounted(true)
  }, [engine]) 

  // 情绪联动：当菜单打开或页面跳转时，声音瞬间潜入水底
  useEffect(() => {
    if (!engine) return;
    engine.setCollapseEmotion(menuOpen || isCollapsing);
  }, [menuOpen, isCollapsing, engine]);

  useEffect(() => {
    if (!mounted) return
    window.localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off')
    setMenuOpen(false); setIsCollapsing(false); document.body.style.overflow = 'auto' 
  }, [pathname, mounted, soundEnabled])

  const toggleSound = () => {
    if (engine) {
      const nextMuteState = engine.toggleMute()
      setSoundEnabled(!nextMuteState)
    }
  }

  // 👑 完美对接：接收鼠标事件，将坐标点传给 WebGL 墨染引擎
  const toggleTheme = async (e: React.MouseEvent) => {
    if (!engine || isCollapsing) return;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    
    // 引爆奇点转场！传入真实鼠标物理坐标
    await triggerTransition(newTheme, e.clientX, e.clientY)
    
    // 派发事件供其他无关组件监听（保留原有扩展性）
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: newTheme }))
  }

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    if (path === pathname) { setMenuOpen(false); document.body.style.overflow = 'auto'; return }
    
    setIsCollapsing(true)
    
    if (engine && soundEnabled) {
      engine.fireSpatialParticle('collapse', window.innerWidth / 2, window.innerHeight / 2, -1.0, 0.8)
    }
    
    setTimeout(() => { router.push(path) }, 1200)
  }

  if (!mounted || pathname === '/' || pathname === '') return null
  const isLight = currentTheme === 'light'

  const menuTextColor = isLight ? 'text-black/40 group-hover:text-black' : 'text-white/30 group-hover:text-white'
  const menuSubColor = isLight ? 'text-black/20 group-hover:text-black/60' : 'text-white/10 group-hover:text-white/60'
  const watermarkColor = isLight ? 'text-black' : 'text-white'

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <GhostAnchor id="origin" alignX="left" alignY="top" label="归" sub="ORIGIN" isLight={isLight} onClick={() => router.push('/')} icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2L22 12L12 22L2 12Z" /></svg>} />
        
        {/* 👑 点击时注入鼠标事件 (e) */}
        <GhostAnchor 
          id="theme" 
          alignX="right" 
          alignY="top" 
          label="境" 
          sub="THEME" 
          isLight={isLight} 
          // 👑 核心修复：加上大括号 {}，切断 Promise 的隐式返回
          onClick={(e) => { toggleTheme(e) }} 
          isActive={currentTheme === 'light'} 
          icon={<svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform duration-700" style={{ transform: isLight ? 'rotate(180deg)' : 'rotate(0deg)' }}><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1" /><circle cx="12" cy="4" r="1" fill="currentColor" /></svg>} 
        />
        
        <GhostAnchor id="sound" alignX="left" alignY="bottom" label="音" sub="SOUND" isLight={isLight} onClick={toggleSound} isActive={soundEnabled} icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1"><motion.line x1="6" y1="12" x2="6" y2="12" animate={{ y1: soundEnabled ? [12, 6, 12] : 12, y2: soundEnabled ? [12, 18, 12] : 12 }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} /><motion.line x1="12" y1="12" x2="12" y2="12" animate={{ y1: soundEnabled ? [12, 4, 12] : 12, y2: soundEnabled ? [12, 20, 12] : 12 }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} /><motion.line x1="18" y1="12" x2="18" y2="12" animate={{ y1: soundEnabled ? [12, 8, 12] : 12, y2: soundEnabled ? [12, 16, 12] : 12 }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} /></svg>} />
        
        <GhostAnchor id="portal" alignX="right" alignY="bottom" label={menuOpen ? '灭' : '界'} sub={menuOpen ? 'CLOSE' : 'PORTAL'} isLight={isLight} onClick={() => { if(isCollapsing) return; setMenuOpen(!menuOpen); document.body.style.overflow = menuOpen ? 'auto' : 'hidden' }} isActive={menuOpen} icon={<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1"><motion.path d="M12 4V20M4 12H20" animate={{ rotate: menuOpen ? 45 : 0, scale: menuOpen ? 1.2 : [1, 1.1, 1] }} transition={menuOpen ? { duration: 0.5, ease: "circOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }} /></svg>} />
      </div>

      <div className={`fixed inset-0 z-[85] transition-opacity duration-500 ${menuOpen || isCollapsing ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <WebGLRiftCanvas isOpen={menuOpen} theme={currentTheme} isCollapsing={isCollapsing} />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-auto">
            <nav className="flex flex-col items-center gap-8 md:gap-14">
              {NAVS.map((item, i) => (
                <div key={item.href} className="overflow-hidden">
                  <motion.div 
                    initial={{ y: '100%', opacity: 0, filter: 'blur(10px)', scale: 1 }}
                    animate={
                      isCollapsing 
                        ? { scale: 0, opacity: 0, filter: 'blur(20px)', y: '0%', transition: { duration: 0.8, ease: "anticipate" } }
                        : { y: '0%', opacity: 1, filter: 'blur(0px)', scale: 1, transition: { duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] } }
                    }
                    exit={{ y: '100%', opacity: 0, filter: 'blur(10px)' }}
                  >
                    <a href={item.href} onClick={(e) => handleNavClick(e, item.href)} className="group flex flex-col items-center relative">
                      <span className={`text-[40px] md:text-[64px] font-light tracking-[0.4em] transition-colors duration-700 ml-[0.4em] ${menuTextColor}`}>{item.label}</span>
                      <span className={`mt-2 font-mono text-[10px] md:text-[12px] tracking-[0.6em] transition-colors duration-700 ml-[0.6em] ${menuSubColor}`}>{item.sub}</span>
                      <span className={`absolute -bottom-4 left-1/2 w-0 h-[1px] -translate-x-1/2 transition-all duration-700 group-hover:w-full ${isLight ? 'bg-black/50' : 'bg-white/50'}`} />
                    </a>
                  </motion.div>
                </div>
              ))}
            </nav>
            
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={isCollapsing ? { opacity: 0, scale: 0.5, filter: 'blur(20px)' } : { opacity: 0.05, scale: 1, filter: 'blur(0px)' }} 
               transition={{ duration: isCollapsing ? 0.8 : 2, delay: isCollapsing ? 0 : 1 }}
               className={`absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10vw] font-bold tracking-[0.5em] pointer-events-none ml-[0.5em] ${watermarkColor}`}
            >
               HAOYE
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}