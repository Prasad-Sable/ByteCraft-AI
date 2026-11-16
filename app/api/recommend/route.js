import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { generateLessonViaLLM } from '@/lib/gemini';

const DIFFICULTY_ORDER = ['Beginner', 'Intermediate', 'Advanced'];
const DEFAULT_TOPICS = ['Tech', 'Study', 'Fitness'];

export async function POST(request) {
  try {
    const body = await request.json();
    const available_time = body.available_time || 5;
    const reqTopics = body.topics;
    const custom_topic = body.custom_topic;

    const interests = (reqTopics && reqTopics.length > 0)
      ? reqTopics
      : DEFAULT_TOPICS;

    // Default to Beginner for public/guest users
    const target_difficulty = 'Beginner';

    // Pick topics
    let selected_topics = [];
    if (custom_topic) {
      selected_topics.push(custom_topic);
      const others = interests.filter(t => t !== custom_topic);
      if (others.length > 0) {
        selected_topics.push(others[Math.floor(Math.random() * others.length)]);
      }
    } else {
      const shuffled = [...interests].sort(() => 0.5 - Math.random());
      selected_topics = shuffled.slice(0, Math.min(2, shuffled.length));
    }

    // Generate AI lessons concurrently
    const db = await getDatabase();
    const generationPromises = selected_topics.map(async (topic) => {
      const lessonData = await generateLessonViaLLM(topic, target_difficulty, available_time);
      if (lessonData && lessonData.title && lessonData.content && lessonData.quiz) {
        const res = await db.collection('lessons').insertOne(lessonData);
        lessonData._id = res.insertedId.toString();
        return lessonData;
      }
      return null;
    });

    const generatedResults = await Promise.all(generationPromises);
    let recommended = generatedResults.filter(Boolean);

    // Fallback to DB lessons if generation failed
    if (recommended.length === 0) {
      const fallbackCursor = db.collection('lessons').find({
        duration: { $lte: available_time },
        topic: { $in: interests },
      }).limit(2);
      const fallbackList = await fallbackCursor.toArray();
      recommended = fallbackList.map(l => ({ ...l, _id: l._id.toString() }));
    }

    return NextResponse.json({
      recommendations: recommended,
      adaptive_info: {
        target_difficulty,
        avg_score: null,
        original_level: 'Guest',
      },
    });
  } catch (error) {
    console.error('Recommend Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}
