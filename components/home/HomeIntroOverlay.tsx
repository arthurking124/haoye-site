'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type HomeIntroOverlayProps = {
  visible: boolean
  onEnter?: (soundEnabled: boolean) => void
  onComplete?: () => void
}

// 增加了 'flash' 状态来控制白线
type Phase = 'idle' | 'spinning' | 'fading' | 'flash'

const SPIN_START_MS = 1500
const FADE_MS = 800  // 页面元素消失时间
const FLASH_MS = 400 // 白线闪烁持续时间

export default function HomeIntroOverlay({
  visible,
  onEnter,
  onComplete,
}: HomeIntroOverlayProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const timersRef = useRef<number[]>([])

  const [degrees, setDegrees] = useState({ hour: 0, minute: 0 })
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

  // 指针实时同步现实时间逻辑
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
    const baseRot = phase === 'spinning' ? degrees.hour + 30 : degrees.hour
    return `translate(-50%, -100%) rotate(${baseRot}deg)`
  }, [phase, isClient, degrees.hour])

  const minuteTransform = useMemo(() => {
    if (!isClient) return 'translate(-50%, -100%) rotate(40deg)'
    const baseRot = phase === 'spinning' ? degrees.minute + 360 : degrees.minute
    return `translate(-50%, -100%) rotate(${baseRot}deg)`
  }, [phase, isClient, degrees.minute])

  const handleEnter = () => {
    if (phase !== 'idle') return

    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []

    onEnter?.(soundEnabled)
    setPhase('spinning')

    // 第一步：指针旋转
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('fading')
      }, SPIN_START_MS)
    )

    // 第二步：UI消失，全黑
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('flash')
      }, SPIN_START_MS + FADE_MS)
    )

    // 第三步：白线闪烁并进入首页
    timersRef.current.push(
      window.setTimeout(() => {
        onComplete?.()
        // 此处不需要 reset phase，让外层卸载组件即可
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
        overflow: 'hidden'
      }}
    >
      <style jsx>{`
        .intro {
          transition: background 0.6s ease;
        }

        /* 加载UI消失 */
        .fading .clock-core, 
        .fading .bottom-ui,
        .flash .clock-core,
        .flash .bottom-ui {
          opacity: 0;
          pointer-events: none;
        }

        /* 白线闪烁动画 */
        .flash-line {
          position: absolute;
          width: 100%;
          height: 1.5px;
          background: #fff;
          opacity: 0;
          transform: scaleX(0);
          z-index: 130;
        }

        .flash .flash-line {
          animation: line-flash ${FLASH_MS}ms cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }

        @keyframes line-flash {
          0% { opacity: 0; transform: scaleX(0); }
          30% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(1.5) scaleY(0.5); }
        }

        /* 原始基础样式保持不变 */
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
          transition: transform 1.75s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.9s ease;
        }

        .minute {
          width: 1.5px;
          height: 78px;
          transition: transform 1.75s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.9s ease;
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
          transition: opacity 0.35s ease, transform 0.35s ease;
        }

        .enter.hide {
          opacity: 0;
          pointer-events: none;
        }

        .sound-row {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .sound-btn {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.34);
          font-size: 11px;
          cursor: pointer;
          transition: color 0.25s ease;
        }

        .sound-btn.active {
          color: rgba(255, 255, 255, 0.88);
        }

        .site-mark {
          margin-top: 14px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.18);
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .clock-core { width: 140px; height: 140px; }
          .hour { height: 42px; }
          .minute { height: 62px; }
        }
      `}</style>

      {/* 白线组件 */}
      <div className="flash-line" aria-hidden="true" />

      <div className="clock-core" aria-hidden="true">
        <div
          className="hand hour"
          style={{ transform: hourTransform }}
        />
        <div
          className="hand minute"
          style={{ transform: minuteTransform }}
        />
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
          <div className="sound-label" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Sound</div>
          <div className="sound-controls" style={{ display: 'flex', gap: 8 }}>
            <button className={soundEnabled ? 'sound-btn active' : 'sound-btn'} onClick={() => setSoundEnabled(true)}>on</button>
            <span style={{ color: 'rgba(255,255,255,0.22)' }}>/</span>
            <button className={!soundEnabled ? 'sound-btn active' : 'sound-btn'} onClick={() => setSoundEnabled(false)}>off</button>
          </div>
        </div>

        <div className="site-mark">©haoye.cyou</div>
      </div>
    </div>
  )
}