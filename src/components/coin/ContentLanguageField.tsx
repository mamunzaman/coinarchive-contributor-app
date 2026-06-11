import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '../ui/SelectField'
import { getContentLanguageSelectOptions } from '../../lib/contentLanguage'
import type { ContentLanguage } from '../../types/coinForm'

type ContentLanguageFieldProps = {
  value: ContentLanguage
  onChange: (value: ContentLanguage) => void
  disabled?: boolean
}

export function ContentLanguageField({ value, onChange, disabled = false }: ContentLanguageFieldProps) {
  const { t, i18n } = useTranslation()
  const options = useMemo(() => getContentLanguageSelectOptions(), [i18n.language])

  return (
    <SelectField
      label={t('contentLanguage.label')}
      name="content_language"
      value={value}
      onChange={(event) => onChange(event.target.value as ContentLanguage)}
      options={options}
      hint={t('contentLanguage.helper')}
      disabled={disabled}
    />
  )
}
