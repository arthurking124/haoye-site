'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pathname = usePathname()

  // 贯穿全站（除首页），托底所有网页和相册
  const isAllowedPath = pathname !== '/'

  useEffect(() => {
    if (!isAllowedPath) return

    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false })
    if (!gl) return

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision highp float;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_scrollVelocity;
      uniform float u_theme;
      // 【新增】：接收设备状态
      uniform float u_isMobile; 

      // --- 数学噪声引擎 ---
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865, 0.366025404, -0.577350269, 0.0243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // --- FBM 分形波面 ---
      float fbm(vec2 uv) {
        float f = 0.0;
        float amp = 0.5;
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 4; i++) {
            f += amp * snoise(uv);
            uv = rot * uv * 2.0;
            amp *= 0.5;
        }
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 p = uv * aspect;

        // 👑 保留你最喜欢的极品交互：真实鼠标涟漪
        vec2 mouseP = u_mouse * aspect;
        vec2 mouseDelta = p - mouseP;
        float mouseDist = length(mouseDelta);
        float rippleFalloff = exp(-mouseDist * 12.0);
        float rippleWave = sin(mouseDist * 50.0 - u_time * 10.0);
        vec2 rippleDisplacement = normalize(mouseDelta) * rippleFalloff * rippleWave * 0.03;
        
        // 我们只用鼠标涟漪去扰动 UV，绝对不再整体平移画布！
        p += rippleDisplacement;

        // 🚀 核心修复：告别“图片平移”，回归真实的“波浪扭曲演化 (Morphing)”
        float time = u_time * mix(0.04, 0.08, u_theme); 
        float scroll = u_scrollVelocity * mix(0.003, 0.006, u_theme);

        // 依靠时间扭曲噪声输入参数，让水面在原地产生“沸腾、翻滚”的物理现象
        vec2 q = vec2(0.0);
        q.x = fbm(p + time * 0.8);
        q.y = fbm(p + vec2(1.0) + time * 0.5 - scroll); // 滚轮动能注入水体演化频率

        vec2 r = vec2(0.0);
        r.x = fbm(p + 2.0 * q + vec2(1.7, 9.2) + 0.15 * time);
        r.y = fbm(p + 2.0 * q + vec2(8.3, 2.8) + 0.12 * time - scroll);

        float surfaceHeight = fbm(p + r);

        // 👑 保留上一版的通透材质：光学法线与真实折射
        vec2 eps = vec2(0.01, 0.0); 
        float nx = fbm(p + r + eps) - surfaceHeight;
        float ny = fbm(p + r + eps.yx) - surfaceHeight;
        vec3 normal = normalize(vec3(nx, ny, mix(0.8, 1.2, u_theme))); 
        
        vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
        vec3 lightDir = normalize(vec3(0.5, 0.8, 1.5));
        
        // 菲涅尔效应与锐利微光
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);
        vec3 halfVector = normalize(lightDir + viewDir);
        float specular = pow(max(dot(normal, halfVector), 0.0), mix(80.0, 100.0, u_theme)); 

        // 🌙 深渊活水 
        // 【核心修改】：通过 u_isMobile 判断，在手机端将水底亮度提亮 0.025，天空反射提亮 0.06
        vec3 darkWaterDepth = vec3(0.03, 0.03, 0.035) + vec3(0.025 * u_isMobile); 
        vec3 darkSkyReflection = vec3(0.12, 0.15, 0.18) + vec3(0.06 * u_isMobile); 
        vec3 finalDark = mix(darkWaterDepth, darkSkyReflection, fresnel) + (specular * 0.2);

        // ☀️ 晨曦清泉 
        vec3 lightWaterDepth = vec3(0.96, 0.94, 0.91); 
        float caustic = smoothstep(0.4, 0.6, surfaceHeight) * 0.15; 
        vec3 finalLight = lightWaterDepth + caustic + (specular * 0.3) - (vec3(0.02, 0.04, 0.05) * r.y * 0.1); 

        vec3 finalColor = mix(finalDark, finalLight, u_theme);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        return null
      }
      return shader
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource)!
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource)!
    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const positionLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uScrollVelocity = gl.getUniformLocation(program, 'u_scrollVelocity')
    const uTheme = gl.getUniformLocation(program, 'u_theme')
    // 【新增】：绑定 u_isMobile 地址
    const uIsMobile = gl.getUniformLocation(program, 'u_isMobile')

    let animationFrameId: number
    const startTime = Date.now()

    // 设置在屏幕外，防止初始产生涟漪
    let targetMouseX = -1.0, targetMouseY = -1.0
    let currentMouseX = -1.0, currentMouseY = -1.0
    let lastScrollY = window.scrollY
    let targetScrollVelocity = 0
    let currentScrollVelocity = 0

    const getThemeNum = () => document.documentElement.getAttribute('data-theme') === 'light' ? 1.0 : 0.0
    let targetTheme = getThemeNum()
    let currentTheme = targetTheme

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX / window.innerWidth
      targetMouseY = 1.0 - (e.clientY / window.innerHeight)
    }

    const handleScroll = () => {
      const currentY = window.scrollY
      targetScrollVelocity = currentY - lastScrollY
      lastScrollY = currentY
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const themeObserver = new MutationObserver(() => { targetTheme = getThemeNum() })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', resize)
    resize()

    const render = () => {
      const elapsedTime = (Date.now() - startTime) * 0.001
      
      currentMouseX += (targetMouseX - currentMouseX) * 0.08
      currentMouseY += (targetMouseY - currentMouseY) * 0.08
      targetScrollVelocity *= 0.92 
      currentScrollVelocity += (targetScrollVelocity - currentScrollVelocity) * 0.1
      currentTheme += (targetTheme - currentTheme) * 0.03

      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uTime, elapsedTime)
      gl.uniform2f(uMouse, currentMouseX, currentMouseY)
      gl.uniform1f(uScrollVelocity, currentScrollVelocity)
      gl.uniform1f(uTheme, currentTheme)

      // 【新增】：实时检测是否为移动端（以 768px 为界），1.0 为是，0.0 为否，传递给着色器补偿亮度
      const isMobile = window.innerWidth < 768 ? 1.0 : 0.0;
      gl.uniform1f(uIsMobile, isMobile);

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', resize)
      themeObserver.disconnect()
      gl.deleteProgram(program)
    }
  }, [pathname, isAllowedPath])

  if (!isAllowedPath) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          body::before, body::after {
            background: transparent !important;
            box-shadow: none !important;
          }

          html, body, header, footer {
            background-color: transparent !important;
            background-image: none !important;
          }

          main, main > div,
          .haoye-about-page, .haoye-poems-page, .haoye-notes-page, .haoye-poem-detail-page, .haoye-images-page {
            background: transparent !important;
            background-image: none !important;
          }

          .glass-forcefield {
            background: transparent !important;
            mask-image: none !important;
            -webkit-mask-image: none !important;
            backdrop-filter: none !important;
          }

          :root {
            --site-bg: transparent !important;
            --bg: transparent !important;
            --site-surface: transparent !important;
          }
        `
      }} />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }} 
      />
    </>
  )
}