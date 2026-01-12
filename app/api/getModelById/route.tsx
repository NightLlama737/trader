// /api/getModelById/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const model = await prisma.model.findUnique({
    where: { id: id! },
  });

  return NextResponse.json({ model });
}
