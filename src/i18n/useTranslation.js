import { useCallback, useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { resolveLocale, translate } from './core';

export function useTranslation() {
    const language = useSettingsStore(state => state.language) || 'auto';
    const [browserLanguages, setBrowserLanguages] = useState(() => navigator.languages || [navigator.language]);
    useEffect(() => {
        const update = () => setBrowserLanguages([...(navigator.languages || [navigator.language])]);
        window.addEventListener('languagechange', update);
        return () => window.removeEventListener('languagechange', update);
    }, []);
    const locale = resolveLocale(language, browserLanguages);
    const t = useCallback((key, values) => translate(locale, key, values), [locale]);
    return { t, locale };
}

export function useDocumentLanguage() {
    const { locale } = useTranslation();
    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = 'ltr';
    }, [locale]);
}
