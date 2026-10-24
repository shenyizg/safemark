/**
 * Fonts for the watermark text. Web pages cannot list the fonts installed on a computer, so
 * we probe a list of well-known families, optionally ask for all of them through the Local
 * Font Access API (Chromium), and let users load their own font files. No font is ever
 * downloaded from the internet.
 */

export interface FontCandidate {
  family: string
  /** Chinese display name, if the font has one. */
  zh?: string
}

export const GENERIC_FONTS = ['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui'] as const

export const CANDIDATE_FONTS: readonly FontCandidate[] = [
  // Chinese — Windows
  { family: 'Microsoft YaHei', zh: '微软雅黑' },
  { family: 'SimHei', zh: '黑体' },
  { family: 'SimSun', zh: '宋体' },
  { family: 'NSimSun', zh: '新宋体' },
  { family: 'KaiTi', zh: '楷体' },
  { family: 'FangSong', zh: '仿宋' },
  { family: 'DengXian', zh: '等线' },
  { family: 'Microsoft JhengHei', zh: '微軟正黑體' },
  { family: 'YouYuan', zh: '幼圆' },
  { family: 'LiSu', zh: '隶书' },
  { family: 'STXihei', zh: '华文细黑' },
  { family: 'STKaiti', zh: '华文楷体' },
  { family: 'STSong', zh: '华文宋体' },
  { family: 'STFangsong', zh: '华文仿宋' },
  { family: 'STZhongsong', zh: '华文中宋' },
  { family: 'STXingkai', zh: '华文行楷' },
  { family: 'STLiti', zh: '华文隶书' },
  { family: 'STXinwei', zh: '华文新魏' },
  { family: 'STCaiyun', zh: '华文彩云' },
  { family: 'STHupo', zh: '华文琥珀' },
  { family: 'FZShuTi', zh: '方正舒体' },
  { family: 'FZYaoti', zh: '方正姚体' },
  // Chinese — macOS
  { family: 'PingFang SC', zh: '苹方' },
  { family: 'Hiragino Sans GB', zh: '冬青黑体' },
  { family: 'STHeiti', zh: '华文黑体' },
  { family: 'Heiti SC', zh: '黑体-简' },
  { family: 'Songti SC', zh: '宋体-简' },
  { family: 'Kaiti SC', zh: '楷体-简' },
  { family: 'Yuanti SC', zh: '圆体-简' },
  { family: 'Lantinghei SC', zh: '兰亭黑-简' },
  { family: 'Libian SC', zh: '隶变-简' },
  { family: 'Weibei SC', zh: '魏碑-简' },
  { family: 'Xingkai SC', zh: '行楷-简' },
  { family: 'Baoli SC', zh: '报隶-简' },
  { family: 'Hannotate SC', zh: '手札体-简' },
  { family: 'HanziPen SC', zh: '翩翩体-简' },
  { family: 'Wawati SC', zh: '娃娃体-简' },
  // Chinese — open source and vendor fonts
  { family: 'Source Han Sans SC', zh: '思源黑体' },
  { family: 'Source Han Serif SC', zh: '思源宋体' },
  { family: 'Noto Sans CJK SC', zh: 'Noto Sans CJK 简体' },
  { family: 'Noto Serif CJK SC', zh: 'Noto Serif CJK 简体' },
  { family: 'Noto Sans SC', zh: 'Noto Sans 简体' },
  { family: 'Noto Serif SC', zh: 'Noto Serif 简体' },
  { family: 'WenQuanYi Micro Hei', zh: '文泉驿微米黑' },
  { family: 'WenQuanYi Zen Hei', zh: '文泉驿正黑' },
  { family: 'LXGW WenKai', zh: '霞鹜文楷' },
  { family: 'Smiley Sans', zh: '得意黑' },
  { family: 'Sarasa Gothic SC', zh: '更纱黑体' },
  { family: 'HarmonyOS Sans SC', zh: '鸿蒙黑体' },
  { family: 'MiSans' },
  { family: 'Alibaba PuHuiTi', zh: '阿里巴巴普惠体' },
  { family: 'OPPOSans' },
  // Japanese and Korean
  { family: 'Hiragino Sans' },
  { family: 'Hiragino Mincho ProN' },
  { family: 'Yu Gothic' },
  { family: 'Yu Mincho' },
  { family: 'Meiryo' },
  { family: 'MS Gothic' },
  { family: 'MS Mincho' },
  { family: 'Noto Sans JP' },
  { family: 'Malgun Gothic' },
  { family: 'Apple SD Gothic Neo' },
  { family: 'Noto Sans KR' },
  // Latin — sans serif
  { family: 'Arial' },
  { family: 'Arial Black' },
  { family: 'Helvetica' },
  { family: 'Helvetica Neue' },
  { family: 'Segoe UI' },
  { family: 'Roboto' },
  { family: 'Inter' },
  { family: 'Open Sans' },
  { family: 'Noto Sans' },
  { family: 'Ubuntu' },
  { family: 'DejaVu Sans' },
  { family: 'Liberation Sans' },
  { family: 'Verdana' },
  { family: 'Tahoma' },
  { family: 'Trebuchet MS' },
  { family: 'Calibri' },
  { family: 'Candara' },
  { family: 'Century Gothic' },
  { family: 'Franklin Gothic Medium' },
  { family: 'Gill Sans' },
  { family: 'Futura' },
  { family: 'Avenir' },
  { family: 'Avenir Next' },
  { family: 'Optima' },
  { family: 'Lucida Grande' },
  { family: 'Impact' },
  // Latin — serif
  { family: 'Times New Roman' },
  { family: 'Georgia' },
  { family: 'Cambria' },
  { family: 'Constantia' },
  { family: 'Garamond' },
  { family: 'Palatino Linotype' },
  { family: 'Palatino' },
  { family: 'Book Antiqua' },
  { family: 'Baskerville' },
  { family: 'Big Caslon' },
  { family: 'Didot' },
  { family: 'Bodoni 72' },
  { family: 'Hoefler Text' },
  { family: 'Charter' },
  { family: 'Rockwell' },
  { family: 'Noto Serif' },
  { family: 'DejaVu Serif' },
  { family: 'Liberation Serif' },
  // Latin — monospace
  { family: 'Courier New' },
  { family: 'Consolas' },
  { family: 'Cascadia Code' },
  { family: 'Menlo' },
  { family: 'Monaco' },
  { family: 'SF Mono' },
  { family: 'Lucida Console' },
  { family: 'JetBrains Mono' },
  { family: 'Fira Code' },
  { family: 'Source Code Pro' },
  { family: 'DejaVu Sans Mono' },
  { family: 'Liberation Mono' },
  // Latin — display and handwriting
  { family: 'American Typewriter' },
  { family: 'Copperplate' },
  { family: 'Stencil' },
  { family: 'Comic Sans MS' },
  { family: 'Chalkboard' },
  { family: 'Marker Felt' },
  { family: 'Noteworthy' },
  { family: 'Bradley Hand' },
  { family: 'Segoe Print' },
  { family: 'Segoe Script' },
  { family: 'Brush Script MT' },
  { family: 'Snell Roundhand' },
  { family: 'Papyrus' },
]

const PROBE_TEXT = 'mmmmmmmmmmlli1WQ@&水印测试Aa'
const PROBE_BASES = ['monospace', 'sans-serif', 'serif'] as const

function signature(ctx: CanvasRenderingContext2D, font: string): string {
  ctx.font = font
  const m = ctx.measureText(PROBE_TEXT)
  return `${m.width.toFixed(2)}|${(m.actualBoundingBoxAscent ?? 0).toFixed(2)}|${(m.actualBoundingBoxDescent ?? 0).toFixed(2)}`
}

/**
 * Returns the candidate families that are installed: text set in a missing font falls back to
 * the generic family and measures exactly like it.
 */
export function detectInstalledFonts(candidates: readonly FontCandidate[]): FontCandidate[] {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return []
  const base = PROBE_BASES.map((generic) => signature(ctx, `72px ${generic}`))
  return candidates.filter(({ family }) => {
    const quoted = `"${family.replace(/["\\]/g, '\\$&')}"`
    return PROBE_BASES.some(
      (generic, i) => signature(ctx, `72px ${quoted}, ${generic}`) !== base[i],
    )
  })
}

interface LocalFontData {
  family: string
}

export function supportsLocalFontAccess(): boolean {
  return typeof window !== 'undefined' && 'queryLocalFonts' in window
}

/** All installed font families, via the Local Font Access API (asks for permission). */
export async function queryLocalFontFamilies(): Promise<string[]> {
  const query = (window as unknown as { queryLocalFonts: () => Promise<LocalFontData[]> })
    .queryLocalFonts
  const fonts = await query()
  return [...new Set(fonts.map((font) => font.family))].sort((a, b) => a.localeCompare(b))
}

export const FONT_FILE_ACCEPT = '.ttf,.otf,.woff,.woff2,.ttc'

let customFontCount = 0

/** Registers a font file for use on this page and returns its CSS family name. */
export async function loadFontFile(file: File): Promise<{ family: string; label: string }> {
  const label = file.name.replace(/\.[^.]+$/, '') || file.name
  // A unique family name, so the file never shadows (or is shadowed by) an installed font.
  const family = `SafeMark Custom ${++customFontCount} ${label}`
  const face = new FontFace(family, await file.arrayBuffer())
  await face.load()
  document.fonts.add(face)
  return { family, label }
}

export function isCustomFontFamily(family: string): boolean {
  return family.startsWith('SafeMark Custom ')
}
