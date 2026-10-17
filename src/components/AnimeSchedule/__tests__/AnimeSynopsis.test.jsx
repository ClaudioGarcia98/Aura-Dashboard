import { act, cleanup, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import AnimeSynopsis from '../AnimeSynopsis';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { LANGUAGES, translate } from '../../../i18n/core';

const anime = { anilist_id: 1, synopsis: 'Original English synopsis.' };
beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it.each(Object.keys(LANGUAGES))('preserves the source and labels its language appropriately in %s without network calls', locale => {
    useSettingsStore.setState({ language: locale });
    const { container } = render(<AnimeSynopsis anime={anime} />);
    expect(screen.getByText(anime.synopsis).lang).toBe('en');
    if (locale === 'en') expect(container.querySelector('.synopsis-language-note')).toBeNull();
    else expect(screen.getByText(translate(locale, 'Synopsis available in English'))).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
});

it('localizes a missing synopsis without adding an English-language note', () => {
    useSettingsStore.setState({ language: 'ja' });
    const { container } = render(<AnimeSynopsis anime={{ synopsis: '   ' }} />);
    expect(screen.getByText(translate('ja', 'No synopsis available.')).lang).toBe('ja');
    expect(container.querySelector('.synopsis-language-note')).toBeNull();
});

it('updates the language note immediately while preserving plain-text provider content', () => {
    useSettingsStore.setState({ language: 'en' });
    const { container } = render(<AnimeSynopsis anime={{ synopsis: '<img src=x> Original synopsis' }} />);
    act(() => useSettingsStore.getState().setLanguage('pt-PT'));
    expect(screen.getByText('Sinopse disponível em inglês')).toBeTruthy();
    expect(screen.getByText('<img src=x> Original synopsis')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
});
