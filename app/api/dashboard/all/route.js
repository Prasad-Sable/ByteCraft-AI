import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDashboardData } from '@/lib/dashboard';
import { getUserBadges, getUserQuests } from '@/lib/gamification';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const [stats, badges, quests] = await Promise.all([
      getDashboardData(user),
      getUserBadges(user),
      getUserQuests(user),
    ]);

    return NextResponse.json({
      stats,
      badges,
      quests,
    });
  } catch (error) {
    console.error('Dashboard All Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

