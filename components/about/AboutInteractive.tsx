'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { motion, useMotionValue, useSpring, useAnimationFrame, useTransform, useMotionTemplate, AnimatePresence, animate } from 'framer-motion'
import { PortableText } from '@portabletext/react'
import SignatureMark from '@/components/ui/SignatureMark'

// =========================================================
// 🌑 黑色主题：纯粹的深渊探照灯
// =========================================================
function DarkAbyss({ about }: { about: any }) {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 })

  useEffect(() => {
    setMounted(true)
    mouseX.set(window.innerWidth / 2)
    mouseY.set(window.innerHeight / 2)
  }, [mouseX, mouseY])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const maskImage = useMotionTemplate`radial-gradient(circle 250px at ${springX}px ${springY}px, black 0%, rgba(0,0,0,0.5) 40%, transparent 100%)`

  const textParagraphs = useMemo(() => {
    return (about?.body || []).filter((b: any) => b._type === 'block').map((block: any) => {
      return block.children?.map((c: any) => c.text).join('') || ''
    }).filter((t: string) => t.trim().length > 0)
  }, [about])

  if (!mounted) return <div className="min-h-screen" />

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[100svh] w-full flex flex-col items-center justify-center overflow-hidden cursor-crosshair px-6"
    >
      <div className="relative z-10 w-full max-w-[640px] text-center">
        <div className="opacity-[0.04] pointer-events-none">
          {textParagraphs.map((para: string, pIdx: number) => (
            <p key={pIdx} className="mb-8 text-[15px] leading-[2.2] md:text-[16px] font-light tracking-[0.1em]">{para}</p>
          ))}
          <div className="mt-24 flex justify-center w-full"><SignatureMark /></div>
        </div>

        <motion.div 
          className="absolute inset-0 z-10 pointer-events-none text-white"
          style={{ WebkitMaskImage: maskImage, maskImage: maskImage, textShadow: '0 0 15px rgba(255,255,255,0.8)' }}
        >
          {textParagraphs.map((para: string, pIdx: number) => (
            <p key={`top-${pIdx}`} className="mb-8 text-[15px] leading-[2.2] md:text-[16px] font-light tracking-[0.1em]">{para}</p>
          ))}
          <div className="mt-24 flex justify-center w-full"><SignatureMark /></div>
        </motion.div>
      </div>
    </div>
  )
}

// =========================================================
// 🕳️ 原生 WebGL 深渊裂口着色器 (黑洞吞噬)
// =========================================================
function AbyssRiftCanvas({ progress }: { progress: any }) {
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
      uniform float u_progress;

      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865, 0.366025404, -0.577350269, 0.0243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
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
        vec2 p = uv * aspect;
        vec2 center = vec2(0.5) * aspect;

        float dist = length(p - center);
        float time = u_time * 0.8;
        float noiseEdge = fbm(p * 4.0 - time * 0.5) * 0.4;
        
        float targetRadius = u_progress * 1.5;
        float mask = smoothstep(targetRadius, targetRadius - 0.15, dist + noiseEdge * smoothstep(0.0, 0.5, u_progress));

        vec2 q = vec2(fbm(p + time * 0.1), fbm(p + vec2(1.0) + time * 0.1));
        float surfaceHeight = fbm(p + q * 2.0);
        vec3 waterColor = vec3(0.02, 0.02, 0.025);
        
        float depthDarkness = smoothstep(targetRadius - 0.2, 0.0, dist);
        vec3 finalColor = mix(waterColor + surfaceHeight * 0.05, vec3(0.0), depthDarkness * 0.8);

        gl_FragColor = vec4(finalColor, mask);
      }
    `
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!; gl.shaderSource(shader, source); gl.compileShader(shader); return shader;
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource))
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(program); gl.useProgram(program)

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    const positionLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(positionLoc); gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uProgress = gl.getUniformLocation(program, 'u_progress')

    let animationFrameId: number
    const startTime = Date.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize); resize()

    const render = () => {
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uTime, (Date.now() - startTime) * 0.001)
      gl.uniform1f(uProgress, progress.get()) 
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }
    render()

    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); gl.deleteProgram(program) }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />
}


// =========================================================
// ☁️ 白色主题：水下浮出 + 像素级真实纸张撕裂
// =========================================================

// 严格精算的多边形：中心点在 (48%, 52%)，确保 4 块碎片严丝合缝
const PAPER_TEARS = [
  "polygon(0% 0%, 55% 0%, 48% 52%, 0% 45%)",       // 左上
  "polygon(55% 0%, 100% 0%, 100% 60%, 48% 52%)",   // 右上
  "polygon(0% 45%, 48% 52%, 40% 100%, 0% 100%)",   // 左下
  "polygon(48% 52%, 100% 60%, 100% 100%, 40% 100%)"// 右下
]

// 撕裂时的微小物理位移 (为了展示出被撕裂的顿挫感)
const TEAR_PHYSICS = [
  { x: -8, y: -12, rotZ: -2 }, // 左上
  { x: 12, y: -8, rotZ: 2 },   // 右上
  { x: -12, y: 12, rotZ: 1.5 },// 左下
  { x: 8, y: 15, rotZ: -1.5 }  // 右下
]

// 统一的内部排版组件：确保主卡片和碎片里的文字 100% 像素级对齐！
const CardContent = ({ about }: { about: any }) => (
  <div className="relative z-10 text-[var(--site-text-solid)] h-full flex flex-col">
    <header className="mb-12">
      <p className="text-[10px] tracking-[0.3em] opacity-40 font-mono">BEHIND THE DOOR</p>
      <h1 className="mt-4 text-[32px] font-light md:text-[38px] tracking-widest">{about.title || '我'}</h1>
      {about.subtitle && <p className="mt-4 text-[14px] leading-[2.1] opacity-70">{about.subtitle}</p>}
    </header>
    <div className="haoye-about-rich border-t border-black/10 pt-8 text-[13px] leading-[2.3] opacity-80 flex-1">
      {about.body ? <PortableText value={about.body} /> : <p>未留底稿。</p>}
    </div>
    <div className="mt-16 flex justify-end opacity-60"><SignatureMark /></div>
  </div>
)

function LightPaper({ about }: { about: any }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [isHovered, setIsHovered] = useState(false)
  const [shatterState, setShatterState] = useState<'idle' | 'tearing' | 'imploding' | 'consuming' | 'recovering' | 'kintsugi'>('idle')
  
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const cardMouseX = useMotionValue(0)
  const cardMouseY = useMotionValue(0)
  
  const lastMouse = useRef({ x: 0, y: 0, time: 0 })
  const shakeAccumulator = useRef(0)
  const timeouts = useRef<NodeJS.Timeout[]>([])
  const riftProgress = useMotionValue(0)

  useEffect(() => { return () => timeouts.current.forEach(clearTimeout) }, [])

  const rotateX = useTransform(mouseY, [-400, 400], [12, -12])
  const rotateY = useTransform(mouseX, [-400, 400], [-12, 12])
  const springRotateX = useSpring(rotateX, { stiffness: 90, damping: 20, mass: 1 })
  const springRotateY = useSpring(rotateY, { stiffness: 90, damping: 20, mass: 1 })

  const glareX = useSpring(cardMouseX, { stiffness: 60, damping: 20 })
  const glareY = useSpring(cardMouseY, { stiffness: 60, damping: 20 })
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}px ${glareY}px, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 50%)`

  // 极速冷却防误触
  useAnimationFrame(() => {
    if (shatterState === 'idle') shakeAccumulator.current *= 0.8 
  })

  // 时间线
  const triggerShatterSequence = async () => {
    if (shatterState !== 'idle') return
    
    setShatterState('tearing') // 0s: 瞬间撕裂
    
    timeouts.current.push(
      setTimeout(() => {
        setShatterState('imploding') // 0.6s: 纸片悬停后，倒吸入极深处
        animate(riftProgress, 0.15, { duration: 0.8, ease: "easeOut" }) 
      }, 600),
      setTimeout(() => {
        setShatterState('consuming') // 1.4s: 黑液狂暴吞噬全屏
        animate(riftProgress, 1.0, { duration: 1.8, ease: [0.25, 1, 0.5, 1] }) 
      }, 1400),
      setTimeout(() => {
        setShatterState('recovering') // 4.2s: 黑液退散，碎片重生
        animate(riftProgress, 0.0, { duration: 1.5, ease: "easeInOut" })
      }, 4200),
      setTimeout(() => setShatterState('kintsugi'), 5700), // 5.7s: 闪烁深渊金缮
      setTimeout(() => {
        setShatterState('idle') // 7.5s: 彻底恢复
        shakeAccumulator.current = 0
      }, 7500)
    )
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - (rect.left + rect.width / 2))
    mouseY.set(e.clientY - (rect.top + rect.height / 2))

    // 摇晃阈值史诗级提升：必须暴力连续左右晃动！
    if (isHovered && shatterState === 'idle') {
      const now = performance.now()
      const dt = now - lastMouse.current.time
      if (dt > 0 && dt < 60) { 
        const speed = (Math.abs(e.clientX - lastMouse.current.x) + Math.abs(e.clientY - lastMouse.current.y)) / dt
        if (speed > 8.0) shakeAccumulator.current += speed * 4 // 只有极速移动才累加
        if (shakeAccumulator.current > 300) triggerShatterSequence() 
      }
      lastMouse.current = { x: e.clientX, y: e.clientY, time: now }
    }
  }

  // 共享的卡片底板样式 (确保碎片和主卡片一模一样！)
  const CARD_BASE_STYLE = "absolute inset-0 bg-[rgba(255,255,255,0.4)] backdrop-blur-2xl p-10 md:p-14 rounded-sm border border-white/60 overflow-hidden"

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[100svh] w-full flex items-center justify-center py-32 px-6 overflow-hidden pointer-events-auto"
      style={{ perspective: '2000px' }} 
    >
      <AbyssRiftCanvas progress={riftProgress} />

      <div
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => { setIsHovered(false); shakeAccumulator.current = 0 }}
        className="absolute inset-0 z-[100] cursor-pointer"
      />

      <motion.div
        style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-[360px] min-h-[60vh] flex items-center justify-center pointer-events-none z-10"
      >
        <motion.div
          animate={{
            z: (isHovered || shatterState !== 'idle') ? 0 : -100,
            y: (isHovered || shatterState !== 'idle') ? 0 : [0, 15, 0],
            scale: (isHovered || shatterState !== 'idle') ? 1 : 0.9,
            filter: (isHovered || shatterState !== 'idle') ? 'blur(0px)' : 'blur(5px) brightness(0.9) sepia(0.2) hue-rotate(180deg)'
          }}
          transition={{
            z: { duration: 0.6, ease: "easeOut" },
            y: (isHovered || shatterState !== 'idle') ? { duration: 0.4, ease: 'easeOut' } : { repeat: Infinity, duration: 4, ease: 'easeInOut' },
            scale: { duration: 0.6, ease: [0.19, 1, 0.22, 1] },
            filter: { duration: 0.6 }
          }}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >

          {/* ================================================= */}
          {/* 主卡片 (撕裂前可见，撕裂瞬间 0 延迟消失，让位给碎片) */}
          {/* ================================================= */}
          <motion.div
            animate={{ opacity: shatterState === 'idle' ? 1 : 0 }}
            transition={{ duration: 0 }} // 必须 0 延迟，实现像素级替换！
            className={`${CARD_BASE_STYLE} shadow-[0_40px_80px_rgba(0,0,0,0.1)]`}
          >
            <motion.div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#bae6fd]/40" animate={{ opacity: isHovered ? 0 : 1 }} transition={{ duration: 0.6 }} />
            <motion.div style={{ background: glareBackground, opacity: isHovered && shatterState === 'idle' ? 1 : 0 }} className="absolute inset-0 z-20 mix-blend-overlay transition-opacity duration-500" />
            <CardContent about={about} />
          </motion.div>

          {/* ================================================= */}
          {/* 💥 纸张撕裂 (4 块像素级对齐的碎片) */}
          {/* ================================================= */}
          {shatterState !== 'idle' && PAPER_TEARS.map((polygon, index) => {
            const phys = TEAR_PHYSICS[index]

            let targetZ = 0, targetX = 0, targetY = 0, targetRotX = 0, targetRotY = 0, targetRotZ = 0, targetScale = 1
            let easeType = "circOut", duration = 0.5
            
            if (shatterState === 'tearing') {
              // 物理顿挫：瞬间拉开一点点缝隙
              targetZ = 20; targetX = phys.x; targetY = phys.y; targetRotZ = phys.rotZ
              duration = 0.3; easeType = "backOut" // 极速崩开的感觉
            } else if (shatterState === 'imploding' || shatterState === 'consuming') {
              // 被黑洞狂暴吸走
              targetZ = -1200; targetScale = 0; targetRotX = (Math.random() - 0.5) * 300; targetRotY = (Math.random() - 0.5) * 300
              duration = 0.8; easeType = "easeIn"
            } else if (shatterState === 'recovering' || shatterState === 'kintsugi') {
              // 完美归位
              targetZ = 0; targetX = 0; targetY = 0; targetScale = 1; targetRotX = 0; targetRotY = 0; targetRotZ = 0
              duration = 1.5; easeType = "easeOut"
            }

            return (
              <motion.div
                key={index}
                initial={{ x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, opacity: 1 }}
                animate={{ z: targetZ, x: targetX, y: targetY, rotateX: targetRotX, rotateY: targetRotY, rotateZ: targetRotZ, scale: targetScale }}
                transition={{ duration: duration, ease: easeType as any }}
                style={{ clipPath: polygon }}
                className={`${CARD_BASE_STYLE} z-20`}
              >
                <CardContent about={about} />
              </motion.div>
            )
          })}

          {/* ================================================= */}
          {/* ✨ 深渊黑金 金缮流光 (The Abyss Gold Kintsugi) */}
          {/* ================================================= */}
          <AnimatePresence>
            {shatterState === 'kintsugi' && (
              <svg className="absolute inset-0 w-full h-full z-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  {/* 深渊黑金的渐变材质 */}
                  <linearGradient id="abyssGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#050505" />
                    <stop offset="30%" stopColor="#1a1a1a" />
                    <stop offset="50%" stopColor="#d4af37" /> {/* 金色 */}
                    <stop offset="70%" stopColor="#1a1a1a" />
                    <stop offset="100%" stopColor="#050505" />
                  </linearGradient>
                  {/* 微弱的光晕 */}
                  <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* 数学级精准的路径：
                  起点统一在 48,52。连向四个切割端点：(55,0) (100,60) (40,100) (0,45)
                  这 100% 严丝合缝地贴合了上方 polygon 的切线！
                */}
                <motion.path
                  d="M 48 52 L 55 0 M 48 52 L 100 60 M 48 52 L 40 100 M 48 52 L 0 45"
                  stroke="url(#abyssGold)"
                  strokeWidth="1.2"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 1 }}
                  animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                  transition={{ 
                    duration: 2.0, ease: "easeOut", // 金线蔓延
                    opacity: { delay: 1.0, duration: 1.0 } // 一秒后淡出
                  }}
                  style={{ filter: "url(#goldGlow)" }}
                />
              </svg>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>

      {/* 死亡低语 */}
      <AnimatePresence>
        {shatterState === 'consuming' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none mix-blend-difference"
          >
            <p className="text-white text-[10px] md:text-[14px] tracking-[1.5em] font-mono opacity-40">ABYSS CONSUMES ALL</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

// =========================================================
// 主入口
// =========================================================
export default function AboutInteractive({ about }: { about: any }) {
  return (
    <>
      <div className="haoye-dark-only"><DarkAbyss about={about} /></div>
      <div className="haoye-light-only"><LightPaper about={about} /></div>
    </>
  )
}