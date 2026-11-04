import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const { interests, level } = await request.json();
    const db = await getDatabase();

    await db.collection('users').updateOne(
      { email: user.email },
      { $set: { interests: interests || [], level: level || 'Beginner' } }
    );

    return NextResponse.json({ message: 'Onboarding complete' });
  } catch (error) {
    console.error('Onboarding Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

