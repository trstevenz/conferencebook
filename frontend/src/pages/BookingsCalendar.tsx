import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Check
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
  const [isRoomLocked, setIsRoomLocked] = useState(false);

  // Edit Booking states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRoomId, setEditRoomId] = useState<number>(0);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editParticipantIds, setEditParticipantIds] = useState<number[]>([]);
  const [editRecurrence, setEditRecurrence] = useState('');
  const [editRecurrenceCount, setEditRecurrenceCount] = useState<number>(1);

  // Business Hours (8 AM to 6 PM)
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

  const handleOpenCreateModal = (roomId?: number, slotIndex?: number) => {
    setErrorMessage(null);
    setBookingTitle('');
    setBookingDesc('');
    setSelectedParticipantIds([]);
    setBookingRecurrence('');
    setBookingRecurrenceCount(1);

    if (roomId) {
      setBookingRoomId(roomId);
      setIsRoomLocked(true);
    } else {
      if (rooms.length > 0) setBookingRoomId(rooms[0].id);
      setIsRoomLocked(false);
    }

    // Default times based on 15-minute slotIndex
    let startHour = 10;
    let startMinute = 0;
    if (slotIndex !== undefined) {
      startHour = 8 + Math.floor((slotIndex * 15) / 60);
      startMinute = (slotIndex * 15) % 60;
    }

    const formatPart = (num: number) => num < 10 ? `0${num}` : `${num}`;
    const startHourStr = `${formatPart(startHour)}:${formatPart(startMinute)}`;
    
    // Default meeting duration is 45 minutes
    const endMinutesTotal = startHour * 60 + startMinute + 45;
    const endHour = Math.floor(endMinutesTotal / 60);
    const endMin = endMinutesTotal % 60;
    const endHourStr = `${formatPart(endHour)}:${formatPart(endMin)}`;
    
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
    setIsEditing(false);

    // Prefill edit states
    setEditTitle(booking.title);
    setEditDesc(booking.description || '');
    setEditRoomId(booking.room.id);
    setEditStartTime(booking.startTime.substring(0, 16));
    setEditEndTime(booking.endTime.substring(0, 16));
    setEditParticipantIds(booking.participants.map(p => p.id));
    setEditRecurrence(booking.recurringPattern || '');
    setEditRecurrenceCount(1);

    setIsDetailsModalOpen(true);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setErrorMessage(null);

    const payload = {
      roomId: editRoomId,
      userId: selectedBooking.user.id,
      startTime: editStartTime,
      endTime: editEndTime,
      title: editTitle,
      description: editDesc,
      participantIds: editParticipantIds,
      recurrencePattern: editRecurrence || null,
      recurrenceCount: editRecurrence ? editRecurrenceCount : null
    };

    try {
      await apiCall(`/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setIsEditing(false);
      setIsDetailsModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
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

  const toggleEditParticipant = (pId: number) => {
    setEditParticipantIds(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const isBookingOnSelectedDate = (booking: Booking) => {
    const bStart = new Date(booking.startTime);
    const bEnd = new Date(booking.endTime);
    
    const targetStart = new Date(selectedDate);
    targetStart.setHours(0, 0, 0, 0);
    
    const targetEnd = new Date(selectedDate);
    targetEnd.setHours(23, 59, 59, 999);
    
    return bStart <= targetEnd && bEnd >= targetStart;
  };

  const getSlotIndex = (timeStr: string) => {
    const date = new Date(timeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    const totalMinutes = (hours - 8) * 60 + minutes;
    const clamped = Math.max(0, Math.min(600, totalMinutes));
    return Math.floor(clamped / 15);
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
          <div className="min-w-[1200px] divide-y dark:divide-slate-800">
            {/* Timeline Hours Header */}
            <div className="flex bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-semibold text-xs h-12">
              <div className="w-56 p-4 border-r dark:border-slate-800 flex-shrink-0 flex items-center font-outfit">Rooms</div>
              <div className="flex-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(40, minmax(20px, 1fr))' }}>
                {Array.from({ length: 10 }).map((_, hourIdx) => {
                  const h = 8 + hourIdx;
                  const label = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`;
                  return (
                    <div
                      key={h}
                      className="flex items-center justify-center border-r dark:border-slate-800 text-center font-outfit text-[10px] tracking-wider"
                      style={{ gridColumn: `span 4` }}
                    >
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
              rooms.map(room => {
                const roomBookings = bookings.filter(b => 
                  b.room.id === room.id && 
                  b.status !== 'CANCELLED' && 
                  b.status !== 'REJECTED' &&
                  isBookingOnSelectedDate(b)
                );

                return (
                  <div key={room.id} className="flex border-b dark:border-slate-800">
                    {/* Room Detail Panel */}
                    <div className="w-56 p-4 border-r dark:border-slate-800 flex-shrink-0 flex flex-col justify-center bg-slate-50/50 dark:bg-slate-900/50">
                      <span className="font-bold text-sm leading-tight">{room.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wide">
                        Cap: {room.capacity} seats • Floor {room.floor}
                      </span>
                    </div>

                    {/* Grid Hours cells */}
                    <div className="flex-1 relative" style={{ display: 'grid', gridTemplateColumns: 'repeat(40, minmax(20px, 1fr))', gridAutoRows: 'minmax(80px, auto)' }}>
                      {/* Render background cells (40 slots) */}
                      {Array.from({ length: 40 }).map((_, i) => {
                        const cellHour = 8 + Math.floor((i * 15) / 60);
                        const cellMinute = (i * 15) % 60;
                        const cellTimeLabel = `${cellHour > 12 ? cellHour - 12 : cellHour}:${cellMinute === 0 ? '00' : cellMinute} ${cellHour >= 12 ? 'PM' : 'AM'}`;
                        
                        return (
                          <div
                            key={i}
                            onClick={() => handleOpenCreateModal(room.id, i)}
                            title={`Book slot at ${cellTimeLabel} in ${room.name}`}
                            className="border-r border-slate-100 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/10 cursor-pointer flex items-center justify-center transition-all group"
                            style={{ gridColumn: i + 1, gridRow: 1 }}
                          >
                            <Plus className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        );
                      })}

                      {/* Render actual bookings */}
                      {roomBookings.map(b => {
                        const startCol = getSlotIndex(b.startTime) + 1;
                        const endCol = getSlotIndex(b.endTime) + 1;
                        
                        // Ensure it spans at least 1 column
                        const span = Math.max(1, endCol - startCol);
                        
                        const isPending = b.status === 'PENDING';
                        
                        // Time formatting helper
                        const formatTime = (isoStr: string) => {
                          const date = new Date(isoStr);
                          let h = date.getHours();
                          const m = date.getMinutes();
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          h = h % 12;
                          h = h ? h : 12;
                          const mStr = m < 10 ? '0' + m : m;
                          return `${h}:${mStr} ${ampm}`;
                        };
                        
                        const formattedStart = formatTime(b.startTime);
                        const formattedEnd = formatTime(b.endTime);
                        
                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(b);
                            }}
                            className="p-1 cursor-pointer transition-all h-[calc(100%-8px)] my-auto"
                            style={{
                              gridColumnStart: startCol,
                              gridColumnEnd: endCol,
                              gridRow: 1,
                              zIndex: 10
                            }}
                          >
                            <div className={`w-full h-full rounded-xl p-2 text-left flex flex-col justify-between border select-none transition-all hover:scale-[1.01] hover:shadow-md ${
                              isPending
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                                : 'bg-primary-500/10 text-primary-600 border-primary-500/20 dark:text-primary-400'
                            }`}>
                              <span className="font-bold text-[10px] truncate leading-none mb-1">{b.title}</span>
                              <div className="flex flex-col gap-0.5 mt-auto">
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate leading-none">
                                  {b.user.fullName}
                                </span>
                                {/* Requirement 3: Start and End Time Displayed on Card */}
                                <span className="text-[8px] font-semibold text-primary-600 dark:text-primary-300 tracking-wider">
                                  {formattedStart} - {formattedEnd}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
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
                  {/* Requirement 4: Room select is disabled/locked if user clicked a specific room cell */}
                  <select
                    value={bookingRoomId}
                    onChange={e => setBookingRoomId(Number(e.target.value))}
                    disabled={isRoomLocked}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    } ${isRoomLocked ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
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
                    step="900" // Requirement 2: every 15 mins step
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
                    step="900" // Requirement 2: every 15 mins step
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
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl p-8 border ${
            theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold font-outfit">
                {isEditing ? 'Edit Meeting Reservation' : 'Meeting Reservation Details'}
              </h4>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5">
                <XCircle className="h-4.5 w-4.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isEditing ? (
              // EDIT MODE FORM (Requirement 5: Modify booking anytime)
              <form onSubmit={handleUpdateBooking} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Meeting Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                {/* Room Select */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Conference Room</label>
                    <select
                      value={editRoomId}
                      onChange={e => setEditRoomId(Number(e.target.value))}
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
                      value={editRecurrence}
                      onChange={e => setEditRecurrence(e.target.value)}
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

                {/* Time range */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Start Date/Time</label>
                    <input
                      type="datetime-local"
                      required
                      step="900" // Enforce 15 mins step
                      value={editStartTime}
                      onChange={e => setEditStartTime(e.target.value)}
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
                      step="900" // Enforce 15 mins step
                      value={editEndTime}
                      onChange={e => setEditEndTime(e.target.value)}
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
                      disabled={!editRecurrence}
                      value={editRecurrenceCount}
                      onChange={e => setEditRecurrenceCount(Number(e.target.value))}
                      className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                        theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Participants */}
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
                            checked={editParticipantIds.includes(u.id)}
                            onChange={() => toggleEditParticipant(u.id)}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span>{u.fullName} ({u.username})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Meeting Notes / Agenda</label>
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    rows={2}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                <div className="flex gap-4 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 border dark:border-slate-700 rounded-2xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center"
                  >
                    Back to Details
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-primary-500/25 text-center"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              // READ-ONLY DETAIL MODE
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block font-outfit">Meeting Title</span>
                  <p className="font-bold text-base mt-1 text-slate-800 dark:text-white">{selectedBooking.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block font-outfit font-medium">Room</span>
                    <p className="text-sm font-semibold mt-0.5 text-slate-700 dark:text-slate-300">{selectedBooking.room.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block font-outfit font-medium">Organizer</span>
                    <p className="text-sm font-semibold mt-0.5 text-slate-700 dark:text-slate-300">{selectedBooking.user.fullName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block font-outfit font-medium">Start Time</span>
                    <p className="text-xs font-medium mt-0.5 text-slate-600 dark:text-slate-400">
                      {new Date(selectedBooking.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block font-outfit font-medium">End Time</span>
                    <p className="text-xs font-medium mt-0.5 text-slate-600 dark:text-slate-400">
                      {new Date(selectedBooking.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1 font-outfit font-medium">Status</span>
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
                  {selectedBooking.recurringPattern && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1 font-outfit font-medium">Recurrence</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                        {selectedBooking.recurringPattern}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block font-outfit font-medium">Agenda</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl border dark:border-slate-800">
                    {selectedBooking.description || 'No agenda detailed.'}
                  </p>
                </div>

                {/* Participants */}
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-2 font-outfit font-medium">Participants ({selectedBooking.participants.length})</span>
                  {selectedBooking.participants.length === 0 ? (
                    <p className="text-xs text-slate-500">None invited.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBooking.participants.map(p => (
                        <span key={p.id} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          {p.fullName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons depending on role & owner */}
                <div className="pt-4 flex flex-col gap-2">
                  {/* Edit Option for creator or Super Admin */}
                  {(selectedBooking.user.id === user?.id || user?.role === 'SUPER_ADMIN') && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit className="h-4 w-4" /> Edit Reservation
                    </button>
                  )}

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
            )}
          </div>
        </div>
      )}
    </div>
  );
};
