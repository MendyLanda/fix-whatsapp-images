import JSZip from 'jszip';
import * as m from '$lib/paraglide/messages.js';

// Types
type ZipInterface = JSZip;

export const SUPPORTED_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/bmp',
	'image/tiff'
];

// Image processing functions
export async function repairImage(file: File): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext('2d');
				ctx?.drawImage(img, 0, 0);
				canvas.toBlob((blob) => {
					if (blob) resolve(blob);
					else reject(new Error('Failed to create blob'));
				}, file.type); // Use original file type instead of hardcoding jpeg
			};
			img.onerror = reject;
			img.src = e.target?.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

// File system helpers
export function getFileFromEntry(entry: FileSystemFileEntry): Promise<File> {
	return new Promise((resolve) => {
		entry.file(resolve);
	});
}

export function readEntriesPromise(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
	return new Promise((resolve) => {
		reader.readEntries((entries) => {
			resolve(entries);
		});
	});
}

// File processing functions
export async function handleFiles(
	fileList: FileList,
	zip: ZipInterface | null = null
): Promise<Blob | void> {
	// Single file handling
	if (fileList.length === 1 && !zip) {
		const file = fileList[0];
		if (file.type === 'application/zip') {
			const extractedZip = await JSZip.loadAsync(file);
			if (!hasProcessableFiles(extractedZip)) {
				throw new Error(m.toasts_error_noImagesInZip());
			}
			const newZip = new JSZip();
			await processZipContents(extractedZip, newZip);
			if (Object.keys(newZip.files).length === 0) {
				throw new Error(m.toasts_error_noValidImagesInZip());
			}
			const content = await newZip.generateAsync({ type: 'blob' });
			return content;
		}
		if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
			return await repairImage(file);
		}
		return;
	}

	// Multiple files handling
	const localZip = zip || new JSZip();
	const initialFileCount = Object.keys(localZip.files).length;

	for (const file of fileList) {
		if (file.type === 'application/zip') {
			const extractedZip = await JSZip.loadAsync(file);
			await processZipContents(extractedZip, localZip);
		} else if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
			const repairedImage = await repairImage(file);
			localZip.file(file.name, repairedImage);
		}
	}

	if (Object.keys(localZip.files).length === initialFileCount) {
		throw new Error(m.toasts_error_noValidImages());
	}
	return;
}

async function processZipContents(sourceZip: JSZip, targetZip: JSZip): Promise<void> {
	for (const [path, file] of Object.entries(sourceZip.files)) {
		if (!file.dir) {
			const content = await file.async('blob');
			const isImage = /\.(jpe?g|png|gif|webp|bmp|tiff)$/i.test(path);
			if (isImage) {
				const repairedImage = await repairImage(
					new File([content], path.split('/').pop() || path, {
						type: getTypeFromPath(path)
					})
				);
				targetZip.file(path, repairedImage);
			}
		}
	}
}

function getTypeFromPath(path: string): string {
	const ext = path.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'png':
			return 'image/png';
		case 'gif':
			return 'image/gif';
		case 'webp':
			return 'image/webp';
		case 'bmp':
			return 'image/bmp';
		case 'tiff':
			return 'image/tiff';
		default:
			return 'image/jpeg';
	}
}

export async function processEntry(
	entry: FileSystemEntry,
	zip: ZipInterface,
	path = ''
): Promise<void> {
	if (entry.isFile) {
		const file = await getFileFromEntry(entry as FileSystemFileEntry);
		if (file.type === 'application/zip') {
			const extractedZip = await JSZip.loadAsync(file);
			const zipFolder = zip.folder(path) || zip;
			await processZipContents(extractedZip, zipFolder);
		} else if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
			const repairedImage = await repairImage(file);
			zip.file(`${path}${entry.name}`, repairedImage);
		}
	} else if (entry.isDirectory) {
		const reader = (entry as FileSystemDirectoryEntry).createReader();
		const entries = await readEntriesPromise(reader);
		const dirPath = path ? `${path}${entry.name}/` : `${entry.name}/`;
		for (const childEntry of entries) {
			await processEntry(childEntry, zip, dirPath);
		}
	}
}

function hasProcessableFiles(zip: JSZip): boolean {
	return Object.entries(zip.files).some(([path]) => {
		return /\.(jpe?g|png|gif|webp|bmp|tiff)$/i.test(path);
	});
}
