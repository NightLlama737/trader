import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; // předpoklad: máte export PrismaClient v lib/prisma.ts
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { s3Key, name, description, price, categoryName } = await req.json();

    if (!s3Key) {
      return NextResponse.json({ error: "Missing s3Key" }, { status: 400 });
    }

    // Find or create category if provided
    let categoryId: string | undefined = undefined;
   
    if (categoryName?.trim()) {
      const category = await prisma.category.upsert({
        where: { name: categoryName.trim() },
        update: {},
        create: { name: categoryName.trim() },
      });
      categoryId = category.id;
    }

    const offModel = await prisma.offModel.create({
      data: {
        userId,
        key: s3Key,
        name: name || "No Name",
        description: description || "No description",
        price: Number(price) || 0,
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true },
    });

    return NextResponse.json({ offModel });
  } catch (err) {
    console.error("offModelTrade error:", err);
    return NextResponse.json({ error: "Failed to add model" }, { status: 500 });
  }
}