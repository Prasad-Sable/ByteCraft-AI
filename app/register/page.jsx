'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await registerUser({ name, email, password });
      login(res.data.access_token);
      router.push('/onboarding');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="fun-card w-full max-w-md p-8 animate-scale-in relative z-10 bg-white shadow-xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-pink-100 flex items-center justify-center text-4xl shadow-sm border-2 border-pink-200 animate-bounce-subtle">
            ✨
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Account</h1>
          <p className="text-slate-500 mt-2 font-bold">Start your learning adventure with ByteCraft AI</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-100 border-2 border-red-300 text-red-700 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">What should we call you?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-all font-semibold"
              placeholder="Your Name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-all font-semibold"
              placeholder="you@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Secret Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-all font-semibold"
              placeholder="6+ characters"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-fun btn-secondary h-14 mt-4"
          >
            {loading ? 'Creating...' : "Let's Go! 🎉"}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-8 font-bold">
          Been here before?{' '}
          <Link href="/login" className="text-pink-600 hover:text-pink-500 hover:underline decoration-4 underline-offset-4 transition-all">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

