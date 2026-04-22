import { SensoryEngine } from './SensoryEngine'

/**
 * 毒液光标的空间音效系统
 * 将光标位置映射到 3D 音频空间，创建极致的触觉化听感
 */

export class SymbioteSpatialAudio {
  private static instance: SymbioteSpatialAudio
  private engine: SensoryEngine
  private panner: PannerNode | null = null
  private gainNode: GainNode | null = null
  private oscillator: OscillatorNode | null = null
  private filterNode: BiquadFilterNode | null = null
  private isActive = false

  private constructor() {
    this.engine = SensoryEngine.getInstance()
  }

  static getInstance(): SymbioteSpatialAudio {
    if (!SymbioteSpatialAudio.instance) {
      SymbioteSpatialAudio.instance = new SymbioteSpatialAudio()
    }
    return SymbioteSpatialAudio.instance
  }

  /**
   * 初始化空间音频系统
   */
  async init(): Promise<void> {
    try {
      const ctx = this.engine.context
      if (!ctx) return

      // 创建音频节点
      this.gainNode = ctx.createGain()
      this.gainNode.gain.value = 0.15

      this.filterNode = ctx.createBiquadFilter()
      this.filterNode.type = 'lowpass'
      this.filterNode.frequency.value = 2500
      this.filterNode.Q.value = 1.0

      // 使用 SensoryEngine 的 PannerNode（如果可用）或创建新的
      this.panner = ctx.createPanner()
      this.panner.panningModel = 'HRTF'
      this.panner.distanceModel = 'inverse'
      this.panner.refDistance = 1
      this.panner.maxDistance = 100
      this.panner.rolloffFactor = 1.5

      // 连接音频图
      this.gainNode.connect(this.filterNode)
      this.filterNode.connect(this.panner)
      this.panner.connect(ctx.destination)

      this.isActive = true
    } catch (error) {
      console.warn('Failed to initialize SymbioteSpatialAudio:', error)
    }
  }

  /**
   * 更新光标的 3D 空间位置
   * @param screenX 屏幕 X 坐标 (0-window.innerWidth)
   * @param screenY 屏幕 Y 坐标 (0-window.innerHeight)
   * @param velocity 光标速度
   * @param mood 光标情绪
   */
  updateCursorPosition(
    screenX: number,
    screenY: number,
    velocity: { x: number; y: number },
    mood: 'happy' | 'curious' | 'angry' | 'tired'
  ): void {
    if (!this.panner || !this.gainNode || !this.filterNode) return

    const ctx = this.engine.context
    if (!ctx) return

    // 将屏幕坐标映射到 3D 空间
    // X: -1 (左) 到 1 (右)
    // Y: -1 (下) 到 1 (上)
    // Z: 0.5 (远) 到 -0.5 (近) - 基于速度
    const x = (screenX / window.innerWidth) * 2 - 1
    const y = 1 - (screenY / window.innerHeight) * 2
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
    const z = 0.5 - (speed / 1000) * 0.3 // 速度越快，声源越近

    this.panner.setPosition(x, y, z)

    // 根据速度调整音量和频率
    const volume = Math.min(0.3, speed / 1000)
    this.gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.05)

    // 根据情绪调整音色
    let filterFreq = 2500
    switch (mood) {
      case 'happy':
        filterFreq = 3500
        break
      case 'curious':
        filterFreq = 2800
        break
      case 'angry':
        filterFreq = 1500
        break
      case 'tired':
        filterFreq = 1000
        break
    }

    this.filterNode.frequency.setTargetAtTime(filterFreq, ctx.currentTime, 0.1)

    // 生成运动音效
    this.generateMotionSound(velocity, mood)
  }

  /**
   * 生成空间化的运动音效
   */
  private generateMotionSound(velocity: { x: number; y: number }, mood: 'happy' | 'curious' | 'angry' | 'tired'): void {
    if (!this.engine.context || !this.gainNode) return

    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
    if (speed < 50) return // 速度太低时不生成音效

    const ctx = this.engine.context
    const now = ctx.currentTime

    // 基础频率随速度变化
    const baseFreq = 150 + speed * 0.3
    let waveType: OscillatorType = 'sine'

    switch (mood) {
      case 'happy':
        waveType = 'sine'
        break
      case 'curious':
        waveType = 'triangle'
        break
      case 'angry':
        waveType = 'sawtooth'
        break
      case 'tired':
        waveType = 'sine'
        break
    }

    if (!this.oscillator) {
      this.oscillator = ctx.createOscillator()
      this.oscillator.type = waveType
      this.oscillator.connect(this.gainNode)
      this.oscillator.start()
    }

    this.oscillator.frequency.setTargetAtTime(baseFreq, now, 0.05)
    this.oscillator.type = waveType
  }

  /**
   * 播放空间化的"进食"音效
   * @param position 屏幕位置
   */
  playEatSoundAtPosition(position: { x: number; y: number }): void {
    if (!this.engine.context || !this.gainNode || !this.panner) return

    const ctx = this.engine.context
    const now = ctx.currentTime

    // 更新 Panner 位置到进食位置
    const x = (position.x / window.innerWidth) * 2 - 1
    const y = 1 - (position.y / window.innerHeight) * 2
    this.panner.setPosition(x, y, 0)

    // 创建短暂的上升音调
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.15)
    osc.type = 'sine'

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.connect(gain)
    gain.connect(this.gainNode)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * 播放空间化的"受伤"音效
   */
  playHurtSoundAtPosition(position: { x: number; y: number }): void {
    if (!this.engine.context || !this.gainNode || !this.panner) return

    const ctx = this.engine.context
    const now = ctx.currentTime

    // 更新 Panner 位置
    const x = (position.x / window.innerWidth) * 2 - 1
    const y = 1 - (position.y / window.innerHeight) * 2
    this.panner.setPosition(x, y, -0.3)

    // 创建下降的电流音效
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.setValueAtTime(700, now)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25)
    osc.type = 'sawtooth'

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.connect(gain)
    gain.connect(this.gainNode)

    osc.start(now)
    osc.stop(now + 0.25)
  }

  /**
   * 播放空间化的"呼吸"环境音
   */
  playBreathingSoundAtPosition(position: { x: number; y: number }, energy: number): void {
    if (!this.engine.context || !this.gainNode || !this.panner) return

    const ctx = this.engine.context
    const now = ctx.currentTime

    // 更新 Panner 位置
    const x = (position.x / window.innerWidth) * 2 - 1
    const y = 1 - (position.y / window.innerHeight) * 2
    this.panner.setPosition(x, y, 0)

    // 根据能量调整呼吸频率
    const breathRate = 0.3 + (energy / 100) * 1.2

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.value = breathRate
    osc.type = 'sine'

    // 呼吸包络
    const breathDuration = 1 / breathRate
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.08, now + breathDuration * 0.5)
    gain.gain.linearRampToValueAtTime(0, now + breathDuration)

    osc.connect(gain)
    gain.connect(this.gainNode)

    osc.start(now)
    osc.stop(now + breathDuration)
  }

  /**
   * 创建"生物场"干扰音效
   * 当光标在文本上方时，产生微弱的磁力干扰声
   */
  playBioFieldDisruptionAtPosition(position: { x: number; y: number }, intensity: number = 0.5): void {
    if (!this.engine.context || !this.gainNode || !this.panner) return

    const ctx = this.engine.context
    const now = ctx.currentTime

    // 更新 Panner 位置
    const x = (position.x / window.innerWidth) * 2 - 1
    const y = 1 - (position.y / window.innerHeight) * 2
    this.panner.setPosition(x, y, 0.2)

    // 创建多个谐波层
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      const baseFreq = 100 + i * 50
      osc.frequency.value = baseFreq
      osc.type = 'sine'

      gain.gain.setValueAtTime(0.05 * intensity, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(this.gainNode)

      osc.start(now)
      osc.stop(now + 0.3)
    }
  }

  /**
   * 停止所有音效
   */
  stop(): void {
    if (this.oscillator) {
      try {
        this.oscillator.stop()
      } catch (e) {
        // 已停止
      }
      this.oscillator = null
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stop()
    this.isActive = false
  }
}
