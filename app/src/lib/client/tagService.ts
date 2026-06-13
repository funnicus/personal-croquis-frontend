import { getResponseErrorMessage } from './http';

export type ClientResult = { ok: true } | { ok: false; message: string };

const addNewTagToImage = async (image_name: string, tag_name: string) => {
	const result = await fetch(`/api/tags`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ image_name, tag_name })
	});

	if (!result.ok) {
		return {
			ok: false,
			message: await getResponseErrorMessage(result, 'Failed to create new tag')
		} satisfies ClientResult;
	}

	return { ok: true } satisfies ClientResult;
};

const removeTagFromImage = async (image_name: string, tag_name: string) => {
	const result = await fetch(`/api${image_name}/tags`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ image_name, tag_name })
	});

	if (!result.ok) {
		return {
			ok: false,
			message: await getResponseErrorMessage(result, 'Failed to remove tag')
		} satisfies ClientResult;
	}

	return { ok: true } satisfies ClientResult;
};

const removeTag = async (name: string) => {
	const result = await fetch(`/api/tags/${encodeURIComponent(name)}`, {
		method: 'DELETE'
	});

	if (!result.ok) {
		return {
			ok: false,
			message: await getResponseErrorMessage(result, 'Failed to remove tag')
		} satisfies ClientResult;
	}

	return { ok: true } satisfies ClientResult;
};

const clientTagService = {
	addNewTagToImage,
	removeTagFromImage,
	removeTag
};

export default clientTagService;
