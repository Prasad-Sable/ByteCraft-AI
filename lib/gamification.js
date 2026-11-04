import { getDatabase } from './mongodb';

export const DEFAULT_BADGES = [
  { name: 'First Steps', description: 'Complete your first lesson.', icon: '🎓', condition_type: 'lessons_completed', condition_value: 1 },
  { name: 'Bookworm', description: 'Complete 10 lessons.', icon: '📚', condition_type: 'lessons_completed', condition_value: 10 },
  { name: 'On Fire', description: 'Reach a 3-day streak.', icon: '🔥', condition_type: 'streak', condition_value: 3 },
  { name: 'Perfect Score', description: 'Get 100% on a quiz.', icon: '⭐', condition_type: 'perfect_score', condition_value: 1 },
];

export const DAILY_QUESTS = [
  { title: 'Daily Learner', description: 'Complete 2 lessons today', target_value: 2, xp_reward: 50, condition_type: 'lessons_today' },
  { title: 'Perfect Accuracy', description: 'Get a 100% score on a quiz today', target_value: 1, xp_reward: 100, condition_type: 'perfect_score_today' },
];

export async function initializeQuests(userId) {
  const db = await getDatabase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const existing = await db.collection('quests').find({
    user_id: userId,
    date: { $gte: todayStart }
  }).toArray();

  if (existing.length === 0) {
    const newQuests = DAILY_QUESTS.map(q => ({
      ...q,
      user_id: userId,
      date: now,
      completed: false,
    }));
    await db.collection('quests').insertMany(newQuests);
  }
}

export async function getUserBadges(user) {
  const db = await getDatabase();
  const userId = user._id.toString();

  const progressRecords = await db.collection('progress').find({ user_id: userId }).toArray();
  const lessonsCompleted = progressRecords.length;
  const perfectScores = progressRecords.filter(p => p.score === 100).length;
  const streak = user.streak || 0;

  return DEFAULT_BADGES.map(badge => {
    let earned = false;
    if (badge.condition_type === 'lessons_completed' && lessonsCompleted >= badge.condition_value) {
      earned = true;
    } else if (badge.condition_type === 'streak' && streak >= badge.condition_value) {
      earned = true;
    } else if (badge.condition_type === 'perfect_score' && perfectScores >= badge.condition_value) {
      earned = true;
    }

    return {
      ...badge,
      _id: badge.name.toLowerCase().replace(/ /g, '_'),
      earned,
      ...(earned ? { earned_at: new Date() } : {}),
    };
  });
}

export async function getUserQuests(user) {
  const db = await getDatabase();
  const userId = user._id.toString();

  await initializeQuests(userId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const quests = await db.collection('quests').find({
    user_id: userId,
    date: { $gte: todayStart },
  }).toArray();

  const todayProgressCount = await db.collection('progress').countDocuments({
    user_id: userId,
    completed_at: { $gte: todayStart },
  });

  const todayPerfectCount = await db.collection('progress').countDocuments({
    user_id: userId,
    completed_at: { $gte: todayStart },
    score: 100,
  });

  return quests.map(q => {
    let current_val = 0;
    if (q.condition_type === 'lessons_today') {
      current_val = todayProgressCount;
    } else if (q.condition_type === 'perfect_score_today') {
      current_val = todayPerfectCount;
    }

    return {
      ...q,
      _id: q._id.toString(),
      current_value: current_val,
      completed: current_val >= q.target_value,
    };
  });
}

