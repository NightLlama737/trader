// app/api/getUserId/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies(); // await, protože vrací Promise
  const userCookie = cookieStore.get("user")?.value;

  if (!userCookie) {
    return NextResponse.json({ error: "No user" }, { status: 401 });
  }

  try {
    const user = JSON.parse(userCookie);
    return NextResponse.json({ userId: user.id });
  } catch {
    return NextResponse.json({ error: "Invalid cookie" }, { status: 400 });
  }
}
