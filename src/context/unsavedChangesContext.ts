import { createContext } from 'react'
import type { NavigateOptions } from 'react-router-dom'

export type UnsavedChangesContextValue = {
  isDirty: boolean
  setDirty: (dirty: boolean) => void
  requestNavigation: (to: string, options?: NavigateOptions) => void
}

export const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null)
