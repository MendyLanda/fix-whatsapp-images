<script lang="ts">
	import JSZip from 'jszip';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import { handleFiles, processEntry, SUPPORTED_IMAGE_TYPES } from '../lib/imageProcessor';
	import { downloadSingleFile, saveToFolder } from '../lib/zipHandler';
	import Upload from 'lucide-svelte/icons/upload';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import FolderUp from 'lucide-svelte/icons/folder-up';
	import { onMount } from 'svelte';
	import LanguageSwitcher from '$lib/components/language-switcher.svelte';
	import * as m from '$lib/paraglide/messages.js';
	// Import logos
	import Telegram from '$lib/components/logos/telegram.svelte';
	import Gmail from '$lib/components/logos/gmail.svelte';
	import GoogleDrive from '$lib/components/logos/google-drive.svelte';
	import Photoshop from '$lib/components/logos/photoshop.svelte';
	import Illustrator from '$lib/components/logos/illustrator.svelte';
	import AffinityDesigner from '$lib/components/logos/affinity-designer.svelte';
	import AffinityPublisher from '$lib/components/logos/affinity-publisher.svelte';
	import Whatsapp from '$lib/components/logos/whatsapp.svelte';
	import Indesign from '$lib/components/logos/indesign.svelte';

	let fileInput: HTMLInputElement;
	let status = '';
	let isDragging = false;
	let isProcessing = false;
	let toastId = 'download-toast';
	let isLoaded = false;

	onMount(() => {
		// Small delay to ensure smooth animation
		setTimeout(() => {
			isLoaded = true;
		}, 100);
	});

	function setError(message: string) {
		toast.error(message, { id: toastId });
	}

	function handleClick() {
		fileInput.click();
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const items = e.dataTransfer?.items;
		if (items) {
			await handleItems(items);
		}
	}

	async function handleChange(e: Event) {
		const files = (e.target as HTMLInputElement).files;
		if (files) {
			try {
				isProcessing = true;
				toast.info(m.toasts_processing(), { id: toastId });
				const result = await handleFiles(files);

				if (result instanceof Blob) {
					// Single file result
					await downloadSingleFile(result, files[0].name);
					toast.success(m.toasts_success_single(), { id: toastId });
				} else {
					// Multiple files result
					const zip = new JSZip();
					await handleFiles(files, zip);
					await saveToFolder(zip, files.length === 1 ? files[0].name : undefined);
					toast.success(m.toasts_success_multiple(), {
						id: toastId
					});
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : m.toasts_error_generic());
			} finally {
				resetApp();
			}
		}
	}

	async function handleItems(items: DataTransferItemList) {
		try {
			isProcessing = true;
			status = m.toasts_processingFolders();
			toast.info(m.toasts_processingFolders(), { id: toastId });
			const zip = new JSZip();
			let originalName: string | undefined;

			for (const item of items) {
				if (item.kind === 'file') {
					const entry = item.webkitGetAsEntry();
					if (entry) {
						if (items.length === 1) {
							originalName = entry.name;
						}
						await processEntry(entry, zip);
					}
				}
			}

			if (items.length === 1) {
				const item = items[0];
				const file = item.getAsFile();
				if (
					file &&
					(SUPPORTED_IMAGE_TYPES.includes(file.type) || file.type === 'application/zip')
				) {
					const result = await handleFiles([file] as unknown as FileList);
					if (result instanceof Blob) {
						await downloadSingleFile(result, file.name);
						toast.success(m.toasts_success_single(), { id: toastId });
						resetApp();
						return;
					}
				}
			}

			if (Object.keys(zip.files).length === 0) {
				throw new Error(m.toasts_error_noValidImages());
			}
			await saveToFolder(zip, originalName);
			toast.success(m.toasts_success_multiple(), {
				id: toastId
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : m.toasts_error_generic());
		} finally {
			resetApp();
		}
	}

	function resetApp() {
		fileInput.value = '';
		isProcessing = false;
		setTimeout(() => {
			status = '';
		}, 3000);
	}
</script>

<Toaster />

<main class="min-h-screen bg-gradient-to-b from-background via-background/95 to-blue-50/20">
	<div class="relative mx-auto max-w-4xl p-6">
		<!-- Language Switcher -->
		<div class="absolute right-6 top-6 z-10">
			<LanguageSwitcher />
		</div>

		<!-- Hero Section -->
		<div class="mb-16 space-y-6 pt-16 text-center">
			<div class="relative">
				<div class="absolute inset-0 -z-10">
					<div
						class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"
					></div>
				</div>
				<h1
					class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text pb-4 text-4xl font-bold tracking-tighter text-transparent dark:from-white dark:via-gray-100 dark:to-white sm:text-6xl"
				>
					{m.hero_title()}
				</h1>
				<div class="mt-6 flex flex-col items-center gap-6">
					<p class="mx-auto max-w-[700px] text-xl font-medium text-foreground/80">
						{m.hero_subtitle()}
					</p>
				</div>
			</div>
		</div>

		<!-- Drop Zone Container with Background Logos -->
		<div class="relative">
			<!-- Scattered Logos Background -->
			<div class="absolute inset-[-15px] sm:inset-[-30px]">
				<!-- Top border -->
				<div
					class="logo absolute left-[15%] top-[-5px] h-10 w-10 sm:top-0 sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: -12deg"
					class:animate={isLoaded}
				>
					<Telegram />
				</div>
				<div
					class="logo absolute right-[20%] top-[-5px] h-10 w-10 sm:top-[-10px] sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: 30deg"
					class:animate={isLoaded}
				>
					<Whatsapp />
				</div>
				<div
					class="logo absolute left-[45%] top-[-8px] h-10 w-10 sm:top-[-15px] sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: 5deg"
					class:animate={isLoaded}
				>
					<Indesign />
				</div>

				<!-- Left border -->
				<div
					class="logo absolute left-[-10px] top-[30%] h-10 w-10 sm:left-[-20px] sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: -5deg"
					class:animate={isLoaded}
				>
					<Illustrator />
				</div>
				<div
					class="logo absolute left-[-8px] top-[60%] h-10 w-10 sm:left-[-15px] sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: -10deg"
					class:animate={isLoaded}
				>
					<Gmail />
				</div>

				<!-- Right border -->
				<div
					class="logo absolute right-[-10px] top-[35%] h-10 w-10 sm:right-[-20px] sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: 15deg"
					class:animate={isLoaded}
				>
					<GoogleDrive />
				</div>
				<div
					class="logo absolute right-[-8px] top-[65%] h-10 w-10 sm:right-[-15px] sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: 12deg"
					class:animate={isLoaded}
				>
					<AffinityDesigner />
				</div>

				<!-- Bottom border -->
				<div
					class="logo absolute bottom-[-10px] left-[25%] h-10 w-10 sm:bottom-[-12px] sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: -8deg"
					class:animate={isLoaded}
				>
					<AffinityPublisher />
				</div>
				<div
					class="logo absolute bottom-[-8px] right-[30%] h-10 w-10 sm:bottom-[-15px] sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full"
					style="--final-x: 0; --final-y: 0; --final-rotate: 10deg"
					class:animate={isLoaded}
				>
					<Photoshop />
				</div>
			</div>

			<!-- Main Drop Zone -->
			<Card
				class="from-background/98 relative overflow-hidden border-opacity-40 bg-gradient-to-b to-background/95 shadow-xl backdrop-blur"
			>
				<div
					class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"
				></div>
				<CardContent class="relative">
					<div
						class="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-all duration-200 {isDragging
							? 'scale-[0.99] border-primary/20 bg-muted/50'
							: 'hover:border-primary/20 hover:bg-muted/25'}"
						role="button"
						tabindex="0"
						on:click={handleClick}
						on:keydown={(e) => e.key === 'Enter' && handleClick()}
						on:dragover={handleDragOver}
						on:dragleave={handleDragLeave}
						on:drop={handleDrop}
					>
						{#if isProcessing}
							<div class="animate-pulse">
								<Badge variant="secondary" class="mb-4">{m.dropzone_processing_badge()}</Badge>
								<p class="text-muted-foreground">
									{m.dropzone_processing_message()}
								</p>
							</div>
						{:else}
							<div
								class="mb-4 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4"
							>
								<Upload class="h-6 w-6 text-primary" />
							</div>
							<div class="space-y-2">
								<p class="font-medium">
									{m.dropzone_idle_title()}
								</p>
								<p class="text-sm text-muted-foreground">
									{m.dropzone_idle_subtitle()}
								</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Feature Cards -->
		<div class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
			<Card
				class="bg-gradient-to-br from-background to-blue-50/50 shadow-lg transition-all duration-300 dark:to-blue-950/50"
			>
				<CardContent class="pt-6">
					<div class="space-y-2">
						<div
							class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10"
						>
							<CheckCircle class="h-5 w-5 text-primary" />
						</div>
						<h3 class="font-semibold">
							{m.features_worksEverywhere_title()}
						</h3>
						<p class="text-sm text-muted-foreground">
							{m.features_worksEverywhere_description()}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card
				class="bg-gradient-to-br from-background to-purple-50/50 shadow-lg transition-all duration-300 dark:to-purple-950/50"
			>
				<CardContent class="pt-6">
					<div class="space-y-2">
						<div
							class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10"
						>
							<FolderUp class="h-5 w-5 text-primary" />
						</div>
						<h3 class="font-semibold">{m.features_bulkFix_title()}</h3>
						<p class="text-sm text-muted-foreground">
							{m.features_bulkFix_description()}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card
				class="bg-gradient-to-br from-background to-pink-50/50 shadow-lg transition-all duration-300 dark:to-pink-950/50"
			>
				<CardContent class="pt-6">
					<div class="space-y-2">
						<div
							class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/10 to-blue-500/10"
						>
							<Sparkles class="h-5 w-5 text-primary" />
						</div>
						<h3 class="font-semibold">{m.features_designReady_title()}</h3>
						<p class="text-sm text-muted-foreground">
							{m.features_designReady_description()}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Contact Section -->
		<div class="mt-12 space-y-4 text-center">
			<p class="text-muted-foreground">
				{m.contact_text()}
				<a
					href="mailto:{m.contact_email()}"
					class="font-medium text-primary transition-colors hover:text-primary/80"
					>{m.contact_email()}</a
				>
			</p>
		</div>
	</div>

	<input
		bind:this={fileInput}
		type="file"
		multiple
		accept="image/*,application/zip"
		class="hidden"
		on:change={handleChange}
	/>
</main>

<style>
	@keyframes moveFromCenter {
		0% {
			opacity: 0;
			transform: translate(0, 0) rotate(var(--final-rotate)) scale(0.5);
		}
		100% {
			opacity: 0.3;
			transform: translate(var(--final-x), var(--final-y)) rotate(var(--final-rotate)) scale(1);
		}
	}

	.logo {
		--final-x: 0;
		--final-y: 0;
		--final-rotate: 0deg;
		opacity: 0;
		transform: rotate(var(--final-rotate));
	}

	.logo.animate {
		animation: moveFromCenter 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	.logo:nth-child(1) {
		animation-delay: 0.1s;
	}
	.logo:nth-child(2) {
		animation-delay: 0.2s;
	}
	.logo:nth-child(3) {
		animation-delay: 0.15s;
	}
	.logo:nth-child(4) {
		animation-delay: 0.25s;
	}
	.logo:nth-child(5) {
		animation-delay: 0.3s;
	}
	.logo:nth-child(6) {
		animation-delay: 0.35s;
	}
	.logo:nth-child(7) {
		animation-delay: 0.4s;
	}
	.logo:nth-child(8) {
		animation-delay: 0.45s;
	}
	.logo:nth-child(9) {
		animation-delay: 0.5s;
	}
</style>
