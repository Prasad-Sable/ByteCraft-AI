import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { evaluateQuizViaLLM } from '@/lib/gemini';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const { lesson_id, answers } = await request.json();
    const db = await getDatabase();

    let lesson;
    try {
      lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lesson_id) });
    } catch (e) {
      lesson = await db.collection('lessons').findOne({ _id: lesson_id });
    }

    if (!lesson) {
      return NextResponse.json({ detail: 'Lesson not found' }, { status: 404 });
    }

    const quiz = lesson.quiz || [];
    if (quiz.length === 0) {
      return NextResponse.json({ detail: 'No quiz for this lesson' }, { status: 400 });
    }

    const answersDicts = (answers || []).map(a => ({
      question_index: a.question_index,
      selected_option: a.selected_option,
    }));

    // AI evaluation
    const aiEval = await evaluateQuizViaLLM(lesson, answersDicts);

    let correct = 0;
    let total = quiz.length;
    let score = 0;
    let feedback = '';

    if (!aiEval) {
      answers.forEach(a => {
        if (a.question_index < quiz.length) {
          const q = quiz[a.question_index];
          const opts = q.options || [];
          if (a.selected_option < opts.length) {
            const isCorrectManual = opts[a.selected_option].is_correct || false;
            const isCorrectIndex = q.answer_index === a.selected_option;
            if (isCorrectManual || isCorrectIndex) {
              correct += 1;
            }
          }
        }
      });
      score = total > 0 ? (correct / total) * 100 : 0;
      feedback = score >= 50 ? '👍 Good job!' : '📚 Keep learning!';
    } else {
      correct = aiEval.total_correct || 0;
      total = aiEval.total_questions || quiz.length;
      score = parseFloat(aiEval.score_percentage || 0);
      feedback = aiEval.feedback || 'Excellent effort!';
    }

    // XP calculation
    let xp_earned = Math.floor(score * 0.5);
    if (score >= 100) xp_earned += 20;

    const userId = user._id.toString();
    const progressDoc = {
      user_id: userId,
      lesson_id: lesson_id,
      score: score,
      correct: correct,
      total: total,
      xp_earned: xp_earned,
      completed_at: new Date(),
    };

    const existingProgress = await db.collection('progress').findOne({
      user_id: userId,
      lesson_id: lesson_id,
    });

    if (existingProgress) {
      await db.collection('progress').updateOne(
        { _id: existingProgress._id },
        { $set: progressDoc }
      );
    } else {
      await db.collection('progress').insertOne(progressDoc);
    }

    // Save session
    await db.collection('sessions').insertOne({
      user_id: userId,
      time_spent: lesson.duration || 5,
      date: new Date(),
    });

    // Update user XP
    const userObjectId = new ObjectId(userId);
    await db.collection('users').updateOne(
      { _id: userObjectId },
      { $inc: { xp: xp_earned } }
    );

    // Update streak
    const now = new Date();
    const lastActive = user.last_active ? new Date(user.last_active) : null;
    let currentStreak = user.streak || 0;

    if (lastActive) {
      const msDiff = now.setHours(0, 0, 0, 0) - lastActive.setHours(0, 0, 0, 0);
      const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        currentStreak += 1;
      } else if (daysDiff > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    await db.collection('users').updateOne(
      { _id: userObjectId },
      { $set: { streak: currentStreak, last_active: new Date() } }
    );

    return NextResponse.json({
      score,
      correct,
      total,
      xp_earned,
      feedback,
      streak: currentStreak,
    });
  } catch (error) {
    console.error('Submit Quiz Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

