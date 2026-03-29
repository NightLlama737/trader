// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
        credits: true,
        bankAccount: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("GET SETTINGS ERROR:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { nickname, email, currentPassword, newPassword, bankAccount } = body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};

    // Update nickname
    if (nickname && nickname !== user.nickname) {
      const existing = await prisma.user.findFirst({ where: { nickname, NOT: { id: userId } } });
      if (existing) return NextResponse.json({ error: "Nickname already taken" }, { status: 409 });
      updateData.nickname = nickname;
    }

    // Update email
    if (email && email !== user.email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
      if (existing) return NextResponse.json({ error: "Email already taken" }, { status: 409 });
      updateData.email = email;
    }

    // Update password
    if (newPassword && currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update bank account (IBAN)
    if ("bankAccount" in body) {
      // null means clear, string means set
      updateData.bankAccount = bankAccount ? bankAccount.replace(/\s/g, "").toUpperCase() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Nothing to update" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, nickname: true, credits: true, bankAccount: true },
    });

    // Update cookie if nickname changed
    const res = NextResponse.json({ ok: true, user: updated });
    if (updateData.nickname) {
      res.cookies.set({
        name: "user",
        value: JSON.stringify({ id: updated.id, nickname: updated.nickname }),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return res;
  } catch (err) {
    console.error("UPDATE SETTINGS ERROR:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}