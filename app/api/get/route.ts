import { NextRequest } from "next/server";
import { findShare } from "@/lib/models/share.repo"; 

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Missing share ID" }, { status: 400 });
    }

    // Fetch the share from your MongoDB database
    const share = await findShare(id);

    if (!share) {
      return Response.json({ error: "Share not found or expired" }, { status: 404 });
    }

    return Response.json(share);
  } catch (error: any) {
    console.error("Fetch error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}