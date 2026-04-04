'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type HomeIntroOverlayProps = {
  visible: boolean
  onEnter?: (soundEnabled: boolean) => void
  onComplete?: () => void
}

type Phase = 'idle' | 'spinning' | 'fading'

const SPIN_START_MS = 1500
const COMPLETE_MS = 2350

export default function HomeIntroOverlay({
  visible,
  onEnter,
  onComplete,
}: HomeIntroOverlayProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    if (!visible) {
      setPhase('idle')
      return
    }

    setPhase('idle')
    setSoundEnabled(true)
  }, [visible])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  const minuteTransform = useMemo(() => {
    if (phase === 'spinning') {
      return 'translate(-50%, -100%) rotate(400deg)'
    }
    return 'translate(-50%, -100%) rotate(40deg)'
  }, [phase])

  const handleEnter = () => {
    if (phase !== 'idle') return

    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []

    onEnter?.(soundEnabled)
    setPhase('spinning')

    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('fading')
      }, SPIN_START_MS)
    )

    timersRef.current.push(
      window.setTimeout(() => {
        onComplete?.()
        setPhase('idle')
      }, COMPLETE_MS)
    )
  }

  if (!visible) return null

  const isFading = phase === 'fading'
  const isIdle = phase === 'idle'

  return (
    <div
      className={`absolute inset-0 z-[120] flex items-center justify-center bg-black transition-opacity duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
        isFading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="relative h-[180px] w-[180px] -translate-y-[48px] max-md:h-[140px] max-md:w-[140px] max-md:-translate-y-[36px]"
        aria-hidden="true"
      >
        <div
          className={`absolute left-1/2 top-1/2 w-[2px] rounded-full bg-white/95 transition-opacity duration-[900ms] ease-linear max-md:h-[42px] ${
            isFading ? 'opacity-0' : 'opacity-90'
          } h-[54px]`}
          style={{
            transform: 'translate(-50%, -100%) rotate(310deg)',
            transformOrigin: 'bottom center',
          }}
        />

        <div
          className={`absolute left-1/2 top-1/2 w-[1.5px] rounded-full bg-white/95 transition-[transform,opacity] duration-[1750ms,900ms] ease-[cubic-bezier(0.65,0,0.35,1),linear] max-md:h-[62px] ${
            isFading ? 'opacity-0' : 'opacity-100'
          } h-[78px]`}
          style={{
            transform: minuteTransform,
            transformOrigin: 'bottom center',
          }}
        />

        <div
          className={`absolute left-1/2 top-1/2 h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 transition-opacity duration-[900ms] ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </div>

      <div
        className={`absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center text-center transition-opacity duration-[450ms] max-md:bottom-[34px] ${
          isFading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <button
          className={`border-none bg-transparent px-0 text-[12px] uppercase tracking-[0.26em] text-white/85 underline underline-offset-[6px] [text-decoration-thickness:1px] transition-all duration-300 hover:-translate-y-[1px] hover:text-white max-md:mb-[30px] max-md:text-[11px] ${
            isIdle ? 'animate-[intro-breathe_2.6s_ease-in-out_infinite] opacity-100' : 'pointer-events-none opacity-0'
          } mb-[34px]`}
          type="button"
          onClick={handleEnter}
        >
          Enter
        </button>

        <div
          className="flex items-center justify-center gap-6 select-none max-md:gap-[18px]"
          aria-label="sound toggle"
        >
          <div className="whitespace-nowrap text-[11px] tracking-[0.08em] text-white/60">
            Sound
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`border-none bg-transparent p-0 text-[11px] lowercase tracking-[0.04em] transition-all duration-200 hover:-translate-y-[1px] hover:text-white/70 ${
                soundEnabled ? 'text-white/90' : 'text-white/35'
              }`}
              type="button"
              onClick={() => setSoundEnabled(true)}
            >
              on
            </button>

            <span className="text-[11px] leading-none text-white/20">/</span>

            <button
              className={`border-none bg-transparent p-0 text-[11px] lowercase tracking-[0.04em] transition-all duration-200 hover:-translate-y-[1px] hover:text-white/70 ${
                !soundEnabled ? 'text-white/90' : 'text-white/35'
              }`}
              type="button"
              onClick={() => setSoundEnabled(false)}
            >
              off
            </button>
          </div>
        </div>

        <div className="mt-[14px] whitespace-nowrap text-[10px] tracking-[0.08em] text-white/20 max-md:mt-[12px]">
          ©haoye.cyou
        </div>
      </div>

      <style jsx global>{`
        @keyframes intro-breathe {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}