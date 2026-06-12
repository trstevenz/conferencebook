import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Key, User, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, apiCall, theme } = useAuth();
  
  // Input fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Log In
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      login(data.token, {
        id: data.id,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        departmentName: data.departmentName
      });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-all ${
      theme === 'dark'
        ? "bg-gradient-to-tr from-[#050b18] via-[#0f172a] to-[#1e293b]"
        : "bg-gradient-to-tr from-slate-50 via-white to-orange-50/20"
    }`}>
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-600/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-900/10 dark:bg-blue-950/15 blur-3xl animate-pulse [animation-delay:2s]" />

      <div className="w-full max-w-md glass-panel rounded-3xl shadow-2xl p-8 z-10 transition-all border border-slate-200/60 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold font-outfit mt-4 text-primary-600">
            Smart Room Booker
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
            Access your workspace booking dashboard with your domain credentials
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5">
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="E.g., superadmin"
                className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                  theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                  theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <div className="p-4 bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl text-[10px] text-left border border-slate-200/40 dark:border-slate-800">
            <span className="font-bold text-primary-600 dark:text-primary-400 block mb-1">Standard Test Credentials:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
              <li>Super Admin: <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">superadmin</code> / <code className="font-mono">password123</code></li>
              <li>Facility Admin: <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">admin</code> / <code className="font-mono">password123</code></li>
              <li>Manager: <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">manager</code> / <code className="font-mono">password123</code></li>
              <li>Employee: <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">employee</code> / <code className="font-mono">password123</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
