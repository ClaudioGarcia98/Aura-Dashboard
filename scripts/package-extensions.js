import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { checkExtension, listFiles } from './check-extension.js';
import { EXTENSION_TARGETS } from '../extensions/manifest.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist-extensions/packages');
mkdirSync(output, { recursive: true });
const sums = [];

function archive(name, directory, files) {
    // Stable file order and timestamps keep release checksums reproducible.
    const entries = Object.fromEntries([...files].sort().map(file => [file, [
        readFileSync(path.join(directory, file)), { mtime: new Date(1980, 0, 1), level: 9 },
    ]]));
    const zip = zipSync(entries);
    writeFileSync(path.join(output, name), zip);
    sums.push(`${createHash('sha256').update(zip).digest('hex')}  ${name}`);
    console.log(`Packaged ${name} (${zip.length} bytes).`);
}

for (const target of EXTENSION_TARGETS) {
    const { directory, files, version } = checkExtension(target);
    archive(`aura-${version}-${target}.zip`, directory, files);
}

const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const sourceFiles = [
    'package.json', 'package-lock.json', 'vite.config.js', 'index.html', 'eslint.config.js',
    'playwright.config.js', 'playwright.extension.config.js', 'README.md', 'LICENSE',
    ...['src', 'scripts', 'extensions', 'workers', 'e2e', 'e2e-extension', 'docs'].flatMap(folder =>
        listFiles(path.join(root, folder), `${folder}/`).filter(file =>
            !file.split('/').some(part => part.startsWith('.') || part === 'node_modules')
            && /\.(?:js|jsx|css|html|json|md|txt|toml|png|jpe?g|svg|gif|webp|mp4|webm|woff2)$/.test(file))),
];
archive(`aura-${version}-source.zip`, root, sourceFiles);
writeFileSync(path.join(output, 'SHA256SUMS.txt'), sums.join('\n') + '\n');
