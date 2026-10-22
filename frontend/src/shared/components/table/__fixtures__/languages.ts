export interface LanguageRow {
  id: string;
  name: string;
  iso: string;
  nativeName: string;
}

export const languages: LanguageRow[] = [
  { id: '1', name: 'English', iso: 'EN', nativeName: 'English' },
  { id: '2', name: 'Russian', iso: 'RU', nativeName: 'Русский' },
  { id: '3', name: 'German', iso: 'DE', nativeName: 'Deutsch' },
  { id: '4', name: 'Polish', iso: 'PL', nativeName: 'Język polski' },
  { id: '5', name: 'Portuguese', iso: 'PT', nativeName: 'Português' },
  { id: '6', name: 'Italian', iso: 'IT', nativeName: 'Lingua italiana' },
];
