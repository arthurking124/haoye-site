'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type HomeIntroOverlayProps = {
  visible: boolean
  onEnter?: (soundEnabled: boolean) => void
  onComplete?: () => void
}

type Phase = 'idle' | 'spinning' | 'fading' | 'flash'

const SPIN_START_MS = 1500
const FADE_MS = 800
const FLASH_MS = 600

export default function HomeIntroOverlay({
  visible,
  onEnter,
  onComplete,
}: HomeIntroOverlayProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const timersRef = useRef<number[]>([])

  const [degrees, setDegrees] = useState({ hour: 310, minute: 40 })
  const [isClient, setIsClient] = useState(false)

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

  useEffect(() => {
    setIsClient(true)
    if (phase !== 'idle') return

    const updateTime = () => {
      const now = new Date()
      const mins = now.getMinutes()
      const hrs = now.getHours()
      const secs = now.getSeconds()

      setDegrees({
        hour: (hrs % 12) * 30 + mins * 0.5,
        minute: mins * 6 + secs * 0.1,
      })
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [phase])

  const hourTransform = useMemo(() => {
    if (!isClient) return 'translate(-50%, -100%) rotate(310deg)'
    const rot = phase === 'spinning' ? degrees.hour + 30 : degrees.hour
    return `translate(-50%, -100%) rotate(${rot}deg)`
  }, [phase, isClient, degrees.hour])

  const minuteTransform = useMemo(() => {
    if (!isClient) return 'translate(-50%, -100%) rotate(40deg)'
    const rot = phase === 'spinning' ? degrees.minute + 360 : degrees.minute
    return `translate(-50%, -100%) rotate(${rot}deg)`
  }, [phase, isClient, degrees.minute])

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
        setPhase('flash')
      }, SPIN_START_MS + FADE_MS)
    )

    timersRef.current.push(
      window.setTimeout(() => {
        onComplete?.()
      }, SPIN_START_MS + FADE_MS + FLASH_MS)
    )
  }

  if (!visible) return null

  return (
    <div
      className={`intro ${phase}`}
      style={{
        zIndex: 120,
        position: 'absolute',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <style jsx>{`
        .intro {
          transition: background 0.8s ease;
        }

        .fading .clock-core,
        .fading .bottom-ui,
        .flash .clock-core,
        .flash .bottom-ui {
          opacity: 0 !important;
          pointer-events: none;
        }

        .portal-line {
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 2px;
          background: #ffffff;
          transform: translateY(-50%) scaleX(0);
          opacity: 0;
          z-index: 999;
          box-shadow: 0 0 30px rgba(255, 255, 255, 1),
                      0 0 60px rgba(255, 255, 255, 0.8);
        }

        .portal-line.active {
          animation: portalJump 600ms cubic-bezier(0.8, 0, 0.1, 1) forwards;
        }

        @keyframes portalJump {
          0% { transform: translateY(-50%) scaleX(0); opacity: 0; }
          20% { transform: translateY(-50%) scaleX(1); opacity: 1; height: 2px; }
          50% { transform: translateY(-50%) scaleX(1) scaleY(40); opacity: 1; }
          100% { transform: translateY(-50%) scaleX(1) scaleY(0); opacity: 0; }
        }

        .clock-core {
          position: relative;
          width: 180px;
          height: 180px;
          transform: translateY(-48px);
          transition: opacity 0.8s ease;
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
          transition: transform 1.75s cubic-bezier(0.65, 0, 0.35, 1);
        }

        .minute {
          width: 1.5px;
          height: 78px;
          transition: transform 1.75s cubic-bezier(0.65, 0, 0.35, 1);
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
        }

        .bottom-ui {
          transition: opacity 0.6s ease;
        }

        .enter {
          animation: breathe 2.6s ease-in-out infinite;
          transition: opacity 0.35s ease, transform 0.35s ease, color 0.35s ease;
        }

        .enter:hover {
          color: #fff !important;
          transform: translateY(-1px);
        }

        .enter.hide {
          opacity: 0;
          animation: none;
          pointer-events: none;
        }

        .sound-btn {
          transition: color 0.25s ease, opacity 0.25s ease, transform 0.25s ease;
        }

        .sound-btn:hover {
          color: rgba(255, 255, 255, 0.72) !important;
          transform: translateY(-1px);
        }

        .sound-btn.active {
          color: rgba(255, 255, 255, 0.88) !important;
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        /* 移动端适配，加上 !important 防止被内联样式覆盖 */
        @media (max-width: 768px) {
          .clock-core { width: 140px; height: 140px; transform: translateY(-36px); }
          .hour { height: 42px; }
          .minute { height: 62px; }
          .enter { margin-bottom: 30px !important; font-size: 11px !important; }
          .site-mark { margin-top: 12px !important; }
        }
      `}</style>

      <div 
        className={phase === 'flash' ? 'portal-line active' : 'portal-line'} 
        aria-hidden="true" 
      />

      <div className="clock-core" aria-hidden="true">
        <div className="hand hour" style={{ transform: hourTransform }} />
        <div className="hand minute" style={{ transform: minuteTransform }} />
        <div className="center-dot" />
      </div>

      <div 
        className="bottom-ui"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '40px',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20,
          textAlign: 'center',
        }}
      >
        {/* 关键：排版属性强制内联，彻底告别闪烁和不对齐 */}
        <button
          className={phase === 'idle' ? 'enter' : 'enter hide'}
          type="button"
          onClick={handleEnter}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.84)',
            cursor: 'pointer',
            padding: 0,
            margin: '0 0 34px 0',
            fontSize: '12px',
            letterSpacing: '0.26em',
            marginRight: '-0.26em', 
            textTransform: 'uppercase',
            textDecoration: 'underline',
            textUnderlineOffset: '6px',
            textDecorationThickness: '1px',
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
            gap: '24px',
            margin: 0,
            userSelect: 'none',
          }}
        >
          <div 
            className="sound-label"
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              letterSpacing: '0.08em',
              marginRight: '-0.08em',
            }}
          >
            Sound
          </div>
          
          <div 
            className="sound-controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
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
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.34)',
                fontSize: '11px',
                letterSpacing: '0.04em',
                marginRight: '-0.04em',
                textTransform: 'lowercase',
              }}
            >
              on
            </button>
            <span 
              className="sound-sep"
              style={{
                color: 'rgba(255, 255, 255, 0.22)',
                fontSize: '11px',
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
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.34)',
                fontSize: '11px',
                letterSpacing: '0.04em',
                marginRight: '-0.04em',
                textTransform: 'lowercase',
              }}
            >
              off
            </button>
          </div>
        </div>

        <div 
          className="site-mark"
          style={{
            marginTop: '14px',
            color: 'rgba(255, 255, 255, 0.18)',
            whiteSpace: 'nowrap',
            fontSize: '10px',
            letterSpacing: '0.08em',
            marginRight: '-0.08em',
          }}
        >
          ©haoye.cyou
        </div>
      </div>
    </div>
  )
}