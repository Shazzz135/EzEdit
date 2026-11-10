import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface DropdownOption<T extends string = string> {
  id: T
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
}

export interface DropdownProps<T extends string = string> {
  options: readonly DropdownOption<T>[]
  selectedId: T
  onSelect: (id: T) => void
  label?: string
  className?: string
  disabled?: boolean
}

export const Dropdown = <T extends string = string>({
  options,
  selectedId,
  onSelect,
  label,
  className = '',
  disabled = false,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.id === selectedId) || options[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const SelectedIcon = selectedOption?.icon

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full select-none text-xs font-sans ${className}`}
    >
      {label && (
        <span className="block text-[10px] font-mono uppercase tracking-wider text-[#707082] mb-1">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-8 px-2.5 bg-[#181822] hover:bg-[#20202C] text-[#F4F4F6] border border-[#2A2A38] hover:border-[#3E3E50] rounded-[4px] flex items-center justify-between gap-2 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#60A5FA]`}
      >
        <div className="flex items-center gap-2 truncate">
          {SelectedIcon && (
            <SelectedIcon className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0" />
          )}
          <span className="truncate font-medium">{selectedOption?.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#808092] transition-transform duration-150 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-[#60A5FA]' : ''
          }`}
        />
      </button>

      {/* Options Menu Popover */}
      {isOpen && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#161620] border border-[#2E2E3E] rounded-[4px] shadow-2xl py-1 divide-y divide-[#20202C] focus:outline-none"
        >
          {options.map((option) => {
            const isSelected = option.id === selectedId
            const OptionIcon = option.icon

            return (
              <li
                key={option.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(option.id)
                  setIsOpen(false)
                }}
                className={`flex items-center justify-between px-2.5 py-2 cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? 'bg-[#222232] text-[#60A5FA] font-medium'
                    : 'text-[#D0D0DC] hover:bg-[#1E1E2A] hover:text-[#F4F4F6]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {OptionIcon && (
                    <OptionIcon
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-[#60A5FA]' : 'text-[#808094]'
                      }`}
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#60A5FA]" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
