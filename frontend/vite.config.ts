import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { build } from 'esbuild'
import path from 'node:path'

/**
 * 本地开发（vite）与构建（vite build）都会执行的一道校验：
 * 按共用配置生成样例作品，比对预览与导出的尺寸、底色、旋转。
 * 校验失败（含配置缺失/非法）时直接让进程失败并打印差异。
 *
 * 校验源码位于 src/verify/buildCheck.ts，这里用 esbuild 临时打包成
 * Node ESM 后以 data: URL 导入执行，因此不会污染产物目录，也不会
 * 递归带上 React/Vite 插件。
 */
const PREFIX = '[artwork-verify]'

function artworkVerifyPlugin(): Plugin {
  let root = process.cwd()
  let ran = false

  return {
    name: 'artwork-consistency-verify',
    configResolved(config) {
      root = config.root
    },
    async buildStart() {
      // build 与 dev 启动各执行一次即可，避免 watch/rebuild 时重复
      if (ran) return
      ran = true

      const entry = path.resolve(root, 'src/verify/buildCheck.ts')
      const bundled = await build({
        entryPoints: [entry],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node18',
        write: false,
        logLevel: 'silent',
      })
      const code = bundled.outputFiles[0].text
      const dataUrl = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
      const mod = await import(dataUrl) as { runBuildCheck: () => { ok: boolean; message: string } }

      const result = mod.runBuildCheck()
      if (!result.ok) {
        // dev 与 build 都会把该错误作为致命错误输出并中止
        this.error(`\n${PREFIX} ${result.message}\n`)
      } else {
        // 用 console.log 保证 dev 控制台也能看到校验已执行（dev 下 info 级别不显示）
        console.log(`✓ ${PREFIX} ${result.message}`)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), artworkVerifyPlugin()],
  server: { port: 5173, open: true },
})
