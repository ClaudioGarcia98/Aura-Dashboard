import { useTranslation } from '../../i18n/useTranslation';

export default function AnimeSynopsis({ anime }) {
    const { t, locale } = useTranslation();
    const source = typeof anime.synopsis === 'string' ? anime.synopsis.trim() : '';
    return <div className="anime-synopsis-content">
        <p className="anime-synopsis-text" lang={source ? 'en' : locale}>
            {source || t('No synopsis available.')}
        </p>
        {source && locale !== 'en' && <p className="synopsis-language-note">{t('Synopsis available in English')}</p>}
    </div>;
}
