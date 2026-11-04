'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function LessonPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(0);
  const [readComplete, setReadComplete] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLesson();
    }
  }, [id]);

  useEffect(() => {
    if (!lesson) return;
    const totalTime = (lesson.duration || 5) * 60 * 10;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setReadComplete(true);
          return 100;
        }
        return prev + 1;
      });
    }, totalTime / 100);
    return () => clearInterval(interval);
  }, [lesson]);

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

  const sections = (lesson.content || '').split('\n\n');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-scale-in">
      {/* Header Back Button */}
      <button 
        onClick={() => router.push('/home')} 
        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-200 text-slate-500 hover:text-blue-500 hover:border-blue-200 mb-6 font-black text-2xl shadow-[0_4px_0_0_#e2e8f0] active:translate-y-1 active:shadow-[0_0px_0_0_#e2e8f0] transition-all"
        title="Go Back"
      >
        ←
      </button>

      {/* Progress Appears at top floating */}
      <div className="sticky top-6 z-50 mb-8 bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]">
        <div className="flex justify-between text-sm font-black text-slate-500 mb-2 px-1">
          <span className="text-blue-500 uppercase tracking-widest text-xs">Reading Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar-container h-4">
          <div
            className="progress-bar-fill shadow-[0_2px_0_0_rgba(255,255,255,0.3)_inset]"
            style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#10b981' : '#3b82f6' }}
          ></div>
        </div>
      </div>

      <div className="fun-card bg-white p-6 md:p-10 mb-8">
        {/* Topic & difficulty badge */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="px-3 py-1.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-black uppercase text-xs tracking-wider shadow-[0_2px_0_0_#bfdbfe]">{lesson.topic}</span>
          <span className={`px-3 py-1.5 rounded-xl border-2 font-black uppercase text-xs tracking-wider ${
            lesson.difficulty === 'Beginner' ? 'bg-green-50 border-green-200 text-green-700 shadow-[0_2px_0_0_#bbf7d0]' :
            lesson.difficulty === 'Intermediate' ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-[0_2px_0_0_#fed7aa]' :
            'bg-red-50 border-red-200 text-red-700 shadow-[0_2px_0_0_#fecaca]'
          }`}>{lesson.difficulty}</span>
          <span className="text-slate-400 font-bold text-sm bg-slate-100 border-2 border-slate-200 rounded-xl px-3 py-1.5 shadow-[0_2px_0_0_#e2e8f0]">⏱ {lesson.duration}m</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight mb-8">
          {lesson.title}
        </h1>

        {/* Content */}
        <div className="prose prose-lg prose-slate max-w-none prose-headings:font-black prose-p:font-semibold prose-p:text-slate-600 prose-ul:font-bold">
          {sections.map((section, idx) => {
            if (section.startsWith('## ')) {
              return <h2 key={idx} className="text-2xl mt-8 mb-4 text-blue-600 border-b-2 border-blue-100 pb-2">{section.replace('## ', '')}</h2>;
            }
            if (section.startsWith('### ')) {
              return <h3 key={idx} className="text-xl mt-6 mb-3 text-slate-700 bg-slate-50 inline-block px-3 py-1 rounded-lg border-2 border-slate-200">{section.replace('### ', '')}</h3>;
            }
            if (section.startsWith('1.') || section.startsWith('- ')) {
              const items = section.split('\n');
              return (
                <ul key={idx} className="list-disc list-inside space-y-3 mb-6 bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 shadow-sm text-slate-700">
                  {items.map((item, i) => (
                    <li key={i} className="pl-2">{item.replace(/^[\d]+\.\s*/, '').replace(/^-\s*/, '')}</li>
                  ))}
                </ul>
              );
            }
            return <p key={idx} className="text-lg leading-relaxed mb-6">{section}</p>;
          })}
        </div>
      </div>

      {/* Take Quiz button */}
      <div className="text-center sticky bottom-6 pb-6">
        <button
          onClick={() => router.push(`/quiz/${lesson._id}`)}
          disabled={!readComplete && progress < 50}
          className={`w-full max-w-md mx-auto btn-fun h-20 text-2xl transition-all ${
            readComplete || progress >= 50
              ? 'btn-success animate-bounce-subtle shadow-[0_8px_0_0_#059669]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300 shadow-[0_8px_0_0_#cbd5e1]'
          }`}
          style={{ transform: !readComplete && progress < 50 ? 'none' : '' }}
        >
          {readComplete 
            ? '🎯 Start Quiz!' 
            : progress >= 50 
              ? '🎯 Start Quiz (Skip early)' 
              : `Wait... Reading (${progress}%)`}
        </button>
      </div>
    </div>
  );
}

