import React from 'react'
import { Header, type HeaderProps } from './Header'
import { PermanentAdSlot } from './PermanentAdSlot'

export interface WorkspaceShellProps {
  headerProps?: HeaderProps
  canvasContent?: React.ReactNode
  toolsContent?: React.ReactNode
  tabBarContent?: React.ReactNode
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  headerProps = {},
  canvasContent,
  toolsContent,
  tabBarContent,
}) => {
  return (
    <div className="w-screen h-screen flex flex-col bg-[#0D0D10] text-[#F4F4F6] overflow-hidden select-none">
      {/* 1. Top Navigation & Action Header */}
      <Header {...headerProps}>{tabBarContent}</Header>

      {/* 2. Main Workspace Partition */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* A. Canvas Editor Viewport Area (Left on Desktop, Top on Mobile) */}
        <section
          aria-label="Photo Canvas Viewport"
          className="flex-1 relative bg-[#0B0B0E] overflow-hidden flex items-center justify-center min-h-[300px]"
        >
          {canvasContent || (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full border border-dashed border-[#2E2E3E] flex items-center justify-center mb-3 text-[#606070]">
                📁
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

        {/* B. Tools Panel (Right 320px on Desktop, Bottom Carousel on Mobile) */}
        <aside
          aria-label="Editor Tools"
          className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] h-[220px] md:h-full bg-[#16161C] border-t md:border-t-0 md:border-l border-[#242430] flex flex-col overflow-hidden flex-shrink-0 z-10"
        >
          {toolsContent || (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-[#707080] text-xs text-center">
              <span>Select an image to activate editing tools</span>
            </div>
          )}
        </aside>

        {/* C. Permanent Desktop Ad Space (Fixed 160x600 Skyscraper on Far Right) */}
        <div className="hidden md:flex flex-col items-center justify-start p-2 border-l border-[#242430] bg-[#101015] flex-shrink-0">
          <PermanentAdSlot placement="desktop-skyscraper" />
        </div>
      </main>

      {/* 3. Permanent Mobile Ad Banner (Fixed Bottom 320x50) */}
      <div className="flex md:hidden w-full flex-shrink-0 z-20">
        <PermanentAdSlot placement="mobile-banner" />
      </div>
    </div>
  )
}
