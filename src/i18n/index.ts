import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';

const LANGUAGE_KEY = 'user-language';

const resources = {
    es: { translation: es },
    en: { translation: en },
};

const getLocales = () => {
    // If the locales structure changed in recent expo versions, we iterate
    if (Localization.getLocales && typeof Localization.getLocales === 'function') {
        return Localization.getLocales();
    }
    return [];
};

const initI18n = async () => {
    let languageToUse = 'es';

    try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (storedLanguage) {
            languageToUse = storedLanguage;
        } else {
            const locales = getLocales();
            const deviceLanguage = locales.length > 0 ? locales[0].languageCode : 'es';
            languageToUse = deviceLanguage || 'es';
        }
    } catch (e) {
        console.warn('Error reading language from storage', e);
    }

    if (!i18n.isInitialized) {
        i18n
            .use(initReactI18next)
            .init({
                resources,
                lng: languageToUse,
                fallbackLng: 'es',
                interpolation: {
                    escapeValue: false,
                },
            });
    } else {
        i18n.changeLanguage(languageToUse);
    }
};

// Initialize immediately (async) but don't block export
initI18n();

export const changeLanguage = async (lang: string) => {
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
        await i18n.changeLanguage(lang);
    } catch (e) {
        console.warn('Error saving language', e);
    }
};

export default i18n;
