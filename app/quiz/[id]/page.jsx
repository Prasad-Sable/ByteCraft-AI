'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { submitQuiz } from '@/lib/api';
import axios from 'axios';
import confetti from 'canvas-confetti';

export default function QuizPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [lesson, setLesson] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLesson();
    }
  }, [id]);

  const fetchLesson = async () => {
    try {
      const res = await axios.get(`/api/lessons/${id}`);
      setLesson(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const quiz = lesson.quiz || [];
  const question = quiz[currentQ];
  const totalQuestions = quiz.length;
  const allAnswered = Object.keys(answers).length === totalQuestions;

  const selectAnswer = (optionIdx) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [currentQ]: optionIdx }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qIdx, optIdx]) => ({
        question_index: parseInt(qIdx, 10),
        selected_option: optIdx,
      }));
      const res = await submitQuiz({
        lesson_id: lesson._id,
        answers: formattedAnswers,
      });
      setResult(res.data);
      if (res.data.score >= 50) {
         try { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); } catch(e){}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Result screen
  if (result) {
    const isWin = result.score >= 80;
    const isPass = result.score >= 50;
    
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-scale-in">
        <div className="fun-card p-10 text-center relative overflow-hidden bg-white">
          <div className="absolute top-[-50px] right-[-50px] text-9xl opacity-10 rotate-12">{isWin ? '🏆' : isPass ? '👍' : '📚'}</div>
          
          <div className="text-8xl mb-6 relative z-10 animate-bounce-subtle">
            {isWin ? '🏆' : isPass ? '👏' : '🤔'}
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 mb-2 leading-tight">{isWin ? 'Amazing!' : isPass ? 'Good Job!' : 'Keep Trying!'}</h2>
          <p className="font-bold text-slate-500 mb-8">{result.feedback}</p>

          <div className={`p-6 rounded-3xl border-4 shadow-sm mb-8 relative z-10 ${
            isWin ? 'bg-green-100 border-green-300 text-green-700' :
            isPass ? 'bg-orange-100 border-orange-300 text-orange-700' :
            'bg-slate-100 border-slate-300 text-slate-700'
          }`}>
            <div className="text-6xl font-black mb-2">{Math.round(result.score)}%</div>
            <div className="text-lg font-bold opacity-80">{result.correct} out of {result.total} correct</div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-6 mb-10 relative z-10">
            <div className="bg-yellow-100 border-2 border-yellow-300 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-[0_4px_0_0_#fde047]">
              <span className="text-yellow-600 text-xl font-black">+{result.xp_earned} XP</span>
            </div>
            <div className="bg-orange-100 border-2 border-orange-300 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-[0_4px_0_0_#fdba74]">
              <span className="text-orange-600 text-xl font-black">🔥 {result.streak}</span>
            </div>
          </div>

          <div className="flex gap-4 relative z-10">
            <button
              onClick={() => router.push('/home')}
              className="w-1/3 btn-fun btn-outline text-lg"
            >
              Menu
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 btn-fun btn-primary text-lg"
            >
              See Stats 📊
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-scale-in">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()} 
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-200 text-slate-500 hover:text-blue-500 hover:border-blue-200 font-black text-2xl shadow-[0_4px_0_0_#e2e8f0] active:translate-y-1 active:shadow-[0_0px_0_0_#e2e8f0] transition-all"
        >
          ←
        </button>
        {/* Playful progress */}
        <div className="flex-1 max-w-[200px] bg-slate-200 h-6 rounded-full overflow-hidden border-2 border-slate-300 mx-4 relative">
           <div 
             className="h-full bg-blue-500 transition-all duration-300 shadow-[0_2px_0_0_rgba(255,255,255,0.4)_inset]"
             style={{ width: `${((currentQ) / totalQuestions) * 100}%` }}
           ></div>
        </div>
        <div className="font-black text-slate-400 text-lg">
           {currentQ + 1}/{totalQuestions}
        </div>
      </div>

      <div className="fun-card p-6 md:p-10 mb-8 bg-white text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-10 leading-snug">{question.question}</h2>

        <div className="space-y-4">
          {question.options.map((option, idx) => {
            const isSelected = answers[currentQ] === idx;
            return (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-5 ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-[0_4px_0_0_#3b82f6] translate-y-[-2px]'
                    : 'bg-white border-slate-200 text-slate-600 shadow-[0_4px_0_0_#e2e8f0] hover:bg-slate-50'
                }`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 border-2 ${
                  isSelected
                    ? 'bg-blue-500 border-blue-600 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-xl font-bold">{option.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between max-w-2xl mx-auto gap-4">
        <button
          onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
          className="w-1/3 btn-fun bg-white border-2 border-slate-200 text-slate-500 shadow-[0_5px_0_0_#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 active:translate-y-1 active:shadow-none"
        >
          Back
        </button>
        {currentQ < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentQ(prev => prev + 1)}
            disabled={!(currentQ in answers)}
            className="flex-1 btn-fun btn-primary disabled:bg-slate-300 disabled:shadow-[0_5px_0_0_#94a3b8] disabled:cursor-not-allowed"
          >
            Check ➔
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="flex-1 btn-fun btn-success disabled:bg-slate-300 disabled:shadow-[0_5px_0_0_#94a3b8] disabled:cursor-not-allowed"
          >
            {submitting ? 'Checking...' : 'Finish! 🎉'}
          </button>
        )}
      </div>
    </div>
  );
}

