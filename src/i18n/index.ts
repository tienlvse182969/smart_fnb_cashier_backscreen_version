import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

export type AppLanguage = 'vi' | 'en';

// Màn hình phía khách không có tài khoản/cài đặt người dùng — ngôn ngữ cố định, mặc định 'vi'.
i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
});

export default i18n;
