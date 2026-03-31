"use client";
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- 核心 Shader 逻辑：模拟肉体撕裂与虚空 ---
const RuptureShader = {
  uniforms: {
    uMouse: { value: new THREE.Vector2(0, 0) },
    uPrevMouse: { value: new THREE.Vector2(0, 0) },
    uGape: { value: 0.0 }, // 伤口张开程度
    uAspect: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec2 uMouse;
    uniform vec2 uPrevMouse;
    uniform float uGape;
    uniform float uAspect;
    varying vec2 vUv;

    void main() {
      vec2 st = vUv * 2.0 - 1.0;
      st.x *= uAspect;
      
      vec2 m = uMouse * 2.0 - 1.0;
      m.x *= uAspect;
      vec2 pm = uPrevMouse * 2.0 - 1.0;
      pm.x *= uAspect;

      // 计算鼠标轨迹的距离场
      vec2 ba = m - pm;
      float h = clamp(dot(st - pm, ba) / dot(ba, ba), 0.0, 1.0);
      float d = length(st - pm - ba * h);

      // 核心：模拟“割开”的物理深度
      float thickness = 0.0015; // 刀锋极其锐利
      float gap = thickness + uGape * 0.02; // 随着用力，伤口翻开

      // 1. 核心刺痛：最深处的白光
      if(d < thickness) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, uGape * 0.8);
        return;
      }

      // 2. 翻开的肌肉/墙体：深邃的黑
      if(d < gap) {
        float falloff = smoothstep(gap, thickness, d);
        gl_FragColor = vec4(0.0, 0.0, 0.0, uGape * falloff);
        return;
      }

      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  `
};

// --- 渲染逻辑层 ---
const RuptureOverlay = ({ aspect }: { aspect: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastMouse = useRef(new THREE.Vector2(0, 0));
  const gape = useRef(0);

  // 预创建材质，避免渲染循环中重复创建
  const material = useMemo(() => new THREE.ShaderMaterial({
    ...RuptureShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }), []);

  useFrame((state) => {
    if (!material) return;

    const currentPos = state.mouse; 
    const speed = currentPos.distanceTo(lastMouse.current);

    // 逻辑：快划 = 撕裂，停顿 = 愈合
    if (speed > 0.02) {
      gape.current = THREE.MathUtils.lerp(gape.current, 1.0, 0.1); 
    } else {
      gape.current = THREE.MathUtils.lerp(gape.current, 0.0, 0.04); // 这种粘稠的愈合感
    }

    material.uniforms.uGape.value = gape.current;
    material.uniforms.uMouse.value.copy(currentPos);
    material.uniforms.uPrevMouse.value.copy(lastMouse.current);
    material.uniforms.uAspect.value = aspect;

    lastMouse.current.copy(currentPos);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      {/* 使用 primitive 标签，直接挂载材质，彻底解决 TS 报错 */}
      <primitive object={material} attach="material" />
    </mesh>
  );
};

// --- 主导出组件 ---
const Rupture = () => {
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    setAspect(window.innerWidth / window.innerHeight);
    const handleResize = () => setAspect(window.innerWidth / window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none w-full h-full">
      <Canvas 
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <RuptureOverlay aspect={aspect} />
      </Canvas>
    </div>
  );
};

export default Rupture;