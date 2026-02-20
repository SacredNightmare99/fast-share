import clientPromise from "@/lib/mongodb";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text) {
    return Response.json({ error: "Empty text" }, { status: 400 });
  }

  const id = nanoid(6).toUpperCase();
  const db = (await clientPromise).db("fasttext");
  await db.collection("shares").insertOne({
    id,
    text,
    createdAt: new Date(),
  });

  return Response.json({
    id,
    link: `${process.env.NEXT_PUBLIC_BASE_URL}/s/${id}`,
  });
}