'use client'

import { useEffect, useMemo, useState } from 'react'

type HomeIntroOverlayProps = {
  visible: boolean
  onRevealStart: () => void
  onComplete: () => void
}

type IntroPhase = 'idle' | 'spin' | 'cross' | 'reveal' | 'done'

const SPIN_MS = 1650
const CROSS_MS = 1100
const REVEAL_MS = 950

export default function HomeIntroOverlay({
  visible,
  onRevealStart,
  onComplete,
}: HomeIntroOverlayProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [phase, setPhase] = useState<IntroPhase>('idle')
  const [mounted, setMounted] = useState(visible)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      setPhase('idle')
      return
    }

    setMounted(false)
  }, [visible])

  useEffect(() => {
    if (!mounted) return

    let timerId: number | undefined

    if (phase === 'spin') {
      timerId = window.setTimeout(() => {
        setPhase('cross')
      }, SPIN_MS)
    }

    if (phase === 'cross') {
      timerId = window.setTimeout(() => {
        setPhase('reveal')
        onRevealStart()
      }, CROSS_MS)
    }

    if (phase === 'reveal') {
      timerId = window.setTimeout(() => {
        setPhase('done')
        onComplete()
      }, REVEAL_MS)
    }

    return () => {
      if (typeof timerId === 'number') {
        window.clearTimeout(timerId)
      }
    }
  }, [mounted, onComplete, onRevealStart, phase])

  const enterHidden = phase !== 'idle'
  const overlayFading = phase === 'reveal' || phase === 'done'
  const crossActive = phase === 'cross' || phase === 'reveal' || phase === 'done'
  const minuteRotation = phase === 'idle' ? 'rotate(40deg)' : 'rotate(450deg)'

  const wrapperClassName = useMemo(() => {
    let value = 'fixed inset-0 z-[120] bg-black transition-opacity duration-[950ms] ease-[cubic-bezier(0.19,1,0.22,1)] '
    value += overlayFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
    return value
  }, [overlayFading])

  const enterClassName = useMemo(() => {
    let value = 'text-[12px] uppercase tracking-[0.26em] underline underline-offset-[6px] decoration-[1px] transition-all duration-300 '
    value += 'text-white/80 hover:-translate-y-px hover:text-white '
    value += enterHidden ? 'pointer-events-none opacity-0' : 'opacity-100 animate-[pulse_2.8s_ease-in-out_infinite]'
    return value
  }, [enterHidden])

  if (!mounted) {
    return null
  }

  return (
    <div className={wrapperClassName}>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div className="relative -translate-y-10">
          <div className="relative h-[180px] w-[180px] sm:h-[200px] sm:w-[200px]">
            <div
              className="absolute left-1/2 top-1/2 rounded-full bg-white/95"
              style={{
                width: '2px',
                height: crossActive ? 'min(50vh, 420px)' : '54px',
                transform: 'translate(-50%, -100%) rotate(0deg)',
                transformOrigin: 'bottom center',
                transition:
                  'height 1.05s cubic-bezier(0.19,1,0.22,1), opacity 0.6s ease',
              }}
            />

            <div
              className="absolute left-1/2 top-1/2 rounded-full bg-white/95"
              style={{
                width: crossActive ? 'min(72vw, 760px)' : '1.5px',
                height: crossActive ? '2px' : '78px',
                transform: crossActive
                  ? 'translate(-50%, -50%) rotate(0deg)'
                  : 'translate(-50%, -100%) ' + minuteRotation,
                transformOrigin: crossActive ? 'center center' : 'bottom center',
                transition: crossActive
                  ? 'width 1.05s cubic-bezier(0.19,1,0.22,1), height 0.55s ease, transform 1.05s cubic-bezier(0.19,1,0.22,1)'
                  : 'transform 1.65s cubic-bezier(0.65,0,0.35,1)',
              }}
            />

            <div
              className="absolute left-1/2 top-1/2 rounded-full bg-white/95"
              style={{
                width: '4px',
                height: '4px',
                transform: 'translate(-50%, -50%)',
                opacity: crossActive ? 0.85 : 1,
                transition: 'opacity 0.7s ease',
              }}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-9 z-10 flex flex-col items-center justify-center text-center">
          <div className="pointer-events-auto mb-8">
            <button
              type="button"
              className={enterClassName}
              onClick={() => {
                if (phase !== 'idle') return
                setPhase('spin')
              }}
            >
              Enter
            </button>
          </div>

          <div className="pointer-events-auto flex items-center gap-6 text-[11px] text-white/55">
            <span>Sound</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={soundEnabled ? 'text-white/90 transition-colors' : 'text-white/35 transition-colors'}
                onClick={() => setSoundEnabled(true)}
              >
                on
              </button>
              <span className="text-white/25">/</span>
              <button
                type="button"
                className={!soundEnabled ? 'text-white/90 transition-colors' : 'text-white/35 transition-colors'}
                onClick={() => setSoundEnabled(false)}
              >
                off
              </button>
            </div>
          </div>

          <div className="mt-3 text-[10px] tracking-[0.08em] text-white/20">
            www.haoye.cyou
          </div>
        </div>
      </div>
    </div>
  )
}
