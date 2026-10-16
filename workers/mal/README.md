# MAL connection for GitHub Pages

The static dashboard cannot use Vite's local `/api/mal` proxy on GitHub Pages. This separate Cloudflare Worker fetches public watching lists for any username. No visitor registration, MAL password, username registry, scheduled job, or bundled personal list is required.

## Deploy in the Cloudflare dashboard

1. Open the `aura-mal-api` Worker and choose **Edit code**.
2. Replace the entire Hello World source with the contents of [worker.js](worker.js).
3. Click **Deploy**.
4. Open `https://aura-mal-api.claudio091998.workers.dev/`. The response must identify `Aura MAL connection` and version `3`.
5. Verify a live public list at `/animelist/claclo98/load.json?offset=0&status=1`. It must return a JSON array, not a challenge page or an error object.
6. Publish the updated dashboard after the live Worker succeeds. Its configured endpoint is `MAL_RELAY_BASE` in `src/services/api.js`.

If the address or GitHub Pages owner changes, update `MAL_RELAY_BASE` and the Worker's `SITE_ORIGIN` respectively. The allowed browser origin is `https://claudiogarcia98.github.io` (origins do not contain repository paths). Localhost HTTP origins are also supported for development.

## Behavior and limits

- Only GET watching-list requests are accepted. Target host, path shape, watching status, page offsets, and allowed query parameters are restricted. Redirects are rejected. The service cannot fetch an arbitrary URL.
- Successful pages are cached for five minutes, keyed separately by normalized username and page offset. Empty lists are valid; failures and malformed responses are never cached. Each visitor's browser also keeps its own local cache.
- Browser responses allow the configured origin rather than `*`; cookies and unrelated upstream metadata are not forwarded. CORS limits browser access, not non-browser clients or visitors under the same GitHub origin.
- The MAL username is public request data sent to Cloudflare and MyAnimeList. No account credentials are used. Private lists cannot be read.
- The frontend retains pagination, cancellation, saved lists, and labeled RSS fallback. MAL blocks, private lists, or host limits can still prevent a full refresh. Deployment must be verified with real upstream requests; fixture tests cannot demonstrate production availability.

Tests run as part of `npm test`. The Worker source is self-contained and is not bundled into the portable dashboard file. No additional application dependencies are needed.

Cloudflare references: [CORS responses](https://developers.cloudflare.com/workers/examples/cors-header-proxy/) and [Cache API](https://developers.cloudflare.com/workers/examples/cache-api/).
