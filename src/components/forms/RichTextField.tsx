import { useEffect, type ReactNode } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
} from 'lucide-react'
import { FieldLabelWithHelp } from '../ui/FieldHelpTooltip'

type RichTextFieldProps = {
  label: string
  name?: string
  value: string
  onChange: (html: string) => void
  hint?: string
  helpTooltip?: string
  error?: string
  attention?: string
  placeholder?: string
  disabled?: boolean
  id?: string
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

type ToolbarButtonProps = {
  label: string
  isActive?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolbarButton({
  label,
  isActive = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-white',
        isActive
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-transparent bg-transparent text-navy-muted hover:text-navy',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function RichTextField({
  label,
  name,
  value,
  onChange,
  hint,
  helpTooltip,
  error,
  attention,
  placeholder,
  disabled = false,
  id,
}: RichTextFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined
  const attentionId = !error && attention ? `${fieldId}-attention` : undefined
  const describedBy = [errorId, attentionId].filter(Boolean).join(' ')

  const editorAttributes: Record<string, string> = {
    class: 'rich-text-editor__content',
    'aria-labelledby': `${fieldId}-label`,
    'data-placeholder': placeholder ?? '',
  }

  if (describedBy) {
    editorAttributes['aria-describedby'] = describedBy
  }

  if (error) {
    editorAttributes['aria-invalid'] = 'true'
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: editorAttributes,
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(normalizeRichTextHtml(currentEditor.getHTML()))
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.setEditable(!disabled)
  }, [editor, disabled])

  useEffect(() => {
    if (!editor) {
      return
    }

    const current = normalizeRichTextHtml(editor.getHTML())
    const next = normalizeRichTextHtml(value)

    if (current !== next) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  function handleSetLink() {
    if (!editor || disabled) {
      return
    }

    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previousUrl || 'https://')

    if (url === null) {
      return
    }

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  function handleClearFormatting() {
    if (!editor || disabled) {
      return
    }

    editor.chain().focus().clearNodes().unsetAllMarks().run()
    onChange(normalizeRichTextHtml(editor.getHTML()))
  }

  const shellClass = [
    'rich-text-editor field-control overflow-hidden p-0',
    error ? 'field-control--error' : attention ? 'field-control--attention' : '',
    disabled ? 'opacity-100' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col gap-2">
      <span id={`${fieldId}-label`}>
        <FieldLabelWithHelp htmlFor={fieldId} label={label} helpText={helpTooltip} />
      </span>

      <div className={shellClass}>
        <div
          role="toolbar"
          aria-label={`${label} formatting`}
          className="flex flex-wrap gap-1 border-b border-border/60 bg-white/80 px-2 py-2"
        >
          <ToolbarButton
            label="Bold"
            isActive={editor?.isActive('bold') ?? false}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            isActive={editor?.isActive('italic') ?? false}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            isActive={editor?.isActive('bulletList') ?? false}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Ordered list"
            isActive={editor?.isActive('orderedList') ?? false}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            isActive={editor?.isActive('link') ?? false}
            disabled={disabled || !editor}
            onClick={handleSetLink}
          >
            <Link2 className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Clear formatting"
            disabled={disabled || !editor}
            onClick={handleClearFormatting}
          >
            <RemoveFormatting className="h-4 w-4" aria-hidden />
          </ToolbarButton>
        </div>

        <EditorContent id={fieldId} editor={editor} />
      </div>

      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      {error ? (
        <p id={errorId} role="alert" className="field-message field-message--error">
          {error}
        </p>
      ) : null}
      {!error && attention ? (
        <p id={attentionId} className="field-message field-message--attention">
          {attention}
        </p>
      ) : null}
      {!error && !attention && hint ? (
        <p className="field-message field-message--hint">{hint}</p>
      ) : null}
    </div>
  )
}
