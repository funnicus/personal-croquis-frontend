import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import './.config/load-env';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
