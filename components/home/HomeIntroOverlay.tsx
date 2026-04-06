'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type HomeIntroOverlayProps = {
  visible: boolean
  onEnter?: (soundEnabled: boolean) => void
  onComplete?: () => void
}

// 增加 flash 阶段
type Phase = 'idle' | 'spinning' | 'fading' | 'flash'

const SPIN_START_MS = 1500
const FADE_MS = 800
const FLASH_MS = 450

export default function HomeIntroOverlay({
  visible,
  onEnter,
  onComplete,
}: HomeIntroOverlayProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const timersRef = useRef<number[]>([])

  // 记录真实的度数
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

  // 核心逻辑：后台实时自动同步现实时间
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

  // 时针和分针的角度计算（点击后加速旋转）
  const hourTransform = useMemo(() => {
    if (!isClient) return 'translate(-50%, -100%) rotate(310deg)'
    const rot = phase === 'spinning' ? degrees.hour + 30 : degrees.hour
    return `translate(-50%, -100%) rotate(${rot}deg)`
  }, [phase, isClient, degrees.hour])

  const minuteTransform = useMemo(() => {
    if (!isClient) return 'translate(-50%, -100%) rotate(40deg)'
    // 点击Enter后，分针额外旋转360度
    const rot = phase === 'spinning' ? degrees.minute + 360 : degrees.minute
    return `translate(-50%, -100%) rotate(${rot}deg)`
  }, [phase, isClient, degrees.minute])

  const handleEnter = () => {
    if (phase !== 'idle') return

    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []

    onEnter?.(soundEnabled)
    setPhase('spinning')

    // 阶段1：转完一圈后，开始褪去UI（变黑）
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('fading')
      }, SPIN_START_MS)
    )

    // 阶段2：全黑后，触发白线闪烁（穿越效果）
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('flash')
      }, SPIN_START_MS + FADE_MS)
    )

    // 阶段3：闪烁结束，彻底进入首页
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

        /* 控制褪色时的隐藏逻辑 */
        .fading .clock-core,
        .fading .bottom-ui,
        .flash .clock-core,
        .flash .bottom-ui {
          opacity: 0 !important;
          pointer-events: none;
        }

        /* 穿越闪烁的主线条 */
        .portal-line {
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 2px;
          background: #ffffff;
          transform: translateY(-50%) scaleX(0);
          opacity: 0;
          z-index: 150;
          /* 核心光晕效果 */
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.9),
                      0 0 40px rgba(255, 255, 255, 0.6);
        }

        /* 触发闪烁动画 */
        .flash .portal-line {
          animation: portal-jump ${FLASH_MS}ms cubic-bezier(0.8, 0, 0.1, 1) forwards;
        }

        @keyframes portal-jump {
          0% {
            transform: translateY(-50%) scaleX(0);
            opacity: 0;
          }
          40% {
            transform: translateY(-50%) scaleX(1);
            opacity: 1;
            height: 2px;
          }
          100% {
            /* 瞬间上下拉升并消失 */
            transform: translateY(-50%) scaleX(1) scaleY(20);
            opacity: 0;
          }
        }

        /* 以下为保留的原版 CSS */
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

      {/* 核心穿越光效元素 */}
      <div className="portal-line" aria-hidden="true" />

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