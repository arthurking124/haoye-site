'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSensory } from '@/components/providers/GlobalSensoryProvider'
import { urlFor } from '@/lib/sanity.image'

interface GalleryProps {
  images: any[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onOpenIndex?: () => void
}

const getImageUrl = (item: any) => {
  try {
    const cover = item?.images?.[0];
    return cover ? urlFor(cover).width(1600).quality(95).url() : '';
  } catch (e) {
    return '';
  }
}

export default function SilkGallery({ images, currentIndex, onIndexChange, onOpenIndex }: GalleryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { engine } = useSensory()
  
  const isTransitioningRef = useRef(false)
  const progressRef = useRef(0)
  const localIndexRef = useRef(currentIndex)
  
  const latestProps = useRef({ images, onIndexChange })
  useEffect(() => { latestProps.current = { images, onIndexChange } }, [images, onIndexChange])

  const triggerNextRef = useRef<((targetIdx?: number) => void) | null>(null)

  const wheelEnergy = useRef(0)
  const lastWheelTime = useRef(Date.now())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // 👑 修复：去掉手动干预的混合模式，使用 WebGL 默认的预乘 Alpha 行为
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true })
    if (!gl) return

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader))
      }
      return shader
    }

    // ==========================================
    // 顶点着色器 (保留完美的物理风力与鼠标涟漪)
    // ==========================================
    const vsSource = `
      attribute vec3 a_position; 
      attribute vec2 a_uv; 
      
      varying vec2 v_uv; 
      varying float v_depth; 
      
      uniform float u_time; 
      uniform float u_progress;
      uniform vec2 u_mouse;
      uniform float u_aspect;

      void main() {
        vec3 pos = a_position;
        
        float wave = sin(pos.x * 3.0 + u_time * 2.0) * cos(pos.y * 2.0 + u_time * 1.5) * 0.15;
        float windForce = sin(u_progress * 3.14159) * 2.0;
        
        pos.z += wave * (1.0 + windForce);
        pos.x += sin(u_time + pos.y * 5.0) * 0.05 * windForce;
        
        vec2 mouseDist = vec2(pos.x - u_mouse.x, (pos.y - u_mouse.y) / u_aspect);
        float dist = length(mouseDist);
        float ripple = exp(-dist * 6.0) * sin(dist * 15.0 - u_time * 4.0) * 0.08;
        pos.z += ripple;

        v_depth = pos.z; 
        v_uv = a_uv;
        
        float zToDivide = 1.0 - pos.z * 0.4;
        gl_Position = vec4(pos.x / zToDivide, pos.y / zToDivide, pos.z, 1.0);
      }
    `

    // ==========================================
    // 👑 片元着色器：彻底修复锯齿与邮票边缘
    // ==========================================
    const fsSource = `
      precision highp float; 
      varying vec2 v_uv; 
      varying float v_depth; 
      
      uniform sampler2D u_tex0; 
      uniform sampler2D u_tex1; 
      uniform float u_progress;
      uniform float u_time;

      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        float waveMask = v_depth * 0.6; 
        float transition = smoothstep(0.0, 1.0, clamp((u_progress * 1.6) - 0.3 - waveMask, 0.0, 1.0));

        vec4 c1 = texture2D(u_tex0, v_uv); 
        vec4 c2 = texture2D(u_tex1, v_uv);
        vec4 baseColor = mix(c1, c2, transition);

        float sss = smoothstep(-0.2, 0.2, v_depth) * 0.25 + 0.85; 
        float spec = smoothstep(0.05, 0.15, v_depth) * 0.12;      
        
        float grain = random(v_uv * u_time) * 0.025; 

        vec3 finalRGB = baseColor.rgb * sss + vec3(spec) + vec3(grain);

        // 👑 终极修复：亚像素级羽化边缘 (Sub-pixel Feathering)
        // 彻底抛弃 snoise 切割，改用极小数值的 smoothstep 创造极其平滑的摄影边缘
        float feather = 0.003; // 代表约 1.5 个像素的完美抗锯齿过渡
        float edgeX = smoothstep(0.0, feather, v_uv.x) * smoothstep(1.0, 1.0 - feather, v_uv.x);
        float edgeY = smoothstep(0.0, feather, v_uv.y) * smoothstep(1.0, 1.0 - feather, v_uv.y);
        float alphaMask = edgeX * edgeY;

        // 👑 真正的 WebGL 预乘 Alpha 输出（杜绝黑白边）
        gl_FragColor = vec4(finalRGB * alphaMask, baseColor.a * alphaMask);
      }
    `

    const program = gl.createProgram()!
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource))
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(program)
    gl.useProgram(program)

    // 网格构建维持原样
    const segments = 40
    const vertices = [], uvs = [], indices = []
    
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        let x = (j / segments) * 2 - 1
        let y = (i / segments) * 2 - 1
        vertices.push(x * 0.6, y * 0.8, 0)
        uvs.push(j / segments, 1.0 - (i / segments))
      }
    }
    
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        let a = i * (segments + 1) + j
        let b = a + 1
        let c = a + (segments + 1)
        let d = c + 1
        indices.push(a, b, c, b, d, c)
      }
    }

    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0)

    const uvbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, uvbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW)
    const aUv = gl.getAttribLocation(program, 'a_uv')
    gl.enableVertexAttribArray(aUv)
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0)

    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

    const uProg = gl.getUniformLocation(program, 'u_progress')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uAspect = gl.getUniformLocation(program, 'u_aspect')

    const textures = [gl.createTexture(), gl.createTexture()]
    const loadTexture = (url: string, index: number) => {
      if (!url) return
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + index)
        gl.bindTexture(gl.TEXTURE_2D, textures[index])
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      }
      img.src = url + (url.includes('?') ? '&' : '?') + 'cors-bypass=' + Date.now()
    }

    const initialUrl = getImageUrl(latestProps.current.images[localIndexRef.current])
    loadTexture(initialUrl, 0)
    loadTexture(initialUrl, 1)

    triggerNextRef.current = (targetIdx?: number) => {
      if (isTransitioningRef.current) return
      const { images } = latestProps.current
      isTransitioningRef.current = true
      
      const nextIdx = targetIdx !== undefined ? targetIdx : (localIndexRef.current + 1) % images.length
      localIndexRef.current = nextIdx
      
      loadTexture(getImageUrl(images[nextIdx]), 1)
    }

    let mouseX = -10.0, mouseY = -10.0;
    let targetMouseX = -10.0, targetMouseY = -10.0;

    const handlePointerMove = (clientX: number, clientY: number) => {
      targetMouseX = (clientX / window.innerWidth) * 2.0 - 1.0;
      targetMouseY = -(clientY / window.innerHeight) * 2.0 + 1.0;
    }

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    let animationId: number
    const startTime = Date.now()

    const render = () => {
      gl.uniform1f(uTime, (Date.now() - startTime) * 0.001)
      
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;
      gl.uniform2f(uMouse, mouseX, mouseY);
      
      const targetProg = isTransitioningRef.current ? 1 : 0
      progressRef.current += (targetProg - progressRef.current) * 0.035 
      gl.uniform1f(uProg, progressRef.current)
      
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

      if (isTransitioningRef.current && progressRef.current > 0.995) {
        isTransitioningRef.current = false
        progressRef.current = 0
        loadTexture(getImageUrl(latestProps.current.images[localIndexRef.current]), 0)
        latestProps.current.onIndexChange(localIndexRef.current)
      }
      animationId = requestAnimationFrame(render)
    }
    render()

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(uAspect, window.innerWidth / window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => { 
      cancelAnimationFrame(animationId); 
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    }
  }, [])

  useEffect(() => {
    if (currentIndex !== localIndexRef.current && !isTransitioningRef.current) {
      if (triggerNextRef.current) triggerNextRef.current(currentIndex)
    }
  }, [currentIndex])

  const handleNext = () => {
    engine?.playInstantFeedback()
    if (triggerNextRef.current) triggerNextRef.current()
  }

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now()
    if (now - lastWheelTime.current > 150) wheelEnergy.current = 0; 
    lastWheelTime.current = now;

    wheelEnergy.current += e.deltaY;
    const threshold = 60; 

    if (wheelEnergy.current > threshold) {
      wheelEnergy.current = 0;
      if (!isTransitioningRef.current) {
        engine?.playInstantFeedback();
        triggerNextRef.current && triggerNextRef.current((localIndexRef.current + 1) % latestProps.current.images.length);
      }
    } else if (wheelEnergy.current < -threshold) {
      wheelEnergy.current = 0;
      if (!isTransitioningRef.current) {
        engine?.playInstantFeedback();
        const { images } = latestProps.current;
        triggerNextRef.current && triggerNextRef.current((localIndexRef.current - 1 + images.length) % images.length);
      }
    }
  }

  return (
    <div className="relative w-full h-screen cursor-pointer overflow-hidden" onClick={handleNext} onWheel={handleWheel}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-[10vh] z-10">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="text-center"
        >
          <button
            onClick={(e) => {
              e.stopPropagation(); 
              if (onOpenIndex) onOpenIndex();
            }}
            className="pointer-events-auto text-[10px] tracking-[0.5em] text-black/40 mb-4 font-mono hover:text-black transition-colors cursor-pointer outline-none group/idx flex items-center justify-center gap-3 w-full"
          >
            <span className="opacity-50 group-hover/idx:opacity-100 transition-opacity">[ INDEX ]</span>
            <span>{String(currentIndex + 1).padStart(2, '0')} / {String(latestProps.current.images.length).padStart(2, '0')}</span>
          </button>

          <h2 className="text-3xl font-light tracking-[0.2em] text-black uppercase drop-shadow-sm">
            {images[currentIndex]?.title || '未命名'}
          </h2>
        </motion.div>
      </div>
    </div>
  )
}