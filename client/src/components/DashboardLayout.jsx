import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BrainCircuit, FileText, TrendingUp, BarChart3, GraduationCap, LogOut, PanelLeftOpen, PanelLeftClose, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

const DashboardLayout = ({ children }) => {
    const { logout, user } = useAuth();
    const { isReady, pastSessions, loadingSessions, loadSession, newSession, deleteSessionById } = useSession();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', label: 'Analyzer', icon: FileText, alwaysEnabled: true },
        { to: '/dashboard/ats-score', label: 'ATS Score', icon: TrendingUp, alwaysEnabled: false },
        { to: '/dashboard/skill-gap', label: 'Skill Gap', icon: BarChart3, alwaysEnabled: false },
        { to: '/dashboard/interview-prep', label: 'Interview Prep', icon: GraduationCap, alwaysEnabled: false },
    ];

    const handleLoadSession = (session) => {
        loadSession(session);
        setSidebarOpen(false);
        navigate('/dashboard');
    };

    const handleNewSession = () => {
        newSession();
        setSidebarOpen(false);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo + Sidebar Toggle */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Session history"
                            >
                                {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                            </button>
                            <div className="text-blue-600 bg-blue-50 p-2 rounded-lg">
                                <BrainCircuit size={22} />
                            </div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
                                Smart Resume & JD Analyzer
                            </h1>
                        </div>

                        {/* Navigation Tabs */}
                        <nav className="flex items-center gap-1">
                            {navItems.map(({ to, label, icon: Icon, alwaysEnabled }) => {
                                const disabled = !alwaysEnabled && !isReady;
                                return (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        end={to === '/dashboard'}
                                        onClick={(e) => disabled && e.preventDefault()}
                                        className={({ isActive }) => {
                                            const base = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200';
                                            if (disabled) return `${base} text-gray-300 cursor-not-allowed`;
                                            if (isActive) return `${base} bg-blue-50 text-blue-700 shadow-sm`;
                                            return `${base} text-gray-500 hover:text-gray-800 hover:bg-gray-100`;
                                        }}
                                        title={disabled ? 'Upload both documents first' : ''}
                                    >
                                        <Icon size={16} />
                                        <span className="hidden md:inline">{label}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* User Info + Logout */}
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm text-gray-500 font-medium hidden sm:block">
                                {user?.username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-semibold px-3 py-2 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Session History Sidebar */}
                {sidebarOpen && (
                    <aside className="w-72 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-700">Session History</h2>
                            <button
                                onClick={handleNewSession}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                                <Plus size={12} />
                                New
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {loadingSessions && (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16" />
                                    ))}
                                </div>
                            )}

                            {!loadingSessions && pastSessions.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-8">
                                    No sessions yet. Upload documents to get started.
                                </p>
                            )}

                            {!loadingSessions && pastSessions.map(session => {
                                const resume = session.files?.find(f => f.type === 'resume');
                                const jd = session.files?.find(f => f.type === 'jd');
                                const date = new Date(session.lastActiveAt || session.createdAt);

                                return (
                                    <div
                                        key={session.sessionId}
                                        className="group p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-all cursor-pointer"
                                        onClick={() => handleLoadSession(session)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                    {resume?.filename || 'No resume'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    vs {jd?.filename || 'No JD'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSessionById(session.sessionId);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                                title="Delete session"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </aside>
                )}

                {/* Page Content */}
                <main className={`flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${sidebarOpen ? '' : 'w-full'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
