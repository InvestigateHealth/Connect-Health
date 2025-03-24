// src/i18n/index.js
// Internationalization configuration for HealthConnect

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './translations/en';
import es from './translations/es';
import fr from './translations/fr';
import de from './translations/de';
import zh from './translations/zh';
import ja from './translations/ja';
import ar from './translations/ar';

// Translation resources
const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
  ja: { translation: ja },
  ar: { translation: ar },
};

// Language detection options
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Try to get stored language from AsyncStorage
      let storedLanguage;
      const deviceLocales = getLocales();
      try {
        storedLanguage = await AsyncStorage.getItem('@language');
      } catch (error) {
        console.error('Error getting stored language:', error);
        storedLanguage = null;
      }
      const deviceLanguage = deviceLocales[0]?.languageCode || 'en';
      const languageToStore = storedLanguage || (resources.hasOwnProperty(deviceLanguage) ? deviceLanguage : 'en');
      
      if (!storedLanguage) {
        try {
          await AsyncStorage.setItem('@language', languageToStore);
        } catch (error) {
          console.error('Error setting language:', error);
        }
      }
      callback(languageToStore);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('@language', language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  }
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // Required for Android
    escapeValue: false, // React already escapes values
    react: {
      useSuspense: false, // Prevents issues with Suspense
    }
  });

export default i18n;

// Helper function to change language
export const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('@language', language);
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

// Available languages
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ar', name: 'العربية' }
];
// Helper to get available languages
export const getAvailableLanguages = () => availableLanguages;
