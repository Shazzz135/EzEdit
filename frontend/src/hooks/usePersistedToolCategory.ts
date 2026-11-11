import { useState, useEffect } from 'react'
import { type ToolCategory } from '@/components/layout/ToolsPanel'

export const TOOL_CATEGORY_STORAGE_KEY = 'ezedit_active_tool_category'

export const VALID_CATEGORIES: ToolCategory[] = [
  'orientation',
  'adjustments',
  'filters',
  'selection',
  'retouch',
  'ai',
]

export function getSavedToolCategory(defaultCategory: ToolCategory = 'adjustments'): ToolCategory {
  try {
    const saved = localStorage.getItem(TOOL_CATEGORY_STORAGE_KEY) as ToolCategory | null
    if (saved && VALID_CATEGORIES.includes(saved)) {
      return saved
    }
  } catch {
    // Fallback for restricted storage or SSR environments
  }
  return defaultCategory
}

export function saveToolCategory(category: ToolCategory): void {
  try {
    localStorage.setItem(TOOL_CATEGORY_STORAGE_KEY, category)
  } catch {
    // Ignore write errors
  }
}

export function usePersistedToolCategory(defaultCategory: ToolCategory = 'adjustments') {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>(() =>
    getSavedToolCategory(defaultCategory)
  )

  useEffect(() => {
    saveToolCategory(activeCategory)
  }, [activeCategory])

  return [activeCategory, setActiveCategory] as const
}
