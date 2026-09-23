import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import rawArtworkConfig from './src/config/artwork.config.json'
import { verifyArtwork } from './src/shared/verifyArtwork'

// 本地开发与构建共用的自检：按共享配置生成一张样例作品，
// 比对导出与预览的尺寸 / 底色 / 旋转是否一致；
// 配置缺项或取值非法也会在这里点名报错，不会退回默认值。
function verifyArtworkPlugin(): Plugin {
  return {
    name: 'verify-artwork',
    buildStart() {
      const problems = verifyArtwork(rawArtworkConfig)
      if (problems.length > 0) {
        this.error(
          `[verify-artwork] 画布配置 / 导出一致性校验未通过：\n` +
          problems.map(p => `  ✗ ${p}`).join('\n')
        )
      }
      console.log('[verify-artwork] 画布配置与导出/预览一致性校验通过')
    },
  }
}

export default defineConfig({
  plugins: [react(), verifyArtworkPlugin()],
  server: { port: 5173, open: true },
})
