'use client'

import { useEffect, useRef } from 'react'

/**
 * 极致水墨写意双鱼 (v6 - 水流材质同步版)
 * 1. 色彩同步：黑鱼采用水流“深渊黑” (0.015, 0.015, 0.02)
 * 2. 色彩同步：白鱼采用水流“晨曦白” (0.96, 0.94, 0.91)
 * 3. 风格：延续写意鱼头、侧生胸鳍、飘逸丝绸长尾
 */

export default function InkFishes() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const mouse = { x: -1000, y: -1000, vx: 0, vy: 0 }
    const lastMouse = { x: -1000, y: -1000 }

    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.x = mouse.x
      lastMouse.y = mouse.y
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.vx = mouse.x - lastMouse.x
      mouse.vy = mouse.y - lastMouse.y
    }

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    class InkFish {
      isBlack: boolean
      x: number
      y: number
      vx: number
      vy: number
      segments: { x: number; y: number; angle: number }[]
      numSegments = 24
      
      config = {
        bodyLen: 115,
        bodyWidth: 24,
        headRoundness: 0.85,
        tailSharpness: 0.85,
        finScale: 0.75,
        finAngle: 45,
        tailLength: 85,       // 稍微加长尾巴，更显飘逸
        tailSpread: 45,
        fearRadius: 180,
        fearForce: 3.5,
      }
      
      segLength: number

      constructor(isBlack: boolean) {
        this.isBlack = isBlack
        this.segLength = this.config.bodyLen / this.numSegments
        const startAngle = isBlack ? 0 : Math.PI
        this.x = width / 2 + Math.cos(startAngle) * 200
        this.y = height / 2 + Math.sin(startAngle) * 200
        this.vx = 0
        this.vy = 0
        this.segments = Array.from({ length: this.numSegments }, () => ({ x: this.x, y: this.y, angle: 0 }))
      }

      update(time: number) {
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) * 0.25
        const speed = 0.0006
        
        const targetX = centerX + Math.cos(time * speed + (this.isBlack ? 0 : Math.PI)) * radius
        const targetY = centerY + Math.sin(time * speed + (this.isBlack ? 0 : Math.PI)) * radius

        let ax = (targetX - this.x) * 0.0015
        let ay = (targetY - this.y) * 0.0015

        const dx = this.x - mouse.x
        const dy = this.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < this.config.fearRadius) {
          const power = Math.pow((this.config.fearRadius - dist) / this.config.fearRadius, 2)
          ax += (dx / dist) * power * this.config.fearForce
          ay += (dy / dist) * power * this.config.fearForce
        }

        this.vx += ax
        this.vy += ay
        this.vx *= 0.94
        this.vy *= 0.94
        this.x += this.vx
        this.y += this.vy

        const head = this.segments[0]
        head.x = this.x
        head.y = this.y
        head.angle = Math.atan2(this.vy, this.vx)

        for (let i = 1; i < this.numSegments; i++) {
          const seg = this.segments[i]
          const prev = this.segments[i - 1]
          const angle = Math.atan2(prev.y - seg.y, prev.x - seg.x)
          seg.angle = angle
          seg.x = prev.x - Math.cos(angle) * this.segLength
          seg.y = prev.y - Math.sin(angle) * this.segLength
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const { isBlack, segments, numSegments, config } = this
        
        // 🎨 核心色彩同步自 WebGL 材质
        // 黑鱼：同步自 abyssColor (0.015, 0.015, 0.02) -> RGB(4, 4, 5)
        // 白鱼：同步自 lightColor (0.96, 0.94, 0.91) -> RGB(245, 240, 232)
        const rgbBase = isBlack ? '4, 4, 5' : '245, 240, 232'
        const colorMain = `rgba(${rgbBase}, ${isBlack ? 0.95 : 0.85})`
        const colorFade = `rgba(${rgbBase}, 0)`
        const strokeColor = isBlack ? 'transparent' : 'rgba(200, 190, 180, 0.3)'
        
        ctx.save()
        
        // --- 1. 绘制鱼身 ---
        ctx.fillStyle = colorMain
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1.2
        ctx.beginPath()
        
        for (let i = 0; i < numSegments; i++) {
          const s = segments[i]
          const progress = i / (numSegments - 1)
          const curve = Math.pow(Math.cos(progress * Math.PI * 0.5), 0.5)
          const thickness = config.bodyWidth * curve * (1 - progress * config.tailSharpness)
          const x = s.x + Math.cos(s.angle + Math.PI / 2) * thickness
          const y = s.y + Math.sin(s.angle + Math.PI / 2) * thickness
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        for (let i = numSegments - 1; i >= 0; i--) {
          const s = segments[i]
          const progress = i / (numSegments - 1)
          const curve = Math.pow(Math.cos(progress * Math.PI * 0.5), 0.5)
          const thickness = config.bodyWidth * curve * (1 - progress * config.tailSharpness)
          const x = s.x + Math.cos(s.angle - Math.PI / 2) * thickness
          const y = s.y + Math.sin(s.angle - Math.PI / 2) * thickness
          ctx.lineTo(x, y)
        }
        
        const head = segments[0]
        ctx.arc(head.x, head.y, config.bodyWidth * 0.9, head.angle - Math.PI / 2, head.angle + Math.PI / 2, false)
        ctx.fill()
        if (!isBlack) ctx.stroke()

        // --- 2. 绘制胸鳍 ---
        const finMount = segments[4]
        const finLen = config.bodyWidth * 2.5
        const sweep = config.finAngle * (Math.PI / 180)

        const drawFin = (side: number) => {
          ctx.save()
          const grad = ctx.createRadialGradient(finMount.x, finMount.y, 0, finMount.x, finMount.y, finLen)
          grad.addColorStop(0, colorMain)
          grad.addColorStop(1, colorFade)
          ctx.fillStyle = grad
          
          ctx.beginPath()
          const startX = finMount.x + Math.cos(finMount.angle + (Math.PI/2 * side)) * (config.bodyWidth * 0.3)
          const startY = finMount.y + Math.sin(finMount.angle + (Math.PI/2 * side)) * (config.bodyWidth * 0.3)
          ctx.moveTo(startX, startY)
          
          ctx.bezierCurveTo(
            finMount.x + Math.cos(finMount.angle + (Math.PI/2 * side) + sweep * side) * finLen,
            finMount.y + Math.sin(finMount.angle + (Math.PI/2 * side) + sweep * side) * finLen,
            finMount.x + Math.cos(finMount.angle + Math.PI * side) * finLen,
            finMount.y + Math.sin(finMount.angle + Math.PI * side) * finLen,
            startX - Math.cos(finMount.angle) * (finLen * 0.2),
            startY - Math.sin(finMount.angle) * (finLen * 0.2)
          )
          ctx.fill()
          ctx.restore()
        }
        drawFin(1)
        drawFin(-1)

        // --- 3. 绘制飘逸长尾鳍 ---
        const tailBase = segments[numSegments - 1]
        const tLen = config.tailLength
        const tSpread = config.tailSpread * (Math.PI / 180)
        
        const drawTailLeaf = (angleOffset: number, lengthMult: number, opacity: number) => {
          ctx.save()
          ctx.globalAlpha = opacity
          const tailGrad = ctx.createLinearGradient(
            tailBase.x, tailBase.y,
            tailBase.x - Math.cos(tailBase.angle + angleOffset) * tLen,
            tailBase.y - Math.sin(tailBase.angle + angleOffset) * tLen
          )
          tailGrad.addColorStop(0, colorMain)
          tailGrad.addColorStop(0.5, `rgba(${rgbBase}, 0.4)`)
          tailGrad.addColorStop(1, colorFade)
          ctx.fillStyle = tailGrad

          ctx.beginPath()
          ctx.moveTo(tailBase.x, tailBase.y)
          const wave = Math.sin(Date.now() * 0.005 + (isBlack ? 0 : 2.5)) * 0.18
          
          ctx.bezierCurveTo(
            tailBase.x - Math.cos(tailBase.angle + angleOffset * 0.5 + wave) * tLen * 0.6,
            tailBase.y - Math.sin(tailBase.angle + angleOffset * 0.5 + wave) * tLen * 0.6,
            tailBase.x - Math.cos(tailBase.angle + angleOffset + wave * 2) * tLen * lengthMult,
            tailBase.y - Math.sin(tailBase.angle + angleOffset + wave * 2) * tLen * lengthMult,
            tailBase.x - Math.cos(tailBase.angle + wave) * (tLen * 0.3),
            tailBase.y - Math.sin(tailBase.angle + wave) * (tLen * 0.3)
          )
          ctx.fill()
          ctx.restore()
        }

        drawTailLeaf(-tSpread, 1.2, 0.7)
        drawTailLeaf(tSpread, 1.2, 0.7)
        drawTailLeaf(-tSpread * 0.4, 1.5, 0.5)
        drawTailLeaf(tSpread * 0.4, 1.5, 0.5)
        drawTailLeaf(0, 1.0, 0.6)
        
        ctx.restore()
      }
    }

    const fishes = [new InkFish(true), new InkFish(false)]
    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      const time = Date.now()
      fishes.forEach((fish) => {
        fish.update(time)
        fish.draw(ctx)
      })
      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-[0]"
      style={{ mixBlendMode: 'normal' }}
    />
  )
}