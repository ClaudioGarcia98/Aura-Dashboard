import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AnimeCard from '../AnimeCard';
import TrailerPreview from '../TrailerPreview';
import { useSettingsStore } from '../../../stores/useSettingsStore';

const anime = { mal_id: 1, title: 'Trailer show', images: { jpg: { small_image_url: 'https://example.com/cover.jpg' } }, trailer: { youtube_id: 'dQw4w9WgXcQ' } };
const ready = (iframe, data = { event: 'onReady' }, origin = 'https://www.youtube.com', source = iframe.contentWindow) => act(() => {
    window.dispatchEvent(new MessageEvent('message', { origin, source, data: JSON.stringify(data) }));
});
beforeEach(() => { vi.useFakeTimers(); act(() => { useSettingsStore.setState({ volume: 0, language: 'en' }); }); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it.each(['today', 'sidebar'])('initializes and keeps %s embedded trailer volume in sync after verified readiness', variant => {
    const view = render(<AnimeCard anime={anime} variant={variant} isExpanded isMobile onToggleExpand={() => {}} />);
    const iframe = view.container.querySelector('iframe');
    expect(iframe.src).toContain('mute=1');
    const send = vi.spyOn(iframe.contentWindow, 'postMessage');
    fireEvent.load(iframe);
    act(() => { useSettingsStore.getState().setVolume(0.3); });
    ready(iframe, { event: 'onReady' }, 'https://attacker.example');
    ready(iframe, { event: 'onReady' }, 'https://www.youtube.com', window);
    expect(send.mock.calls.some(([raw]) => JSON.parse(raw).event === 'command')).toBe(false);
    ready(iframe);
    expect(send).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'setVolume', args: [30] }), 'https://www.youtube.com');
    expect(send).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), 'https://www.youtube.com');
    act(() => { useSettingsStore.getState().setVolume(0); });
    expect(send).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'mute', args: [] }), 'https://www.youtube.com');
    send.mockClear();
    view.unmount();
    ready(iframe);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(send).not.toHaveBeenCalled();
});

it('keeps a zero-volume trailer muted when ready and permits no commands from malformed messages', () => {
    const { container } = render(<AnimeCard anime={anime} variant="today" isExpanded isMobile onToggleExpand={() => {}} />);
    const iframe = container.querySelector('iframe');
    const send = vi.spyOn(iframe.contentWindow, 'postMessage');
    ready(iframe, null);
    ready(iframe, { event: 'unrelated' });
    expect(send).not.toHaveBeenCalled();
    ready(iframe, { event: 'initialDelivery' });
    expect(send).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'mute', args: [] }), 'https://www.youtube.com');
    expect(send).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'setVolume', args: [0] }), 'https://www.youtube.com');
});

it('uses the same readiness and volume controller for floating desktop trailers', () => {
    const { container, rerender } = render(<TrailerPreview youtubeId="dQw4w9WgXcQ" pos={{ x: 20, y: 20 }} muted onMute={() => {}} onUnmute={() => {}} />);
    const iframe = container.querySelector('iframe');
    const send = vi.spyOn(iframe.contentWindow, 'postMessage');
    act(() => { useSettingsStore.getState().setVolume(0.6); });
    ready(iframe);
    expect(send).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'mute', args: [] }), 'https://www.youtube.com');
    rerender(<TrailerPreview youtubeId="dQw4w9WgXcQ" pos={{ x: 20, y: 20 }} muted={false} onMute={() => {}} onUnmute={() => {}} />);
    expect(send).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), 'https://www.youtube.com');
    expect(send).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'setVolume', args: [60] }), 'https://www.youtube.com');
});
