import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDashboardData } from '@/lib/dashboard';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDashboardData(user);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

