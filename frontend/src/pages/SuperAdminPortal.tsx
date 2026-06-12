import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle2, User, Key, Shield, Clock, FileSpreadsheet } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: { id: number; name: string };
}

interface AuditLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}

export const SuperAdminPortal: React.FC = () => {
  const { apiCall, theme } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      if (activeTab === 'users') {
        const usersData = await apiCall('/api/auth/users');
        setUsers(usersData);
      } else {
        const logsData = await apiCall('/api/superadmin/audit-logs');
        setLogs(logsData);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId: number, newRole: string) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await apiCall(`/api/superadmin/users/${targetUserId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      setSuccessMessage('User role updated successfully!');
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteUser = async (targetUserId: number) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await apiCall(`/api/superadmin/users/${targetUserId}`, {
        method: 'DELETE'
      });
      setSuccessMessage('User account deleted.');
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5">
          <ShieldAlert className="h-4.5 w-4.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs flex items-center gap-2.5">
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-sm font-bold font-outfit border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          User Database
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 text-sm font-bold font-outfit border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          System Audit Trail
        </button>
      </div>

      {activeTab === 'users' ? (
        /* User Database View */
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b dark:border-slate-800 text-xs text-slate-400 font-semibold h-12">
                    <th className="p-4 pl-6">Name / Username</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Access Role</th>
                    <th className="p-4 pr-6 text-right font-outfit">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800 text-sm">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="p-4 pl-6">
                        <p className="font-bold">{u.fullName}</p>
                        <span className="text-xs text-slate-400 font-mono mt-0.5 block">{u.username}</span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">{u.email}</td>
                      <td className="p-4 font-semibold text-xs">{u.department?.name || 'Unassigned'}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className={`rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none border ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="MANAGER">Manager</option>
                          <option value="FACILITY_ADMIN">Facility Admin</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold transition-all"
                        >
                          Delete Account
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Audit Logs View */
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b dark:border-slate-800 text-xs text-slate-400 font-semibold h-12">
                    <th className="p-4 pl-6">Timestamp</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Action Event</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4 pr-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800 text-xs text-slate-500">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="p-4 pl-6 font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{log.username}</p>
                        <span className="text-[10px] text-slate-400">ID: {log.userId || 'System'}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono text-[10px] uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[10px]">{log.ipAddress}</td>
                      <td className="p-4 pr-6 leading-relaxed max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
