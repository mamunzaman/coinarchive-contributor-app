import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Cropper,
  CropperPreview,
  Priority,
  type CropperPreviewRef,
  type CropperRef,
  type CropperState,
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

function getFittedStencilSize(state: CropperState, aspectMode: AspectMode) {
  const { imageSize } = state

  if (aspectMode === 'square') {
    const side = Math.min(imageSize.width, imageSize.height)
    return { width: side, height: side }
  }

  return { width: imageSize.width, height: imageSize.height }
}

function getFittedStencilPosition(state: CropperState) {
  const { imageSize, coordinates } = state
  const width = coordinates?.width ?? imageSize.width
  const height = coordinates?.height ?? imageSize.height

  return {
    left: Math.max(0, (imageSize.width - width) / 2),
    top: Math.max(0, (imageSize.height - height) / 2),
  }
}

function getFittedVisibleArea(state: CropperState) {
  const { imageSize, boundary } = state
  const imageRatio = imageSize.width / imageSize.height
  const boundaryRatio = boundary.width / boundary.height

  if (imageRatio < boundaryRatio) {
    return {
      left: imageSize.width / 2 - (imageSize.height * boundaryRatio) / 2,
      top: 0,
      width: imageSize.height * boundaryRatio,
      height: imageSize.height,
    }
  }

  return {
    left: 0,
    top: imageSize.height / 2 - imageSize.width / boundaryRatio / 2,
    width: imageSize.width,
    height: imageSize.width / boundaryRatio,
  }
}

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
  const shouldResetRotationRef = useRef(true)

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
    shouldResetRotationRef.current = true

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

  const applyFittedView = useCallback(
    (cropper: CropperRef, mode: AspectMode, resetRotation = false) => {
      if (resetRotation) {
        const currentRotation = cropper.getTransforms().rotate ?? 0
        if (currentRotation !== 0) {
          cropper.rotateImage(0, { immediately: true, transitions: false })
        }
      }

      cropper.setCoordinates(
        [
          (state) => getFittedStencilSize(state, mode),
          (state) => getFittedStencilPosition(state),
        ],
        { immediately: true },
      )

      cropper.setState(
        (state) =>
          state
            ? {
                ...state,
                visibleArea: getFittedVisibleArea(state),
              }
            : state,
        { immediately: true },
      )

      setZoom(1)
      zoomRef.current = 1
      if (resetRotation) {
        setRotation(0)
      }
      handleUpdate(cropper)
    },
    [handleUpdate],
  )

  useEffect(() => {
    if (!open || !cropperReady) {
      return
    }

    const cropper = cropperRef.current
    if (!cropper) {
      return
    }

    applyFittedView(cropper, aspectMode, shouldResetRotationRef.current)
    shouldResetRotationRef.current = false
  }, [open, cropperReady, aspectMode, applyFittedView])

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
    const cropper = cropperRef.current
    if (!cropper) {
      return
    }

    applyFittedView(cropper, aspectMode, true)
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
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col md:flex-row lg:grid lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="image-crop-modal-cropper relative min-h-[min(34vh,280px)] bg-[#1a1f2e] sm:min-h-[min(36vh,320px)] md:min-h-[min(32vh,300px)] lg:min-h-[420px]">
              {imageUrl ? (
                <Cropper
                  ref={cropperRef}
                  src={imageUrl}
                  className="h-full w-full"
                  priority={Priority.visibleArea}
                  imageRestriction={ImageRestriction.fitArea}
                  defaultSize={(state) => getFittedStencilSize(state, aspectMode)}
                  defaultPosition={getFittedStencilPosition}
                  defaultVisibleArea={getFittedVisibleArea}
                  stencilProps={stencilProps}
                  onReady={() => setCropperReady(true)}
                  onUpdate={handleUpdate}
                />
              ) : null}
            </div>

            <aside className="shrink-0 border-t border-border/60 bg-muted/20 p-3 md:flex md:w-44 md:flex-col md:border-l md:border-t-0 md:p-3 lg:w-auto lg:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-muted">
                Live preview
              </p>
              <div className="mt-2 flex aspect-square max-h-[112px] max-w-[112px] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white p-2 md:max-h-[120px] md:max-w-[120px] lg:mt-3 lg:max-h-none lg:max-w-none lg:w-full">
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
          </div>
        </div>

        <div
          className={[
            'shrink-0 border-t border-border/70 bg-white/95 backdrop-blur-md',
            'shadow-[0_-4px_16px_rgba(28,28,30,0.06)]',
            'px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-3.5',
          ].join(' ')}
        >
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
