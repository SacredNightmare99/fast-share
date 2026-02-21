import { del } from "@vercel/blob";

/**
 * Delete a file from Vercel Blob storage by its URL.
 * @param fileUrl The full URL of the blob to delete
 */
export async function deleteBlobByUrl(fileUrl: string) {
  if (!fileUrl) return;
  try {
    // The del() function expects the path, not the full URL
    const url = new URL(fileUrl);
    // The pathname starts with a slash, e.g. /my-bucket/filename.ext
    await del(url.pathname);
  } catch (err) {
    console.error("Failed to delete blob:", err);
  }
}
