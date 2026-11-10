import React, { useState } from 'react'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Crop,
  Sliders,
  Wand2,
  Brush,
  Scissors,
  Sparkles,
} from 'lucide-react'

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<
    'orientation' | 'adjustments' | 'filters' | 'selection' | 'retouch' | 'ai'
  >('adjustments')
  const [testExposure, setTestExposure] = useState(0.0)
  const [testContrast, setTestContrast] = useState(0.0)
  const [isWarningOpen, setIsWarningOpen] = useState(false)

  const toolCategories = [
    { id: 'orientation', label: 'Orientation', icon: Crop },
    { id: 'adjustments', label: 'Adjustments', icon: Sliders },
    { id: 'filters', label: 'Filters', icon: Wand2 },
    { id: 'selection', label: 'Selection', icon: Scissors },
    { id: 'retouch', label: 'Retouch', icon: Brush },
    { id: 'ai', label: 'AI Tools', icon: Sparkles },
  ] as const

  const toolsPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Category Tabs: Horizontal scroll on mobile, wrap or icons on desktop */}
      <div className="flex items-center gap-1 p-2 border-b border-[#242430] overflow-x-auto no-scrollbar flex-shrink-0 bg-[#14141A]">
        {toolCategories.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <Button
              key={cat.id}
              size="sm"
              isActive={isActive}
              onClick={() => setActiveCategory(cat.id)}
              className="text-xs whitespace-nowrap"
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Category Content Pane */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeCategory === 'adjustments' && (
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">
              Light & Color
            </h4>
            <PrecisionSlider
              label="Exposure"
              value={testExposure}
              onChange={setTestExposure}
              min={-5.0}
              max={5.0}
              step={0.1}
              defaultValue={0.0}
              unit=" EV"
            />
            <PrecisionSlider
              label="Contrast"
              value={testContrast}
              onChange={setTestContrast}
              min={-100.0}
              max={100.0}
              step={0.1}
              defaultValue={0.0}
            />
          </div>
        )}

        {activeCategory !== 'adjustments' && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#707080] text-xs">
            <span>{activeCategory.toUpperCase()} tools ready for Milestone {activeCategory === 'orientation' ? 4 : activeCategory === 'filters' ? 5 : activeCategory === 'selection' ? 6 : activeCategory === 'retouch' ? 7 : 8}</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <WorkspaceShell
        toolsContent={toolsPanel}
        headerProps={{
          onOpenAI: () => setIsWarningOpen(true),
          onExport: () => alert('Export engine will activate in Milestone 8.'),
        }}
      />

      <Modal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title="AI Enhancements"
      >
        <p className="text-xs text-[#A0A0B4] leading-relaxed">
          Pollinations.ai integration allows keyless AI image generation and
          manipulation directly in the browser. Full prompt controls will be
          wired in Milestone 8.
        </p>
        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsWarningOpen(false)}
          >
            Got it
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default App
