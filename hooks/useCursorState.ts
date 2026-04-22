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
  const shakeAccumulator = useRef<number>(0) // 暴力甩动蓄力槽

  const updatePosition = useCallback((x: number, y: number) => {
    const state = stateRef.current
    const dx = x - state.position.x
    const dy = y - state.position.y
    state.velocity.x = dx
    state.velocity.y = dy
    state.position.x = x
    state.position.y = y

    lastMoveTime.current = Date.now()

    // 👑 触发逻辑 1：暴力甩动判定 (Angry)
    const speed = Math.sqrt(dx * dx + dy * dy)
    if (speed > 60) {
      // 速度越快，怒气积攒越快
      shakeAccumulator.current += speed * 0.05
    } else {
      // 不甩动时，怒气快速衰减
      shakeAccumulator.current = Math.max(0, shakeAccumulator.current - 1.0)
    }

    // 👑 情绪优先级结算系统
    if (shakeAccumulator.current > 25) {
      state.mood = 'angry' // 最高优先级：狂暴
    } else if (state.targetElement) {
      state.mood = 'happy' // 第二优先级：进食愉悦
    } else if (state.energy < 20) {
      state.mood = 'tired' // 第三优先级：低能疲惫
    } else {
      state.mood = 'curious' // 默认基准态：好奇探索
    }
  }, [])

  const setMood = useCallback((mood: CursorMood) => {
    stateRef.current.mood = mood
  }, [])

  const addEnergy = useCallback((amount: number) => {
    const state = stateRef.current
    state.energy = Math.min(100, Math.max(0, state.energy + amount))
    
    // 👑 触发逻辑 2：能量过载判定 (Angry)
    if (state.energy >= 95) {
      state.mood = 'angry'
      shakeAccumulator.current = 30 // 强行拉满怒气槽，强制进入暴走
    }
  }, [])

  const setTargetElement = useCallback((element: HTMLElement | null) => {
    stateRef.current.targetElement = element
    if (element) {
      stateRef.current.mood = 'happy'
    }
  }, [])

  // 👑 触发逻辑 3：新陈代谢与挂机疲惫循环
  useEffect(() => {
    const interval = setInterval(() => {
      const state = stateRef.current
      const timeIdle = Date.now() - lastMoveTime.current

      // 挂机超过 3 秒，能量开始快速流失
      if (timeIdle > 3000) {
        state.energy = Math.max(10, state.energy - 1.5)
      } else if (state.mood !== 'angry' && state.mood !== 'happy') {
        // 正常游走时，缓慢恢复能量到 80 (健康线)
        state.energy = Math.min(80, state.energy + 0.5)
      }

      // 状态自检：如果处于非交互、非暴走状态，根据能量切换疲惫/好奇
      if (shakeAccumulator.current <= 0 && !state.targetElement) {
        if (state.energy < 20) {
          state.mood = 'tired'
        } else if (state.mood === 'tired' && state.energy >= 20) {
          state.mood = 'curious'
        }
      }

      // 触手相位自然递增 (Happy时摆动更快)
      state.tentaclePhase += state.mood === 'happy' ? 0.15 : 0.05
      
      // 怒气自然冷却
      shakeAccumulator.current = Math.max(0, shakeAccumulator.current - 0.5) 

    }, 50) // 每 50ms 运算一次新陈代谢

    return () => clearInterval(interval)
  }, [])

  return { state: stateRef.current, updatePosition, setMood, addEnergy, setTargetElement }
}