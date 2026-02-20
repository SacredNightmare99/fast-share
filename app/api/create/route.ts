import { nanoid } from "nanoid";
import { createShare } from "@/lib/models/share.repo";
import { Share } from "@/lib/models/share.model";

export async function POST(req: Request) {
  const { text, oneTime = true, expiryMinutes = 10 } = await req.json();

  if (!text) {
    return Response.json({ error: "Empty text" }, { status: 400 });
  }

  const now = new Date();
  const share: Share = {
    _id: nanoid(6).toUpperCase(),
    text,
    oneTime,
    createdAt: now,
    expiresAt: new Date(now.getTime() + expiryMinutes * 60 * 1000),
  };

  await createShare(share);

  return Response.json({
    link: `${process.env.NEXT_PUBLIC_BASE_URL}/s/${share._id}`,
  });
}