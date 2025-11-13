/**
 * Format number according to locale
 */
export const formatNumber = (number: number, locale?: string): string => {
  const userLocale = locale || navigator.language;
  return new Intl.NumberFormat(userLocale).format(number);
};

/**
 * Format currency according to locale
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale?: string
): string => {
  const userLocale = locale || navigator.language;
  return new Intl.NumberFormat(userLocale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date according to locale
 */
export const formatDate = (
  date: string | Date,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const userLocale = locale || navigator.language;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(userLocale, defaultOptions).format(dateObj);
};

/**
 * Get locale from i18n language code
 */
export const getLocaleFromLanguage = (language: string): string => {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    pt: 'pt-PT',
    de: 'de-DE',
    ar: 'ar-SA',
  };
  
  return localeMap[language] || 'en-US';
};
