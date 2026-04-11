"use client";

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { urlFor } from '@/lib/sanity.image';

const liquidShader = {
  uniforms: {
    uTexture: { value: null },
    uPrevTexture: { value: null },
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVelo: { value: 0 },
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
    uniform float uVelo;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      float d = distance(uv, uMouse);
      float ripple = sin(d * 15.0 - uTime * 3.0) * (0.05 * uVelo);
      vec2 refractedUv = uv + ripple;
      
      float r = texture2D(uTexture, refractedUv + ripple * 0.8).r;
      float g = texture2D(uTexture, refractedUv).g;
      float b = texture2D(uTexture, refractedUv - ripple * 0.8).b;
      vec4 color2 = vec4(r, g, b, 1.0);

      float rP = texture2D(uPrevTexture, uv + ripple * 0.8).r;
      float gP = texture2D(uPrevTexture, uv).g;
      float bP = texture2D(uPrevTexture, uv - ripple * 0.8).b;
      vec4 color1 = vec4(rP, gP, bP, 1.0);

      vec4 finalColor = mix(color1, color2, smoothstep(0.0, 1.0, uProgress));
      float light = smoothstep(0.4, 0.0, d) * 0.2 * uVelo;
      gl_FragColor = finalColor + vec4(vec3(light), 0.0);
    }
  `
};

function LiquidPlane({ imageUrls, activeIndex }: { imageUrls: string[], activeIndex: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textures = useTexture(imageUrls);
  const [prevIndex, setPrevIndex] = useState(0);
  const progress = useRef(1); 
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const velocity = useRef(0);

  const { viewport } = useThree();
  const responsiveScale = viewport.width < 13 ? (viewport.width / 13) * 0.95 : 1;

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(liquidShader.uniforms),
    vertexShader: liquidShader.vertexShader,
    fragmentShader: liquidShader.fragmentShader,
    transparent: true,
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    progress.current += (1.0 - progress.current) * 0.06;
    
    const targetMouse = new THREE.Vector2((state.mouse.x + 1) / 2, (state.mouse.y + 1) / 2);
    mouse.current.lerp(targetMouse, 0.08);
    
    velocity.current *= 0.92;
    velocity.current += targetMouse.distanceTo(mouse.current) * 0.8;
    const activeVelo = Math.max(velocity.current, 0.05);

    const shader = meshRef.current.material as THREE.ShaderMaterial;
    shader.uniforms.uTexture.value = textures[activeIndex];
    shader.uniforms.uPrevTexture.value = textures[prevIndex];
    shader.uniforms.uProgress.value = progress.current;
    shader.uniforms.uTime.value = state.clock.getElapsedTime();
    shader.uniforms.uMouse.value = mouse.current;
    shader.uniforms.uVelo.value = activeVelo;
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
      <primitive object={material} />
    </mesh>
  );
}

// 接收父组件(GalleryClientWrapper)下发的状态和触发事件
interface Props {
  items: any[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  onOpenIndex: () => void;
}

export default function LiquidGallery({ items, currentIndex, setCurrentIndex, onOpenIndex }: Props) {
  const isThrottled = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const imageUrls = useMemo(() => {
    return items.map((item) => {
      const cover = item.images?.[0];
      try {
        return cover ? urlFor(cover).width(1600).quality(95).url() : '';
      } catch {
        return '';
      }
    }).filter(Boolean);
  }, [items]);

  const triggerNext = () => {
    if (currentIndex < imageUrls.length - 1) {
      isThrottled.current = true;
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => isThrottled.current = false, 1200);
    }
  };

  const triggerPrev = () => {
    if (currentIndex > 0) {
      isThrottled.current = true;
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => isThrottled.current = false, 1200);
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isThrottled.current) return;
      const threshold = 30;
      if (e.deltaY > threshold) {
        triggerNext();
      } else if (e.deltaY < -threshold) {
        triggerPrev();
      }
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
      className="relative w-full h-screen bg-transparent overflow-hidden select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <React.Suspense fallback={null}>
          <LiquidPlane imageUrls={imageUrls} activeIndex={currentIndex} />
        </React.Suspense>
      </Canvas>
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-[10vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="text-center"
          >
            {/* 优雅的 INDEX 触发器 */}
            <button 
              onClick={onOpenIndex}
              className="pointer-events-auto text-[10px] tracking-[0.5em] text-[var(--site-faint)] mb-4 font-mono hover:text-white transition-colors cursor-pointer outline-none group/idx flex items-center justify-center gap-3 w-full"
            >
              <span className="opacity-50 group-hover/idx:opacity-100 transition-opacity">[ INDEX ]</span>
              <span>{String(currentIndex + 1).padStart(2, '0')} / {String(imageUrls.length).padStart(2, '0')}</span>
            </button>

            <h2 className="text-3xl font-light tracking-[0.2em] text-[var(--site-text-solid)] uppercase drop-shadow-xl">
              {items[currentIndex]?.title}
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}