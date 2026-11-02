import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkExtension } from './check-extension.js';

const root = fileURLToPath(new URL('../', import.meta.url));
checkExtension('firefox');
const result = spawnSync(process.execPath, [
    path.join(root, 'node_modules/addons-linter/bin/addons-linter'),
    path.join(root, 'dist-extensions/firefox'), '--output', 'json',
], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
if (result.error) throw result.error;
if (result.stderr) process.stderr.write(result.stderr);
const report = JSON.parse(result.stdout);
assert.equal(result.status, 0, JSON.stringify(report.errors, null, 2));
assert.equal(report.errors.length, 0, JSON.stringify(report.errors, null, 2));
for (const warning of report.warnings) {
    // React DOM ships the implementation of dangerouslySetInnerHTML, even when
    // the application never uses it. Only these two audited vendor assignments
    // are accepted; app warnings and any other warning still fail the build.
    const vendor = /^assets\/react-vendor-[\w-]+\.js$/.test(warning.file || '');
    assert.ok(vendor && warning.code === 'UNSAFE_VAR_ASSIGNMENT', JSON.stringify(warning, null, 2));
    const line = readFileSync(path.join(root, 'dist-extensions/firefox', warning.file), 'utf8').split('\n')[warning.line - 1];
    const snippet = line.slice(Math.max(0, warning.column - 200), warning.column + 100);
    assert.match(snippet, /__html/, 'Re-audit changed React DOM warning before releasing');
    console.log(`Known React DOM warning: ${warning.code} (${warning.file}:${warning.line})`);
}
assert.ok(report.warnings.length <= 2, 'Re-audit new React DOM warnings before releasing');
console.log(`Firefox validation: ${report.errors.length} errors; ${report.warnings.length} audited React DOM warnings.`);
