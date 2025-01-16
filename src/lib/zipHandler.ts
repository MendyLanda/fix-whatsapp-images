import type JSZip from "jszip";

export async function downloadSingleFile(
  blob: Blob,
  filename: string
): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `LANDA-FIX-${filename}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function saveToFolder(
  zip: JSZip,
  originalName?: string
): Promise<void> {
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;

  // Use original name if provided, otherwise use default
  const baseName = originalName
    ? originalName.replace(/\.(zip|folder)$/, "")
    : "repaired_images";

  link.download = `LANDA-FIX-${baseName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function getAllFiles(zip: JSZip): Promise<Map<string, Blob>> {
  const files = new Map<string, Blob>();
  for (const [path, file] of Object.entries(zip.files)) {
    if (!file.dir) {
      const content = await file.async("blob");
      files.set(path, content);
    }
  }
  return files;
}
