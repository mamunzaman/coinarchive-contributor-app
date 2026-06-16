import type { Editor } from '@tiptap/core'

export function sanitizeRichTextValue(value: string | null | undefined): string {
  return value ?? ''
}

export function normalizeRichTextHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) {
    return ''
  }

  const emptyPatterns = new Set([
    '<p></p>',
    '<p><br></p>',
    '<p><br/></p>',
    '<p><br class="ProseMirror-trailingBreak"></p>',
  ])

  if (emptyPatterns.has(trimmed)) {
    return ''
  }

  if (typeof document !== 'undefined') {
    const el = document.createElement('div')
    el.innerHTML = trimmed
    const text = el.textContent?.replace(/\u00a0/g, ' ').trim() ?? ''
    if (!text) {
      return ''
    }
  }

  return trimmed
}

function isEditorReady(editor: Editor | null): editor is Editor {
  if (!editor || editor.isDestroyed) {
    return false
  }

  try {
    return Boolean(editor.schema)
  } catch {
    return false
  }
}

export function safeGetEditorHtml(editor: Editor | null, fallback = ''): string {
  if (!isEditorReady(editor)) {
    return fallback
  }

  try {
    return normalizeRichTextHtml(editor.getHTML())
  } catch {
    return fallback
  }
}
