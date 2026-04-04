'use client'

import { useEffect, useMemo, useState } from 'react'

type HomeIntroOverlayProps = {
  visible: boolean
  onRevealStart: () => void
  onComplete: () => void
}

type IntroPhase = 'idle' | 'spin' | 'fade' | 'done'

const SPIN_MS = 1650
const FADE_MS = 900

export default function HomeIntroOverlay({
  visible,
  onRevealStart,
  onComplete,
}: HomeIntroOverlayProps) {
  const [mounted, setMounted] = useState(visible)
  const [phase, setPhase] = useState<IntroPhase>('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)

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
        setPhase('fade')
        onRevealStart()
      }, SPIN_MS)
    } else if (phase === 'fade') {
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
  }, [mounted, onComplete, onRevealStart, phase])

  const overlayHidden = phase === 'done'
  const controlsHidden = phase !== 'idle'
  const handsFading = phase === 'fade' || phase === 'done'

  const rootClassName = useMemo(() => {
    let value = 'fixed inset-0 z-[140] bg-black transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)] '
    value += overlayHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
    return value
  }, [overlayHidden])

  const enterClassName = useMemo(() => {
    let value = 'text-[12px] uppercase tracking-[0.28em] underline underline-offset-[6px] decoration-[1px] '
    value += 'transition-all duration-300 text-white/84 hover:-translate-y-px hover:text-white '
    value += controlsHidden ? 'pointer-events-none opacity-0' : 'opacity-100 animate-[pulse_2.8s_ease-in-out_infinite]'
    return value
  }, [controlsHidden])

  const hourStyle = {
    left: '50%',
    top: '50%',
    width: '2px',
    height: '58px',
    transform: 'translate(-50%, -100%) rotate(0deg)',
    transformOrigin: 'bottom center',
    opacity: handsFading ? 0 : 0.95,
    transition: 'opacity ' + FADE_MS + 'ms ease',
  } as const

  const minuteTransform = phase === 'spin'
    ? 'translate(-50%, -100%) rotate(450deg)'
    : 'translate(-50%, -100%) rotate(90deg)'

  const minuteStyle = {
    left: '50%',
    top: '50%',
    width: '2px',
    height: '84px',
    transform: minuteTransform,
    transformOrigin: 'bottom center',
    opacity: handsFading ? 0 : 0.95,
    transition:
      (phase === 'spin'
        ? 'transform ' + SPIN_MS + 'ms cubic-bezier(0.65,0,0.35,1), '
        : '') +
      'opacity ' + FADE_MS + 'ms ease',
  } as const

  if (!mounted) {
    return null
  }

  return (
    <div className={rootClassName} style={{ transitionDuration: FADE_MS + 'ms' }}>
      <div className="relative h-full w-full overflow-hidden bg-black">
        <div className="absolute inset-0">
          <div
            className="absolute rounded-full bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.18)]"
            style={hourStyle}
          />

          <div
            className="absolute rounded-full bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.18)]"
            style={minuteStyle}
          />

          <div
            className="absolute h-[4px] w-[4px] rounded-full bg-white/95"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: handsFading ? 0 : 1,
              transition: 'opacity ' + FADE_MS + 'ms ease',
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

          <div className="pointer-events-auto flex items-center gap-6 text-[11px] text-white/55 transition-opacity duration-300" style={{ opacity: controlsHidden ? 0 : 1 }}>
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

          <div className="mt-3 text-[10px] tracking-[0.08em] text-white/20 transition-opacity duration-300" style={{ opacity: controlsHidden ? 0 : 1 }}>
            www.haoye.cyou
          </div>
        </div>
      </div>
    </div>
  )
}
