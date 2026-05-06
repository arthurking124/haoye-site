'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSensory } from '@/components/providers/GlobalSensoryProvider'
import { SymbioteSpatialAudio } from '@/lib/SymbioteSpatialAudio'
import { BioFieldDisruption } from '@/lib/BioFieldDisruption'
import { useCursorState } from '@/hooks/useCursorState'

/**
 * 👑 「共生体·天演」- SOTY 殿堂级终极进化版 (The Sentient Obsidian Ink - Apex God Mode)
 * 极致打磨的四大物理微观细节：
 * 1. 文本透镜 (The Reading Lens): 悬停文本时水滴化，保证绝对的阅读清晰度。
 * 2. 几何完美包裹 (SDF Box Morphing): 悬停组件时，SDF 平滑形变成完美贴合的圆角矩形。
 * 3. 边界溃散 (Viewport Evaporation): 鼠标离开屏幕瞬间化为流体粒子消亡。
 * 4. 代谢残渣 (Metabolic Residue): 高速移动且发光进食时，抛甩出荧光卫星滴。
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
      
      uniform float u_growthFactor;   
      uniform float u_tailWeight;     
      uniform float u_baseRadius; 
      uniform float u_wobbleFreq;     
      uniform float u_wobbleAmp;      
      
      uniform vec2 u_nearestPos;     
      uniform float u_nearestDist;   
      uniform float u_scrollDelta;   
      
      // 👑 进食与代谢系统
      uniform vec3 u_feedColor;
      uniform float u_feedWeight;
      
      // 👑 几何包裹与变形系统
      uniform float u_targetRadius; 
      uniform vec2 u_targetSize; // 用于完美包裹的矩形尺寸
      uniform float u_targetViscosity;  
      
      uniform float u_refractionStrength; 
      uniform float u_audio_amplitude; 
      uniform vec2 u_targetPos; 
      
      // 👑 状态控制器
      uniform float u_isHovering;
      uniform float u_isHoveringText; // 文本透镜开关
      uniform float u_evaporate;      // 边界溃散开关
      
      uniform float u_theme; 
      uniform float u_hasTexture; uniform vec4 u_imgRect; uniform sampler2D u_photoTexture;

      // SDF 混合函数
      float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * k * (1.0 / 4.0);
      }
      
      // 胶囊体 SDF (拉丝使用)
      float sdSegment( in vec2 p, in vec2 a, in vec2 b ) {
        vec2 pa = p-a, ba = b-a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
        return length( pa - ba*h );
      }
      
      // 👑 完美的圆角矩形 SDF (包裹使用)
      float sdBox(vec2 p, vec2 b) {
        vec2 d = abs(p) - b;
        return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
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

        vec2 q = p - currPos;
        q.y -= u_scrollDelta * 0.02 * u_growthFactor;

        vec2 dir = currPos - prevPos;
        float speed = length(dir) * u_resolution.y; 
        vec2 normDir = speed > 0.001 ? normalize(dir) : vec2(1.0, 0.0); 
        
        float activeStretch = mix(0.0, 0.015, u_growthFactor);
        float stretchThinning = clamp(1.0 - speed * activeStretch, 0.45, 1.0); 
        float currentRadius = (u_baseRadius / u_resolution.y) * mix(0.12, 1.0, u_growthFactor);

        float dotDir = dot(q, normDir);
        vec2 proj = dotDir * normDir; 
        vec2 orth = q - proj;         
        q = proj / stretchThinning + orth * stretchThinning; 

        // 头部与基础拉丝
        float dHead = length(q) - currentRadius;
        float tailThickness = currentRadius * stretchThinning * 0.5 * u_tailWeight * u_growthFactor;
        float dTail = sdSegment(p, prevPos, currPos) - tailThickness; 
        
        // 👑 优化4：代谢残渣逻辑。速度越快，吃的越多，甩出的荧光墨滴越多
        float dSat = 999.0;
        if (speed > 8.0 && u_growthFactor > 0.3) { 
            // 卫星滴 1：较大
            vec2 satPos1 = prevPos - normDir * (speed * 0.0035);
            dSat = min(dSat, length(p - satPos1) - (currentRadius * 0.35)); 
            
            // 卫星滴 2 & 3：高能代谢时才会产生微小的游离分子
            if (u_feedWeight > 0.1) {
                vec2 satPos2 = prevPos - normDir * (speed * 0.005) + vec2(normDir.y, -normDir.x) * (snoise(p * 15.0 + u_time) * 0.015);
                dSat = min(dSat, length(p - satPos2) - (currentRadius * 0.2));
                vec2 satPos3 = prevPos - normDir * (speed * 0.007) + vec2(-normDir.y, normDir.x) * (snoise(p * 20.0 - u_time) * 0.02);
                dSat = min(dSat, length(p - satPos3) - (currentRadius * 0.12));
            }
        }
        
        float dist = smin(dHead, dTail, mix(0.02, 0.15, u_growthFactor)); 
        dist = smin(dist, dSat, 0.15); 

        // 表面张力噪波扰动
        float jiggle = snoise(q * u_wobbleFreq - u_time * 2.0) * u_wobbleAmp * stretchThinning * u_growthFactor;
        jiggle += snoise(q * (u_wobbleFreq + u_audio_amplitude * 20.0)) * (u_audio_amplitude * 0.05);
        dist += jiggle;

        // 磁性探针拉丝
        vec2 nearestPos = (u_nearestPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0); nearestPos.y = -nearestPos.y;
        float dTether = 999.0;
        if (u_nearestDist < 1.0 && u_isHovering < 0.5 && u_growthFactor > 0.5) {
            float stretchRatio = pow(1.0 - u_nearestDist, 1.2); 
            vec2 tetherEnd = mix(currPos, nearestPos, stretchRatio * 0.8);
            float tetherThick = currentRadius * 0.5 * stretchRatio; 
            dTether = sdSegment(p, currPos, tetherEnd) - tetherThick;
        }
        dist = smin(dist, dTether, 0.25); 

        // 👑 优化2：完美的几何吸附包裹
        vec2 targetPos = (u_targetPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0); targetPos.y = -targetPos.y;
        vec2 tSize = (u_targetSize / u_resolution) * vec2(u_resolution.x / u_resolution.y, 1.0) * 0.5;
        // 减去 targetRadius 是为了让包裹的边界严格对齐 DOM 的边框，而不仅是中心点扩张
        vec2 adjustedBoxSize = max(vec2(0.0), tSize - vec2(u_targetRadius / u_resolution.y));
        float targetDist = sdBox(p - targetPos, adjustedBoxSize) - (u_targetRadius / u_resolution.y);
        
        dist = mix(dist, smin(dist, targetDist, u_targetViscosity), u_isHovering);

        // 👑 优化3：视口边缘溃散 (Evaporation)
        float noiseErase = snoise(p * 25.0 + u_time * 3.0) * 0.1;
        dist += u_evaporate * (0.05 + noiseErase);

        // Alpha 与法线计算
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

        // 👑 优化1：文本透镜效果。悬停文本时，核心墨水瞬间变透明清澈水滴
        coreInk = mix(coreInk, vec3(0.95, 0.96, 0.98), u_isHoveringText * 0.7); 
        alpha *= mix(1.0, 0.25, u_isHoveringText); // 核心极度透明，保证后方文本清晰

        // 生物荧光发光染色算法
        vec3 glowingFeed = u_feedColor * 2.5; 
        edgeColor = mix(edgeColor, glowingFeed, u_feedWeight * 0.8);
        
        vec3 finalColor = coreInk;
        finalColor += diff * (u_theme > 0.5 ? 0.02 : 0.05); 
        // 文本透镜模式下，边缘高光变得更加锐利耀眼
        finalColor += fresnel * mix(edgeColor, vec3(1.0), u_isHoveringText); 
        finalColor += spec * specColor * mix(0.5, 1.5, u_growthFactor + u_isHoveringText); 
        
        // 内部透光
        float innerGlowMask = smoothstep(-0.015, -0.005, dist); 
        finalColor += glowingFeed * innerGlowMask * (u_feedWeight * 0.9); 
        
        // 音频干扰色差
        vec3 glitchColor = vec3(u_audio_amplitude * 0.8, 0.0, u_audio_amplitude * 0.3) * (1.0 - surfaceCurve);
        finalColor += glitchColor;

        // 图片颜色的吸收折射
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
                vec3 chromaticFeed = mix(vec3(gray), texColor * 1.5, 0.6); 
                vec3 inkRefraction = mix(coreInk, chromaticFeed, 0.7); 
                inkRefraction += fresnel * edgeColor * 0.8;
                inkRefraction += spec * specColor * mix(0.5, 1.2, u_growthFactor); 
                finalColor = mix(finalColor, inkRefraction, u_hasTexture);
            }
        }
        
        // 当溃散值极高时彻底丢弃像素，节省性能
        if (u_evaporate > 0.95 && alpha <= 0.01) discard;

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
      
      u_nearestPos: getLoc('u_nearestPos'), u_nearestDist: getLoc('u_nearestDist'), u_scrollDelta: getLoc('u_scrollDelta'), 
      u_feedColor: getLoc('u_feedColor'), u_feedWeight: getLoc('u_feedWeight'),
      
      u_targetRadius: getLoc('u_targetRadius'), u_targetSize: getLoc('u_targetSize'), u_targetViscosity: getLoc('u_targetViscosity'),
      u_refractionStrength: getLoc('u_refractionStrength'), u_audio_amplitude: getLoc('u_audio_amplitude'), 
      u_targetPos: getLoc('u_targetPos'), 
      
      u_isHovering: getLoc('u_isHovering'), u_isHoveringText: getLoc('u_isHoveringText'), u_evaporate: getLoc('u_evaporate'),
      
      u_theme: getLoc('u_theme'), 
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
    
    let cumulativeXP = 0
    let lastInteractTime = Date.now()
    let lastMouseX = state.position.x
    let lastMouseY = state.position.y
    let isHoveringTextRaw = false 
    
    let lastScrollY = window.scrollY

    const MAX_TEXTURE_CACHE = 8 

    const handleResize = () => {
      if (!canvasRef.current || !glRef.current) return
      const currentDpr = Math.min(window.devicePixelRatio, 2)
      canvasRef.current.width = window.innerWidth * currentDpr; canvasRef.current.height = window.innerHeight * currentDpr
      glRef.current.viewport(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    handleResize(); window.addEventListener('resize', handleResize)

    // 边界溃散状态记录
    let targetEvaporate = 0.0;
    const handleMouseLeave = () => { targetEvaporate = 1.0; }
    const handleMouseEnter = () => { targetEvaporate = 0.0; }
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    const initialDpr = Math.min(window.devicePixelRatio, 2)
    const renderState = {
      baseRadius: 18.0, wobbleFreq: 2.5, wobbleAmp: 0.015, 
      cursorX: state.position.x * initialDpr, cursorY: state.position.y * initialDpr,
      
      nearestX: state.position.x * initialDpr, nearestY: state.position.y * initialDpr, nearestDist: 1.0,
      scrollDelta: 0, 
      
      feedColor: [0.0, 0.0, 0.0], feedWeight: 0.0, 
      
      targetRadius: 15.0, targetWidth: 0.0, targetHeight: 0.0, targetViscosity: 0.35, hasTextureFactor: 0.0, 
      
      isHoveringText: 0.0, evaporate: 0.0,
      
      growthFactor: 0.0, tailWeight: 1.0, refractionStrength: 1.0, 
      genesisScale: 0.01, 
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

      renderState.genesisScale = lerp(renderState.genesisScale, 1.0, 0.035)
      renderState.scrollDelta = lerp(renderState.scrollDelta, 0, 0.1)
      
      renderState.feedWeight = lerp(renderState.feedWeight, 0.0, 0.015) 

      const dx = state.position.x - lastMouseX; const dy = state.position.y - lastMouseY
      const moveSpeed = Math.sqrt(dx * dx + dy * dy)
      
      if (moveSpeed > 0.5) { cumulativeXP = Math.min(1000, cumulativeXP + moveSpeed * 0.04); lastInteractTime = now }
      if (state.targetElement) { cumulativeXP = Math.min(1000, cumulativeXP + 2.0); lastInteractTime = now }

      const timeSinceInteract = now - lastInteractTime
      if (timeSinceInteract > 3500) cumulativeXP = Math.max(0, cumulativeXP - (timeSinceInteract - 3500) * 0.0015)

      const targetGrowth = 1.0 - Math.exp(-cumulativeXP * 0.003)
      renderState.growthFactor = lerp(renderState.growthFactor, targetGrowth, 0.03)
      
      lastMouseX = state.position.x; lastMouseY = state.position.y

      if (state.mood === 'angry' && prevMood !== 'angry') triggerHaptic([20, 30, 20])
      prevMood = state.mood

      let targetBaseRadius = 18.0
      let targetWobbleFreq = 2.5, targetWobbleAmp = 0.015
      let targetTailWeight = 1.0, targetRefraction = 1.0

      if (state.mood === 'tired') { 
        targetBaseRadius *= 0.7; targetTailWeight = 0.0; targetRefraction = 0.5; targetWobbleFreq = 1.0; targetWobbleAmp = 0.005 
      } else if (state.mood === 'happy') {
        targetBaseRadius *= 1.15; targetTailWeight = 0.0; targetRefraction = 2.2; targetWobbleFreq = 4.0; targetWobbleAmp = 0.01 
      } else if (state.mood === 'angry') {
        targetBaseRadius *= 1.3; targetTailWeight = 1.0; targetRefraction = 3.0; targetWobbleFreq = 12.0; targetWobbleAmp = 0.04 
      }

      let targetHasTexture = 0.0, tRadius = 15.0, tWidth = 0.0, tHeight = 0.0, tViscosity = 0.35, isTextureBound = false

      if (state.targetElement) {
        const el = state.targetElement; const rect = el.getBoundingClientRect() 
        gl.uniform2f(uniforms.u_targetPos, (rect.left + rect.width/2) * currentDpr, (rect.top + rect.height/2) * currentDpr)
        gl.uniform1f(uniforms.u_isHovering, 1.0)

        const isDot = el.getAttribute('data-cursor') === 'dot'
        const isImg = el.tagName.toLowerCase() === 'img'

        if (isDot) {
          targetBaseRadius = 5.0; tRadius = 8.0; tViscosity = 0.2
          // 圆点不需要边界形变包裹
          tWidth = 0.0; tHeight = 0.0;
        } else if (isImg) {
          // 👑 修正：对于图片，取消矩形 SDF 包裹，化身为“游离水滴透镜”
          targetBaseRadius = 24.0; tRadius = 32.0; tViscosity = 0.25
          tWidth = 0.0; tHeight = 0.0;
          
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
          // 常规按钮、导航或卡片：保持完美的矩形几何包裹
          targetBaseRadius = 12.0; tRadius = 14.0; tViscosity = 0.35
          tWidth = rect.width * currentDpr; tHeight = rect.height * currentDpr;
        }
      } else {
        gl.uniform1f(uniforms.u_isHovering, 0.0)
      }

      const lf = 0.08 
      renderState.baseRadius = lerp(renderState.baseRadius, targetBaseRadius, lf)
      renderState.wobbleFreq = lerp(renderState.wobbleFreq, targetWobbleFreq, lf)
      renderState.wobbleAmp = lerp(renderState.wobbleAmp, targetWobbleAmp, lf)
      
      renderState.targetRadius = lerp(renderState.targetRadius, tRadius, lf)
      renderState.targetWidth = lerp(renderState.targetWidth, tWidth, lf)
      renderState.targetHeight = lerp(renderState.targetHeight, tHeight, lf)
      renderState.targetViscosity = lerp(renderState.targetViscosity, tViscosity, lf)
      
      renderState.hasTextureFactor = lerp(renderState.hasTextureFactor, targetHasTexture, targetHasTexture > 0.5 ? 0.15 : 0.02)
      renderState.refractionStrength = lerp(renderState.refractionStrength, targetRefraction, lf)
      renderState.tailWeight = lerp(renderState.tailWeight, targetTailWeight, 0.15) 

      // 状态与透镜缓动
      renderState.isHoveringText = lerp(renderState.isHoveringText, isHoveringTextRaw ? 1.0 : 0.0, 0.15)
      renderState.evaporate = lerp(renderState.evaporate, targetEvaporate, 0.1)

      const trackingSpeed = isHoveringTextRaw ? 0.08 : 0.28
      
      gl.uniform2f(uniforms.u_prevCursorPos, renderState.cursorX, renderState.cursorY)
      renderState.cursorX = lerp(renderState.cursorX, state.position.x * currentDpr, trackingSpeed) 
      renderState.cursorY = lerp(renderState.cursorY, state.position.y * currentDpr, trackingSpeed)
      
      gl.uniform2f(uniforms.u_cursorPos, renderState.cursorX, renderState.cursorY)
      gl.uniform2f(uniforms.u_resolution, canvasRef.current!.width, canvasRef.current!.height)
      gl.uniform1f(uniforms.u_time, time)
      
      gl.uniform1f(uniforms.u_baseRadius, renderState.baseRadius * renderState.genesisScale)
      gl.uniform1f(uniforms.u_wobbleFreq, renderState.wobbleFreq)
      gl.uniform1f(uniforms.u_wobbleAmp, renderState.wobbleAmp)
      
      gl.uniform2f(uniforms.u_nearestPos, renderState.nearestX, renderState.nearestY)
      gl.uniform1f(uniforms.u_nearestDist, renderState.nearestDist)
      gl.uniform1f(uniforms.u_scrollDelta, renderState.scrollDelta)
      
      gl.uniform3f(uniforms.u_feedColor, renderState.feedColor[0], renderState.feedColor[1], renderState.feedColor[2])
      gl.uniform1f(uniforms.u_feedWeight, renderState.feedWeight)

      gl.uniform1f(uniforms.u_targetRadius, renderState.targetRadius)
      gl.uniform2f(uniforms.u_targetSize, renderState.targetWidth, renderState.targetHeight)
      gl.uniform1f(uniforms.u_targetViscosity, renderState.targetViscosity)
      gl.uniform1f(uniforms.u_refractionStrength, renderState.refractionStrength)
      
      gl.uniform1f(uniforms.u_isHoveringText, renderState.isHoveringText)
      gl.uniform1f(uniforms.u_evaporate, renderState.evaporate)

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
      
      const interactables = document.querySelectorAll('a, button, img, [data-cursor]')
      let minDist = 150.0
      let nearestPos = { x: e.clientX, y: e.clientY }
      
      interactables.forEach(el => {
         const rect = el.getBoundingClientRect()
         const cx = rect.left + rect.width / 2
         const cy = rect.top + rect.height / 2
         const dist = Math.hypot(e.clientX - cx, e.clientY - cy)
         if (dist < minDist) {
             minDist = dist
             nearestPos = { x: cx, y: cy }
         }
      })
      
      const currentDpr = Math.min(window.devicePixelRatio, 2)
      renderState.nearestX = lerp(renderState.nearestX, nearestPos.x * currentDpr, 0.2)
      renderState.nearestY = lerp(renderState.nearestY, nearestPos.y * currentDpr, 0.2)
      renderState.nearestDist = minDist / 150.0 

      const targetUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
      if (targetUnder && targetUnder.closest('p, h1, h2, h3, h4, h5, h6, span, [data-cursor="text"]')) {
         isHoveringTextRaw = true
      } else {
         isHoveringTextRaw = false
      }
    }
    
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement; const interactable = target.closest('button, a, img, [data-cursor], div') as HTMLElement
      if (interactable) {
        
        let el: HTMLElement | null = interactable
        let foundColor = false
        
        while (el && !foundColor) {
            const style = window.getComputedStyle(el)
            const bg = style.backgroundColor
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                const rgb = bg.match(/\d+/g)
                if (rgb && rgb.length >= 3) {
                    const r = parseInt(rgb[0])/255
                    const g = parseInt(rgb[1])/255
                    const b = parseInt(rgb[2])/255
                    if (r + g + b > 0.1 && r + g + b < 2.9) {
                        renderState.feedColor = [r, g, b]
                        renderState.feedWeight = 1.0 
                        foundColor = true
                    }
                }
            }
            el = el.parentElement
            if (el && el.tagName === 'BODY') break 
        }

        const isRealInteractable = target.closest('button, a, img, [data-cursor]')
        if (isRealInteractable) {
            setTargetElement(isRealInteractable as HTMLElement)
            if (isRealInteractable.getAttribute('data-cursor') === 'dot') { setMood('curious'); addEnergy(2); triggerHaptic(5) } 
            else { setMood('happy'); addEnergy(5); spatialAudio.playEatSoundAtPosition({ x: e.clientX, y: e.clientY }); triggerHaptic(10) }
        }
      }
    }
    const handleOut = () => setTargetElement(null)
    const handleScroll = () => {
      lastInteractTime = Date.now() 
      const currentScroll = window.scrollY
      renderState.scrollDelta += (currentScroll - lastScrollY)
      lastScrollY = currentScroll

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
      document.removeEventListener('mouseleave', handleMouseLeave); document.removeEventListener('mouseenter', handleMouseEnter)
      
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