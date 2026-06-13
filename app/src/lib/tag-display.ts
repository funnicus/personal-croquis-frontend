export type TagLike = { name: string };

export type DisplayTag = {
	name: string;
	label: string;
	category: string;
	categoryLabel: string;
};

export type TagGroup = {
	category: string;
	categoryLabel: string;
	tags: DisplayTag[];
};

export const humanizeTagPart = (value: string) =>
	value
		.split(/[_-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

export const getTagParts = (name: string) => {
	const separatorIndex = name.indexOf('/');

	if (separatorIndex === -1) {
		return {
			category: 'uncategorized',
			categoryLabel: 'Uncategorized',
			label: humanizeTagPart(name)
		};
	}

	const category = name.slice(0, separatorIndex);
	const tagName = name.slice(separatorIndex + 1);

	return {
		category,
		categoryLabel: humanizeTagPart(category),
		label: humanizeTagPart(tagName)
	};
};

export const getDisplayTag = (tag: TagLike): DisplayTag => ({
	name: tag.name,
	...getTagParts(tag.name)
});

export const getGroupedTags = (tagOptions: TagLike[]): TagGroup[] => {
	const groups = new Map<string, TagGroup>();

	for (const tag of tagOptions) {
		const displayTag = getDisplayTag(tag);
		const group = groups.get(displayTag.category) ?? {
			category: displayTag.category,
			categoryLabel: displayTag.categoryLabel,
			tags: []
		};

		group.tags.push(displayTag);
		groups.set(displayTag.category, group);
	}

	return Array.from(groups.values())
		.map((group) => ({
			...group,
			tags: group.tags.sort((a, b) => a.label.localeCompare(b.label))
		}))
		.sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));
};
