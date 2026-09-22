export interface QualityState {
  tier: 'low' | 'medium' | 'high';
  pixelRatio: number;
  bloom: boolean;
  depthOfField: boolean;
  reflections: boolean;
}

export const QUALITY_PRESETS: Record<QualityState['tier'], Omit<QualityState, 'tier'>> = {
  low: { pixelRatio: 1, bloom: false, depthOfField: false, reflections: false },
  medium: { pixelRatio: 1.25, bloom: true, depthOfField: false, reflections: true },
  high: { pixelRatio: 1.5, bloom: true, depthOfField: true, reflections: true },
};

export interface FramePassContext {
  time: number;
  width: number;
  height: number;
}

export interface FramePass {
  id: string;
  enabled: boolean;
  resize?(width: number, height: number): void;
  beforeFrame?(ctx: FramePassContext): void;
  dispose?(): void;
}
