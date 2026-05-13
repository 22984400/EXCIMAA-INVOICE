export const COUNTRIES = [
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', currency: 'XAF', currencySymbol: 'FCFA XAF', clientPrefix: 'C' },
  { code: 'CG', name: 'République du Congo', flag: '🇨🇬', currency: 'XAF', currencySymbol: 'FCFA XAF', clientPrefix: 'RCG' },
  { code: 'CD', name: 'RDC', flag: '🇨🇩', currency: 'CDF', currencySymbol: 'CDF', clientPrefix: 'RDC' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', currencySymbol: 'RWF', clientPrefix: 'RW' },
] as const;

export type CountryCode = 'CM' | 'CG' | 'CD' | 'RW';

export const TVA_RATE = 0.1925;
export const RETENUES_RATES = [
  { label: '5.5%', value: 0.055 },
  { label: '2.5%', value: 0.025 },
];

export const PAYMENT_METHODS = [
  { value: 'Chèque', label: 'Chèque' },
  { value: 'Virement bancaire', label: 'Virement bancaire' },
  { value: 'Espèces', label: 'Espèces' },
];

export const BANK_DETAILS = {
  bank: 'Société Générale Cameroun - Douala Agence de Bali',
  rccm: 'RC/DLN/2024/063',
  iban: 'CM21 10003 01900 06191457892 74',
  nui: 'M032416624505J',
  residenceFiscal: ' CSIPLI WOURI',
};

export const COMPANY_INFO = {
  name: 'EXCI-MAA',
  tagline: 'Professionalism in motion',
  address: 'Douala, Cameroun',
  email: 'www.exci-maa.com',
  phone: '+237 698 835 251',
  bp: 'BP 2606   Immeuble CEDAM à Bali, Douala - République du Cameroun',
  rccm: 'RC/DLN/2024/063',
  nui: 'M032416624505J',
  accName: 'EXCI-MAA - SARL au Capital de 5 000 000 FCFA'
};
