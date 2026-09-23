import { create } from 'zustand'
import type { DesignParams, PatternType } from '../types'
import { THEMES } from '../themes/palettes'
import { ARTWORK_CONFIG } from '../config/artworkConfig'
import type { ArtworkParams } from '../render/renderArtwork'
import { exportSvg as doExportSvg, exportPng as doExportPng } from '../export/exportArtwork'

interface DesignStore extends DesignParams {
  /** 最近一次预览渲染出的 SVG，仅供预览显示，导出不读取它 */
  svgContent: string
  setParam: <K extends keyof DesignParams>(key: K, value: DesignParams[K]) => void
  setPattern: (p: PatternType) => void
  setTheme: (id: string) => void
  randomSeed: () => void
  setSvgContent: (s: string) => void
  exportSvg: () => void
  exportPng: () => void
}

/** 从 store 状态取出渲染/导出所需的作品参数（store 与渲染模块的边界） */
export function pickArtworkParams(s: DesignParams): ArtworkParams {
  const { pattern, seed, iterations, scale, rotation, strokeWidth, opacity, palette } = s
  return { pattern, seed, iterations, scale, rotation, strokeWidth, opacity, palette }
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  pattern: 'spiral',
  seed: 42,
  iterations: 200,
  scale: 1.0,
  rotation: 0,
  strokeWidth: 1.5,
  opacity: 0.8,
  palette: THEMES[0].colors,
  svgContent: '',
  setParam: (key, value) => set({ [key]: value } as Partial<DesignStore>),
  setPattern: (p) => set({ pattern: p }),
  setTheme: (id) => {
    const theme = THEMES.find(t => t.id === id)
    if (theme) set({ palette: theme.colors })
  },
  randomSeed: () => set({ seed: Math.floor(Math.random() * 99999) }),
  setSvgContent: (s) => set({ svgContent: s }),
  exportSvg: () => {
    // 导出时即时渲染，不复用 svgContent 缓存
    doExportSvg(pickArtworkParams(get()), ARTWORK_CONFIG)
  },
  exportPng: () => {
    doExportPng(pickArtworkParams(get()), ARTWORK_CONFIG)
  },
}))
