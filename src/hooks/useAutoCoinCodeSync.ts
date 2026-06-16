import { useEffect } from 'react'
import { generateCoinCodePreview } from '../lib/coinCodePreview'
import type { CoinFormValues } from '../types/coinForm'
import type { FormOptions } from '../types/formOptions'

export function useAutoCoinCodeSync<T extends CoinFormValues | null>(
  values: T,
  setValues: React.Dispatch<React.SetStateAction<T>>,
  formOptions: FormOptions,
): void {
  useEffect(() => {
    if (!values || values.coin_code_manual) {
      return
    }

    const coin_code = generateCoinCodePreview(
      values.country,
      values.year,
      values.denomination,
      values.coin_type,
      formOptions.countries,
      values.released_date,
    ).coinCode

    if (coin_code === values.coin_code && coin_code === values.unique_code) {
      return
    }

    setValues((current) => {
      if (!current || current.coin_code_manual) {
        return current
      }

      if (coin_code === current.coin_code && coin_code === current.unique_code) {
        return current
      }

      return {
        ...current,
        coin_code,
        unique_code: coin_code,
      }
    })
  }, [
    formOptions.countries,
    setValues,
    values?.coin_code,
    values?.coin_code_manual,
    values?.coin_type,
    values?.country,
    values?.denomination,
    values?.released_date,
    values?.unique_code,
    values?.year,
  ])
}
