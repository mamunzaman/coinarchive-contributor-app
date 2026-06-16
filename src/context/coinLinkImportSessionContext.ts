import { createContext } from 'react'
import type {
  CoinImportMissingFieldKey,
  CoinImportMissingFieldTarget,
  CoinLinkImportResult,
} from '../lib/coinImport'
import type { CoinFormStepId } from '../types/coinFormSteps'

export type CoinLinkImportSessionOptions = {
  hasReverseImage?: boolean
}

export type CoinLinkImportSessionContextValue = {
  appliedResult: CoinLinkImportResult | null
  latestImportResult: CoinLinkImportResult | null
  latestSourceUrls: string[]
  registerAppliedResult: (result: CoinLinkImportResult) => void
  registerLatestImport: (result: CoinLinkImportResult, sourceUrls: string[]) => void
  clearAppliedResult: () => void
  clearLatestImport: () => void
  missingTargets: CoinImportMissingFieldTarget[]
  extractedCount: number
  missingPanelOpen: boolean
  openMissingPanel: () => void
  closeMissingPanel: () => void
  navigationMessage: string | null
  getMissingForStep: (stepId: CoinFormStepId) => CoinImportMissingFieldTarget[]
  navigateToMissing: (key: CoinImportMissingFieldKey) => void
  navigateToNextMissing: () => void
}

export const CoinLinkImportSessionContext =
  createContext<CoinLinkImportSessionContextValue | null>(null)
