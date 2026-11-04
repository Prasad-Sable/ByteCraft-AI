import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getUserBadges } from '@/lib/gamification';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const badges = await getUserBadges(user);
    return NextResponse.json(badges);
  } catch (error) {
    console.error('Get Badges Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

