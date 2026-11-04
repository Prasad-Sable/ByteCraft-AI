import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    let lesson = null;
    try {
      lesson = await db.collection('lessons').findOne({ _id: new ObjectId(id) });
    } catch (e) {
      lesson = await db.collection('lessons').findOne({ _id: id });
    }

    if (!lesson) {
      return NextResponse.json({ detail: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...lesson,
      _id: lesson._id.toString(),
    });
  } catch (error) {
    console.error('Get Lesson By ID Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

