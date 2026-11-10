import React, { useState, useRef, useEffect, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'

export interface PrecisionSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  unit?: string
  className?: string
  disabled?: boolean
}

export const PrecisionSlider: React.FC<PrecisionSliderProps> = ({
  label,
  value,
  onChange,
  min = -100.0,
  max = 100.0,
  step = 0.1,
  defaultValue = 0.0,
  unit = '',
  className = '',
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const roundToStep = useCallback(
    (val: number) => {
      const factor = 1 / step
      return Math.round(val * factor) / factor
    },
    [step]
  )

  const clamp = useCallback(
    (val: number) => {
      const rounded = roundToStep(val)
      return Math.min(max, Math.max(min, rounded))
    },
    [min, max, roundToStep]
  )

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value)
    onChange(clamp(raw))
  }

  const handleReset = () => {
    if (!disabled) {
      onChange(defaultValue)
    }
  }

  const startInlineEdit = () => {
    if (disabled) return
    setInputValue(value.toFixed(1))
    setIsEditing(true)
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const commitInlineEdit = () => {
    const parsed = parseFloat(inputValue)
    if (!isNaN(parsed)) {
      onChange(clamp(parsed))
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitInlineEdit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  // Calculate visual percentage fill (supporting bipolar center 0)
  const percent = ((value - min) / (max - min)) * 100
  const isBipolar = min < 0 && max > 0
  const zeroPercent = isBipolar ? ((0 - min) / (max - min)) * 100 : 0
  const fillLeft = isBipolar ? Math.min(zeroPercent, percent) : 0
  const fillWidth = isBipolar
    ? Math.abs(percent - zeroPercent)
    : percent

  const formattedValue =
    isBipolar && value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)

  return (
    <div
      className={`flex flex-col gap-1.5 select-none text-xs font-sans ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#9090A0] font-medium tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              step={step}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={commitInlineEdit}
              onKeyDown={handleKeyDown}
              className="w-14 px-1 py-0.5 text-right font-mono text-xs bg-[#22222A] text-[#F4F4F6] border border-[#60A5FA] rounded outline-none"
            />
          ) : (
            <span
              onDoubleClick={startInlineEdit}
              title="Double click to type exact value"
              className="font-mono text-[11px] text-[#F4F4F6] cursor-pointer hover:text-[#60A5FA] transition-colors"
            >
              {formattedValue}
              {unit}
            </span>
          )}
          {value !== defaultValue && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset to default (0.0)"
              className="text-[#9090A0] hover:text-[#F4F4F6] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex items-center h-4 w-full">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 bg-[#1F1F26] rounded-full overflow-hidden border border-[#262630]">
          {/* Active fill bar */}
          <div
            className="absolute top-0 bottom-0 bg-[#60A5FA] rounded-full transition-all duration-75"
            style={{
              left: `${fillLeft}%`,
              width: `${fillWidth}%`,
            }}
          />
        </div>

        {/* Center line for bipolar sliders */}
        {isBipolar && (
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-[#3E3E4C] z-0 pointer-events-none"
            style={{ left: `${zeroPercent}%` }}
          />
        )}

        {/* Real HTML range slider with custom thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          onDoubleClick={handleReset}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
        />

        {/* Visible Thumb Indicator */}
        <div
          className="absolute w-3 h-3 bg-[#F4F4F6] border border-[#1A1A22] rounded-full shadow pointer-events-none transition-transform duration-75 -translate-x-1/2"
          style={{ left: `${percent}%` }}
        />
      </div>
    </div>
  )
}
