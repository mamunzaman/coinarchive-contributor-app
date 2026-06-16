import { useEffect } from 'react'
import { syncCoinCodeFormFields } from '../lib/coinCodePreview'
import type { CoinFormValues } from '../types/coinForm'
import type { FormOptions } from '../types/formOptions'

export function useAutoCoinCodeSync<T extends CoinFormValues | null>(
  values: T,
  setValues: React.Dispatch<React.SetStateAction<T>>,
  formOptions: FormOptions,
): void {
  useEffect(() => {
    if (!values) {
      return
    }

    const updates = syncCoinCodeFormFields(values, formOptions.countries)
    if (!updates) {
      return
    }

    setValues((current) => {
      if (!current) {
        return current
      }

      const nextUpdates = syncCoinCodeFormFields(current, formOptions.countries)
      if (!nextUpdates) {
        return current
      }

      return {
        ...current,
        ...nextUpdates,
      }
    })
  }, [
    formOptions.countries,
    setValues,
    values?.coin_code,
    values?.coin_country_code,
    values?.coin_code_driver_snapshot,
    values?.coin_code_manual,
    values?.coin_type,
    values?.country,
    values?.denomination,
    values?.released_date,
    values?.year,
  ])
}
