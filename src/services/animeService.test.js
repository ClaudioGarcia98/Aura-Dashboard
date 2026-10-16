import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SCHEDULE_CACHE_KEY, MAL_RELAY_BASE } from './api';
import {
  getScheduleCache,
  setScheduleCache,
  parseMALItems,
  getLocalDayRange,
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
      const mockData = { monday: { data: [{ mal_id: 1, title: 'One' }], ts: Date.now() } };
      setScheduleCache(mockData);
      expect(getScheduleCache()).toMatchObject(mockData);
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

  describe('getLocalDayRange', () => {
    it('returns null for invalid dayFilter', () => {
      expect(getLocalDayRange('someday')).toBeNull();
      expect(getLocalDayRange('')).toBeNull();
      expect(getLocalDayRange(null)).toBeNull();
    });

    it('returns valid 24h start and end UTC timestamps for valid weekdays', () => {
      const range = getLocalDayRange('thursday');
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
        json: async () => ({ data: { Page: { airingSchedules: [{ airingAt: 1729000800, media: { id: 2, idMal: 2, title: { english: 'Fresh' } } }] } } })
      });
      const data = await fetchDaySchedule('monday');
      expect(data).toMatchObject([{ mal_id: 2, title: 'Fresh' }]);
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

    it('returns stale cache with stale metadata if AniList request fails', async () => {
      const savedTs = Date.now() - 7200000;
      const staleCache = {
        sunday: { data: [{ mal_id: 999, title: 'Stale Cache' }], ts: savedTs }
      };
      setScheduleCache(staleCache);

      globalThis.fetch.mockRejectedValue(new Error('Network offline'));

      const data = await fetchDaySchedule('sunday');
      expect(data).toEqual([{ mal_id: 999, title: 'Stale Cache' }]);
      expect(data.stale).toBe(true);
      expect(data.savedAt).toBe(savedTs);
    });
  });

  describe('fetchUserWatchingList', () => {
    it('returns empty array if username is empty or falsy', async () => {
      const data1 = await fetchUserWatchingList('');
      const data2 = await fetchUserWatchingList(null);
      expect(data1).toEqual([]);
      expect(data2).toEqual([]);
    });

    it('fetches via local Vite proxy (/api/mal) when on localhost', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.startsWith('/api/mal/animelist/test/load.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              anime_id: 97,
              anime_url: '/anime/97',
              anime_image_path: 'img3.jpg',
              anime_title: 'Local Proxy Title',
              anime_score_val: 9.0,
              num_watched_episodes: 5
            }]
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const list = await fetchUserWatchingList('test');
      expect(list).toEqual([
        {
          mal_id: 97,
          url: 'https://myanimelist.net/anime/97',
          image_url: 'img3.jpg',
          title: 'Local Proxy Title',
          score: 9.0,
          watched_eps: 5
        }
      ]);
    });

    it('fetches via Dedicated Cloudflare Worker on production hosts', async () => {
      vi.stubGlobal('window', { location: { hostname: 'claudiogarcia98.github.io' } });
      globalThis.fetch.mockImplementation((url) => {
        if (url.startsWith(`${MAL_RELAY_BASE}/animelist/workeruser/load.json`)) {
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
        return Promise.reject(new Error('Unexpected URL'));
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
    });

    it('does not substitute a personal bundled list when the network fails', async () => {
      globalThis.fetch.mockRejectedValue(new Error('Network failure'));
      await expect(fetchUserWatchingList('claclo98')).rejects.toThrow();
    });

    it('throws error when the MAL endpoint fails or returns non-array', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ errors: [{ message: 'invalid request' }] })
      });
      await expect(fetchUserWatchingList('offlineUser')).rejects.toThrow('Invalid MAL response');
    });
  });
});
