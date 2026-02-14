import fs from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files', { encoding: 'utf-8' })
	.split('\n')
	.filter(Boolean)
	.filter((file) => fs.existsSync(file));

const patterns = [/AKIA[0-9A-Z]{16}/, /-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----/];
let hasIssue = false;

for (const file of files) {
	const content = fs.readFileSync(file, 'utf-8');
	for (const pattern of patterns) {
		if (pattern.test(content)) {
			hasIssue = true;
			console.error(`[security] potential secret found in ${file}`);
		}
	}
}

if (!hasIssue) {
	console.info('[security] no obvious secrets found');
}

process.exit(hasIssue ? 1 : 0);
