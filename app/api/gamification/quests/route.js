import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getUserQuests } from '@/lib/gamification';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const quests = await getUserQuests(user);
    return NextResponse.json(quests);
  } catch (error) {
    console.error('Get Quests Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

