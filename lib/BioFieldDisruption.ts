import { SymbioteSpatialAudio } from './SymbioteSpatialAudio'
import { useEffect } from 'react'

/**
 * 👑 生物场干扰系统 (SOTY 终极完全体 V6)
 * 融合：V5 的绝对稳定架构 (防重影/漂移/脱节) + V4 的盖革脉冲通感算法
 */

export interface DisruptedElement {
  element: HTMLElement
  baseX: number
  baseY: number
  originalTransform: string
  originalFilter: string
  disturbancePhase: number
  intensity: number
  isVisible: boolean
}

export class BioFieldDisruption {
  private static instance: BioFieldDisruption
  private disruptedElements: Map<HTMLElement, DisruptedElement> = new Map()
  
  private cursorPosition: { x: number; y: number } = { x: -9999, y: -9999 }
  // 🛡️ V5 架构：滚动脱节防护
  private lastClientX: number = -9999
  private lastClientY: number = -9999 

  private bioFieldRadius: number = 180 
  private isActive: boolean = false
  private isLowEndDevice: boolean = false
  private animationFrameId: number | null = null
  
  private lastAudioTriggerTime: number = 0

  private intersectionObserver: IntersectionObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null

  private constructor() {
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

    window.addEventListener('mousemove', this.handleMouseMove, { passive: true })
    window.addEventListener('scroll', this.handleScroll, { passive: true })

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement
        const data = this.disruptedElements.get(target)
        if (data) data.isVisible = entry.isIntersecting
      })
    }, { rootMargin: '200px' })

    this.resizeObserver = new ResizeObserver(() => this.recalculateAllPositions())
    this.scanTextElements()

    this.mutationObserver = new MutationObserver((mutations) => {
      if (mutations.some(m => m.addedNodes.length > 0)) this.scanTextElements()
    })
    this.mutationObserver.observe(document.body, { childList: true, subtree: true })

    this.startUpdateLoop()
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.lastClientX = e.clientX
    this.lastClientY = e.clientY
    this.cursorPosition.x = e.clientX + window.scrollX
    this.cursorPosition.y = e.clientY + window.scrollY
  }

  // 🛡️ V5 架构：滚动绝对坐标推算
  private handleScroll = () => {
    if (this.lastClientX !== -9999) {
      this.cursorPosition.x = this.lastClientX + window.scrollX
      this.cursorPosition.y = this.lastClientY + window.scrollY
    }
  }

  private scanTextElements(): void {
    const selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'a', 'li', 'em', 'strong']
    const query = selectors.map(s => `${s}:not([data-bio-tracked="true"])`).join(', ')
    
    // 🛡️ V5 架构：嵌套免疫过滤 (Prevent Double-Transform)
    const nodes = Array.from(document.querySelectorAll(query)).filter(el => {
        return !el.parentElement?.closest('[data-bio-tracked="true"]')
    })

    nodes.forEach((el) => {
      const element = el as HTMLElement
      if (!element.offsetHeight || !element.offsetWidth) return
      if (element.textContent && element.textContent.trim().length < 2) return
      if (element.closest('nav') || element.closest('button')) return 
      this.registerElement(element)
    })
  }

  private registerElement(element: HTMLElement): void {
    const rect = element.getBoundingClientRect()
    const disrupted: DisruptedElement = {
      element,
      baseX: rect.left + window.scrollX + rect.width / 2,
      baseY: rect.top + window.scrollY + rect.height / 2,
      originalTransform: window.getComputedStyle(element).transform !== 'none' ? window.getComputedStyle(element).transform : '',
      originalFilter: window.getComputedStyle(element).filter !== 'none' ? window.getComputedStyle(element).filter : '',
      disturbancePhase: Math.random() * Math.PI * 2,
      intensity: 0,
      isVisible: false
    }
    element.setAttribute('data-bio-tracked', 'true')
    element.style.willChange = 'transform'
    this.disruptedElements.set(element, disrupted)
    if (this.intersectionObserver) this.intersectionObserver.observe(element)
    if (this.resizeObserver) this.resizeObserver.observe(element)
  }

  private recalculateAllPositions(): void {
    this.disruptedElements.forEach((data, element) => {
      // 🛡️ V5 架构：Resize 防漂移保护 (剥去扭曲计算绝对物理原点)
      element.style.transform = data.originalTransform

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
    const nowSec = Date.now() * 0.001
    const { x: curX, y: curY } = this.cursorPosition
    const radiusSq = this.bioFieldRadius * this.bioFieldRadius
    
    let totalAgitation = 0

    this.disruptedElements.forEach((data) => {
      if (!data.isVisible) {
        if (data.intensity > 0) this.relaxElement(data)
        return
      }

      const dx = curX - data.baseX
      const dy = curY - data.baseY
      const distSq = dx * dx + dy * dy

      if (distSq > radiusSq) {
        if (data.intensity > 0) this.relaxElement(data)
        return
      }

      const dist = Math.sqrt(distSq)
      let targetIntensity = 1 - dist / this.bioFieldRadius
      targetIntensity = targetIntensity * targetIntensity * targetIntensity 

      data.intensity += (targetIntensity - data.intensity) * 0.2
      data.disturbancePhase += 0.08 + data.intensity * 0.1
      
      totalAgitation += data.intensity

      this.applyDisruptionEffect(data, nowSec)
    })

    // 🌟 注入 V4 灵魂：盖革脉冲算法 (Dynamic Pulse Rate)
    if (totalAgitation > 0.5) {
      const nowMs = Date.now()
      
      // 核心公式：基于总搅动能量动态缩短冷却时间，极限锁定在 40ms
      const dynamicCooldown = Math.max(40, 250 - totalAgitation * 20)

      if (nowMs - this.lastAudioTriggerTime > dynamicCooldown) {
        const audio = SymbioteSpatialAudio.getInstance()
        
        // 强度非线性映射：让微弱搅动也能有质感，同时封顶保护耳朵
        const audioIntensity = Math.min(1.0, totalAgitation / 15)
        
        audio.playBioFieldDisruptionAtPosition(
          { x: curX - window.scrollX, y: curY - window.scrollY }, 
          audioIntensity
        )
        
        this.lastAudioTriggerTime = nowMs
      }
    }
  }

  private applyDisruptionEffect(data: DisruptedElement, time: number): void {
    const { element, intensity, disturbancePhase } = data
    const offsetX = Math.sin(disturbancePhase + time * 3) * intensity * 4
    const offsetY = Math.cos(disturbancePhase + time * 2.5) * intensity * 3
    const rotation = Math.sin(disturbancePhase + time * 4) * intensity * 2.5
    const scale = 1 + Math.sin(disturbancePhase + time * 3.5) * intensity * 0.08

    let transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotation}deg) scale(${scale})`
    if (data.originalTransform) transform = `${data.originalTransform} ` + transform
    element.style.transform = transform

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

  private relaxElement(data: DisruptedElement): void {
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
 * React Hook 初始化
 */
export const useBioFieldDisruption = (enabled: boolean = true) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return
    const bioField = BioFieldDisruption.getInstance()
    bioField.init()
  }, [enabled])

  return null
}