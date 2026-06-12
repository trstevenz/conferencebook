import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, ShieldAlert, CheckCircle, ShieldCheck, Clock, MapPin } from 'lucide-react';

interface Room {
  id: number;
  name: string;
  code: string;
  building: string;
}

interface Booking {
  id: number;
  room: Room;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  checkInStatus: string;
}

export const QRCheckIn: React.FC = () => {
  const { user, apiCall, theme } = useAuth();
  
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/api/bookings/my');
      // Filter only APPROVED bookings that are still active (not cancelled, not completed)
      const active = data.filter((b: Booking) =>
        b.status === 'APPROVED' && new Date(b.endTime) > new Date()
      );
      setMyBookings(active);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSimulation = async (bookingId: number) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await apiCall(`/api/bookings/${bookingId}/checkin`, {
        method: 'POST'
      });
      setSuccessMessage(`Attendance marked successfully for room "${response.room.name}"! Reservation is activated.`);
      fetchMyBookings();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-lg font-outfit">QR Check-In System</h3>
        <p className="text-xs text-slate-400 mt-1">Simulate scanning the QR code mounted at the conference room entrance to activate your booking.</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5">
          <ShieldAlert className="h-4.5 w-4.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs flex items-center gap-2.5">
          <ShieldCheck className="h-4.5 w-4.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : myBookings.length === 0 ? (
          <div className="col-span-2 p-16 text-center border border-dashed dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-3xl text-slate-500 text-sm">
            You have no upcoming approved bookings that require check-in.
          </div>
        ) : (
          myBookings.map(b => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-base">{b.title}</h4>
                  <div className="flex flex-col gap-1 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {b.room.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Simulated QR Code */}
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 flex-shrink-0">
                  <svg className="h-20 w-20 text-slate-800 dark:text-white" viewBox="0 0 100 100">
                    {/* Render a mock abstract SVG QR code */}
                    <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="12" y="12" width="11" height="11" fill="currentColor" />
                    <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="77" y="12" width="11" height="11" fill="currentColor" />
                    <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="12" y="77" width="11" height="11" fill="currentColor" />
                    {/* Random squares in QR code */}
                    <rect x="40" y="20" width="10" height="10" fill="currentColor" />
                    <rect x="50" y="40" width="15" height="10" fill="currentColor" />
                    <rect x="40" y="60" width="10" height="20" fill="currentColor" />
                    <rect x="60" y="70" width="15" height="15" fill="currentColor" />
                    <rect x="80" y="50" width="10" height="10" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* Attendance Status */}
              <div className="mt-6 pt-4 border-t dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Attendance</span>
                  <span className={`text-xs font-bold mt-1 inline-block ${
                    b.checkInStatus === 'CHECKED_IN' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {b.checkInStatus === 'CHECKED_IN' ? 'Checked In' : 'Pending Scan'}
                  </span>
                </div>

                <button
                  onClick={() => handleScanSimulation(b.id)}
                  disabled={b.checkInStatus === 'CHECKED_IN'}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                    b.checkInStatus === 'CHECKED_IN'
                      ? 'bg-emerald-500/10 text-emerald-500 cursor-not-allowed border border-emerald-500/20'
                      : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                  }`}
                >
                  {b.checkInStatus === 'CHECKED_IN' ? 'Checked In' : 'Simulate QR Scan'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
