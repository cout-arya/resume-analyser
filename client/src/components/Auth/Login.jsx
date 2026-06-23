import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Loader2 } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f6ec] p-4 font-body">
            {/* 3D Main Card Container */}
            <div className="w-full max-w-5xl bg-white rounded-[2.5rem] p-3 md:p-4 shadow-[12px_12px_0px_#18181b] border-4 border-zinc-900 flex flex-col md:flex-row overflow-hidden min-h-[600px]">

                {/* Left Side - Image */}
                <div className="hidden md:flex w-1/2 rounded-[2rem] overflow-hidden relative border-4 border-transparent p-1">
                    <div className="absolute inset-0 bg-lime-400 mix-blend-multiply opacity-20 z-10 pointer-events-none rounded-[1.5rem]"></div>
                    <img
                        src="/images/interview_illustration.png"
                        alt="Job Interview"
                        className="w-full h-full object-cover rounded-[1.5rem]"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80' }}
                    />

                    {/* Floating badge for 3D effect on image */}
                    <div className="absolute bottom-10 left-10 z-20 bg-white border-[3px] border-zinc-900 rounded-xl p-4 shadow-[4px_4px_0px_#18181b] animate-float transform rotate-2">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-lime-400 rounded-full animate-pulse"></div>
                            <span className="font-bold text-zinc-900 text-sm tracking-wide">Ace your next interview.</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-10 relative bg-white rounded-[2rem]">
                    <div className="text-center md:text-left mb-8">
                        <div className="inline-block w-12 h-12 bg-lime-400 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] mb-6 flex items-center justify-center">
                            <span className="material-symbols-outlined text-zinc-900 font-bold">login</span>
                        </div>
                        <h2 className="text-4xl font-black text-zinc-900 mb-2 font-headline tracking-tighter">Welcome Back</h2>
                        <p className="text-zinc-500 font-medium text-sm md:text-base">Ready to align your resume with the perfect job?</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border-2 border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm mb-6 font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    {/* Google Sign-In */}
                    <div className="mb-6">
                        <GoogleSignInButton />
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-zinc-100"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 py-1 bg-zinc-100 rounded-full text-zinc-500 font-bold text-xs uppercase tracking-wider">or email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-zinc-900 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 group-focus-within:text-lime-500 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-2xl focus:ring-0 focus:border-zinc-900 transition-all text-zinc-900 font-medium placeholder:text-zinc-400 outline-none"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-zinc-900 uppercase tracking-widest ml-1 flex justify-between">
                                Password
                                <span className="text-lime-600 cursor-pointer font-bold capitalize tracking-normal hover:underline">Forgot?</span>
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 group-focus-within:text-lime-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-2xl focus:ring-0 focus:border-zinc-900 transition-all text-zinc-900 font-medium placeholder:text-zinc-400 outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-2 shadow-[0px_8px_20px_rgba(0,0,0,0.15)] shadow-[0px_4px_0px_#4d4d4d] hover:-translate-y-1 mt-6 border border-zinc-900"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span>Login securely</span>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-zinc-500 text-sm mt-8 font-medium">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-zinc-900 font-black hover:text-lime-600 transition-colors underline decoration-2 underline-offset-4">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>

            {/* Reusable float animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
               @keyframes float {
                 0%, 100% { transform: translateY(0px) rotate(2deg); }
                 50% { transform: translateY(-10px) rotate(2deg); }
               }
               .animate-float {
                 animation: float 4s ease-in-out infinite;
               }
            `}} />
        </div>
    );
};

export default Login;
