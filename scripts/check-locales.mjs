import fs from 'node:fs';

const base = JSON.parse(fs.readFileSync('messages/en.json', 'utf-8'));
const locales = ['es', 'it', 'ro'];

let hasMissing = false;
for (const locale of locales) {
	const filePath = `messages/${locale}.json`;
	const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	const missing = Object.keys(base).filter((key) => !(key in payload));
	if (missing.length) {
		hasMissing = true;
		console.error(`[i18n] Missing keys in ${locale}:`, missing.join(', '));
	}
}

if (!hasMissing) {
	console.info('[i18n] All locale files include base keys');
}

process.exit(hasMissing ? 1 : 0);
