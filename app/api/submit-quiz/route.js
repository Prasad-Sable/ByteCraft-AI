import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { evaluateQuizViaLLM } from '@/lib/gemini';

export async function POST(request) {
  try {
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
            if (isCorrectManual || isCorrectIndex) correct += 1;
          }
        }
      });
      score = total > 0 ? (correct / total) * 100 : 0;
      feedback = score >= 50 ? '👍 Good job!' : '📚 Keep going!';
    } else {
      correct = aiEval.total_correct || 0;
      total = aiEval.total_questions || quiz.length;
      score = parseFloat(aiEval.score_percentage || 0);
      feedback = aiEval.feedback || 'Excellent effort!';
    }

    // XP calculation (shown to user, not saved for guests)
    let xp_earned = Math.floor(score * 0.5);
    if (score >= 100) xp_earned += 20;

    return NextResponse.json({
      score,
      correct,
      total,
      xp_earned,
      feedback,
      streak: 0,
    });
  } catch (error) {
    console.error('Submit Quiz Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}
