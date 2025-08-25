export interface StorageResult<T> {
  data: T | null;
  error: Error | null;
}

// Placeholder implementations for Pinata/CouchDB storage
export async function uploadToStorage(
  _bucket: string,
  _path: string,
  _file: Blob,
  _contentType?: string,
): Promise<StorageResult<null>> {
  return { data: null, error: null };
}

export async function createSignedUrl(
  _bucket: string,
  _path: string,
  _expiresIn?: number,
): Promise<StorageResult<{ signedUrl: string }>> {
  return { data: { signedUrl: '' }, error: null };
}

export async function downloadFromStorage(
  _bucket: string,
  _path: string,
): Promise<StorageResult<Blob>> {
  return { data: new Blob(), error: null };
}
