import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle2, Shield, Calendar, Clock, User, XCircle, CheckCircle } from 'lucide-react';

interface Room {
  id: number;
  name: string;
}

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
}

interface Booking {
  id: number;
  room: Room;
  user: UserProfile;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  checkInStatus: string;
}

export const TeamBookings: React.FC = () => {
  const { apiCall, user } = useAuth();
  
  const [teamBookings, setTeamBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamBookings();
  }, []);

  const fetchTeamBookings = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/api/manager/bookings/team');
      setTeamBookings(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      const response = await apiCall(`/api/manager/bookings/${id}/approve`, {
        method: 'POST'
      });
      setSuccessMessage(`Approved booking "${response.title}" successfully.`);
      fetchTeamBookings();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      const response = await apiCall(`/api/manager/bookings/${id}/reject`, {
        method: 'POST'
      });
      setSuccessMessage(`Rejected booking "${response.title}".`);
      fetchTeamBookings();
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
          <CheckCircle className="h-4.5 w-4.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4.5">
        <div className="p-3.5 rounded-xl bg-primary-500/10 text-primary-600">
          <Shield className="h-5.5 w-5.5" />
        </div>
        <div>
          <h3 className="font-bold text-lg font-outfit">Team Overrides & Approvals</h3>
          <p className="text-xs text-slate-400 mt-1">Review, approve, or reject booking override requests for restricted conference rooms in your department.</p>
        </div>
      </div>

      {/* Team Bookings List */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : teamBookings.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              No active team bookings registered under your department ({user?.departmentName}).
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b dark:border-slate-800 text-xs text-slate-400 font-semibold h-12">
                  <th className="p-4 pl-6">Meeting Details</th>
                  <th className="p-4">Requested Room</th>
                  <th className="p-4">Organizer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right font-outfit">Approvals override</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800 text-sm">
                {teamBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    {/* Title & Time */}
                    <td className="p-4 pl-6">
                      <p className="font-bold">{b.title}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Room */}
                    <td className="p-4 text-xs font-semibold">{b.room.name}</td>

                    {/* User */}
                    <td className="p-4">
                      <p className="font-semibold text-xs">{b.user.fullName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{b.user.username}</span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                        b.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : b.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      {b.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleReject(b.id)}
                            className="px-3 py-1.5 border border-rose-500 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(b.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
