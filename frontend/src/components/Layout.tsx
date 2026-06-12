import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Shield,
  Hammer,
  QrCode,
  Bot,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  X,
  Send,
  User,
  ChevronRight,
  Menu,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, notifications, markNotificationRead, apiCall, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; proposal?: any }>>([
    { sender: 'ai', text: "Hello! I am your Smart Booking Assistant. Ask me to book a room (e.g. 'I need a room for 5 people tomorrow at 3 PM') or check availability." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!user) return <>{children}</>;

  const hasRole = (roles: string[]) => roles.includes(user.role);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['EMPLOYEE', 'MANAGER', 'FACILITY_ADMIN', 'SUPER_ADMIN'] },
    { name: 'Booking Room', icon: Calendar, path: '/calendar', roles: ['EMPLOYEE', 'MANAGER', 'FACILITY_ADMIN', 'SUPER_ADMIN', 'SUPER_USER'] },
    { name: 'Team Bookings', icon: Shield, path: '/team-bookings', roles: ['MANAGER', 'SUPER_ADMIN'] },
    { name: 'Room Directory', icon: Settings, path: '/rooms', roles: ['FACILITY_ADMIN', 'SUPER_ADMIN'] },
    { name: 'Maintenance Logs', icon: Hammer, path: '/maintenance', roles: ['FACILITY_ADMIN', 'SUPER_ADMIN'] },
    { name: 'Reports & Analytics', icon: BarChart3, path: '/analytics', roles: ['EMPLOYEE', 'MANAGER', 'FACILITY_ADMIN', 'SUPER_ADMIN'] },
    { name: 'User Management', icon: User, path: '/super-admin', roles: ['SUPER_ADMIN'] },
  ];

  const unreadNotifs = notifications.filter(n => !n.readStatus);

  const submitAIMessage = async (userText: string) => {
    if (!userText.trim()) return;

    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setIsAiLoading(true);

    try {
      const response = await apiCall('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userText })
      });

      setChatHistory(prev => [...prev, {
        sender: 'ai',
        text: response.reply,
        proposal: response.actionProposed ? response : null
      }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Error: ' + err.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendAIMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    const userText = aiMessage;
    setAiMessage('');
    await submitAIMessage(userText);
  };

  const handleConfirmAIBooking = async (proposal: any) => {
    try {
      setIsAiLoading(true);
      const bookingPayload = {
        roomId: proposal.proposedRoom.id,
        userId: user.id,
        startTime: proposal.proposedStartTime,
        endTime: proposal.proposedEndTime,
        title: `AI Scheduled Meeting (Organized by ${user.fullName})`,
        description: 'Scheduled automatically via AI Chat Assistant.',
        participantIds: []
      };

      await apiCall('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingPayload)
      });

      setChatHistory(prev => [...prev, {
        sender: 'ai',
        text: `🎉 Success! I have successfully booked **${proposal.proposedRoom.name}** for you starting on ${new Date(proposal.proposedStartTime).toLocaleString()}.`
      }]);
      
      // dispatch booking-updated custom event to trigger silent refresh
      window.dispatchEvent(new CustomEvent('booking-updated'));
    } catch (err: any) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Booking failed: ' + err.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col border-r ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-inherit">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-primary-600 text-white flex-shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            {isSidebarOpen && (
              <span className="font-semibold text-lg font-outfit tracking-wide text-primary-600 dark:text-primary-500">
                Antigravity Rooms
              </span>
            )}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:block hidden">
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems
            .filter(item => hasRole(item.roles))
            .map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="truncate">{item.name}</span>}
                </button>
              );
            })}
        </nav>

        {/* Sign Out has been moved to the top-right header */}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-8 border-b ${theme === 'dark' ? 'bg-[#1e293b]/50 border-slate-700' : 'bg-white/80 border-slate-200'} backdrop-blur-md sticky top-0 z-30`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-semibold text-xl font-outfit truncate">
              {menuItems.find(i => i.path === location.pathname)?.name || 'Conference Hub'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-500" />}
            </button>

            {/* Notifications Dropdown */}
            {user.role !== 'SUPER_USER' && (
              <div className="relative">
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-xl border overflow-hidden z-50 ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="px-5 py-4 border-b border-inherit flex items-center justify-between">
                      <span className="font-semibold font-outfit">Notifications</span>
                      <span className="text-xs text-slate-500">{unreadNotifs.length} new</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y dark:divide-slate-700">
                      {notifications.length === 0 ? (
                        <div className="p-5 text-center text-sm text-slate-500">No alerts yet</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-4 flex gap-3 ${!n.readStatus ? 'bg-primary-500/5 dark:bg-primary-500/10' : ''}`}>
                            <div className="mt-0.5">
                              {n.type.includes('CANCEL') || n.type.includes('REJECT') ? (
                                <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
                              ) : (
                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">{n.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                              {!n.readStatus && (
                                <button onClick={() => markNotificationRead(n.id)} className="text-[10px] text-primary-600 font-semibold mt-2 hover:underline">
                                  Mark Read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            <div className="flex items-center gap-3 pl-2 border-l dark:border-slate-700">
              <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold">
                {user.fullName.charAt(0)}
              </div>
              <div className="text-left md:block hidden">
                <p className="font-semibold text-sm leading-none">{user.fullName}</p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-1 uppercase block">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Logout button placed top right next to profile */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className={`flex-1 relative ${user.role === 'SUPER_USER' ? 'p-0 overflow-hidden' : 'p-8 overflow-y-auto'}`}>
          {children}
        </main>
      </div>

      {/* Floating AI Chat Trigger */}
      {
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-2xl shadow-primary-500/30 flex items-center justify-center hover:scale-105 transition-all z-40"
        >
          <Bot className="h-6 w-6" />
        </button>
      }

      {/* AI Assistant Chat Drawer */}
      {isAIChatOpen && (
        <>
          {/* Backdrop */}
          <div onClick={() => setIsAIChatOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40" />

          {/* Chat Panel */}
          <div className={`fixed top-0 right-0 h-full w-96 shadow-2xl z-50 flex flex-col ${theme === 'dark' ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className="h-16 px-6 border-b dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary-600" />
                <span className="font-semibold font-outfit">AI Room Assistant</span>
              </div>
              <button onClick={() => setIsAIChatOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    chat.sender === 'user'
                      ? 'bg-primary-600 text-white'
                      : theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{chat.text}</p>
                    
                    {/* Render action card for proposed booking */}
                    {chat.proposal && (
                      <div className="mt-3 p-3 rounded-xl border border-primary-500/30 bg-primary-500/10 text-left">
                        <p className="font-semibold text-xs text-primary-600 dark:text-primary-400">Proposed Slot</p>
                        <p className="font-bold text-sm mt-1">{chat.proposal.proposedRoom.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(chat.proposal.proposedStartTime).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleConfirmAIBooking(chat.proposal)}
                          disabled={isAiLoading}
                          className="mt-3 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          Confirm Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className={`rounded-2xl px-4 py-3 text-sm flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Questions */}
            <div className={`px-4 py-3 border-t dark:border-slate-700 ${theme === 'dark' ? 'bg-[#1e293b]/40' : 'bg-slate-50/50'}`}>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Suggested Actions</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => submitAIMessage("Book a room for 5 people tomorrow at 3 PM")}
                  disabled={isAiLoading}
                  className="w-full text-left text-xs font-semibold px-3 py-2 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-between group"
                >
                  <span>📅 Book a room for 5 people tomorrow at 3 PM</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all text-primary-500" />
                </button>
                <button
                  type="button"
                  onClick={() => submitAIMessage("Which rooms are free now?")}
                  disabled={isAiLoading}
                  className="w-full text-left text-xs font-semibold px-3 py-2 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-between group"
                >
                  <span>🔍 Check room availability (Free Now)</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all text-primary-500" />
                </button>
                <button
                  type="button"
                  onClick={() => submitAIMessage("Help")}
                  disabled={isAiLoading}
                  className="w-full text-left text-xs font-semibold px-3 py-2 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-between group"
                >
                  <span>ℹ️ Help & booking guide</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all text-primary-500" />
                </button>
              </div>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendAIMessage} className="p-4 border-t dark:border-slate-700 flex gap-2">
              <input
                type="text"
                value={aiMessage}
                onChange={e => setAiMessage(e.target.value)}
                placeholder="Ask AI to book a room..."
                className={`flex-1 rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <button type="submit" className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-lg transition-all">
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
