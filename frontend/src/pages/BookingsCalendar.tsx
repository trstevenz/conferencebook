import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  PlusCircle,
  HelpCircle,
  Edit,
  Trash2
} from 'lucide-react';

interface Room {
  id: number;
  name: string;
  code: string;
  capacity: number;
  floor: number;
  building: string;
  amenitiesList: string[];
}

interface User {
  id: number;
  username: string;
  fullName: string;
}

interface Booking {
  id: number;
  room: Room;
  user: User;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  status: string;
  checkInStatus: string;
  participants: User[];
  recurringPattern?: string;
}

export const BookingsCalendar: React.FC = () => {
  const { user, apiCall, theme } = useAuth();
  
  // Date selector
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // DB Lists
  const [rooms, setRooms] = useState<Room[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // New Booking form state
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingDesc, setBookingDesc] = useState('');
  const [bookingRoomId, setBookingRoomId] = useState<number>(0);
  const [bookingStartTime, setBookingStartTime] = useState('');
  const [bookingEndTime, setBookingEndTime] = useState('');
  const [bookingRecurrence, setBookingRecurrence] = useState('');
  const [bookingRecurrenceCount, setBookingRecurrenceCount] = useState<number>(1);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);

  // Hour slots (8 AM to 6 PM)
  const businessHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBaseData = async () => {
    try {
      const roomsData = await apiCall('/api/rooms');
      setRooms(roomsData);
      if (roomsData.length > 0) setBookingRoomId(roomsData[0].id);

      const usersData = await apiCall('/api/auth/users');
      setUsersList(usersData.filter((u: any) => u.id !== user?.id)); // exclude self
    } catch (err: any) {
      console.error('Error fetching base details:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const bookingsData = await apiCall('/api/bookings');
      setBookings(bookingsData);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const getFormatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper to format date + hour to ISO string for submission
  const combineDateAndHour = (date: Date, timeStr: string) => {
    const dStr = getFormatDate(date);
    return `${dStr}T${timeStr}:00`;
  };

  const handleOpenCreateModal = (roomId?: number, hour?: number) => {
    setErrorMessage(null);
    setBookingTitle('');
    setBookingDesc('');
    if (roomId) setBookingRoomId(roomId);
    setSelectedParticipantIds([]);
    setBookingRecurrence('');
    setBookingRecurrenceCount(1);

    // Default times
    const startHour = hour ? hour : 10;
    const startHourStr = startHour < 10 ? `0${startHour}:00` : `${startHour}:00`;
    const endHourStr = (startHour + 1) < 10 ? `0${startHour + 1}:00` : `${startHour + 1}:00`;
    
    setBookingStartTime(combineDateAndHour(selectedDate, startHourStr));
    setBookingEndTime(combineDateAndHour(selectedDate, endHourStr));
    
    setIsCreateModalOpen(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      roomId: bookingRoomId,
      userId: user?.id,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      title: bookingTitle,
      description: bookingDesc,
      participantIds: selectedParticipantIds,
      recurrencePattern: bookingRecurrence || null,
      recurrenceCount: bookingRecurrence ? bookingRecurrenceCount : null
    };

    try {
      await apiCall('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setIsCreateModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleOpenDetails = (booking: Booking) => {
    setErrorMessage(null);
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
  };

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiCall(`/api/bookings/${id}`, { method: 'DELETE' });
      setIsDetailsModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleApproveBooking = async (id: number) => {
    try {
      await apiCall(`/api/manager/bookings/${id}/approve`, { method: 'POST' });
      setIsDetailsModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleRejectBooking = async (id: number) => {
    try {
      await apiCall(`/api/manager/bookings/${id}/reject`, { method: 'POST' });
      setIsDetailsModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const toggleParticipant = (pId: number) => {
    setSelectedParticipantIds(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  // Helper to find booking overlapping a specific hour slot for a specific room on selectedDate
  const getBookingForSlot = (roomId: number, hour: number) => {
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(selectedDate);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return bookings.find(b => {
      if (b.room.id !== roomId) return false;
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < slotEnd && bEnd > slotStart;
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Date Header Controller */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={handlePrevDay} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary-600" />
            <span className="font-bold text-lg font-outfit">
              {selectedDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <button onClick={handleNextDay} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => handleOpenCreateModal()}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-primary-500/25 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Book Room
        </button>
      </div>

      {/* Grid Timeline scheduler */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px] divide-y dark:divide-slate-800">
            {/* Timeline Hours Header */}
            <div className="flex bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-semibold text-xs h-12">
              <div className="w-56 p-4 border-r dark:border-slate-800 flex-shrink-0 flex items-center font-outfit">Rooms</div>
              <div className="flex-1 flex divide-x dark:divide-slate-800">
                {businessHours.slice(0, -1).map(h => {
                  const label = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`;
                  return (
                    <div key={h} className="flex-1 flex items-center justify-center min-w-[70px]">
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room Rows */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No rooms found.</div>
            ) : (
              rooms.map(room => (
                <div key={room.id} className="flex min-h-[75px]">
                  {/* Room Detail Panel */}
                  <div className="w-56 p-4 border-r dark:border-slate-800 flex-shrink-0 flex flex-col justify-center bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="font-bold text-sm leading-tight">{room.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wide">
                      Cap: {room.capacity} seats • Floor {room.floor}
                    </span>
                  </div>

                  {/* Grid Hours cells */}
                  <div className="flex-1 flex divide-x dark:divide-slate-800 relative">
                    {businessHours.slice(0, -1).map(h => {
                      const activeBooking = getBookingForSlot(room.id, h);
                      
                      if (activeBooking) {
                        const isPending = activeBooking.status === 'PENDING';
                        return (
                          <div
                            key={h}
                            onClick={() => handleOpenDetails(activeBooking)}
                            className="flex-1 min-w-[70px] p-1 flex items-center justify-center cursor-pointer transition-all"
                          >
                            <div className={`w-full h-full rounded-xl px-2 py-1.5 text-left flex flex-col justify-between border select-none transition-all hover:scale-[1.02] ${
                              isPending
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                                : 'bg-primary-500/10 text-primary-600 border-primary-500/20 dark:text-primary-400'
                            }`}>
                              <span className="font-bold text-[10px] truncate leading-none">{activeBooking.title}</span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate leading-none mt-1">
                                {activeBooking.user.fullName}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={h}
                          onClick={() => handleOpenCreateModal(room.id, h)}
                          className="flex-1 min-w-[70px] hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer flex items-center justify-center transition-all group"
                        >
                          <PlusCircle className="h-4 w-4 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CREATE BOOKING MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl p-8 border ${
            theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold font-outfit">Create Meeting Booking</h4>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5">
                <XCircle className="h-4.5 w-4.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              {/* Meeting Title */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={bookingTitle}
                  onChange={e => setBookingTitle(e.target.value)}
                  placeholder="E.g., Design Sprint Sync"
                  className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              {/* Room Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Conference Room</label>
                  <select
                    value={bookingRoomId}
                    onChange={e => setBookingRoomId(Number(e.target.value))}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Recurrence Pattern</label>
                  <select
                    value={bookingRecurrence}
                    onChange={e => setBookingRecurrence(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="">None (One-Time)</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Time Range & Recurrence Count */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingStartTime}
                    onChange={e => setBookingStartTime(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">End Date/Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingEndTime}
                    onChange={e => setBookingEndTime(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Occurrences</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    disabled={!bookingRecurrence}
                    value={bookingRecurrenceCount}
                    onChange={e => setBookingRecurrenceCount(Number(e.target.value))}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Participants Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Select Participants</label>
                <div className={`max-h-24 overflow-y-auto border p-3 rounded-2xl space-y-2 ${
                  theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  {usersList.length === 0 ? (
                    <p className="text-xs text-slate-400">No other employees available.</p>
                  ) : (
                    usersList.map(u => (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer select-none text-xs">
                        <input
                          type="checkbox"
                          checked={selectedParticipantIds.includes(u.id)}
                          onChange={() => toggleParticipant(u.id)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>{u.fullName} ({u.username})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Meeting Notes / Agenda</label>
                <textarea
                  value={bookingDesc}
                  onChange={e => setBookingDesc(e.target.value)}
                  placeholder="Describe details for the invitees..."
                  rows={2}
                  className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div className="flex gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 border dark:border-slate-700 rounded-2xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-primary-500/25 text-center"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING DETAILS & ACTION MODAL */}
      {isDetailsModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 border ${
            theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold font-outfit">Meeting Reservation Details</h4>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <XCircle className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5">
                <XCircle className="h-4.5 w-4.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Meeting Title</span>
                <p className="font-bold text-base mt-1">{selectedBooking.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Room</span>
                  <p className="text-sm font-semibold mt-0.5">{selectedBooking.room.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Organizer</span>
                  <p className="text-sm font-semibold mt-0.5">{selectedBooking.user.fullName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Start Time</span>
                  <p className="text-xs font-medium mt-0.5">{new Date(selectedBooking.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">End Time</span>
                  <p className="text-xs font-medium mt-0.5">{new Date(selectedBooking.endTime).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                  selectedBooking.status === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : selectedBooking.status === 'PENDING'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                }`}>
                  {selectedBooking.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Agenda</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {selectedBooking.description || 'No agenda detailed.'}
                </p>
              </div>

              {/* Participants */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-2">Participants ({selectedBooking.participants.length})</span>
                {selectedBooking.participants.length === 0 ? (
                  <p className="text-xs text-slate-500">None invited.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBooking.participants.map(p => (
                      <span key={p.id} className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        {p.fullName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons depending on role & owner */}
              <div className="pt-4 flex flex-col gap-2">
                {/* Employee / Organizer Cancel Option */}
                {(selectedBooking.user.id === user?.id || user?.role === 'SUPER_ADMIN') && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" /> Cancel Booking
                  </button>
                )}

                {/* Manager Overrides (Approve / Reject) */}
                {selectedBooking.status === 'PENDING' && (user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN') && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleRejectBooking(selectedBooking.id)}
                      className="flex-1 py-2.5 border border-rose-500 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs font-semibold transition-all"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleApproveBooking(selectedBooking.id)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all"
                    >
                      Approve Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
