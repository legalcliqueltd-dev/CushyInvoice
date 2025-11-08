export interface Currency {
  code: string;
  name: string;
  symbol: string;
  region: 'global' | 'africa';
}

export const currencies: Currency[] = [
  // Major Global Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', region: 'global' },
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'global' },
  { code: 'GBP', name: 'British Pound', symbol: '£', region: 'global' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'global' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'global' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', region: 'global' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'global' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'global' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', region: 'global' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'global' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', region: 'global' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', region: 'global' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', region: 'global' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', region: 'global' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', region: 'global' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', region: 'global' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', region: 'global' },
  
  // Major African Currencies
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', region: 'africa' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'africa' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', region: 'africa' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', region: 'africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', region: 'africa' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', region: 'africa' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', region: 'africa' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', region: 'africa' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', region: 'africa' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', region: 'africa' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', region: 'africa' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', region: 'africa' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', region: 'africa' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', region: 'africa' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', region: 'africa' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', region: 'africa' },
];

export const getCurrencySymbol = (code: string): string => {
  const currency = currencies.find(c => c.code === code);
  return currency?.symbol || code;
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};
