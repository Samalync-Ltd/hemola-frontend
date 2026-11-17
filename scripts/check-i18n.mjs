// Checks the platform's texts (npm run check:i18n):
//  1. every entry in src/i18n/strings has both an Arabic and an English text,
//     with the same {placeholders};
//  2. every key the code asks for exists;
//  3. no component holds Arabic text of its own (it belongs in the strings).
// Exits with an error listing every problem found.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createServer } from 'vite';

const root = new URL('..', import.meta.url).pathname;
const problems = [];

const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { strings } = await server.ssrLoadModule('/src/i18n/strings/index.js');
await server.close();

// 1. Both languages, same placeholders.
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const walk = (node, path) => {
    if (node && typeof node.ar === 'string') {
        if (!node.ar.trim()) problems.push(`${path}: Arabic is empty`);
        if (typeof node.en !== 'string' || !node.en.trim()) problems.push(`${path}: English is missing`);
        else if (placeholders(node.ar) !== placeholders(node.en)) problems.push(`${path}: placeholders differ (ar: ${placeholders(node.ar)} / en: ${placeholders(node.en)})`);
        return;
    }
    if (!node || typeof node !== 'object') { problems.push(`${path}: not a text entry`); return; }
    for (const [key, child] of Object.entries(node)) walk(child, path ? `${path}.${key}` : key);
};
walk(strings, '');

const lookup = (key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), strings);

// Source files.
const files = [];
const collect = (dir) => {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) collect(path);
        else if (/\.(jsx?|tsx?)$/.test(name)) files.push(path);
    }
};
collect(join(root, 'src'));

// 2. Keys used in code: t('a.b'), rich('a.b'), usePageTitle('a.b'), translate(lang, 'a.b'),
//    hasText('a.b'); a template key (`a.b.${code}`) must at least have its prefix.
const KEY_CALL = /\b(?:t|rich|usePageTitle|hasText|translate\([^,()]+,)\s*\(?\s*(['"`])([a-zA-Z][\w.]*(?:\$\{[^}]+\}[\w.]*)*)\1/g;
for (const file of files) {
    if (file.includes('/src/i18n/strings/')) continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(KEY_CALL)) {
        const key = match[2];
        const where = `${relative(root, file)}: ${key}`;
        if (key.includes('${')) {
            const prefix = key.slice(0, key.indexOf('${')).replace(/\.$/, '');
            const node = lookup(prefix);
            if (!node || typeof node !== 'object' || typeof node.ar === 'string') problems.push(`${where}: no group "${prefix}"`);
        } else if (typeof lookup(key)?.ar !== 'string') {
            problems.push(`${where}: no such text`);
        }
    }
}

// 3. No Arabic outside the strings. Data, not text, is allowed in a few files.
const ALLOWED = ['src/i18n/strings/', 'src/content/', 'src/utils/geo.js', 'src/i18n/catalog.js'];
const ARABIC = /[؀-ۿ]/;
for (const file of files) {
    const rel = relative(root, file);
    if (ALLOWED.some((prefix) => rel.startsWith(prefix))) continue;
    const code = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')       // block and JSX comments
        .replace(/(^|[^:\\])\/\/.*$/gm, '$1');   // line comments
    code.split('\n').forEach((line, index) => {
        if (ARABIC.test(line) && !line.includes('Language / اللغة')) problems.push(`${rel}:${index + 1}: Arabic text in code: ${line.trim()}`);
    });
}

if (problems.length) {
    console.error(`✗ ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
    process.exit(1);
}
console.log('✓ All texts are in both languages, every key used exists, and no component holds its own text.');
