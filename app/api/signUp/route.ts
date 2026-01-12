import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // <-- bcryptjs

export async function POST(req: Request) {
  try {
    const { nickname, email, password } = await req.json();

    if (!nickname || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ nickname }, { email }] }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { nickname, email, password: hashedPassword }
    });

    // Only store safe info in cookie
    const safeUser = {
      id: user.id,
      nickname: user.nickname
    };

    // Save cookie
    const res = NextResponse.json({
      success: true,
      user: safeUser,
      message: 'User created successfully'
    });

    res.cookies.set({
      name: 'user',
      value: JSON.stringify(safeUser),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return res;

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Sign up error:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
