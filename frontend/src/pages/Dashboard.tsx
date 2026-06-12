import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Layers,
  Percent,
  AlertCircle,
  Video,
  Clock,
  ExternalLink,
  MapPin,
  ChevronRight,
  TrendingUp,
  Bookmark
} from 'lucide-react';

interface Stats {
  totalRooms: number;
  activeMeetings: number;
  occupancyRate: number;
  noShowCount: number;
  totalBookingsCount: number;
}

interface Booking {
  id: number;
  room: { id: number; name: string; building: string; floor: number };
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  checkInStatus: string;
}

export const Dashboard: React.FC = () => {
  const { user, apiCall, theme } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats>({
    totalRooms: 0,
    activeMeetings: 0,
    occupancyRate: 0,
    noShowCount: 0,
    totalBookingsCount: 0
  });
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [recentRooms, setRecentRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch stats
        const statsData = await apiCall('/api/dashboard');
        setStats(statsData);

        // Fetch user's bookings
        const bookingsData = await apiCall('/api/bookings/my');
        const upcomingBookings = bookingsData
          .filter((b: Booking) => new Date(b.endTime) > new Date() && b.status !== 'CANCELLED')
          .sort((a: Booking, b: Booking) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 3);
        setUpcoming(upcomingBookings);

        // Fetch rooms to display as featured
        const roomsData = await apiCall('/api/rooms');
        setRecentRooms(roomsData.slice(0, 3));
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-primary-600 via-primary-600 to-indigo-600 text-white relative overflow-hidden shadow-xl shadow-primary-500/10">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/5 translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-white/5 -translate-x-10 translate-y-10" />

        <div className="max-w-2xl relative z-10">
          <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide uppercase">
            {user?.departmentName || 'Enterprise'} Division
          </span>
          <h2 className="text-3xl font-bold font-outfit mt-4">Welcome back, {user?.fullName}!</h2>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            Manage your conference bookings, view room capacities, resolve conflicts instantly, or use our smart AI Booking Assistant.
          </p>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => navigate('/calendar')}
              className="px-5 py-2.5 bg-white text-primary-600 rounded-2xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Calendar className="h-4 w-4" /> Book Room Now
            </button>
            <button
              onClick={() => navigate('/qr-checkin')}
              className="px-5 py-2.5 bg-white/15 text-white rounded-2xl text-xs font-semibold hover:bg-white/20 transition-all flex items-center gap-1.5"
            >
              <Video className="h-4 w-4" /> Scan QR Check-In
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Rooms */}
        <div className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-primary-500/10 text-primary-600">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-1">Total Rooms</span>
            <span className="text-2xl font-bold font-outfit leading-none">{stats.totalRooms}</span>
          </div>
        </div>

        {/* Active Meetings */}
        <div className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-1">Active Meetings</span>
            <span className="text-2xl font-bold font-outfit leading-none">{stats.activeMeetings}</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-1">Occupancy Rate</span>
            <span className="text-2xl font-bold font-outfit leading-none">{stats.occupancyRate}%</span>
          </div>
        </div>

        {/* No-Shows */}
        <div className="p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-1">No Shows Released</span>
            <span className="text-2xl font-bold font-outfit leading-none">{stats.noShowCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Upcoming Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-outfit">My Upcoming Meetings</h3>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-0.5"
            >
              See All Calendar Slots <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-500 text-sm">
                No upcoming meetings scheduled. Click "Book Room Now" to make a reservation.
              </div>
            ) : (
              upcoming.map(booking => (
                <div
                  key={booking.id}
                  className="p-5 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-4.5 min-w-0">
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{booking.title}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          {booking.room.name} (Floor {booking.room.floor})
                        </span>
                        <span>
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                          {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                    <button
                      onClick={() => navigate('/calendar')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Featured Rooms */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold font-outfit">Rooms Directory</h3>
          <div className="space-y-4">
            {recentRooms.map((room: any) => (
              <div
                key={room.id}
                className="p-5 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">{room.name}</h4>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-500">
                      {room.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Building {room.building} • Capacity: {room.capacity} seats
                  </p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {room.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 mt-4">
                  {room.amenitiesList.slice(0, 3).map((am: string) => (
                    <span
                      key={am}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium"
                    >
                      {am}
                    </span>
                  ))}
                  {room.amenitiesList.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center pl-1">
                      +{room.amenitiesList.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
