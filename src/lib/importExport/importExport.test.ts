import { describe, expect, it } from 'vitest';
import { exportAsCsv, exportAsJson, parseImportedJson } from './importExport';

describe('importExport', () => {
	it('exports csv/json and parses json', () => {
		expect(exportAsJson({ a: 1 })).toContain('"a": 1');
		expect(exportAsCsv([{ a: 1, b: 'x' }])).toContain('a,b');
		const parsed = parseImportedJson<{ a: number }>('{"a":2}');
		expect(parsed.a).toBe(2);
	});
});
