import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const src = fs.readFileSync(path.join(root, 'src/lib/api.ts'), 'utf8')
const lines = src.split('\n')

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n')
}

const core = `import { resolveCoinArchiveApiBaseUrl } from '../apiBaseUrl'
import {
  parseApiError,
  readJsonResponse,
  resolveHttpStatus,
  type ApiDuplicateBlockInfo,
} from '../apiErrors'

export type { ApiDuplicateBlockInfo } from '../apiErrors'

${slice(52, 101)}
`

const auth = `import { parseApiError, readJsonResponse } from '../apiErrors'
import { ApiError, coinArchiveFetch, getApiBaseUrl } from './core'

${slice(18, 50)}

${slice(103, 145)}

${slice(147, 151)}

function getLoginErrorMessage(code: string | undefined, fallback: string): string {
  if (code && LOGIN_ERROR_MESSAGES[code]) {
    return LOGIN_ERROR_MESSAGES[code]
  }
  return fallback
}
`

const adminContributors = `import { parseApiError, readJsonResponse } from '../apiErrors'
import { ApiError, coinArchiveFetch, getAdminApiKey, getApiBaseUrl } from './core'
import type { ContributorRole } from './auth'

${slice(153, 236)}
`

const coinTools = `import { parseApiError, readJsonResponse } from '../apiErrors'
import {
  COIN_LINK_IMPORT_MAX_URLS,
  enrichImportResultWithCatalogueText,
  normalizeCoinLinkImportResult,
  type CoinLinkImportResult,
} from '../coinImport'
import { ApiError, coinArchiveFetch, getApiBaseUrl } from './core'

${slice(245, 371)}

${slice(373, 378)}

${slice(380, 529)}
`

const submissions = `import type { SeoProviderInfo, SubmissionSeoData } from '../../types/adminSeo'
import { resolveSeoProvider } from '../../types/adminSeo'
import type { CoinAcfDetail, ContentLanguage } from '../../types/coinForm'
export type { CoinAcfDetail } from '../../types/coinForm'
import { mergeSubmissionWithAcf } from '../../types/coinForm'
import type { DefaultImages, FormOptions } from '../../types/formOptions'
import { EMPTY_FORM_OPTIONS, resolveFormOptions } from '../../types/formOptions'
import { parseApiError, readJsonResponse } from '../apiErrors'
import { ApiError, coinArchiveFetch, getApiBaseUrl } from './core'

${slice(531, 1266)}
`

const barrel = `export * from './api/core'
export * from './api/auth'
export * from './api/adminContributors'
export * from './api/coinTools'
export * from './api/submissions'
`

const apiDir = path.join(root, 'src/lib/api')
fs.mkdirSync(apiDir, { recursive: true })
fs.writeFileSync(path.join(apiDir, 'core.ts'), core)
fs.writeFileSync(path.join(apiDir, 'auth.ts'), auth)
fs.writeFileSync(path.join(apiDir, 'adminContributors.ts'), adminContributors)
fs.writeFileSync(path.join(apiDir, 'coinTools.ts'), coinTools)
fs.writeFileSync(path.join(apiDir, 'submissions.ts'), submissions)
fs.writeFileSync(path.join(root, 'src/lib/api.ts'), barrel)
console.log('api split complete')
