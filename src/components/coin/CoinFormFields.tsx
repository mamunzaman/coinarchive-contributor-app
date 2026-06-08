import { MintInformationFields } from './MintInformationFields'
import { ExistingImageReplaceField } from './ExistingImageReplaceField'
import { EditableGalleryGrid } from './EditableGalleryGrid'
import { CroppableMultiImageUploadField } from '../ui/CroppableMultiImageUploadField'
import { CoinCodePreview } from './CoinCodePreview'
import { SelectField } from '../ui/SelectField'
import { TextAreaField } from '../ui/TextAreaField'
import { TextField } from '../ui/TextField'
import { TaxonomySelectWithOther } from './TaxonomySelectWithOther'
import type { ContributorRole, SubmissionImage } from '../../lib/api'
import {
  COIN_QUALITY_OPTIONS,
  COIN_RECORD_STATUS_OPTIONS,
  type CoinFormValues,
  type MintVariantRow,
} from '../../types/coinForm'
import type { CoinFormStepId } from '../../types/coinFormSteps'
import { EMPTY_FORM_OPTIONS, type FormOptions } from '../../types/formOptions'
import { FIELD_HELP } from '../../lib/fieldHelpContent'
import { useObjectPreviewUrl } from '../../hooks/useObjectPreviewUrl'

type CoinFormFieldsProps = {
  values: CoinFormValues
  fieldErrors: Partial<Record<keyof CoinFormValues, string>>
  onFieldChange: <K extends keyof CoinFormValues>(field: K, value: CoinFormValues[K]) => void
  contributorRole?: ContributorRole
  disabled?: boolean
  formOptions?: FormOptions
  formOptionsLoading?: boolean
  formOptionsFailed?: boolean
  obverseFile?: File | null
  reverseFile?: File | null
  galleryFiles?: File[]
  obverseError?: string
  reverseError?: string
  galleryError?: string
  onObverseChange: (file: File | null) => void
  onReverseChange: (file: File | null) => void
  onGalleryChange: (files: File[]) => void
  onMintVariantsChange: (variants: MintVariantRow[]) => void
  onHasMintVariantsChange: (hasMintVariants: boolean) => void
  imageEditMode?: boolean
  currentObverseUrl?: string | null
  currentReverseUrl?: string | null
  existingGalleryImages?: SubmissionImage[]
  removedGalleryImageIds?: number[]
  onGalleryImageRemoveToggle?: (id: number, remove: boolean) => void
  galleryReplacementPreviews?: Record<number, string>
  onGalleryReplace?: (id: number, file: File) => void
  onCancelGalleryReplace?: (id: number) => void
  allowGalleryPermanentDelete?: boolean
  onGalleryPermanentDelete?: (id: number) => void
  obverseLabel?: string
  reverseLabel?: string
  activeStep?: CoinFormStepId
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border/60 pb-4">
      <h2 className="font-serif text-lg font-semibold text-navy">{title}</h2>
      {description ? <p className="mt-1 text-sm text-navy-muted">{description}</p> : null}
    </div>
  )
}

export function CoinFormFields({
  values,
  fieldErrors,
  onFieldChange,
  contributorRole = 'contributor',
  disabled = false,
  formOptions = EMPTY_FORM_OPTIONS,
  formOptionsLoading = false,
  formOptionsFailed = false,
  obverseFile,
  reverseFile,
  galleryFiles = [],
  obverseError,
  reverseError,
  galleryError,
  onObverseChange,
  onReverseChange,
  onGalleryChange,
  onMintVariantsChange,
  onHasMintVariantsChange,
  imageEditMode = false,
  currentObverseUrl,
  currentReverseUrl,
  existingGalleryImages = [],
  removedGalleryImageIds = [],
  onGalleryImageRemoveToggle,
  galleryReplacementPreviews = {},
  onGalleryReplace,
  onCancelGalleryReplace,
  allowGalleryPermanentDelete = false,
  onGalleryPermanentDelete,
  obverseLabel = 'Obverse image',
  reverseLabel = 'Reverse image',
  activeStep,
}: CoinFormFieldsProps) {
  const isAdmin = contributorRole === 'admin'
  const showHeading = !activeStep
  const obverseThumbnailUrl = useObjectPreviewUrl(obverseFile ?? null, currentObverseUrl)
  const reverseThumbnailUrl = useObjectPreviewUrl(reverseFile ?? null, currentReverseUrl)
  const qualityOptions = [
    { value: '', label: 'Select quality (optional)' },
    ...COIN_QUALITY_OPTIONS.map((option) => ({ value: option, label: option })),
  ]

  function renderCoreIdentity() {
    return (
      <section className="flex flex-col gap-5">
        {showHeading ? (
          <SectionHeading
            title="Core identity"
            description="Required details used to identify and classify the coin."
          />
        ) : null}
        <TextField
          label="Coin title"
          name="title"
          placeholder="e.g. 1921 Morgan Silver Dollar"
          value={values.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          error={fieldErrors.title}
          disabled={disabled}
          required
        />
        <CoinCodePreview
          country={values.country}
          year={values.year}
          denomination={values.denomination}
          coinType={values.coin_type}
          countries={formOptions.countries}
        />
        <p className="text-xs text-navy-muted">Coin code is generated automatically on save.</p>
        <TextField
          label="Coin theme"
          name="coin_theme"
          placeholder="Optional theme or series"
          value={values.coin_theme}
          onChange={(event) => onFieldChange('coin_theme', event.target.value)}
          disabled={disabled}
          helpTooltip={FIELD_HELP.designer}
        />
        <TaxonomySelectWithOther
          label="Country / region"
          name="country"
          value={values.country}
          options={formOptions.countries}
          onChange={(next) => onFieldChange('country', next)}
          error={fieldErrors.country}
          placeholder="Select country"
          hint="Country code is generated automatically."
          disabled={disabled}
          required
          allowCustom={false}
          optionsLoading={formOptionsLoading}
          optionsFailed={formOptionsFailed}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Year"
            name="year"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="1921"
            value={values.year}
            onChange={(event) => onFieldChange('year', event.target.value)}
            error={fieldErrors.year}
            disabled={disabled}
            required
          />
          <TaxonomySelectWithOther
            label="Denomination"
            name="denomination"
            value={values.denomination}
            options={formOptions.values}
            onChange={(next) => onFieldChange('denomination', next)}
            error={fieldErrors.denomination}
            placeholder="Select coin value"
            disabled={disabled}
            required
            allowCustom={false}
            optionsLoading={formOptionsLoading}
            optionsFailed={formOptionsFailed}
          />
        </div>
        <TaxonomySelectWithOther
          label="Coin type"
          name="coin_type"
          value={values.coin_type}
          options={formOptions.types}
          onChange={(next) => onFieldChange('coin_type', next)}
          error={fieldErrors.coin_type}
          placeholder="Select coin type"
          disabled={disabled}
          required
          allowCustom={false}
          optionsLoading={formOptionsLoading}
          optionsFailed={formOptionsFailed}
        />
        <TextAreaField
          label="Short description"
          name="short_description"
          placeholder="Brief summary of the coin and its significance..."
          value={values.short_description}
          onChange={(event) => onFieldChange('short_description', event.target.value)}
          error={fieldErrors.short_description}
          disabled={disabled}
          required
        />
      </section>
    )
  }

  function renderImages() {
    return (
      <section className="flex flex-col gap-5">
        {showHeading ? (
          <SectionHeading
            title="Images"
            description={
              imageEditMode
                ? 'Replace or remove existing images, or add new gallery photos.'
                : 'Optional obverse, reverse, and gallery photos.'
            }
          />
        ) : null}
        {imageEditMode ? (
          <p className="text-xs text-navy-muted">
            Existing images remain unchanged unless you replace or remove them.
          </p>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <ExistingImageReplaceField
            label="Current obverse"
            replaceLabel={imageEditMode ? 'Replace obverse image' : obverseLabel}
            currentUrl={currentObverseUrl}
            previewUrl={obverseThumbnailUrl}
            previewAlt="Obverse image preview"
            name="obverse_image"
            fileName={obverseFile?.name ?? null}
            isNewSelection={Boolean(obverseFile)}
            error={obverseError}
            disabled={disabled}
            onFileChange={onObverseChange}
          />
          <ExistingImageReplaceField
            label="Current reverse"
            replaceLabel={imageEditMode ? 'Replace reverse image' : reverseLabel}
            currentUrl={currentReverseUrl}
            previewUrl={reverseThumbnailUrl}
            previewAlt="Reverse image preview"
            name="reverse_image"
            fileName={reverseFile?.name ?? null}
            isNewSelection={Boolean(reverseFile)}
            error={reverseError}
            disabled={disabled}
            onFileChange={onReverseChange}
          />
        </div>
        {imageEditMode && onGalleryImageRemoveToggle ? (
          <>
            <EditableGalleryGrid
              images={existingGalleryImages}
              removedIds={removedGalleryImageIds}
              pendingFiles={galleryFiles}
              disabled={disabled}
              showAddTile
              replacementPreviews={galleryReplacementPreviews}
              allowPermanentDelete={allowGalleryPermanentDelete}
              onToggleRemove={onGalleryImageRemoveToggle}
              onReplaceImage={onGalleryReplace}
              onCancelReplace={onCancelGalleryReplace}
              onPermanentDelete={onGalleryPermanentDelete}
              onAddFiles={(newFiles) => onGalleryChange([...galleryFiles, ...newFiles])}
              onRemovePendingFile={(index) =>
                onGalleryChange(galleryFiles.filter((_, fileIndex) => fileIndex !== index))
              }
            />
            {galleryError ? (
              <p role="alert" className="text-xs text-red-600">
                {galleryError}
              </p>
            ) : null}
          </>
        ) : (
          <CroppableMultiImageUploadField
            label="Gallery images"
            name="gallery_images"
            files={galleryFiles}
            error={galleryError}
            disabled={disabled}
            onFilesChange={onGalleryChange}
          />
        )}
      </section>
    )
  }

  function renderMintInformation() {
    return (
      <MintInformationFields
        values={values}
        onFieldChange={onFieldChange}
        onMintVariantsChange={onMintVariantsChange}
        onHasMintVariantsChange={onHasMintVariantsChange}
        disabled={disabled}
        hideHeading={!showHeading}
      />
    )
  }

  function renderSpecifications() {
    return (
      <section className="flex flex-col gap-5">
        {showHeading ? (
          <SectionHeading
            title="Specifications"
            description="Optional physical and production details."
          />
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Released date"
            name="released_date"
            type="date"
            value={values.released_date}
            onChange={(event) => onFieldChange('released_date', event.target.value)}
            disabled={disabled}
          />
          <TextField
            label="Mintage"
            name="coin_mintage"
            placeholder="e.g. 1000000"
            value={values.coin_mintage}
            onChange={(event) => onFieldChange('coin_mintage', event.target.value)}
            disabled={disabled}
            helpTooltip={FIELD_HELP.mintage}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Material"
            name="coin_material"
            placeholder="e.g. 90% Silver"
            value={values.coin_material}
            onChange={(event) => onFieldChange('coin_material', event.target.value)}
            disabled={disabled}
            helpTooltip={FIELD_HELP.material}
          />
          <SelectField
            label="Quality"
            name="coin_quality"
            value={values.coin_quality}
            onChange={(event) =>
              onFieldChange('coin_quality', event.target.value as CoinFormValues['coin_quality'])
            }
            options={qualityOptions}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            label="Weight (g)"
            name="coin_weight_g"
            type="number"
            step="any"
            min={0}
            value={values.coin_weight_g}
            onChange={(event) => onFieldChange('coin_weight_g', event.target.value)}
            disabled={disabled}
            helpTooltip={FIELD_HELP.weight}
          />
          <TextField
            label="Diameter (mm)"
            name="coin_diameter_mm"
            type="number"
            step="any"
            min={0}
            value={values.coin_diameter_mm}
            onChange={(event) => onFieldChange('coin_diameter_mm', event.target.value)}
            disabled={disabled}
            helpTooltip={FIELD_HELP.diameter}
          />
          <TextField
            label="Thickness (mm)"
            name="coin_thickness_mm"
            type="number"
            step="any"
            min={0}
            value={values.coin_thickness_mm}
            onChange={(event) => onFieldChange('coin_thickness_mm', event.target.value)}
            disabled={disabled}
          />
        </div>
        <TextAreaField
          label="Edge inscription"
          name="coin_edge_inscription"
          rows={3}
          placeholder="Optional edge lettering or reeding notes"
          value={values.coin_edge_inscription}
          onChange={(event) => onFieldChange('coin_edge_inscription', event.target.value)}
          disabled={disabled}
          helpTooltip={FIELD_HELP.edgeInscription}
        />
      </section>
    )
  }

  function renderDescriptions() {
    return (
      <section className="flex flex-col gap-5">
        {showHeading ? (
          <SectionHeading
            title="Descriptions"
            description="Optional detailed notes for catalogue and collector context."
          />
        ) : null}
        <TextAreaField
          label="Obverse description"
          name="coin_obverse_description"
          value={values.coin_obverse_description}
          onChange={(event) => onFieldChange('coin_obverse_description', event.target.value)}
          disabled={disabled}
        />
        <TextAreaField
          label="Reverse description"
          name="coin_reverse_description"
          value={values.coin_reverse_description}
          onChange={(event) => onFieldChange('coin_reverse_description', event.target.value)}
          disabled={disabled}
        />
        <TextAreaField
          label="Historical background"
          name="coin_historical_background"
          rows={8}
          hint="You can add formatted historical notes. Basic HTML is supported."
          placeholder="Historical context, issuing authority, or catalogue background"
          value={values.coin_historical_background}
          onChange={(event) => onFieldChange('coin_historical_background', event.target.value)}
          disabled={disabled}
        />
        <TextAreaField
          label="Collector notes"
          name="coin_collector_notes"
          value={values.coin_collector_notes}
          onChange={(event) => onFieldChange('coin_collector_notes', event.target.value)}
          disabled={disabled}
        />
      </section>
    )
  }

  function renderStatusAdmin() {
    if (!isAdmin) {
      return null
    }

    return (
      <section className="flex flex-col gap-5">
        {showHeading ? (
          <SectionHeading
            title="Admin controls"
            description="Catalogue visibility and record status settings."
          />
        ) : null}
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
          <input
            type="checkbox"
            name="coin_is_published_catalogue"
            checked={values.coin_is_published_catalogue}
            onChange={(event) =>
              onFieldChange('coin_is_published_catalogue', event.target.checked)
            }
            disabled={disabled}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <span className="text-sm font-medium text-navy">Published catalogue</span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
          <input
            type="checkbox"
            name="coin_is_featured"
            checked={values.coin_is_featured}
            onChange={(event) => onFieldChange('coin_is_featured', event.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <span className="text-sm font-medium text-navy">Featured</span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
          <input
            type="checkbox"
            name="coin_is_app_enabled"
            checked={values.coin_is_app_enabled}
            onChange={(event) => onFieldChange('coin_is_app_enabled', event.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <span className="text-sm font-medium text-navy">App enabled</span>
        </label>
        <SelectField
          label="Record status"
          name="coin_record_status"
          value={values.coin_record_status}
          onChange={(event) =>
            onFieldChange(
              'coin_record_status',
              event.target.value as CoinFormValues['coin_record_status'],
            )
          }
          options={COIN_RECORD_STATUS_OPTIONS.map((option) => ({
            value: option,
            label: option.charAt(0).toUpperCase() + option.slice(1),
          }))}
          disabled={disabled}
        />
      </section>
    )
  }

  if (activeStep) {
    switch (activeStep) {
      case 'core-identity':
        return renderCoreIdentity()
      case 'images':
        return renderImages()
      case 'mint-information':
        return renderMintInformation()
      case 'specifications':
        return renderSpecifications()
      case 'descriptions':
        return renderDescriptions()
      case 'status-admin':
        return renderStatusAdmin()
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {renderCoreIdentity()}
      {renderImages()}
      {renderMintInformation()}
      {renderSpecifications()}
      {renderDescriptions()}
      {renderStatusAdmin()}
    </div>
  )
}
