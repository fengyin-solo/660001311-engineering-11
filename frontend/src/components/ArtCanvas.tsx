import { useEffect, useRef } from 'react'
import { useDesignStore, pickArtworkParams } from '../store/design'
import { ARTWORK_CONFIG } from '../config/artworkConfig'
import { renderPreviewSvg } from '../render/renderArtwork'

export default function ArtCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const store = useDesignStore()

  useEffect(() => {
    // 预览与导出共用同一份渲染逻辑与同一份画布配置，
    // 这里不再自行拼接尺寸、底色与旋转。
    const svg = renderPreviewSvg(pickArtworkParams(store), ARTWORK_CONFIG)
    store.setSvgContent(svg)
    if (containerRef.current) {
      containerRef.current.innerHTML = svg
    }
  }, [store.pattern, store.seed, store.iterations, store.scale, store.rotation,
      store.strokeWidth, store.opacity, store.palette])

  return (
    <div
      ref={containerRef}
      className="shadow-2xl rounded border border-gray-700"
      style={{ maxWidth: '100%', maxHeight: '100%', overflow: 'hidden' }}
    />
  )
}
