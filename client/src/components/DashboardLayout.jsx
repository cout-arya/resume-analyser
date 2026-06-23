import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { BrainCircuit, FileText, TrendingUp, BarChart3, GraduationCap, Lightbulb, FileSignature, LogOut, PanelLeftOpen, PanelLeftClose, Plus, Trash2, Loader2 } from 'lucide-react';
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
        { to: '/dashboard/suggestions', label: 'Suggestions', icon: Lightbulb, alwaysEnabled: false },
        { to: '/dashboard/cover-letter', label: 'Cover Letter', icon: FileSignature, alwaysEnabled: false },
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
        <div className="min-h-screen bg-[#f3f6ec] text-zinc-900 font-body flex flex-col">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b-4 border-zinc-900 sticky top-0 z-20 shadow-[0px_4px_0px_#18181b]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-[4.5rem]">

                        <div className="flex items-center gap-8 xl:gap-16">
                            {/* Logo + Sidebar Toggle */}
                            <div className="flex items-center gap-4 shrink-0">
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="p-2 text-zinc-900 hover:bg-lime-400 border-2 border-transparent hover:border-zinc-900 rounded-xl transition-all hover:shadow-[2px_2px_0px_#18181b]"
                                    title="Session history"
                                >
                                    {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                                </button>

                                <Link to="/" className="flex items-center gap-2 group hidden sm:flex">
                                    <div className="w-10 h-10 bg-lime-400 text-zinc-900 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] flex items-center justify-center font-black group-hover:-translate-y-1 transition-transform">
                                        <span className="material-symbols-outlined text-[20px]">bolt</span>
                                    </div>
                                    <h1 className="text-2xl font-black tracking-tighter font-headline ml-1 text-zinc-900">
                                        JDFit
                                    </h1>
                                </Link>
                            </div>

                            {/* Navigation Tabs */}
                            <nav className="hidden xl:flex items-center gap-4">
                                {navItems.map((item) => {
                                    const { to, label, alwaysEnabled } = item;
                                    const Icon = item.icon;
                                    const disabled = !alwaysEnabled && !isReady;
                                    return (
                                        <NavLink
                                            key={to}
                                            to={to}
                                            end={to === '/dashboard'}
                                            onClick={(e) => disabled && e.preventDefault()}
                                            className={({ isActive }) => {
                                                const base = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2';
                                                if (disabled) return `${base} text-zinc-300 border-transparent cursor-not-allowed`;
                                                if (isActive) return `${base} bg-lime-400 text-zinc-900 border-zinc-900 shadow-[2px_2px_0px_#18181b] -translate-y-0.5`;
                                                return `${base} text-zinc-500 border-transparent hover:text-zinc-900 hover:bg-zinc-100`;
                                            }}
                                            title={disabled ? 'Upload both documents first' : ''}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                                                    <span>{label}</span>
                                                </>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </nav>

                            {/* Mobile Navigation Dropdown (simplified version mapping to icon-only) */}
                            <nav className="flex xl:hidden items-center gap-2">
                                {navItems.map((item) => {
                                    const { to, alwaysEnabled } = item;
                                    const Icon = item.icon;
                                    const disabled = !alwaysEnabled && !isReady;
                                    return (
                                        <NavLink
                                            key={to}
                                            to={to}
                                            end={to === '/dashboard'}
                                            onClick={(e) => disabled && e.preventDefault()}
                                            className={({ isActive }) => {
                                                const base = 'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 border-2';
                                                if (disabled) return `${base} text-zinc-300 border-transparent cursor-not-allowed`;
                                                if (isActive) return `${base} bg-lime-400 text-zinc-900 border-zinc-900 shadow-[2px_2px_0px_#18181b] -translate-y-0.5`;
                                                return `${base} text-zinc-500 border-transparent hover:text-zinc-900 hover:bg-zinc-100`;
                                            }}
                                            title={disabled ? 'Upload both documents first' : item.label}
                                        >
                                            {({ isActive }) => (
                                                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* User Info + Logout */}
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm text-zinc-600 font-bold hidden sm:block bg-zinc-100 px-3 py-1 rounded-lg border-2 border-zinc-200">
                                @{user?.username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 text-sm text-rose-600 hover:text-white font-black px-4 py-2 hover:bg-rose-600 border-2 border-transparent hover:border-zinc-900 rounded-xl transition-all hover:shadow-[2px_2px_0px_#18181b] ml-2"
                            >
                                <LogOut size={16} strokeWidth={3} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 relative overflow-hidden">
                {/* Session History Sidebar */}
                <div
                    className={`absolute z-10 md:relative h-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-full sm:w-80 translate-x-0' : 'w-0 -translate-x-full border-r-0'} bg-white border-r-4 border-zinc-900 shadow-[4px_0px_0px_#18181b] flex flex-col shrink-0`}
                    style={{ visibility: sidebarOpen ? 'visible' : 'hidden' }}
                >
                    <div className="flex items-center justify-between p-5 border-b-2 border-zinc-100">
                        <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider">Session History</h2>
                        <button
                            onClick={handleNewSession}
                            className="flex items-center gap-1 text-xs text-zinc-900 font-black px-3 py-2 bg-lime-400 hover:bg-lime-300 border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] rounded-xl transition-all hover:-translate-y-0.5"
                        >
                            <Plus size={14} strokeWidth={3} />
                            NEW
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loadingSessions && (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse bg-zinc-100 rounded-2xl h-20 border-2 border-zinc-200" />
                                ))}
                            </div>
                        )}

                        {!loadingSessions && pastSessions.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl border-2 border-zinc-200 flex items-center justify-center mx-auto mb-3">
                                    <FileText className="text-zinc-400" />
                                </div>
                                <p className="text-sm font-bold text-zinc-500">No sessions yet.</p>
                                <p className="text-xs text-zinc-400 mt-1">Upload documents to get started.</p>
                            </div>
                        )}

                        {!loadingSessions && pastSessions.map(session => {
                            const resume = session.files?.find(f => f.type === 'resume');
                            const jd = session.files?.find(f => f.type === 'jd');
                            const date = new Date(session.lastActiveAt || session.createdAt);

                            return (
                                <div
                                    key={session.sessionId}
                                    className="group p-4 bg-zinc-50 hover:bg-lime-50 rounded-2xl border-2 border-zinc-200 hover:border-zinc-900 transition-all cursor-pointer hover:shadow-[4px_4px_0px_#18181b] hover:-translate-y-0.5"
                                    onClick={() => handleLoadSession(session)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-zinc-900 truncate mb-1 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-lime-600">article</span>
                                                {resume?.filename || 'No resume'}
                                            </p>
                                            <p className="text-xs font-semibold text-zinc-500 truncate flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">work</span>
                                                {jd?.filename || 'No JD'}
                                            </p>
                                            <div className="w-full h-px bg-zinc-200 my-2"></div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSessionById(session.sessionId);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-white hover:bg-rose-600 border-2 border-transparent hover:border-zinc-900 rounded-xl transition-all"
                                            title="Delete session"
                                        >
                                            <Trash2 size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Page Content */}
                <main className={`flex-1 overflow-y-auto w-full transition-all duration-300`}>
                    <div className="px-4 sm:px-6 py-8 w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
