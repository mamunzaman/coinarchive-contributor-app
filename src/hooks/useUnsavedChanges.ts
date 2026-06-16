import { useContext } from 'react'
import { UnsavedChangesContext } from '../context/unsavedChangesContext'

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext)
  if (!context) {
    throw new Error('UnsavedChangesContext is unavailable.')
  }
  return context
}
