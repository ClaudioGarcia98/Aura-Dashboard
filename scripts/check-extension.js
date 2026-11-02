import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createManifest, EXTENSION_TARGETS } from '../extensions/manifest.js';

const root = fileURLToPath(new URL('../', import.meta.url));

export function listFiles(directory, prefix = '') {
    return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
        assert.ok(!entry.isSymbolicLink(), `Package must not contain symlinks: ${entry.name}`);
        const name = prefix + entry.name;
        return entry.isDirectory() ? listFiles(path.join(directory, entry.name), `${name}/`) : [name];
    });
}

export function checkExtension(target, directory = path.join(root, 'dist-extensions', target)) {
    assert.ok(EXTENSION_TARGETS.includes(target), 'Expected chromium or firefox');
    const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    const manifest = JSON.parse(readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
    assert.deepEqual(manifest, createManifest(target, version), 'Manifest differs from the declared build configuration');
    const files = listFiles(directory);
    const exists = file => {
        assert.ok(!path.isAbsolute(file) && !file.split('/').includes('..'), `Unsafe asset path: ${file}`);
        assert.ok(files.includes(file.replace(/^\.\//, '')), `Missing packaged asset: ${file}`);
    };
    const html = readFileSync(path.join(directory, manifest.chrome_url_overrides.newtab), 'utf8');
    assert.match(html, /<title>Aura<\/title>/);
    assert.doesNotMatch(html, /http-equiv=["']Content-Security-Policy/i, 'Extension CSP belongs in the manifest');
    assert.doesNotMatch(html, /\son\w+\s*=/i, 'Inline event handlers are forbidden');
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    assert.ok(scripts.length > 0, 'Missing application script');
    for (const [, attributes, body] of scripts) {
        assert.equal(body.trim(), '', 'Inline scripts are forbidden');
        const src = attributes.match(/\bsrc=["']([^"']+)["']/)?.[1];
        assert.ok(src && !/^(?:[a-z]+:|\/)/i.test(src), 'Scripts must use relative packaged URLs');
        exists(src);
    }
    for (const [, reference] of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) exists(reference);
    for (const [size, icon] of Object.entries(manifest.icons)) {
        exists(icon);
        const png = readFileSync(path.join(directory, icon));
        assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', 'Icon must be PNG');
        assert.equal(png.readUInt32BE(16), Number(size), 'Icon width mismatch');
        assert.equal(png.readUInt32BE(20), Number(size), 'Icon height mismatch');
    }
    for (const file of files) {
        assert.ok(!/\.(?:map|zip)$/.test(file), 'Do not ship source maps or nested archives');
        if (file.endsWith('.js')) {
            const js = readFileSync(path.join(directory, file), 'utf8');
            assert.doesNotMatch(js, /\beval\s*\(|\bnew\s+Function\s*\(/, `Dynamic code execution in ${file}`);
        }
        if (file.endsWith('.css')) {
            const css = readFileSync(path.join(directory, file), 'utf8');
            assert.doesNotMatch(css, /@import\b/, 'Stylesheets must be bundled');
            for (const [, reference] of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
                if (reference.startsWith('data:')) continue;
                exists(path.posix.normalize(path.posix.join(path.posix.dirname(file), reference)));
            }
        }
    }
    for (const file of ['PRIVACY.md', 'LICENSE.txt', 'THIRD_PARTY_NOTICES.txt']) exists(file);
    for (const font of ['raleway', 'outfit', 'nunito', 'jetbrains', 'playfair']) exists(`fonts/${font}.css`);
    const bytes = files.reduce((sum, file) => sum + statSync(path.join(directory, file)).size, 0);
    assert.ok(bytes < 15 * 1024 * 1024, 'Extension exceeds the 15 MB package budget');
    console.log(`Verified ${target} extension: ${files.length} files, ${bytes} bytes.`);
    return { directory, files, version };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
    checkExtension(process.argv[2]);
}
