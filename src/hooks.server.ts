import type { Handle } from '@sveltejs/kit';
import { i18n } from '$lib/i18n';
const handleParaglide: Handle = i18n.handle({
	disableAsyncLocalStorage: true
});
export const handle: Handle = handleParaglide;
