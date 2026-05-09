// lib/SensoryEngine.ts

export class SensoryEngine {
  private static instance: SensoryEngine;
  public context: AudioContext;
  public masterGain: GainNode;
  
  // 核心效果器：低通滤波器（用于模拟被拉入深水的空间坍缩感）
  private lpf: BiquadFilterNode;
  
  // 👑 音频可视化分析器（供 FluidBackground 读取音乐振幅）
  public analyser: AnalyserNode;
  private frequencyDataArray: Uint8Array;
  
  private buffers: Map<string, AudioBuffer> = new Map();
  
  // 记录当前播放的背景音乐，用于实现丝滑的交叉淡入淡出
  private currentThemeSource: AudioBufferSourceNode | null = null;
  private currentThemeGain: GainNode | null = null;

  public isMuted: boolean = false;
  private isUnlocked: boolean = false;
  
  // 记录休眠倒计时，防止页面切回时引擎被误杀的竞态条件
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    // 兼容 Safari 的 webkitAudioContext
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioCtx();

    // 初始化全局增益（音量）、低通滤波器与分析器
    this.masterGain = this.context.createGain();
    this.lpf = this.context.createBiquadFilter();
    
    // 默认全频段通过 (20000Hz)
    this.lpf.type = 'lowpass';
    this.lpf.frequency.value = 20000; 

    // 👑 初始化并配置音频分析器
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256; // 采样精度
    this.frequencyDataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // 👑 严谨的硬件路由管线：LPF -> Analyser -> MasterGain -> 扬声器
    this.lpf.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
  }

  public static getInstance(): SensoryEngine {
    if (!SensoryEngine.instance) {
      SensoryEngine.instance = new SensoryEngine();
    }
    return SensoryEngine.instance;
  }

  // 👑 终极电击唤醒机制：专治浏览器后台休眠导致的音量卡死 (你之前弄丢的核武器)
  private ensureAwake() {
    if (this.context.state === 'suspended') {
      this.context.resume().catch(()=>{});
      
      // 如果引擎是从装死状态被踢醒的，且不应该静音，必须强制拉满主音量！
      if (!this.isMuted) {
        const now = this.context.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0.001, now); // 从谷底强拉
        this.masterGain.gain.exponentialRampToValueAtTime(1.0, now + 0.05); // 0.05秒极速恢复
      }
    }
  }

  // iOS / Safari 强制硬件解锁 (必须在用户第一次交互时调用)
  public unlock() {
    if (this.isUnlocked) return;
    
    // 创建一个极短的空白音频片段强行冲破浏览器的静音限制
    const buffer = this.context.createBuffer(1, 1, 22050);
    const node = this.context.createBufferSource();
    node.buffer = buffer;
    node.connect(this.context.destination);
    node.start(0);
    
    this.ensureAwake(); // 👑 使用高级唤醒
    this.isUnlocked = true;
  }

  // 👑 获取当前音乐的归一化振幅 (0.0 - 1.0)，供流体背景等视觉组件调用
  public getAmplitude(): number {
    // 极客级防御：如果引擎处于休眠状态或尚未初始化，直接返回 0，防止 UI 渲染报错
    if (!this.analyser || !this.frequencyDataArray || this.context.state === 'suspended') {
      return 0;
    }
    
    // 👑 绕过 TS 严格检查的完美写法
    this.analyser.getByteFrequencyData(this.frequencyDataArray as any);
    
    let sum = 0;
    for (let i = 0; i < this.frequencyDataArray.length; i++) {
      sum += this.frequencyDataArray[i];
    }
    
    return (sum / this.frequencyDataArray.length) / 255.0;
  }

  // 异步加载音频资源到内存 Map 中
  public async loadSound(url: string, name: string): Promise<void> {
    if (this.buffers.has(name)) return;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
    } catch (e) {
      console.error(`[SensoryEngine] Failed to load sound: ${url}`, e);
    }
  }

  // 量子滴答：纯 DSP 合成，零延迟的 UI 物理打击感
  public playInstantFeedback() {
    this.ensureAwake(); // 👑 每次交互强制查岗

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    // 极速下坠的频率（模拟物理打击的清脆感）
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    // 短促的音量包络线 (Envelope)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    // 微音效直接连入主增益，不经过水下滤波器，保证任何时候点击都清晰
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);

    // 播放完毕瞬间销毁节点，防止内存泄漏爆音
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    // 如果手机支持，触发同步的物理震动
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  // 空间音频引擎：发射带精确 X/Y 坐标的三维音效
  public fireSpatialParticle(name: string, screenX: number, screenY: number, depthZ: number = -1.0, volume: number = 1.0) {
    this.ensureAwake(); // 👑 每次交互强制查岗

    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const panner = this.context.createPanner();
    const gain = this.context.createGain();

    source.buffer = buffer;

    // 将屏幕 DOM 坐标系 (0 to Width/Height) 映射为声场坐标系 (-1 to 1)
    const panX = (screenX / window.innerWidth) * 2 - 1;
    const panY = -((screenY / window.innerHeight) * 2 - 1);

    // HRTF 头部相关传输函数，带来电影级的声相定位
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    
    // 兼容老版本 Safari 和现代浏览器的设置坐标方法
    if (panner.positionX) {
        panner.positionX.value = panX * 3; // 乘以 3 拉大声场宽度
        panner.positionY.value = panY * 3;
        panner.positionZ.value = depthZ;
    } else {
        panner.setPosition(panX * 3, panY * 3, depthZ);
    }

    gain.gain.setValueAtTime(volume, now);

    source.connect(panner);
    panner.connect(gain);
    // 撕裂声效连入 LPF，保证主题切换时的水下一致性感官
    gain.connect(this.lpf); 

    source.start(now);
    
    source.onended = () => {
        source.disconnect();
        panner.disconnect();
        gain.disconnect();
    };
  }

  // 👑 丝滑的主题音乐交叉淡入淡出 (Cross-fade) - 包含你修改的史诗级 Fade Out
  public switchThemeMusic(themeName: string) {
    const buffer = this.buffers.get(themeName);
    if (!buffer) return;

    const now = this.context.currentTime;
    const fadeTime = 2.0; // 2秒的史诗级过渡

    // 1. 旧音乐：呈指数级坠入深海 (Epic Fade Out)
    if (this.currentThemeGain && this.currentThemeSource) {
        const oldGain = this.currentThemeGain;
        const oldSource = this.currentThemeSource;
        
        oldGain.gain.cancelScheduledValues(now);
        // 注意：exponentialRamp 绝对不能从 0 开始，也不能降到 0，0.001 是完美的极值
        oldGain.gain.setValueAtTime(Math.max(oldGain.gain.value, 0.001), now);
        oldGain.gain.exponentialRampToValueAtTime(0.001, now + fadeTime);
        
        setTimeout(() => {
            try {
                oldSource.stop();
                oldSource.disconnect();
                oldGain.disconnect();
            } catch (e) {}
        }, fadeTime * 1000 + 100);
    }

    // 2. 新音乐：呈指数级浮出水面 (Epic Fade In)
    const newSource = this.context.createBufferSource();
    const newGain = this.context.createGain();
    
    newSource.buffer = buffer;
    newSource.loop = true; // 背景音乐无限循环
    
    newGain.gain.setValueAtTime(0.001, now);
    newGain.gain.exponentialRampToValueAtTime(0.3, now + fadeTime); // 音乐最高音量压在 0.3，绝不喧宾夺主

    newSource.connect(newGain);
    newGain.connect(this.lpf); // 音乐连入水下滤波器

    newSource.start(now);

    this.currentThemeSource = newSource;
    this.currentThemeGain = newGain;
  }

  // 情绪引擎：触发物理级空间坍缩 (水下滤波效果)
  public setCollapseEmotion(active: boolean) {
    const now = this.context.currentTime;
    this.lpf.frequency.cancelScheduledValues(now);
    this.lpf.frequency.setValueAtTime(this.lpf.frequency.value, now);
    
    if (active) {
        // 潜入深水：将声音高频砍掉，只剩 300Hz 以下的闷响
        this.lpf.frequency.exponentialRampToValueAtTime(300, now + 0.6);
    } else {
        // 重见天日：瞬间或者平滑恢复全频段 20000Hz
        this.lpf.frequency.exponentialRampToValueAtTime(20000, now + 0.6);
    }
  }

  // ---------------- 生死攸关的生命周期与防断联控制 ---------------- //

  public toggleMute(): boolean {
    this.ensureAwake(); // 👑 强制查岗

    this.isMuted = !this.isMuted;
    const now = this.context.currentTime;
    
    this.masterGain.gain.cancelScheduledValues(now);
    const currentVol = Math.max(this.masterGain.gain.value, 0.001);
    this.masterGain.gain.setValueAtTime(currentVol, now);
    this.masterGain.gain.exponentialRampToValueAtTime(this.isMuted ? 0.001 : 1.0, now + 0.3);
    
    return this.isMuted;
  }

  // 页面失去焦点 / 最小化时
  public suspendAndMute() {
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    
    // 降下帷幕
    const currentVol = Math.max(this.masterGain.gain.value, 0.001);
    this.masterGain.gain.setValueAtTime(currentVol, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    this.suspendTimer = setTimeout(() => {
      if (this.context.state === 'running') {
        this.context.suspend().catch(()=>{});
      }
    }, 500);
  }

  // 页面恢复焦点时
  public resumeAndUnmute() {
    if (this.suspendTimer) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }

    if (this.context.state === 'suspended') {
      this.context.resume().catch(()=>{});
    }

    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    
    // 👑 抛弃所有幻想，切回页面时直接从谷底 0.001 重新拉起！
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(this.isMuted ? 0.001 : 1.0, now + 0.5);
  }
}