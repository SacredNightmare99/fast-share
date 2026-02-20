import { NextRequest } from "next/server";
import { findShare, deleteShare } from "@/lib/models/share.repo";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const share = await findShare(id);

  if (!share) {
    return Response.json({ error: "Not found or expired" }, { status: 404 });
  }

  if (share.oneTime) {
    await deleteShare(id);
  }

  return Response.json({ text: share.text });
}