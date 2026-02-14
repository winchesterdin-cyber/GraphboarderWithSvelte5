/**
 * DX scaffolding helpers to generate common file templates.
 */
export const createStoreTemplate = (name: string): string =>
	`import { writable } from 'svelte/store';\n\nexport const ${name} = writable(null);\n`;
