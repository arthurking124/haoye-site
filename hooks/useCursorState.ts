import { useCallback, useRef, useEffect } from 'react'

export type CursorMood = 'tired' | 'curious' | 'happy' | 'angry'

export interface CursorState {
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  energy: number
  mood: CursorMood
  targetElement: HTMLElement | null
  filamentCount: number
  tentaclePhase: number
}

// 全局静态初始状态
const globalState: CursorState = {
  position: { x: -100, y: -100 },
  velocity: { x: 0, y: 0 },
  energy: 60,
  mood: 'curious',
  targetElement: null,
  filamentCount: 6.0,
  tentaclePhase: 0,
}

export const useCursorState = () => {
  const stateRef = useRef<CursorState>(globalState)
  const lastMoveTime = useRef<number>(Date.now())
  const shakeAccumulator = useRef<number>(0) 

  const updatePosition = useCallback((x: number, y: number) => {
    const state = stateRef.current
    const dx = x - state.position.x
    const dy = y - state.position.y
    state.velocity.x = dx
    state.velocity.y = dy
    state.position.x = x
    state.position.y = y

    lastMoveTime.current = Date.now()

    const speed = Math.sqrt(dx * dx + dy * dy)
    if (speed > 60) {
      shakeAccumulator.current += speed * 0.05
    } else {
      shakeAccumulator.current = Math.max(0, shakeAccumulator.current - 1.0)
    }

    if (shakeAccumulator.current > 25) {
      state.mood = 'angry' 
    } else if (state.targetElement) {
      state.mood = 'happy' 
    } else if (state.energy < 20) {
      state.mood = 'tired' 
    } else {
      state.mood = 'curious' 
    }
  }, [])

  const setMood = useCallback((mood: CursorMood) => {
    stateRef.current.mood = mood
  }, [])

  const addEnergy = useCallback((amount: number) => {
    const state = stateRef.current
    state.energy = Math.min(100, Math.max(0, state.energy + amount))
    
    if (state.energy >= 95) {
      state.mood = 'angry'
      shakeAccumulator.current = 30 
    }
  }, [])

  const setTargetElement = useCallback((element: HTMLElement | null) => {
    stateRef.current.targetElement = element
    if (element) {
      stateRef.current.mood = 'happy'
    }
  }, [])

  // 👑 新陈代谢与生命周期
  useEffect(() => {
    const interval = setInterval(() => {
      // 👑 终极进化 2：跨越维度的休眠机制 (Page Visibility Metabolism)
      // 当用户切换浏览器标签页时，停止代谢，并不断重置挂机时间，防止切回时瞬间暴毙
      if (typeof document !== 'undefined' && document.hidden) {
        lastMoveTime.current = Date.now()
        return
      }

      const state = stateRef.current
      const timeIdle = Date.now() - lastMoveTime.current

      if (timeIdle > 3000) {
        state.energy = Math.max(10, state.energy - 1.5)
      } else if (state.mood !== 'angry' && state.mood !== 'happy') {
        state.energy = Math.min(80, state.energy + 0.5)
      }

      if (shakeAccumulator.current <= 0 && !state.targetElement) {
        if (state.energy < 20) {
          state.mood = 'tired'
        } else if (state.mood === 'tired' && state.energy >= 20) {
          state.mood = 'curious'
        }
      }

      state.tentaclePhase += state.mood === 'happy' ? 0.15 : 0.05
      shakeAccumulator.current = Math.max(0, shakeAccumulator.current - 0.5) 

    }, 50) 

    return () => clearInterval(interval)
  }, [])

  return { state: stateRef.current, updatePosition, setMood, addEnergy, setTargetElement }
}