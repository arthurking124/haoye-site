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

  private constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();

    // 核心节点链路: Theme/Effects -> Filter -> Panner -> Master -> Analyser -> Destination
    this.masterGain = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.panner = this.context.createPanner();
    this.filter = this.context.createBiquadFilter();
    this.themeGain = this.context.createGain();

    // 顶级配置：平滑的高频滤波器（用于情绪共鸣）
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 24000; // 初始全通透
    this.filter.Q.value = 0.5;

    // 顶级配置：HRTF 真实 3D 空间声学
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 1000;

    // 分析器配置：用于高精度音画同步
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // 物理连接
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

  // 👑 解锁自动播放黑洞：必须由用户首次物理交互触发
  public unlock() {
    if (this.isUnlocked) return;
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    // 播放一个无声的 Buffer 彻底激活 iOS 沉睡的 AudioContext
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
      // 👑 防爆盾：如果找不到文件 (比如 404)，直接抛出错误，不要去 decode HTML！
      if (!res.ok) {
        throw new Error(`文件未找到 (HTTP ${res.status}): ${url}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
    } catch (e) {
      console.warn(`[SensoryEngine] 音频加载跳过或失败: ${name}`, e);
    }
  }

  // 👑 交叉淡入淡出与生命周期管理
  public switchThemeMusic(themeName: string, fadeDuration: number = 2.0) {
    const buffer = this.buffers.get(themeName);
    if (!buffer) return;

    const now = this.context.currentTime;

    // 优雅地干掉上一首
    if (this.themeSource) {
      this.themeGain.gain.cancelScheduledValues(now);
      this.themeGain.gain.setValueAtTime(this.themeGain.gain.value, now);
      this.themeGain.gain.exponentialRampToValueAtTime(0.001, now + fadeDuration);
      this.themeSource.stop(now + fadeDuration);
    }

    // 孕育下一首
    const newSource = this.context.createBufferSource();
    newSource.buffer = buffer;
    newSource.loop = true;
    newSource.connect(this.themeGain);
    newSource.start(now);

    // 完美的淡入曲线
    this.themeGain.gain.cancelScheduledValues(now);
    this.themeGain.gain.setValueAtTime(0.001, now);
    this.themeGain.gain.exponentialRampToValueAtTime(0.4, now + fadeDuration);

    this.themeSource = newSource;
  }

  // 👑 内存安全的空间交互粒子音效
  public fireSpatialParticle(name: string, screenX: number, screenY: number, volume: number = 1.0) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const localGain = this.context.createGain();
    localGain.gain.value = volume;

    // 屏幕坐标 -> 3D 声场坐标映射
    const x = (screenX / window.innerWidth) * 2 - 1;
    const y = -((screenY / window.innerHeight) * 2 - 1);
    
    // 每次触发创建一个独立的 Panner，以防污染全局环境音
    const localPanner = this.context.createPanner();
    localPanner.panningModel = 'HRTF';
    localPanner.positionX.value = x * 2.0; // 放大声场宽度
    localPanner.positionY.value = y * 2.0;
    localPanner.positionZ.value = -1.0; 

    source.connect(localPanner);
    localPanner.connect(localGain);
    localGain.connect(this.masterGain);

    source.start(0);

    // 👑 终极防御：播放完毕后必须断开连接，否则内存必爆！
    source.onended = () => {
      source.disconnect();
      localPanner.disconnect();
      localGain.disconnect();
    };

    if (navigator.vibrate) navigator.vibrate(15); // 微触觉
  }

  // 👑 情绪坍缩：控制低通滤波器模拟“沉入深渊”
  public setCollapseEmotion(isCollapsing: boolean) {
    const now = this.context.currentTime;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
    // 400Hz 是水下沉闷感，24000Hz 是空气通透感
    this.filter.frequency.exponentialRampToValueAtTime(isCollapsing ? 400 : 24000, now + 0.8);
  }

  // 为 WebGL 提供无损零延迟的振幅数据
  public getAmplitude(): number {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    return (sum / dataArray.length) / 255.0; // 返回 0.0 ~ 1.0 的能量值
  }
}