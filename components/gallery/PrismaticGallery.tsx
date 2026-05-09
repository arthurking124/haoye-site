'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { urlFor } from '@/lib/sanity.image';
import { useSensory } from '@/components/providers/GlobalSensoryProvider';

// ==========================================
// 👑 1. SOTY 级光线与物理着色器 (内嵌后期处理)
// ==========================================
const prismaticShader = {
  uniforms: {
    uTexture: { value: null },
    uPrevTexture: { value: null },
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(1, 1) }, 
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform sampler2D uPrevTexture;
    uniform float uProgress;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // 流体力学扰动算法
    vec2 fluid_noise(vec2 uv, float t) {
      float x = sin(uv.y * 8.0 + t) + cos(uv.x * 5.0 - t);
      float y = cos(uv.x * 8.0 - t) + sin(uv.y * 5.0 + t);
      return vec2(x, y) * 0.5;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      vec2 correctUv = vec2(uv.x * aspect, uv.y);
      vec2 correctMouse = vec2(uMouse.x * aspect, uMouse.y);
      
      // 常驻液态呼吸
      vec2 baseDistortion = fluid_noise(uv * 2.0, uTime * 0.5) * 0.005;
      
      // 鼠标磁性透镜与焦散
      vec2 mouseDelta = correctUv - correctMouse;
      float mouseDist = length(mouseDelta);
      float mousePower = exp(-mouseDist * 8.0) * 0.1; 
      vec2 mouseDistortion = normalize(mouseDelta + 0.0001) * mousePower;
      float caustic = sin(mouseDist * 40.0 - uTime * 10.0) * exp(-mouseDist * 5.0) * 0.01;
      
      // 翻页全局空间撕裂
      float transitionIntensity = sin(uProgress * 3.14159) * 0.8;
      vec2 transitionDistortion = fluid_noise(uv * 15.0, uTime) * transitionIntensity;
      
      // 缝合物理场
      vec2 offset = baseDistortion + mouseDistortion + vec2(caustic) + transitionDistortion;
      
      // 物理高光追踪 (Glare)
      float glare = (length(mouseDistortion) + abs(caustic)) * 2.5;
      vec4 glareColor = vec4(glare * 0.6);
      
      // RGB 色散采样
      float r2 = texture2D(uTexture, uv + offset * 1.5).r;
      float g2 = texture2D(uTexture, uv + offset * 0.5).g;
      float b2 = texture2D(uTexture, uv - offset * 1.5).b;
      vec4 c2 = vec4(r2, g2, b2, 1.0) + glareColor;

      float r1 = texture2D(uPrevTexture, uv + offset * 1.5).r;
      float g1 = texture2D(uPrevTexture, uv + offset * 0.5).g;
      float b1 = texture2D(uPrevTexture, uv - offset * 1.5).b;
      vec4 c1 = vec4(r1, g1, b1, 1.0) + glareColor;

      vec4 finalColor = mix(c1, c2, smoothstep(0.0, 1.0, uProgress));

      // 👑 胶片后期处理 (Post-Processing)
      // 1. 动态电影噪点 (Film Grain)
      float grain = fract(sin(dot(vUv + uTime, vec2(12.9898, 78.233))) * 43758.5453) * 0.035;
      
      // 2. 边缘暗角 (Vignette)
      float distToCenter = distance(vUv, vec2(0.5));
      float vignette = mix(1.0, smoothstep(0.85, 0.2, distToCenter), 0.4); 

      // 最终合成：色彩 * 暗角 + 噪点
      gl_FragColor = vec4(finalColor.rgb * vignette + grain, 1.0);
    }
  `
};

// ==========================================
// 👑 2. 殿堂级字母错位排版微动效组件 (SplitText)
// ==========================================
const SotyText = ({ text }: { text: string }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex justify-center overflow-hidden py-2" // py-2 防止字母旋转被截断
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { y: '100%', opacity: 0, rotateZ: 15 },
            visible: { 
              y: '0%', opacity: 1, rotateZ: 0, 
              transition: { delay: i * 0.035, duration: 0.8, ease: [0.19, 1, 0.22, 1] } 
            },
            exit: { 
              y: '-100%', opacity: 0, rotateZ: -15, 
              transition: { delay: i * 0.015, duration: 0.4, ease: [0.19, 1, 0.22, 1] } 
            }
          }}
          className="inline-block origin-bottom-left"
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

// ==========================================
// 👑 3. WebGL 3D 渲染平面
// ==========================================
function PrismaticPlane({ imageUrls, activeIndex }: { imageUrls: string[], activeIndex: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textures = useTexture(imageUrls);
  const [prevIndex, setPrevIndex] = useState(0);
  const progress = useRef(1); 
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));

  const { viewport } = useThree();
  const responsiveScale = viewport.width < 13 ? (viewport.width / 13) * 0.95 : 1;

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(prismaticShader.uniforms),
    vertexShader: prismaticShader.vertexShader,
    fragmentShader: prismaticShader.fragmentShader,
    transparent: true,
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    progress.current = THREE.MathUtils.damp(progress.current, 1.0, 3.7, delta);
    const targetMouse = new THREE.Vector2((state.mouse.x + 1) / 2, (state.mouse.y + 1) / 2);
    mouse.current.x = THREE.MathUtils.damp(mouse.current.x, targetMouse.x, 5.0, delta);
    mouse.current.y = THREE.MathUtils.damp(mouse.current.y, targetMouse.y, 5.0, delta);

    const shader = meshRef.current.material as THREE.ShaderMaterial;
    shader.uniforms.uTexture.value = textures[activeIndex];
    shader.uniforms.uPrevTexture.value = textures[prevIndex];
    shader.uniforms.uProgress.value = progress.current;
    shader.uniforms.uTime.value = state.clock.getElapsedTime();
    shader.uniforms.uMouse.value = mouse.current;
    shader.uniforms.uResolution.value.set(state.size.width, state.size.height);
  });

  useEffect(() => {
    if (activeIndex !== prevIndex) {
      progress.current = 0;
      const timer = setTimeout(() => setPrevIndex(activeIndex), 600);
      return () => clearTimeout(timer);
    }
  }, [activeIndex, prevIndex]);

  return (
    <mesh ref={meshRef} scale={responsiveScale}>
      <planeGeometry args={[12, 7.5, 32, 32]} />
      <primitive object={material} dispose={null} /> {/* 强制接管内存 */}
    </mesh>
  );
}

// ==========================================
// 👑 4. 极致防御的主容器包裹
// ==========================================
interface Props {
  images: any[]; 
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onOpenIndex?: () => void;
}

export default function PrismaticGallery({ images, currentIndex, onIndexChange, onOpenIndex }: Props) {
  const { engine } = useSensory();
  
  const isThrottled = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const imageUrls = useMemo(() => {
    return images.map((item) => {
      const cover = item.images?.[0];
      try {
        return cover ? urlFor(cover).width(1600).quality(95).url() : '';
      } catch {
        return '';
      }
    }).filter(Boolean);
  }, [images]);

  const triggerNext = () => {
    if (currentIndex < imageUrls.length - 1) {
      isThrottled.current = true;
      engine?.playInstantFeedback();
      onIndexChange(currentIndex + 1);
      setTimeout(() => isThrottled.current = false, 1200);
    } else {
      isThrottled.current = true;
      engine?.playInstantFeedback();
      onIndexChange(0);
      setTimeout(() => isThrottled.current = false, 1200);
    }
  };

  const triggerPrev = () => {
    if (currentIndex > 0) {
      isThrottled.current = true;
      engine?.playInstantFeedback();
      onIndexChange(currentIndex - 1);
      setTimeout(() => isThrottled.current = false, 1200);
    } else {
      isThrottled.current = true;
      engine?.playInstantFeedback();
      onIndexChange(imageUrls.length - 1);
      setTimeout(() => isThrottled.current = false, 1200);
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isThrottled.current) return;
      const threshold = 30;
      if (e.deltaY > threshold) triggerNext();
      else if (e.deltaY < -threshold) triggerPrev();
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentIndex, imageUrls.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isThrottled.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;
    const threshold = 40;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold) triggerNext();
      else if (deltaX < -threshold) triggerPrev();
    } else {
      if (deltaY > threshold) triggerNext();
      else if (deltaY < -threshold) triggerPrev();
    }
  };

  if (imageUrls.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[100dvh] bg-transparent overflow-hidden select-none touch-none cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        if (!isThrottled.current) triggerNext();
      }}
    >
      {/* 👑 性能与显存防爆盾：dpr 限制与 gl 深度剔除 */}
      <Canvas 
        dpr={[1, 1.5]} 
        gl={{ powerPreference: "high-performance", antialias: false, depth: false, stencil: false }}
        camera={{ position: [0, 0, 5], fov: 75 }}
      >
        <React.Suspense fallback={null}>
          <PrismaticPlane imageUrls={imageUrls} activeIndex={currentIndex} />
        </React.Suspense>
      </Canvas>
      
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-[10vh]">
        <AnimatePresence mode="wait">
          {/* 这里不再使用生硬的整体 fade，而是用我们的 SotyText 处理文字 */}
          <motion.div
            key={currentIndex}
            className="text-center"
          >
            {/* Index 按钮保留基础过渡，保证不喧宾夺主 */}
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.4 } }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenIndex) onOpenIndex();
              }}
              className="pointer-events-auto text-[10px] tracking-[0.5em] text-black/40 mb-4 font-mono hover:text-black transition-colors cursor-pointer outline-none group/idx flex items-center justify-center gap-3 w-full"
            >
              <span className="opacity-50 group-hover/idx:opacity-100 transition-opacity">[ INDEX ]</span>
              <span>{String(currentIndex + 1).padStart(2, '0')} / {String(imageUrls.length).padStart(2, '0')}</span>
            </motion.button>

            {/* 👑 SOTY 级排版动效 */}
            <h2 className="text-3xl font-light tracking-[0.2em] text-black uppercase drop-shadow-sm">
              <SotyText text={images[currentIndex]?.title || 'UNTITLED'} />
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}