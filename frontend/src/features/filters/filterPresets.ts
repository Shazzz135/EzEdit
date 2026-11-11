import { type PresetFilterType } from '@/types/document'

export interface FilterPresetDefinition {
  id: PresetFilterType
  name: string
  description: string
  shaderIndex: number
  previewGradient: string
}

export const FILTER_PRESETS: FilterPresetDefinition[] = [
  {
    id: 'none',
    name: 'Original',
    description: 'No preset filter applied',
    shaderIndex: 0,
    previewGradient: 'from-zinc-500 to-zinc-700',
  },
  {
    id: 'vivid',
    name: 'Vivid',
    description: 'Punchy contrast and vibrant saturation',
    shaderIndex: 1,
    previewGradient: 'from-amber-500 via-rose-500 to-indigo-500',
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Golden hour amber warmth with soft highlights',
    shaderIndex: 2,
    previewGradient: 'from-amber-400 to-orange-600',
  },
  {
    id: 'cool',
    name: 'Cool',
    description: 'Crisp oceanic cyan and clean blue contrast',
    shaderIndex: 3,
    previewGradient: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'Moody cinema contrast with crushed shadows',
    shaderIndex: 4,
    previewGradient: 'from-purple-900 via-slate-800 to-black',
  },
  {
    id: 'heavy-warm',
    name: 'Heavy Warm',
    description: 'Deep sunset amber and rich golden glow',
    shaderIndex: 5,
    previewGradient: 'from-orange-500 via-red-600 to-amber-700',
  },
  {
    id: 'heavy-cool',
    name: 'Heavy Cool',
    description: 'Deep arctic frosty blue winter chill',
    shaderIndex: 6,
    previewGradient: 'from-sky-300 via-blue-500 to-indigo-900',
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Balanced photographic monochrome tonal range',
    shaderIndex: 7,
    previewGradient: 'from-zinc-200 via-zinc-400 to-zinc-700',
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'High-contrast silver-screen black & white',
    shaderIndex: 8,
    previewGradient: 'from-white via-zinc-600 to-black',
  },
]

export const PRESET_SHADER_MAP: Record<PresetFilterType, number> = {
  none: 0,
  vivid: 1,
  warm: 2,
  cool: 3,
  dramatic: 4,
  'heavy-warm': 5,
  'heavy-cool': 6,
  mono: 7,
  noir: 8,
}
