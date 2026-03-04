import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const { key, name, description, price } = await req.json();

  if (!key || !name || price == null) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const finalDescription = description == null || description === "" ? "No description" : description;

  const updated = await prisma.offModel.update({
    where: { key },
    data: {
      name,
      description: finalDescription,
      price,
    },
  });

  return NextResponse.json({ offModel: updated });
}

// Also accept POST for clients that send POST instead of PUT
export async function POST(req: Request) {
  try {
    const { key, name, description, price } = await req.json();

    if (!key || !name || price == null) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const finalDescription = description == null || description === "" ? "No description" : description;

    const updated = await prisma.offModel.update({
      where: { key },
      data: {
        name,
        description: finalDescription,
        price,
      },
    });

    return NextResponse.json({ offModel: updated });
  } catch (err) {
    console.error("updateTrade POST error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
