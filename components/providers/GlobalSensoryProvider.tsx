'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, memo } from 'react';
import { SensoryEngine } from '@/lib/SensoryEngine';

interface SensoryContextType {
  engine: SensoryEngine | null;
  triggerTransition: (theme: 'dark' | 'light', clientX: number, clientY: number) => Promise<void>;
  currentTheme: 'dark' | 'light';
  isTransitioning: boolean;
  unlockEngine: () => void; 
  isAssetsLoaded: boolean; 
}

const SensoryContext = createContext<SensoryContextType | undefined>(undefined);

const ThemeTransitionOverlay = memo(({ 
  transitionRef 
}: { 
  transitionRef: React.MutableRefObject<{ 
    active: boolean, 
    x: number, 
    y: number, 
    theme: 'dark'|'light', 
    start: number,
    ignite: () => void 
  }> 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log("Quantum Fluid: Initializing WebGL Pipeline...");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
    if (!gl) {
        console.error("WebGL not supported");
        return;
    }

    const vs = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
    const fs = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec2 u_origin;
      uniform float u_progress;
      uniform float u_isDark;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) ); vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
        i = mod289(i); vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        
        vec2 distVec = (st - u_origin) * vec2(aspect, 1.0);
        float d = length(distVec);
        
        float noise = snoise(st * 4.0 + u_progress * 3.0) * 0.12;
        float maxR = length(vec2(aspect, 1.0)) * 1.3;
        float alpha = 0.0;
        
        if (u_progress <= 0.5) {
            float p = u_progress * 2.0;
            p = 1.0 - pow(1.0 - p, 3.0); 
            float currentR = p * maxR;
            alpha = smoothstep(currentR, currentR - 0.1, d + noise);
        } else {
            float p = (u_progress - 0.5) * 2.0;
            float evap = snoise(st * 12.0 - u_progress * 2.0);
            alpha = 1.0 - smoothstep(p - 0.2, p + 0.1, evap * 0.5 + 0.5);
        }
        
        vec3 color = u_isDark > 0.5 ? vec3(0.02, 0.02, 0.02) : vec3(0.96, 0.96, 0.96);
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const compile = (t: number, src: string) => { const s = gl.createShader(t)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!; gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
        res: gl.getUniformLocation(prog, 'u_resolution'),
        orig: gl.getUniformLocation(prog, 'u_origin'),
        prog: gl.getUniformLocation(prog, 'u_progress'),
        dark: gl.getUniformLocation(prog, 'u_isDark')
    };

    const resize = () => { 
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr; 
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        gl.viewport(0, 0, canvas.width, canvas.height); 
    };
    window.addEventListener('resize', resize); resize();

    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let frameId: number;
    let isAnimating = false;

    const loop = () => {
      const state = transitionRef.current;
      
      if (!state.active) {
        isAnimating = false;
        return;
      }

      if (canvas.style.opacity !== '1') canvas.style.opacity = '1';
      
      const elapsed = Date.now() - state.start;
      const progress = Math.min(elapsed / 1200.0, 1.0);
      
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uniforms.res, canvas.width, canvas.height);
      gl.uniform2f(uniforms.orig, state.x / window.innerWidth, 1.0 - (state.y / window.innerHeight));
      gl.uniform1f(uniforms.prog, progress);
      gl.uniform1f(uniforms.dark, state.theme === 'dark' ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      if (progress >= 1.0) {
          state.active = false;
          isAnimating = false; // 👑 彻底修复：解除引擎死锁
          canvas.style.opacity = '0';
          console.log("Quantum Fluid: Cycle Complete, Engine Sleep");
      } else {
          frameId = requestAnimationFrame(loop);
      }
    };

    transitionRef.current.ignite = () => {
      if (!isAnimating) {
        isAnimating = true;
        console.log("Quantum Fluid: Engine Ignition");
        loop();
      }
    };

    return () => { 
      cancelAnimationFrame(frameId); 
      window.removeEventListener('resize', resize); 
      if (gl) {
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    };
  }, [transitionRef]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[99999] pointer-events-none opacity-0" />;
});

ThemeTransitionOverlay.displayName = 'ThemeTransitionOverlay';

export const GlobalSensoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engine, setEngine] = useState<SensoryEngine | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const isReadyRef = useRef(false);
  
  const transitionRef = useRef({ 
    active: false, 
    x: 0, 
    y: 0, 
    theme: 'dark' as 'dark'|'light', 
    start: 0,
    ignite: () => {} 
  });

  useEffect(() => {
    const eng = SensoryEngine.getInstance();
    setEngine(eng);
    const saved = window.localStorage.getItem('haoye-theme');
    if (saved === 'light') setCurrentTheme('light');

    Promise.all([
      eng.loadSound('/audio/ryuichi.mp3', 'darkTheme'),
      eng.loadSound('/audio/ambre1.mp3', 'lightTheme'),
      eng.loadSound('/audio/portal.mp3', 'collapse'), 
    ]).then(() => setIsAssetsLoaded(true));

    const handleVisible = () => {
      if (document.hidden) eng.suspendAndMute();
      else if (isReadyRef.current) eng.resumeAndUnmute(); 
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, []); 

  const unlockEngine = useCallback(() => {
    if (!engine || isReadyRef.current || !isAssetsLoaded) return;
    engine.unlock(); 
    engine.switchThemeMusic(currentTheme === 'dark' ? 'darkTheme' : 'lightTheme');
    isReadyRef.current = true;
  }, [engine, currentTheme, isAssetsLoaded]);

  const triggerTransition = useCallback(async (newTheme: 'dark' | 'light', clientX: number, clientY: number) => {
    if (isTransitioning || !engine) return;
    
    console.log(`Triggering Rift: ${currentTheme} -> ${newTheme} at (${clientX}, ${clientY})`);
    setIsTransitioning(true);
    
    transitionRef.current.active = true;
    transitionRef.current.x = clientX;
    transitionRef.current.y = clientY;
    transitionRef.current.theme = newTheme;
    transitionRef.current.start = Date.now();
    
    transitionRef.current.ignite();
    
    engine.playInstantFeedback();
    engine.setCollapseEmotion(true);
    engine.fireSpatialParticle('collapse', clientX, clientY, -2.0, 1.2);
    
    await new Promise(r => setTimeout(r, 600));
    
    window.localStorage.setItem('haoye-theme', newTheme);
    document.documentElement.dataset.theme = newTheme;
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light'); document.documentElement.classList.remove('dark');
    }
    setCurrentTheme(newTheme);
    engine.switchThemeMusic(newTheme === 'dark' ? 'darkTheme' : 'lightTheme');

    document.documentElement.style.transition = 'filter 0s';
    document.documentElement.style.filter = 'contrast(1.1) saturate(1.2) blur(4px)';
    
    setTimeout(() => {
        document.documentElement.style.transition = 'filter 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
        document.documentElement.style.filter = 'contrast(1) saturate(1) blur(0px)';
    }, 50);

    await new Promise(r => setTimeout(r, 600));
    
    engine.setCollapseEmotion(false);
    setIsTransitioning(false);
  }, [engine, isTransitioning, currentTheme]);

  return (
    <SensoryContext.Provider value={{ engine, triggerTransition, currentTheme, isTransitioning, unlockEngine, isAssetsLoaded }}>
      <ThemeTransitionOverlay transitionRef={transitionRef} />
      {children}
    </SensoryContext.Provider>
  );
};

export const useSensory = () => {
  const context = useContext(SensoryContext);
  if (!context) throw new Error("useSensory must be used within GlobalSensoryProvider");
  return context;
};