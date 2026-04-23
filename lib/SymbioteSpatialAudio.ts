import { SensoryEngine } from './SensoryEngine'

/**
 * 👑 毒液光标的空间音效系统 - SOTY 巅峰性能版 (V6 终局版)
 * 包含：3D空间音频 + 颗粒合成 + 潜意识LFO呼吸 + 实时振幅分析
 * 🆕 终极优化：上下文自愈防线 + 32Hz触觉下潜 + 黏液阻尼反馈 + 完美褪音(Anti-Clicking)
 */

export class SymbioteSpatialAudio {
  private static instance: SymbioteSpatialAudio
  private engine: SensoryEngine
  
  // 核心音频节点
  private panner: PannerNode | null = null
  private gainNode: GainNode | null = null
  private filterNode: BiquadFilterNode | null = null
  private distortionNode: WaveShaperNode | null = null 
  
  // 实时振幅分析器 (反哺视觉)
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array | null = null
  
  // DSP 曲线缓存
  private angryDistortionCurve: Float32Array | null = null
  
  // 状态节点
  private oscillator: OscillatorNode | null = null
  private droneOsc: OscillatorNode | null = null
  private droneGain: GainNode | null = null
  private breathLfo: OscillatorNode | null = null

  private isActive = false
  private isInitializing = false

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
   * 非对称模拟失真算法
   */
  private makeAsymmetricDistortionCurve(amount: number): Float32Array {
    const k = amount
    const n_samples = 44100
    const curve = new Float32Array(n_samples)
    const deg = Math.PI / 180

    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1
      if (x > 0) {
        x = x - 0.1 * Math.sin(x * Math.PI)
      } else {
        x = x + 0.05 * Math.sin(x * Math.PI)
      }
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
    }
    return curve
  }

  async init(): Promise<void> {
    if (this.isActive || this.isInitializing) return 
    this.isInitializing = true

    try {
      const ctx = this.engine.context
      if (!ctx) return

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      this.angryDistortionCurve = this.makeAsymmetricDistortionCurve(300)

      this.gainNode = ctx.createGain()
      this.gainNode.gain.value = 0.15

      this.filterNode = ctx.createBiquadFilter()
      this.filterNode.type = 'lowpass'
      this.filterNode.frequency.value = 2500
      this.filterNode.Q.value = 1.0

      this.distortionNode = ctx.createWaveShaper()
      this.distortionNode.curve = null 
      this.distortionNode.oversample = '4x'

      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)

      this.panner = ctx.createPanner()
      this.panner.panningModel = 'HRTF'
      this.panner.distanceModel = 'inverse'
      this.panner.refDistance = 1
      this.panner.maxDistance = 100
      this.panner.rolloffFactor = 1.5

      // 👑 优化 2：下潜至 32Hz，产生压抑的深渊震动感
      this.droneOsc = ctx.createOscillator()
      this.droneOsc.type = 'sine'
      this.droneOsc.frequency.value = 32 
      
      this.droneGain = ctx.createGain()
      this.droneGain.gain.value = 0 
      
      this.breathLfo = ctx.createOscillator()
      this.breathLfo.type = 'sine'
      this.breathLfo.frequency.value = 0.15 
      
      const lfoDepth = ctx.createGain()
      lfoDepth.gain.value = 0.1 

      this.breathLfo.connect(lfoDepth)
      lfoDepth.connect(this.droneGain.gain)
      this.droneOsc.connect(this.droneGain)
      this.droneGain.connect(this.distortionNode) 

      this.breathLfo.start()
      this.droneOsc.start()

      // 组装主干音频图
      this.gainNode.connect(this.filterNode)
      this.filterNode.connect(this.distortionNode)
      this.distortionNode.connect(this.analyser)
      this.distortionNode.connect(this.panner)
      this.panner.connect(ctx.destination)

      this.isActive = true
    } catch (error) {
      console.warn('共生体听觉引擎初始化失败:', error)
    } finally {
      this.isInitializing = false
    }
  }

  getAmplitude(): number {
    if (!this.analyser || !this.dataArray) return 0
    this.analyser.getByteTimeDomainData(this.dataArray as any)
    
    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      const v = (this.dataArray[i] - 128) / 128
      sum += v * v
    }
    return Math.sqrt(sum / this.dataArray.length)
  }

  updateCursorPosition(
    screenX: number,
    screenY: number,
    velocity: { x: number; y: number },
    mood: 'happy' | 'curious' | 'angry' | 'tired'
  ): void {
    if (!this.isActive || !this.panner || !this.gainNode || !this.filterNode || !this.distortionNode) return

    const ctx = this.engine.context
    if (!ctx) return 

    // 👑 优化 1：音频上下文自愈防线 (防挂起哑巴)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const x = (screenX / window.innerWidth) * 2 - 1
    const y = 1 - (screenY / window.innerHeight) * 2
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
    const z = 0.5 - (speed / 1000) * 0.3 

    this.panner.setPosition(x, y, z)

    // 👑 优化 3 衍生：运动音量也增加一点阻尼感 (从 0.05 增至 0.1)
    const volume = Math.min(0.25, speed / 1000)
    this.gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.1)

    let filterFreq = 2000
    let resonance = 1.0
    
    this.distortionNode.curve = null 
    
    if (this.droneGain) {
      if (mood === 'tired' && speed < 20) {
        this.droneGain.gain.setTargetAtTime(0.15, ctx.currentTime, 3.0) 
      } else {
        this.droneGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.5) 
      }
    }

    switch (mood) {
      case 'happy': filterFreq = 2500; break
      case 'curious': filterFreq = 1800; break
      case 'angry':
        filterFreq = 800
        resonance = 8.0  
        this.distortionNode.curve = this.angryDistortionCurve as any
        break
      case 'tired': filterFreq = 500; break
    }

    this.filterNode.frequency.setTargetAtTime(filterFreq, ctx.currentTime, 0.1)
    this.filterNode.Q.setTargetAtTime(resonance, ctx.currentTime, 0.1)

    this.generateMotionSound(velocity, mood)
  }

  private generateMotionSound(velocity: { x: number; y: number }, mood: 'happy' | 'curious' | 'angry' | 'tired'): void {
    if (!this.isActive || !this.engine.context || !this.gainNode) return
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
    if (speed < 50) return 

    const ctx = this.engine.context
    const now = ctx.currentTime
    const baseFreq = 100 + speed * 0.2
    let waveType: OscillatorType = 'sine'

    switch (mood) {
      case 'happy': waveType = 'sine'; break
      case 'curious': waveType = 'triangle'; break
      case 'angry': waveType = 'triangle'; break 
      case 'tired': waveType = 'sine'; break
    }

    if (!this.oscillator) {
      this.oscillator = ctx.createOscillator()
      this.oscillator.type = waveType
      this.oscillator.connect(this.gainNode)
      this.oscillator.start()
    }

    // 👑 优化 3：强化动态物理阻尼 (时间常数从 0.05 -> 0.15，模拟浓稠毒液中的拖拽)
    this.oscillator.frequency.setTargetAtTime(baseFreq, now, 0.15)
    this.oscillator.type = waveType
  }

  playEatSoundAtPosition(position: { x: number; y: number }): void {
    if (!this.isActive || !this.engine.context || !this.gainNode || !this.panner) return
    const ctx = this.engine.context
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime
    const x = (position.x / window.innerWidth) * 2 - 1
    const y = 1 - (position.y / window.innerHeight) * 2
    this.panner.setPosition(x, y, 0)

    const grainCount = 8
    for (let i = 0; i < grainCount; i++) {
      const timeOffset = Math.random() * 0.1 
      const grainOsc = ctx.createOscillator()
      const grainGain = ctx.createGain()

      const randomFreq = 150 + Math.random() * 300 
      grainOsc.type = 'sine' 
      grainOsc.frequency.setValueAtTime(randomFreq, now + timeOffset)
      grainOsc.frequency.exponentialRampToValueAtTime(50, now + timeOffset + 0.05)

      grainGain.gain.setValueAtTime(0, now + timeOffset)
      grainGain.gain.linearRampToValueAtTime(0.1, now + timeOffset + 0.01) 
      grainGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.08) 

      grainOsc.connect(grainGain)
      if (this.distortionNode) grainGain.connect(this.distortionNode) 

      const endTime = now + timeOffset + 0.1
      grainOsc.start(now + timeOffset)
      grainOsc.stop(endTime)

      grainOsc.onended = () => {
        grainOsc.disconnect()
        grainGain.disconnect()
      }
    }
  }

  playHurtSoundAtPosition(position: { x: number; y: number }): void {
    if (!this.isActive || !this.engine.context || !this.gainNode || !this.panner) return
    const ctx = this.engine.context
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime
    
    const x = (position.x / window.innerWidth) * 2 - 1
    const y = 1 - (position.y / window.innerHeight) * 2
    this.panner.setPosition(x, y, -0.3)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.setValueAtTime(400, now) 
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25)
    osc.type = 'triangle'

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(gain)
    gain.connect(this.gainNode)

    const endTime = now + 0.3
    osc.start(now)
    osc.stop(endTime)

    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
    }
  }

  playBioFieldDisruptionAtPosition(position: { x: number; y: number }, intensity: number = 0.5): void {
    if (!this.isActive || !this.engine.context || !this.gainNode || !this.panner) return
    const ctx = this.engine.context
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime

    const x = (position.x / window.innerWidth) * 2 - 1
    const y = 1 - (position.y / window.innerHeight) * 2
    this.panner.setPosition(x, y, 0.2)

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      const baseFreq = 80 + i * 40 
      osc.frequency.value = baseFreq
      osc.type = 'sine'

      gain.gain.setValueAtTime(0.03 * intensity, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(this.gainNode)

      const endTime = now + 0.35
      osc.start(now)
      osc.stop(endTime)

      osc.onended = () => {
        osc.disconnect()
        gain.disconnect()
      }
    }
  }

  stop(): void {
    const ctx = this.engine.context
    if (!ctx) return
    
    const now = ctx.currentTime

    // 👑 优化 4：完美 Fade-out，在彻底销毁节点前先平滑将增益降至极低，彻底解决金属爆音
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(0.001, now, 0.02)
    }
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(0.001, now, 0.02)
    }

    const stopTime = now + 0.05

    if (this.oscillator) {
      try { 
        this.oscillator.stop(stopTime) 
        const osc = this.oscillator
        osc.onended = () => osc.disconnect()
      } catch (e) {}
      this.oscillator = null
    }
    if (this.breathLfo) {
      try { 
        this.breathLfo.stop(stopTime) 
        const lfo = this.breathLfo
        lfo.onended = () => lfo.disconnect()
      } catch (e) {}
      this.breathLfo = null
    }
    if (this.droneOsc) {
      try { 
        this.droneOsc.stop(stopTime) 
        const drone = this.droneOsc
        drone.onended = () => drone.disconnect()
      } catch (e) {}
      this.droneOsc = null
    }
  }

  dispose(): void {
    this.stop()
    // 延迟断开常驻增益与分析器节点，确保 Fade-out 完成
    setTimeout(() => {
      if (this.droneGain) {
         this.droneGain.disconnect()
         this.droneGain = null
      }
      if (this.analyser) {
        this.analyser.disconnect()
        this.analyser = null
      }
    }, 100)
    
    this.isActive = false
  }
}