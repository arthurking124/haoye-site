'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useMotionValue, animate, AnimatePresence, useSpring } from 'framer-motion'
import InkFishes from '@/components/ui/InkFishes' // 👑 引入双鱼引擎
import GenesisLoading from '@/components/ui/GenesisLoading' // 引入创世加载

// =========================================================
// 🕳️ WebGL 引擎：大一统顺时针坍缩版 (引力与流向完美统一)
// =========================================================
function TaiChiVortexCanvas({ vortexProgress }: { vortexProgress: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
    if (!gl) return

    const vsSource = `attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`
    
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_vortex; 
      uniform vec2 u_mouse;

      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865, 0.366025404, -0.577350269, 0.0243902439);
        vec2 i  = floor(v + dot(v, C.yy) ); vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ; vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      float fbm(vec2 uv) {
        float f = 0.0; float amp = 0.5;
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 4; i++) {
            f += amp * snoise(uv); uv = rot * uv * 2.0; amp *= 0.5;
        }
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 p = (uv * 2.0 - 1.0) * aspect; 
        
        // 👑 真实物理鼠标涟漪
        vec2 mouseP = (u_mouse * 2.0 - 1.0) * aspect;
        vec2 mouseDelta = p - mouseP;
        float mouseDist = length(mouseDelta);
        float rippleFalloff = exp(-mouseDist * 12.0);
        float rippleWave = sin(mouseDist * 50.0 - u_time * 10.0);
        p += (mouseDelta / max(mouseDist, 0.001)) * rippleFalloff * rippleWave * 0.03;

        // ==========================================
        // 💥 大一统引擎：宏观扭曲空间 (绝对顺时针)
        // ==========================================
        float distToCenter = length(p);
        float twist = -u_vortex * 25.0 * exp(-distToCenter * 2.5); // 负号驱动顺时针
        mat2 twistRot = mat2(cos(twist), -sin(twist), sin(twist), cos(twist));
        vec2 twistedP = twistRot * p;
        
        // 漩涡引力：把所有东西向中心吸入
        twistedP *= (1.0 + u_vortex * 1.5);

        // ==========================================
        // 1. S 型交界线 (建立在顺时针扭曲空间上)
        // ==========================================
        float R = 0.6; 
        float targetX = sign(twistedP.y) * sqrt(max(0.0, R*R - pow(abs(twistedP.y) - R, 2.0)));
        float s_curve = twistedP.x - targetX;
        
        // 锋利的线绷紧张力
        float edgeWiggle = (fbm(vec2(twistedP.x, twistedP.y * 3.0 - u_time * 0.2)) - 0.5) * 0.015;
        float boundary = s_curve + edgeWiggle;
        
        // 极致锋利
        float baseMix = smoothstep(-0.001, 0.001, boundary);
        float mixRatio = 1.0 - baseMix;

        // ==========================================
        // 2. 👑 大一统引擎：微观水流场 (恢复纯正顺时针)
        // ==========================================
        vec2 flow = vec2(twistedP.y, -twistedP.x); 
        vec2 fluidP = twistedP - flow * u_time * 0.055; 

        // ==========================================
        // 3. 表面材质 (1:1 像素级同步)
        // ==========================================
        float time = u_time * 0.018;
        vec2 q = vec2(fbm(fluidP + time * 0.8), fbm(fluidP + vec2(1.0) + time * 0.5));
        vec2 noiseR = vec2(fbm(fluidP + 2.0 * q + vec2(1.7, 9.2) + 0.15 * time), fbm(fluidP + 2.0 * q + vec2(8.3, 2.8) + 0.12 * time));
        float h = fbm(fluidP + noiseR);

        vec2 eps = vec2(0.01, 0.0); 
        float nx = fbm(fluidP + noiseR + eps) - h;
        float ny = fbm(fluidP + noiseR + eps.yx) - h;
        vec3 normal = normalize(vec3(nx, ny, 0.85)); 

        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 lightDir = normalize(vec3(0.5, 0.8, 1.5));
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.5);
        
        // 🌑 深渊黑水
        float specD = pow(max(dot(normal, normalize(lightDir + viewDir)), 0.0), 50.0);
        vec3 abyssColor = mix(vec3(0.015, 0.015, 0.02), vec3(0.08, 0.1, 0.12), fresnel) + (specD * 0.35);

        // ☀️ 晨曦白水
        float specL = pow(max(dot(normal, normalize(lightDir + viewDir)), 0.0), 100.0);
        vec3 lightColor = vec3(0.96, 0.94, 0.91) + (smoothstep(0.4, 0.6, h) * 0.12) + (specL * 0.3);

        // ==========================================
        // 4. 同化引擎 (Assimilation)
        // ==========================================
        float assimilation = smoothstep(0.1, 0.8, u_vortex); 
        vec3 assimilatedLightColor = mix(lightColor, abyssColor, assimilation);

        vec3 color = mix(abyssColor, assimilatedLightColor, mixRatio);
        
        // 中心漩涡爆发高光
        color += vec3(0.9, 0.95, 1.0) * smoothstep(0.3, 0.0, distToCenter) * u_vortex * 2.0;
        // 彻底转黑衔接内页
        color = mix(color, vec3(0.015, 0.015, 0.02), smoothstep(0.7, 1.0, u_vortex));

        gl_FragColor = vec4(color, 1.0);
      }
    `
    const program = gl.createProgram()!
    const compile = (t: number, s: string) => {
      // 👑 已修复：正确的 compileShader API 调用
      const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); return sh;
    }
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vsSource))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(program); gl.useProgram(program)

    const uRes = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uVor = gl.getUniformLocation(program, 'u_vortex')
    const uMouse = gl.getUniformLocation(program, 'u_mouse') 

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    let targetMouseX = -2.0, targetMouseY = -2.0
    let currentMouseX = -2.0, currentMouseY = -2.0
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX / window.innerWidth
      targetMouseY = 1.0 - (e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', handleMouseMove)

    let aid: number, start = Date.now()
    const resize = () => {
      canvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2)
      canvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize); resize()
    
    const render = () => {
      currentMouseX += (targetMouseX - currentMouseX) * 0.08
      currentMouseY += (targetMouseY - currentMouseY) * 0.08
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, (Date.now() - start) * 0.001)
      gl.uniform1f(uVor, vortexProgress.get())
      gl.uniform2f(uMouse, currentMouseX, currentMouseY) 
      gl.drawArrays(gl.TRIANGLES, 0, 6); aid = requestAnimationFrame(render)
    }
    render()
    return () => { 
      cancelAnimationFrame(aid); 
      window.removeEventListener('resize', resize); 
      window.removeEventListener('mousemove', handleMouseMove);
      gl.deleteProgram(program) 
    }
  }, [vortexProgress])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />
}

// =========================================================
// 🧲 物理引力组件：磁吸与呼吸悬浮双重引擎
// =========================================================
function FloatingMagnetic({ children, floatDelay = 0, isActive = true }: { children: React.ReactNode, floatDelay?: number, isActive?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || !isActive) return
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    x.set((e.clientX - centerX) * 0.3)
    y.set((e.clientY - centerY) * 0.3)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      animate={isActive ? { y: [0, -8, 0] } : { y: 0 }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
      className="absolute flex flex-col"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ x: springX, y: springY }}
        className="p-8 -m-8 flex items-center justify-center cursor-pointer pointer-events-auto"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// =========================================================
// 🔮 交互层：精准排版与物理引擎注入
// =========================================================

const NAVS = [
  { id: 'v', l: '影', s: 'VISIONS', pos: 'top-12 left-10 md:top-16 md:left-16 items-start', textCls: 'text-[#050505]/80 group-hover:text-[#050505]', subCls: 'text-[#050505]/40 group-hover:text-[#050505]/80', dropColor: 'black', path: '/images', delay: 0 },
  { id: 'p', l: '诗', s: 'POEMS', pos: 'top-12 right-10 md:top-16 md:right-16 items-end', textCls: 'text-white/80 group-hover:text-white', subCls: 'text-white/40 group-hover:text-white/80', dropColor: 'white', path: '/poems', delay: 1.2 },
  { id: 'n', l: '与', s: 'NOTES', pos: 'bottom-16 left-10 md:bottom-20 md:left-16 items-start', textCls: 'text-[#050505]/80 group-hover:text-[#050505]', subCls: 'text-[#050505]/40 group-hover:text-[#050505]/80', dropColor: 'black', path: '/notes', delay: 2.4 },
  { id: 'a', l: '我', s: 'ABOUT', pos: 'bottom-16 right-10 md:bottom-20 md:right-16 items-end', textCls: 'text-white/80 group-hover:text-white', subCls: 'text-white/40 group-hover:text-white/80', dropColor: 'white', path: '/about', delay: 0.6 },
]

export default function HomePage() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'dropping' | 'vortexing'>('idle')
  const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const vortex = useMotionValue(0)
  const [dropTheme, setDropTheme] = useState<'white' | 'black'>('white')

  // 👑 记忆锁：控制是否进入了网站主体
  const [hasEntered, setHasEntered] = useState(false)
  const [isChecking, setIsChecking] = useState(true) // 防止页面刷新时状态闪烁

  // 1. 挂载时检查是否已经看过加载大片
  useEffect(() => {
    const alreadyEntered = sessionStorage.getItem('haoye-has-entered')
    if (alreadyEntered === 'true') {
      setHasEntered(true)
    }
    setIsChecking(false)
  }, [])

  // 2. 点击导航时的下坠与坍缩动画
  const trigger = (e: React.MouseEvent, path: string, color: 'white' | 'black') => {
    if (state !== 'idle') return
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    setDropTheme(color)
    setState('dropping')

    setTimeout(() => {
      setState('vortexing')
      animate(vortex, 1, { duration: 1.8, ease: [0.65, 0, 0.35, 1] })
      setTimeout(() => router.push(path), 1500)
    }, 850)
  }

  // 3. 创世加载结束回调，打上思想钢印
  const handleLoadingComplete = () => {
    setHasEntered(true)
    sessionStorage.setItem('haoye-has-entered', 'true') // 👑 写入记忆
  }

  return (
    <>
      {/* 👑 1. 创世加载序章：仅在没看过且检查完毕后才显示 */}
      <AnimatePresence>
        {!isChecking && !hasEntered && (
          <GenesisLoading onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      {/* 2. 网站主体：你的完美原始代码逻辑 */}
      <main 
        className="relative w-full h-[100svh] overflow-hidden bg-[#050505]"
        style={{ 
          opacity: hasEntered ? 1 : 0, 
          transition: 'opacity 1s ease', // 动画完成后平滑淡入主站
          visibility: hasEntered ? 'visible' : 'hidden' 
        }}
      >
        {/* 永远流淌的底层太极背景 */}
        <TaiChiVortexCanvas vortexProgress={vortex} />

        {/* 挂载水墨双鱼，飘在水面之上 */}
        <InkFishes />

        {/* 居中 HAOYE 文字 */}
        <motion.div 
          animate={
            state === 'idle' 
              ? { opacity: 0.4, y: [0, -10, 0] } 
              : { opacity: 0, y: 0 }
          }
          transition={{ 
            opacity: { duration: 0.8 }, 
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" } 
          }}
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none font-mono text-[16px] md:text-[22px] tracking-[1.5em] text-white mix-blend-difference ml-[1.5em]"
        >
          HAOYE
        </motion.div>

        {/* 四角导航矩阵 */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {NAVS.map((n) => (
            <div key={n.id} className={`absolute flex flex-col ${n.pos}`}>
              <FloatingMagnetic floatDelay={n.delay} isActive={state === 'idle'}>
                <motion.div
                  animate={{ 
                    opacity: state === 'idle' ? 1 : 0, 
                    filter: state === 'idle' ? 'blur(0px)' : 'blur(10px)',
                    scale: state === 'idle' ? 1 : 0.95
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  onClick={(e: any) => trigger(e, n.path, n.dropColor as 'white' | 'black')} 
                  className="group flex flex-col items-center"
                >
                  <span className={`text-[24px] md:text-[28px] font-light tracking-[0.2em] transition-all duration-700 ${n.textCls}`}>
                    {n.l}
                  </span>
                  <span className={`text-[9px] md:text-[10px] font-mono tracking-[0.4em] mt-3 transition-all duration-700 ${n.subCls}`}>
                    {n.s}
                  </span>
                </motion.div>
              </FloatingMagnetic>
            </div>
          ))}
        </div>

        {/* 水滴坠落引发空间坍缩的顶级特效 */}
        <AnimatePresence>
          {state === 'dropping' && (
            <motion.div
              initial={{ x: origin.x, y: origin.y, scale: 0.1, opacity: 0 }}
              animate={{ 
                x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
                y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0, 
                scale: [0.1, 1.5, 1.0],
                opacity: 1 
              }}
              transition={{ duration: 0.85, ease: "circIn" }}
              className={`fixed z-50 w-3 h-3 rounded-full pointer-events-none -ml-1.5 -mt-1.5 ${
                dropTheme === 'black' 
                  ? 'bg-[#050505] shadow-[0_0_20px_3px_rgba(0,0,0,0.6),0_0_50px_rgba(0,0,0,0.3)]'
                  : 'bg-white shadow-[0_0_20px_3px_rgba(255,255,255,0.9),0_0_50px_rgba(255,255,255,0.4)]'
              }`}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  )
}