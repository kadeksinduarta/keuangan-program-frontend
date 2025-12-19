'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/router';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                // Verify token dengan backend
                const response = await authAPI.me();
                if (response.data.success) {
                    setUser(response.data.user);
                } else {
                    throw new Error('Invalid token');
                }
            } catch (error) {
                // Token invalid, clear storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            
            if (response.data.success) {
                const { user, access_token } = response.data;

                localStorage.setItem('token', access_token);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);

                return { success: true, user };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Login gagal',
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login gagal. Periksa koneksi internet Anda.',
            };
        }
    };

    const register = async (data) => {
        try {
            const response = await authAPI.register(data);
            
            if (response.data.success) {
                const { user, access_token } = response.data;

                localStorage.setItem('token', access_token);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);

                return { success: true, user };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Registrasi gagal',
                };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message;
            if (errorMessage) {
                // Handle validation errors
                if (typeof errorMessage === 'object') {
                    const firstError = Object.values(errorMessage)[0];
                    return {
                        success: false,
                        message: Array.isArray(firstError) ? firstError[0] : firstError,
                    };
                }
                return {
                    success: false,
                    message: errorMessage,
                };
            }
            return {
                success: false,
                message: 'Registrasi gagal. Periksa koneksi internet Anda.',
            };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            if (router.pathname !== '/login') {
                router.push('/login');
            }
        }
    };

    const isAdmin = () => user?.role === 'admin';
    const isKetua = (programId) => {
        // Check dari program user roles jika ada
        return false; // TODO: implement check dari program
    };
    const isBendahara = (programId) => {
        return false; // TODO: implement check dari program
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            loading,
            isAdmin,
            isKetua,
            isBendahara,
            checkAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
