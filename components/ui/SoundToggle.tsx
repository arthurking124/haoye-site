'use client'

import { useEffect, useRef, useState } from 'react'

export default function SoundToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const audio = new Audio('/audio/ryuichi.mp3')
    audio.loop = true
    audio.volume = 0.28
    audioRef.current = audio

    const saved = window.localStorage.getItem('haoye-sound')
    if (saved === 'on') {
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          setIsPlaying(false)
        })
    }

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('haoye-sound', isPlaying ? 'on' : 'off')
  }, [isPlaying])

  const toggleAudio = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Audio play failed:', error)
    }
  }

  return (
    <button
      onClick={toggleAudio}
      className="fixed bottom-10 right-6 z-[999] text-[11px] tracking-[0.22em] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2] md:bottom-8 md:right-8"
      type="button"
    >
      {isPlaying ? 'Sound Off' : 'Sound On'}
    </button>
  )
}
