import { create } from 'zustand'
import type { DesignParams, PatternType } from '../types'
import { THEMES } from '../themes/palettes'
import { ARTWORK_CONFIG } from '../config/artwork'
import { renderExportSvg } from '../shared/artwork'

interface DesignStore extends DesignParams {
  setParam: <K extends keyof DesignParams>(key: K, value: DesignParams[K]) => void
  setPattern: (p: PatternType) => void
  setTheme: (id: string) => void
  randomSeed: () => void
  exportSvg: () => void
  exportPng: () => void
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  pattern: 'spiral',
  seed: 42,
  iterations: 200,
  scale: 1.0,
  rotation: 0,
  strokeWidth: 1.5,
  opacity: 0.8,
  bgColor: ARTWORK_CONFIG.background.color,
  palette: THEMES[0].colors,
  width: ARTWORK_CONFIG.canvas.width,
  height: ARTWORK_CONFIG.canvas.height,
  setParam: (key, value) => set({ [key]: value } as any),
  setPattern: (p) => set({ pattern: p }),
  setTheme: (id) => {
    const theme = THEMES.find(t => t.id === id)
    if (theme) set({ palette: theme.colors })
  },
  randomSeed: () => set({ seed: Math.floor(Math.random() * 99999) }),
  exportSvg: () => {
    // 与预览共用同一个渲染入口，现导现算，不复用上一次的字符串
    const state = get()
    const svg = renderExportSvg(state)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ARTWORK_CONFIG.export.fileNamePrefix}-${state.seed}.svg`
    a.click()
    URL.revokeObjectURL(url)
  },
  exportPng: () => {
    const state = get()
    const svg = renderExportSvg(state)
    const scale = ARTWORK_CONFIG.export.pngScale
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(state.width * scale)
    canvas.height = Math.round(state.height * scale)
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob!)
        a.download = `${ARTWORK_CONFIG.export.fileNamePrefix}-${state.seed}.png`
        a.click()
      })
    }
    img.src = url
  },
}))
