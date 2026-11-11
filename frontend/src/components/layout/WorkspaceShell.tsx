import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Header, type HeaderProps } from './Header'
import { PermanentAdSlot } from './PermanentAdSlot'

export interface WorkspaceShellProps {
  headerProps?: HeaderProps
  canvasContent?: React.ReactNode
  toolsContent?: React.ReactNode
  tabBarContent?: React.ReactNode
  defaultToolsWidth?: number
  minToolsWidth?: number
  maxToolsWidth?: number
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  headerProps = {},
  canvasContent,
  toolsContent,
  tabBarContent,
  defaultToolsWidth = 320,
  minToolsWidth = 260,
  maxToolsWidth = 520,
}) => {
  const [toolsWidth, setToolsWidth] = useState(defaultToolsWidth)
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    isDraggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleDoubleClick = useCallback(() => {
    setToolsWidth(defaultToolsWidth)
  }, [defaultToolsWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      // Calculate new width: distance from right edge of viewport
      const newWidth = window.innerWidth - e.clientX
      const clamped = Math.min(maxToolsWidth, Math.max(minToolsWidth, newWidth))
      setToolsWidth(clamped)
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false)
        isDraggingRef.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [minToolsWidth, maxToolsWidth])

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0D0D10] text-[#F4F4F6] overflow-hidden select-none">
      {/* 1. Top Navigation & Action Header */}
      <Header {...headerProps}>{tabBarContent}</Header>

      {/* 2. Main Workspace Partition */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* A. Permanent Desktop Ad Space (Far Left on Desktop: 160x600) */}
        <div className="hidden md:flex flex-col items-center justify-start p-2 border-r border-[#242430] bg-[#101015] flex-shrink-0">
          <PermanentAdSlot placement="desktop-skyscraper" />
        </div>

        {/* B. Canvas Editor Viewport Area (Middle on Desktop, Top on Mobile) */}
        <section
          aria-label="Photo Canvas Viewport"
          className="flex-1 relative bg-[#0B0B0E] overflow-hidden flex items-center justify-center min-h-[160px] md:min-h-[300px]"
        >
          {canvasContent || (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full border border-dashed border-[#2E2E3E] flex items-center justify-center mb-3 text-[#606070]">
                <Plus className="w-6 h-6 text-[#60A5FA]" />
              </div>
              <h3 className="text-sm font-medium text-[#C8C8D4] mb-1">
                Drop an image here or click Import
              </h3>
              <p className="text-xs text-[#707080] max-w-xs">
                Supports PNG, JPEG, WebP. Multi-tab editing supports up to 6
                documents simultaneously.
              </p>
            </div>
          )}
        </section>

        {/* C. Desktop Resizable Handle (Divider between Canvas & Tools) */}
        <div
          role="separator"
          aria-label="Resize tools panel"
          title="Drag to resize tools menu, double click to reset"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className={`hidden md:flex w-2 -ml-1 z-20 cursor-col-resize items-center justify-center group transition-colors ${
            isDragging ? 'bg-[#60A5FA]/30' : 'hover:bg-[#60A5FA]/20'
          }`}
        >
          <div
            className={`w-[1px] h-8 rounded-full transition-colors ${
              isDragging ? 'bg-[#60A5FA]' : 'bg-[#2E2E3E] group-hover:bg-[#60A5FA]'
            }`}
          />
        </div>

        {/* D. Tools Panel (Full width on Mobile, Resizable width on Desktop) */}
        <aside
          aria-label="Editor Tools"
          style={{ '--tools-width': `${toolsWidth}px` } as React.CSSProperties}
          className="w-full max-w-full md:w-[var(--tools-width)] md:min-w-[260px] md:max-w-[520px] h-[240px] md:h-full bg-[#16161C] border-t md:border-t-0 md:border-l border-[#242430] flex flex-col overflow-hidden flex-shrink-0 z-10"
        >
          {toolsContent || (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-[#707080] text-xs text-center">
              <span>Select an image to activate editing tools</span>
            </div>
          )}
        </aside>
      </main>

      {/* 3. Permanent Mobile Ad Banner (Horizontal at the very bottom on Mobile: 320x50) */}
      <footer className="flex md:hidden w-full flex-shrink-0 z-20">
        <PermanentAdSlot placement="mobile-banner" />
      </footer>
    </div>
  )
}
