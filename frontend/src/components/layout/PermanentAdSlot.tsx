import React from 'react'

export interface PermanentAdSlotProps {
  placement: 'desktop-skyscraper' | 'mobile-banner'
  className?: string
}

export const PermanentAdSlot: React.FC<PermanentAdSlotProps> = ({
  placement,
  className = '',
}) => {
  if (placement === 'desktop-skyscraper') {
    return (
      <aside
        aria-label="Advertisement"
        className={`w-[160px] min-w-[160px] max-w-[160px] h-[600px] bg-[#14141A] border border-[#24242E] rounded-[4px] flex flex-col items-center justify-center p-2 select-none flex-shrink-0 ${className}`}
      >
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#606070] mb-2">
          Ad Space
        </span>
        <div className="w-full flex-1 border border-dashed border-[#242430] rounded flex flex-col items-center justify-center text-center p-2 text-[#4A4A58]">
          <span className="text-[11px] font-mono">160 × 600</span>
          <span className="text-[9px] mt-1 text-[#404050]">Skyscraper Slot</span>
        </div>
      </aside>
    )
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`w-full h-[50px] min-h-[50px] max-h-[50px] bg-[#121218] border-t border-[#22222E] flex items-center justify-center px-4 select-none flex-shrink-0 ${className}`}
    >
      <div className="flex items-center justify-between w-full max-w-[480px]">
        <span className="text-[9px] uppercase font-mono tracking-widest text-[#555566]">
          Ad Space
        </span>
        <div className="flex items-center gap-2 text-[#4A4A58] font-mono text-[10px] px-2.5 py-0.5 bg-[#181822] rounded border border-[#22222E]">
          <span>320 × 50</span>
          <span className="hidden xs:inline text-[9px] text-[#404050]">
            Banner
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#404050]">EzEdit</span>
      </div>
    </aside>
  )
}
