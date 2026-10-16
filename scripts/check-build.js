import { readdirSync, readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const files = readdirSync(new URL('../dist/', import.meta.url));
assert.deepEqual(files, ['index.html'], 'Distribution must contain only index.html');
const path = new URL('../dist/index.html', import.meta.url);
const html = readFileSync(path, 'utf8');
assert.match(html, /<script type="module">/);
assert.match(html, /<style>/);
assert.match(html, /http-equiv="Content-Security-Policy"/);
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const hash = createHash('sha256').update(script[1]).digest('base64');
    assert.ok(html.includes(`'sha256-${hash}'`), 'CSP hash does not match the final inlined script');
}
assert.match(html, /rel="icon"[^>]+href="data:image\//);
assert.doesNotMatch(html, /<(?:script|link|img|video)\b[^>]*(?:src|href)="(?:\.?\/|assets\/)/i, 'Found external local asset');
assert.doesNotMatch(html, /new URL\((['"`])(?!data:)[^'"`]+\1,\s*import\.meta\.url\)/, 'Runtime asset URL was not inlined');
assert.ok(statSync(path).size < 5 * 1024 * 1024, 'Single-file distribution exceeds the 5 MB budget');
console.log(`Verified self-contained index.html (${statSync(path).size} bytes).`);
