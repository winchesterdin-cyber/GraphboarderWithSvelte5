export const ssr: boolean = false;

export const load = async ({ fetch }) => {
	const response = await fetch('/endpoints');
	return {
		traceId: response.headers.get('x-trace-id') ?? 'unknown'
	};
};
