import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query = {};
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;

    const db = await getDatabase();
    const cursor = db.collection('lessons').find(query).limit(limit);
    const rawLessons = await cursor.toArray();

    const lessons = rawLessons.map(l => ({
      ...l,
      _id: l._id.toString(),
    }));

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Get Lessons Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

