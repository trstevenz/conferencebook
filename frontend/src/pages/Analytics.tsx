import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, PieChart, Users, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface UtilizationReport {
  roomUsage: Record<string, number>;
  departmentUsage: Record<string, number>;
  peakHours: Record<string, number>;
  checkInStats: {
    noShows: number;
    checkedIn: number;
    pending: number;
  };
}

export const Analytics: React.FC = () => {
  const { apiCall, theme } = useAuth();
  
  const [report, setReport] = useState<UtilizationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/api/reports/utilization');
      setReport(data);
    } catch (err) {
      console.error('Failed to load utilization reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Room Usage calculation
  const roomEntries = Object.entries(report.roomUsage);
  const maxRoomBookings = Math.max(...roomEntries.map(([_, v]) => v), 1);

  // Department Usage calculation
  const deptEntries = Object.entries(report.departmentUsage);
  const maxDeptBookings = Math.max(...deptEntries.map(([_, v]) => v), 1);

  // Peak Hours calculation
  const hourEntries = Object.entries(report.peakHours);
  const maxHourBookings = Math.max(...hourEntries.map(([_, v]) => v), 1);

  // Check-In stats
  const totalCheckIns = report.checkInStats.checkedIn + report.checkInStats.noShows + report.checkInStats.pending;
  const noShowPercent = totalCheckIns > 0 ? Math.round((report.checkInStats.noShows / totalCheckIns) * 100) : 0;
  const checkedInPercent = totalCheckIns > 0 ? Math.round((report.checkInStats.checkedIn / totalCheckIns) * 100) : 0;
  const pendingPercent = totalCheckIns > 0 ? Math.round((report.checkInStats.pending / totalCheckIns) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="font-bold text-lg font-outfit">Reporting & Analytics</h3>
          <p className="text-xs text-slate-400 mt-1">Real-time statistics on room usage, department bookings, and attendance logs.</p>
        </div>

        <button
          onClick={fetchReport}
          className="p-2.5 rounded-xl border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4.5">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Attendance Rate</span>
            <span className="text-xl font-bold font-outfit mt-0.5">{checkedInPercent}%</span>
            <p className="text-[10px] text-slate-400 mt-0.5">{report.checkInStats.checkedIn} verified meetings</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4.5">
          <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">No Show Release Rate</span>
            <span className="text-xl font-bold font-outfit mt-0.5">{noShowPercent}%</span>
            <p className="text-[10px] text-slate-400 mt-0.5">{report.checkInStats.noShows} released bookings</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4.5">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Analytics Depth</span>
            <span className="text-xl font-bold font-outfit mt-0.5">{totalCheckIns} bookings</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Logs tracked in SQLite3</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 1: Room Booking Frequency (Vertical Bars) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-primary-600" />
            Room Booking Frequency (Times Used)
          </h4>
          <div className="flex-1 flex items-end justify-between h-48 px-4 border-b dark:border-slate-800 pb-2">
            {roomEntries.map(([roomName, count]) => {
              const heightPercent = count > 0 ? (count / maxRoomBookings) * 100 : 5;
              return (
                <div key={roomName} className="flex flex-col items-center flex-1 group relative">
                  {/* Tooltip */}
                  <span className="absolute -top-10 scale-0 group-hover:scale-100 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-all z-20">
                    {count} bookings
                  </span>
                  
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-8 bg-gradient-to-t from-primary-600 to-indigo-500 rounded-t-lg group-hover:brightness-105 transition-all shadow-md shadow-primary-500/10"
                  />
                  {/* Label */}
                  <span className="text-[9px] text-slate-400 font-semibold mt-2 truncate w-14 text-center">
                    {roomName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Department Share (Horizontal Progress Bars) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-indigo-500" />
            Booking Distribution by Department
          </h4>
          <div className="space-y-4">
            {deptEntries.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No department statistics logged yet.</p>
            ) : (
              deptEntries.map(([dept, count]) => {
                const widthPercent = (count / maxDeptBookings) * 100;
                return (
                  <div key={dept} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">{dept}</span>
                      <span>{count} meetings</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card 3: Peak Booking Hours (Hourly Slots) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm lg:col-span-2">
          <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-primary-600" />
            Peak Booking Hours (Reservations per Slot)
          </h4>
          <div className="flex-1 flex items-end justify-between h-48 border-b dark:border-slate-800 pb-2">
            {hourEntries.map(([hourLabel, count]) => {
              const heightPercent = count > 0 ? (count / maxHourBookings) * 100 : 5;
              return (
                <div key={hourLabel} className="flex flex-col items-center flex-1 group relative">
                  {/* Tooltip */}
                  <span className="absolute -top-10 scale-0 group-hover:scale-100 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-all z-20">
                    {count} reservations
                  </span>
                  
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-6 bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-t-md group-hover:brightness-105 transition-all"
                  />
                  {/* Label */}
                  <span className="text-[9px] text-slate-400 font-semibold mt-2 text-center whitespace-nowrap">
                    {hourLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
