// app/api/searchUsers/route.ts
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return Response.json({ users: [] }, { status: 200 });
    }

    const users = await prisma.user.findMany({
      where: {
        nickname: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        nickname: true,
      },
      take: 8,
    });

    return Response.json({ users }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Search users error:", msg);
    return Response.json({ users: [] }, { status: 500 });
  }
}