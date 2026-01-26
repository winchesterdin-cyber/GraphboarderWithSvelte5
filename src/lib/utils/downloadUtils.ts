import { browser } from '$app/environment';

/**
 * Downloads a JSON object as a file.
 * @param data The data to be downloaded (will be JSON.stringified).
 * @param filename The name of the file to download.
 */
export const downloadJSON = (data: any, filename: string) => {
	if (!browser) return;
	const jsonStr = JSON.stringify(data, null, 2);
	const blob = new Blob([jsonStr], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

/**
 * Downloads a string content as a file.
 * @param content The text content to be downloaded.
 * @param filename The name of the file to download.
 */
export const downloadText = (content: string, filename: string) => {
	if (!browser) return;
	const blob = new Blob([content], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};
