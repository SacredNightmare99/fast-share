import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import { createShare } from "@/lib/models/share.repo";
import { Share } from "@/lib/models/share.model";
import { put } from "@vercel/blob"; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const text = formData.get("text") as string;
    const file = formData.get("file") as File | null;
    const peerId = formData.get("peerId") as string;
    const shareType = (formData.get("shareType") as 'cloud' | 'p2p') || 'cloud';
    const oneTime = formData.get("oneTime") === "true";
    const expiryMinutes = parseInt(formData.get("expiryMinutes") as string) || 10;

    const cleanedText = text?.trim();

    if (!cleanedText && !file && !peerId) {
      return Response.json({ error: "Empty share" }, { status: 400 });
    }

    let fileUrl = "";
    let fileName = formData.get("fileName") as string || "";
    let fileSize = parseInt(formData.get("fileSize") as string) || 0;

    // Only upload to Vercel Blob if it's NOT a Live Drop
    if (file && shareType === 'cloud') {
      const blob = await put(file.name, file, { 
        access: 'public', 
        addRandomSuffix: true 
      });
      fileUrl = blob.url;
      fileName = file.name;
      fileSize = file.size;
    }

    const now = new Date();
    const expiry = Math.min(Math.max(expiryMinutes, 1), 60);
    
    const share: Share = {
      _id: nanoid(6).toUpperCase(),
      text: cleanedText || "", 
      fileUrl,                
      peerId,                // Store the signaling ID for P2P
      fileName,               
      fileSize,               
      shareType,             // Save the protocol type
      oneTime,
      createdAt: now,
      expiresAt: new Date(now.getTime() + expiry * 60 * 1000),
    };

    await createShare(share);

    return Response.json({
      link: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/s/${share._id}`,
    });

  } catch (error: any) {
    console.error("API Crash Details:", error);
    return Response.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}