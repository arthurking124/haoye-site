'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSensory } from '@/components/providers/GlobalSensoryProvider'
import { SymbioteSpatialAudio } from '@/lib/SymbioteSpatialAudio'
import { BioFieldDisruption } from '@/lib/BioFieldDisruption'
import { useCursorState } from '@/hooks/useCursorState'

/**
 * 👑 「共生体·天演」- SOTY 养成级进化版: 曜石活墨 (The Sentient Obsidian Ink)
 * * 核心升级：绝对的“成长可视化” (Visible Maturation)
 * - 刚进入页面时，它只是一颗极小的惰性孢子 (体积仅为完全体的 10%)。
 * - 必须通过用户的滑动 (移动距离) 和 进食 (悬停按钮) 积累 XP，才会慢慢膨胀。
 * - 幼年期没有拉丝能力；只有吸饱经验值长大后，才会解锁果冻变形和引力伪足。
 * - 长时间不交互，会重新萎缩回微小的墨点。
 */

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern) } catch (e) {}
  }
}

export default function SymbioteCursorEnhanced() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  const pathname = usePathname()
  const { engine } = useSensory()
  const { state, updatePosition, setMood, addEnergy, setTargetElement } = useCursorState()

  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const bufferRef = useRef<WebGLBuffer | null>(null) 
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({})
  const textureCache = useRef<Map<string, WebGLTexture | 'loading'>>(new Map())

  useEffect(() => {
    setTargetElement(null); setMood('curious') 
  }, [pathname, setTargetElement, setMood])

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
    if (!gl) return
    glRef.current = gl

    const vsSource = `attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution; uniform vec2 u_cursorPos; uniform vec2 u_prevCursorPos; 
      uniform float u_time; 
      
      uniform float u_growthFactor;   // 👑 核心：决定大小与物理能力的生命成熟度
      uniform float u_tailWeight;     
      
      uniform float u_baseRadius; 
      uniform float u_wobbleFreq;     
      uniform float u_wobbleAmp;      
      uniform float u_pseudopodLen;   
      
      uniform float u_targetRadius; 
      uniform float u_targetViscosity;  
      uniform float u_refractionStrength; 
      
      uniform float u_audio_amplitude; 
      uniform vec2 u_targetPos; 
      uniform float u_isHovering;
      uniform float u_theme; 
      uniform float u_hasTexture; uniform vec4 u_imgRect; uniform sampler2D u_photoTexture;

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
        vec2 i  = floor(v + dot(v, C.yy) ); vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ; vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;
        vec2 currPos = (u_cursorPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0); currPos.y = -currPos.y; 
        vec2 prevPos = (u_prevCursorPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0); prevPos.y = -prevPos.y;

        // 👑 挤压拉伸物理学：只有成熟体 (u_growthFactor 较高) 时，才具有拉丝形变能力
        vec2 dir = currPos - prevPos;
        float speed = length(dir) * u_resolution.y; 
        vec2 normDir = speed > 0.001 ? normalize(dir) : vec2(1.0, 0.0); 
        
        // 幼年期抗拉伸能力极强，保持圆点；长大后变得柔软
        float activeStretch = mix(0.0, 0.015, u_growthFactor);
        float stretchThinning = clamp(1.0 - speed * activeStretch, 0.45, 1.0); 
        
        // 👑 真正的体积成长：幼年期只有 12% 的体积，完全体是 100%
        float currentRadius = (u_baseRadius / u_resolution.y) * mix(0.12, 1.0, u_growthFactor);

        vec2 q = p - currPos;
        float dotDir = dot(q, normDir);
        vec2 proj = dotDir * normDir; 
        vec2 orth = q - proj;         
        q = proj / stretchThinning + orth * stretchThinning; 

        float dHead = length(q) - currentRadius;
        
        // 尾巴粗细也受成长进度控制
        float tailThickness = currentRadius * stretchThinning * 0.5 * u_tailWeight * u_growthFactor;
        float dTail = sdSegment(p, prevPos, currPos) - tailThickness; 
        // 融合度随成长变顺滑
        float dist = smin(dHead, dTail, mix(0.02, 0.15, u_growthFactor)); 

        // 呼吸微弹：随着长大，呼吸幅度变大
        float jiggle = snoise(q * u_wobbleFreq - u_time * 2.0) * u_wobbleAmp * stretchThinning * u_growthFactor;
        jiggle += snoise(q * (u_wobbleFreq + u_audio_amplitude * 20.0)) * (u_audio_amplitude * 0.05);
        dist += jiggle;

        // 引力伪足：幼年期无法伸出伪足
        vec2 targetPos = (u_targetPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0); targetPos.y = -targetPos.y;
        float angle = atan(p.y - currPos.y, p.x - currPos.x);
        float angleToTarget = atan(targetPos.y - currPos.y, targetPos.x - currPos.x);
        float alignment = max(0.0, cos(angle - angleToTarget));
        
        float pseudopod = pow(alignment, 3.0) * u_pseudopodLen * u_isHovering * stretchThinning * u_growthFactor;
        dist -= pseudopod / u_resolution.y;

        float targetDist = length(p - targetPos) - (u_targetRadius / u_resolution.y);
        dist = mix(dist, smin(dist, targetDist, u_targetViscosity), u_isHovering);

        // 高级曜石光学材质 
        float alpha = smoothstep(0.004, -0.001, dist); 
        
        vec2 pseudoNormal = normalize(p - (u_isHovering > 0.5 ? targetPos : currPos));
        float surfaceCurve = smoothstep(0.0, 0.06, abs(dist));
        vec3 normal3D = normalize(vec3(pseudoNormal, 1.0 - surfaceCurve));

        vec3 lightDir = normalize(vec3(-1.0, 1.5, 1.5));
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 halfDir = normalize(lightDir + viewDir);

        float diff = max(dot(normal3D, lightDir), 0.0); 
        float spec = pow(max(dot(normal3D, halfDir), 0.0), 128.0); 
        float fresnel = pow(1.0 - max(dot(normal3D, viewDir), 0.0), 4.0); 

        vec3 coreInk; vec3 edgeColor; vec3 specColor;

        if (u_theme > 0.5) { 
            coreInk = vec3(0.06, 0.055, 0.05);  
            edgeColor = vec3(0.18, 0.15, 0.12); 
            specColor = vec3(0.9, 0.88, 0.85);
        } else {
            coreInk = vec3(0.75, 0.78, 0.82); 
            edgeColor = vec3(0.6, 0.75, 0.95);  
            specColor = vec3(0.95, 0.98, 1.0);
        }

        vec3 finalColor = coreInk;
        finalColor += diff * (u_theme > 0.5 ? 0.02 : 0.05); 
        finalColor += fresnel * edgeColor; 
        
        // 高光也会随着长大而变得更加明显湿润
        finalColor += spec * specColor * mix(0.5, 1.2, u_growthFactor); 
        
        vec3 glitchColor = vec3(u_audio_amplitude * 0.8, 0.0, u_audio_amplitude * 0.3) * (1.0 - surfaceCurve);
        finalColor += glitchColor;

        if (u_hasTexture > 0.01 && dist < 0.01) { 
            vec2 mousePixelPos = vec2(u_cursorPos.x, u_resolution.y - u_cursorPos.y); 
            vec2 offset = gl_FragCoord.xy - mousePixelPos;
            
            float distortionMask = smoothstep(0.02, -0.05, dist) * u_refractionStrength;
            vec2 refractionOffset = pseudoNormal * distortionMask * 25.0; 
            
            vec2 samplePos = mousePixelPos + offset / 1.1 + refractionOffset;
            vec2 uv = (samplePos - u_imgRect.xy) / u_imgRect.zw; uv.y = 1.0 - uv.y;
            
            if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
                vec3 texColor = texture2D(u_photoTexture, uv).rgb;
                float gray = dot(texColor, vec3(0.299, 0.587, 0.114));
                
                vec3 inkRefraction = mix(coreInk, vec3(gray), 0.55); 
                inkRefraction += fresnel * edgeColor * 0.8;
                inkRefraction += spec * specColor * mix(0.5, 1.2, u_growthFactor); 
                
                finalColor = mix(finalColor, inkRefraction, u_hasTexture);
            }
        }

        // 幼年期的透明度稍微低一点点，长大后变得坚实
        gl_FragColor = vec4(finalColor, alpha * mix(0.7, 1.0, u_growthFactor));
      }
    `

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog); gl.useProgram(prog); programRef.current = prog

    const buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
    bufferRef.current = buffer

    const posAttrib = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(posAttrib); gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0)

    const getLoc = (name: string) => gl.getUniformLocation(prog, name)
    uniformsRef.current = {
      u_resolution: getLoc('u_resolution'), u_cursorPos: getLoc('u_cursorPos'), u_prevCursorPos: getLoc('u_prevCursorPos'), 
      u_time: getLoc('u_time'), u_growthFactor: getLoc('u_growthFactor'), u_tailWeight: getLoc('u_tailWeight'),
      u_baseRadius: getLoc('u_baseRadius'), u_wobbleFreq: getLoc('u_wobbleFreq'), u_wobbleAmp: getLoc('u_wobbleAmp'), 
      u_pseudopodLen: getLoc('u_pseudopodLen'), u_targetRadius: getLoc('u_targetRadius'), u_targetViscosity: getLoc('u_targetViscosity'),
      u_refractionStrength: getLoc('u_refractionStrength'), u_audio_amplitude: getLoc('u_audio_amplitude'), 
      u_targetPos: getLoc('u_targetPos'), u_isHovering: getLoc('u_isHovering'), u_theme: getLoc('u_theme'), 
      u_hasTexture: getLoc('u_hasTexture'), u_imgRect: getLoc('u_imgRect'), u_photoTexture: getLoc('u_photoTexture')
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) { setIsTouchDevice(true); return }

    initWebGL()
    const spatialAudio = SymbioteSpatialAudio.getInstance()
    const bioField = BioFieldDisruption.getInstance()
    spatialAudio.init(); bioField.init()

    let raf: number
    const startTime = Date.now()
    
    // 👑 养成机制的核心数据：起步经验值为 0！
    let cumulativeXP = 0
    let lastInteractTime = Date.now()
    let lastMouseX = state.position.x
    let lastMouseY = state.position.y
    let isHoveringText = false 

    const MAX_TEXTURE_CACHE = 8 

    const handleResize = () => {
      if (!canvasRef.current || !glRef.current) return
      const currentDpr = Math.min(window.devicePixelRatio, 2)
      canvasRef.current.width = window.innerWidth * currentDpr; canvasRef.current.height = window.innerHeight * currentDpr
      glRef.current.viewport(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    handleResize(); window.addEventListener('resize', handleResize)

    const initialDpr = Math.min(window.devicePixelRatio, 2)
    const renderState = {
      baseRadius: 18.0, wobbleFreq: 2.5, wobbleAmp: 0.015, pseudopodLen: 0.0, 
      cursorX: state.position.x * initialDpr, cursorY: state.position.y * initialDpr,
      targetRadius: 15.0, targetViscosity: 0.35, hasTextureFactor: 0.0, 
      growthFactor: 0.0, tailWeight: 1.0, refractionStrength: 1.0, 
      lastValidTexture: null as WebGLTexture | null, lastValidRect: [0, 0, 0, 0] as [number, number, number, number]
    }

    let prevMood = state.mood

    const render = () => {
      const gl = glRef.current; const uniforms = uniformsRef.current
      if (!gl || !programRef.current) return

      const currentDpr = Math.min(window.devicePixelRatio, 2)
      const now = Date.now()
      const time = (now - startTime) * 0.001
      const isLight = document.documentElement.getAttribute('data-theme') === 'light'

      // 👑 经验代谢获取机制
      const dx = state.position.x - lastMouseX; const dy = state.position.y - lastMouseY
      const moveSpeed = Math.sqrt(dx * dx + dy * dy)
      
      // 每次移动稍微缓慢积累XP，让长大有一个 2-3 秒的自然过程
      if (moveSpeed > 0.5) { 
          cumulativeXP = Math.min(1000, cumulativeXP + moveSpeed * 0.04); 
          lastInteractTime = now 
      }
      // 吞噬按钮时，获得大额 XP，瞬间长大
      if (state.targetElement) { 
          cumulativeXP = Math.min(1000, cumulativeXP + 2.0); 
          lastInteractTime = now 
      }

      // 静止 3.5 秒后，由于缺乏交互能量，开始极速萎缩
      const timeSinceInteract = now - lastInteractTime
      if (timeSinceInteract > 3500) {
          cumulativeXP = Math.max(0, cumulativeXP - (timeSinceInteract - 3500) * 0.0015)
      }

      // 经验值映射到 0.0 -> 1.0 的平滑成长系数
      const targetGrowth = 1.0 - Math.exp(-cumulativeXP * 0.003)
      renderState.growthFactor = lerp(renderState.growthFactor, targetGrowth, 0.03)
      
      lastMouseX = state.position.x; lastMouseY = state.position.y

      if (state.mood === 'angry' && prevMood !== 'angry') triggerHaptic([20, 30, 20])
      prevMood = state.mood

      let targetBaseRadius = 18.0
      let targetWobbleFreq = 2.5, targetWobbleAmp = 0.015, targetPseudopodLen = 0.0
      let targetTailWeight = 1.0, targetRefraction = 1.0

      if (state.mood === 'tired') { 
        targetBaseRadius *= 0.7
        targetTailWeight = 0.0
        targetRefraction = 0.5 
        targetWobbleFreq = 1.0; targetWobbleAmp = 0.005 
      } else if (state.mood === 'happy') {
        targetBaseRadius *= 1.15
        targetTailWeight = 0.0 
        targetRefraction = 2.2 
        targetWobbleFreq = 4.0; targetWobbleAmp = 0.01 
        targetPseudopodLen = 12.0 
      } else if (state.mood === 'angry') {
        targetBaseRadius *= 1.3
        targetTailWeight = 1.0
        targetRefraction = 3.0 
        targetWobbleFreq = 12.0; targetWobbleAmp = 0.04 
        targetPseudopodLen = 0.0
      }

      let targetHasTexture = 0.0, tRadius = 15.0, tViscosity = 0.35, isTextureBound = false

      if (state.targetElement) {
        const el = state.targetElement; const rect = el.getBoundingClientRect() 
        gl.uniform2f(uniforms.u_targetPos, (rect.left + rect.width/2) * currentDpr, (rect.top + rect.height/2) * currentDpr)
        gl.uniform1f(uniforms.u_isHovering, 1.0)

        const isDot = el.getAttribute('data-cursor') === 'dot'
        const isImg = el.tagName.toLowerCase() === 'img'

        if (isDot) {
          targetBaseRadius = 5.0; tRadius = 8.0; tViscosity = 0.2; targetPseudopodLen = 6.0    
        } else if (isImg) {
          targetBaseRadius = 22.0; tRadius = 32.0; tViscosity = 0.5; targetPseudopodLen = 18.0
          const src = el.getAttribute('src')
          if (src) {
            if (!textureCache.current.has(src)) {
              if (textureCache.current.size >= MAX_TEXTURE_CACHE) {
                const oldestKey = textureCache.current.keys().next().value
                if (oldestKey) { 
                  const oldestTex = textureCache.current.get(oldestKey)
                  if (oldestTex && oldestTex !== 'loading') gl.deleteTexture(oldestTex) 
                  textureCache.current.delete(oldestKey)
                }
              }
              textureCache.current.set(src, 'loading'); const img = new Image(); img.crossOrigin = 'anonymous'; img.src = src
              img.onload = () => {
                const tex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                textureCache.current.set(src, tex)
              }
            }
            const tex = textureCache.current.get(src)
            if (tex && tex !== 'loading') {
              targetHasTexture = 1.0; renderState.lastValidTexture = tex
              const glImgY = (window.innerHeight - rect.bottom) * currentDpr
              renderState.lastValidRect = [rect.left * currentDpr, glImgY, rect.width * currentDpr, rect.height * currentDpr]
              isTextureBound = true
            }
          }
        } else {
          targetBaseRadius = 12.0; tRadius = 18.0; tViscosity = 0.35; targetPseudopodLen = 10.0
        }
      } else {
        gl.uniform1f(uniforms.u_isHovering, 0.0)
      }

      const lf = 0.08 
      renderState.baseRadius = lerp(renderState.baseRadius, targetBaseRadius, lf)
      renderState.wobbleFreq = lerp(renderState.wobbleFreq, targetWobbleFreq, lf)
      renderState.wobbleAmp = lerp(renderState.wobbleAmp, targetWobbleAmp, lf)
      renderState.pseudopodLen = lerp(renderState.pseudopodLen, targetPseudopodLen, lf)
      renderState.targetRadius = lerp(renderState.targetRadius, tRadius, lf)
      renderState.targetViscosity = lerp(renderState.targetViscosity, tViscosity, lf)
      renderState.hasTextureFactor = lerp(renderState.hasTextureFactor, targetHasTexture, targetHasTexture > 0.5 ? 0.15 : 0.02)
      renderState.refractionStrength = lerp(renderState.refractionStrength, targetRefraction, lf)
      renderState.tailWeight = lerp(renderState.tailWeight, targetTailWeight, 0.15) 

      const trackingSpeed = isHoveringText ? 0.08 : 0.28
      
      gl.uniform2f(uniforms.u_prevCursorPos, renderState.cursorX, renderState.cursorY)
      renderState.cursorX = lerp(renderState.cursorX, state.position.x * currentDpr, trackingSpeed) 
      renderState.cursorY = lerp(renderState.cursorY, state.position.y * currentDpr, trackingSpeed)
      
      gl.uniform2f(uniforms.u_cursorPos, renderState.cursorX, renderState.cursorY)
      gl.uniform2f(uniforms.u_resolution, canvasRef.current!.width, canvasRef.current!.height)
      gl.uniform1f(uniforms.u_time, time)
      
      gl.uniform1f(uniforms.u_baseRadius, renderState.baseRadius)
      
      gl.uniform1f(uniforms.u_wobbleFreq, renderState.wobbleFreq)
      gl.uniform1f(uniforms.u_wobbleAmp, renderState.wobbleAmp)
      gl.uniform1f(uniforms.u_pseudopodLen, renderState.pseudopodLen)
      gl.uniform1f(uniforms.u_targetRadius, renderState.targetRadius)
      gl.uniform1f(uniforms.u_targetViscosity, renderState.targetViscosity)
      gl.uniform1f(uniforms.u_refractionStrength, renderState.refractionStrength)
      
      gl.uniform1f(uniforms.u_audio_amplitude, spatialAudio.getAmplitude())
      gl.uniform1f(uniforms.u_growthFactor, renderState.growthFactor)
      gl.uniform1f(uniforms.u_tailWeight, renderState.tailWeight)
      gl.uniform1f(uniforms.u_theme, isLight ? 1.0 : 0.0)

      gl.uniform1f(uniforms.u_hasTexture, renderState.hasTextureFactor)
      if (renderState.hasTextureFactor > 0.001 && renderState.lastValidTexture) {
         gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, renderState.lastValidTexture)
         gl.uniform1i(uniforms.u_photoTexture, 0); gl.uniform4f(uniforms.u_imgRect, ...renderState.lastValidRect)
      } else if (!isTextureBound) gl.uniform1f(uniforms.u_hasTexture, 0.0)

      gl.drawArrays(gl.TRIANGLES, 0, 6); raf = requestAnimationFrame(render)
    }
    render()

    const handleMove = (e: MouseEvent) => { 
      updatePosition(e.clientX, e.clientY)
      spatialAudio.playBioFieldDisruptionAtPosition({ x: e.clientX, y: e.clientY }, state.energy / 100) 
      
      const targetUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
      if (targetUnder && targetUnder.closest('p, h1, h2, h3, h4, h5, h6, span, [data-cursor="text"]')) {
         isHoveringText = true
      } else {
         isHoveringText = false
      }
    }
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement; const interactable = target.closest('button, a, img, [data-cursor]') as HTMLElement
      if (interactable) {
        setTargetElement(interactable)
        if (interactable.getAttribute('data-cursor') === 'dot') { setMood('curious'); addEnergy(2); triggerHaptic(5) } 
        else { setMood('happy'); addEnergy(5); spatialAudio.playEatSoundAtPosition({ x: e.clientX, y: e.clientY }); triggerHaptic(10) }
      }
    }
    const handleOut = () => setTargetElement(null)
    const handleScroll = () => {
      lastInteractTime = Date.now() 
      const target = document.elementFromPoint(state.position.x, state.position.y) as HTMLElement
      if (!target) { setTargetElement(null); return }
      const interactable = target.closest('button, a, img, [data-cursor]') as HTMLElement
      if (interactable !== state.targetElement) setTargetElement(interactable)
    }

    window.addEventListener('mousemove', handleMove); window.addEventListener('mouseover', handleOver)
    window.addEventListener('mouseout', handleOut); window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseover', handleOver)
      window.removeEventListener('mouseout', handleOut); window.removeEventListener('scroll', handleScroll)
      
      if (glRef.current) {
        const gl = glRef.current
        textureCache.current.forEach((tex) => { if (tex !== 'loading') gl.deleteTexture(tex) }); textureCache.current.clear()
        if (bufferRef.current) { gl.deleteBuffer(bufferRef.current); bufferRef.current = null }
        if (programRef.current) { gl.deleteProgram(programRef.current); programRef.current = null }
      }
    }
  }, [initWebGL, state, updatePosition, setMood, addEnergy, setTargetElement, engine])

  if (isTouchDevice) return null
  return <canvas ref={canvasRef} className="fixed inset-0 z-[99999] pointer-events-none w-full h-full" style={{ mixBlendMode: 'normal' }} />
}