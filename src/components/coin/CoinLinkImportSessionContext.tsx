import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  getExtractedFieldEntries,
  getMissingTargetsForStep,
  navigateToImportTarget,
  resolveMissingImportTargets,
  type CoinImportMissingFieldKey,
  type CoinImportMissingFieldTarget,
  type CoinLinkImportResult,
} from '../../lib/coinImport'
import type { CoinFormValues } from '../../types/coinForm'
import type { CoinFormStepId } from '../../types/coinFormSteps'
import { CoinLinkImportMissingFieldsPanel } from './CoinLinkImportMissingFieldsPanel'

export type CoinLinkImportSessionOptions = {
  hasReverseImage?: boolean
}

type CoinLinkImportSessionContextValue = {
  appliedResult: CoinLinkImportResult | null
  registerAppliedResult: (result: CoinLinkImportResult) => void
  clearAppliedResult: () => void
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

const CoinLinkImportSessionContext = createContext<CoinLinkImportSessionContextValue | null>(null)

type CoinLinkImportSessionProviderProps = {
  values: CoinFormValues
  onNavigateToStep?: (stepId: CoinFormStepId) => void
  sessionOptions?: CoinLinkImportSessionOptions
  children: ReactNode
}

export function CoinLinkImportSessionProvider({
  values,
  onNavigateToStep,
  sessionOptions,
  children,
}: CoinLinkImportSessionProviderProps) {
  const { t } = useTranslation()
  const [appliedResult, setAppliedResult] = useState<CoinLinkImportResult | null>(null)
  const [missingPanelOpen, setMissingPanelOpen] = useState(false)
  const [navigationMessage, setNavigationMessage] = useState<string | null>(null)

  const missingTargets = useMemo(
    () =>
      appliedResult
        ? resolveMissingImportTargets(appliedResult, values, sessionOptions)
        : [],
    [appliedResult, values, sessionOptions?.hasReverseImage],
  )

  const extractedCount = useMemo(
    () => (appliedResult ? getExtractedFieldEntries(appliedResult).length : 0),
    [appliedResult],
  )

  const getMissingForStep = useCallback(
    (stepId: CoinFormStepId) => getMissingTargetsForStep(missingTargets, stepId),
    [missingTargets],
  )

  const navigateToMissing = useCallback(
    (key: CoinImportMissingFieldKey) => {
      if (!onNavigateToStep) {
        return
      }

      const target = missingTargets.find((entry) => entry.key === key)
      const announceMessage = target
        ? t('coinImport.missingReview.movedTo', { label: t(target.labelKey) })
        : null

      setMissingPanelOpen(false)
      setNavigationMessage(announceMessage)

      navigateToImportTarget(key, {
        onStepChange: onNavigateToStep,
        onAnnounce: setNavigationMessage,
        announceMessage: announceMessage ?? undefined,
      })
    },
    [missingTargets, onNavigateToStep, t],
  )

  const navigateToNextMissing = useCallback(() => {
    const next = missingTargets[0]
    if (next) {
      navigateToMissing(next.key)
    }
  }, [missingTargets, navigateToMissing])

  const value = useMemo(
    (): CoinLinkImportSessionContextValue => ({
      appliedResult,
      registerAppliedResult: setAppliedResult,
      clearAppliedResult: () => setAppliedResult(null),
      missingTargets,
      extractedCount,
      missingPanelOpen,
      openMissingPanel: () => setMissingPanelOpen(true),
      closeMissingPanel: () => setMissingPanelOpen(false),
      navigationMessage,
      getMissingForStep,
      navigateToMissing,
      navigateToNextMissing,
    }),
    [
      appliedResult,
      missingTargets,
      extractedCount,
      missingPanelOpen,
      navigationMessage,
      getMissingForStep,
      navigateToMissing,
      navigateToNextMissing,
    ],
  )

  return (
    <CoinLinkImportSessionContext.Provider value={value}>
      {children}
      {appliedResult ? (
        <CoinLinkImportMissingFieldsPanel
          open={missingPanelOpen}
          targets={missingTargets}
          navigationMessage={navigationMessage}
          onClose={() => setMissingPanelOpen(false)}
          onNavigate={navigateToMissing}
        />
      ) : null}
    </CoinLinkImportSessionContext.Provider>
  )
}

export function useCoinLinkImportSession(): CoinLinkImportSessionContextValue | null {
  return useContext(CoinLinkImportSessionContext)
}
