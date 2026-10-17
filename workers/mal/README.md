# MAL connection for GitHub Pages

The static dashboard cannot use Vite's local `/api/mal` proxy on GitHub Pages. This separate Cloudflare Worker fetches public watching lists for any username. No visitor registration, MAL password, username registry, scheduled job, or bundled personal list is required.

## Reproducible deployment (Wrangler or Cloudflare dashboard)

### Option A: Deploy via Wrangler CLI (recommended)

From `workers/mal`:

```sh
npx wrangler deploy
```

Configuration is defined in [wrangler.toml](wrangler.toml) (`name = "aura-mal-api"`, `main = "worker.js"`, `SITE_ORIGIN = "https://claudiogarcia98.github.io"`).

### Option B: Deploy in the Cloudflare dashboard

1. Open the `aura-mal-api` Worker and choose **Edit code**.
2. Replace the entire source with the contents of [worker.js](worker.js).
3. Click **Deploy**.

### Post-deploy verification

1. Open `https://aura-mal-api.claudio091998.workers.dev/`. The response must identify `Aura MAL connection` and version `4`.
2. Verify a live public list at `/animelist/claclo98/load.json?offset=0&status=1`. It must return a JSON array, not a challenge page or an error object.
3. Publish the updated dashboard after the live Worker succeeds. Its configured endpoint is `MAL_RELAY_BASE` in `src/services/api.js`.

If the address or GitHub Pages owner changes, update `MAL_RELAY_BASE` and `SITE_ORIGIN` in [wrangler.toml](wrangler.toml) / [worker.js](worker.js). The allowed browser origin is `https://claudiogarcia98.github.io` (origins do not contain repository paths). Localhost HTTP origins are also supported for development.

## Behavior and limits

- Only GET watching-list requests are accepted. Target host, path shape, watching status, page offsets, and allowed query parameters are restricted. Redirects are rejected. The service cannot fetch an arbitrary URL.
- Upstream response bodies are bounded to 1 MB (`UPSTREAM_TOO_LARGE` on overflow). Items are validated for unique positive `anime_id`s, bounded title/image strings, valid `0–10` scores, and non-negative watched episode counts.
- Per-client rate limiting is enforced via an optional `RATE_LIMITER` binding (see [wrangler.toml](wrangler.toml)) or per-IP sliding window (`30 req/min`, returning HTTP 429 with `Retry-After: 60`). Concurrent cache misses for the same username and page offset are coalesced in-flight.
- Successful pages are cached for five minutes, keyed separately by normalized username and page offset. Empty lists are valid; failures and malformed responses are never cached. `X-Aura-Cache` and `Retry-After` headers are exposed over CORS.
- App network syncs send `Cache-Control: no-cache` to bypass the relay cache, fetch the current MAL list, and replace the cached page. Refresh requests do not join older ordinary lookups. Deploy version 4 of the Worker along with the frontend for this behavior to take effect.
- Browser responses allow the configured origin rather than `*`; cookies and unrelated upstream metadata are not forwarded.
- The MAL username is public request data sent to Cloudflare and MyAnimeList. No account credentials are used. Private lists cannot be read.
- The frontend retains pagination, cancellation, and saved lists with timestamps. MAL blocks, private lists, or host limits can still prevent a full refresh. Deployment must be verified with real upstream requests; fixture tests cannot demonstrate production availability.

Tests run as part of `npm test`. The Worker source is self-contained and is not bundled into the portable dashboard file. No additional application dependencies are needed.

Cloudflare references: [CORS responses](https://developers.cloudflare.com/workers/examples/cors-header-proxy/), [Cache API](https://developers.cloudflare.com/workers/examples/cache-api/), and [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
