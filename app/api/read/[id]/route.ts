import { findShare, deleteShare } from "@/lib/models/share.repo";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  const share = await findShare(resolvedParams.id);

  if (!share) {
    return Response.json({ error: "Not found or expired" }, { status: 404 });
  }

  if (share.oneTime) {
    await deleteShare(resolvedParams.id);
  }

  return Response.json({ text: share.text });
}