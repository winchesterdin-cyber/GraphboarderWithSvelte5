import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve('.svelte-kit/output/client/.vite/manifest.json');
const BUNDLE_BUDGET_BYTES = 550_000;

if (!fs.existsSync(manifestPath)) {
	console.warn('[PerformanceBudget] manifest not found, run build before budget check');
	process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const totalBytes = Object.values(manifest).reduce((acc, entry) => {
	if (!entry.file) {
		return acc;
	}

	const assetPath = path.resolve('.svelte-kit/output/client', entry.file);
	if (!fs.existsSync(assetPath)) {
		return acc;
	}

	return acc + fs.statSync(assetPath).size;
}, 0);

console.info('[PerformanceBudget] Total client bundle bytes:', totalBytes);

if (totalBytes > BUNDLE_BUDGET_BYTES) {
	console.error(
		`[PerformanceBudget] Budget exceeded: ${totalBytes} > ${BUNDLE_BUDGET_BYTES}. Update assets or tune the threshold with justification.`
	);
	process.exit(1);
}
