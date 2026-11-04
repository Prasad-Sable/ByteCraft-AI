import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required' }, { status: 400 });
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 });
    }

    const token = createToken({ sub: email });

    return NextResponse.json({
      access_token: token,
      token_type: 'bearer',
      user_id: user._id.toString(),
      has_onboarded: Boolean(user.level),
    });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

