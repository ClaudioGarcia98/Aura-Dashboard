import { createHash } from 'node:crypto';

// Narrow contract: one HTML entry, one JS chunk, one stylesheet. No glob dependency.
export function singleFile() {
    return {
        name: 'aura-single-file', enforce: 'post',
        generateBundle(_options, bundle) {
            const htmlFiles = Object.values(bundle).filter(file => file.fileName.endsWith('.html'));
            if (htmlFiles.length !== 1) this.error('Expected exactly one HTML entry');
            const html = htmlFiles[0];
            let content = String(html.source);
            for (const file of Object.values(bundle)) {
                if (file === html) continue;
                const escapedName = file.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (file.type === 'chunk') {
                    if (file.imports.length || file.dynamicImports.length) this.error('Single-file build cannot contain external chunks');
                    const tag = new RegExp(`<script\\b[^>]*\\bsrc="(?:\\./)?${escapedName}"[^>]*><\\/script>`);
                    if (!tag.test(content)) this.error(`Unreferenced JS chunk: ${file.fileName}`);
                    const code = file.code.replace(/new URL\((['"`])([^'"`]+)\1,\s*import\.meta\.url\)\.href/g, (match, _quote, reference) => {
                        const asset = Object.values(bundle).find(item => item.type === 'asset'
                            && (item.fileName === reference || item.fileName.split('/').at(-1) === reference));
                        if (!asset) return match;
                        const mime = asset.fileName.endsWith('.png') ? 'image/png' : asset.fileName.endsWith('.svg') ? 'image/svg+xml' : null;
                        if (!mime) this.error(`Unexpected runtime asset: ${reference}`);
                        return JSON.stringify(`data:${mime};base64,${Buffer.from(asset.source).toString('base64')}`);
                    });
                    content = content.replace(tag, () => `<script type="module">${code.replace(/<\/script/gi, '<\\/script')}</script>`);
                } else if (file.fileName.endsWith('.css')) {
                    const tag = new RegExp(`<link\\b[^>]*\\bhref="(?:\\./)?${escapedName}"[^>]*>`);
                    if (!tag.test(content)) this.error(`Unreferenced stylesheet: ${file.fileName}`);
                    content = content.replace(tag, () => `<style>${String(file.source).replace(/<\/style/gi, '<\\/style')}</style>`);
                } else {
                    const mime = file.fileName.endsWith('.png') ? 'image/png' : file.fileName.endsWith('.svg') ? 'image/svg+xml' : null;
                    if (!mime) this.error(`Unexpected external asset: ${file.fileName}`);
                    const data = `data:${mime};base64,${Buffer.from(file.source).toString('base64')}`;
                    const reference = new RegExp(`(?:\\./)?${escapedName}`, 'g');
                    if (!reference.test(content)) this.error(`Unreferenced asset: ${file.fileName}`);
                    content = content.replace(reference, () => data);
                }
            }
            for (const name of Object.keys(bundle)) if (bundle[name] !== html) delete bundle[name];
            const hashes = [...content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
                .map(match => `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
            const policy = `default-src 'self'; script-src ${hashes.join(' ')}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; media-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; frame-src https://www.youtube.com; object-src 'none'; base-uri 'none'`;
            html.source = content.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${policy}">`);
        },
    };
}
