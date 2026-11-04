import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

export async function getDashboardData(user) {
  const db = await getDatabase();
  const userId = user._id.toString();

  const progressRecords = await db.collection('progress').find({ user_id: userId }).toArray();
  const sessions = await db.collection('sessions').find({ user_id: userId }).toArray();

  let total_time = 0;
  sessions.forEach(s => {
    total_time += s.time_spent || 0;
  });

  const lessons_completed = progressRecords.length;
  const total_score = progressRecords.reduce((acc, p) => acc + (p.score || 0), 0);
  const accuracy = lessons_completed > 0 ? Math.round((total_score / lessons_completed) * 10) / 10 : 0;

  // Topic stats
  const topicStats = {};
  for (const p of progressRecords) {
    let lesson = null;
    try {
      lesson = await db.collection('lessons').findOne({ _id: new ObjectId(p.lesson_id) });
    } catch (e) {
      lesson = await db.collection('lessons').findOne({ _id: p.lesson_id });
    }

    if (lesson && lesson.topic) {
      if (!topicStats[lesson.topic]) {
        topicStats[lesson.topic] = { count: 0, total_score: 0 };
      }
      topicStats[lesson.topic].count += 1;
      topicStats[lesson.topic].total_score += p.score || 0;
    }
  }

  const topic_distribution = [];
  const weak_areas = [];

  Object.entries(topicStats).forEach(([topic, stats]) => {
    const avg = stats.count > 0 ? Math.round((stats.total_score / stats.count) * 10) / 10 : 0;
    topic_distribution.push({
      topic,
      count: stats.count,
      avg_score: avg,
    });
    if (avg < 60) {
      weak_areas.push(topic);
    }
  });

  // Fresh user XP & streak
  const freshUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  const streak = freshUser?.streak || 0;
  const xp = freshUser?.xp || 0;

  return {
    total_time,
    lessons_completed,
    accuracy,
    streak,
    xp,
    topic_distribution,
    weak_areas,
  };
}

