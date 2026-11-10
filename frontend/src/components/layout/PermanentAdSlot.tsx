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
      className={`w-full h-[50px] min-h-[50px] max-h-[50px] bg-[#14141A] border-t border-[#24242E] flex items-center justify-between px-3 select-none flex-shrink-0 ${className}`}
    >
      <span className="text-[9px] uppercase font-mono tracking-wider text-[#606070]">
        Ad Space
      </span>
      <div className="flex items-center gap-2 text-[#4A4A58] font-mono text-[10px]">
        <span>320 × 50</span>
        <span className="hidden sm:inline text-[9px] text-[#404050]">
          Standard Mobile Banner
        </span>
      </div>
      <span className="text-[9px] text-[#404050]">EzEdit</span>
    </aside>
  )
}
