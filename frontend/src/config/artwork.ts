import rawConfig from './artwork.config.json'
import { loadArtworkConfig, type ArtworkConfig } from './schema'

// 应用内唯一可信来源：画布尺寸、底色与导出参数都以这份配置为准。
// 配置缺失或非法时这里会直接抛错（错误信息点名具体项），不会退回默认值。
export const ARTWORK_CONFIG: ArtworkConfig = loadArtworkConfig(rawConfig)
