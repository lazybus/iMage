function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").toLowerCase();
}

export function buildOriginalPath(userId: string, batchId: string, index: number, filename: string) {
  return `${userId}/${batchId}/originals/${index + 1}-${sanitizeFilename(filename)}`;
}

export function buildProcessedPath(userId: string, batchId: string, imageId: string, filename: string) {
  return `${userId}/${batchId}/processed/${imageId}-${sanitizeFilename(filename)}`;
}

export function buildZipPath(userId: string, batchId: string) {
  return `${userId}/${batchId}/downloads/${batchId}.zip`;
}
