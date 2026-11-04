'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendations, getContinue } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const TIME_OPTIONS = [5, 10, 15];
const TOPIC_COLORS = {
  Sports: 'border-green-500 bg-green-50 text-green-700',
  Study: 'border-blue-500 bg-blue-50 text-blue-700',
  Music: 'border-pink-500 bg-pink-50 text-pink-700',
  Tech: 'border-purple-500 bg-purple-50 text-purple-700',
  Fitness: 'border-orange-500 bg-orange-50 text-orange-700',
  Communication: 'border-cyan-500 bg-cyan-50 text-cyan-700',
};
const TOPIC_ICONS = {
  Sports: '⚽', Study: '📖', Music: '🎵', Tech: '💻', Fitness: '💪', Communication: '🗣️'
};
const ALL_TOPICS = ['Sports', 'Study', 'Music', 'Tech', 'Fitness', 'Communication'];

export default function Home() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customTime, setCustomTime] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [adaptiveInfo, setAdaptiveInfo] = useState(null);
  const [continueLesson, setContinueLesson] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.interests) {
      setSelectedTopics(user.interests);
    }
    fetchContinue();
  }, [user]);

  const fetchContinue = async () => {
    try {
      const res = await getContinue();
      setContinueLesson(res.data.lesson);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendations = async (time, explicitTopic = null) => {
    setLoading(true);
    setRecommendations([]);
    try {
      const res = await getRecommendations({ 
        available_time: time,
        topics: selectedTopics.length > 0 ? selectedTopics : undefined,
        custom_topic: explicitTopic || customTopic || undefined
      });
      setRecommendations(res.data.recommendations);
      setAdaptiveInfo(res.data.adaptive_info);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setCustomTime('');
    fetchRecommendations(time);
  };

  const handleCustomTime = () => {
    const t = parseInt(customTime, 10);
    if (t > 0 && t <= 60) {
      setSelectedTime(t);
      fetchRecommendations(t);
    }
  };

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-10 text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-2">
          Hi, {user?.name?.split(' ')[0] || 'Learner'}! 👋
        </h1>
        <p className="text-slate-500 font-bold text-xl">What are we learning today on ByteCraft AI?</p>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-8">
        
        {/* Left Column: Flow Context / Settings */}
        <div className="space-y-6">
          
          {/* AI Settings / Topics */}
          <div className="fun-card p-6 bg-purple-50 border-purple-300 animate-scale-in flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-2xl animate-float">🤖</span> AI Engine
            </h2>
            <p className="text-sm font-bold text-slate-500 mb-4">Choose what to learn next:</p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              {ALL_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-sm transition-all border-2 ${
                    selectedTopics.includes(topic)
                      ? 'bg-purple-500 border-purple-600 text-white shadow-[0_3px_0_0_#9333ea] translate-y-[-1px]'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-[0_3px_0_0_#e2e8f0]'
                  }`}
                >
                  {TOPIC_ICONS[topic]} {topic}
                </button>
              ))}
            </div>

            <div className="mt-4 w-full border-t border-purple-200 pt-4">
              <p className="text-xs font-bold text-slate-400 mb-2">Or learn something specific:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Enter any topic..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-800 font-bold placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all text-sm"
                />
                {customTopic && (
                  <button
                    onClick={() => {
                        if (selectedTime) fetchRecommendations(selectedTime);
                        else setSelectedTime(null);
                    }}
                    className={`btn-fun text-xs px-3 py-1 ${selectedTime ? 'btn-primary' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    disabled={!selectedTime}
                  >
                    Go
                  </button>
                )}
              </div>
            </div>
            {selectedTopics.length === 0 && (
              <p className="text-xs text-orange-500 font-bold mt-2">Select at least one topic for best results!</p>
            )}
          </div>

          {/* Time Picker */}
          <div className="fun-card p-6 bg-yellow-50 border-yellow-300 animate-slide-up flex flex-col items-center text-center">
            <div className="text-4xl mb-3 animate-float delay-100">⏳</div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Set your Time</h2>
            
            <div className="flex flex-col gap-3 w-full">
              {TIME_OPTIONS.map(time => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`py-3 px-4 rounded-2xl font-black text-lg transition-all border-2 text-left flex items-center justify-between ${
                    selectedTime === time
                      ? 'bg-blue-500 border-blue-600 text-white shadow-[0_4px_0_0_#2563eb] translate-y-[-2px]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-[0_4px_0_0_#e2e8f0]'
                  }`}
                >
                  <span>{time} Minutes</span>
                  {selectedTime === time && <span>✓</span>}
                </button>
              ))}
            </div>

            <div className="mt-4 w-full">
               <div className="flex gap-2">
                 <input
                   type="number"
                   value={customTime}
                   onChange={(e) => setCustomTime(e.target.value)}
                   placeholder="Custom (m)"
                   className="flex-1 w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-800 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all text-center"
                   min="1" max="60"
                 />
                 <button
                   onClick={handleCustomTime}
                   className="btn-fun btn-primary px-4 shadow-[0_4px_0_0_#2563eb]"
                 >
                   Go
                 </button>
               </div>
            </div>
            
            <button
               onClick={() => handleTimeSelect(5)}
               className="mt-6 w-full btn-fun btn-accent text-sm py-2 px-3 shadow-[0_4px_0_0_#d97706]"
             >
               ⚡ Quick 5-min
             </button>
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="space-y-6">
          
          {/* Continue Learning */}
          {continueLesson && !loading && recommendations.length === 0 && (
            <div 
              className="fun-card p-6 bg-indigo-50 border-indigo-200 animate-slide-up cursor-pointer hover:bg-indigo-100 transition-colors shadow-[0_4px_0_0_#c7d2fe]"
              onClick={() => router.push(`/lesson/${continueLesson._id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-block px-3 py-1 bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl mb-3 shadow-[0_2px_0_0_#4338ca]">Pick Up Where You Left Off</div>
                  <div className="text-2xl font-black text-slate-800 leading-tight">{continueLesson.title}</div>
                  <div className="flex items-center gap-3 mt-3 text-sm font-bold text-slate-500">
                    <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border-2 border-slate-100">{TOPIC_ICONS[continueLesson.topic]} {continueLesson.topic}</span>
                    <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border-2 border-slate-100">⏱ {continueLesson.duration}m</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-indigo-500 font-black text-2xl shadow-sm border-2 border-indigo-100">
                  ▶
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Area */}
          <div>
            {!selectedTime && !loading && (
              <div className="h-48 border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold p-6 text-center">
                <div className="text-5xl mb-3 opacity-50">👇</div>
                Select a time limit on the left to see lessons.
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="text-6xl animate-bounce-subtle mb-4">🤔</div>
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold text-lg">Thinking of the best lessons with ByteCraft AI...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-black text-slate-800">Your Path</h2>
                  {adaptiveInfo && (
                    <span className="bg-purple-100 border-2 border-purple-200 text-purple-700 font-bold px-3 py-1 rounded-xl text-sm shadow-sm inline-flex items-center gap-1">
                      🧠 Auto-adjusted ({adaptiveInfo.target_difficulty})
                    </span>
                  )}
                </div>
                
                {recommendations.map((lesson, idx) => (
                  <div
                    key={lesson._id}
                    onClick={() => router.push(`/lesson/${lesson._id}`)}
                    className="fun-card fun-card-hover p-5 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 ${TOPIC_COLORS[lesson.topic] || 'bg-slate-100 border-slate-200'}`}>
                        {TOPIC_ICONS[lesson.topic]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1 leading-snug">{lesson.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg">⏱ {lesson.duration}m</span>
                          <span className={`px-2.5 py-1 rounded-lg ${
                            lesson.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                            lesson.difficulty === 'Intermediate' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>{lesson.difficulty}</span>
                          <span className="hidden sm:inline bg-slate-100 px-2.5 py-1 rounded-lg">{lesson.quiz?.length || 0} Qs</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-300 font-black text-2xl pl-2">
                      ➔
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedTime && !loading && (
              <div className="text-center py-20 fun-card bg-slate-50">
                <div className="text-6xl mb-4 opacity-50">🤷</div>
                <p className="text-slate-500 font-bold text-lg">No lessons found exactly matching your time.<br/>Try a longer duration!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

