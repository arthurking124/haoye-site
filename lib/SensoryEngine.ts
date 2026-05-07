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
  public isMuted: boolean = false; // 👑 全局静音状态，供 UI 实时同步

  private frequencyDataArray: Uint8Array<ArrayBuffer>;

  private constructor() {
    // 兼容 Safari 的 webkitAudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();

    // 核心节点初始化
    this.masterGain = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.panner = this.context.createPanner();
    this.filter = this.context.createBiquadFilter();
    this.themeGain = this.context.createGain();

    // 低通滤波器设置 (常态全开，坍缩时下潜)
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 24000; 
    this.filter.Q.value = 0.5;

    // 空间音频设置 (HRTF 模拟人头录音级真实空间感)
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 1000;

    // 频谱分析器设置 (用于驱动视觉动画)
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.frequencyDataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

    // 👑 顶级音频管线串联：
    // 背景乐 -> 低通滤波 -> 空间声场 -> 主音量 -> 频谱分析 -> 扬声器
    this.themeGain.connect(this.filter);
    this.filter.connect(this.panner);
    this.panner.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  // 保证全站唯一实例
  public static getInstance(): SensoryEngine {
    if (!SensoryEngine.instance) {
      SensoryEngine.instance = new SensoryEngine();
    }
    return SensoryEngine.instance;
  }

  // 👑 解锁硬件权限 (由 GenesisLoading 首屏点击触发)
  public unlock() {
    if (this.isUnlocked) return;
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    // 1. 原本用来骗过浏览器的极短静默音
    const silentOsc = this.context.createOscillator();
    silentOsc.connect(this.context.destination);
    silentOsc.start(0);
    silentOsc.stop(0.001);

    // 👑 2. 注入瞬间的“量子清脆反馈” (Quantum Tick)
    this.playInstantFeedback();

    this.isUnlocked = true;
  }

  // 👑 纯 DSP 合成的高级 UI 微反馈音 (0网络延迟，极其清脆)
  private playInstantFeedback() {
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    // 设定为正弦波，模拟极其纯净、干脆的水滴或琉璃敲击感
    osc.type = 'sine';

    // 频率从 800Hz 瞬间极速跌落到 100Hz (在 0.08 秒内完成)
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    // 音量从 0.3 瞬间收成 0，形成极其干净的打击感 (Percussive decay)
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // 接入主控
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);

    // 👑 触觉同步补齐：给予手指一个极短锐利的物理刺击感 (10毫秒)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(10); } catch(e) {}
    }
  }

  // 👑 极其平滑的全局静音切换 (带防爆音处理)
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    const now = this.context.currentTime;
    
    // 取消未来可能存在的包络线任务，冻结当前音量值
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    
    // 在 0.3 秒内如丝般顺滑地滑向静音或原声
    this.masterGain.gain.exponentialRampToValueAtTime(this.isMuted ? 0.001 : 1.0, now + 0.3);
    
    return this.isMuted;
  }

  // 异步加载音频资产到内存
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

  // 平滑切换主题背景乐 (交叉淡化 Crossfade)
  public switchThemeMusic(themeName: string, fadeDuration: number = 2.0) {
    const buffer = this.buffers.get(themeName);
    if (!buffer) return;

    const now = this.context.currentTime;

    // 1. 如果旧音乐在播，让它慢慢淡出并停止
    if (this.themeSource) {
      this.themeGain.gain.cancelScheduledValues(now);
      this.themeGain.gain.setValueAtTime(this.themeGain.gain.value, now);
      this.themeGain.gain.exponentialRampToValueAtTime(0.001, now + fadeDuration);
      this.themeSource.stop(now + fadeDuration);
    }

    // 2. 创建新音乐节点
    const newSource = this.context.createBufferSource();
    newSource.buffer = buffer;
    newSource.loop = true;
    newSource.connect(this.themeGain);
    newSource.start(now);

    // 3. 新音乐淡入 (从 0.001 滑向设定音量 0.4)
    this.themeGain.gain.cancelScheduledValues(now);
    this.themeGain.gain.setValueAtTime(0.001, now);
    this.themeGain.gain.exponentialRampToValueAtTime(0.4, now + fadeDuration);

    this.themeSource = newSource;
  }

  // 👑 在 3D 空间中触发瞬发粒子音效 (受 masterGain 静音控制)
  public fireSpatialParticle(name: string, screenX: number, screenY: number, depthZ: number = -1.0, volume: number = 1.0) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const localGain = this.context.createGain();
    localGain.gain.value = volume;

    // 将屏幕 2D 坐标映射到 WebAudio 3D 坐标系 (-1 到 1)
    const x = (screenX / window.innerWidth) * 2 - 1;
    const y = -((screenY / window.innerHeight) * 2 - 1);
    
    const localPanner = this.context.createPanner();
    localPanner.panningModel = 'HRTF';
    localPanner.positionX.value = x * 2.0; 
    localPanner.positionY.value = y * 2.0;
    localPanner.positionZ.value = depthZ;

    // 独立管线：音频 -> 独立 3D 定位器 -> 独立音量 -> 全局主音量 (接受全局静音控制)
    source.connect(localPanner);
    localPanner.connect(localGain);
    localGain.connect(this.masterGain); 

    source.start(0);

    // 播放完毕后及时销毁节点，释放内存
    source.onended = () => {
      source.disconnect();
      localPanner.disconnect();
      localGain.disconnect();
    };

    // 触觉闭环
    if (navigator.vibrate) navigator.vibrate(15); 
  }

  // 情绪控制器：坍缩时进行低通滤波，模拟“沉入深水”的压抑感
  public setCollapseEmotion(isCollapsing: boolean) {
    const now = this.context.currentTime;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
    this.filter.frequency.exponentialRampToValueAtTime(isCollapsing ? 400 : 24000, now + 0.8);
  }

  // 获取实时频谱振幅 (用于驱动 WebGL 视觉)
  public getAmplitude(): number {
    this.analyser.getByteFrequencyData(this.frequencyDataArray);
    let sum = 0;
    const length = this.frequencyDataArray.length;
    for (let i = 0; i < length; i++) {
      sum += this.frequencyDataArray[i];
    }
    return (sum / length) / 255.0; 
  }

  // 生命周期：页面切出时（挂起并静音）
  public suspendAndMute() {
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    setTimeout(() => {
      if (this.context.state === 'running') this.context.suspend();
    }, 500);
  }

  // 生命周期：页面切回时（恢复硬件并检查静音状态）
  public resumeAndUnmute() {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.001, now);
    // 👑 恢复时严格检查全局静音状态：如果原本就是静音的，就不恢复声音
    this.masterGain.gain.exponentialRampToValueAtTime(this.isMuted ? 0.001 : 1.0, now + 0.5);
  }
}