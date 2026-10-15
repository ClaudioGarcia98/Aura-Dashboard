import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetPath = path.resolve(__dirname, '../src/assets/defaultWatching.json');

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://myanimelist.net/',
    },
    timeout: 4000,
};

const req = https.get('https://myanimelist.net/animelist/claclo98/load.json?offset=0&status=1', options, res => {
    if (res.statusCode !== 200) {
        console.warn(`[sync-mal-default] MAL returned status ${res.statusCode}. Keeping existing defaultWatching.json.`);
        process.exit(0);
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const raw = JSON.parse(data);
            if (!Array.isArray(raw) || raw.length === 0) {
                console.warn('[sync-mal-default] Empty array received. Keeping existing defaultWatching.json.');
                process.exit(0);
            }
            const parsed = raw.map(a => ({
                mal_id: a.anime_id,
                url: 'https://myanimelist.net' + a.anime_url,
                image_url: a.anime_image_path,
                title: a.anime_title,
                score: a.anime_score_val || 'N/A',
                watched_eps: a.num_watched_episodes,
            }));
            fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf-8');
            console.log(`[sync-mal-default] Successfully updated ${parsed.length} items in ${targetPath}`);
        } catch (err) {
            console.warn('[sync-mal-default] Failed to parse response JSON:', err.message);
        }
        process.exit(0);
    });
});

req.on('timeout', () => {
    req.destroy();
    console.warn('[sync-mal-default] Request timed out. Keeping existing defaultWatching.json.');
    process.exit(0);
});

req.on('error', err => {
    console.warn('[sync-mal-default] Request error:', err.message, '- Keeping existing defaultWatching.json.');
    process.exit(0);
});
