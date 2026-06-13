const addNewTagToImage = async (image_name: string, tag_name: string) => {
	const result = await fetch(`/api/tags`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ image_name, tag_name })
	});

	if (!result.ok) {
		alert('Failed to create new tag');
		return;
	}
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
		alert('Failed to remove tag');
		return;
	}
};

const removeTag = async (name: string) => {
	const result = await fetch(`/api/tags/${name}`, {
		method: 'DELETE'
	});

	if (!result.ok) {
		alert('Failed to remove tag');
		return;
	}
};

const clientTagService = {
	addNewTagToImage,
	removeTagFromImage,
	removeTag
};

export default clientTagService;
