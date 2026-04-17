import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (userData: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onLogin(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-[56px] shadow-2xl overflow-hidden border border-[#5A5A40]/5 relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
        
        <div className="p-12 relative z-10">
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-block p-4 bg-[#f5f5f0] rounded-[24px] mb-6 shadow-inner"
            >
              <LogIn className="w-8 h-8 text-[#5A5A40]" />
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter text-[#5A5A40] mb-3">Vitality</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-[#5A5A40]/30">Your Elite Health Companion</p>
          </div>

          <div className="flex bg-[#f5f5f0] p-2 rounded-[28px] mb-10 shadow-inner">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${
                isLogin ? 'bg-white text-[#5A5A40] shadow-xl' : 'text-[#5A5A40]/40 hover:text-[#5A5A40]'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${
                !isLogin ? 'bg-white text-[#5A5A40] shadow-xl' : 'text-[#5A5A40]/40 hover:text-[#5A5A40]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-3 ml-4">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A5A40]/20" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f5f5f0] border-none rounded-[28px] py-6 pl-16 pr-6 text-[#5A5A40] font-black placeholder:text-[#5A5A40]/10 focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-inner"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-3 ml-4">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A5A40]/20" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f5f5f0] border-none rounded-[28px] py-6 pl-16 pr-6 text-[#5A5A40] font-black placeholder:text-[#5A5A40]/10 focus:ring-4 focus:ring-[#5A5A40]/5 transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 p-5 rounded-[24px] border border-red-100"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] text-white rounded-[32px] py-6 font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-2xl shadow-[#5A5A40]/30 hover:shadow-[#5A5A40]/40 transition-all disabled:opacity-50 mt-8"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </motion.button>
          </form>
        </div>

        <div className="bg-[#f5f5f0]/50 p-8 text-center border-t border-[#5A5A40]/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/40">
            {isLogin ? "New to Vitality?" : "Already a member?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#5A5A40] font-black hover:underline ml-1"
            >
              {isLogin ? 'Join the Elite' : 'Access Account'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
