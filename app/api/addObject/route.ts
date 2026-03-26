import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) {
      return Response.json({ error: "No userId cookie" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "User does not exist" }, { status: 400 });

    const { key } = await req.json();

    if (!key) {
      return Response.json({ error: "Missing S3 key" }, { status: 400 });
    }

    const newObject = await prisma.model.create({
      data: {
        key,
        userId,
      },
    });

    return Response.json({ success: true, object: newObject, s3Key: key }, { status: 201 });
  } catch (err) {
    console.error("SAVE MODEL ERROR:", err);
    return Response.json({ error: "Failed to save model" }, { status: 500 });
  }
}