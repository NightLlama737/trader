import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { emailOrNick, password } = await req.json();

    if (!emailOrNick || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrNick },
          { nickname: emailOrNick }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/nickname or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/nickname or password' },
        { status: 401 }
      );
    }

    // Store safe info in cookie
    const safeUser = {
      id: user.id,
      nickname: user.nickname
    };

    const res = NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Login successful'
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
    console.error('Login error:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
