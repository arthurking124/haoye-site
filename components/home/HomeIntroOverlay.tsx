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
const FLASH_MS = 600 // 稍微延长，确保肉眼清晰捕捉到“穿越”瞬间

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

    // 转完一圈，UI褪去
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('fading')
      }, SPIN_START_MS)
    )

    // 触发闪烁
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('flash')
      }, SPIN_START_MS + FADE_MS)
    )

    // 闪烁结束，进入主页
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

        /* UI 褪色控制 */
        .fading .clock-core,
        .fading .bottom-ui,
        .flash .clock-core,
        .flash .bottom-ui {
          opacity: 0 !important;
          pointer-events: none;
        }

        /* --- 穿越光线基础样式 --- */
        .portal-line {
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 2px;
          background: #ffffff;
          transform: translateY(-50%) scaleX(0);
          opacity: 0;
          z-index: 999; /* 强制最高层级 */
          box-shadow: 0 0 30px rgba(255, 255, 255, 1),
                      0 0 60px rgba(255, 255, 255, 0.8);
        }

        /* --- 触发闪烁动画 --- */
        .portal-line.active {
          animation: portalJump 600ms cubic-bezier(0.8, 0, 0.1, 1) forwards;
        }

        @keyframes portalJump {
          0% {
            transform: translateY(-50%) scaleX(0);
            opacity: 0;
          }
          20% {
            /* 极速向两侧展开成一条线 */
            transform: translateY(-50%) scaleX(1);
            opacity: 1;
            height: 2px;
          }
          50% {
            /* 瞬间上下拉伸，形成爆亮 */
            transform: translateY(-50%) scaleX(1) scaleY(40);
            opacity: 1;
          }
          100% {
            /* 坍缩并消失 */
            transform: translateY(-50%) scaleX(1) scaleY(0);
            opacity: 0;
          }
        }

        /* 原有样式保留 */
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
          position: absolute;
          left: 50%;
          bottom: 40px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 20;
          text-align: center;
          transition: opacity 0.6s ease;
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

      {/* 注意这里：直接通过 class 控制动画触发 */}
      <div 
        className={phase === 'flash' ? 'portal-line active' : 'portal-line'} 
        aria-hidden="true" 
      />

      <div className="clock-core" aria-hidden="true">
        <div className="hand hour" style={{ transform: hourTransform }} />
        <div className="hand minute" style={{ transform: minuteTransform }} />
        <div className="center-dot" />
      </div>

      <div className="bottom-ui">
        <button
          className={phase === 'idle' ? 'enter' : 'enter hide'}
          type="button"
          onClick={handleEnter}
        >
          Enter
        </button>

        <div className="sound-row" aria-label="sound toggle">
          <div className="sound-label">Sound</div>
          <div className="sound-controls">
            <button
              className={soundEnabled ? 'sound-btn active' : 'sound-btn'}
              type="button"
              onClick={() => setSoundEnabled(true)}
            >
              on
            </button>
            <span className="sound-sep">/</span>
            <button
              className={!soundEnabled ? 'sound-btn active' : 'sound-btn'}
              type="button"
              onClick={() => setSoundEnabled(false)}
            >
              off
            </button>
          </div>
        </div>

        <div className="site-mark">©haoye.cyou</div>
      </div>
    </div>
  )
}