<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { i18n } from '$lib/i18n';
	import { languageTag, type AvailableLanguageTag } from '$lib/paraglide/runtime';
	import * as Select from '$lib/components/ui/select';

	function switchToLanguage(value: AvailableLanguageTag | undefined) {
		if (!value) return;
		const canonicalPath = i18n.route($page.url.pathname);
		const localisedPath = i18n.resolveRoute(canonicalPath, value);
		goto(localisedPath);
	}

	const config: Record<AvailableLanguageTag, { label: string; value: AvailableLanguageTag; flag: string }> = {
		en: { label: 'English', value: 'en', flag: '🇺🇸' },
		he: { label: 'עברית', value: 'he', flag: '🇮🇱' }
	};

	$: currentLanguage = languageTag();
</script>

<Select.Root
	selected={{ value: currentLanguage, label: config[currentLanguage].label }}
	onSelectedChange={(v) => switchToLanguage(v?.value)}
>
	<Select.Trigger class="w-[140px]">
		<Select.Value placeholder="Select language" asChild>
			<span>{config[currentLanguage].flag}</span> {config[currentLanguage].label}
		</Select.Value>
	</Select.Trigger>
	<Select.Content>
		{#each Object.values(config) as language}
			<Select.Item value={language.value} class="flex items-center gap-2">
				<span>{language.flag}</span> {language.label}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
