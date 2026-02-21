import { NextRequest } from "next/server";
import { findShare, deleteShare } from "@/lib/models/share.repo";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const share = await findShare(id);

  if (!share) {
    return Response.json({ error: "Not found or expired" }, { status: 404 });
  }

  if (share.oneTime) {
    await deleteShare(id);
  }

  return Response.json({ 
  text: share.text,
  fileUrl: share.fileUrl,   // Send the file link
  fileName: share.fileName, // Send the filename
  fileSize: share.fileSize  // Send the size
});
}