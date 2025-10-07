import path from 'path';
import fs from 'fs';

export type FileObj = {
	file: string;
};

export const randomFile = (): FileObj => {
	const directoryPath = path.join(process.cwd(), 'static/images/references');

	const files: string[] = fs.readdirSync(directoryPath);

	const file = files[Math.floor(Math.random() * files.length)];

	return {
		file: `images/references/${file}`
	};
};
