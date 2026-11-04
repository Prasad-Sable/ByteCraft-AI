'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardUser } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const INTERESTS = ['Sports', 'Study', 'Music', 'Tech', 'Fitness', 'Communication'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const INTEREST_ICONS = {
  Sports: '⚽', Study: '📖', Music: '🎵', Tech: '💻', Fitness: '💪', Communication: '🗣️'
};
const LEVEL_ICONS = { Beginner: '🌱', Intermediate: '🌿', Advanced: '🌳' };

export default function Onboarding() {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchUser } = useAuth();

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    if (selectedInterests.length === 0 || !selectedLevel) return;
    setLoading(true);
    try {
      await onboardUser({ interests: selectedInterests, level: selectedLevel });
      await fetchUser();
      router.push('/home');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-12 px-4 bg-blue-50">
      <div className="w-full max-w-xl">
        {/* Playful Progress indicator */}
        <div className="flex items-center justify-between mb-12 relative px-8">
          <div className="absolute top-1/2 left-8 right-8 h-3 bg-slate-200 rounded-full -z-10 -translate-y-1/2 overflow-hidden shadow-inner">
             <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: step === 2 ? '100%' : '0%' }}></div>
          </div>
          
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black transition-all border-4 ${step >= 1 ? 'bg-white border-blue-500 text-blue-500 shadow-[0_4px_0_0_#3b82f6]' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>1</div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black transition-all border-4 ${step >= 2 ? 'bg-white border-blue-500 text-blue-500 shadow-[0_4px_0_0_#3b82f6]' : 'bg-slate-100 border-slate-300 text-slate-400 text-shadow-none'}`}>2</div>
        </div>

        {step === 1 ? (
          <div className="animate-scale-in text-center">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">What do you like?</h2>
            <p className="text-slate-500 font-bold mb-10 text-lg">Pick the topics you want to learn about.</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`fun-card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    selectedInterests.includes(interest) 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-[0_4px_0_0_#3b82f6]' 
                      : 'border-slate-200 bg-white text-slate-600 shadow-[0_4px_0_0_#e2e8f0]'
                  }`}
                  style={{ transform: selectedInterests.includes(interest) ? 'translateY(2px)' : 'none' }}
                >
                  <span className="text-4xl">{INTEREST_ICONS[interest]}</span>
                  <span className="font-bold">{interest}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={selectedInterests.length === 0}
              className="w-full btn-fun btn-primary h-16 text-xl disabled:bg-slate-300 disabled:shadow-[0_5px_0_0_#94a3b8] disabled:cursor-not-allowed"
            >
              Continue ➔
            </button>
          </div>
        ) : (
          <div className="animate-scale-in text-center">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">What's your level?</h2>
            <p className="text-slate-500 font-bold mb-10 text-lg">Don't worry, you can always change later.</p>

            <div className="space-y-4 mb-10 text-left">
              {LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`fun-card w-full p-5 flex items-center gap-5 transition-all text-left ${
                    selectedLevel === level
                      ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-[0_4px_0_0_#ec4899] translate-y-[2px]'
                      : 'border-slate-200 bg-white text-slate-600 shadow-[0_4px_0_0_#e2e8f0]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-3xl shadow-sm">
                    {LEVEL_ICONS[level]}
                  </div>
                  <div>
                    <div className="font-extrabold text-xl mb-1">{level}</div>
                    <div className="text-sm font-bold opacity-75">
                      {level === 'Beginner' && 'I am just starting out.'}
                      {level === 'Intermediate' && 'I know some basics.'}
                      {level === 'Advanced' && 'Give me a challenge!'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 btn-fun btn-outline h-16 text-xl"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!selectedLevel || loading}
                className="flex-1 btn-fun btn-success h-16 text-xl disabled:bg-slate-300 disabled:shadow-[0_5px_0_0_#94a3b8] disabled:cursor-not-allowed"
              >
                {loading ? 'Wait...' : 'Start Playing! 🎯'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

