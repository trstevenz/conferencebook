import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  XCircle,
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
  availableStartHour?: number;
  availableEndHour?: number;
  maxDuration?: number;
  status?: string;
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
  const { user, apiCall, theme, calendarInterval, calendarStartHour, calendarEndHour, maxMeetingDuration } = useAuth();
  
  // Date selector
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const saved = sessionStorage.getItem('calendarSelectedDate');
    return saved ? new Date(saved) : new Date();
  });

  const [hasRestoredModal, setHasRestoredModal] = useState(false);
  const [isRoomsLoaded, setIsRoomsLoaded] = useState(false);
  const [isBookingsLoaded, setIsBookingsLoaded] = useState(false);
  
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
  const [bookingStartSlot, setBookingStartSlot] = useState<number>(0);
  const [bookingEndSlot, setBookingEndSlot] = useState<number>(1);
  const [bookingRecurrence, setBookingRecurrence] = useState('');
  const [bookingRecurrenceCount, setBookingRecurrenceCount] = useState<number>(1);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);
  const [bookingParticipantsText, setBookingParticipantsText] = useState('');
  const [isRoomLocked, setIsRoomLocked] = useState(false);

  // Edit Booking states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRoomId, setEditRoomId] = useState<number>(0);
  const [editStartSlot, setEditStartSlot] = useState<number>(0);
  const [editEndSlot, setEditEndSlot] = useState<number>(1);
  const [editParticipantIds, setEditParticipantIds] = useState<number[]>([]);
  const [editParticipantsText, setEditParticipantsText] = useState('');
  const [editRecurrence, setEditRecurrence] = useState('');
  const [editRecurrenceCount, setEditRecurrenceCount] = useState<number>(1);

  // Drag selection states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [dragEndSlot, setDragEndSlot] = useState<number | null>(null);
  const [dragRoomId, setDragRoomId] = useState<number | null>(null);

  // Building filter states
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>(() => {
    return sessionStorage.getItem('calendarSelectedBuilding') || 'All';
  });

  // Derived calendar settings
  const gridStartHour = rooms.length > 0
    ? Math.min(...rooms.map(r => r.availableStartHour ?? 8))
    : calendarStartHour;

  const gridEndHour = rooms.length > 0
    ? Math.max(...rooms.map(r => r.availableEndHour ?? 18))
    : calendarEndHour;

  const slotsPerHour = 60 / calendarInterval;
  const totalHours = gridEndHour - gridStartHour;
  const totalSlotsCount = totalHours * slotsPerHour;

  const businessHours: number[] = [];
  for (let h = gridStartHour; h <= gridEndHour; h++) {
    businessHours.push(h);
  }

  const sortedRooms = [...rooms].sort((a, b) => a.building.localeCompare(b.building));
  const filteredRooms = selectedBuilding === 'All'
    ? sortedRooms
    : sortedRooms.filter(r => r.building === selectedBuilding);

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  // Save selectedBuilding to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('calendarSelectedBuilding', selectedBuilding);
  }, [selectedBuilding]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragStartSlot !== null && dragEndSlot !== null && dragRoomId !== null) {
          const start = Math.min(dragStartSlot, dragEndSlot);
          const end = Math.max(dragStartSlot, dragEndSlot) + 1;
          handleOpenCreateModal(dragRoomId, start, end);
        }
        setDragStartSlot(null);
        setDragEndSlot(null);
        setDragRoomId(null);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStartSlot, dragEndSlot, dragRoomId]);

  // Save selectedDate to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('calendarSelectedDate', selectedDate.toISOString());
  }, [selectedDate]);

  // Listen for custom booking-updated events from AI Assistant and other components
  useEffect(() => {
    const handleBookingUpdated = () => {
      fetchBookings(true);
    };
    window.addEventListener('booking-updated', handleBookingUpdated);
    return () => {
      window.removeEventListener('booking-updated', handleBookingUpdated);
    };
  }, []);

  // Poll for realtime updates in the background every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchBookings(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize the currently open details modal if the booking updates in real-time
  useEffect(() => {
    if (selectedBooking) {
      const updated = bookings.find(b => b.id === selectedBooking.id);
      if (updated) {
        setSelectedBooking(updated);
      }
    }
  }, [bookings]);

  // Restore modal states once data is loaded
  useEffect(() => {
    if (!isRoomsLoaded || !isBookingsLoaded || hasRestoredModal) return;

    const savedStateStr = sessionStorage.getItem('calendarModalState');
    if (savedStateStr) {
      try {
        const saved = JSON.parse(savedStateStr);
        if (saved.isCreateModalOpen) {
          setBookingTitle(saved.bookingTitle || '');
          setBookingDesc(saved.bookingDesc || '');
          setBookingRoomId(saved.bookingRoomId || 0);
          setBookingStartSlot(saved.bookingStartSlot || 0);
          setBookingEndSlot(saved.bookingEndSlot || 1);
          setBookingRecurrence(saved.bookingRecurrence || '');
          setBookingRecurrenceCount(saved.bookingRecurrenceCount || 1);
          setBookingParticipantsText(saved.bookingParticipantsText || '');
          setIsRoomLocked(saved.isRoomLocked || false);
          setIsCreateModalOpen(true);
        } else if (saved.isDetailsModalOpen && saved.selectedBookingId) {
          const b = bookings.find(x => x.id === saved.selectedBookingId);
          if (b) {
            setSelectedBooking(b);
            setIsEditing(saved.isEditing || false);
            setEditTitle(saved.editTitle || '');
            setEditDesc(saved.editDesc || '');
            setEditRoomId(saved.editRoomId || 0);
            setEditStartSlot(saved.editStartSlot || 0);
            setEditEndSlot(saved.editEndSlot || 1);
            setEditParticipantsText(saved.editParticipantsText || '');
            setEditRecurrence(saved.editRecurrence || '');
            setEditRecurrenceCount(saved.editRecurrenceCount || 1);
            setIsDetailsModalOpen(true);
          }
        }
      } catch (e) {
        console.error('Failed to parse calendarModalState', e);
      }
    }
    setHasRestoredModal(true);
  }, [rooms, bookings, hasRestoredModal, isRoomsLoaded, isBookingsLoaded]);

  // Save modal state to sessionStorage (only after initial restore is complete)
  useEffect(() => {
    if (!hasRestoredModal) return;

    const stateToSave = {
      isCreateModalOpen,
      isDetailsModalOpen,
      selectedBookingId: selectedBooking?.id || null,
      bookingTitle,
      bookingDesc,
      bookingRoomId,
      bookingStartSlot,
      bookingEndSlot,
      bookingRecurrence,
      bookingRecurrenceCount,
      bookingParticipantsText,
      isRoomLocked,
      isEditing,
      editTitle,
      editDesc,
      editRoomId,
      editStartSlot,
      editEndSlot,
      editParticipantsText,
      editRecurrence,
      editRecurrenceCount,
    };
    sessionStorage.setItem('calendarModalState', JSON.stringify(stateToSave));
  }, [
    hasRestoredModal,
    isCreateModalOpen,
    isDetailsModalOpen,
    selectedBooking,
    bookingTitle,
    bookingDesc,
    bookingRoomId,
    bookingStartSlot,
    bookingEndSlot,
    bookingRecurrence,
    bookingRecurrenceCount,
    bookingParticipantsText,
    isRoomLocked,
    isEditing,
    editTitle,
    editDesc,
    editRoomId,
    editStartSlot,
    editEndSlot,
    editParticipantsText,
    editRecurrence,
    editRecurrenceCount,
  ]);

  const fetchBaseData = async () => {
    try {
      const roomsData = await apiCall('/api/rooms');
      const activeRooms = roomsData.filter((r: any) => r.status !== 'DISABLED');
      setRooms(activeRooms);
      if (activeRooms.length > 0) setBookingRoomId(activeRooms[0].id);

      const usersData = await apiCall('/api/auth/users');
      setUsersList(usersData.filter((u: any) => u.id !== user?.id)); // exclude self

      try {
        const buildingsData = await apiCall('/api/buildings');
        setBuildings(buildingsData);
      } catch (bErr) {
        console.error('Error fetching buildings:', bErr);
      }

      setIsRoomsLoaded(true);
    } catch (err: any) {
      console.error('Error fetching base details:', err);
    }
  };

  const fetchBookings = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const bookingsData = await apiCall('/api/bookings');
      setBookings(bookingsData);
      setIsBookingsLoaded(true);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
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

  // Convert slot index to ISO string
  const getISOStringForSlot = (date: Date, slotIdx: number) => {
    const d = new Date(date);
    const mTotal = gridStartHour * 60 + slotIdx * calendarInterval;
    const h = Math.floor(mTotal / 60);
    const m = mTotal % 60;
    
    const formatPart = (n: number) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${formatPart(d.getMonth() + 1)}-${formatPart(d.getDate())}T${formatPart(h)}:${formatPart(m)}:00`;
  };

  // Check if a specific slot index is already booked (overlap checks)
  const isSlotBooked = (roomId: number, slotIdx: number, excludeBookingId?: number) => {
    const slotStart = new Date(selectedDate);
    const startMinsTotal = gridStartHour * 60 + slotIdx * calendarInterval;
    slotStart.setHours(Math.floor(startMinsTotal / 60), startMinsTotal % 60, 0, 0);
    
    const slotEnd = new Date(selectedDate);
    const endMinsTotal = gridStartHour * 60 + (slotIdx + 1) * calendarInterval;
    slotEnd.setHours(Math.floor(endMinsTotal / 60), endMinsTotal % 60, 0, 0);

    return bookings.some(b => {
      if (b.room.id !== roomId) return false;
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;

      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < slotEnd && bEnd > slotStart;
    });
  };

  // Find index of first booked slot after the selected start index (so we can disable end times past it)
  const getFirstBookedSlotAfter = (roomId: number, startSlotIdx: number, excludeBookingId?: number) => {
    for (let s = startSlotIdx; s < totalSlotsCount; s++) {
      if (isSlotBooked(roomId, s, excludeBookingId)) {
        return s; // index of first booked slot
      }
    }
    return null;
  };

  const resolveParticipantIds = (text: string) => {
    if (!text.trim()) return [];
    const entries = text.split(/[\n,]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
    const matchedIds: number[] = [];
    
    entries.forEach(entry => {
      const matched = usersList.find(u => 
        u.username.toLowerCase() === entry || 
        u.fullName.toLowerCase() === entry
      );
      if (matched && !matchedIds.includes(matched.id)) {
        matchedIds.push(matched.id);
      }
    });
    return matchedIds;
  };

  const handleOpenCreateModal = (roomId?: number, startSlotIndex?: number, endSlotIndex?: number) => {
    setErrorMessage(null);
    setBookingTitle('');
    setBookingDesc('');
    setSelectedParticipantIds([]);
    setBookingParticipantsText('');
    setBookingRecurrence('');
    setBookingRecurrenceCount(1);

    const activeRoomId = roomId || (filteredRooms.length > 0 ? filteredRooms[0].id : 0);

    if (roomId) {
      setBookingRoomId(roomId);
      setIsRoomLocked(true);
    } else {
      if (filteredRooms.length > 0) setBookingRoomId(filteredRooms[0].id);
      setIsRoomLocked(false);
    }

    let startIdx = startSlotIndex !== undefined ? startSlotIndex : 8; // default 10 AM
    
    // Auto-align if default start slot is already booked
    while (startIdx < totalSlotsCount && isSlotBooked(activeRoomId, startIdx)) {
      startIdx++;
    }
    if (startIdx >= totalSlotsCount) {
      startIdx = 0;
      while (startIdx < totalSlotsCount && isSlotBooked(activeRoomId, startIdx)) {
        startIdx++;
      }
    }

    const firstBooked = getFirstBookedSlotAfter(activeRoomId, startIdx);
    
    let endIdx = endSlotIndex !== undefined ? endSlotIndex : startIdx + Math.max(1, Math.floor(45 / calendarInterval)); // default 45 mins
    if (firstBooked !== null && endIdx > firstBooked) {
      endIdx = firstBooked;
    }
    if (endIdx <= startIdx) {
      endIdx = startIdx + 1;
    }

    setBookingStartSlot(startIdx);
    setBookingEndSlot(endIdx);
    setIsCreateModalOpen(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      roomId: bookingRoomId,
      userId: user?.id,
      startTime: getISOStringForSlot(selectedDate, bookingStartSlot),
      endTime: getISOStringForSlot(selectedDate, bookingEndSlot),
      title: bookingTitle,
      description: bookingDesc,
      participantIds: resolveParticipantIds(bookingParticipantsText),
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

    setEditTitle(booking.title);
    setEditDesc(booking.description || '');
    setEditRoomId(booking.room.id);
    
    const startIdx = getSlotIndex(booking.startTime);
    const endIdx = getSlotIndex(booking.endTime);
    setEditStartSlot(startIdx);
    setEditEndSlot(endIdx);

    setEditParticipantIds(booking.participants.map(p => p.id));
    setEditParticipantsText(booking.participants.map(p => p.username).join(', '));
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
      startTime: getISOStringForSlot(selectedDate, editStartSlot),
      endTime: getISOStringForSlot(selectedDate, editEndSlot),
      title: editTitle,
      description: editDesc,
      participantIds: resolveParticipantIds(editParticipantsText),
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
    
    const totalMinutes = (hours - gridStartHour) * 60 + minutes;
    const clamped = Math.max(0, Math.min(totalHours * 60, totalMinutes));
    return Math.floor(clamped / calendarInterval);
  };

  const formatSlotLabel = (slotIdx: number) => {
    const mTotal = gridStartHour * 60 + slotIdx * calendarInterval;
    const h = Math.floor(mTotal / 60);
    const m = mTotal % 60;
    const labelHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const labelMinute = m < 10 ? '0' + m : m;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${labelHour}:${labelMinute} ${ampm}`;
  };

  const formatHourSimple = (h: number) => {
    const labelHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${labelHour}:00 ${ampm}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Date Header Controller */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
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

          <div className="flex items-center gap-2 border-l pl-4 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-outfit">Building:</span>
            <select
              value={selectedBuilding}
              onChange={e => {
                const b = e.target.value;
                setSelectedBuilding(b);
                const matchingRooms = rooms.filter(r => b === 'All' || r.building === b);
                if (matchingRooms.length > 0) {
                  setBookingRoomId(matchingRooms[0].id);
                }
              }}
              className={`rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="All">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => handleOpenCreateModal()}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-primary-500/25 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Book Room
        </button>
      </div>

      {/* Grid Timeline scheduler */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-x-auto shadow-sm">
        <div className="divide-y dark:divide-slate-800" style={{ minWidth: `${224 + totalSlotsCount * 35}px` }}>
            {/* Timeline Hours Header */}
            <div className="flex bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold text-xs h-12">
              <div className="w-56 p-4 border-r dark:border-slate-800 flex-shrink-0 flex items-center font-outfit">Rooms</div>
              <div className="flex-1 relative h-full" style={{ display: 'grid', gridTemplateColumns: `repeat(${totalHours}, minmax(${35 * slotsPerHour}px, 1fr))` }}>
                {Array.from({ length: totalHours }).map((_, h) => {
                  const hourNumber = gridStartHour + h;
                  const getLabel = (hour: number) => {
                    if (hour === 0 || hour === 24) return '12 AM';
                    if (hour === 12) return '12 PM';
                    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                  };
                  
                  return (
                    <div 
                      key={h} 
                      className="h-full border-r border-slate-300 dark:border-slate-700 flex items-center justify-center font-outfit text-slate-400 font-semibold text-[10px] select-none whitespace-nowrap"
                    >
                      {getLabel(hourNumber)}
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
            ) : filteredRooms.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No rooms found.</div>
            ) : (
              filteredRooms.map(room => {
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
                      <span className="font-bold text-sm leading-tight text-slate-700 dark:text-slate-200">{room.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wide">
                        Floor {room.floor}
                      </span>
                      <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold mt-1">
                        Hours: {formatHourSimple(room.availableStartHour ?? 8)} - {formatHourSimple(room.availableEndHour ?? 18)}
                      </span>
                    </div>

                    {/* Grid Hours cells */}
                    <div className="flex-1 relative" style={{ display: 'grid', gridTemplateColumns: `repeat(${totalSlotsCount}, minmax(35px, 1fr))`, gridAutoRows: 'minmax(80px, auto)' }}>
                      {/* Render background cells */}
                      {Array.from({ length: totalSlotsCount }).map((_, i) => {
                        const slotHour = gridStartHour + Math.floor(i / slotsPerHour);
                        const roomStart = room.availableStartHour ?? 8;
                        const roomEnd = room.availableEndHour ?? 18;
                        const isOutsideHours = slotHour < roomStart || slotHour >= roomEnd;
                        
                        const isHourBoundary = (i + 1) % slotsPerHour === 0;

                        const isSelected = isDragging &&
                          dragRoomId === room.id &&
                          dragStartSlot !== null &&
                          dragEndSlot !== null &&
                          i >= Math.min(dragStartSlot, dragEndSlot) &&
                          i <= Math.max(dragStartSlot, dragEndSlot);

                        return (
                          <div
                            key={i}
                            onMouseDown={(e) => {
                              if (isOutsideHours) return;
                              if (e.button === 0 || e.button === 2) {
                                e.preventDefault();
                                setDragStartSlot(i);
                                setDragEndSlot(i);
                                setDragRoomId(room.id);
                                setIsDragging(true);
                              }
                            }}
                            onMouseEnter={() => {
                              if (isOutsideHours) return;
                              if (isDragging && dragRoomId === room.id) {
                                setDragEndSlot(i);
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                            }}
                            title={isOutsideHours 
                              ? `${room.name} is unavailable (Available: ${roomStart % 12 || 12} ${roomStart >= 12 ? 'PM' : 'AM'} - ${roomEnd % 12 || 12} ${roomEnd >= 12 ? 'PM' : 'AM'})`
                              : `Drag or click to book starting at ${formatSlotLabel(i)} in ${room.name}`
                            }
                            className={`flex items-center justify-center transition-all group ${
                              isHourBoundary 
                                ? (isOutsideHours ? 'border-r border-slate-300/80 dark:border-r-slate-700/80' : 'border-r border-slate-300 dark:border-slate-700')
                                : 'border-r border-transparent'
                            } ${
                              isOutsideHours
                                ? 'stripes-bg cursor-not-allowed'
                                : isSelected
                                ? 'bg-primary-500/35 dark:bg-primary-600/40 border-y border-primary-500/50 cursor-pointer'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/10 cursor-pointer'
                            }`}
                            style={{ gridColumn: i + 1, gridRow: 1 }}
                          >
                            {!isOutsideHours && (
                              <Plus className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        );
                      })}

                      {/* Render actual bookings */}
                      {roomBookings.map(b => {
                        const startCol = getSlotIndex(b.startTime) + 1;
                        const endCol = getSlotIndex(b.endTime) + 1;
                        
                        const isPending = b.status === 'PENDING';
                        
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

      {/* CREATE BOOKING MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl p-8 border ${
            theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold font-outfit">Create Meeting Booking</h4>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <XCircle className="h-5 w-5 text-slate-400" />
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

              {/* Room Selection & Recurrence */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Conference Room</label>
                  <select
                    value={bookingRoomId}
                    onChange={e => {
                      const newRoomId = Number(e.target.value);
                      setBookingRoomId(newRoomId);
                      // Reset slots to prevent issues with other room bookings
                      setBookingStartSlot(0);
                      setBookingEndSlot(1);
                    }}
                    disabled={isRoomLocked}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    } ${isRoomLocked ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                  >
                    {filteredRooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.building})</option>
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

              {/* Start & End Slot Selector Dropdowns (Requirement 1: No Date Picker, 15m intervals only, Disables booked times) */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2 font-outfit">Start Time</label>
                  <select
                    value={bookingStartSlot}
                    onChange={e => {
                      const newStart = Number(e.target.value);
                      setBookingStartSlot(newStart);
                      const nextBooked = getFirstBookedSlotAfter(bookingRoomId, newStart);
                      if (bookingEndSlot <= newStart || (nextBooked !== null && bookingEndSlot > nextBooked)) {
                        setBookingEndSlot(newStart + 1);
                      }
                    }}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    {Array.from({ length: totalSlotsCount }).map((_, i) => {
                      const selectedRoomObj = rooms.find(r => r.id === bookingRoomId);
                      const activeRoomStart = selectedRoomObj?.availableStartHour ?? 8;
                      const activeRoomEnd = selectedRoomObj?.availableEndHour ?? 18;
                      const slotHour = gridStartHour + Math.floor(i / slotsPerHour);
                      const isOutsideHours = slotHour < activeRoomStart || slotHour >= activeRoomEnd;

                      const isBooked = isSlotBooked(bookingRoomId, i);
                      const isOptionDisabled = isBooked || isOutsideHours;
                      return (
                        <option key={i} value={i} disabled={isOptionDisabled}>
                          {formatSlotLabel(i)} {isBooked ? '(Booked)' : isOutsideHours ? '(Outside Room Hours)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2 font-outfit">End Time</label>
                  <select
                    value={bookingEndSlot}
                    onChange={e => setBookingEndSlot(Number(e.target.value))}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    {Array.from({ length: totalSlotsCount }).map((_, idx) => {
                      const i = idx + 1; // End slots are 1-indexed to totalSlotsCount
                      const selectedRoomObj = rooms.find(r => r.id === bookingRoomId);
                      const activeRoomStart = selectedRoomObj?.availableStartHour ?? 8;
                      const activeRoomEnd = selectedRoomObj?.availableEndHour ?? 18;
                      const activeRoomMaxDuration = selectedRoomObj?.maxDuration ?? maxMeetingDuration;

                      const slotHour = gridStartHour + Math.floor((i - 1) / slotsPerHour);
                      const isOutsideHours = slotHour < activeRoomStart || slotHour >= activeRoomEnd;

                      const nextBooked = getFirstBookedSlotAfter(bookingRoomId, bookingStartSlot);
                      const durationMins = (i - bookingStartSlot) * calendarInterval;
                      const isOptionDisabled = i <= bookingStartSlot || (nextBooked !== null && i > nextBooked) || durationMins > activeRoomMaxDuration || isOutsideHours;
                      
                      return (
                        <option key={i} value={i} disabled={isOptionDisabled}>
                          {formatSlotLabel(i)} {durationMins > activeRoomMaxDuration ? '(Exceeds Max Duration)' : isOutsideHours ? '(Outside Room Hours)' : ''}
                        </option>
                      );
                    })}
                  </select>
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

              {/* Participants Selection Text Area */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Participants (Usernames separated by commas)</label>
                <textarea
                  value={bookingParticipantsText}
                  onChange={e => setBookingParticipantsText(e.target.value)}
                  placeholder="E.g. employee, manager"
                  rows={2}
                  className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
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
              // EDIT MODE FORM (Requirement 1 & 5: Time dropdown selection and conflicts checked)
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

                {/* Room Select & Recurrence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Conference Room</label>
                    <select
                      value={editRoomId}
                      onChange={e => {
                        const newRoomId = Number(e.target.value);
                        setEditRoomId(newRoomId);
                        setEditStartSlot(0);
                        setEditEndSlot(1);
                      }}
                      className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                        theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    >
                      {filteredRooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.building})</option>
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

                {/* Start & End slot dropdown lists */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2 font-outfit">Start Time</label>
                    <select
                      value={editStartSlot}
                      onChange={e => {
                        const newStart = Number(e.target.value);
                        setEditStartSlot(newStart);
                        const nextBooked = getFirstBookedSlotAfter(editRoomId, newStart, selectedBooking.id);
                        if (editEndSlot <= newStart || (nextBooked !== null && editEndSlot > nextBooked)) {
                          setEditEndSlot(newStart + 1);
                        }
                      }}
                      className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                        theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    >
                      {Array.from({ length: totalSlotsCount }).map((_, i) => {
                        const selectedRoomObj = rooms.find(r => r.id === editRoomId);
                        const activeRoomStart = selectedRoomObj?.availableStartHour ?? 8;
                        const activeRoomEnd = selectedRoomObj?.availableEndHour ?? 18;
                        const slotHour = gridStartHour + Math.floor(i / slotsPerHour);
                        const isOutsideHours = slotHour < activeRoomStart || slotHour >= activeRoomEnd;

                        const isBooked = isSlotBooked(editRoomId, i, selectedBooking.id);
                        const isOptionDisabled = isBooked || isOutsideHours;
                        return (
                          <option key={i} value={i} disabled={isOptionDisabled}>
                            {formatSlotLabel(i)} {isBooked ? '(Booked)' : isOutsideHours ? '(Outside Room Hours)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2 font-outfit">End Time</label>
                    <select
                      value={editEndSlot}
                      onChange={e => setEditEndSlot(Number(e.target.value))}
                      className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                        theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    >
                      {Array.from({ length: totalSlotsCount }).map((_, idx) => {
                        const i = idx + 1;
                        const selectedRoomObj = rooms.find(r => r.id === editRoomId);
                        const activeRoomStart = selectedRoomObj?.availableStartHour ?? 8;
                        const activeRoomEnd = selectedRoomObj?.availableEndHour ?? 18;
                        const activeRoomMaxDuration = selectedRoomObj?.maxDuration ?? maxMeetingDuration;

                        const slotHour = gridStartHour + Math.floor((i - 1) / slotsPerHour);
                        const isOutsideHours = slotHour < activeRoomStart || slotHour >= activeRoomEnd;

                        const nextBooked = getFirstBookedSlotAfter(editRoomId, editStartSlot, selectedBooking.id);
                        const durationMins = (i - editStartSlot) * calendarInterval;
                        const isOptionDisabled = i <= editStartSlot || (nextBooked !== null && i > nextBooked) || durationMins > activeRoomMaxDuration || isOutsideHours;
                        
                        return (
                          <option key={i} value={i} disabled={isOptionDisabled}>
                            {formatSlotLabel(i)} {durationMins > activeRoomMaxDuration ? '(Exceeds Max Duration)' : isOutsideHours ? '(Outside Room Hours)' : ''}
                          </option>
                        );
                      })}
                    </select>
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

                {/* Participants Text Area */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Participants (Usernames separated by commas)</label>
                  <textarea
                    value={editParticipantsText}
                    onChange={e => setEditParticipantsText(e.target.value)}
                    placeholder="E.g. employee, manager"
                    rows={2}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
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
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block bg-blue-500/10 text-blue-600 border-blue-500/20">
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
