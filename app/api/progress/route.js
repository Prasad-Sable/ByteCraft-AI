import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const { lesson_id, score, time_spent } = await request.json();
    const userId = user._id.toString();
    const db = await getDatabase();

    const progressDoc = {
      user_id: userId,
      lesson_id: lesson_id,
      score: score || 0,
      completed_at: new Date(),
    };

    const existing = await db.collection('progress').findOne({
      user_id: userId,
      lesson_id: lesson_id,
    });

    if (existing) {
      await db.collection('progress').updateOne(
        { _id: existing._id },
        { $set: progressDoc }
      );
    } else {
      await db.collection('progress').insertOne(progressDoc);
    }

    await db.collection('sessions').insertOne({
      user_id: userId,
      time_spent: time_spent || 5,
      date: new Date(),
    });

    return NextResponse.json({ message: 'Progress recorded' });
  } catch (error) {
    console.error('Record Progress Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

