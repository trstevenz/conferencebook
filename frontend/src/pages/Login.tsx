import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Key, User, Mail, Building, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, apiCall, theme } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  
  // Input fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [departmentName, setDepartmentName] = useState('Engineering');
  
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch departments list for signup selection
    const fetchDepts = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/auth/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.map((d: any) => d.name));
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        // Sign Up
        await apiCall('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
            email,
            fullName,
            role,
            departmentName
          })
        });
        setSuccess('Account created successfully! You can now log in.');
        setIsRegister(false);
      } else {
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
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-all ${
      theme === 'dark'
        ? "bg-gradient-to-tr from-[#0b0f19] via-[#111827] to-[#1e1b4b]"
        : "bg-gradient-to-tr from-slate-100 via-indigo-50/50 to-purple-50"
    }`}>
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse [animation-delay:2s]" />

      <div className="w-full max-w-md glass-panel rounded-3xl shadow-2xl p-8 z-10 transition-all border">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold font-outfit mt-4 bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent">
            Smart Room Booker
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
            {isRegister ? 'Join our enterprise booking platform' : 'Access your workspace booking dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5">
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs flex items-center gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <>
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@company.com"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Role Type</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="FACILITY_ADMIN">Facility Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Department</label>
                  <select
                    value={departmentName}
                    onChange={e => setDepartmentName(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    {departments.length === 0 ? (
                      <option value="Engineering">Engineering</option>
                    ) : (
                      departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    )}
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>
            </>
          )}

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
                placeholder="superadmin"
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 hover:opacity-95 text-white text-sm font-semibold transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <span>{isRegister ? 'Already have an account?' : 'Need a test account?'} </span>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccess(null);
            }}
            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
          >
            {isRegister ? 'Sign In instead' : 'Register now'}
          </button>
          {!isRegister && (
            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800/40 rounded-xl text-[10px] text-left">
              <span className="font-bold text-primary-600 dark:text-primary-400">Standard Test Credentials:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Super Admin: <code className="font-mono">superadmin</code> / <code className="font-mono">password123</code></li>
                <li>Facility Admin: <code className="font-mono">admin</code> / <code className="font-mono">password123</code></li>
                <li>Manager: <code className="font-mono">manager</code> / <code className="font-mono">password123</code></li>
                <li>Employee: <code className="font-mono">employee</code> / <code className="font-mono">password123</code></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
