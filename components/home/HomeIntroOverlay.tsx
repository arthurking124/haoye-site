'use client'

import { useEffect, useMemo, useState } from 'react'

type HomeIntroOverlayProps = {
  visible: boolean
  onExpandStart: () => void
  onComplete: () => void
}

type IntroPhase = 'idle' | 'spin' | 'expand' | 'fade' | 'done'

const SPIN_MS = 1650
const EXPAND_MS = 2050
const FADE_MS = 720

export default function HomeIntroOverlay({
  visible,
  onExpandStart,
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
        setPhase('expand')
        onExpandStart()
      }, SPIN_MS)
    }

    if (phase === 'expand') {
      timerId = window.setTimeout(() => {
        setPhase('fade')
      }, EXPAND_MS)
    }

    if (phase === 'fade') {
      timerId = window.setTimeout(() => {
        setPhase('done')
        onComplete()
      }, FADE_MS)
    }

    return () => {
      if (typeof timerId === 'number') {
        window.clearTimeout(timerId)
      }
    }
  }, [mounted, onComplete, onExpandStart, phase])

  const enterHidden = phase !== 'idle'
  const overlayFading = phase === 'fade' || phase === 'done'
  const frameActive = phase === 'expand' || phase === 'fade' || phase === 'done'
  const minuteRotation = phase === 'idle' ? 'rotate(38deg)' : 'rotate(450deg)'

  const overlayClassName = useMemo(() => {
    let value = 'fixed inset-0 z-[140] bg-black transition-opacity duration-[720ms] ease-[cubic-bezier(0.22,1,0.36,1)] '
    value += overlayFading ? 'pointer-events-none opacity-0' : 'opacity-100'
    return value
  }, [overlayFading])

  const enterClassName = useMemo(() => {
    let value = 'text-[12px] uppercase tracking-[0.26em] underline underline-offset-[6px] decoration-[1px] '
    value += 'transition-all duration-300 text-white/84 hover:-translate-y-px hover:text-white '
    value += enterHidden ? 'pointer-events-none opacity-0' : 'opacity-100 animate-[pulse_2.8s_ease-in-out_infinite]'
    return value
  }, [enterHidden])

  if (!mounted) {
    return null
  }

  return (
    <div className={overlayClassName}>
      <div className="relative h-full w-full overflow-hidden bg-black">
        <div className="absolute inset-0">
          <div
            className="absolute rounded-full bg-white/95"
            style={{
              left: frameActive ? '28px' : '50%',
              top: frameActive ? '0px' : '50%',
              width: '2px',
              height: frameActive ? 'calc(100dvh - 34px)' : '58px',
              transform: frameActive ? 'translateX(-50%)' : 'translate(-50%, -100%)',
              transformOrigin: frameActive ? 'top center' : 'bottom center',
              transition:
                'left 2050ms cubic-bezier(0.22,1,0.36,1), top 2050ms cubic-bezier(0.22,1,0.36,1), height 2050ms cubic-bezier(0.22,1,0.36,1), transform 2050ms cubic-bezier(0.22,1,0.36,1), opacity 480ms ease',
            }}
          />

          <div
            className="absolute rounded-full bg-white/95"
            style={{
              left: frameActive ? '28px' : '50%',
              bottom: frameActive ? '34px' : '50%',
              width: frameActive ? 'calc(100vw - 56px)' : '1.5px',
              height: frameActive ? '2px' : '84px',
              transform: frameActive
                ? 'translateX(0) translateY(50%) rotate(0deg)'
                : 'translate(-50%, 50%) ' + minuteRotation,
              transformOrigin: frameActive ? 'left center' : 'bottom center',
              transition: frameActive
                ? 'left 2050ms cubic-bezier(0.22,1,0.36,1), bottom 2050ms cubic-bezier(0.22,1,0.36,1), width 2050ms cubic-bezier(0.22,1,0.36,1), height 520ms ease, transform 2050ms cubic-bezier(0.22,1,0.36,1), opacity 480ms ease'
                : 'transform 1650ms cubic-bezier(0.65,0,0.35,1)',
            }}
          />

          <div
            className="absolute left-1/2 top-1/2 rounded-full bg-white/95"
            style={{
              width: '4px',
              height: '4px',
              transform: 'translate(-50%, -50%)',
              opacity: frameActive ? 0 : 1,
              transition: 'opacity 420ms ease',
            }}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-9 z-10 flex flex-col items-center text-center sm:bottom-10">
          <div className="pointer-events-auto mb-8 sm:mb-9">
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
