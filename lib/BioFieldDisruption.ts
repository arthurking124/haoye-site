/**
 * 生物场干扰系统
 * 当「共生体」光标在文本上方移动时，会产生磁力扰动效果
 * 文字会产生微小的位移、模糊或扭曲，仿佛被生物场影响
 */

export interface DisruptedElement {
  element: HTMLElement
  originalTransform: string
  originalFilter: string
  disturbanceIntensity: number
  disturbancePhase: number
}

export class BioFieldDisruption {
  private static instance: BioFieldDisruption
  private disruptedElements: Map<HTMLElement, DisruptedElement> = new Map()
  private cursorPosition: { x: number; y: number } = { x: 0, y: 0 }
  private bioFieldRadius: number = 150 // 生物场影响半径
  private isActive: boolean = false
  private animationFrameId: number | null = null

  private constructor() {}

  static getInstance(): BioFieldDisruption {
    if (!BioFieldDisruption.instance) {
      BioFieldDisruption.instance = new BioFieldDisruption()
    }
    return BioFieldDisruption.instance
  }

  /**
   * 初始化生物场干扰系统
   */
  init(): void {
    if (this.isActive) return

    this.isActive = true

    // 监听鼠标移动
    window.addEventListener('mousemove', (e) => {
      this.cursorPosition.x = e.clientX
      this.cursorPosition.y = e.clientY
    })

    // 启动更新循环
    this.startUpdateLoop()

    // 自动扫描可干扰的文本元素
    this.scanTextElements()

    // 定期重新扫描（处理动态内容）
    setInterval(() => this.scanTextElements(), 2000)
  }

  /**
   * 扫描页面中的文本元素
   */
  private scanTextElements(): void {
    // 获取所有段落、标题、跨度等文本元素
    const selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'li']

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach((el) => {
        const element = el as HTMLElement

        // 跳过已经被追踪的元素
        if (this.disruptedElements.has(element)) return

        // 跳过隐藏或不可见的元素
        if (!element.offsetHeight || !element.offsetWidth) return

        // 跳过过小的元素
        if (element.textContent && element.textContent.length < 3) return

        // 注册这个元素
        this.registerElement(element)
      })
    })
  }

  /**
   * 注册一个元素以供干扰
   */
  private registerElement(element: HTMLElement): void {
    const disrupted: DisruptedElement = {
      element,
      originalTransform: element.style.transform || '',
      originalFilter: element.style.filter || '',
      disturbanceIntensity: 0,
      disturbancePhase: Math.random() * Math.PI * 2,
    }

    this.disruptedElements.set(element, disrupted)
  }

  /**
   * 启动更新循环
   */
  private startUpdateLoop(): void {
    const update = () => {
      this.updateDisruptions()
      this.animationFrameId = requestAnimationFrame(update)
    }
    this.animationFrameId = requestAnimationFrame(update)
  }

  /**
   * 更新所有干扰效果
   */
  private updateDisruptions(): void {
    const now = Date.now() * 0.001

    this.disruptedElements.forEach((disrupted) => {
      const rect = disrupted.element.getBoundingClientRect()
      const elementCenterX = rect.left + rect.width / 2
      const elementCenterY = rect.top + rect.height / 2

      // 计算光标到元素的距离
      const dx = this.cursorPosition.x - elementCenterX
      const dy = this.cursorPosition.y - elementCenterY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 计算干扰强度（基于距离和生物场半径）
      let intensity = 0
      if (distance < this.bioFieldRadius) {
        intensity = 1 - distance / this.bioFieldRadius
        intensity = intensity * intensity // 平方以创建更强的中心效应
      }

      disrupted.disturbanceIntensity = intensity
      disrupted.disturbancePhase += 0.05

      // 应用干扰效果
      if (intensity > 0.01) {
        this.applyDisruptionEffect(disrupted, now)
      } else {
        // 恢复原始状态
        this.restoreElement(disrupted)
      }
    })
  }

  /**
   * 应用干扰效果
   */
  private applyDisruptionEffect(disrupted: DisruptedElement, time: number): void {
    const { element, disturbanceIntensity, disturbancePhase } = disrupted

    // 计算多种干扰效果的组合
    const offsetX = Math.sin(disturbancePhase + time * 3) * disturbanceIntensity * 3
    const offsetY = Math.cos(disturbancePhase + time * 2.5) * disturbanceIntensity * 2

    // 计算旋转（微小的扭曲）
    const rotation = Math.sin(disturbancePhase + time * 4) * disturbanceIntensity * 2

    // 计算模糊（生物场的"干扰"感）
    const blur = disturbanceIntensity * 1.5

    // 计算缩放（微小的膨胀/收缩）
    const scale = 1 + Math.sin(disturbancePhase + time * 3.5) * disturbanceIntensity * 0.05

    // 应用 Transform
    const transform = `
      translate(${offsetX}px, ${offsetY}px)
      rotate(${rotation}deg)
      scale(${scale})
    `

    // 应用 Filter（模糊 + 饱和度变化）
    const saturation = 1 + Math.sin(disturbancePhase + time * 2) * disturbanceIntensity * 0.3
    const filter = `
      blur(${blur}px)
      saturate(${saturation})
      hue-rotate(${Math.sin(disturbancePhase + time * 5) * disturbanceIntensity * 20}deg)
    `

    element.style.transform = transform
    element.style.filter = filter
    element.style.transition = 'none' // 禁用过渡以保持实时性

    // 添加文字阴影以增强"生物场"感
    const shadowIntensity = disturbanceIntensity * 0.8
    element.style.textShadow = `
      ${Math.sin(disturbancePhase) * 5 * shadowIntensity}px 
      ${Math.cos(disturbancePhase) * 5 * shadowIntensity}px 
      ${5 * shadowIntensity}px 
      rgba(100, 50, 150, ${0.3 * shadowIntensity})
    `
  }

  /**
   * 恢复元素到原始状态
   */
  private restoreElement(disrupted: DisruptedElement): void {
    disrupted.element.style.transform = disrupted.originalTransform
    disrupted.element.style.filter = disrupted.originalFilter
    disrupted.element.style.textShadow = ''
    disrupted.element.style.transition = 'all 0.3s ease-out'
  }

  /**
   * 设置生物场影响半径
   */
  setBioFieldRadius(radius: number): void {
    this.bioFieldRadius = Math.max(50, Math.min(500, radius))
  }

  /**
   * 获取当前生物场半径
   */
  getBioFieldRadius(): number {
    return this.bioFieldRadius
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // 恢复所有元素
    this.disruptedElements.forEach((disrupted) => {
      this.restoreElement(disrupted)
    })

    this.disruptedElements.clear()
    this.isActive = false
  }
}

/**
 * React Hook：使用生物场干扰系统
 */
export const useBioFieldDisruption = (enabled: boolean = true) => {
  const bioField = BioFieldDisruption.getInstance()

  if (typeof window !== 'undefined' && enabled) {
    // 在客户端初始化
    if (!(bioField as any)._initialized) {
      bioField.init()
      ;(bioField as any)._initialized = true
    }
  }

  return bioField
}
