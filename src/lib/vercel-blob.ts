/**
 * Vercel Blob Storage Integration
 * Handles image uploads for product catalogs, banner assets, and receipts.
 */

export interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType?: string;
  size?: number;
}

/**
 * Uploads a file to Vercel Blob or provides a reliable local DataURI fallback
 * when BLOB_READ_WRITE_TOKEN is not yet provisioned in development.
 */
export async function uploadToVercelBlob(
  file: File,
  options?: { folder?: string }
): Promise<BlobUploadResult> {
  const folder = options?.folder || 'products';
  const cleanFilename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  // Check if Vercel Blob token is available in browser / client environment
  const clientToken = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN || (window as unknown as { BLOB_READ_WRITE_TOKEN?: string }).BLOB_READ_WRITE_TOKEN;

  if (clientToken) {
    try {
      // Use dynamic import to handle @vercel/blob/client if token is present
      const { upload } = await import('@vercel/blob/client');
      const blob = await upload(cleanFilename, file, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
      });
      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
      };
    } catch (err) {
      console.warn('Vercel Blob client upload attempted, falling back to local storage representation:', err);
    }
  }

  // Graceful high-fidelity fallback: convert to base64 DataURL so users can test immediately
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        pathname: cleanFilename,
        contentType: file.type,
        size: file.size,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
