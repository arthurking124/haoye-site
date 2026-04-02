'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'haoye-sound'
const BASE_VOLUME = 0.24
const FOURTH_SCREEN_VOLUME = 0.28
const INTRO_VOLUME = 0.18

export default function SoundToggle() {
  const pathname = usePathname()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeFrameRef = useRef<number | null>(null)
  const introReadyRef = useRef(pathname !== '/')
  const currentTargetVolumeRef = useRef(BASE_VOLUME)

  const [soundEnabled, setSoundEnabled] = useState(false)
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
        } else {
          fadeFrameRef.current = null
          audio.volume = target
          onDone?.()
        }
      }

      fadeFrameRef.current = requestAnimationFrame(tick)
    },
    [clearFade]
  )

  const playAmbient = useCallback(
    async (targetVolume: number) => {
      const audio = audioRef.current
      if (!audio) return

      clearFade()

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
    [clearFade, fadeTo]
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
    setSoundEnabled(saved === 'on')
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

      if (soundEnabled) {
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
    window.addEventListener('haoye:screen-change', onScreenChange as EventListener)
    window.addEventListener('pointerdown', onUserIntent, { passive: true })
    window.addEventListener('keydown', onUserIntent)
    window.addEventListener('touchstart', onUserIntent, { passive: true })

    return () => {
      window.removeEventListener('haoye:intro-ready', onIntroReady as EventListener)
      window.removeEventListener('haoye:screen-change', onScreenChange as EventListener)
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

  return (
    <button
      onClick={toggleAudio}
      className="fixed bottom-10 right-6 z-[999] text-[11px] tracking-[0.22em] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2] md:bottom-8 md:right-8"
      type="button"
    >
      {soundEnabled ? 'Sound Off' : 'Sound On'}
    </button>
  )
}