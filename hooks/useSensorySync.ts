// hooks/useSensorySync.ts
import { useFrame } from '@react-three/fiber';
import { useSensory } from '@/components/providers/GlobalSensoryProvider';
import * as THREE from 'three';

export function useSensorySync(materialRef: React.MutableRefObject<THREE.ShaderMaterial | null>) {
  const { engine } = useSensory();

  useFrame(() => {
    if (!materialRef.current || !engine) return;
    
    // 👑 绕过 React State，直接在 GPU 渲染前一毫秒，从音频硬件内存中拔出振幅数据！
    const rawAmplitude = engine.getAmplitude();
    
    // 喂给你的 Shader uniform
    materialRef.current.uniforms.u_audio_amplitude.value = rawAmplitude;
  });
}