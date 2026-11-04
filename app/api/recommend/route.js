import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { generateLessonViaLLM } from '@/lib/gemini';

const DIFFICULTY_ORDER = ['Beginner', 'Intermediate', 'Advanced'];

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const available_time = body.available_time || 5;
    const reqTopics = body.topics;
    const custom_topic = body.custom_topic;

    let interests = (reqTopics && reqTopics.length > 0) ? reqTopics : (user.interests || ['Tech', 'Fitness', 'Study']);
    if (!interests || interests.length === 0) {
      interests = ['Tech', 'Fitness', 'Study'];
    }

    const level = user.level || 'Beginner';
    const db = await getDatabase();
    const userId = user._id.toString();

    // Completed lessons
    const progressRecords = await db.collection('progress').find({ user_id: userId }).toArray();
    const scores = progressRecords.map(p => p.score || 0);
    const avg_score = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 50;

    // Determine target difficulty
    let level_idx = DIFFICULTY_ORDER.indexOf(level);
    if (level_idx === -1) level_idx = 0;

    let target_difficulty = level;
    if (avg_score < 50 && level_idx > 0) {
      target_difficulty = DIFFICULTY_ORDER[level_idx - 1];
    } else if (avg_score >= 80 && level_idx < 2) {
      target_difficulty = DIFFICULTY_ORDER[level_idx + 1];
    }

    // Pick topics
    let selected_topics = [];
    if (custom_topic) {
      selected_topics.push(custom_topic);
      const otherTopics = interests.filter(t => t !== custom_topic);
      if (otherTopics.length > 0) {
        selected_topics.push(otherTopics[Math.floor(Math.random() * otherTopics.length)]);
      }
    } else {
      const shuffled = [...interests].sort(() => 0.5 - Math.random());
      selected_topics = shuffled.slice(0, Math.min(2, shuffled.length));
    }

    // Generate AI lessons concurrently
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

    // Fallback to database lessons if generation failed
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
        avg_score: Math.round(avg_score * 10) / 10,
        target_difficulty,
        original_level: level,
      },
    });
  } catch (error) {
    console.error('Recommend Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

