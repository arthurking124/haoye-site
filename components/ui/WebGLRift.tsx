'use client'

import React, { useRef, useEffect } from 'react'
import { useSpring } from 'framer-motion'

export default function WebGLRiftCanvas({ isOpen, theme, isCollapsing }: { isOpen: boolean, theme: 'dark' | 'light', isCollapsing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progress = useSpring(0, { stiffness: 60, damping: 15 }) 
  const collapse = useSpring(0, { stiffness: 70, damping: 14 }) 
  const themeVal = useSpring(theme === 'light' ? 1 : 0, { stiffness: 50, damping: 20 }) 

  useEffect(() => { progress.set(isOpen ? 1 : 0) }, [isOpen, progress])
  useEffect(() => { collapse.set(isCollapsing ? 1 : 0) }, [isCollapsing, collapse])
  useEffect(() => { themeVal.set(theme === 'light' ? 1 : 0) }, [theme, themeVal])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true })
    if (!gl) return

    const vsSource = `attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`
    
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_progress;
      uniform float u_theme;
      uniform float u_collapse;

      // 核心随机函数
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

      // FBM 生成有机纹理
      float fbm(vec2 uv) {
        float f = 0.0; float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          f += amp * snoise(uv);
          uv *= 2.02;
          amp *= 0.5;
        }
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 p = uv * aspect;
        vec2 origin = vec2(1.0, 0.0) * aspect; // 右下角起爆点
        vec2 center = vec2(0.5, 0.5) * aspect; // 奇点中心

        // 🌊 核心修复：平时绝对不使用强旋转！
        // 只在坍缩阶段 (u_collapse) 引入漩涡引力
        float angle = u_collapse * 4.0 * exp(-length(p - center) * 2.0);
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        vec2 distortedP = center + rot * (p - center);

        // 坍缩时的中心吸力
        distortedP -= (p - center) * u_collapse * 0.5;

        // 水膜撕裂逻辑
        float dist = length(p - origin);
        float radius = u_progress * 1.5;
        float noise = fbm(distortedP * 3.0 + u_time * 0.1);
        float border = smoothstep(radius, radius - 0.1, dist + noise * 0.15);

        // 🌫️ 质感雾气：使用多层 Domain Warping 彻底消灭圆圈
        vec2 q = vec2(fbm(distortedP + u_time * 0.05), fbm(distortedP + vec2(5.2, 1.3)));
        vec2 r = vec2(fbm(distortedP + 4.0 * q + u_time * 0.02), fbm(distortedP + 4.0 * q));
        float cloud = fbm(distortedP + 4.0 * r);

        // 👑 Awwwards 级别：顶级流体物质色盘
        // 1. 深色云雾：【深渊引力】
        vec3 darkCloud = mix(vec3(0.008, 0.008, 0.012), vec3(0.06, 0.07, 0.10), cloud);
        // 2. 浅色云雾：【宣纸灵魂】
        vec3 lightCloud = mix(vec3(0.975, 0.962, 0.940), vec3(0.91, 0.89, 0.85), cloud);
        vec3 voidColor = mix(darkCloud, lightCloud, u_theme);

        // 🕳️ 黑洞核心：仅在坍缩时出现
        float core = smoothstep(0.4, 0.0, length(p - center) / u_collapse);
        voidColor = mix(voidColor, vec3(0.0), core * u_collapse);

        // 最终合成
        float alpha = border * u_progress;
        
        // 增加边缘柔和感 (呼应雾气)
        float edgeGlow = exp(-abs(dist - radius) * 20.0) * u_progress;
        
        // 💎 边缘光泽：物理级材质模拟
        // 深色边缘：【钛银冷光】
        vec3 darkEdge = vec3(0.18, 0.22, 0.28) * (1.0 - u_theme); 
        // 浅色边缘：【湿润琥珀】
        vec3 lightEdge = vec3(0.52, 0.46, 0.38) * u_theme;
        vec3 edgeColor = (darkEdge + lightEdge) * edgeGlow;

        gl_FragColor = vec4(voidColor + edgeColor, alpha) * u_progress;
      }
    `
    const program = gl.createProgram()!
    const compile = (t: number, s: string) => {
      const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); return sh;
    }
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vsSource))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(program); gl.useProgram(program)

    const uRes = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uProg = gl.getUniformLocation(program, 'u_progress')
    const uThm = gl.getUniformLocation(program, 'u_theme')
    const uCol = gl.getUniformLocation(program, 'u_collapse')

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    let aid: number, start = Date.now()
    const resize = () => {
      if (!canvas) return
      canvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2)
      canvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize); resize()
    
    const render = () => {
      if (!canvas) return
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, (Date.now() - start) * 0.001)
      gl.uniform1f(uProg, progress.get())
      gl.uniform1f(uThm, themeVal.get())
      gl.uniform1f(uCol, collapse.get())
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      aid = requestAnimationFrame(render)
    }
    render()
    return () => { cancelAnimationFrame(aid); window.removeEventListener('resize', resize); gl.deleteProgram(program) }
  }, [progress, collapse, themeVal])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
