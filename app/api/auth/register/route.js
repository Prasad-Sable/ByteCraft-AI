import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ detail: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ detail: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = await getDatabase();
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return NextResponse.json({ detail: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const userDoc = {
      name,
      email,
      password: hashedPassword,
      level: null,
      interests: [],
      xp: 0,
      streak: 0,
      last_active: null,
      created_at: new Date(),
    };

    const result = await db.collection('users').insertOne(userDoc);
    const token = createToken({ sub: email });

    return NextResponse.json({
      access_token: token,
      token_type: 'bearer',
      user_id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

