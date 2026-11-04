'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      login(res.data.access_token);
      if (res.data.has_onboarded) {
        router.push('/home');
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Playful Floating Elements Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-10">
        <div className="text-[20rem] font-bold text-blue-500 animate-float translate-x-[-50%] translate-y-[-20%]">B</div>
        <div className="text-[15rem] font-bold text-indigo-500 animate-float translate-x-[50%] translate-y-[30%] delay-500">C</div>
      </div>

      <div className="fun-card w-full max-w-md p-8 animate-scale-in relative z-10 bg-white shadow-xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-blue-100 flex items-center justify-center text-4xl shadow-sm border-2 border-blue-200 animate-bounce-subtle">
            🎓
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Welcome Back!</h1>
          <p className="text-slate-500 mt-2 font-bold">Ready to learn something new?</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-100 border-2 border-red-300 text-red-700 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-fun btn-primary h-14"
          >
            {loading ? 'Please Wait...' : 'Log In! 🚀'}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-8 font-bold">
          New here?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-500 hover:underline decoration-4 underline-offset-4 transition-all">
            Join the fun
          </Link>
        </p>
      </div>
    </div>
  );
}

