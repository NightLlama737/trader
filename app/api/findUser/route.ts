import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();

    if (!bodyText) {
      return Response.json(
        { success: false, error: "Empty request body" },
        { status: 400 }
      );
    }

    let emailOrNick: string;

    try {
      const data = JSON.parse(bodyText);
      emailOrNick = data.emailOrNick;
    } catch {
      return Response.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    if (!emailOrNick) {
      return Response.json(
        { success: false, error: "emailOrNick is required" },
        { status: 400 }
      );
    }

    // ⭐ Find user by email OR nickname
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrNick },
          { nickname: emailOrNick }
        ],
      },
      select: {
        id: true,
        email: true,
        nickname: true,
      },
    });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json(
      { success: true, user },
      { status: 200 }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Find user error:", msg);

    return Response.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
