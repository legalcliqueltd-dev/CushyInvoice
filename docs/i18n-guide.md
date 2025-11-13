# Multi-Language (i18n) Implementation Guide

## Overview
CushyInvoice now supports 6 languages out of the box:
- 🇬🇧 English (en) - Default
- 🇫🇷 French (fr)
- 🇪🇸 Spanish (es)
- 🇵🇹 Portuguese (pt)
- 🇩🇪 German (de)
- 🇸🇦 Arabic (ar) - with RTL support

## Architecture

### Translation Files
Translation files are located in `src/i18n/locales/{language}/translation.json`

Example structure:
```
src/i18n/
├── config.ts
└── locales/
    ├── en/
    │   └── translation.json
    ├── fr/
    │   └── translation.json
    ├── es/
    │   └── translation.json
    ├── pt/
    │   └── translation.json
    ├── de/
    │   └── translation.json
    └── ar/
        └── translation.json
```

### Configuration
The i18n system is configured in `src/i18n/config.ts` using:
- `i18next` - Core internationalization framework
- `react-i18next` - React bindings
- `i18next-browser-languagedetector` - Automatic language detection

## How to Use Translations

### In Components
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button>{t('create_invoice')}</button>
    </div>
  );
}
```

### Formatting Numbers, Dates, and Currency
```tsx
import { useLocale } from '@/hooks/useLocale';

function InvoiceDetail() {
  const { formatCurrency, formatDate, formatNumber } = useLocale();
  
  return (
    <div>
      <p>{formatCurrency(1500.50, 'USD')}</p>
      <p>{formatDate(new Date())}</p>
      <p>{formatNumber(1234.56)}</p>
    </div>
  );
}
```

## Language Switching

### User Interface
Users can switch languages via:
1. **Settings Page**: Go to Settings → Invoice Defaults → Language dropdown
2. **Automatic Detection**: Language is auto-detected from browser settings on first visit

### Persistence
Language preference is saved in:
- `localStorage` - For immediate persistence across sessions
- `profiles` table - In the user's database profile for cross-device sync

## RTL Support (Arabic)

### Automatic RTL Switching
When Arabic is selected:
- The `<html>` element's `dir` attribute changes to `"rtl"`
- CSS automatically applies RTL-specific styles
- Layout mirrors (flex direction, margins, paddings)
- Icons are mirrored (except specific ones like settings, crown, etc.)

### RTL CSS
RTL-specific styles are defined in `src/index.css`:
```css
[dir="rtl"] {
  direction: rtl;
}

[dir="rtl"] svg.lucide {
  transform: scaleX(-1);
}
```

## Adding a New Language

### Step 1: Create Translation File
Create a new file: `src/i18n/locales/{code}/translation.json`

Example for Italian (it):
```json
{
  "welcome": "Benvenuto in InvoiceEase",
  "dashboard": "Cruscotto",
  "clients": "Clienti",
  ...
}
```

### Step 2: Import in Config
Update `src/i18n/config.ts`:
```typescript
import it from './locales/it/translation.json';

i18n.init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    pt: { translation: pt },
    de: { translation: de },
    ar: { translation: ar },
    it: { translation: it }, // Add this line
  },
  // ... rest of config
});
```

### Step 3: Add to Language Switcher
Update `src/components/LanguageSwitcher.tsx`:
```typescript
const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "it", name: "Italiano", flag: "🇮🇹" }, // Add this line
];
```

### Step 4: Update Database Constraint
Run a migration to add the new language to the database constraint:
```sql
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS valid_language;

ALTER TABLE public.profiles
ADD CONSTRAINT valid_language 
CHECK (preferred_language IN ('en', 'fr', 'es', 'pt', 'de', 'ar', 'it'));
```

### Step 5: Add Locale Mapping
Update `src/utils/formatters.ts`:
```typescript
const localeMap: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-PT',
  de: 'de-DE',
  ar: 'ar-SA',
  it: 'it-IT', // Add this line
};
```

## Best Practices

### Translation Keys
- Use snake_case for translation keys
- Keep keys descriptive and consistent
- Group related translations

### Handling Dynamic Content
For content with variables, use interpolation:
```json
{
  "greeting": "Hello, {{name}}!",
  "invoice_total": "Total: {{amount}}"
}
```

Usage:
```tsx
t('greeting', { name: 'John' })
t('invoice_total', { amount: formatCurrency(total) })
```

### Testing
Test all languages by:
1. Switching language in Settings
2. Checking all major pages (Dashboard, Invoices, Clients, etc.)
3. Verifying number, date, and currency formatting
4. Testing RTL layout (for Arabic)

## Troubleshooting

### Language Not Updating
- Check browser console for errors
- Clear localStorage: `localStorage.removeItem('i18nextLng')`
- Verify translation file syntax (valid JSON)

### Missing Translations
- Falls back to English (default)
- Check console for missing key warnings
- Add missing keys to all language files

### RTL Issues
- Verify `dir` attribute on `<html>` element
- Check CSS specificity for RTL styles
- Test icon mirroring

## Future Enhancements
- Auto-translation API integration (Google Translate / DeepL)
- Context-aware translations for invoice templates
- Translation management dashboard
- Crowdsourced translations from users
