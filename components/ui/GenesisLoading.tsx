'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GenesisLoading({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0)
  const [isShockwave, setIsShockwave] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // 开启 alpha: true 保证最后震荡波能穿透背景露出网站
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
    if (!gl) return

    // ==========================================
    // 🧠 1. 内存中提取“太极双鱼”的量子坐标
    // ==========================================
    const NUM_PARTICLES = 120000; // 12万粒子的极致流体云
    const targets = new Float32Array(NUM_PARTICLES * 2)
    const randoms = new Float32Array(NUM_PARTICLES * 3)

    const offCanvas = document.createElement('canvas')
    offCanvas.width = 512
    offCanvas.height = 512
    const ctx = offCanvas.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      // 绘制完美的太极双鱼图
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, 512, 512)
      
      const cx = 256, cy = 256, r = 180
      // 左白右黑
      ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2); ctx.fill()
      // 上白下黑
      ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(cx, cy - r / 2, r / 2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy + r / 2, r / 2, 0, Math.PI * 2); ctx.fill()
      // 鱼眼
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy - r / 2, r * 0.15, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(cx, cy + r / 2, r * 0.15, 0, Math.PI * 2); ctx.fill()

      // 提取白色像素的坐标作为引力目标点
      const imgData = ctx.getImageData(0, 0, 512, 512).data
      const validPixels: { x: number, y: number }[] = []
      for (let i = 0; i < imgData.length; i += 4) {
        if (imgData[i] > 128) {
          validPixels.push({
            x: ((i / 4) % 512) / 512 * 2 - 1,
            y: 1 - Math.floor((i / 4) / 512) / 512 * 2
          })
        }
      }
      
      // 为 12 万个粒子随机分配目标点和空间扰动值
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const p = validPixels[Math.floor(Math.random() * validPixels.length)]
        targets[i * 2] = p.x
        targets[i * 2 + 1] = p.y
        // 随机种子用于错开每个粒子的运动轨迹
        randoms[i * 3] = Math.random() * 2.0 - 1.0
        randoms[i * 3 + 1] = Math.random() * 2.0 - 1.0
        randoms[i * 3 + 2] = Math.random()
      }
    }

    // ==========================================
    // 🌪️ 2. 顶级流体着色器 (纯数学驱动, 无需FBO)
    // ==========================================
    const particleVS = `
      attribute vec2 a_target;
      attribute vec3 a_random;

      uniform float u_time;
      uniform float u_phase; 
      uniform vec2 u_resolution;
      uniform float u_shockwave;

      varying float v_alpha;

      // --- 3D Simplex 噪声引擎 (Ashima) ---
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
      float snoise(vec3 v){
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
        i = mod(i, 289.0 );
        vec4 p = permute( permute( permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 1.0/7.0;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m; return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }

      vec3 snoiseVec3( vec3 x ){
        return vec3( snoise(vec3( x.y - 19.1, x.z + 33.4, x.x + 47.2 )),
                     snoise(vec3( x.z + 74.2, x.x - 124.5, x.y + 99.4 )),
                     snoise(vec3( x.x + 87.2, x.y + 34.6, x.z - 23.4 )) );
      }

      vec3 curlNoise( vec3 p ){
        const float e = 0.1;
        vec3 dx = vec3( e   , 0.0 , 0.0 ); vec3 dy = vec3( 0.0 , e   , 0.0 ); vec3 dz = vec3( 0.0 , 0.0 , e   );
        vec3 p_x0 = snoiseVec3( p - dx ); vec3 p_x1 = snoiseVec3( p + dx );
        vec3 p_y0 = snoiseVec3( p - dy ); vec3 p_y1 = snoiseVec3( p + dy );
        vec3 p_z0 = snoiseVec3( p - dz ); vec3 p_z1 = snoiseVec3( p + dz );
        float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
        float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
        float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
        return normalize( vec3( x , y , z ) / ( 2.0 * e ) );
      }

      void main() {
        vec3 origin = vec3(0.0);
        vec3 target = vec3(a_target.x, a_target.y, 0.0) * 0.65; // 稍微缩放双鱼
        
        float aspect = u_resolution.x / u_resolution.y;

        // 阶段解算：0->1 (墨水爆发展开) / 1->2 (双鱼聚合)
        float explodeProgress = clamp(u_phase, 0.0, 1.0);
        float morphProgress = smoothstep(1.0, 2.0, u_phase); 

        // 流体引力场
        vec3 noisePos = a_random * 8.0; 
        vec3 curl = curlNoise(noisePos + u_time * 0.15);
        
        vec3 pos = origin;
        
        // 阶段一：爆发展开
        pos += curl * explodeProgress * 1.6;
        
        // 阶段二：吸附与成型
        pos = mix(pos, target, morphProgress);
        
        // 注入灵魂：即使聚合完成，依然保持细微的墨水拉丝感
        pos += curlNoise(pos * 5.0 - u_time * 0.2) * 0.03 * (explodeProgress - morphProgress * 0.8);

        // 终极转场：深水冲击波下潜
        if (u_shockwave > 0.0) {
            float dist = length(pos);
            vec3 outward = normalize(pos) * (1.0 + a_random.x * 0.5);
            // 猛烈地向屏幕四周和内部轰散
            pos += outward * u_shockwave * 2.5; 
            pos.y -= u_shockwave * 1.5; // 带有重力下沉感
        }

        pos.x /= aspect; // 物理正圆修正
        gl_Position = vec4(pos.xy, 0.0, 1.0);

        // 根据粒子是否对齐目标点，改变粒子大小
        gl_PointSize = mix(1.8, 1.0, morphProgress) + a_random.z * 1.0;
        
        v_alpha = 1.0 - clamp(length(pos.xy) * 0.4, 0.0, 1.0);
        if (u_shockwave > 0.0) v_alpha -= u_shockwave * 2.0; 
      }
    `

    const particleFS = `
      precision highp float;
      varying float v_alpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if(d > 0.5) discard;
        // 极致柔和的墨迹晕染边缘
        float alpha = smoothstep(0.5, 0.1, d) * v_alpha;
        
        // 微弱的深渊幽蓝/水墨色
        vec3 color = vec3(0.85, 0.9, 0.95);
        gl_FragColor = vec4(color, alpha * 0.4); 
      }
    `

    // ==========================================
    // 🌊 3. 全屏深渊底色与洗帧波 (Shockwave)
    // ==========================================
    const bgVS = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() { v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }
    `

    const bgFS = `
      precision highp float;
      varying vec2 v_uv;
      uniform float u_shockwave;
      uniform vec2 u_resolution;

      void main() {
        // 深灰色无极之境
        vec3 bgColor = vec3(0.04, 0.04, 0.04);
        float alpha = 1.0;

        if (u_shockwave > 0.0) {
            float aspect = u_resolution.x / u_resolution.y;
            vec2 p = v_uv - vec2(0.5);
            p.x *= aspect;
            float dist = length(p);
            
            // 极其暴力的环形波，波扫过的地方 Alpha 归 0，露出底层的真实网页！
            float ring = smoothstep(u_shockwave - 0.2, u_shockwave, dist);
            alpha = ring;
        }
        gl_FragColor = vec4(bgColor, alpha);
      }
    `

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!; gl.shaderSource(shader, source); gl.compileShader(shader); return shader;
    }

    // 编译着色器管线
    const pProg = gl.createProgram()!
    gl.attachShader(pProg, compileShader(gl.VERTEX_SHADER, particleVS))
    gl.attachShader(pProg, compileShader(gl.FRAGMENT_SHADER, particleFS))
    gl.linkProgram(pProg)

    const bgProg = gl.createProgram()!
    gl.attachShader(bgProg, compileShader(gl.VERTEX_SHADER, bgVS))
    gl.attachShader(bgProg, compileShader(gl.FRAGMENT_SHADER, bgFS))
    gl.linkProgram(bgProg)

    // 数据上传
    const targetBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, targetBuffer); gl.bufferData(gl.ARRAY_BUFFER, targets, gl.STATIC_DRAW)
    const randomBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, randomBuffer); gl.bufferData(gl.ARRAY_BUFFER, randoms, gl.STATIC_DRAW)
    const quadBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)

    // 获取 Uniforms
    const getU = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n)
    const pRes = getU(pProg, 'u_resolution'), pTime = getU(pProg, 'u_time'), pPhase = getU(pProg, 'u_phase'), pShock = getU(pProg, 'u_shockwave')
    const bgRes = getU(bgProg, 'u_resolution'), bgShock = getU(bgProg, 'u_shockwave')

    // 状态机时间轴
    const startTime = Date.now()
    let animationId: number
    const TOTAL_DURATION = 7000 // 整个加载过程 7 秒

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize); resize()

    // 开启混合模式，这是让透明度、发光和最终震荡波起效的核心
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const render = () => {
      const elapsed = Date.now() - startTime
      const timeSec = elapsed * 0.001
      
      // === 导演时间轴 ===
      // 0.0s - 1.5s: 呼吸微光点 (Phase 0)
      // 1.5s - 4.0s: 墨流爆发展开 (Phase 0 -> 1)
      // 4.0s - 6.5s: 汇聚成双鱼形态 (Phase 1 -> 2)
      let currentPhase = 0.0
      if (timeSec > 1.5 && timeSec <= 4.0) currentPhase = (timeSec - 1.5) / 2.5
      if (timeSec > 4.0) currentPhase = 1.0 + Math.min((timeSec - 4.0) / 2.5, 1.0)
      
      // 更新 React UI 的进度条 (模拟)
      const fakeProgress = Math.min(Math.floor((timeSec / 6.0) * 100), 100)
      setProgress(fakeProgress)

      // 6.5s 触发震荡波
      let shockwave = 0.0
      if (timeSec > 6.5) {
        setIsShockwave(true)
        // 极速扩散的冲击波参数
        shockwave = (timeSec - 6.5) * 1.8 
        
        // 播放深海轰鸣音效 (安全封装，若浏览器拦截则静默跳过)
        if (timeSec > 6.5 && timeSec < 6.55) {
           const actx = new (window.AudioContext || (window as any).webkitAudioContext)()
           const osc = actx.createOscillator()
           const gain = actx.createGain()
           osc.type = 'sine'; osc.frequency.setValueAtTime(40, actx.currentTime); osc.frequency.exponentialRampToValueAtTime(10, actx.currentTime + 1.5)
           gain.gain.setValueAtTime(0.5, actx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 1.5)
           osc.connect(gain); gain.connect(actx.destination); osc.start(); osc.stop(actx.currentTime + 1.5)
        }
      }

      // 7.5s 彻底销毁组件，露出主站
      if (timeSec > 7.5) {
        onComplete()
        return // 停止渲染
      }

      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT)

      // 1. 渲染背景波扫
      gl.useProgram(bgProg)
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
      const bgPos = gl.getAttribLocation(bgProg, 'a_position')
      gl.enableVertexAttribArray(bgPos); gl.vertexAttribPointer(bgPos, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(bgRes, canvas.width, canvas.height); gl.uniform1f(bgShock, shockwave)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // 2. 渲染千万流体粒子
      gl.useProgram(pProg)
      gl.bindBuffer(gl.ARRAY_BUFFER, targetBuffer)
      const aTarget = gl.getAttribLocation(pProg, 'a_target')
      gl.enableVertexAttribArray(aTarget); gl.vertexAttribPointer(aTarget, 2, gl.FLOAT, false, 0, 0)
      
      gl.bindBuffer(gl.ARRAY_BUFFER, randomBuffer)
      const aRandom = gl.getAttribLocation(pProg, 'a_random')
      gl.enableVertexAttribArray(aRandom); gl.vertexAttribPointer(aRandom, 3, gl.FLOAT, false, 0, 0)

      gl.uniform2f(pRes, canvas.width, canvas.height)
      gl.uniform1f(pTime, timeSec)
      gl.uniform1f(pPhase, currentPhase)
      gl.uniform1f(pShock, shockwave)
      
      gl.drawArrays(gl.POINTS, 0, NUM_PARTICLES)

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); gl.deleteProgram(pProg); gl.deleteProgram(bgProg) }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[999] bg-transparent pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      
      {/* 流体数字文字：在粒子海中若隐若现 */}
      <AnimatePresence>
        {!isShockwave && (
          <motion.div 
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ 
               opacity: progress > 10 ? 0.7 : 0, 
               filter: `blur(${Math.max(0, 10 - progress/10)}px)`
            }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center mix-blend-overlay"
          >
            <span className="text-white text-[12vw] font-light tracking-[0.2em] opacity-30 select-none">
              {progress}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}