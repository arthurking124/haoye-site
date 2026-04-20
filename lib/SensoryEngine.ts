// lib/SensoryEngine.ts
export class SensoryEngine {
  private static instance: SensoryEngine | null = null;
  public context: AudioContext;
  
  public masterGain: GainNode;
  public analyser: AnalyserNode;
  private panner: PannerNode;
  private filter: BiquadFilterNode;

  private buffers: Map<string, AudioBuffer> = new Map();
  private themeSource: AudioBufferSourceNode | null = null;
  private themeGain: GainNode;

  private isUnlocked: boolean = false;

  // 🏆 顶级优化 1：预分配内存，彻底消灭每秒 60 次的垃圾回收（GC）掉帧
  private frequencyDataArray: Uint8Array<ArrayBuffer>;

  private constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();

    this.masterGain = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.panner = this.context.createPanner();
    this.filter = this.context.createBiquadFilter();
    this.themeGain = this.context.createGain();

    this.filter.type = 'lowpass';
    this.filter.frequency.value = 24000; 
    this.filter.Q.value = 0.5;

    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 1000;

    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // 🏆 在系统初始化时就死锁这块内存，绝不重新 new
    this.frequencyDataArray = new Uint8Array(this.analyser.frequencyBinCount)as Uint8Array<ArrayBuffer>;

    this.themeGain.connect(this.filter);
    this.filter.connect(this.panner);
    this.panner.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  public static getInstance(): SensoryEngine {
    if (!SensoryEngine.instance) SensoryEngine.instance = new SensoryEngine();
    return SensoryEngine.instance;
  }

  public unlock() {
    if (this.isUnlocked) return;
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    const osc = this.context.createOscillator();
    osc.connect(this.context.destination);
    osc.start(0);
    osc.stop(0.001);
    this.isUnlocked = true;
  }

  public async loadSound(url: string, name: string): Promise<void> {
    if (this.buffers.has(name)) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`文件未找到 (HTTP ${res.status}): ${url}`);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
    } catch (e) {
      console.warn(`[SensoryEngine] 音频加载跳过或失败: ${name}`, e);
    }
  }

  public switchThemeMusic(themeName: string, fadeDuration: number = 2.0) {
    const buffer = this.buffers.get(themeName);
    if (!buffer) return;

    const now = this.context.currentTime;

    if (this.themeSource) {
      this.themeGain.gain.cancelScheduledValues(now);
      this.themeGain.gain.setValueAtTime(this.themeGain.gain.value, now);
      this.themeGain.gain.exponentialRampToValueAtTime(0.001, now + fadeDuration);
      this.themeSource.stop(now + fadeDuration);
    }

    const newSource = this.context.createBufferSource();
    newSource.buffer = buffer;
    newSource.loop = true;
    newSource.connect(this.themeGain);
    newSource.start(now);

    this.themeGain.gain.cancelScheduledValues(now);
    this.themeGain.gain.setValueAtTime(0.001, now);
    this.themeGain.gain.exponentialRampToValueAtTime(0.4, now + fadeDuration);

    this.themeSource = newSource;
  }

  // 🏆 顶级优化 2：Z 轴深度动态化 (新增 depthZ 参数)
  public fireSpatialParticle(name: string, screenX: number, screenY: number, depthZ: number = -1.0, volume: number = 1.0) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const localGain = this.context.createGain();
    localGain.gain.value = volume;

    const x = (screenX / window.innerWidth) * 2 - 1;
    const y = -((screenY / window.innerHeight) * 2 - 1);
    
    const localPanner = this.context.createPanner();
    localPanner.panningModel = 'HRTF';
    localPanner.positionX.value = x * 2.0; 
    localPanner.positionY.value = y * 2.0;
    localPanner.positionZ.value = depthZ; // 注入物理景深

    source.connect(localPanner);
    localPanner.connect(localGain);
    localGain.connect(this.masterGain);

    source.start(0);

    source.onended = () => {
      source.disconnect();
      localPanner.disconnect();
      localGain.disconnect();
    };

    if (navigator.vibrate) navigator.vibrate(15); 
  }

  public setCollapseEmotion(isCollapsing: boolean) {
    const now = this.context.currentTime;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
    this.filter.frequency.exponentialRampToValueAtTime(isCollapsing ? 400 : 24000, now + 0.8);
  }

  // 🏆 顶级优化 1（续）：复用同一块内存，提供极其平滑的数据流
  public getAmplitude(): number {
    this.analyser.getByteFrequencyData(this.frequencyDataArray);
    let sum = 0;
    const length = this.frequencyDataArray.length;
    for (let i = 0; i < length; i++) {
      sum += this.frequencyDataArray[i];
    }
    return (sum / length) / 255.0; 
  }

  // 🏆 顶级优化 3：页面生命周期控制（挂起音频）
  public suspendAndMute() {
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    // 等待音量淡出后真正挂起硬件
    setTimeout(() => {
      if (this.context.state === 'running') this.context.suspend();
    }, 500);
  }

  // 🏆 顶级优化 3：页面生命周期控制（恢复音频）
  public resumeAndUnmute() {
    if (this.context.state === 'suspended') this.context.resume();
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(1.0, now + 0.5);
  }
}