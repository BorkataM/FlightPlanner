import { createContext, useContext, useState } from 'react'
import { en } from '../localization/en'
import { bg } from '../localization/bg'
import type { LocaleSchema } from '../localization/en'

export type LocaleCode = 'en' | 'bg'

export const LANGUAGES: { code: LocaleCode; label: string }[] = [
  { code: 'en', label: 'English'   },
  { code: 'bg', label: 'Български' },
]

const locales: Record<LocaleCode, LocaleSchema> = { en, bg }

interface LocaleContextValue {
  locale:    LocaleCode
  t:         LocaleSchema
  setLocale: (code: LocaleCode) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<LocaleCode>('en')

  return (
    <LocaleContext.Provider value={{ locale, t: locales[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
