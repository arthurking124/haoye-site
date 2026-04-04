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

  return (
    <div
      className={phase === 'fading' ? 'intro fade-out' : 'intro'}
      style={{
        zIndex: 120,
        position: 'absolute',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style jsx>{`
        .intro {
          position: absolute;
          inset: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          transition: opacity 0.9s cubic-bezier(0.65, 0, 0.35, 1);
        }

        .intro.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .clock-core {
          position: relative;
          width: 180px;
          height: 180px;
          transform: translateY(-48px);
        }

        .hand {
          position: absolute;
          left: 50%;
          top: 50%;
          transform-origin: bottom center;
          background: rgba(255, 255, 255, 0.96);
          border-radius: 999px;
        }

        .hour {
          width: 2px;
          height: 54px;
          transform: translate(-50%, -100%) rotate(310deg);
          opacity: 0.92;
          transition: opacity 0.9s ease;
        }

        .minute {
          width: 1.5px;
          height: 78px;
          opacity: 1;
          transition:
            transform 1.75s cubic-bezier(0.65, 0, 0.35, 1),
            opacity 0.9s ease;
        }

        .intro.fade-out .hour,
        .intro.fade-out .minute,
        .intro.fade-out .center-dot,
        .intro.fade-out .bottom-ui {
          opacity: 0;
        }

        .center-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 4px;
          height: 4px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.96);
          transition: opacity 0.9s ease;
        }

        .bottom-ui {
          position: absolute;
          left: 50%;
          bottom: 40px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 20;
          text-align: center;
          transition: opacity 0.45s ease;
        }

        .enter {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.84);
          font-size: 12px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 6px;
          text-decoration-thickness: 1px;
          cursor: pointer;
          padding: 0;
          margin: 0 0 34px 0;
          animation: breathe 2.6s ease-in-out infinite;
          transition: opacity 0.35s ease, transform 0.35s ease, color 0.35s ease;
        }

        .enter:hover {
          color: #fff;
          transform: translateY(-1px);
        }

        .enter.hide {
          opacity: 0;
          animation: none;
          pointer-events: none;
        }

        .sound-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin: 0;
          user-select: none;
        }

        .sound-label {
          font-size: 11px;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
        }

        .sound-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sound-btn {
          border: none;
          background: transparent;
          padding: 0;
          margin: 0;
          color: rgba(255, 255, 255, 0.34);
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: lowercase;
          cursor: pointer;
          transition: color 0.25s ease, opacity 0.25s ease, transform 0.25s ease;
        }

        .sound-btn:hover {
          color: rgba(255, 255, 255, 0.72);
          transform: translateY(-1px);
        }

        .sound-btn.active {
          color: rgba(255, 255, 255, 0.88);
        }

        .sound-sep {
          color: rgba(255, 255, 255, 0.22);
          font-size: 11px;
          line-height: 1;
        }

        .site-mark {
          margin-top: 14px;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.18);
          white-space: nowrap;
        }

        @keyframes breathe {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .clock-core {
            width: 140px;
            height: 140px;
            transform: translateY(-36px);
          }

          .hour {
            height: 42px;
          }

          .minute {
            height: 62px;
          }

          .bottom-ui {
            bottom: 34px;
          }

          .enter {
            margin-bottom: 30px;
            font-size: 11px;
          }

          .sound-row {
            gap: 18px;
          }

          .site-mark {
            margin-top: 12px;
          }
        }
      `}</style>

      <div
        className="clock-core"
        aria-hidden="true"
        style={{
          position: 'relative',
          width: 180,
          height: 180,
          transform: 'translateY(-48px)',
        }}
      >
        <div
          className="hand hour"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transformOrigin: 'bottom center',
            background: 'rgba(255, 255, 255, 0.96)',
            borderRadius: 999,
            width: 2,
            height: 54,
            transform: 'translate(-50%, -100%) rotate(310deg)',
          }}
        />
        <div
          className="hand minute"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transformOrigin: 'bottom center',
            background: 'rgba(255, 255, 255, 0.96)',
            borderRadius: 999,
            width: 1.5,
            height: 78,
            transform: minuteTransform,
          }}
        />
        <div
          className="center-dot"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 4,
            height: 4,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.96)',
          }}
        />
      </div>

      <div
        className="bottom-ui"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 40,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20,
          textAlign: 'center',
        }}
      >
        <button
          className={phase === 'idle' ? 'enter' : 'enter hide'}
          type="button"
          onClick={handleEnter}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.84)',
            fontSize: 12,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            textDecoration: 'underline',
            textUnderlineOffset: '6px',
            textDecorationThickness: '1px',
            cursor: 'pointer',
            padding: 0,
            margin: '0 0 34px 0',
          }}
        >
          Enter
        </button>

        <div
          className="sound-row"
          aria-label="sound toggle"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            margin: 0,
            userSelect: 'none',
          }}
        >
          <div
            className="sound-label"
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.6)',
              whiteSpace: 'nowrap',
            }}
          >
            Sound
          </div>

          <div
            className="sound-controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <button
              className={soundEnabled ? 'sound-btn active' : 'sound-btn'}
              type="button"
              onClick={() => setSoundEnabled(true)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: 11,
                letterSpacing: '0.04em',
                textTransform: 'lowercase',
                cursor: 'pointer',
              }}
            >
              on
            </button>

            <span
              className="sound-sep"
              style={{
                color: 'rgba(255, 255, 255, 0.22)',
                fontSize: 11,
                lineHeight: 1,
              }}
            >
              /
            </span>

            <button
              className={!soundEnabled ? 'sound-btn active' : 'sound-btn'}
              type="button"
              onClick={() => setSoundEnabled(false)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: 11,
                letterSpacing: '0.04em',
                textTransform: 'lowercase',
                cursor: 'pointer',
              }}
            >
              off
            </button>
          </div>
        </div>

        <div
          className="site-mark"
          style={{
            marginTop: 14,
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'rgba(255, 255, 255, 0.18)',
            whiteSpace: 'nowrap',
          }}
        >
          ©haoye.cyou
        </div>
      </div>
    </div>
  )
}