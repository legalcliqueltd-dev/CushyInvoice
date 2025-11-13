import { useTranslation } from 'react-i18next';
import { formatNumber, formatCurrency, formatDate, getLocaleFromLanguage } from '@/utils/formatters';

export const useLocale = () => {
  const { i18n } = useTranslation();
  const locale = getLocaleFromLanguage(i18n.language);

  return {
    locale,
    language: i18n.language,
    isRTL: i18n.language === 'ar',
    formatNumber: (number: number) => formatNumber(number, locale),
    formatCurrency: (amount: number, currency: string = 'USD') => 
      formatCurrency(amount, currency, locale),
    formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
  };
};
