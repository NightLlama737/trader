import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { key, title, contentType } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Missing S3 key" }, { status: 400 });
    }

    if (contentType && !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const renderedImage = await prisma.renderedImage.create({
      data: { userId, key, title: title?.trim() || null },
    });

    return NextResponse.json({ success: true, renderedImage, s3Key: key }, { status: 201 });
  } catch (err) {
    console.error("RENDER SAVE ERROR:", err);
    return NextResponse.json({ error: "Failed to save image record" }, { status: 500 });
  }
}