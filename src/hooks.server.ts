import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTraceIdFromHeaders, logEvent, TRACE_ID_HEADER } from '$lib/observability/logger';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, async ({ request, locale }) => {
		event.request = request;
		event.locals.traceId = getTraceIdFromHeaders(request.headers);
		event.locals.currentUserRole = 'viewer';

		logEvent('info', 'request.start', {
			feature: 'http',
			traceId: event.locals.traceId,
			method: request.method,
			path: new URL(request.url).pathname
		});

		const response = await resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});

		response.headers.set(TRACE_ID_HEADER, event.locals.traceId);
		logEvent('info', 'request.end', {
			feature: 'http',
			traceId: event.locals.traceId,
			status: response.status
		});

		return response;
	});

export const handle: Handle = handleParaglide;
