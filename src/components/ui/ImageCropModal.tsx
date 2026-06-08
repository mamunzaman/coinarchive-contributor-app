import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Cropper,
  CropperPreview,
  type CropperPreviewRef,
  type CropperRef,
  ImageRestriction,
} from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import {
  Maximize2,
  RotateCcw,
  RotateCw,
  Square,
  Scan,
} from 'lucide-react'
import { Button } from './Button'
import { canvasToFile, formatFileSize, getOutputMimeType } from '../../lib/imageCropUtils'

type AspectMode = 'square' | 'free'

type ImageCropModalProps = {
  open: boolean
  file: File | null
  title?: string
  onClose: () => void
  onSave: (file: File) => void
}

export function ImageCropModal({
  open,
  file,
  title = 'Adjust image',
  onClose,
  onSave,
}: ImageCropModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const cropperRef = useRef<CropperRef>(null)
  const previewRef = useRef<CropperPreviewRef>(null)
  const zoomRef = useRef(1)

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspectMode, setAspectMode] = useState<AspectMode>('square')
  const [outputSize, setOutputSize] = useState<{ width: number; height: number } | null>(null)
  const [cropperReady, setCropperReady] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file || !open) {
      setImageUrl(null)
      setOutputSize(null)
      setCropperReady(false)
      return
    }

    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setZoom(1)
    zoomRef.current = 1
    setRotation(0)
    setAspectMode('square')
    setError(null)
    setCropperReady(false)

    return () => URL.revokeObjectURL(url)
  }, [file, open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleUpdate = useCallback((cropper: CropperRef) => {
    previewRef.current?.update(cropper)

    const coordinates = cropper.getCoordinates()
    if (coordinates) {
      setOutputSize({
        width: Math.round(coordinates.width),
        height: Math.round(coordinates.height),
      })
    }

    const transforms = cropper.getTransforms()
    if (typeof transforms.rotate === 'number') {
      setRotation(Math.round(transforms.rotate))
    }
  }, [])

  function handleZoomChange(value: number) {
    const cropper = cropperRef.current
    if (!cropper) {
      setZoom(value)
      zoomRef.current = value
      return
    }

    const factor = value / zoomRef.current
    cropper.zoomImage(factor, { immediately: true, transitions: false })
    zoomRef.current = value
    setZoom(value)
  }

  function handleRotationChange(value: number) {
    const cropper = cropperRef.current
    if (!cropper) {
      setRotation(value)
      return
    }

    const current = cropper.getTransforms().rotate ?? 0
    cropper.rotateImage(value - current, { immediately: true, transitions: false })
    setRotation(value)
  }

  function handleReset() {
    cropperRef.current?.reset()
    setZoom(1)
    zoomRef.current = 1
    setRotation(0)
  }

  function handleFitImage() {
    handleReset()
  }

  function handleRotateBy(delta: number) {
    const cropper = cropperRef.current
    if (!cropper) {
      setRotation((value) => value + delta)
      return
    }

    cropper.rotateImage(delta, { immediately: true, transitions: true })
    setRotation((value) => value + delta)
  }

  async function handleSave() {
    if (!file || !cropperRef.current) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const canvas = cropperRef.current.getCanvas()
      if (!canvas) {
        throw new Error('Crop failed.')
      }

      const mimeType = getOutputMimeType(file)
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const cropped = await canvasToFile(canvas, `${baseName}-cropped.${extension}`, mimeType)
      onSave(cropped)
      onClose()
    } catch {
      setError('Unable to save cropped image. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open || !file) {
    return null
  }

  const outputLabel = outputSize
    ? `${outputSize.width} × ${outputSize.height} px`
    : 'Adjust crop to preview output'

  const stencilProps =
    aspectMode === 'square'
      ? {
          aspectRatio: 1,
          grid: true,
          movable: true,
          resizable: true,
          handlers: {
            eastNorth: true,
            north: true,
            westNorth: true,
            west: true,
            westSouth: true,
            south: true,
            eastSouth: true,
            east: true,
          },
          lines: {
            west: true,
            north: true,
            east: true,
            south: true,
          },
        }
      : {
          grid: true,
          movable: true,
          resizable: true,
          handlers: {
            eastNorth: true,
            north: true,
            westNorth: true,
            west: true,
            westSouth: true,
            south: true,
            eastSouth: true,
            east: true,
          },
          lines: {
            west: true,
            north: true,
            east: true,
            south: true,
          },
        }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/55 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
        className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border/60 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="image-crop-title" className="font-serif text-xl font-semibold text-navy">
                {title}
              </h2>
              <p className="mt-1 text-sm text-navy-muted">
                Adjust framing, then save when ready.
              </p>
              {aspectMode === 'free' ? (
                <p className="mt-1 text-sm text-primary">
                  Drag the crop frame edges or corners to resize.
                </p>
              ) : null}
            </div>
            <div className="text-right text-xs text-navy-muted">
              <p className="max-w-[220px] truncate font-medium text-navy" title={file.name}>
                {file.name}
              </p>
              <p className="mt-0.5">{formatFileSize(file.size)}</p>
              <p className="mt-0.5">{outputLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="image-crop-modal-cropper relative min-h-[min(52vh,520px)] bg-[#1a1f2e] lg:min-h-[480px]">
            {imageUrl ? (
              <Cropper
                ref={cropperRef}
                src={imageUrl}
                className="h-full w-full"
                imageRestriction={ImageRestriction.fitArea}
                stencilProps={stencilProps}
                onReady={() => setCropperReady(true)}
                onUpdate={handleUpdate}
              />
            ) : null}
          </div>

          <aside className="border-t border-border/60 bg-muted/20 p-4 lg:border-l lg:border-t-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-muted">
              Live preview
            </p>
            <div className="mt-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white p-2">
              {cropperReady ? (
                <CropperPreview
                  ref={previewRef}
                  className="h-full w-full"
                  contentClassName="h-full w-full"
                />
              ) : (
                <p className="px-3 text-center text-xs text-navy-muted">Preview appears here</p>
              )}
            </div>
          </aside>
        </div>

        <div className="space-y-4 border-t border-border/60 px-4 py-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(event) => handleZoomChange(Number(event.target.value))}
                aria-label="Zoom"
                className="w-full"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Rotation
              </span>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(event) => handleRotationChange(Number(event.target.value))}
                aria-label="Rotation"
                className="w-full"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="!min-h-10 !px-3"
              onClick={() => handleRotateBy(-90)}
              aria-label="Rotate left 90 degrees"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="!min-h-10 !px-3"
              onClick={() => handleRotateBy(90)}
              aria-label="Rotate right 90 degrees"
            >
              <RotateCw className="h-4 w-4" aria-hidden />
            </Button>
            <Button type="button" variant="secondary" className="!min-h-10" onClick={handleReset}>
              Reset
            </Button>
            <Button type="button" variant="secondary" className="!min-h-10" onClick={handleFitImage}>
              <Maximize2 className="mr-1.5 h-4 w-4" aria-hidden />
              Fit image
            </Button>
            <Button
              type="button"
              variant={aspectMode === 'square' ? 'primary' : 'secondary'}
              className="!min-h-10"
              onClick={() => setAspectMode('square')}
              aria-pressed={aspectMode === 'square'}
            >
              <Square className="mr-1.5 h-4 w-4" aria-hidden />
              1:1
            </Button>
            <Button
              type="button"
              variant={aspectMode === 'free' ? 'primary' : 'secondary'}
              className="!min-h-10"
              onClick={() => setAspectMode('free')}
              aria-pressed={aspectMode === 'free'}
            >
              <Scan className="mr-1.5 h-4 w-4" aria-hidden />
              Free crop
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <button
              ref={closeButtonRef}
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 py-3.5 text-sm font-semibold text-text-primary transition-all hover:border-text-primary/20 hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="button"
              disabled={isSaving || !cropperReady}
              onClick={() => void handleSave()}
            >
              {isSaving ? 'Saving…' : 'Save crop'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
