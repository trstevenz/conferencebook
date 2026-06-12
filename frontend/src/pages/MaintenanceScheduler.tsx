import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Hammer, Plus, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Room {
  id: number;
  name: string;
  code: string;
}

interface MaintenanceSchedule {
  id: number;
  room: Room;
  startTime: string;
  endTime: string;
  description: string;
  createdAt: string;
}

export const MaintenanceScheduler: React.FC = () => {
  const { user, apiCall, theme } = useAuth();

  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomId, setRoomId] = useState<number>(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchSchedules();
    fetchRooms();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/api/admin/maintenance');
      setSchedules(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await apiCall('/api/rooms');
      setRooms(data);
      if (data.length > 0) setRoomId(data[0].id);
    } catch (err: any) {
      console.error('Failed to load rooms:', err);
    }
  };

  const handleOpenCreate = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setStartTime('');
    setEndTime('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      room: { id: roomId },
      startTime,
      endTime,
      description
    };

    try {
      await apiCall('/api/admin/maintenance', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSuccessMessage('Maintenance schedule logged successfully!');
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this maintenance schedule?')) return;
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await apiCall(`/api/admin/maintenance/${id}`, { method: 'DELETE' });
      setSuccessMessage('Maintenance cancelled and room released.');
      fetchSchedules();
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

      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="font-bold text-lg font-outfit">Maintenance Scheduling</h3>
          <p className="text-xs text-slate-400 mt-1">Block conference rooms for scheduled equipment upgrades or repairs.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-primary-500/25 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Log Schedule
        </button>
      </div>

      {/* List of Schedules */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              No rooms are currently scheduled for maintenance.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b dark:border-slate-800 text-xs text-slate-400 font-semibold h-12">
                  <th className="p-4 pl-6">Room Name</th>
                  <th className="p-4">Start Time</th>
                  <th className="p-4">End Time</th>
                  <th className="p-4">Maintenance notes</th>
                  <th className="p-4 pr-6 text-right font-outfit">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800 text-sm">
                {schedules.map(sch => (
                  <tr key={sch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-4 pl-6 font-bold">{sch.room.name}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(sch.startTime).toLocaleString()}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(sch.endTime).toLocaleString()}</td>
                    <td className="p-4 text-xs max-w-sm truncate">{sch.description}</td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDeleteSchedule(sch.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SCHEDULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 border ${
            theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <h4 className="text-xl font-bold font-outfit mb-6">Schedule Maintenance</h4>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Target Room</label>
                <select
                  value={roomId}
                  onChange={e => setRoomId(Number(e.target.value))}
                  className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Start Date/Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">End Date/Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Maintenance Agenda / Details</label>
                <textarea
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe maintenance scope (e.g. smart TV firmware upgrade)..."
                  rows={3}
                  className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div className="flex gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border dark:border-slate-700 rounded-2xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-primary-500/25"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
