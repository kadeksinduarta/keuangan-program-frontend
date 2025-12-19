'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaChartLine, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

export default function Login() {
    const router = useRouter();
    const { login, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: email, 2: password, 3: success

    useEffect(() => {
        // Auto focus email field
        const emailInput = document.getElementById('email-input');
        if (emailInput) emailInput.focus();
    }, []);

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Masukkan email yang valid');
            return;
        }
        setError('');
        setStep(2);
        // Auto focus password field
        setTimeout(() => {
            const passwordInput = document.getElementById('password-input');
            if (passwordInput) passwordInput.focus();
        }, 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                setStep(3);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            } else {
                setError(result.message || 'Login gagal. Periksa kredensial Anda.');
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa kredensial Anda.');
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setStep(1);
        setError('');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                    <p className="text-slate-600">Memuat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-indigo-200 rounded-full blur-3xl -top-48 -left-48 animate-pulse opacity-30"></div>
                <div className="absolute w-96 h-96 bg-purple-200 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse opacity-30" style={{ animationDelay: '1s' }}></div>
                <div className="absolute w-64 h-64 bg-pink-200 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse opacity-20" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-6 shadow-xl transform hover:scale-105 transition-transform">
                        <FaChartLine className="text-4xl text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Sistem Manajemen Keuangan
                    </h1>
                    <p className="text-lg text-slate-600 font-medium">Program Berbasis RAB</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-100 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600">Sistem Terintegrasi & Transparan</span>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/50 animate-fade-in">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {step > 1 ? <FaCheckCircle /> : '1'}
                            </div>
                            <div className={`w-12 h-1 transition-all ${
                                step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {step > 2 ? <FaCheckCircle /> : '2'}
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Email */}
                    {step === 1 && (
                        <div className="animate-slide-in">
                            <h2 className="text-2xl font-bold mb-2 text-slate-900">Masuk ke Akun</h2>
                            <p className="text-slate-600 mb-6">Masukkan email Anda untuk melanjutkan</p>

                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="email-input"
                                            type="email"
                                            className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 transition-all"
                                            placeholder="nama@email.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError('');
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-slide-in">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] inline-flex items-center justify-center gap-2"
                                >
                                    <span>Lanjutkan</span>
                                    <FaArrowRight />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 2: Password */}
                    {step === 2 && (
                        <div className="animate-slide-in">
                            <button
                                onClick={handleBack}
                                className="mb-4 text-slate-600 hover:text-slate-900 inline-flex items-center gap-2 text-sm"
                            >
                                <FaArrowRight className="rotate-180" /> Kembali
                            </button>
                            <h2 className="text-2xl font-bold mb-2 text-slate-900">Masukkan Password</h2>
                            <p className="text-slate-600 mb-2">Email: <span className="font-semibold text-slate-900">{email}</span></p>
                            <p className="text-sm text-slate-500 mb-6">Masukkan password untuk melanjutkan</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="password-input"
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 transition-all"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setError('');
                                            }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-slide-in">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Masuk</span>
                                            <FaArrowRight />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                    Lupa password?
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center py-8 animate-slide-in">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                                <FaCheckCircle className="text-4xl text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-slate-900">Login Berhasil!</h2>
                            <p className="text-slate-600">Mengarahkan ke dashboard...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center animate-fade-in">
                    <p className="text-sm text-slate-500 mb-2">
                        Belum punya akun?{' '}
                        <a href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                            Daftar disini
                        </a>
                    </p>
                    <p className="text-xs text-slate-400">
                        © 2025 Sistem Keuangan Program. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
