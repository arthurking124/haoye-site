'use client'

type IntroStage = 'idle' | 'spinning' | 'forming' | 'revealing' | 'done'

type HomeIntroOverlayProps = {
  stage: IntroStage
  onEnter: () => void
  mobile: boolean
}

const HOUR_DEG = 0
const MINUTE_START_DEG = 40
const MINUTE_END_DEG = 90

function getMinuteDeg(stage: IntroStage) {
  if (stage === 'idle') return MINUTE_START_DEG
  if (stage === 'spinning') return MINUTE_START_DEG + 360 + (MINUTE_END_DEG - MINUTE_START_DEG)
  return MINUTE_END_DEG
}

export default function HomeIntroOverlay({ stage, onEnter, mobile }: HomeIntroOverlayProps) {
  const introVisible = stage !== 'done'
  const minuteDeg = getMinuteDeg(stage)
  const isClockVisible = stage === 'idle' || stage === 'spinning'
  const isAxisVisible = stage === 'forming' || stage === 'revealing'
  const isRevealing = stage === 'revealing'

  const overlayClassName = [
    'absolute inset-0 z-[120] bg-black transition-opacity duration-[1600ms]',
    'ease-[cubic-bezier(0.65,0,0.35,1)]',
    introVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
  ].join(' ')

  const clockClassName = [
    'absolute left-1/2 top-1/2 transition-all duration-[1200ms]',
    'ease-[cubic-bezier(0.22,1,0.36,1)]',
    mobile ? 'h-[140px] w-[140px]' : 'h-[180px] w-[180px]',
    isRevealing ? 'scale-95 opacity-0' : 'scale-100 opacity-100',
  ].join(' ')

  const bottomClassName = [
    'absolute bottom-10 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center',
    'transition-all duration-700 ease-out md:bottom-12',
    stage === 'idle'
      ? 'translate-y-0 opacity-100'
      : 'pointer-events-none translate-y-2 opacity-0',
  ].join(' ')

  return (
    <div className={overlayClassName} aria-hidden={!introVisible}>
      <div className="absolute inset-0">
        <div className={clockClassName} style={{ transform: 'translate(-50%, calc(-50% - 42px))' }}>
          <div
            className="absolute left-1/2 top-1/2 h-[120svh] w-px -translate-x-1/2 -translate-y-1/2 bg-white/90 transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: isAxisVisible
                ? 'translate(-50%, -50%) scaleY(1)'
                : 'translate(-50%, -50%) scaleY(0.09)',
              opacity: isAxisVisible ? 0.96 : 0,
              transformOrigin: 'center center',
            }}
          />

          <div
            className="absolute left-1/2 top-1/2 h-px w-[120vw] -translate-x-1/2 -translate-y-1/2 bg-white/90 transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: isAxisVisible
                ? 'translate(-50%, -50%) scaleX(1)'
                : 'translate(-50%, -50%) scaleX(0)',
              opacity: isAxisVisible ? 0.96 : 0,
              transformOrigin: 'center center',
            }}
          />

          <div
            className="absolute left-1/2 top-1/2 transition-opacity duration-[700ms] ease-out"
            style={{
              width: 2,
              height: mobile ? 42 : 54,
              transform: 'translate(-50%, -100%) rotate(' + HOUR_DEG + 'deg)',
              transformOrigin: 'bottom center',
              background: 'rgba(255,255,255,0.96)',
              borderRadius: 999,
              opacity: isClockVisible ? 0.96 : 0,
            }}
          />

          <div
            className="absolute left-1/2 top-1/2 transition-[transform,opacity] ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{
              width: 1.5,
              height: mobile ? 62 : 78,
              transform: 'translate(-50%, -100%) rotate(' + minuteDeg + 'deg)',
              transformOrigin: 'bottom center',
              background: 'rgba(255,255,255,0.98)',
              borderRadius: 999,
              opacity: isClockVisible || stage === 'forming' ? 1 : 0,
              transitionDuration: stage === 'spinning' ? '1650ms' : '700ms',
            }}
          />

          <div
            className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 transition-opacity duration-700 ease-out"
            style={{ opacity: isRevealing ? 0 : 1 }}
          />
        </div>

        <div className={bottomClassName}>
          <button
            type="button"
            onClick={onEnter}
            className="mb-8 text-[11px] uppercase tracking-[0.28em] text-white/82 underline underline-offset-[6px] transition-all duration-300 hover:-translate-y-px hover:text-white md:mb-9 md:text-[12px]"
          >
            Enter
          </button>

          <div className="text-[10px] tracking-[0.08em] text-white/20">www.haoye.cyou</div>
        </div>
      </div>
    </div>
  )
}
