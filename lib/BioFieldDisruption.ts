/**
 * 👑 生物场干扰系统 (SOTY 工业级重构版 V2)
 * 包含：坐标缓存 + Intersection剔除 + Mutation监听 + GPU硬件加速
 */

export interface DisruptedElement {
  element: HTMLElement
  baseX: number // 绝对页面 X 坐标缓存
  baseY: number // 绝对页面 Y 坐标缓存
  originalTransform: string
  originalFilter: string
  disturbancePhase: number
  intensity: number
  isVisible: boolean // 视口剔除标记
}

export class BioFieldDisruption {
  private static instance: BioFieldDisruption
  private disruptedElements: Map<HTMLElement, DisruptedElement> = new Map()
  
  // 光标绝对页面坐标 (含滚动偏移)
  private cursorPosition: { x: number; y: number } = { x: -9999, y: -9999 } 
  private bioFieldRadius: number = 180 
  private isActive: boolean = false
  private isLowEndDevice: boolean = false
  private animationFrameId: number | null = null

  // 👑 高阶观察者
  private intersectionObserver: IntersectionObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null

  private constructor() {
    // 探测是否为移动端/低端设备，用于优雅降级耗能特效
    if (typeof window !== 'undefined') {
      this.isLowEndDevice = 
        window.matchMedia('(pointer: coarse)').matches || 
        navigator.hardwareConcurrency <= 4
    }
  }

  static getInstance(): BioFieldDisruption {
    if (!BioFieldDisruption.instance) {
      BioFieldDisruption.instance = new BioFieldDisruption()
    }
    return BioFieldDisruption.instance
  }

  init(): void {
    if (this.isActive || typeof window === 'undefined') return
    this.isActive = true

    // 1. 绑定光标绝对追踪 (原生 clientX + 当前 scroll)
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true })
    window.addEventListener('scroll', this.handleScroll, { passive: true })

    // 2. 初始化视口剔除 (Viewport Culling)
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement
        const data = this.disruptedElements.get(target)
        if (data) data.isVisible = entry.isIntersecting
      })
    }, { rootMargin: '200px' }) // 提前 200px 唤醒

    // 3. 坐标重算引擎 (防抖 Resize)
    this.resizeObserver = new ResizeObserver(() => this.recalculateAllPositions())

    // 4. 首次扫描
    this.scanTextElements()

    // 5. 动态 DOM 注入监听 (替代 setInterval)
    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldScan = false
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true
          break
        }
      }
      if (shouldScan) this.scanTextElements()
    })
    this.mutationObserver.observe(document.body, { childList: true, subtree: true })

    // 6. 点火启动
    this.startUpdateLoop()
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.cursorPosition.x = e.clientX + window.scrollX
    this.cursorPosition.y = e.clientY + window.scrollY
  }

  private handleScroll = () => {
    // 滚动时不更新 clientX，但光标的绝对 Y 坐标发生了变化
    // 依赖 requestAnimationFrame 内实时获取的 scrollY 容易掉帧
    // 这里采用只在 mousemove 记录，让生物场在滚动时产生轻微滞后的拖拽感
  }

  private scanTextElements(): void {
    const selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'a', 'li', 'em', 'strong']
    // 使用 :not 过滤掉已经标记的元素，极速查询
    const query = selectors.map(s => `${s}:not([data-bio-tracked="true"])`).join(', ')
    
    const elements = document.querySelectorAll(query)
    elements.forEach((el) => {
      const element = el as HTMLElement

      if (!element.offsetHeight || !element.offsetWidth) return
      if (element.textContent && element.textContent.trim().length < 2) return
      // 避免干扰到 UI 功能型按钮，只干扰纯文本
      if (element.closest('nav') || element.closest('button')) return 

      this.registerElement(element)
    })
  }

  private registerElement(element: HTMLElement): void {
    // 👑 绝对坐标缓存 (The Secret Sauce)
    const rect = element.getBoundingClientRect()
    const baseX = rect.left + window.scrollX + rect.width / 2
    const baseY = rect.top + window.scrollY + rect.height / 2

    const disrupted: DisruptedElement = {
      element,
      baseX,
      baseY,
      originalTransform: window.getComputedStyle(element).transform !== 'none' ? window.getComputedStyle(element).transform : '',
      originalFilter: window.getComputedStyle(element).filter !== 'none' ? window.getComputedStyle(element).filter : '',
      disturbancePhase: Math.random() * Math.PI * 2,
      intensity: 0,
      isVisible: false
    }

    element.setAttribute('data-bio-tracked', 'true')
    element.style.willChange = 'transform' // 提示 GPU 准备加速
    
    this.disruptedElements.set(element, disrupted)
    
    // 纳入观察体系
    if (this.intersectionObserver) this.intersectionObserver.observe(element)
    if (this.resizeObserver) this.resizeObserver.observe(element)
  }

  /**
   * 当窗口改变或布局塌陷时，重新计算所有缓存坐标
   */
  private recalculateAllPositions(): void {
    this.disruptedElements.forEach((data, element) => {
      const rect = element.getBoundingClientRect()
      data.baseX = rect.left + window.scrollX + rect.width / 2
      data.baseY = rect.top + window.scrollY + rect.height / 2
    })
  }

  private startUpdateLoop(): void {
    const update = () => {
      this.updateDisruptions()
      this.animationFrameId = requestAnimationFrame(update)
    }
    this.animationFrameId = requestAnimationFrame(update)
  }

  private updateDisruptions(): void {
    const now = Date.now() * 0.001
    const { x: curX, y: curY } = this.cursorPosition
    const radiusSq = this.bioFieldRadius * this.bioFieldRadius

    this.disruptedElements.forEach((data) => {
      // 👑 性能护城河 1：视口剔除
      if (!data.isVisible) {
        if (data.intensity > 0) this.relaxElement(data)
        return
      }

      // 👑 性能护城河 2：坐标缓存数学计算 (零 DOM 访问)
      const dx = curX - data.baseX
      const dy = curY - data.baseY
      const distSq = dx * dx + dy * dy

      // 👑 性能护城河 3：空间分区剔除
      if (distSq > radiusSq) {
        if (data.intensity > 0) this.relaxElement(data)
        return
      }

      // 计算非线性物理强度
      const dist = Math.sqrt(distSq)
      let targetIntensity = 1 - dist / this.bioFieldRadius
      targetIntensity = targetIntensity * targetIntensity * targetIntensity // 立方衰减，中心极强，边缘迅速衰减

      // 平滑 Lerp (阻尼感)
      data.intensity += (targetIntensity - data.intensity) * 0.2
      data.disturbancePhase += 0.08 + data.intensity * 0.1

      this.applyDisruptionEffect(data, now)
    })
  }

  private applyDisruptionEffect(data: DisruptedElement, time: number): void {
    const { element, intensity, disturbancePhase } = data

    // 有机质感三角函数组合
    const offsetX = Math.sin(disturbancePhase + time * 3) * intensity * 4
    const offsetY = Math.cos(disturbancePhase + time * 2.5) * intensity * 3
    const rotation = Math.sin(disturbancePhase + time * 4) * intensity * 2.5
    const scale = 1 + Math.sin(disturbancePhase + time * 3.5) * intensity * 0.08

    // 👑 必须使用 translate3d 触发 GPU 独立图层
    let transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotation}deg) scale(${scale})`
    if (data.originalTransform) transform = `${data.originalTransform} ` + transform

    element.style.transform = transform

    // 👑 优雅降级：低端设备或移动端不执行极其昂贵的 Filter 和 Shadow
    if (!this.isLowEndDevice && intensity > 0.05) {
      const blur = intensity * 1.5
      const saturation = 1 + Math.sin(disturbancePhase + time * 2) * intensity * 0.4
      const hue = Math.sin(disturbancePhase + time * 5) * intensity * 30
      
      let filter = `blur(${blur}px) saturate(${saturation}) hue-rotate(${hue}deg)`
      if (data.originalFilter) filter = `${data.originalFilter} ` + filter
      
      element.style.filter = filter

      const shadowIntensity = intensity * 0.6
      element.style.textShadow = `
        ${Math.sin(disturbancePhase) * 4 * shadowIntensity}px 
        ${Math.cos(disturbancePhase) * 4 * shadowIntensity}px 
        ${6 * shadowIntensity}px 
        rgba(100, 150, 255, ${0.4 * shadowIntensity})
      `
    }
  }

  /**
   * 平滑释放元素 (当光标离开磁场)
   */
  private relaxElement(data: DisruptedElement): void {
    // 阻尼回落
    data.intensity += (0 - data.intensity) * 0.1

    if (data.intensity < 0.01) {
      data.intensity = 0
      data.element.style.transform = data.originalTransform
      data.element.style.filter = data.originalFilter
      data.element.style.textShadow = ''
    } else {
      this.applyDisruptionEffect(data, Date.now() * 0.001)
    }
  }

  setBioFieldRadius(radius: number): void {
    this.bioFieldRadius = Math.max(50, Math.min(800, radius))
  }

  dispose(): void {
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId)
    if (this.intersectionObserver) this.intersectionObserver.disconnect()
    if (this.mutationObserver) this.mutationObserver.disconnect()
    if (this.resizeObserver) this.resizeObserver.disconnect()

    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('scroll', this.handleScroll)

    this.disruptedElements.forEach((data) => {
      data.intensity = 0
      this.relaxElement(data)
      data.element.removeAttribute('data-bio-tracked')
      data.element.style.willChange = ''
    })

    this.disruptedElements.clear()
    this.isActive = false
  }
}

/**
 * React Hook：安全调用生物场
 */
export const useBioFieldDisruption = (enabled: boolean = true) => {
  if (typeof window === 'undefined') return null

  const bioField = BioFieldDisruption.getInstance()

  if (enabled && !(bioField as any)._initialized) {
    bioField.init()
    ;(bioField as any)._initialized = true
  }

  return bioField
}