import React, { useState } from 'react'

export interface TooltipProps {
  content: string
  shortcut?: string
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-[11px] font-sans font-medium text-[#F4F4F6] bg-[#1E1E26] border border-[#2E2E3A] rounded shadow-lg whitespace-nowrap pointer-events-none flex items-center gap-1.5 ${positions[position]}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1 py-0.2 bg-[#2A2A36] text-[#A0A0B0] font-mono text-[10px] rounded border border-[#383848]">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  )
}
