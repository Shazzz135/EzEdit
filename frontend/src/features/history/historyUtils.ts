import {
  Sliders,
  Wand2,
  Crop,
  Brush,
  PenTool,
  Sparkles,
  Scissors,
  ClipboardPaste,
  RotateCw,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react'
import { type HistoryActionType, type DocumentHistoryEntry } from '@/types/document'

export function getHistoryActionIcon(actionType?: HistoryActionType): LucideIcon {
  switch (actionType) {
    case 'adjustment':
      return Sliders
    case 'filter':
      return Wand2
    case 'crop':
      return Crop
    case 'retouch':
      return Brush
    case 'annotate':
      return PenTool
    case 'ai':
      return Sparkles
    case 'cutout':
      return Scissors
    case 'paste':
      return ClipboardPaste
    case 'orientation':
      return RotateCw
    case 'init':
    default:
      return ImageIcon
  }
}

export function formatHistoryLabel(entry: DocumentHistoryEntry, index: number): string {
  if (entry.description) return entry.description
  if (index === 0) return 'Open Image'
  if (entry.actionType) {
    return entry.actionType.charAt(0).toUpperCase() + entry.actionType.slice(1)
  }
  return `Step ${index + 1}`
}

export function formatHistoryTime(timestamp?: number): string {
  if (!timestamp) return ''
  const diffSec = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSec < 5) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}
