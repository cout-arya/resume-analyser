import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleSignInButton = () => {
    const { googleLogin } = useAuth();
    const navigate = useNavigate();
    const buttonRef = useRef(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Render the Google-styled button
        if (buttonRef.current) {
            window.google.accounts.id.renderButton(buttonRef.current, {
                theme: 'outline',
                size: 'large',
                width: buttonRef.current.offsetWidth,
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left'
            });
        }
    }, [handleGoogleResponse]);

    const handleGoogleResponse = useCallback(async (response) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(response.credential);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error('Google login failed:', err);
            setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [googleLogin, navigate]);

    if (!GOOGLE_CLIENT_ID) {
        return null; // Don't render if no client ID configured
    }

    return (
        <div className="w-full">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs mb-3">
                    {error}
                </div>
            )}
            <div
                ref={buttonRef}
                className={`w-full flex justify-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            />
        </div>
    );
};

export default GoogleSignInButton;
