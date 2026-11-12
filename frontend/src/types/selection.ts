export type SelectionToolType =
  | 'rect-marquee'
  | 'ellipse-marquee'
  | 'lasso'
  | 'poly-lasso'

export type SelectionMode = 'new' | 'add' | 'subtract'

export interface Point {
  x: number
  y: number
}

export interface SelectionState {
  tool: SelectionToolType
  mode: SelectionMode
  feather: number       // 0 to 50px, default 0
  paths: Point[][]      // array of closed polygon loops
  inverted: boolean
  hasSelection: boolean
}

export const defaultSelectionState: SelectionState = {
  tool: 'rect-marquee',
  mode: 'new',
  feather: 0,
  paths: [],
  inverted: false,
  hasSelection: false,
}
