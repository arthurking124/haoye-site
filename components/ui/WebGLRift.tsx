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
    
    // 👑 修复了死亡蓝屏的终极数学管线
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_progress;
      uniform float u_theme;
      uniform float u_collapse;

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
        for (int i = 0; i < 4; i++) { f += amp * snoise(uv); uv = rot * uv * 2.0; amp *= 0.5; }
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 p = uv * aspect;
        vec2 origin = vec2(1.0, 0.0) * aspect;
        vec2 center = vec2(0.5, 0.5) * aspect;

        vec2 toCenter = p - center;
        float warp = exp(-length(toCenter) * 5.0) * u_collapse;
        p -= toCenter * warp * 1.5;

        float dist = length(p - origin);
        float maxDist = length(vec2(1.0, 1.0) * aspect);
        float baseRadius = u_progress * maxDist * 1.5;

        float tear = (fbm(p * 4.0 + u_time * 0.4) - 0.5) * 0.25;
        float radius = baseRadius + tear * smoothstep(0.0, 0.3, u_progress);

        // 👑 蓝屏修复核心：使用 abs 确保光晕只产生在边界
        float edgeDist = abs(dist - radius);
        float edgeGlow = exp(-edgeDist * 40.0) * smoothstep(0.0, 0.1, u_progress);
        
        // 👑 色彩修复：将刺眼的蓝色改为极其克制、高级的“冷月/水银”色
        vec3 darkEdge = vec3(0.12, 0.15, 0.18) * edgeGlow * 1.5; // 冷峻的深灰水银色
        vec3 lightEdge = vec3(0.05, 0.05, 0.05) * edgeGlow * 1.5; // 水墨渗出边缘
        vec3 edgeColor = mix(darkEdge, lightEdge, u_theme);

        float inside = smoothstep(0.01, -0.01, dist - radius); // 1.0 内部，0.0 外部

        float n = fbm(p * 2.0 + u_time * 0.1);
        vec3 darkVoid = mix(vec3(0.02, 0.02, 0.03), vec3(0.06, 0.07, 0.09), n);
        vec3 lightVoid = mix(vec3(0.96, 0.95, 0.94), vec3(0.88, 0.89, 0.87), n);
        vec3 voidColor = mix(darkVoid, lightVoid, u_theme);

        // 奇点星尘
        float specs = smoothstep(0.8, 0.9, fbm(p * 40.0 - u_time * 0.2));
        voidColor += mix(vec3(0.5, 0.7, 1.0), vec3(0.1), u_theme) * specs * (1.0 - u_collapse);

        vec3 finalColor = mix(vec3(0.0), voidColor, inside) + edgeColor;
        float finalAlpha = clamp(inside + edgeGlow, 0.0, 1.0);

        finalColor = mix(finalColor, voidColor, u_collapse);
        finalAlpha = clamp(finalAlpha + u_collapse, 0.0, 1.0);

        gl_FragColor = vec4(finalColor, finalAlpha * u_progress);
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
      canvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2)
      canvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize); resize()
    
    const render = () => {
      const p = progress.get(); const c = collapse.get()
      if (p < 0.001 && c < 0.001) {
        gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT)
      } else {
        gl.uniform2f(uRes, canvas.width, canvas.height)
        gl.uniform1f(uTime, (Date.now() - start) * 0.001)
        gl.uniform1f(uProg, p); gl.uniform1f(uThm, themeVal.get()); gl.uniform1f(uCol, c)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
      aid = requestAnimationFrame(render)
    }
    render()
    return () => { cancelAnimationFrame(aid); window.removeEventListener('resize', resize); gl.deleteProgram(program) }
  }, [progress, collapse, themeVal])

  return <canvas ref={canvasRef} className="w-full h-full" />
}