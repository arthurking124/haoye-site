'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { animate, useMotionValue, motion, useScroll } from 'framer-motion'
import LiquidTextReader from '@/components/poems/LiquidTextReader'

export default function LightPoemRift({ poem }: { poem: any }) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ container: scrollContainerRef })
  
  const progress = useMotionValue(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    animate(progress, 1, {
      duration: 1.8,
      ease: [0.19, 1, 0.22, 1],
      onComplete: () => setIsOpen(true)
    })
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [progress])

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
    animate(progress, 0, {
      duration: 1.0,
      ease: "easeInOut",
      onComplete: () => {
        const shock = document.createElement('div')
        shock.className = 'shockwave-ripple'
        document.body.appendChild(shock)
        setTimeout(() => shock.remove(), 1200)
        router.push('/poems')
      }
    })
  }

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
        if(u_progress < 0.001) discard;
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 p = uv * aspect;

        vec2 centerP = (uv * 2.0 - 1.0);
        centerP.x *= u_resolution.x / u_resolution.y;
        vec2 maxRift = vec2((u_resolution.x/u_resolution.y) * 0.85, 0.85);
        float easeProg = pow(u_progress, 1.2);
        vec2 d = abs(centerP) - (maxRift * easeProg);
        float baseDist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        float noise = fbm(centerP * 3.0 - u_time * 0.4) * 0.15 * easeProg;
        float finalDist = baseDist + noise;
        if (finalDist > 0.0) discard; 

        // 完美左下流向
        vec2 fluidP = p;
        fluidP.x += u_time * 0.05; 
        fluidP.y += u_time * 0.1; 

        float time = u_time * 0.04; 
        vec2 q = vec2(fbm(fluidP + time * 0.8), fbm(fluidP + vec2(1.0) + time * 0.5));
        vec2 r = vec2(fbm(fluidP + 2.0 * q + vec2(1.7, 9.2) + 0.15 * time), fbm(fluidP + 2.0 * q + vec2(8.3, 2.8) + 0.12 * time));
        float surfaceHeight = fbm(fluidP + r);

        vec2 eps = vec2(0.01, 0.0); 
        float nx = fbm(fluidP + r + eps) - surfaceHeight;
        float ny = fbm(fluidP + r + eps.yx) - surfaceHeight;
        vec3 normal = normalize(vec3(nx, ny, 0.8)); 
        
        float fresnel = pow(1.0 - max(dot(normal, vec3(0,0,1)), 0.0), 4.0);
        float specular = pow(max(dot(normal, normalize(vec3(0.5, 0.8, 1.5) + vec3(0,0,1))), 0.0), 50.0); 

        vec3 abyssColor = mix(vec3(0.015, 0.015, 0.02), vec3(0.08, 0.1, 0.12), fresnel) + (specular * 0.35);
        vec3 glowColor = vec3(1.0, 0.98, 0.95) * 2.2;
        
        gl_FragColor = vec4(mix(abyssColor, glowColor, pow(1.0 - smoothstep(0.0, -0.06, finalDist), 4.0)), 1.0);
      }
    `
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!; gl.shaderSource(shader, source); gl.compileShader(shader); return shader;
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource))
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(program); gl.useProgram(program)

    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uProgress = gl.getUniformLocation(program, 'u_progress')

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

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
      gl.drawArrays(gl.TRIANGLES, 0, 6); animationFrameId = requestAnimationFrame(render)
    }
    render()
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); gl.deleteProgram(program) }
  }, [])

  return (
    <div className="fixed inset-0 z-50 w-full h-full bg-transparent pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      
      <div 
        ref={scrollContainerRef}
        className="absolute inset-0 z-20 overflow-y-auto overflow-x-hidden scrollbar-hide pointer-events-auto cursor-crosshair"
        onClick={handleClose} 
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent 6vh, black 16vh, black 84vh, transparent 94vh)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 6vh, black 16vh, black 84vh, transparent 94vh)'
        }}
      >
        <div className="w-full min-h-[100vh] flex justify-center py-[40vh]">
          
          <motion.div 
            className={`relative w-full max-w-[800px] cursor-auto transition-opacity duration-1000 ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => e.stopPropagation()} 
            animate={isOpen && !isClosing ? { y: [-6, 6, -6], rotateZ: [-0.5, 0.5, -0.5] } : {}}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          >
            <div className="w-full bg-[#E6E1D3] rounded-[1px] shadow-[inset_0_0_100px_rgba(100,80,60,0.15),0_15px_40px_rgba(0,0,0,0.6)] px-8 md:px-24 py-32 text-[#2A2622]">
              
              {/* 删除了原有的外置 header，将全部参数传递给 LiquidTextReader */}
              <LiquidTextReader 
                title={poem.title} 
                intro={poem.intro} 
                body={poem.body} 
                scrollY={scrollY} 
              />
              
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}