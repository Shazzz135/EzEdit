import { describe, it, expect, beforeEach } from 'vitest'
import {
  getHistoryActionIcon,
  formatHistoryLabel,
  formatHistoryTime,
} from '../historyUtils'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
import { defaultAdjustments, defaultOrientation, defaultFilterState } from '@/types/document'
import { Sliders, Wand2, Crop, Brush, PenTool, Sparkles, Scissors, ClipboardPaste, RotateCw, Image as ImageIcon } from 'lucide-react'

describe('Issue #48: Document History Timeline & Jump-to-Index', () => {
  beforeEach(() => {
    useDocumentStore.getState().clearAllDocuments()
  })

  describe('historyUtils formatting and icons', () => {
    it('maps all action types to their respective semantic Lucide icons', () => {
      expect(getHistoryActionIcon('adjustment')).toBe(Sliders)
      expect(getHistoryActionIcon('filter')).toBe(Wand2)
      expect(getHistoryActionIcon('crop')).toBe(Crop)
      expect(getHistoryActionIcon('retouch')).toBe(Brush)
      expect(getHistoryActionIcon('annotate')).toBe(PenTool)
      expect(getHistoryActionIcon('ai')).toBe(Sparkles)
      expect(getHistoryActionIcon('cutout')).toBe(Scissors)
      expect(getHistoryActionIcon('paste')).toBe(ClipboardPaste)
      expect(getHistoryActionIcon('orientation')).toBe(RotateCw)
      expect(getHistoryActionIcon('init')).toBe(ImageIcon)
      expect(getHistoryActionIcon(undefined)).toBe(ImageIcon)
    })

    it('formats descriptive history labels accurately', () => {
      expect(formatHistoryLabel({
        imageSrc: 'test.png', width: 100, height: 100,
        adjustments: defaultAdjustments, orientation: defaultOrientation, filter: defaultFilterState,
        description: 'Adjust Exposure (+1.2 EV)',
      }, 2)).toBe('Adjust Exposure (+1.2 EV)')

      expect(formatHistoryLabel({
        imageSrc: 'test.png', width: 100, height: 100,
        adjustments: defaultAdjustments, orientation: defaultOrientation, filter: defaultFilterState,
      }, 0)).toBe('Open Image')

      expect(formatHistoryLabel({
        imageSrc: 'test.png', width: 100, height: 100,
        adjustments: defaultAdjustments, orientation: defaultOrientation, filter: defaultFilterState,
        actionType: 'crop',
      }, 1)).toBe('Crop')

      expect(formatHistoryLabel({
        imageSrc: 'test.png', width: 100, height: 100,
        adjustments: defaultAdjustments, orientation: defaultOrientation, filter: defaultFilterState,
      }, 3)).toBe('Step 4')
    })

    it('formats relative timestamp correctly', () => {
      expect(formatHistoryTime(undefined)).toBe('')
      const now = Date.now()
      expect(formatHistoryTime(now - 1000)).toBe('Just now')
      expect(formatHistoryTime(now - 30000)).toBe('30s ago')
      expect(formatHistoryTime(now - 120000)).toBe('2m ago')
    })
  })

  describe('useDocumentStore.jumpToHistoryIndex', () => {
    it('jumps directly to selected history state and restores values', () => {
      const { id } = useDocumentStore.getState().addDocument({
        name: 'test.png',
        originalWidth: 800,
        originalHeight: 600,
        currentWidth: 800,
        currentHeight: 600,
        imageSrc: 'test.png',
      })
      expect(id).toBeDefined()
      const docId = id!

      // Step 1: Initial (index 0)
      let doc = useDocumentStore.getState().documents.find((d) => d.id === docId)!
      expect(doc.historyIndex).toBe(0)
      expect(doc.history[0].description).toBe('Open Image')

      // Step 2: Apply exposure adjustment (index 1)
      useDocumentStore.getState().updateAdjustments(docId, { exposure: 1.5 })
      doc = useDocumentStore.getState().documents.find((d) => d.id === docId)!
      expect(doc.historyIndex).toBe(1)
      expect(doc.adjustments.exposure).toBe(1.5)

      // Step 3: Apply filter (index 2)
      useDocumentStore.getState().updateFilter(docId, { preset: 'vivid', intensity: 80 })
      doc = useDocumentStore.getState().documents.find((d) => d.id === docId)!
      expect(doc.historyIndex).toBe(2)
      expect(doc.filter.preset).toBe('vivid')

      // Jump directly back to Step 1 (index 0: Open Image)
      useDocumentStore.getState().jumpToHistoryIndex(docId, 0)
      doc = useDocumentStore.getState().documents.find((d) => d.id === docId)!
      expect(doc.historyIndex).toBe(0)
      expect(doc.adjustments.exposure).toBe(0)
      expect(doc.filter.preset).toBe('none')

      // Jump forward to Step 2 (index 1)
      useDocumentStore.getState().jumpToHistoryIndex(docId, 1)
      doc = useDocumentStore.getState().documents.find((d) => d.id === docId)!
      expect(doc.historyIndex).toBe(1)
      expect(doc.adjustments.exposure).toBe(1.5)
      expect(doc.filter.preset).toBe('none')

      // Out of bounds jump should safely be ignored
      useDocumentStore.getState().jumpToHistoryIndex(docId, 99)
      doc = useDocumentStore.getState().documents.find((d) => d.id === docId)!
      expect(doc.historyIndex).toBe(1)

      useDocumentStore.getState().jumpToHistoryIndex(docId, -1)
      doc = useDocumentStore.getState().documents.find((d) => d.id === docId)!
      expect(doc.historyIndex).toBe(1)
    })
  })
})
