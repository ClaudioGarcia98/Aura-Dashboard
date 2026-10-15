
# **bugs to fix**


# **improvments features**

##### Reach / platform

make the speed dials on settings order equals to speed dials


Installable PWA — add a manifest + service worker so it installs to a home screen and shows the shell instantly, even offline.

make this page multi language.

Virtual Anime Pet / Tamagotchi: Add a small, animated pixel-art character in the corner of your screen. It could react based on your activity, 

------------------------------------------------------------------------------------------------------------------------------------

##### Polished README + Buy Me a Coffee

100% do this. A good README is what decides whether someone who lands on your repo actually tries it or bounces. For a project like yours, the README should have a screenshot or GIF right at the top showing the dashboard in action, a short features list, setup instructions, and a "how to customize" section. That alone puts you above 90% of GitHub projects.

For Buy Me a Coffee, the standard approach is a badge in the README plus a small unobtrusive link in the dashboard itself (usually in the settings panel footer — you already have a settings panel so it fits naturally). Plenty of successful open-source dashboard projects do exactly this. People genuinely do donate when they use something daily and it's well-made.

I can help you write the README if you want — just say the word and I'll draft one based on what I know about the project. Same for your flowday app if you point me at the repo.

\------------------------------------------------------------------------------------------------------------------------------------

##### the big one improvement

"study" when you are active on the page, or give you little motivational text bubbles.

Interactive Waifu Chatbot: Integrate a tiny, lightweight AI chat widget in the corner where you can talk to a character or get a daily greeting tailored to your mood.

Idea 1: Swappable content mode (anime → movies/series)

This is a natural evolution of what you already built. The architecture is actually well-suited for it — you'd essentially swap the data source and card layout behind a settings toggle. For free APIs:


Anime: you already have Jikan (MAL) working

Movies \& TV series: TMDB (The Movie Database) is the go-to — free API key, massive catalog, has trending/airing-today endpoints, and supports user watchlists via their auth system

Alternative for TV: TVMaze is completely free with no API key needed, good for airing schedules



The "top 5 matched with your currently watching" logic is one of the smartest parts of your dashboard and people won't understand it at first glance. A small info badge or tooltip near the "Today's Launch" header explaining something like "showing your currently-watching shows airing today, filled with top-rated" would make it click immediately.

\------------------------------------------------------------------------------------------------------------------------------------

However, we can design the database integration to be 100% offline-first with a graceful local fallback, ensuring the app never stops working:

How We Keep the App Running Even if You Reach the Limits:
Zustand Persists Locally First:
The app will continue to read from and write directly to the local browser (localStorage and IndexedDB). It never waits on the database to render the UI on boot.
Background Syncing:
Synchronizing to Firebase/Supabase will happen asynchronously in the background. If you change a setting, it saves locally instantly, and then attempts to sync to the cloud.
Graceful Error Catching (Quota Fallback):
If a sync attempt fails (due to hitting the free tier quota, no internet, or API errors), the code will catch the error silently.
Only cross-device syncing will temporarily stop until the quota resets (e.g., the next day).
The dashboard itself, the widgets (Clock, Weather, MAL lists), themes, and settings will remain 100% functional locally.
Hitting the Free Tier Limits is Extremely Difficult:
Because we only sync small JSON settings (strings and booleans like theme: "aurora", username: "Cláudio") and keep large videos in IndexedDB, the data size per user is tiny (around 1KB).

On Firebase's free tier, you get 50,000 database reads and 20,000 writes per day.
A single user opening their tab a few dozen times a day would use less than 0.2% of the daily limit. Hitting the limit would only happen if you have thousands of active users, and even then, their dashboards will still work locally!

\------------------------------------------------------------------------------------------------------------------------------------