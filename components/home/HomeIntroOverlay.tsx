'use client'

import { useEffect, useMemo, useState } from 'react'

type HomeIntroOverlayProps = {
  visible: boolean
  onExpandStart: () => void
  onComplete: () => void
}

type IntroPhase = 'idle' | 'spin' | 'expand' | 'fade' | 'done'

const SPIN_MS = 1680
const EXPAND_MS = 2350
const FADE_MS = 620
const FRAME_LEFT = 28
const FRAME_BOTTOM = 34

export default function HomeIntroOverlay({
  visible,
  onExpandStart,
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
        setPhase('expand')
        onExpandStart()
      }, SPIN_MS)
    } else if (phase === 'expand') {
      timerId = window.setTimeout(() => {
        setPhase('fade')
      }, EXPAND_MS)
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
  }, [mounted, onComplete, onExpandStart, phase])

  const overlayHidden = phase === 'fade' || phase === 'done'
  const enterHidden = phase !== 'idle'
  const expanding = phase === 'expand' || phase === 'fade' || phase === 'done'

  const rootClassName = useMemo(() => {
    let value = 'fixed inset-0 z-[140] bg-black transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)] '
    value += overlayHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
    return value
  }, [overlayHidden])

  const enterClassName = useMemo(() => {
    let value = 'text-[12px] uppercase tracking-[0.28em] underline underline-offset-[6px] decoration-[1px] '
    value += 'transition-all duration-300 text-white/84 hover:-translate-y-px hover:text-white '
    value += enterHidden ? 'pointer-events-none opacity-0' : 'opacity-100 animate-[pulse_2.8s_ease-in-out_infinite]'
    return value
  }, [enterHidden])

  const hourStyle = useMemo(() => {
    return {
      left: expanding ? FRAME_LEFT + 'px' : '50%',
      top: expanding ? '0px' : '50%',
      width: '2px',
      height: expanding ? 'calc(100dvh - ' + FRAME_BOTTOM + 'px)' : '58px',
      transform: expanding ? 'translateX(-50%)' : 'translate(-50%, -100%)',
      transformOrigin: expanding ? 'top center' : 'bottom center',
      transition:
        'left ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'top ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'height ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'transform ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'opacity 280ms ease',
    } as const
  }, [expanding])

  const minuteStyle = useMemo(() => {
    let transform = 'translate(-50%, -100%) rotate(36deg)'
    let transformOrigin: 'bottom center' | 'left center' = 'bottom center'
    let left = '50%'
    let top = '50%'
    let width = '2px'
    let height = '84px'
    let transition = 'transform ' + SPIN_MS + 'ms cubic-bezier(0.65,0,0.35,1)'

    if (phase === 'spin') {
      transform = 'translate(-50%, -100%) rotate(450deg)'
    }

    if (expanding) {
      transform = 'translateY(-50%)'
      transformOrigin = 'left center'
      left = FRAME_LEFT + 'px'
      top = 'calc(100dvh - ' + FRAME_BOTTOM + 'px)'
      width = 'calc(100vw - ' + FRAME_LEFT * 2 + 'px)'
      height = '2px'
      transition =
        'left ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'top ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'width ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'height ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'transform ' + EXPAND_MS + 'ms cubic-bezier(0.22,1,0.36,1), ' +
        'opacity 280ms ease'
    }

    return {
      left,
      top,
      width,
      height,
      transform,
      transformOrigin,
      transition,
    } as const
  }, [expanding, phase])

  if (!mounted) {
    return null
  }

  return (
    <div
      className={rootClassName}
      style={{ transitionDuration: FADE_MS + 'ms' }}
    >
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
              opacity: expanding ? 0 : 1,
              transition: 'opacity 220ms ease',
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