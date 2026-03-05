import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST - find or create category by name
export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Category name required" }, { status: 400 });
    }

    const category = await prisma.category.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    });

    return NextResponse.json({ category });
  } catch (err) {
    console.error("Failed to create category:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}