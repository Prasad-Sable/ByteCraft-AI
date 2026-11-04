import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const userId = user._id.toString();
    const interests = user.interests || [];
    const level = user.level || 'Beginner';
    const db = await getDatabase();

    const progressRecords = await db.collection('progress').find({ user_id: userId }).toArray();
    const completedIds = new Set(progressRecords.map(p => p.lesson_id));

    const query = { difficulty: level };
    if (interests.length > 0) {
      query.topic = { $in: interests };
    }

    const cursor = db.collection('lessons').find(query).limit(10);
    const candidateLessons = await cursor.toArray();

    let nextLesson = null;
    for (const l of candidateLessons) {
      const lid = l._id.toString();
      if (!completedIds.has(lid)) {
        nextLesson = { ...l, _id: lid };
        break;
      }
    }

    if (!nextLesson) {
      const fallbackList = await db.collection('lessons').find({}).limit(50).toArray();
      for (const l of fallbackList) {
        const lid = l._id.toString();
        if (!completedIds.has(lid)) {
          nextLesson = { ...l, _id: lid };
          break;
        }
      }
    }

    return NextResponse.json({ lesson: nextLesson });
  } catch (error) {
    console.error('Continue Learning Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

