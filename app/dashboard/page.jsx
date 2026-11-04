'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardAll } from '@/lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('dashboard_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed.stats);
          setBadges(parsed.badges || []);
          setQuests(parsed.quests || []);
          setLoading(false);
        } catch (e) {}
      }
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboardAll();
      const allData = res.data;
      setData(allData.stats);
      setBadges(allData.badges);
      setQuests(allData.quests);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard_cache', JSON.stringify(allData));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  const pieData = (data.topic_distribution || []).map(t => ({ name: t.topic, value: t.count, avgScore: t.avg_score }));
  const barData = (data.topic_distribution || []).map(t => ({ topic: t.topic, score: t.avg_score }));

  const level = Math.floor((data.xp || 0) / 100) + 1;
  const xpInLevel = (data.xp || 0) % 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-100 border-4 border-blue-200 rounded-2xl flex items-center justify-center text-4xl shadow-[0_4px_0_0_#bfdbfe] animate-bounce-subtle">
          🏆
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">Your Progress</h1>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Time', value: `${data.total_time}m`, icon: '⏱', style: 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-[0_5px_0_0_#c7d2fe]' },
          { label: 'Lessons', value: data.lessons_completed, icon: '📚', style: 'bg-pink-50 border-pink-200 text-pink-700 shadow-[0_5px_0_0_#fbcfe8]' },
          { label: 'Accuracy', value: `${data.accuracy}%`, icon: '🎯', style: 'bg-green-50 border-green-200 text-green-700 shadow-[0_5px_0_0_#bbf7d0]' },
          { label: 'Streak', value: `${data.streak} 🔥`, icon: '🔥', style: 'bg-orange-50 border-orange-200 text-orange-700 shadow-[0_5px_0_0_#fed7aa]' },
        ].map((stat, idx) => (
          <div key={idx} className={`fun-card p-5 md:p-6 border-2 flex flex-col items-center justify-center text-center animate-scale-in cursor-pointer active:translate-y-1 active:shadow-none transition-all ${stat.style}`}>
            <div className="text-3xl lg:text-4xl mb-2 filter drop-shadow-sm">{stat.icon}</div>
            <div className="text-2xl lg:text-3xl font-black">{stat.value}</div>
            <div className="text-sm font-bold opacity-80 uppercase tracking-wide mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Level / XP */}
      <div className="fun-card bg-amber-50 border-amber-200 p-6 md:p-8 mb-10 shadow-[0_6px_0_0_#fde68a] animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-400 border-2 border-amber-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-[0_3px_0_0_#d97706]">
              {level}
            </div>
            <div>
              <h3 className="font-black text-amber-800 text-xl">Level {level}</h3>
              <p className="font-bold text-amber-600 text-sm">Total XP: {data.xp}</p>
            </div>
          </div>
          <div className="font-black text-amber-500 bg-amber-100 px-4 py-2 rounded-xl border-2 border-amber-200 shadow-sm">
            {xpInLevel} / 100 XP
          </div>
        </div>
        <div className="w-full h-6 bg-amber-200 rounded-full overflow-hidden border-2 border-amber-300 shadow-inner p-1 relative">
           <div 
             className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_2px_0_0_rgba(255,255,255,0.4)_inset]"
             style={{ width: `${Math.max(5, xpInLevel)}%` }}
           ></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        
        {/* Daily Quests Board */}
        <div className="fun-card bg-white border-2 border-slate-200 p-6 md:p-8 shadow-[0_6px_0_0_#e2e8f0] animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">📜</div>
            <h3 className="text-2xl font-black text-slate-800">Daily Quests</h3>
          </div>
          <div className="space-y-4">
            {quests.length > 0 ? quests.map((q) => {
              const pct = Math.min(100, (q.current_value / q.target_value) * 100);
              return (
                <div key={q._id} className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${
                  q.completed ? 'bg-green-50 border-green-200 active:translate-y-1 active:shadow-none shadow-[0_4px_0_0_#bbf7d0]' : 'bg-slate-50 border-slate-200 active:translate-y-1 active:shadow-none shadow-[0_4px_0_0_#e2e8f0]'
                }`}>
                  <div className="flex justify-between items-start mb-3 border-b-2 border-transparent pb-1">
                    <div>
                      <h4 className={`font-black text-lg ${q.completed ? 'text-green-700' : 'text-slate-800'}`}>{q.title}</h4>
                      <p className={`text-sm font-bold ${q.completed ? 'text-green-600' : 'text-slate-500'}`}>{q.description}</p>
                    </div>
                    {q.completed ? (
                      <div className="text-xl">✅</div>
                    ) : (
                      <div className="bg-amber-100 text-amber-600 border-2 border-amber-200 text-sm font-black px-3 py-1 rounded-xl shadow-sm">
                        +{q.xp_reward} XP
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">
                      <span>Progress</span>
                      <span>{q.current_value} / {q.target_value}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${q.completed ? 'bg-green-500' : 'bg-blue-500'}`} 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-slate-400 font-bold border-4 border-dashed border-slate-200 rounded-3xl">
                You've cleared all quests for today!
              </div>
            )}
          </div>
        </div>

        {/* Badges Collection */}
        <div className="fun-card bg-white border-2 border-slate-200 p-6 md:p-8 shadow-[0_6px_0_0_#e2e8f0] animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">🏅</div>
            <h3 className="text-2xl font-black text-slate-800">Your Badges</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {badges.map((b) => (
              <div 
                key={b._id} 
                className={`p-4 rounded-3xl flex flex-col items-center justify-center text-center transition-all border-2 ${
                  b.earned 
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-[0_5px_0_0_#c7d2fe] hover:-translate-y-1' 
                    : 'bg-slate-50 border-slate-200 opacity-60 grayscale shadow-inner'
                }`}
              >
                <div className={`text-5xl mb-3 ${b.earned ? 'animate-bounce-subtle drop-shadow-md' : 'opacity-50'}`}>{b.icon}</div>
                <div className={`font-black text-sm mb-1 ${b.earned ? 'text-indigo-900' : 'text-slate-600'}`}>{b.name}</div>
                <div className={`text-xs font-bold leading-tight ${b.earned ? 'text-indigo-600' : 'text-slate-500'}`}>{b.description}</div>
              </div>
            ))}
            {badges.length === 0 && (
              <div className="col-span-2 text-center py-8 text-slate-400 font-bold border-4 border-dashed border-slate-200 rounded-3xl">
                Start learning to unlock badges!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="fun-card bg-white border-2 border-slate-200 p-6 md:p-8 shadow-[0_6px_0_0_#e2e8f0] animate-slide-up">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><div className="text-2xl">📊</div> Topic Mix</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '16px', fontWeight: 'bold', color: '#1e293b', boxShadow: '0 4px 0 0 #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400 font-bold">No data yet</div>
          )}
        </div>

        <div className="fun-card bg-white border-2 border-slate-200 p-6 md:p-8 shadow-[0_6px_0_0_#e2e8f0] animate-slide-up">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><div className="text-2xl">📈</div> Avg Score by Topic</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="topic" tick={{ fill: '#64748b', fontSize: 14, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 14, fontWeight: 'bold' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '16px', fontWeight: 'bold', boxShadow: '0 4px 0 0 #e2e8f0' }} />
                <Bar dataKey="score" fill="#3b82f6" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400 font-bold">No data yet</div>
          )}
        </div>
      </div>

    </div>
  );
}

