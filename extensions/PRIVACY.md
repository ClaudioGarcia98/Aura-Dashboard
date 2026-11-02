# Aura extension privacy

Aura is a local-first new-tab dashboard. It has no account system, analytics, advertising SDK, or cloud synchronization. Your display name, settings, shortcuts, search history, focus tasks, and timer state are saved in your browser. Uploaded wallpapers are saved in IndexedDB. These local records are not uploaded by Aura.

## Connections to external services

Online features contact the following providers over HTTPS. Providers receive the connection's IP address and ordinary request metadata, and may apply their own retention policies.

| Feature | Data sent | Recipient |
| --- | --- | --- |
| Anime schedule and cover artwork | Schedule dates, requested anime IDs, image requests | AniList and artwork hosts returned by its API |
| Public MyAnimeList watching list | The public MAL username you enter; never a password or MAL cookie | Aura's Cloudflare Worker and MyAnimeList |
| Weather and city lookup | Selected city or coordinates; automatic IP lookup uses your IP address | Open-Meteo and ipapi.co |
| Optional device location | Coordinates, only after location permission is granted | Open-Meteo |
| Optional search suggestions | The query being typed | Google suggestions, including YouTube suggestions |
| Shortcut icons | The shortcut's website domain | Google favicon service |
| Lofi and anime trailers | Video IDs and playback requests | YouTube; video titles are requested from noembed.com |
| English online quotes | A request for a random quote | Animechan |
| Search and shortcut navigation | The query or destination you explicitly open | Your chosen search engine or destination website |

Fonts and the default wallpaper are bundled with the extension. They do not require third-party font or wallpaper requests. Remote scripts are not executed in Aura's extension page. YouTube's embedded page runs separately under YouTube's own policies; it may use cookies or storage according to your browser settings.

## Controls

Online search suggestions are off by default. GPS is optional; the extension only asks for location access when you choose to enable it. A manually selected city works without device-location access. Disable widgets you do not want to use in Settings.

Firefox additionally asks for optional data-transmission permissions for personalized weather, public MAL usernames, search terms, and shortcut domains. These features check the relevant permission before transmission. You can manage these choices in Settings and in Firefox's extension permissions. The local clock, tasks, themes, and uploaded wallpaper do not depend on these grants.

## Your local data

Use Settings → Backup & Restore to export or restore settings. Appearance presets can include an uploaded wallpaper. These downloads stay on your computer unless you choose to share them. Website and extension installations have separate storage; importing a backup is an explicit migration step. Different browsers also have separate data.

Use Aura's reset control to clear its local data, or remove the extension using your browser. Aura does not access your browser's history or bookmark collection and does not inject content scripts into other websites.

For questions or reports, use the repository's issue tracker: https://github.com/ClaudioGarcia98/Aura-Dashboard/issues
