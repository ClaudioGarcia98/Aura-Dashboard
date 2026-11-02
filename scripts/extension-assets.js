import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createManifest } from '../extensions/manifest.js';

const root = fileURLToPath(new URL('../', import.meta.url));

export function extensionAssets(target) {
    return {
        name: 'aura-extension-assets',
        async generateBundle() {
            const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
            this.emitFile({ type: 'asset', fileName: 'manifest.json', source: JSON.stringify(createManifest(target, version), null, 2) + '\n' });
            for (const size of [16, 32, 48, 128]) {
                const source = await sharp(path.join(root, 'src/assets/logo.png')).resize(size, size, { fit: 'contain' }).png().toBuffer();
                this.emitFile({ type: 'asset', fileName: `icons/${size}.png`, source });
            }
            const fonts = path.join(root, 'extensions/assets/fonts');
            for (const name of (await readdir(fonts)).sort()) {
                this.emitFile({ type: 'asset', fileName: `fonts/${name}`, source: await readFile(path.join(fonts, name)) });
            }
            this.emitFile({ type: 'asset', fileName: 'PRIVACY.md', source: await readFile(path.join(root, 'extensions/PRIVACY.md')) });
            this.emitFile({ type: 'asset', fileName: 'LICENSE.txt', source: await readFile(path.join(root, 'LICENSE')) });
            const notices = await Promise.all(['react', 'react-dom', 'scheduler', 'zustand'].map(async name =>
                `${name}\n${await readFile(path.join(root, 'node_modules', name, 'LICENSE'), 'utf8')}\n`));
            this.emitFile({ type: 'asset', fileName: 'THIRD_PARTY_NOTICES.txt', source: notices.join('\n') });
        },
    };
}
