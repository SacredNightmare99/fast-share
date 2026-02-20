import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import { createShare } from "@/lib/models/share.repo";
import { Share } from "@/lib/models/share.model";

export async function POST(req: NextRequest) {
  const { text, oneTime = true, expiryMinutes = 10 } = await req.json();

  if (typeof text !== "string") {
    return Response.json({ error: "Invalid text" }, { status: 400 });
  }

  const cleanedText = text.trim();
  if (!cleanedText) {
    return Response.json({ error: "Empty text" }, { status: 400 });
  }

  const now = new Date();
  const expiry = Math.min(Math.max(expiryMinutes, 1), 60);
  const share: Share = {
    _id: nanoid(6).toUpperCase(),
    text: cleanedText,
    oneTime,
    createdAt: now,
    expiresAt: new Date(now.getTime() + expiry * 60 * 1000),
  };

  await createShare(share);

  return Response.json({
    link: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/s/${share._id}`,
  });
}