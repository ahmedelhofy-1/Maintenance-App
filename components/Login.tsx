
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for realistic feel
    setTimeout(() => {
      const user = users.find(u => 
        (u.email.toLowerCase() === email.toLowerCase() || u.id.toLowerCase() === email.toLowerCase()) && 
        u.password === password
      );

      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Please check your Email/ID and Password.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="bg-blue-600 p-3 rounded-xl font-bold text-2xl text-white shadow-lg shadow-blue-500/20">MX</div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">MaintenX</h1>
          </div>
          <h2 className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Asset Management Portal</h2>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Identity (Email or ID)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">👤</span>
                <input
                  type="text"
                  required
                  placeholder="Admin"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Access Key</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔑</span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all shadow-xl ${
                isLoading 
                  ? 'bg-slate-800 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : 'Secure Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Restricted Access System • V4.2.0
            </p>
          </div>
        </div>

        {/* Demo Hint */}
        <div className="mt-8 bg-slate-900/20 p-4 rounded-2xl border border-slate-800/30">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 text-center">Demo Credentials</p>
          <div className="flex justify-center gap-4 text-[9px] font-mono text-slate-500">
            <span>Admin: Admin / Admin</span>
            <span>Manager: Sarah Smith / manager</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
