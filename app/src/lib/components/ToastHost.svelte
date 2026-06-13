<script lang="ts">
	import { dismissToast, toasts, type ToastKind } from '$lib/toasts';

	const alertClass = (kind: ToastKind) => {
		if (kind === 'error') return 'alert-error';
		if (kind === 'success') return 'alert-success';
		return 'alert-info';
	};
</script>

<div class="toast-top toast-end toast z-[100]">
	{#each $toasts as item (item.id)}
		<div class={`alert ${alertClass(item.kind)} max-w-sm shadow-lg`}>
			<span class="text-sm">{item.message}</span>
			<button
				class="btn btn-ghost btn-xs"
				onclick={() => dismissToast(item.id)}
				aria-label="Dismiss notification"
			>
				✕
			</button>
		</div>
	{/each}
</div>
