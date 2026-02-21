import { NextRequest } from "next/server";
import { findShare, deleteShare } from "@/lib/models/share.repo";
import { deleteBlobByUrl } from "@/lib/models/blob.util";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const share = await findShare(id);

  if (!share) {
    return Response.json({ error: "Not found or expired" }, { status: 404 });
  }


  // If one-time, delete both DB and blob immediately
  if (share.oneTime) {
    if (share.fileUrl) {
      await deleteBlobByUrl(share.fileUrl);
    }
    await deleteShare(id);
  } else {
    // If not one-time, check if expired and delete blob if so
    const now = new Date();
    if (share.fileUrl && share.expiresAt && new Date(share.expiresAt) < now) {
      await deleteBlobByUrl(share.fileUrl);
      await deleteShare(id);
    }
  }

  return Response.json({ 
  text: share.text,
  fileUrl: share.fileUrl,   // Send the file link
  fileName: share.fileName, // Send the filename
  fileSize: share.fileSize  // Send the size
});
}