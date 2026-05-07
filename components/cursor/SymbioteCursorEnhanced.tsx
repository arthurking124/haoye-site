'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSensory } from '@/components/providers/GlobalSensoryProvider'
import { SymbioteSpatialAudio } from '@/lib/SymbioteSpatialAudio'
import { BioFieldDisruption } from '@/lib/BioFieldDisruption'
import { useCursorState } from '@/hooks/useCursorState'

/**
 * 👑 「共生体·天演」- 最终幻境纪元版 (The Sentient Obsidian Ink - Absolute God Mode)
 * 极致打磨的七大微观物理与光学细节：
 * 1. 文本透镜 (The Reading Lens): 悬停文本时水滴化。
 * 2. 几何完美包裹 & 游离透镜 (Morphing & Lens): UI 包裹，图片游离。
 * 3. 边界溃散 (Viewport Evaporation): 离开屏幕粒子消亡。
 * 4. 代谢残渣 (Metabolic Residue): 甩出荧光卫星滴。
 * 5. 滚动惯性形变 (Scroll Skew): 纵向拉长、横向变细。
 * 6. 按压物理反馈 (Mousedown Squish): 果冻挤压感。
 * 7. 油膜虹彩 (Iridescence): 已修复高频同心圆，呈现极其平滑的结构色。
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
      
      uniform vec3 u_feedColor;
      uniform float u_feedWeight;
      
      uniform float u_targetRadius; 
      uniform vec2 u_targetSize; 
      uniform float u_targetViscosity;  
      
      uniform float u_refractionStrength; 
      uniform float u_audio_amplitude; 
      uniform vec2 u_targetPos; 
      
      uniform float u_isHovering;
      uniform float u_isHoveringText; 
      uniform float u_evaporate;      
      uniform float u_isPressed;      
      
      uniform float u_theme; 
      uniform float u_hasTexture; uniform vec4 u_imgRect; uniform sampler2D u_photoTexture;

      vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(6.28318 * (c * t + d));
      }

      float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * k * (1.0 / 4.0);
      }
      
      float sdSegment( in vec2 p, in vec2 a, in vec2 b ) {
        vec2 pa = p-a, ba = b-a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
        return length( pa - ba*h );
      }
      
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
        
        float stretchY = 1.0 + min(abs(u_scrollDelta) * 0.02, 2.0); 
        float compressX = max(0.3, 1.0 / sqrt(stretchY));           
        
        float pressSquishY = mix(1.0, 0.5, u_isPressed); 
        float pressSquishX = mix(1.0, 1.3, u_isPressed); 
        
        vec2 deformedQ = q;
        deformedQ.y -= u_scrollDelta * 0.005; 
        deformedQ.x /= (compressX * pressSquishX);
        deformedQ.y /= (stretchY * pressSquishY);

        vec2 dir = currPos - prevPos;
        float speed = length(dir) * u_resolution.y; 
        vec2 normDir = speed > 0.001 ? normalize(dir) : vec2(1.0, 0.0); 
        
        float activeStretch = mix(0.0, 0.015, u_growthFactor);
        float stretchThinning = clamp(1.0 - speed * activeStretch, 0.45, 1.0); 
        float currentRadius = (u_baseRadius / u_resolution.y) * mix(0.12, 1.0, u_growthFactor);

        float dotDir = dot(deformedQ, normDir);
        vec2 proj = dotDir * normDir; 
        vec2 orth = deformedQ - proj;         
        deformedQ = proj / stretchThinning + orth * stretchThinning; 

        float dHead = length(deformedQ) - currentRadius;
        float tailThickness = currentRadius * stretchThinning * 0.5 * u_tailWeight * u_growthFactor;
        
        float dTail = sdSegment(p, prevPos, currPos) - tailThickness; 
        
        float dSat = 999.0;
        if (speed > 8.0 && u_growthFactor > 0.3) { 
            vec2 satPos1 = prevPos - normDir * (speed * 0.0035);
            dSat = min(dSat, length(p - satPos1) - (currentRadius * 0.35)); 
            if (u_feedWeight > 0.1) {
                vec2 satPos2 = prevPos - normDir * (speed * 0.005) + vec2(normDir.y, -normDir.x) * (snoise(p * 15.0 + vec2(u_time)) * 0.015);
                dSat = min(dSat, length(p - satPos2) - (currentRadius * 0.2));
                vec2 satPos3 = prevPos - normDir * (speed * 0.007) + vec2(-normDir.y, normDir.x) * (snoise(p * 20.0 - vec2(u_time)) * 0.02);
                dSat = min(dSat, length(p - satPos3) - (currentRadius * 0.12));
            }
        }
        
        float dist = smin(dHead, dTail, mix(0.02, 0.15, u_growthFactor)); 
        dist = smin(dist, dSat, 0.15); 

        float currentWobbleAmp = u_wobbleAmp * mix(1.0, 0.15, u_isPressed);
        float jiggle = snoise(deformedQ * u_wobbleFreq - vec2(u_time * 2.0)) * currentWobbleAmp * stretchThinning * u_growthFactor;
        jiggle += snoise(deformedQ * (u_wobbleFreq + u_audio_amplitude * 20.0)) * (u_audio_amplitude * 0.05);
        dist += jiggle;

        vec2 nearestPos = (u_nearestPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0); nearestPos.y = -nearestPos.y;
        float dTether = 999.0;
        if (u_nearestDist < 1.0 && u_isHovering < 0.5 && u_growthFactor > 0.5) {
            float stretchRatio = pow(1.0 - u_nearestDist, 1.2); 
            vec2 tetherEnd = mix(currPos, nearestPos, stretchRatio * 0.8);
            float tetherThick = currentRadius * 0.5 * stretchRatio; 
            dTether = sdSegment(p, currPos, tetherEnd) - tetherThick;
        }
        dist = smin(dist, dTether, 0.25); 

        vec2 targetPos = (u_targetPos / u_resolution - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0); targetPos.y = -targetPos.y;
        vec2 tSize = (u_targetSize / u_resolution) * vec2(u_resolution.x / u_resolution.y, 1.0) * 0.5;
        vec2 adjustedBoxSize = max(vec2(0.0), tSize - vec2(u_targetRadius / u_resolution.y));
        float targetDist = sdBox(p - targetPos, adjustedBoxSize) - (u_targetRadius / u_resolution.y);
        dist = mix(dist, smin(dist, targetDist, u_targetViscosity), u_isHovering);

        float noiseErase = snoise(p * 25.0 + vec2(u_time * 3.0)) * 0.1;
        dist += u_evaporate * (0.05 + noiseErase);

        float alpha = smoothstep(0.004, -0.001, dist); 
        vec2 pseudoNormal = normalize(p - (u_isHovering > 0.5 ? targetPos : currPos));
        float surfaceCurve = smoothstep(0.0, 0.06, abs(dist));
        vec3 normal3D = normalize(vec3(pseudoNormal, 1.0 - surfaceCurve));

        vec3 lightDir = normalize(vec3(-1.0, 1.5, 1.5));
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 halfDir = normalize(lightDir + viewDir);

        float diff = max(dot(normal3D, lightDir), 0.0); 
        float spec = pow(max(dot(normal3D, halfDir), 0.0), 256.0); 
        // 👑 遵守绝对真实的 PBR 物理法则，让边缘光极其锋利，核心深不可测
        float fresnel = pow(1.0 - max(dot(normal3D, viewDir), 0.0), 5.0);

        // 👑 修正：降低噪波频率，消除致密的同心圆
        float noiseIri = snoise(p * 3.0 - vec2(u_time * 0.2));
        float iriFactor = fresnel * 1.2 + noiseIri * 0.3 + u_time * 0.05;

        vec3 coreInk; vec3 edgeColor; vec3 specColor;
        if (u_theme > 0.5) { 
            // 1. 极致深渊黑：剥离所有浑浊的棕色，压暗到 0.015，并带入极其微弱的冷蓝色调，产生“湿润的墨水感”
            coreInk = vec3(0.015, 0.015, 0.02);  
            
            // 2. 乌鸦羽毛/甲虫壳 虹彩常数：
            // - a (基础色): 极暗的幽蓝底色
            // - b (振幅): 极低振幅，确保虹彩深沉昂贵
            // - d (相位): [0.3, 0.2, 0.5] 完美模拟机油表面的孔雀绿、暗紫与幽蓝
            edgeColor = cosPalette(iriFactor * 0.6, vec3(0.08, 0.09, 0.12), vec3(0.15, 0.18, 0.22), vec3(1.0, 1.0, 1.0), vec3(0.3, 0.2, 0.5));
            
            // 3. 极其锋利的玻璃高光：让这滴墨水看起来像表面张力极高的玻璃体
            specColor = vec3(0.95, 0.96, 0.98);
        } else {
            // ... 下面是你已经改好的黑夜水银模式 ...
            // 1. 纯净的水银内核：稍微压暗，带有一丝极其幽冷的蓝灰，增加液态金属的密度感
            coreInk = vec3(0.38, 0.42, 0.48); 
            
            // 2. 完美的薄膜干涉常数：
            // - a (基础色): 高级银灰色
            // - b (振幅): 极低振幅(0.2)，确保虹彩若隐若现，绝不喧宾夺主
            // - d (相位): [0.4, 0.5, 0.6] 产生极其昂贵的青/洋红/金 的镜头色散级渐变
            edgeColor = cosPalette(iriFactor * 0.5, vec3(0.70, 0.72, 0.75), vec3(0.20, 0.15, 0.25), vec3(1.0, 1.0, 1.0), vec3(0.4, 0.5, 0.6));
            
            // 删除了暴力的 *= 2.0，让颜色在绝对安全的色彩空间内流转
            
            // 3. 极致锐利的高光：让水银的表面张力看起来达到极致
            specColor = vec3(1.0, 1.0, 1.0);
        }

        coreInk = mix(coreInk, vec3(0.95, 0.96, 0.98), u_isHoveringText * 0.7); 
        alpha *= mix(1.0, 0.25, u_isHoveringText); 

        vec3 glowingFeed = u_feedColor * 2.5; 
        edgeColor = mix(edgeColor, glowingFeed, u_feedWeight * 0.8);
        
        vec3 finalColor = coreInk;
        finalColor += diff * (u_theme > 0.5 ? 0.02 : 0.05); 
        finalColor += fresnel * mix(edgeColor, vec3(1.0), u_isHoveringText); 
        finalColor += spec * specColor * mix(0.5, 1.5, u_growthFactor + u_isHoveringText); 
        
        float innerGlowMask = smoothstep(-0.015, -0.005, dist); 
        finalColor += glowingFeed * innerGlowMask * (u_feedWeight * 0.9); 
        
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
                vec3 chromaticFeed = mix(vec3(gray), texColor * 1.5, 0.6); 
                vec3 inkRefraction = mix(coreInk, chromaticFeed, 0.7); 
                inkRefraction += fresnel * edgeColor * 0.8;
                inkRefraction += spec * specColor * mix(0.5, 1.2, u_growthFactor); 
                finalColor = mix(finalColor, inkRefraction, u_hasTexture);
            }
        }
        
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
      
      u_isHovering: getLoc('u_isHovering'), u_isHoveringText: getLoc('u_isHoveringText'), 
      u_evaporate: getLoc('u_evaporate'), u_isPressed: getLoc('u_isPressed'),
      
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

    let targetEvaporate = 0.0;
    let isPressedRaw = false;
    
    const handleMouseLeave = () => { targetEvaporate = 1.0; }
    const handleMouseEnter = () => { targetEvaporate = 0.0; }
    const handleMouseDown = () => { isPressedRaw = true; }
    const handleMouseUp = () => { isPressedRaw = false; }
    
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const initialDpr = Math.min(window.devicePixelRatio, 2)
    const renderState = {
      baseRadius: 18.0, wobbleFreq: 2.5, wobbleAmp: 0.015, 
      cursorX: state.position.x * initialDpr, cursorY: state.position.y * initialDpr,
      
      nearestX: state.position.x * initialDpr, nearestY: state.position.y * initialDpr, nearestDist: 1.0,
      scrollDelta: 0, 
      
      feedColor: [0.0, 0.0, 0.0], feedWeight: 0.0, 
      
      targetRadius: 15.0, targetWidth: 0.0, targetHeight: 0.0, targetViscosity: 0.35, hasTextureFactor: 0.0, 
      
      isHoveringText: 0.0, evaporate: 0.0, isPressed: 0.0,
      
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
          tWidth = 0.0; tHeight = 0.0;
        } else if (isImg) {
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

      renderState.isHoveringText = lerp(renderState.isHoveringText, isHoveringTextRaw ? 1.0 : 0.0, 0.15)
      renderState.evaporate = lerp(renderState.evaporate, targetEvaporate, 0.1)
      // 👑 提高受力挤压时的肌肉张力（0.35），更有弹性
      renderState.isPressed = lerp(renderState.isPressed, isPressedRaw ? 1.0 : 0.0, 0.35)
      // 👑 降低日常游走的跟随速度（0.21），增加高密度液体的重量感与粘滞感

      const trackingSpeed = isHoveringTextRaw ? 0.08 : 0.21
      
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
      gl.uniform1f(uniforms.u_isPressed, renderState.isPressed)

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
      window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp)
      
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