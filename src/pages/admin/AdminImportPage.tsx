import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Info,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Link } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import {
  importAdminCoins,
  type ImportAdminCoinsResponse,
  type ImportCoinRow,
} from '../../lib/adminApi'
import { getAuthToken } from '../../lib/auth'

// ── Template field definitions ────────────────────────────────────────────────

type TemplateField = {
  key: string
  label: string
  required: boolean
  description: string
}

const TEMPLATE_FIELDS: TemplateField[] = [
  // Required
  { key: 'title', label: 'Title', required: true, description: 'Full coin title' },
  { key: 'country', label: 'Country', required: true, description: 'Country of issue' },
  { key: 'year', label: 'Year', required: true, description: '4-digit year, e.g. 2023' },
  { key: 'denomination', label: 'Denomination', required: true, description: 'e.g. 2 Euro, 50 Cent' },
  { key: 'coin_type', label: 'Coin Type', required: true, description: 'e.g. Commemorative, Circulation' },
  { key: 'obverse_image_url', label: 'Obverse Image URL', required: true, description: 'Full URL to obverse image' },
  { key: 'reverse_image_url', label: 'Reverse Image URL', required: true, description: 'Full URL to reverse image' },
  // Optional
  { key: 'theme', label: 'Theme', required: false, description: 'e.g. Nature, History' },
  { key: 'coin_code', label: 'Coin Code', required: false, description: 'Auto-generated in the XLSX template from country, year, denomination, and coin type. Mint marks are handled separately and are not part of the coin code.' },
  { key: 'short_description', label: 'Short Description', required: false, description: 'Brief 1–2 sentence summary' },
  { key: 'historical_background', label: 'Historical Background', required: false, description: 'Full historical context' },
  { key: 'mintage', label: 'Mintage', required: false, description: 'Total coins minted, e.g. 5000000' },
  { key: 'mint_mark', label: 'Mint Mark', required: false, description: 'Comma-separated mint marks. Use A,D,F,G,J for all German mints, or a single value like A. Leave empty if unknown.' },
  { key: 'material', label: 'Material', required: false, description: 'e.g. Bimetallic, Silver' },
  { key: 'weight', label: 'Weight (g)', required: false, description: 'Weight in grams, e.g. 8.5' },
  { key: 'diameter', label: 'Diameter (mm)', required: false, description: 'Diameter in mm, e.g. 25.75' },
  { key: 'edge', label: 'Edge', required: false, description: 'e.g. Reeded, Plain' },
  { key: 'designer', label: 'Designer', required: false, description: 'Coin designer name' },
  {
    key: 'gallery_image_urls',
    label: 'Gallery Image URLs',
    required: false,
    description: 'Pipe-separated URLs: url1|url2|url3',
  },
]

const REQUIRED_KEYS = TEMPLATE_FIELDS.filter((f) => f.required).map((f) => f.key)
const TEMPLATE_HEADERS = TEMPLATE_FIELDS.map((f) => f.key)

// ── CSV utilities ─────────────────────────────────────────────────────────────

function buildCsvTemplate(): string {
  const header = TEMPLATE_HEADERS.join(',')
  const exampleRow = [
    'German Unity 2 Euro 2023',
    'Germany',
    '2023',
    '2 Euro',
    'Commemorative',
    'https://example.com/obverse.jpg',
    'https://example.com/reverse.jpg',
    'History',
    'DE-2023-001',
    'Short description here.',
    'Historical background here.',
    '6000000',
    'A',
    'Bimetallic',
    '8.5',
    '25.75',
    'Reeded',
    'Designer Name',
    'https://example.com/gallery1.jpg|https://example.com/gallery2.jpg',
  ].map((v) => (v.includes(',') ? `"${v}"` : v)).join(',')
  return `${header}\n${exampleRow}\n`
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const EXAMPLE_ROW: Record<string, string> = {
  title: 'German Unity 2 Euro 2023',
  country: 'Germany',
  year: '2023',
  denomination: '2 Euro',
  coin_type: 'Commemorative',
  obverse_image_url: 'https://example.com/obverse.jpg',
  reverse_image_url: 'https://example.com/reverse.jpg',
  theme: 'History',
  coin_code: 'DE-2023-001',
  short_description: 'Commemorating 33 years of German reunification.',
  historical_background: 'On October 3, 1990, East and West Germany were reunified...',
  mintage: '6000000',
  mint_mark: 'A',
  material: 'Bimetallic',
  weight: '8.5',
  diameter: '25.75',
  edge: 'Reeded with lettering',
  designer: 'Bodo Broschat',
  gallery_image_urls: 'https://example.com/g1.jpg|https://example.com/g2.jpg',
}

// ── XLSX builder helpers ──────────────────────────────────────────────────────

// Required fields get a "*" suffix in the header to visually distinguish them.
// Cell fill colors require SheetJS Pro; we use the naming convention instead.
const HEADER_ROW = TEMPLATE_FIELDS.map((f) => (f.required ? `${f.key} *` : f.key))

// Resolve column indices once so the formula references are always correct.
const _coinCodeCol  = TEMPLATE_FIELDS.findIndex((f) => f.key === 'coin_code')   // I (8)
const _countryCol   = TEMPLATE_FIELDS.findIndex((f) => f.key === 'country')     // B (1)
const _yearCol      = TEMPLATE_FIELDS.findIndex((f) => f.key === 'year')        // C (2)
const _denomCol     = TEMPLATE_FIELDS.findIndex((f) => f.key === 'denomination')// D (3)
const _coinTypeCol  = TEMPLATE_FIELDS.findIndex((f) => f.key === 'coin_type')   // E (4)

/** Convert 0-based column index to Excel letter (A, B, … Z, AA, …). */
function colLetter(idx: number): string {
  let s = ''
  let n = idx + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/** Build an Excel formula that auto-generates coin_code for a given Excel row number (1-indexed).
 *  Format: COUNTRY-YEAR-DENOMINATION-COINTYPE
 *  Mint marks are NOT included — they belong to the ACF mint repeater fields.
 */
function coinCodeFormula(excelRow: number): string {
  const C  = colLetter(_countryCol)
  const Y  = colLetter(_yearCol)
  const D  = colLetter(_denomCol)
  const CT = colLetter(_coinTypeCol)
  return `UPPER(SUBSTITUTE(${C}${excelRow}&"-"&${Y}${excelRow}&"-"&${D}${excelRow}&"-"&${CT}${excelRow}," ",""))`
}

function buildCoinsSheet(dataRows: Record<string, string>[]): ReturnType<typeof XLSX.utils.aoa_to_sheet> {
  const rows = dataRows.map((row, rowIdx) => {
    const excelRow = rowIdx + 2 // row 1 = header, data starts at row 2
    return TEMPLATE_FIELDS.map((f, colIdx) => {
      if (colIdx === _coinCodeCol) {
        // Formula cell: SheetJS aoa_to_sheet accepts { f, t } objects
        return { f: coinCodeFormula(excelRow), t: 's' }
      }
      return row[f.key] ?? ''
    })
  })

  const ws = XLSX.utils.aoa_to_sheet([HEADER_ROW, ...rows])

  ws['!cols'] = TEMPLATE_FIELDS.map((f, i) => {
    const maxDataLen = dataRows.reduce((m, r) => Math.max(m, (r[f.key] ?? '').length), 0)
    return { wch: Math.max(HEADER_ROW[i].length, maxDataLen, 12) + 2 }
  })
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  return ws
}

function buildNotesSheet(exampleRow: Record<string, string>): ReturnType<typeof XLSX.utils.aoa_to_sheet> {
  const data: string[][] = [
    ['Field', 'Required', 'Description', 'Example'],
    ...TEMPLATE_FIELDS.map((f) => [
      f.key,
      f.required ? 'Required *' : 'Optional',
      f.description,
      exampleRow[f.key] ?? '',
    ]),
    [],
    ['Notes', '', '', ''],
    ['* Required fields are marked with an asterisk (*) in the Coins Import sheet header.', '', '', ''],
    ['gallery_image_urls — separate multiple URLs with a pipe character: url1|url2|url3', '', '', ''],
    ['obverse_image_url / reverse_image_url — must be a full URL starting with https://', '', '', ''],
    ['year — 4-digit number between 1800 and 2100', '', '', ''],
    ['All imported rows are created as drafts — review and publish from the Admin Queue.', '', '', ''],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 60 }, { wch: 50 }]
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  return ws
}

function buildXlsxTemplate(): void {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildCoinsSheet([EXAMPLE_ROW]), 'Coins Import')
  XLSX.utils.book_append_sheet(wb, buildNotesSheet(EXAMPLE_ROW), 'Notes')
  XLSX.writeFile(wb, 'coinarchive-import-template.xlsx')
}

// ── German-only XLSX template ─────────────────────────────────────────────────

// ── German ACF Mint Variants repeater columns ─────────────────────────────────
// ACF select values use city names, not letter codes.
// Up to 5 mint variants per coin (mint_1 … mint_5).

type GermanMintExtra = { key: string; header: string }
const GERMAN_MINT_EXTRA_COLS: GermanMintExtra[] = [
  { key: 'mint_1_code',     header: 'mint_1_code'     },
  { key: 'mint_1_mintage',  header: 'mint_1_mintage'  },
  { key: 'mint_1_notes',    header: 'mint_1_notes'    },
  { key: 'mint_2_code',     header: 'mint_2_code'     },
  { key: 'mint_2_mintage',  header: 'mint_2_mintage'  },
  { key: 'mint_2_notes',    header: 'mint_2_notes'    },
  { key: 'mint_3_code',     header: 'mint_3_code'     },
  { key: 'mint_3_mintage',  header: 'mint_3_mintage'  },
  { key: 'mint_3_notes',    header: 'mint_3_notes'    },
  { key: 'mint_4_code',     header: 'mint_4_code'     },
  { key: 'mint_4_mintage',  header: 'mint_4_mintage'  },
  { key: 'mint_4_notes',    header: 'mint_4_notes'    },
  { key: 'mint_5_code',     header: 'mint_5_code'     },
  { key: 'mint_5_mintage',  header: 'mint_5_mintage'  },
  { key: 'mint_5_notes',    header: 'mint_5_notes'    },
]

// One row per coin — mint variants go into the structured repeater columns, NOT into mint_mark.
const GERMAN_MINT_ROWS: Record<string, string>[] = [
  {
    // All-five-mints example — German Reunification 2 Euro 2023
    title: 'German Reunification 2 Euro 2023',
    country: 'Germany',
    year: '2023',
    denomination: '2 Euro',
    coin_type: 'Commemorative',
    mint_mark: '',   // leave empty when using mint_N_code repeater columns
    theme: 'History',
    short_description: 'Commemorating 33 years of German reunification.',
    historical_background: 'On October 3, 1990, East and West Germany were officially reunified. The coin was struck at all five German federal mints.',
    mintage: '6000000',
    material: 'Bimetallic',
    weight: '8.5',
    diameter: '25.75',
    edge: 'Reeded with lettering',
    designer: 'Bodo Broschat',
    obverse_image_url: 'https://example.com/de-2023-reunification-obverse.jpg',
    reverse_image_url: 'https://example.com/de-2023-reunification-reverse.jpg',
    gallery_image_urls: 'https://example.com/de-2023-g1.jpg|https://example.com/de-2023-g2.jpg',
    // ACF Mint Variants repeater — city names match ACF select values
    mint_1_code: 'Berlin',    mint_1_mintage: '1200000', mint_1_notes: 'Berlin mint (A)',
    mint_2_code: 'Munich',    mint_2_mintage: '1200000', mint_2_notes: 'Munich mint (D)',
    mint_3_code: 'Stuttgart', mint_3_mintage: '1200000', mint_3_notes: 'Stuttgart mint (F)',
    mint_4_code: 'Karlsruhe', mint_4_mintage: '1200000', mint_4_notes: 'Karlsruhe mint (G)',
    mint_5_code: 'Hamburg',   mint_5_mintage: '1200000', mint_5_notes: 'Hamburg mint (J)',
  },
  {
    // Single-mint example — Hamburg Bundesländer 2023
    title: 'Hamburg Port 2 Euro 2023',
    country: 'Germany',
    year: '2023',
    denomination: '2 Euro',
    coin_type: 'Commemorative',
    mint_mark: '',
    theme: 'Federal States',
    short_description: 'Bundesländer series — Hamburg. Issued exclusively at Hamburgische Münze.',
    historical_background: 'Hamburg is Germany\'s second-largest city and a major international port. The Hamburgische Münze has been producing coins since the 19th century.',
    mintage: '1200000',
    material: 'Bimetallic',
    weight: '8.5',
    diameter: '25.75',
    edge: 'Reeded with lettering',
    designer: 'Klaus Lindner',
    obverse_image_url: 'https://example.com/de-2023-hamburg-obverse.jpg',
    reverse_image_url: 'https://example.com/de-2023-hamburg-reverse.jpg',
    gallery_image_urls: 'https://example.com/de-2023-hamburg-g1.jpg',
    // Only one mint variant
    mint_1_code: 'Hamburg',   mint_1_mintage: '1200000', mint_1_notes: 'Hamburg mint (J)',
    mint_2_code: '', mint_2_mintage: '', mint_2_notes: '',
    mint_3_code: '', mint_3_mintage: '', mint_3_notes: '',
    mint_4_code: '', mint_4_mintage: '', mint_4_notes: '',
    mint_5_code: '', mint_5_mintage: '', mint_5_notes: '',
  },
]

// Builds the Coins Import sheet for the German template, appending the
// mint_N repeater columns after the standard TEMPLATE_FIELDS columns.
function buildGermanCoinsSheet(): ReturnType<typeof XLSX.utils.aoa_to_sheet> {
  const extraHeaders = GERMAN_MINT_EXTRA_COLS.map((c) => c.header)
  const fullHeaderRow = [...HEADER_ROW, ...extraHeaders]

  const rows = GERMAN_MINT_ROWS.map((row, rowIdx) => {
    const excelRow = rowIdx + 2
    const standardCells = TEMPLATE_FIELDS.map((f, colIdx) => {
      if (colIdx === _coinCodeCol) {
        return { f: coinCodeFormula(excelRow), t: 's' }
      }
      return row[f.key] ?? ''
    })
    const extraCells = GERMAN_MINT_EXTRA_COLS.map((c) => row[c.key] ?? '')
    return [...standardCells, ...extraCells]
  })

  const ws = XLSX.utils.aoa_to_sheet([fullHeaderRow, ...rows])

  const standardWidths = TEMPLATE_FIELDS.map((f, i) => {
    const maxDataLen = GERMAN_MINT_ROWS.reduce((m, r) => Math.max(m, (r[f.key] ?? '').length), 0)
    return { wch: Math.max(HEADER_ROW[i].length, maxDataLen, 12) + 2 }
  })
  const extraWidths = GERMAN_MINT_EXTRA_COLS.map((c) => {
    const maxDataLen = GERMAN_MINT_ROWS.reduce((m, r) => Math.max(m, (r[c.key] ?? '').length), 0)
    return { wch: Math.max(c.header.length, maxDataLen, 14) + 2 }
  })
  ws['!cols'] = [...standardWidths, ...extraWidths]
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  return ws
}

const GERMAN_MINTS_TABLE: string[][] = [
  ['ACF Select Value', 'Mint Letter', 'Mint Name', 'City'],
  ['Berlin',    'A', 'Staatliche Münze Berlin',              'Berlin'   ],
  ['Munich',    'D', 'Bayerisches Hauptmünzamt',             'München'  ],
  ['Stuttgart', 'F', 'Staatliche Münzen Baden-Württemberg',  'Stuttgart'],
  ['Karlsruhe', 'G', 'Staatliche Münzen Baden-Württemberg',  'Karlsruhe'],
  ['Hamburg',   'J', 'Hamburgische Münze',                   'Hamburg'  ],
  [],
  ['Column usage in Coins Import sheet', '', '', ''],
  ['mint_1_code — mint_5_code',     'ACF select value (city name)',  '', ''],
  ['mint_1_mintage — mint_5_mintage','Mintage for this specific mint','', ''],
  ['mint_1_notes — mint_5_notes',   'Optional notes (e.g. Berlin mint (A))','',''],
  [],
  ['Rules', '', '', ''],
  ['One Excel row = one coin post. Do NOT create one row per mint.', '', '', ''],
  ['Use mint_1 … mint_5 for up to 5 variants. Leave unused slots empty.', '', '', ''],
  ['mint_mark column should be left empty when using repeater columns.', '', '', ''],
  ['coin_code must NOT include mint information.', '', '', ''],
]

function buildXlsxGermanTemplate(): void {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildGermanCoinsSheet(), 'Coins Import')

  const wsMints = XLSX.utils.aoa_to_sheet(GERMAN_MINTS_TABLE)
  wsMints['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 40 }, { wch: 14 }]
  wsMints['!freeze'] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(wb, wsMints, 'German Mints')

  XLSX.utils.book_append_sheet(wb, buildNotesSheet(GERMAN_MINT_ROWS[0]), 'Notes')

  XLSX.writeFile(wb, 'coinarchive-import-template-germany.xlsx')
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM from start of file
  const cleaned = text.replace(/^\uFEFF/, '')
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const rawHeaders = parseCsvLine(lines[0]).map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const raw: Record<string, string> = {}
    rawHeaders.forEach((h, idx) => {
      raw[h] = (values[idx] ?? '').trim()
    })
    rows.push(normalizeImportRow(raw))
  }

  // Return normalised headers so missing-column check works
  const headers = rows.length > 0 ? Object.keys(rows[0]) : rawHeaders.map(normalizeHeaderKey)
  return { headers, rows }
}

// ── Row normalisation ─────────────────────────────────────────────────────────

// Maps common human-readable or Excel display-name aliases → exact backend keys.
// Also handles BOM, extra whitespace, and case differences.
const KEY_ALIASES: Record<string, string> = {
  // Image URLs — most likely to arrive with display names from third-party sheets
  'obverse image url': 'obverse_image_url',
  'obverse image': 'obverse_image_url',
  'obverse url': 'obverse_image_url',
  'reverse image url': 'reverse_image_url',
  'reverse image': 'reverse_image_url',
  'reverse url': 'reverse_image_url',
  'gallery image urls': 'gallery_image_urls',
  'gallery images': 'gallery_image_urls',
  'gallery urls': 'gallery_image_urls',
  // Core identity fields
  'coin type': 'coin_type',
  'cointype': 'coin_type',
  'coin code': 'coin_code',
  'coincode': 'coin_code',
  'mint mark': 'mint_mark',
  'mintmark': 'mint_mark',
  // Description fields
  'short description': 'short_description',
  'historical background': 'historical_background',
  'historicalbackground': 'historical_background',
  // Spec fields
  'weight (g)': 'weight',
  'weight g': 'weight',
  'diameter (mm)': 'diameter',
  'diameter mm': 'diameter',
  // Catchall: replace spaces/dashes with underscores after lowercasing
}

function normalizeHeaderKey(raw: string): string {
  // Strip BOM, leading/trailing whitespace, and the " *" required marker
  const cleaned = raw
    .replace(/^\uFEFF/, '')   // BOM
    .replace(/\s*\*$/, '')    // trailing asterisk from template
    .trim()
    .toLowerCase()

  if (KEY_ALIASES[cleaned]) return KEY_ALIASES[cleaned]

  // Generic fallback: spaces/hyphens → underscores
  return cleaned.replace(/[\s-]+/g, '_')
}

function normalizeImportRow(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(row)) {
    out[normalizeHeaderKey(k)] = String(v ?? '').trim()
  }
  return out
}

// ── Validation ────────────────────────────────────────────────────────────────

type RowError = { field: string; message: string }

type ParsedRow = {
  index: number
  data: Record<string, string>
  errors: RowError[]
}

function validateRow(
  data: Record<string, string>,
  index: number,
  coinCodes: Map<string, number>,
): RowError[] {
  const errors: RowError[] = []

  // Missing required fields
  for (const key of REQUIRED_KEYS) {
    if (!data[key]?.trim()) {
      const field = TEMPLATE_FIELDS.find((f) => f.key === key)
      errors.push({ field: key, message: `${field?.label ?? key} is required.` })
    }
  }

  // Year validation
  const year = data['year']?.trim()
  if (year) {
    const yearNum = Number(year)
    if (!/^\d{4}$/.test(year) || yearNum < 1800 || yearNum > 2100) {
      errors.push({ field: 'year', message: 'Year must be a 4-digit number between 1800 and 2100.' })
    }
  }

  // URL validation (basic)
  for (const key of ['obverse_image_url', 'reverse_image_url']) {
    const url = data[key]?.trim()
    if (url && !url.startsWith('http')) {
      errors.push({ field: key, message: `${key.replace('_url', '').replace('_', ' ')} must be a valid URL starting with http.` })
    }
  }

  // Duplicate coin_code within file
  const coinCode = data['coin_code']?.trim()
  if (coinCode) {
    const firstOccurrence = coinCodes.get(coinCode)
    if (firstOccurrence !== undefined && firstOccurrence !== index) {
      errors.push({ field: 'coin_code', message: `Duplicate coin_code "${coinCode}" (first seen at row ${firstOccurrence + 1}).` })
    }
  }

  return errors
}

function validateRows(rows: Record<string, string>[]): ParsedRow[] {
  // Build coin_code → first occurrence map
  const coinCodes = new Map<string, number>()
  rows.forEach((row, i) => {
    const code = row['coin_code']?.trim()
    if (code && !coinCodes.has(code)) {
      coinCodes.set(code, i)
    }
  })

  return rows.map((data, i) => ({
    index: i,
    data,
    errors: validateRow(data, i, coinCodes),
  }))
}

// ── Step card component ───────────────────────────────────────────────────────

function StepCard({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-[#F9FAFB] px-5 py-3.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[11px] font-bold text-white">
          {step}
        </span>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

// ── Upload zone ───────────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  file,
  onClear,
}: {
  onFile: (file: File) => void
  file: File | null
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped && /\.(csv|xlsx)$/i.test(dropped.name)) {
        onFile(dropped)
      }
    },
    [onFile],
  )

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <FileText className="h-5 w-5 shrink-0 text-teal-500" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-teal-800">{file.name}</p>
            <p className="text-[11px] text-teal-600">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          title="Remove file"
          className="rounded-lg p-1 text-teal-400 transition-colors hover:bg-teal-100 hover:text-teal-600"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      className={[
        'flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
        isDragOver
          ? 'border-teal-400 bg-teal-50'
          : 'border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/40',
      ].join(' ')}
    >
      <Upload className={['h-8 w-8', isDragOver ? 'text-teal-400' : 'text-slate-300'].join(' ')} aria-hidden />
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Drag & drop your file here
        </p>
        <p className="mt-0.5 text-xs text-slate-400">or click to browse — CSV or XLSX</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── Preview table ─────────────────────────────────────────────────────────────

const PREVIEW_COLS: Array<keyof Record<string, string>> = [
  'title', 'country', 'year', 'denomination', 'coin_type',
  'coin_code', 'obverse_image_url', 'reverse_image_url',
]

function PreviewTable({ rows }: { rows: ParsedRow[] }) {
  const validCount = rows.filter((r) => r.errors.length === 0).length
  const invalidCount = rows.length - validCount

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-teal-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {validCount} valid row{validCount === 1 ? '' : 's'}
        </span>
        {invalidCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-red-600">
            <AlertCircle className="h-4 w-4" aria-hidden />
            {invalidCount} row{invalidCount === 1 ? '' : 's'} with errors
          </span>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[rgba(15,23,42,0.08)]">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F9FAFB]">
              <th className="py-2 pl-3 pr-2 font-semibold uppercase tracking-widest text-slate-400">#</th>
              {PREVIEW_COLS.map((col) => (
                <th key={col} className="py-2 pr-3 font-semibold uppercase tracking-widest text-slate-400">
                  {col.replace(/_url$/, '').replace(/_/g, ' ')}
                </th>
              ))}
              <th className="py-2 pr-3 font-semibold uppercase tracking-widest text-slate-400">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(15,23,42,0.05)]">
            {rows.map((row) => {
              const hasError = row.errors.length > 0
              return (
                <tr
                  key={row.index}
                  className={hasError ? 'bg-red-50' : 'bg-white hover:bg-slate-50/60'}
                >
                  <td className="py-2 pl-3 pr-2 text-slate-400">{row.index + 1}</td>
                  {PREVIEW_COLS.map((col) => {
                    const fieldError = row.errors.find((e) => e.field === col)
                    const value = row.data[col] ?? ''
                    return (
                      <td key={col} className="max-w-[180px] py-2 pr-3 align-top">
                        {fieldError ? (
                          <span className="font-medium text-red-600" title={fieldError.message}>
                            {value || <em className="opacity-60">empty</em>}
                          </span>
                        ) : (
                          <span className="truncate text-slate-700" title={value}>
                            {value.length > 40 ? `${value.slice(0, 40)}…` : value || (
                              <span className="text-slate-300">—</span>
                            )}
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="py-2 pr-3 align-top">
                    {row.errors.length > 0 ? (
                      <ul className="space-y-0.5">
                        {row.errors.map((err, i) => (
                          <li key={i} className="text-red-600">{err.message}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-teal-500">✓</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Import result summary ─────────────────────────────────────────────────────

function ImageFlag({ ok, label }: { ok: boolean | undefined; label: string }) {
  if (ok === undefined) return <span className="text-slate-300" title={label}>—</span>
  return ok
    ? <span className="font-semibold text-teal-600" title={`${label}: imported`}>✓</span>
    : <span className="font-semibold text-red-500" title={`${label}: not imported`}>✗</span>
}

function ImportResultCard({
  result,
  parsedRows,
  onReset,
}: {
  result: ImportAdminCoinsResponse
  parsedRows: ParsedRow[]
  onReset: () => void
}) {
  const rows = result.results ?? []

  // Detect any image issues across all created rows
  const rowsWithImageIssues = rows.filter(
    (r) => r.status === 'created' && (
      r.obverse_imported === false ||
      r.reverse_imported === false ||
      (r.image_errors && r.image_errors.length > 0)
    ),
  )
  const hasImageWarnings = rowsWithImageIssues.length > 0
  const hasImageData = rows.some(
    (r) => r.obverse_imported !== undefined || r.reverse_imported !== undefined || r.gallery_imported !== undefined,
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 bg-[#F9FAFB] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-slate-800">Import complete</h2>
      </div>
      <div className="space-y-4 px-5 py-5">

        {/* Summary tiles */}
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-teal-600">{result.summary.created}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-teal-500">Created</p>
          </div>
          {result.summary.failed > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-500">{result.summary.failed}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-red-400">Failed</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-slate-600">{result.summary.total}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Total sent</p>
          </div>
        </div>

        {result.batch_id ? (
          <p className="text-[11px] text-slate-400">
            Batch ID: <span className="font-mono">{result.batch_id}</span>
          </p>
        ) : null}

        {/* Image warning banner */}
        {hasImageWarnings ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            <div>
              <p className="font-semibold">
                {rowsWithImageIssues.length} row{rowsWithImageIssues.length === 1 ? '' : 's'} with image import issues
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Submissions were created but some images could not be imported. Review the table below and re-upload images manually via the admin queue.
              </p>
            </div>
          </div>
        ) : null}

        {/* Per-row results table */}
        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[rgba(15,23,42,0.07)]">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F9FAFB]">
                  <th className="py-2 pl-3 pr-2 font-semibold uppercase tracking-widest text-slate-400">#</th>
                  <th className="py-2 pr-3 font-semibold uppercase tracking-widest text-slate-400">Title</th>
                  <th className="py-2 pr-3 font-semibold uppercase tracking-widest text-slate-400">Status</th>
                  {hasImageData ? (
                    <>
                      <th className="py-2 pr-3 font-semibold uppercase tracking-widest text-slate-400">Obverse</th>
                      <th className="py-2 pr-3 font-semibold uppercase tracking-widest text-slate-400">Reverse</th>
                      <th className="py-2 pr-3 font-semibold uppercase tracking-widest text-slate-400">Gallery</th>
                    </>
                  ) : null}
                  <th className="py-2 pr-3 font-semibold uppercase tracking-widest text-slate-400">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(15,23,42,0.05)]">
                {rows.map((r) => {
                  const original = parsedRows.find((p) => p.index === r.row_index)
                  const title = original?.data['title'] || `Row ${r.row_index + 1}`
                  const isFailed = r.status === 'failed'
                  const hasImgErr = (r.image_errors?.length ?? 0) > 0
                  const rowHasIssue = isFailed || r.obverse_imported === false || r.reverse_imported === false || hasImgErr

                  return (
                    <tr
                      key={r.row_index}
                      className={rowHasIssue ? 'bg-amber-50/60' : 'bg-white hover:bg-slate-50/50'}
                    >
                      <td className="py-2 pl-3 pr-2 text-slate-400">{r.row_index + 1}</td>
                      <td className="max-w-[200px] py-2 pr-3">
                        <span className="truncate font-medium text-slate-700" title={title}>
                          {title.length > 40 ? `${title.slice(0, 40)}…` : title}
                        </span>
                        {r.submission_id ? (
                          <span className="ml-1.5 text-slate-400">#{r.submission_id}</span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-3">
                        {isFailed ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-200">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-200">
                            Created
                          </span>
                        )}
                      </td>
                      {hasImageData ? (
                        <>
                          <td className="py-2 pr-3 text-center">
                            <ImageFlag ok={r.obverse_imported} label="Obverse" />
                          </td>
                          <td className="py-2 pr-3 text-center">
                            <ImageFlag ok={r.reverse_imported} label="Reverse" />
                          </td>
                          <td className="py-2 pr-3">
                            {r.gallery_imported !== undefined ? (
                              <span className={r.gallery_imported > 0 ? 'text-teal-600' : 'text-slate-400'}>
                                {r.gallery_imported}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </>
                      ) : null}
                      <td className="py-2 pr-3 align-top">
                        {isFailed && r.message ? (
                          <span className="text-red-600">{r.message}</span>
                        ) : null}
                        {!isFailed && hasImgErr ? (
                          <ul className="space-y-0.5">
                            {r.image_errors!.map((e, i) => (
                              <li key={i} className="text-amber-700">{e}</li>
                            ))}
                          </ul>
                        ) : null}
                        {!isFailed && !hasImgErr && r.obverse_imported === false ? (
                          <span className="text-amber-700">Obverse image not imported.</span>
                        ) : null}
                        {!isFailed && !hasImgErr && r.reverse_imported === false ? (
                          <span className="text-amber-700 ml-1">Reverse image not imported.</span>
                        ) : null}
                        {!rowHasIssue ? <span className="text-slate-300">—</span> : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/submissions"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-600"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            View admin queue
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Import another file
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  const [isParsingXlsx] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportAdminCoinsResponse | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleFile(selected: File) {
    setFile(selected)
    setParseError(null)
    setMissingColumns([])
    setParsedRows(null)

    const isXlsx = /\.(xlsx|xls)$/i.test(selected.name)
    const reader = new FileReader()

    reader.onerror = () => setParseError('Failed to read the file.')

    if (isXlsx) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const wb = XLSX.read(data, { type: 'array' })
          const sheetName = wb.SheetNames[0]
          if (!sheetName) {
            setParseError('XLSX file has no sheets.')
            return
          }
          const ws = wb.Sheets[sheetName]
          // Convert to array of objects; strip the " *" suffix from required headers
          const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
            defval: '',
            raw: false,
          })
          if (rawRows.length === 0) {
            setParseError('The XLSX sheet appears to be empty or has no data rows.')
            return
          }
          // Normalise all header keys (strips " *", BOM, maps aliases → backend keys)
          const normalised = rawRows.map(normalizeImportRow)
          const headers = Object.keys(normalised[0] ?? {})
          const missing = REQUIRED_KEYS.filter((k) => !headers.includes(k))
          if (missing.length > 0) setMissingColumns(missing)
          setParsedRows(validateRows(normalised))
        } catch {
          setParseError('Could not parse the XLSX file. Make sure it is a valid Excel workbook.')
        }
      }
      reader.readAsArrayBuffer(selected)
    } else {
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (!text) { setParseError('Could not read the file.'); return }
        const { headers, rows } = parseCsvText(text)
        if (headers.length === 0) {
          setParseError('The CSV file appears to be empty or has no header row.')
          return
        }
        const missing = REQUIRED_KEYS.filter((k) => !headers.includes(k))
        if (missing.length > 0) setMissingColumns(missing)
        setParsedRows(validateRows(rows))
      }
      reader.readAsText(selected)
    }
  }

  function handleClear() {
    setFile(null)
    setParsedRows(null)
    setParseError(null)
    setMissingColumns([])
    setImportError(null)
    setImportResult(null)
    setShowConfirm(false)
  }

  async function handleImport() {
    if (!parsedRows) return
    const token = getAuthToken()
    if (!token) {
      setImportError('Admin session expired or not authorized. Please log out and log in again.')
      return
    }

    const validRows: ImportCoinRow[] = parsedRows
      .filter((r) => r.errors.length === 0)
      .map((r) => r.data)

    if (validRows.length === 0) return

    if (import.meta.env.DEV && validRows[0]) {
      console.info('[import] first valid row payload', validRows[0])
      const imageKeys = ['obverse_image_url', 'reverse_image_url', 'gallery_image_urls']
      const missing = imageKeys.filter((k) => !validRows[0][k])
      if (missing.length) {
        console.warn('[import] image keys missing from first row:', missing)
      }
    }

    setIsImporting(true)
    setImportError(null)
    setShowConfirm(false)

    try {
      const result = await importAdminCoins(validRows, token)
      setImportResult(result)
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : 'Import failed. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const validRowCount = parsedRows?.filter((r) => r.errors.length === 0).length ?? 0
  const hasValidRows = validRowCount > 0
  const totalRows = parsedRows?.length ?? 0

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 pb-12">

      {/* ── Header ── */}
      <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-500">
          Administration
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-slate-800 sm:text-3xl">
          Bulk import coins
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Upload CSV files to create coin drafts quickly. Download the template, fill in your data, then upload.
        </p>
      </div>

      {/* ── Step 1: Download template ── */}
      <StepCard step={1} title="Download template">
        <p className="mb-4 text-sm text-slate-500">
          Use the official template to ensure all required fields are in the correct format.
        </p>

        <div className="mb-5 overflow-hidden rounded-xl border border-[rgba(15,23,42,0.06)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="py-2 pl-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Field</th>
                <th className="py-2 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Required</th>
                <th className="py-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,23,42,0.05)]">
              {TEMPLATE_FIELDS.map((field) => (
                <tr key={field.key} className="hover:bg-slate-50/60">
                  <td className="py-1.5 pl-3 pr-2 font-mono text-slate-700">{field.key}</td>
                  <td className="py-1.5 pr-2">
                    {field.required ? (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-200">
                        Required
                      </span>
                    ) : (
                      <span className="text-slate-400">Optional</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-slate-500">{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          {/* XLSX buttons grouped */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => buildXlsxTemplate()}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-600"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden />
                Download Standard XLSX template
              </button>
              <button
                type="button"
                onClick={() => buildXlsxGermanTemplate()}
                className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 shadow-sm transition-colors hover:bg-teal-100"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden />
                Download German-only XLSX template
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Use the German-only template when importing German coins with mint marks.
            </p>
          </div>

          {/* CSV fallback */}
          <button
            type="button"
            onClick={() => downloadCsv(buildCsvTemplate(), 'coinarchive-import-template.csv')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download CSV template
          </button>
        </div>
      </StepCard>

      {/* ── Step 2: Upload ── */}
      <StepCard step={2} title="Upload CSV file">
        <p className="mb-4 text-sm text-slate-500">
          Upload your completed CSV or XLSX file. The first sheet will be parsed automatically.
        </p>

        <UploadZone onFile={handleFile} file={file} onClear={handleClear} />

        {parseError ? (
          <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {parseError}
          </div>
        ) : null}

        {missingColumns.length > 0 ? (
          <div role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Missing required columns in file:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs font-mono">
              {missingColumns.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">Make sure your CSV headers match the template exactly.</p>
          </div>
        ) : null}

        {isParsingXlsx ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-teal-400" />
            Parsing file…
          </div>
        ) : null}
      </StepCard>

      {/* ── Step 3: Preview & validate ── */}
      {parsedRows !== null && !parseError ? (
        <StepCard step={3} title="Preview & validate">
          {parsedRows.length === 0 ? (
            <p className="text-sm text-slate-400">No data rows found. Check your CSV file.</p>
          ) : (
            <PreviewTable rows={parsedRows} />
          )}
        </StepCard>
      ) : null}

      {/* ── Step 4: Import ── */}
      {!importResult ? (
        <StepCard step={4} title="Import as drafts">
          <p className="text-sm text-slate-500">
            Only valid rows will be sent. Invalid rows are skipped. Coin drafts will be created in the admin queue.
          </p>

          {parsedRows !== null && !parseError ? (
            <p className="mt-2 text-sm">
              <span className="font-semibold text-teal-700">{validRowCount}</span>
              {' '}of{' '}
              <span className="font-semibold text-slate-700">{totalRows}</span>
              {' '}rows ready to import.
              {totalRows - validRowCount > 0 ? (
                <span className="ml-1.5 text-red-500">
                  {totalRows - validRowCount} row{totalRows - validRowCount === 1 ? '' : 's'} with errors will be skipped.
                </span>
              ) : null}
            </p>
          ) : null}

          {/* Image sideloading notice */}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Image URLs are stored for review. Image sideloading will be added in the next phase.
          </div>

          {importError ? (
            <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {importError}
            </div>
          ) : null}

          {/* Confirm inline prompt */}
          {showConfirm && !isImporting ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                Import {validRowCount} valid row{validRowCount === 1 ? '' : 's'} as draft submissions?
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Invalid rows will not be sent. This action cannot be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-600"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                  Confirm import
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {!showConfirm ? (
            <div className="mt-4">
              <button
                type="button"
                disabled={!hasValidRows || isImporting || !!parseError}
                onClick={() => setShowConfirm(true)}
                className={[
                  'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors',
                  hasValidRows && !parseError
                    ? 'bg-teal-500 text-white hover:bg-teal-600'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400',
                ].join(' ')}
              >
                <Upload className="h-4 w-4" aria-hidden />
                {isImporting
                  ? 'Importing…'
                  : hasValidRows
                    ? `Import ${validRowCount} valid row${validRowCount === 1 ? '' : 's'} as draft${validRowCount === 1 ? '' : 's'}`
                    : 'Import valid rows as drafts'}
              </button>
            </div>
          ) : null}
        </StepCard>
      ) : null}

      {/* ── Import result ── */}
      {importResult ? (
        <ImportResultCard
          result={importResult}
          parsedRows={parsedRows ?? []}
          onReset={handleClear}
        />
      ) : null}
    </div>
  )
}
