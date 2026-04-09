import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BrainCircuit, FileText, TrendingUp, BarChart3, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

const DashboardLayout = ({ children }) => {
    const { logout, user } = useAuth();
    const { isReady } = useSession();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', label: 'Analyzer', icon: FileText, alwaysEnabled: true },
        { to: '/dashboard/ats-score', label: 'ATS Score', icon: TrendingUp, alwaysEnabled: false },
        { to: '/dashboard/skill-gap', label: 'Skill Gap', icon: BarChart3, alwaysEnabled: false },
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2 shrink-0">
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

            {/* Page Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
