/**
 * Advanced filtering/search helper used across entities.
 *
 * The module now supports an extensive set of safe defaults plus optional
 * diagnostics, scoring, and pagination helpers so existing call sites can
 * continue using `filterEntities` while advanced callers can use
 * `searchEntities` for richer behavior.
 */
export interface SearchableEntity {
	id: string;
	name: string;
	tags?: string[];
	description?: string;
	archived?: boolean;
	status?: 'active' | 'inactive' | 'deprecated';
}

export type SearchMode = 'contains' | 'exact' | 'prefix' | 'token-all';

export interface SearchOptions {
	query: string;
	tags?: string[];
	/** Tags that must *not* be present on an entity. */
	excludeTags?: string[];
	/** Controls text matcher strategy. */
	searchMode?: SearchMode;
	/**
	 * Toggle case sensitivity. Defaults to case-insensitive matching.
	 * Kept optional for backwards compatibility.
	 */
	caseSensitive?: boolean;
	/**
	 * Normalize diacritics (e.g. "Málaga" -> "malaga") before searching.
	 * Enabled by default for more user-friendly results.
	 */
	normalizeDiacritics?: boolean;
	/**
	 * When true, all query tokens must match at least one field.
	 * Ignored for `exact` mode.
	 */
	requireAllTokens?: boolean;
	/** Allow archived records in results. Defaults to true for compatibility. */
	includeArchived?: boolean;
	/** Optional status filter. */
	statuses?: Array<SearchableEntity['status']>;
	/** Optional include/exclude id sets for deterministic scoping. */
	includeIds?: string[];
	excludeIds?: string[];
	/** Optional synonyms map; each token can expand to related terms. */
	synonyms?: Record<string, string[]>;
	/** Minimum query length before applying text filtering. */
	minQueryLength?: number;
	/** Fields used for text matching. */
	searchFields?: Array<'name' | 'description' | 'tags'>;
	/** Sort by score then field fallback. */
	sortBy?: 'score' | 'name' | 'id';
	sortDirection?: 'asc' | 'desc';
	/** Optional pagination controls. */
	limit?: number;
	offset?: number;
	/** Remove duplicate entities by id before processing. */
	dedupeById?: boolean;
	/** Optional custom predicate for domain-specific gates. */
	customFilter?: (entity: SearchableEntity) => boolean;
	/** Optional diagnostics hook for operational visibility. */
	onDiagnostics?: (diagnostics: SearchDiagnostics) => void;
}

export interface SearchDiagnostics {
	inputCount: number;
	processedCount: number;
	matchedCount: number;
	droppedBy: Record<string, number>;
	queryTokens: string[];
	usedQuery: string;
}

export interface SearchResult {
	entities: SearchableEntity[];
	totalMatches: number;
	diagnostics: SearchDiagnostics;
}

interface ScoredEntity {
	entity: SearchableEntity;
	score: number;
}

const DEFAULT_FIELDS: Array<'name' | 'description' | 'tags'> = ['name', 'description'];

const stripDiacritics = (value: string): string =>
	value.normalize('NFD').replace(/\p{Diacritic}/gu, '');

const normalizeValue = (
	value: string,
	caseSensitive: boolean,
	normalizeDiacriticsEnabled: boolean
): string => {
	const base = normalizeDiacriticsEnabled ? stripDiacritics(value) : value;
	return caseSensitive ? base : base.toLowerCase();
};

const normalizeArray = (
	values: string[] | undefined,
	caseSensitive: boolean,
	normalizeDiacriticsEnabled: boolean
): string[] =>
	(values ?? []).map((value) => normalizeValue(value, caseSensitive, normalizeDiacriticsEnabled));

const tokenize = (value: string): string[] =>
	value
		.split(/\s+/)
		.map((token) => token.trim())
		.filter(Boolean);

const clampPositiveInt = (value: number | undefined): number | undefined => {
	if (value === undefined) {
		return undefined;
	}
	return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
};

const getSearchText = (
	entity: SearchableEntity,
	fields: Array<'name' | 'description' | 'tags'>,
	separator = ' '
): string => {
	const values: string[] = [];

	if (fields.includes('name')) {
		values.push(entity.name);
	}
	if (fields.includes('description') && entity.description) {
		values.push(entity.description);
	}
	if (fields.includes('tags') && entity.tags?.length) {
		values.push(entity.tags.join(' '));
	}

	return values.join(separator);
};

const applySearchMode = (
	candidate: string,
	tokens: string[],
	query: string,
	mode: SearchMode,
	requireAllTokens: boolean
): boolean => {
	if (query.length === 0) {
		return true;
	}

	switch (mode) {
		case 'exact':
			return candidate === query;
		case 'prefix':
			return tokens.some((token) => candidate.startsWith(token));
		case 'token-all':
			return tokens.every((token) => candidate.includes(token));
		case 'contains':
		default:
			if (requireAllTokens) {
				return tokens.every((token) => candidate.includes(token));
			}
			return tokens.some((token) => candidate.includes(token));
	}
};

const scoreMatch = (candidate: string, tokens: string[], query: string): number => {
	if (query.length === 0) {
		return 1;
	}
	let score = 0;
	for (const token of tokens) {
		if (candidate === token) {
			score += 120;
		} else if (candidate.startsWith(token)) {
			score += 80;
		} else if (candidate.includes(token)) {
			score += 45;
		}
	}
	if (candidate.includes(query)) {
		score += 20;
	}
	return score;
};

const expandTokensWithSynonyms = (
	tokens: string[],
	synonyms: Record<string, string[]>
): string[] => {
	const expanded = new Set(tokens);
	for (const token of tokens) {
		for (const synonym of synonyms[token] ?? []) {
			expanded.add(synonym);
		}
	}
	return [...expanded];
};

/**
 * Rich search entry point that returns entities plus diagnostics/metadata.
 */
export const searchEntities = (
	entities: SearchableEntity[],
	options: SearchOptions
): SearchResult => {
	const caseSensitive = options.caseSensitive ?? false;
	const normalizeDiacriticsEnabled = options.normalizeDiacritics ?? true;
	const includeArchived = options.includeArchived ?? true;
	const requireAllTokens = options.requireAllTokens ?? false;
	const searchMode = options.searchMode ?? 'contains';
	const searchFields = options.searchFields?.length ? options.searchFields : DEFAULT_FIELDS;
	const sortBy = options.sortBy ?? 'score';
	const sortDirection = options.sortDirection ?? 'desc';
	const limit = clampPositiveInt(options.limit);
	const offset = Math.max(0, Math.floor(options.offset ?? 0));
	const normalizedTags = normalizeArray(options.tags, caseSensitive, normalizeDiacriticsEnabled);
	const normalizedExcludedTags = normalizeArray(
		options.excludeTags,
		caseSensitive,
		normalizeDiacriticsEnabled
	);
	const includeIds = new Set(options.includeIds ?? []);
	const excludeIds = new Set(options.excludeIds ?? []);
	const statuses = options.statuses?.length ? new Set(options.statuses) : undefined;
	const minQueryLength = options.minQueryLength ?? 0;

	const usedQuery = normalizeValue(options.query.trim(), caseSensitive, normalizeDiacriticsEnabled);
	const baseTokens = tokenize(usedQuery);
	const normalizedSynonyms = Object.fromEntries(
		Object.entries(options.synonyms ?? {}).map(([key, values]) => [
			normalizeValue(key, caseSensitive, normalizeDiacriticsEnabled),
			normalizeArray(values, caseSensitive, normalizeDiacriticsEnabled)
		])
	);
	const queryTokens = expandTokensWithSynonyms(baseTokens, normalizedSynonyms);
	const effectiveQuery = usedQuery.length < minQueryLength ? '' : usedQuery;

	const diagnostics: SearchDiagnostics = {
		inputCount: entities.length,
		processedCount: 0,
		matchedCount: 0,
		droppedBy: {
			duplicate: 0,
			includeIds: 0,
			excludeIds: 0,
			archived: 0,
			status: 0,
			tags: 0,
			excludeTags: 0,
			customFilter: 0,
			text: 0
		},
		queryTokens,
		usedQuery: effectiveQuery
	};

	const seen = new Set<string>();
	const scored: ScoredEntity[] = [];

	for (const entity of entities) {
		if (options.dedupeById && seen.has(entity.id)) {
			diagnostics.droppedBy.duplicate += 1;
			continue;
		}
		seen.add(entity.id);
		diagnostics.processedCount += 1;

		if (includeIds.size > 0 && !includeIds.has(entity.id)) {
			diagnostics.droppedBy.includeIds += 1;
			continue;
		}
		if (excludeIds.has(entity.id)) {
			diagnostics.droppedBy.excludeIds += 1;
			continue;
		}
		if (!includeArchived && entity.archived) {
			diagnostics.droppedBy.archived += 1;
			continue;
		}
		if (statuses && entity.status && !statuses.has(entity.status)) {
			diagnostics.droppedBy.status += 1;
			continue;
		}

		const normalizedEntityTags = normalizeArray(
			entity.tags,
			caseSensitive,
			normalizeDiacriticsEnabled
		);
		if (
			normalizedTags.length > 0 &&
			!normalizedTags.every((tag) => normalizedEntityTags.includes(tag))
		) {
			diagnostics.droppedBy.tags += 1;
			continue;
		}
		if (
			normalizedExcludedTags.length > 0 &&
			normalizedExcludedTags.some((tag) => normalizedEntityTags.includes(tag))
		) {
			diagnostics.droppedBy.excludeTags += 1;
			continue;
		}

		if (options.customFilter && !options.customFilter(entity)) {
			diagnostics.droppedBy.customFilter += 1;
			continue;
		}

		const candidate = normalizeValue(
			getSearchText(entity, searchFields),
			caseSensitive,
			normalizeDiacriticsEnabled
		);
		const matchesText = applySearchMode(
			candidate,
			queryTokens,
			effectiveQuery,
			searchMode,
			requireAllTokens
		);

		if (!matchesText) {
			diagnostics.droppedBy.text += 1;
			continue;
		}

		scored.push({
			entity,
			score: scoreMatch(candidate, queryTokens, effectiveQuery)
		});
	}

	scored.sort((a, b) => {
		const direction = sortDirection === 'asc' ? 1 : -1;
		if (sortBy === 'name') {
			return direction * a.entity.name.localeCompare(b.entity.name);
		}
		if (sortBy === 'id') {
			return direction * a.entity.id.localeCompare(b.entity.id);
		}
		if (a.score !== b.score) {
			return direction * (a.score - b.score);
		}
		return a.entity.name.localeCompare(b.entity.name);
	});

	const paged = scored
		.slice(offset, limit ? offset + limit : undefined)
		.map((entry) => entry.entity);
	diagnostics.matchedCount = scored.length;
	options.onDiagnostics?.(diagnostics);

	return {
		entities: paged,
		totalMatches: scored.length,
		diagnostics
	};
};

/**
 * Backwards-compatible wrapper retained for existing call sites.
 */
export const filterEntities = (
	entities: SearchableEntity[],
	options: SearchOptions
): SearchableEntity[] => {
	const { entities: results } = searchEntities(entities, options);
	return results;
};
