'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSensory } from '@/components/providers/GlobalSensoryProvider'
import { SymbioteSpatialAudio } from '@/lib/SymbioteSpatialAudio'
import { BioFieldDisruption } from '@/lib/BioFieldDisruption'
import { useCursorState } from '@/hooks/useCursorState'

/**
 * 👑 「共生体·天演」- SOTY 终极完全体 (包含拉丝变细、趋光触手、X-ray余温)
 */

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor
const lerpColor = (c1: number[], c2: number[], factor: number) => [
  lerp(c1[0], c2[0], factor), lerp(c1[1], c2[1], factor), lerp(c1[2], c2[2], factor)
]

export default function SymbioteCursorEnhanced() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  const { engine } = useSensory()
  const { state, updatePosition, addEnergy, setTargetElement } = useCursorState()

  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({})
  const textureCache = useRef<Map<string, WebGLTexture | 'loading'>>(new Map())

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
    if (!gl) return
    glRef.current = gl

    const vsSource = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec2 u_cursorPos;
      uniform vec2 u_prevCursorPos; 
      uniform float u_time;
      
      uniform float u_baseRadius;
      uniform float u_nFreq;
      uniform float u_nAmp;
      uniform float u_timeScale;
      uniform vec3 u_baseColor;
      uniform vec3 u_glowColor;
      uniform float u_tentacleIntensity;
      
      uniform float u_audio_amplitude;
      uniform vec2 u_targetPos;
      uniform float u_isHovering;
      uniform float u_theme;
      uniform float u_tentaclePhase; 
      uniform float u_filamentCount;
      
      uniform float u_hasTexture;
      uniform vec4 u_imgRect; 
      uniform sampler2D u_photoTexture;

      float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * k * (1.0 / 4.0);
      }

      float sdSegment( in vec2 p, in vec2 a, in vec2 b ) {
        vec2 pa = p-a, ba = b-a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
        return length( pa - ba*h );
      }

      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865, 0.366025404, -0.577350269, 0.0243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;
        
        vec2 currPos = (u_cursorPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
        currPos.y = -currPos.y; 
        
        vec2 prevPos = (u_prevCursorPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
        prevPos.y = -prevPos.y;

        // 👑 1. 动态拉伸质量守恒 (速度越快，半径越细)
        float speed = length(currPos - prevPos) * u_resolution.y; 
        float stretchThinning = clamp(1.0 - speed * 0.015, 0.3, 1.0); 
        float currentRadius = (u_baseRadius / u_resolution.y) * stretchThinning;
        
        float dist = sdSegment(p, prevPos, currPos) - currentRadius;

        // 👑 2. 趋光性与重力算法
        if (u_tentacleIntensity > 0.0) {
           float angle = atan(p.y - currPos.y, p.x - currPos.x);
           float activeFilaments = max(6.0, u_filamentCount);
           
           // 重力下垂: 面朝下(-PI/2)时伸长，面朝上(PI/2)时收缩
           float gravityBias = mix(0.7, 1.3, smoothstep(1.0, -1.0, sin(angle)));
           
           // 趋光性嗅探
           float photoTaxis = 1.0;
           if (u_isHovering > 0.5) {
               vec2 targetPos = (u_targetPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
               targetPos.y = -targetPos.y;
               float angleToTarget = atan(targetPos.y - currPos.y, targetPos.x - currPos.x);
               // 计算触手与目标的对齐度：完美对齐为1，背对为0
               float alignment = max(0.0, cos(angle - angleToTarget));
               // 对齐的触手最高伸长 2.5倍
               photoTaxis = mix(1.0, 2.5, alignment); 
           }

           float sniffingOffset = snoise(vec2(angle * 2.0, u_time)) * 0.5;
           float tentacle = sin(angle * activeFilaments + u_tentaclePhase + sniffingOffset) 
                            * 0.015 * u_tentacleIntensity * gravityBias * photoTaxis * stretchThinning;
           dist -= tentacle;
        }

        // 情绪毛刺与心跳
        dist += snoise(p * u_nFreq + u_time * u_timeScale) * u_nAmp * stretchThinning;
        dist -= sin(u_time * 2.0) * 0.01; 
        dist -= u_audio_amplitude * 0.1;

        // 目标吸附拉丝
        if (u_isHovering > 0.5) {
          vec2 targetPos = (u_targetPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
          targetPos.y = -targetPos.y;
          float targetDist = length(p - targetPos) - 18.0 / u_resolution.y;
          dist = smin(dist, targetDist, 0.4); 
        }

        float alpha = smoothstep(0.01, 0.0, dist);
        float specular = exp(-dist * 80.0) * 0.8; 
        vec3 finalColor = u_baseColor + u_glowColor * specular;

        // ==========================================
        // 👑 3. 带有生物场边缘和余温衰减的 X-ray
        // ==========================================
        // u_hasTexture 现在是一个 0~1 的渐变透明度参数
        if (u_hasTexture > 0.01 && dist < 0.05) { 
            vec2 mousePixelPos = vec2(u_cursorPos.x, u_resolution.y - u_cursorPos.y); 
            vec2 offset = gl_FragCoord.xy - mousePixelPos;
            
            float magnification = 1.5;
            vec2 samplePos = mousePixelPos + offset / magnification;
            vec2 uv = (samplePos - u_imgRect.xy) / u_imgRect.zw;
            
            if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
                vec4 texColor = texture2D(u_photoTexture, uv);
                float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
                vec3 xrayColor = vec3(1.0 - gray) * vec3(0.4, 0.8, 1.0); 
                
                // 生物场腐蚀噪声遮罩
                float edgeErosion = snoise(p * 15.0 - u_time * 4.0) * 0.015;
                float innerMask = smoothstep(0.005, -0.01, dist + edgeErosion);
                
                // 乘上 u_hasTexture 产生完美的“视觉余温”淡出
                finalColor = mix(finalColor, xrayColor, innerMask * u_hasTexture);
            }
        }

        if (u_theme > 0.5) finalColor = 1.0 - finalColor;
        gl_FragColor = vec4(finalColor, alpha);
      }
    `

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    programRef.current = prog

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
    const posAttrib = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(posAttrib)
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0)

    uniformsRef.current = {
      u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
      u_cursorPos: gl.getUniformLocation(prog, 'u_cursorPos'),
      u_prevCursorPos: gl.getUniformLocation(prog, 'u_prevCursorPos'),
      u_time: gl.getUniformLocation(prog, 'u_time'),
      u_baseRadius: gl.getUniformLocation(prog, 'u_baseRadius'),
      u_nFreq: gl.getUniformLocation(prog, 'u_nFreq'),
      u_nAmp: gl.getUniformLocation(prog, 'u_nAmp'),
      u_timeScale: gl.getUniformLocation(prog, 'u_timeScale'),
      u_baseColor: gl.getUniformLocation(prog, 'u_baseColor'),
      u_glowColor: gl.getUniformLocation(prog, 'u_glowColor'),
      u_tentacleIntensity: gl.getUniformLocation(prog, 'u_tentacleIntensity'),
      u_audio_amplitude: gl.getUniformLocation(prog, 'u_audio_amplitude'),
      u_targetPos: gl.getUniformLocation(prog, 'u_targetPos'),
      u_isHovering: gl.getUniformLocation(prog, 'u_isHovering'),
      u_theme: gl.getUniformLocation(prog, 'u_theme'),
      u_tentaclePhase: gl.getUniformLocation(prog, 'u_tentaclePhase'),
      u_filamentCount: gl.getUniformLocation(prog, 'u_filamentCount'),
      u_hasTexture: gl.getUniformLocation(prog, 'u_hasTexture'),
      u_imgRect: gl.getUniformLocation(prog, 'u_imgRect'),
      u_photoTexture: gl.getUniformLocation(prog, 'u_photoTexture')
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize)
    resize()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true)
      return
    }

    initWebGL()
    const spatialAudio = SymbioteSpatialAudio.getInstance()
    const bioField = BioFieldDisruption.getInstance()
    spatialAudio.init()
    bioField.init()

    let raf: number
    const startTime = Date.now()
    const dpr = Math.min(window.devicePixelRatio, 2)

    // 👑 独立渲染状态机：负责极度丝滑的参数插值 (Lerp)
    const renderState = {
      baseRadius: 15.0,
      nFreq: 3.0, nAmp: 0.015, timeScale: 2.0,
      baseColor: [0.02, 0.03, 0.05], glowColor: [0.1, 0.15, 0.2],
      tentacleIntensity: 1.0,
      cursorX: state.position.x * dpr, cursorY: state.position.y * dpr,
      
      // X-ray 缓存属性
      hasTextureFactor: 0.0,
      lastValidTexture: null as WebGLTexture | null,
      lastValidRect: [0, 0, 0, 0] as [number, number, number, number]
    }

    const render = () => {
      const gl = glRef.current
      const uniforms = uniformsRef.current
      if (!gl || !programRef.current) return

      const time = (Date.now() - startTime) * 0.001
      const energyNorm = state.energy / 100.0

      // 计算目标基准参数
      let targetBaseRadius = 10.0 + 15.0 * energyNorm
      let targetNFreq = 3.0, targetNAmp = 0.015, targetTimeScale = 2.0
      let targetBaseColor = [0.02, 0.03, 0.05], targetGlowColor = [0.1, 0.15, 0.2]
      let targetTentacleIntensity = 1.0

      if (state.mood === 'tired') {
        targetBaseRadius *= 0.8
        targetNFreq = 1.0; targetNAmp = 0.005; targetTimeScale = 0.5
        targetBaseColor = [0.01, 0.01, 0.02]; targetGlowColor = [0.02, 0.02, 0.05]
        targetTentacleIntensity = 0.0 
      } else if (state.mood === 'happy') {
        targetBaseRadius *= 1.1
        targetNFreq = 4.0; targetNAmp = 0.025; targetTimeScale = 4.0
        targetBaseColor = [0.0, 0.15, 0.3]; targetGlowColor = [0.0, 0.6, 0.9]
        targetTentacleIntensity = 1.5 
      } else if (state.mood === 'angry') {
        targetBaseRadius *= 1.4
        targetNFreq = 25.0; targetNAmp = 0.08; targetTimeScale = 15.0 
        targetBaseColor = [0.3, 0.0, 0.0]; targetGlowColor = [0.8, 0.1, 0.0]
        targetTentacleIntensity = 0.0 
      }

      // 执行平滑插值 (阻尼系数 0.08)
      const lf = 0.08
      renderState.baseRadius = lerp(renderState.baseRadius, targetBaseRadius, lf)
      renderState.nFreq = lerp(renderState.nFreq, targetNFreq, lf)
      renderState.nAmp = lerp(renderState.nAmp, targetNAmp, lf)
      renderState.timeScale = lerp(renderState.timeScale, targetTimeScale, lf)
      renderState.baseColor = lerpColor(renderState.baseColor, targetBaseColor, lf)
      renderState.glowColor = lerpColor(renderState.glowColor, targetGlowColor, lf)
      renderState.tentacleIntensity = lerp(renderState.tentacleIntensity, targetTentacleIntensity, lf)

      // 👑 惯性坐标结算：前一帧保留 -> 现坐标缓动更新
      gl.uniform2f(uniforms.u_prevCursorPos, renderState.cursorX, renderState.cursorY)
      renderState.cursorX = lerp(renderState.cursorX, state.position.x * dpr, 0.3) // 0.3粘滞感
      renderState.cursorY = lerp(renderState.cursorY, state.position.y * dpr, 0.3)
      gl.uniform2f(uniforms.u_cursorPos, renderState.cursorX, renderState.cursorY)

      gl.uniform2f(uniforms.u_resolution, gl.canvas.width, gl.canvas.height)
      gl.uniform1f(uniforms.u_time, time)
      gl.uniform1f(uniforms.u_baseRadius, renderState.baseRadius)
      gl.uniform1f(uniforms.u_nFreq, renderState.nFreq)
      gl.uniform1f(uniforms.u_nAmp, renderState.nAmp * energyNorm)
      gl.uniform1f(uniforms.u_timeScale, renderState.timeScale)
      gl.uniform3f(uniforms.u_baseColor, renderState.baseColor[0], renderState.baseColor[1], renderState.baseColor[2])
      gl.uniform3f(uniforms.u_glowColor, renderState.glowColor[0], renderState.glowColor[1], renderState.glowColor[2])
      gl.uniform1f(uniforms.u_tentacleIntensity, renderState.tentacleIntensity * energyNorm)

      gl.uniform1f(uniforms.u_audio_amplitude, engine?.getAmplitude() || 0)
      gl.uniform1f(uniforms.u_theme, document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0)
      gl.uniform1f(uniforms.u_tentaclePhase, (state as any).tentaclePhase || time * 2.0)
      gl.uniform1f(uniforms.u_filamentCount, (state as any).filamentCount || 6.0)

      // 👑 X-ray 视觉余温逻辑与纹理拦截
      let targetHasTexture = 0.0
      if (state.targetElement) {
        const rect = state.targetElement.getBoundingClientRect()
        gl.uniform2f(uniforms.u_targetPos, (rect.left + rect.width/2) * dpr, (rect.top + rect.height/2) * dpr)
        gl.uniform1f(uniforms.u_isHovering, 1.0)

        if (state.targetElement.tagName.toLowerCase() === 'img') {
          const src = state.targetElement.getAttribute('src')
          if (src) {
            if (!textureCache.current.has(src)) {
              textureCache.current.set(src, 'loading')
              const img = new Image()
              img.crossOrigin = 'anonymous' 
              img.src = src
              img.onload = () => {
                const tex = gl.createTexture()!
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                textureCache.current.set(src, tex)
              }
            }

            const tex = textureCache.current.get(src)
            if (tex && tex !== 'loading') {
              targetHasTexture = 1.0
              renderState.lastValidTexture = tex
              const glImgY = (window.innerHeight - rect.bottom) * dpr
              renderState.lastValidRect = [rect.left * dpr, glImgY, rect.width * dpr, rect.height * dpr]
            }
          }
        }
      } else {
        gl.uniform1f(uniforms.u_isHovering, 0.0)
      }

      // 视觉余温渐变：进入快 (0.15)，离开极慢 (0.02)
      renderState.hasTextureFactor = lerp(
        renderState.hasTextureFactor, 
        targetHasTexture, 
        targetHasTexture > 0.5 ? 0.15 : 0.02
      )
      
      gl.uniform1f(uniforms.u_hasTexture, renderState.hasTextureFactor)

      // 只要余温还在，就持续渲染最后捕获的图片纹理
      if (renderState.hasTextureFactor > 0.001 && renderState.lastValidTexture) {
         gl.activeTexture(gl.TEXTURE0)
         gl.bindTexture(gl.TEXTURE_2D, renderState.lastValidTexture)
         gl.uniform1i(uniforms.u_photoTexture, 0)
         gl.uniform4f(uniforms.u_imgRect, ...renderState.lastValidRect)
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(render)
    }
    render()

    const handleMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY)
      spatialAudio.playBioFieldDisruptionAtPosition({ x: e.clientX, y: e.clientY }, state.energy / 100)
    }

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const interactable = target.closest('button, a, img') as HTMLElement
      if (interactable) {
        setTargetElement(interactable)
        addEnergy(5) 
        spatialAudio.playEatSoundAtPosition({ x: e.clientX, y: e.clientY })
      }
    }

    const handleOut = () => {
      setTargetElement(null)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseover', handleOver)
    window.addEventListener('mouseout', handleOut)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseover', handleOver)
      window.removeEventListener('mouseout', handleOut)
    }
  }, [initWebGL, state, updatePosition, addEnergy, setTargetElement, engine])

  if (isTouchDevice) return null

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[99999] pointer-events-none w-full h-full"
      style={{ mixBlendMode: 'normal' }}
    />
  )
}