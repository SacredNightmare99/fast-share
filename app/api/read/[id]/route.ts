import clientPromise from "@/lib/mongodb";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const db = (await clientPromise).db("fasttext");
  const resolvedParams = await params;
  const doc = await db.collection("shares").findOne({ id: resolvedParams.id });

  if (!doc) {
    return Response.json({ error: "Not found or expired" }, { status: 404 });
  }

  // delete after reading
  await db.collection("shares").deleteOne({ id: resolvedParams.id });

  return Response.json({ text: doc.text });
}