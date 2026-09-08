import type { LayoutSettings } from '@/types/resume'

const YAHEI = "'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
const SONG = "'SimSun', 'Songti SC', serif"
const HEI = "'SimHei', 'PingFang SC', sans-serif"

export const FONTS = { YAHEI, SONG, HEI }

/** 构造模板排版参数 */
export function makeLayout(patch: Partial<LayoutSettings> = {}): LayoutSettings {
  return {
    fontFamily: YAHEI,
    fontSize: 14,
    lineHeight: 1.5,
    moduleSpacing: 10,
    itemSpacing: 6,
    pageMargin: 10,
    themeColor: '#000000',
    titleBold: true,
    ...patch,
  }
}
