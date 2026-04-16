'use client'

import { useEffect, useRef } from 'react'

/**
 * 极致水墨写意双鱼 (v9 - 1:1 像素级尺寸与形态复刻版)
 * 1. 修复 DPR 缩放问题：体型 100% 恢复原有大小
 * 2. 引入 sdTriangle 结合 12 顶点控制：完美复刻原有的贝塞尔曲线鱼鳍形态
 * 3. 像素级复刻原版 Canvas 的径向/线性透明度渐变 (Gradient Fade)
 */

export default function InkFishes() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
    if (!gl) return

    // ==========================================
    // 👑 顶级 WebGL 鱼体流体力学 Shader
    // ==========================================
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec2 u_bones[24]; // 24节 IK 骨骼
      uniform vec2 u_finPoints[12]; // 4个鳍，每个鳍3个控制点 (复刻原始曲线形态)
      uniform vec4 u_color;
      uniform float u_dpr; // 设备像素比，保证大小 100% 还原

      // 胶囊体 SDF (鱼身)
      float sdCapsule(vec2 p, vec2 a, vec2 b, float r1, float r2) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
        float r = mix(r1, r2, h);
        return length(pa - ba * h) - r;
      }

      // 三角形 SDF (完美复刻贝塞尔飘带鱼鳍)
      float sdTriangle(in vec2 p, in vec2 p0, in vec2 p1, in vec2 p2) {
        vec2 e0 = p1-p0, e1 = p2-p1, e2 = p0-p2;
        vec2 v0 = p -p0, v1 = p -p1, v2 = p -p2;
        vec2 pq0 = v0 - e0*clamp(dot(v0,e0)/dot(e0,e0), 0.0, 1.0);
        vec2 pq1 = v1 - e1*clamp(dot(v1,e1)/dot(e1,e1), 0.0, 1.0);
        vec2 pq2 = v2 - e2*clamp(dot(v2,e2)/dot(e2,e2), 0.0, 1.0);
        float s = sign(e0.x*e2.y - e0.y*e2.x);
        vec2 d = min(min(vec2(dot(pq0,pq0), s*(v0.x*e0.y-v0.y*e0.x)),
                         vec2(dot(pq1,pq1), s*(v1.x*e1.y-v1.y*e1.x))),
                         vec2(dot(pq2,pq2), s*(v2.x*e2.y-v2.y*e2.x)));
        return -sqrt(d.x)*sign(d.y);
      }

      // 💧 平滑极小值 (液体表面张力)
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }

      void main() {
        vec2 p = gl_FragCoord.xy;
        float dBody = 10000.0;
        float dFins = 10000.0;
        
        // 【关键修复】还原你设定的 24 像素真实体宽！
        float baseWidth = 24.0 * u_dpr; 

        // --- 1. 构建流体脊椎 ---
        for(int i = 0; i < 23; i++) {
          float p1 = float(i) / 23.0;
          float p2 = float(i + 1) / 23.0;
          
          float w1 = baseWidth * pow(cos(p1 * 1.5707), 0.5) * (1.0 - p1 * 0.85);
          float w2 = baseWidth * pow(cos(p2 * 1.5707), 0.5) * (1.0 - p2 * 0.85);
          if (i == 0) w1 = baseWidth * 0.9; 

          dBody = smin(dBody, sdCapsule(p, u_bones[i], u_bones[i+1], w1, w2), 5.0 * u_dpr); 
        }

        // --- 2. 构建鱼鳍 (利用 12 控制点复刻你的原始燕尾形态) ---
        for(int i = 0; i < 4; i++) {
          vec2 p0 = u_finPoints[i*3];
          vec2 p1 = u_finPoints[i*3+1];
          vec2 p2 = u_finPoints[i*3+2];
          
          // 给三角形加一点倒角圆弧，模拟水墨的圆润感
          float dt = sdTriangle(p, p0, p1, p2) - (2.0 * u_dpr);
          dFins = smin(dFins, dt, 4.0 * u_dpr);
        }

        // 身体与鱼鳍融合
        float d = smin(dBody, dFins, 6.0 * u_dpr);

        // --- 3. 完美复刻原版 Canvas 渐变消失特效 ---
        float alpha = smoothstep(1.5 * u_dpr, -1.0 * u_dpr, d);
        
        // 胸鳍褪色计算 (60px 长度衰减)
        float distToChest = distance(p, u_bones[4]);
        float chestFade = mix(1.0, 0.0, clamp(distToChest / (60.0 * u_dpr), 0.0, 1.0));
        
        // 尾鳍褪色计算 (102px 长度衰减)
        float distToTail = distance(p, u_bones[23]);
        float tailFade = mix(1.0, 0.0, clamp(distToTail / (102.0 * u_dpr), 0.0, 1.0));

        float finFade = max(chestFade, tailFade);
        
        // 智能判断：只让鱼鳍部分透明化，保持主干纯色！
        float bodyInfluence = clamp((dFins - dBody) / (8.0 * u_dpr) + 0.5, 0.0, 1.0);
        float finalAlpha = alpha * mix(finFade, 1.0, bodyInfluence);

        if(finalAlpha < 0.005) discard;

        gl_FragColor = vec4(u_color.rgb, u_color.a * finalAlpha);
      }
    `

    // --- WebGL 初始化与编译 ---
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shader))
      return shader
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource))
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(program)
    gl.useProgram(program)

    // 绑定全屏 Quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    const positionLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    // 获取 Uniform 地址
    const uResLoc = gl.getUniformLocation(program, 'u_resolution')
    const uBonesLoc = gl.getUniformLocation(program, 'u_bones')
    const uFinsLoc = gl.getUniformLocation(program, 'u_finPoints')
    const uColorLoc = gl.getUniformLocation(program, 'u_color')
    const uDprLoc = gl.getUniformLocation(program, 'u_dpr')

    // ==========================================
    // 🧠 物理引擎与形态还原控制器
    // ==========================================
    let width = window.innerWidth
    let height = window.innerHeight
    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
      width = window.innerWidth
      height = window.innerHeight
    }
    window.addEventListener('resize', setSize); setSize()

    const mouse = { x: -1000, y: -1000, vx: 0, vy: 0 }
    const handleMouseMove = (e: MouseEvent) => {
      mouse.vx = e.clientX - mouse.x
      mouse.vy = e.clientY - mouse.y
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    class InkFish {
      isBlack: boolean
      x: number; y: number; vx: number; vy: number
      segments: { x: number; y: number; angle: number }[]
      numSegments = 24
      fearLevel = 0
      
      // 完全保留你原版的设计数值
      config = {
        bodyLen: 115, bodyWidth: 24, finAngle: 45, tailLength: 85, tailSpread: 45, fearRadius: 180, fearForce: 3.5
      }
      segLength: number

      constructor(isBlack: boolean) {
        this.isBlack = isBlack
        this.segLength = this.config.bodyLen / this.numSegments
        const startAngle = isBlack ? 0 : Math.PI
        this.x = width / 2 + Math.cos(startAngle) * 200
        this.y = height / 2 + Math.sin(startAngle) * 200
        this.vx = 0; this.vy = 0
        this.segments = Array.from({ length: this.numSegments }, () => ({ x: this.x, y: this.y, angle: 0 }))
      }

      update(time: number) {
        const radius = Math.min(width, height) * 0.25
        const targetX = width / 2 + Math.cos(time * 0.0006 + (this.isBlack ? 0 : Math.PI)) * radius
        const targetY = height / 2 + Math.sin(time * 0.0006 + (this.isBlack ? 0 : Math.PI)) * radius

        let ax = (targetX - this.x) * 0.0015
        let ay = (targetY - this.y) * 0.0015

        const dx = this.x - mouse.x
        const dy = this.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < this.config.fearRadius) {
          const power = Math.pow((this.config.fearRadius - dist) / this.config.fearRadius, 2)
          ax += (dx / dist) * power * this.config.fearForce
          ay += (dy / dist) * power * this.config.fearForce
          this.fearLevel = Math.min(1, this.fearLevel + 0.1)
        } else {
          this.fearLevel *= 0.95
        }

        this.vx = (this.vx + ax) * 0.94
        this.vy = (this.vy + ay) * 0.94
        this.x += this.vx
        this.y += this.vy

        this.segments[0].x = this.x
        this.segments[0].y = this.y
        this.segments[0].angle = Math.atan2(this.vy, this.vx)

        for (let i = 1; i < this.numSegments; i++) {
          const seg = this.segments[i], prev = this.segments[i - 1]
          seg.angle = Math.atan2(prev.y - seg.y, prev.x - seg.x)
          seg.x = prev.x - Math.cos(seg.angle) * this.segLength
          seg.y = prev.y - Math.sin(seg.angle) * this.segLength
        }
      }

      getShaderData() {
        const dpr = Math.min(window.devicePixelRatio, 2)
        const bonesArray = new Float32Array(48)
        
        for(let i = 0; i < this.numSegments; i++) {
          bonesArray[i*2] = this.segments[i].x * dpr
          bonesArray[i*2+1] = (height - this.segments[i].y) * dpr
        }

        // ==========================================
        // 🎨 还原原始 2D 画布的贝塞尔曲线点位
        // 提取 12 个核心控制点，让 GPU 绘制完美的弧形鳍
        // ==========================================
        const finsArray = new Float32Array(24) // 4 fins * 3 points * 2 coords
        const fear = this.fearLevel
        
        // 1. 胸鳍数据还原
        const finMount = this.segments[4]
        const finLen = this.config.bodyWidth * 2.5 // 原版 60
        const finFreq = 0.005 + fear * 0.015
        const sweep = (this.config.finAngle + Math.sin(Date.now() * finFreq) * (15 + fear * 30)) * (Math.PI / 180)

        // 左胸鳍 (根部, 展开尖端, 后掠尾尖)
        finsArray[0] = finMount.x * dpr; finsArray[1] = (height - finMount.y) * dpr;
        finsArray[2] = (finMount.x + Math.cos(finMount.angle + Math.PI/2 + sweep) * finLen) * dpr;
        finsArray[3] = (height - (finMount.y + Math.sin(finMount.angle + Math.PI/2 + sweep) * finLen)) * dpr;
        finsArray[4] = (finMount.x + Math.cos(finMount.angle + Math.PI * 0.8) * finLen * 0.6) * dpr;
        finsArray[5] = (height - (finMount.y + Math.sin(finMount.angle + Math.PI * 0.8) * finLen * 0.6)) * dpr;

        // 右胸鳍
        finsArray[6] = finMount.x * dpr; finsArray[7] = (height - finMount.y) * dpr;
        finsArray[8] = (finMount.x + Math.cos(finMount.angle - Math.PI/2 - sweep) * finLen) * dpr;
        finsArray[9] = (height - (finMount.y + Math.sin(finMount.angle - Math.PI/2 - sweep) * finLen)) * dpr;
        finsArray[10] = (finMount.x + Math.cos(finMount.angle - Math.PI * 0.8) * finLen * 0.6) * dpr;
        finsArray[11] = (height - (finMount.y + Math.sin(finMount.angle - Math.PI * 0.8) * finLen * 0.6)) * dpr;

        // 2. 尾鳍数据还原
        const tailBase = this.segments[23]
        const tLen = this.config.tailLength * 1.2 // 原版 102
        const tSpread = this.config.tailSpread * (Math.PI / 180)
        const tailFreq = 0.005 + fear * 0.015
        const wave = Math.sin(Date.now() * tailFreq + (this.isBlack ? 0 : 2.5)) * (0.18 + fear * 0.3)

        // 左尾鳍飘带
        finsArray[12] = tailBase.x * dpr; finsArray[13] = (height - tailBase.y) * dpr;
        finsArray[14] = (tailBase.x - Math.cos(tailBase.angle - tSpread + wave*2) * tLen) * dpr;
        finsArray[15] = (height - (tailBase.y - Math.sin(tailBase.angle - tSpread + wave*2) * tLen)) * dpr;
        finsArray[16] = (tailBase.x - Math.cos(tailBase.angle - tSpread*0.2 + wave) * tLen * 0.5) * dpr;
        finsArray[17] = (height - (tailBase.y - Math.sin(tailBase.angle - tSpread*0.2 + wave) * tLen * 0.5)) * dpr;

        // 右尾鳍飘带
        finsArray[18] = tailBase.x * dpr; finsArray[19] = (height - tailBase.y) * dpr;
        finsArray[20] = (tailBase.x - Math.cos(tailBase.angle + tSpread + wave*2) * tLen) * dpr;
        finsArray[21] = (height - (tailBase.y - Math.sin(tailBase.angle + tSpread + wave*2) * tLen)) * dpr;
        finsArray[22] = (tailBase.x - Math.cos(tailBase.angle + tSpread*0.2 + wave) * tLen * 0.5) * dpr;
        finsArray[23] = (height - (tailBase.y - Math.sin(tailBase.angle + tSpread*0.2 + wave) * tLen * 0.5)) * dpr;

        return { bonesArray, finsArray }
      }
    }

    const fishes = [new InkFish(true), new InkFish(false)]
    
    // 黑鱼颜色: 深渊黑水银, 白鱼: 晨曦白 
    const blackColor = [0.015, 0.015, 0.02, 0.95]
    const whiteColor = [0.96, 0.94, 0.91, 0.85]

    let animId: number
    const render = () => {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      const time = Date.now()
      const dpr = Math.min(window.devicePixelRatio, 2)
      
      gl.uniform2f(uResLoc, canvas.width, canvas.height)
      gl.uniform1f(uDprLoc, dpr) // 【核心】：注入屏幕像素比修正尺寸！

      fishes.forEach((fish) => {
        fish.update(time)
        const { bonesArray, finsArray } = fish.getShaderData()
        
        gl.uniform2fv(uBonesLoc, bonesArray)
        gl.uniform2fv(uFinsLoc, finsArray)
        gl.uniform4fv(uColorLoc, fish.isBlack ? blackColor : whiteColor)
        
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      })

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', setSize)
      cancelAnimationFrame(animId)
      gl.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-[0]"
    />
  )
}