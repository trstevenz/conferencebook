import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BookingsCalendar } from './pages/BookingsCalendar';
import { TeamBookings } from './pages/TeamBookings';
import { RoomManagement } from './pages/RoomManagement';
import { MaintenanceScheduler } from './pages/MaintenanceScheduler';
import { MeetingSummaryGenerator } from './pages/MeetingSummaryGenerator';
import { QRCheckIn } from './pages/QRCheckIn';
import { SuperAdminPortal } from './pages/SuperAdminPortal';
import { Analytics } from './pages/Analytics';

const AuthenticatedApp: React.FC = () => {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Login />;
  }

  // Helper to restrict access based on roles
  const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<BookingsCalendar />} />
        <Route path="/summarizer" element={<MeetingSummaryGenerator />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/qr-checkin" element={<QRCheckIn />} />
        
        {/* Manager & Admin */}
        <Route path="/team-bookings" element={
          <ProtectedRoute allowedRoles={['MANAGER', 'SUPER_ADMIN']}>
            <TeamBookings />
          </ProtectedRoute>
        } />
        
        {/* Facility Admin & Super Admin */}
        <Route path="/rooms" element={
          <ProtectedRoute allowedRoles={['FACILITY_ADMIN', 'SUPER_ADMIN']}>
            <RoomManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/maintenance" element={
          <ProtectedRoute allowedRoles={['FACILITY_ADMIN', 'SUPER_ADMIN']}>
            <MaintenanceScheduler />
          </ProtectedRoute>
        } />
        
        {/* Super Admin Only */}
        <Route path="/super-admin" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminPortal />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  );
}

export default App;
