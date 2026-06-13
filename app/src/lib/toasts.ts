import { writable } from 'svelte/store';

export type ToastKind = 'success' | 'error' | 'info';

export type Toast = {
	id: number;
	kind: ToastKind;
	message: string;
};

export const toasts = writable<Toast[]>([]);

let nextToastId = 1;

export const dismissToast = (id: number) => {
	toasts.update((items) => items.filter((item) => item.id !== id));
};

export const showToast = (
	kind: ToastKind,
	message: string,
	options: { durationMs?: number } = {}
) => {
	const id = nextToastId++;
	const durationMs = options.durationMs ?? 5000;

	toasts.update((items) => [...items, { id, kind, message }]);

	if (durationMs > 0) {
		window.setTimeout(() => dismissToast(id), durationMs);
	}

	return id;
};

export const toast = {
	error: (message: string, options?: { durationMs?: number }) =>
		showToast('error', message, options),
	info: (message: string, options?: { durationMs?: number }) => showToast('info', message, options),
	success: (message: string, options?: { durationMs?: number }) =>
		showToast('success', message, options)
};
