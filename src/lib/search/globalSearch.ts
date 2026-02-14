/**
 * Advanced filtering/search helper used across entities.
 */
export interface SearchableEntity {
	id: string;
	name: string;
	tags?: string[];
	description?: string;
}

export interface SearchOptions {
	query: string;
	tags?: string[];
}

export const filterEntities = (
	entities: SearchableEntity[],
	options: SearchOptions
): SearchableEntity[] => {
	const normalized = options.query.trim().toLowerCase();
	const tags = options.tags ?? [];

	return entities.filter((entity) => {
		const matchesText =
			normalized.length === 0 ||
			entity.name.toLowerCase().includes(normalized) ||
			(entity.description ?? '').toLowerCase().includes(normalized);
		const matchesTags = tags.length === 0 || tags.every((tag) => (entity.tags ?? []).includes(tag));
		return matchesText && matchesTags;
	});
};
