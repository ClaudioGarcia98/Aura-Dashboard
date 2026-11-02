// Maintainer-only refresh. Normal builds use the committed files without network access.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const destination = new URL('../extensions/assets/fonts/', import.meta.url);
const families = [
    ['raleway', 'Raleway', 'raleway', '300..700'],
    ['outfit', 'Outfit', 'outfit', '300..700'],
    ['nunito', 'Nunito', 'nunito', '300..700'],
    ['jetbrains', 'JetBrains Mono', 'jetbrainsmono', '300..700'],
    ['playfair', 'Playfair Display', 'playfairdisplay', '400..700'],
];
const provenance = [];
const pendingFiles = new Map();

async function download(url) {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
    });
    if (!response.ok) throw new Error(`Font download failed: ${response.status} ${url}`);
    return Buffer.from(await response.arrayBuffer());
}

for (const [key, family, repository, weights] of families) {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replaceAll('%20', '+')}:wght@${weights}&display=swap`;
    let css = (await download(cssUrl)).toString('utf8');
    const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(match => match[1]))];
    if (!urls.length || /@import\b/.test(css)) throw new Error(`Unexpected stylesheet for ${family}`);
    for (const [index, url] of urls.entries()) {
        const data = await download(url);
        if (data.toString('ascii', 0, 4) !== 'wOF2') throw new Error(`Expected WOFF2: ${url}`);
        const name = `${key}-${index + 1}.woff2`;
        pendingFiles.set(name, data);
        css = css.replaceAll(url, `./${name}`);
        provenance.push({ file: name, source: url, sha256: createHash('sha256').update(data).digest('hex') });
    }
    pendingFiles.set(`${key}.css`, Buffer.from(css));
    const licenseUrl = `https://raw.githubusercontent.com/google/fonts/main/ofl/${repository}/OFL.txt`;
    pendingFiles.set(`${key}-OFL.txt`, await download(licenseUrl));
    console.log(`Prepared ${family}: ${urls.length} font subsets.`);
}
pendingFiles.set('SOURCES.json', Buffer.from(JSON.stringify({ provider: 'Google Fonts', assets: provenance }, null, 2) + '\n'));
await mkdir(destination, { recursive: true });
for (const [name, data] of pendingFiles) await writeFile(new URL(name, destination), data);
console.log(`Saved ${pendingFiles.size} font assets and licenses.`);
