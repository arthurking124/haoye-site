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
  const [isPlaying, setIsPlaying] = useState(false)
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
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)

        audio.volume = startVolume + (target - startVolume) * eased

        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(tick)
          return
        }

        fadeFrameRef.current = null
        audio.volume = target
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

  useEffect(() => {
    const audio = new Audio('/audio/ryuichi.mp3')
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

  useEffect(() => {
    if (!isHydrated) return
    window.localStorage.setItem(STORAGE_KEY, soundEnabled ? 'on' : 'off')
  }, [isHydrated, soundEnabled])

  useEffect(() => {
    introReadyRef.current = pathname !== '/'

    if (pathname !== '/' && soundEnabled) {
      void playAmbient(currentTargetVolumeRef.current)
    }
  }, [pathname, playAmbient, soundEnabled])

  useEffect(() => {
    const onIntroReady = () => {
      introReadyRef.current = true

      const saved = window.localStorage.getItem(STORAGE_KEY)
      const shouldPlay = saved ? saved === 'on' : true

      setSoundEnabled(shouldPlay)

      if (shouldPlay) {
        void playAmbient(INTRO_VOLUME)
      }
    }

    const onScreenChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ index?: number }>
      const index = customEvent.detail?.index ?? 0

      currentTargetVolumeRef.current =
        index === 3 ? FOURTH_SCREEN_VOLUME : BASE_VOLUME

      if (soundEnabled && isPlaying) {
        fadeTo(currentTargetVolumeRef.current, 1600)
      }
    }

    const onUserIntent = () => {
      if (!soundEnabled) return
      if (pathname === '/' && !introReadyRef.current) return
      if (isPlaying) return

      void playAmbient(currentTargetVolumeRef.current)
    }

    window.addEventListener('haoye:intro-ready', onIntroReady as EventListener)
    window.addEventListener(
      'haoye:screen-change',
      onScreenChange as EventListener
    )
    window.addEventListener('pointerdown', onUserIntent, { passive: true })
    window.addEventListener('keydown', onUserIntent)
    window.addEventListener('touchstart', onUserIntent, { passive: true })

    return () => {
      window.removeEventListener(
        'haoye:intro-ready',
        onIntroReady as EventListener
      )
      window.removeEventListener(
        'haoye:screen-change',
        onScreenChange as EventListener
      )
      window.removeEventListener('pointerdown', onUserIntent)
      window.removeEventListener('keydown', onUserIntent)
      window.removeEventListener('touchstart', onUserIntent)
    }
  }, [fadeTo, isPlaying, pathname, playAmbient, soundEnabled])

  const toggleAudio = async () => {
    const next = !soundEnabled
    setSoundEnabled(next)

    if (!next) {
      pauseAmbient()
      return
    }

    if (pathname === '/' && !introReadyRef.current) {
      return
    }

    await playAmbient(currentTargetVolumeRef.current)
  }

  if (!isHydrated || pathname === '/' || pathname === '') {
    return null
  }

  if (inline) {
    return (
      <button
        type="button"
        onClick={() => void toggleAudio()}
        aria-label={soundEnabled ? 'Stop music' : 'Play music'}
        title={soundEnabled ? 'Stop music' : 'Play music'}
        className="group relative flex h-[32px] w-[32px] items-center justify-center rounded-full border transition-all duration-300 ease-out hover:scale-[1.06]"
        style={{
          borderColor: 'color-mix(in srgb, var(--site-border) 88%, transparent)',
          background: 'color-mix(in srgb, var(--site-bg) 86%, transparent)',
          boxShadow: '0 0 0 rgba(255,255,255,0)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100"
          style={{
            boxShadow: '0 0 0 1px color-mix(in srgb, var(--site-text-solid) 16%, transparent), 0 0 14px color-mix(in srgb, var(--site-text-solid) 20%, transparent)',
          }}
        />
        <span
          className={
            soundEnabled
              ? 'translate-y-[-1px] text-[14px] leading-none transition-all duration-300 group-hover:opacity-85'
              : 'translate-y-[-2px] text-[14px] leading-none transition-all duration-300 group-hover:opacity-85'
          }
          style={{ color: 'var(--site-text-solid)' }}
        >
          {soundEnabled ? '～' : '—'}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void toggleAudio()}
      aria-label={soundEnabled ? 'Stop music' : 'Play music'}
      title={soundEnabled ? 'Stop music' : 'Play music'}
      className="group fixed right-[56px] top-[18px] z-[120] flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-full bg-black/92 text-white shadow-[0_6px_18px_rgba(0,0,0,0.24)] ring-1 ring-white/10 backdrop-blur-sm transition-all duration-200 ease-out hover:scale-110 hover:bg-black md:right-[74px] md:top-[20px] md:h-[28px] md:w-[28px]"
      style={{ pointerEvents: 'auto' }}
    >
      <span
        className={
          soundEnabled
            ? 'translate-y-[-1px] text-[12px] leading-none transition-transform duration-200 ease-out group-hover:scale-105 md:text-[13px]'
            : 'translate-y-[-2px] text-[12px] leading-none transition-transform duration-200 ease-out group-hover:scale-105 md:text-[13px]'
        }
      >
        {soundEnabled ? '～' : '—'}
      </span>
    </button>
  )
}
