'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'haoye-sound'
const BASE_VOLUME = 0.24
const FOURTH_SCREEN_VOLUME = 0.28
const INTRO_VOLUME = 0.18

type SoundToggleProps = {
  inline?: boolean
}

export default function SoundToggle({ inline = false }: SoundToggleProps) {
  const pathname = usePathname()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeFrameRef = useRef<number | null>(null)
  const introReadyRef = useRef(pathname !== '/')
  const currentTargetVolumeRef = useRef(BASE_VOLUME)

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false) // 实际播放状态
  const [isHydrated, setIsHydrated] = useState(false)

  const clearFade = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current)
      fadeFrameRef.current = null
    }
  }, [])

  const fadeTo = useCallback(
    (target: number, duration: number, onDone?: () => void) => {
      const audio = audioRef.current
      if (!audio) return

      clearFade()
      const startVolume = audio.volume
      const startTime = performance.now()

      const tick = (now: number) => {
        // 这三行非常重要，用来计算动画执行的进度，不能删！
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)

        // ✅ 安全锁 1：限制过渡中的动态音量 (0 到 1 之间)
        const nextVolume = startVolume + (target - startVolume) * eased
        audio.volume = Math.max(0, Math.min(1, nextVolume))

        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(tick)
          return
        }

        // ✅ 动画结束时的收尾工作
        fadeFrameRef.current = null
        // ✅ 安全锁 2：限制最终目标音量 (0 到 1 之间)
        audio.volume = Math.max(0, Math.min(1, target))
        onDone?.()
      }
      fadeFrameRef.current = requestAnimationFrame(tick)
    },
    [clearFade]
  )

  const playAmbient = useCallback(
    async (targetVolume: number) => {
      const audio = audioRef.current
      if (!audio) return

      if (audio.paused) {
        try {
          await audio.play()
        } catch {
          setIsPlaying(false)
          return
        }
      }

      setIsPlaying(true)
      fadeTo(targetVolume, 1800)
    },
    [fadeTo]
  )

  const pauseAmbient = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    fadeTo(0, 900, () => {
      audio.pause()
      setIsPlaying(false)
    })
  }, [fadeTo])

  // 初始化音频对象，根据当前主题加载对应的 MP3
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('haoye-theme')
    const initialSrc = savedTheme === 'light' ? '/audio/ambre1.mp3' : '/audio/ryuichi.mp3'

    const audio = new Audio(initialSrc)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    audioRef.current = audio

    const saved = window.localStorage.getItem(STORAGE_KEY)
    const initialEnabled = saved ? saved === 'on' : true

    setSoundEnabled(initialEnabled)
    setIsHydrated(true)

    return () => {
      clearFade()
      audio.pause()
      audioRef.current = null
    }
  }, [clearFade])

  // 核心逻辑：内页自动播放，首页保持静默
  useEffect(() => {
    if (!isHydrated) return
    window.localStorage.setItem(STORAGE_KEY, soundEnabled ? 'on' : 'off')

    if (pathname !== '/' && soundEnabled) {
      void playAmbient(currentTargetVolumeRef.current)
    } else if (pathname === '/') {
      pauseAmbient()
    }
  }, [pathname, playAmbient, soundEnabled, isHydrated, pauseAmbient])

  // 监听主题切换事件：平滑切歌
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<'dark' | 'light'>
      const nextTheme = customEvent.detail
      
      const newSrc = nextTheme === 'light' ? '/audio/ambre1.mp3' : '/audio/ryuichi.mp3'
      const audio = audioRef.current
      
      if (!audio) return
      // 如果已经是这首歌，不重复切换
      if (audio.src.includes(newSrc)) return

      const swapAndPlay = async () => {
        audio.src = newSrc
        // 关键修复：只要 soundEnabled 是打开的，利用主题切换点击的权限强制播放
        if (soundEnabled) {
          audio.volume = 0
          try {
            await audio.play()
            setIsPlaying(true)
            fadeTo(currentTargetVolumeRef.current, 1200)
          } catch (err) {
            console.warn("Theme switch play blocked:", err)
          }
        }
      }

      if (isPlaying) {
        // 如果正在响，先淡出再换歌
        fadeTo(0, 600, () => {
          audio.pause()
          void swapAndPlay()
        })
      } else {
        // 如果之前没在响，直接换源并尝试播放
        void swapAndPlay()
      }
    }

    window.addEventListener('haoye-theme-change', handleThemeChange as EventListener)
    return () => {
      window.removeEventListener('haoye-theme-change', handleThemeChange as EventListener)
    }
  }, [fadeTo, isPlaying, soundEnabled, pathname])

  const toggleAudio = async () => {
    const next = !soundEnabled
    setSoundEnabled(next)

    if (!next) {
      pauseAmbient()
      return
    }

    if (pathname !== '/') {
      await playAmbient(currentTargetVolumeRef.current)
    }
  }

  // 仅在非首页渲染
  if (!isHydrated || pathname === '/' || pathname === '') return null

  // ... 下方 UI 代码保持原样不变 (使用 soundEnabled 显示 ～ 或 —)
  if (inline) {
    return (
      <button
        type="button"
        onClick={() => void toggleAudio()}
        aria-label={soundEnabled ? 'Stop music' : 'Play music'}
        title={soundEnabled ? 'Stop music' : 'Play music'}
        className="group relative flex h-[28px] w-[28px] items-center justify-center rounded-full border transition-all duration-300 ease-out hover:scale-[1.06]"
        style={{
          borderColor: 'color-mix(in srgb, var(--site-border) 88%, transparent)',
          background: 'color-mix(in srgb, var(--site-bg) 86%, transparent)',
          boxShadow: '0 0 0 rgba(255,255,255,0)',
        }}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100" style={{ boxShadow: '0 0 0 1px color-mix(in srgb, var(--site-text-solid) 16%, transparent), 0 0 14px color-mix(in srgb, var(--site-text-solid) 20%, transparent)' }} />
        <span className={soundEnabled ? 'translate-y-[-1px] text-[14px] leading-none transition-all duration-300 group-hover:opacity-85' : 'translate-y-[-2px] text-[14px] leading-none transition-all duration-300 group-hover:opacity-85'} style={{ color: 'var(--site-text-solid)' }}>
          {soundEnabled ? '～' : '—'}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void toggleAudio()}
      className="group fixed right-[56px] top-[18px] z-[120] flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-full bg-black/92 text-white shadow-[0_6px_18px_rgba(0,0,0,0.24)] ring-1 ring-white/10 backdrop-blur-sm transition-all duration-200 ease-out hover:scale-110 hover:bg-black md:right-[74px] md:top-[20px] md:h-[28px] md:w-[28px]"
      style={{ pointerEvents: 'auto' }}
    >
      <span className={soundEnabled ? 'translate-y-[-1px] text-[12px] leading-none' : 'translate-y-[-2px] text-[12px] leading-none'}>
        {soundEnabled ? '～' : '—'}
      </span>
    </button>
  )
}