import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SCHEDULE_CACHE_KEY } from './api';
import {
  getScheduleCache,
  setScheduleCache,
  parseMALItems,
  getJstDayRange,
  parseAniListSchedule,
  fetchDaySchedule,
  fetchUserWatchingList,
  clearMalMemoryCache
} from './animeService';

describe('animeService', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMalMemoryCache();
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('cache operations', () => {
    it('returns empty object if cache is empty or invalid JSON', () => {
      expect(getScheduleCache()).toEqual({});
      localStorage.setItem(SCHEDULE_CACHE_KEY, 'invalid json {[');
      expect(getScheduleCache()).toEqual({});
    });

    it('sets and gets cache correctly', () => {
      const mockData = { monday: { data: [1, 2], ts: Date.now() } };
      setScheduleCache(mockData);
      expect(getScheduleCache()).toEqual(mockData);
    });
  });

  describe('parseMALItems', () => {
    it('returns empty array if input is not an array', () => {
      expect(parseMALItems(null)).toEqual([]);
      expect(parseMALItems(undefined)).toEqual([]);
      expect(parseMALItems({})).toEqual([]);
    });

    it('parses valid MAL items correctly', () => {
      const raw = [{
        anime_id: 123,
        anime_url: '/anime/123/title',
        anime_image_path: 'img.jpg',
        anime_title: 'Title',
        anime_score_val: 8.5,
        num_watched_episodes: 5
      }];
      const expected = [{
        mal_id: 123,
        url: 'https://myanimelist.net/anime/123/title',
        image_url: 'img.jpg',
        title: 'Title',
        score: 8.5,
        watched_eps: 5
      }];
      expect(parseMALItems(raw)).toEqual(expected);
    });
  });

  describe('getJstDayRange', () => {
    it('returns null for invalid dayFilter', () => {
      expect(getJstDayRange('someday')).toBeNull();
      expect(getJstDayRange('')).toBeNull();
      expect(getJstDayRange(null)).toBeNull();
    });

    it('returns valid 24h start and end UTC timestamps for valid weekdays', () => {
      const range = getJstDayRange('thursday');
      expect(range).not.toBeNull();
      expect(range.endUtcSec - range.startUtcSec).toBe(86400);
    });
  });

  describe('parseAniListSchedule', () => {
    it('returns empty array if input is not array', () => {
      expect(parseAniListSchedule(null)).toEqual([]);
      expect(parseAniListSchedule(undefined)).toEqual([]);
    });

    it('filters adult anime and maps AniList schema to expected format', () => {
      const mockSchedules = [
        {
          airingAt: 1729000800,
          media: {
            id: 100,
            idMal: 200,
            title: { english: 'My Hero', romaji: 'Boku no Hero' },
            coverImage: { large: 'cover.jpg', medium: 'cover_m.jpg' },
            averageScore: 85,
            genres: ['Action', 'Hero'],
            episodes: 24,
            description: 'A great <i>adventure</i> &quot;story&quot;!',
            trailer: { id: 'trailer123', site: 'youtube' },
            isAdult: false,
          }
        },
        {
          airingAt: 1729000800,
          media: {
            id: 101,
            idMal: 201,
            title: { romaji: 'Adult Title' },
            isAdult: true,
          }
        }
      ];

      const parsed = parseAniListSchedule(mockSchedules, 'thursday');
      expect(parsed).toHaveLength(1);
      expect(parsed[0].mal_id).toBe(200);
      expect(parsed[0].title).toBe('My Hero');
      expect(parsed[0].score).toBe(8.5);
      expect(parsed[0].synopsis).toBe('A great adventure "story"!');
      expect(parsed[0].images.jpg.image_url).toBe('cover.jpg');
      expect(parsed[0].broadcast.day).toBe('Thursdays');
      expect(parsed[0].broadcast.timezone).toBe('Asia/Tokyo');
      expect(parsed[0].genres).toEqual([{ mal_id: 'Action', name: 'Action' }, { mal_id: 'Hero', name: 'Hero' }]);
      expect(parsed[0].trailer).toEqual({
        youtube_id: 'trailer123',
        embed_url: 'https://www.youtube.com/embed/trailer123',
        url: 'https://www.youtube.com/watch?v=trailer123'
      });
    });

    it('deduplicates multiple airings of the same anime', () => {
      const duplicateSchedules = [
        { airingAt: 1729000800, media: { id: 100, idMal: 200, title: { romaji: 'Test 1' }, isAdult: false } },
        { airingAt: 1729004400, media: { id: 100, idMal: 200, title: { romaji: 'Test 1' }, isAdult: false } },
      ];
      const parsed = parseAniListSchedule(duplicateSchedules, 'monday');
      expect(parsed).toHaveLength(1);
    });
  });

  describe('fetchDaySchedule', () => {
    it('returns cached data if still valid (under 1 hour)', async () => {
      const cache = {
        monday: { data: [{ mal_id: 1, title: 'Cached' }], ts: Date.now() - 1000 }
      };
      setScheduleCache(cache);
      const data = await fetchDaySchedule('monday');
      expect(data).toEqual(cache.monday.data);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('fetches fresh data if cache is expired or missing', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ mal_id: 2, title: 'Fresh' }] })
      });
      const data = await fetchDaySchedule('monday');
      expect(data).toEqual([{ mal_id: 2, title: 'Fresh' }]);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('successfully fetches and parses AniList GraphQL airingSchedules', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            Page: {
              airingSchedules: [
                {
                  airingAt: 1729000800,
                  media: {
                    id: 50,
                    idMal: 60,
                    title: { english: 'AniList Show' },
                    coverImage: { large: 'show.jpg' },
                    averageScore: 90,
                    isAdult: false,
                  }
                }
              ]
            }
          }
        })
      });

      const data = await fetchDaySchedule('thursday');
      expect(data).toHaveLength(1);
      expect(data[0].mal_id).toBe(60);
      expect(data[0].title).toBe('AniList Show');
      expect(data[0].score).toBe(9.0);
    });

    it('falls back to Jikan API if AniList request fails', async () => {
      // First call (AniList) fails
      globalThis.fetch.mockRejectedValueOnce(new Error('AniList Network Down'));
      // Second call (Jikan fallback) succeeds
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ mal_id: 77, title: 'Jikan Fallback Show' }]
        })
      });

      const data = await fetchDaySchedule('friday');
      expect(data).toHaveLength(1);
      expect(data[0].mal_id).toBe(77);
      expect(data[0].title).toBe('Jikan Fallback Show');
    });

    it('returns stale cache if all network attempts fail', async () => {
      const staleCache = {
        sunday: { data: [{ mal_id: 999, title: 'Stale Cache' }], ts: Date.now() - 7200000 }
      };
      setScheduleCache(staleCache);

      // Both AniList and Jikan fail
      globalThis.fetch.mockRejectedValue(new Error('Network offline'));

      const data = await fetchDaySchedule('sunday');
      expect(data).toEqual([{ mal_id: 999, title: 'Stale Cache' }]);
    });
  });

  describe('fetchUserWatchingList', () => {
    it('returns empty array if username is empty or falsy', async () => {
      const data1 = await fetchUserWatchingList('');
      const data2 = await fetchUserWatchingList(null);
      expect(data1).toEqual([]);
      expect(data2).toEqual([]);
    });

    it('successfully fetches and maps data from CORSProxy.io', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('corsproxy.io')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              anime_id: 97,
              anime_url: '/anime/97',
              anime_image_path: 'img3.jpg',
              anime_title: 'CORSProxy.io Title',
              anime_score_val: 9.0,
              num_watched_episodes: 5
            }]
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      const list = await fetchUserWatchingList('test');
      expect(list).toEqual([
        {
          mal_id: 97,
          url: 'https://myanimelist.net/anime/97',
          image_url: 'img3.jpg',
          title: 'CORSProxy.io Title',
          score: 9.0,
          watched_eps: 5
        }
      ]);
    });

    it('successfully fetches and maps data from AllOrigins', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('api.allorigins.win')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              contents: JSON.stringify([{
                anime_id: 99,
                anime_url: '/anime/99',
                anime_image_path: 'img.jpg',
                anime_title: 'AllOrigins Title',
                anime_score_val: 7.5,
                num_watched_episodes: 3
              }]),
              status: { http_code: 200 }
            })
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      const list = await fetchUserWatchingList('test');
      expect(list).toEqual([
        {
          mal_id: 99,
          url: 'https://myanimelist.net/anime/99',
          image_url: 'img.jpg',
          title: 'AllOrigins Title',
          score: 7.5,
          watched_eps: 3
        }
      ]);
    });

    it('successfully fetches and maps data from CodeTabs', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('api.codetabs.com')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              anime_id: 98,
              anime_url: '/anime/98',
              anime_image_path: 'img2.jpg',
              anime_title: 'CodeTabs Title',
              anime_score_val: 8.0,
              num_watched_episodes: 4
            }]
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      const list = await fetchUserWatchingList('test');
      expect(list).toEqual([
        {
          mal_id: 98,
          url: 'https://myanimelist.net/anime/98',
          image_url: 'img2.jpg',
          title: 'CodeTabs Title',
          score: 8.0,
          watched_eps: 4
        }
      ]);
    });

    it('throws error if CORSProxy.io returns an error object instead of array', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('corsproxy.io')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ errors: [{ message: 'invalid request' }] })
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      await expect(fetchUserWatchingList('test')).rejects.toThrow();
    });

    it('throws error if AllOrigins returns null contents', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('api.allorigins.win')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              contents: null,
              status: { http_code: 404 }
            })
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      await expect(fetchUserWatchingList('test')).rejects.toThrow();
    });

    it('throws error if CodeTabs returns an error object instead of array', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('api.codetabs.com')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ errors: [{ message: 'invalid request' }] })
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      await expect(fetchUserWatchingList('test')).rejects.toThrow();
    });

    it('queries custom proxy when dash_mal_proxy is configured in localStorage', async () => {
      localStorage.setItem('dash_mal_proxy', 'https://my-worker.workers.dev/?url=');
      globalThis.fetch.mockImplementation((url) => {
        if (url.startsWith('https://my-worker.workers.dev')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              anime_id: 101,
              anime_url: '/anime/101',
              anime_image_path: 'worker.jpg',
              anime_title: 'Worker Title',
              anime_score_val: 8.8,
              num_watched_episodes: 2
            }]
          });
        }
        return Promise.reject(new Error('Other proxy error'));
      });

      const list = await fetchUserWatchingList('workerUser');
      expect(list).toEqual([{
        mal_id: 101,
        url: 'https://myanimelist.net/anime/101',
        image_url: 'worker.jpg',
        title: 'Worker Title',
        score: 8.8,
        watched_eps: 2
      }]);
      localStorage.removeItem('dash_mal_proxy');
    });

    it('returns stale cached list from localStorage when all proxies fail', async () => {
      const cached = [{
        mal_id: 55,
        url: 'https://myanimelist.net/anime/55',
        image_url: 'cached.jpg',
        title: 'Cached Show',
        score: 9.0,
        watched_eps: 12
      }];
      localStorage.setItem('dash_anime_watching', JSON.stringify(cached));
      globalThis.fetch.mockRejectedValue(new Error('All proxies dead'));

      const result = await fetchUserWatchingList('offlineUser');
      expect(result).toEqual(cached);
      localStorage.removeItem('dash_anime_watching');
    });
  });
});
