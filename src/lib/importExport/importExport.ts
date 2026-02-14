/**
 * Import/export helpers for JSON and CSV payloads.
 */
export const exportAsJson = (payload: unknown): string => JSON.stringify(payload, null, 2);

export const exportAsCsv = (rows: Record<string, unknown>[]): string => {
	if (!rows.length) return '';
	const columns = Object.keys(rows[0]);
	const header = columns.join(',');
	const body = rows
		.map((row) => columns.map((column) => JSON.stringify(row[column] ?? '')).join(','))
		.join('\n');
	return `${header}\n${body}`;
};

export const parseImportedJson = <T>(input: string): T => JSON.parse(input) as T;
