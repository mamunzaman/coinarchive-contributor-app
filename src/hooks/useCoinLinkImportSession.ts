import { useContext } from 'react'
import { CoinLinkImportSessionContext } from '../context/coinLinkImportSessionContext'

import type { CoinLinkImportSessionContextValue } from '../context/coinLinkImportSessionContext'

export function useCoinLinkImportSession(): CoinLinkImportSessionContextValue | null {
  return useContext(CoinLinkImportSessionContext)
}
