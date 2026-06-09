import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { ImageLoadStatus } from '../../hooks/useImageLoadState'
import {
  getCoinImagePreviewLoadingText,
  resolveCoinImagePreviewDisplayState,
  type ImagePreviewSource,
} from '../../lib/imagePreview'

const SIZE_CLASS = {
  field: 'h-24 w-24 md:h-[88px] md:w-[88px] xl:h-28 xl:w-28',
  catalogue: 'aspect-square w-full',
  compact: 'h-9 w-9 sm:h-10 sm:w-10',
} as const

type CoinImagePreviewSlotProps = {
  previewUrl?: string | null
  previewSource?: ImagePreviewSource
  formOptionsLoading?: boolean
  isNewSelection?: boolean
  alt?: string
  size?: keyof typeof SIZE_CLASS
  objectFit?: 'cover' | 'contain'
  className?: string
  showLoadingText?: boolean
  emptyLabel?: string
}

export function CoinImagePreviewSlot({
  previewUrl,
  previewSource = 'none',
  formOptionsLoading = false,
  isNewSelection = false,
  alt = 'Coin image preview',
  size = 'field',
  objectFit = 'cover',
  className = '',
  showLoadingText = true,
  emptyLabel,
}: CoinImagePreviewSlotProps) {
  const [imageLoadStatus, setImageLoadStatus] = useState<ImageLoadStatus>('idle')

  useEffect(() => {
    if (!previewUrl) {
      setImageLoadStatus('idle')
      return
    }

    setImageLoadStatus('loading')
  }, [previewUrl])

  const displayState = resolveCoinImagePreviewDisplayState({
    formOptionsLoading,
    previewSource,
    previewUrl,
    imageLoadStatus,
    isNewSelection,
  })

  const loadingText = getCoinImagePreviewLoadingText(displayState, previewSource)
  const showSkeleton =
    displayState === 'loading-default' || displayState === 'loading-image'
  const showImage = Boolean(previewUrl) && displayState !== 'error'
  const fitClass = objectFit === 'contain' ? 'object-contain p-1.5' : 'object-cover'

  return (
    <div
      className={[
        'relative shrink-0 overflow-hidden rounded-lg border border-border/60 bg-white shadow-sm',
        SIZE_CLASS[size],
        className,
      ].join(' ')}
    >
      {showSkeleton ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100"
          aria-hidden={displayState === 'loading-image'}
          aria-busy="true"
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100" />
          {showLoadingText && loadingText && size !== 'compact' ? (
            <span className="relative z-[1] px-1.5 text-center text-[9px] font-medium leading-tight text-slate-500 xl:text-[10px]">
              {loadingText}
            </span>
          ) : null}
        </div>
      ) : null}

      {displayState === 'error' ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-50 px-1"
          role="img"
          aria-label="Image preview unavailable"
        >
          <ImageOff className="h-4 w-4 text-slate-400" aria-hidden />
          {size !== 'compact' ? (
            <span className="text-center text-[9px] text-slate-500">Preview unavailable</span>
          ) : null}
        </div>
      ) : null}

      {displayState === 'empty' && !showSkeleton ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted/40 px-1"
          role="img"
          aria-label={emptyLabel ?? 'No image selected'}
        >
          {emptyLabel && size !== 'compact' ? (
            <span className="text-center text-xs text-navy-muted">{emptyLabel}</span>
          ) : null}
        </div>
      ) : null}

      {showImage ? (
        <img
          src={previewUrl ?? undefined}
          alt={alt}
          className={[
            'h-full w-full transition-opacity duration-300',
            fitClass,
            displayState === 'loaded' ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          onLoad={() => setImageLoadStatus('loaded')}
          onError={() => setImageLoadStatus('error')}
        />
      ) : null}
    </div>
  )
}
