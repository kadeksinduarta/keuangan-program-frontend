'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { expenseAPI, programAPI, dashboardAPI } from '@/lib/api';
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaFileImage, FaFilePdf, FaUser } from 'react-icons/fa';

export default function Approvals() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [rejectionNote, setRejectionNote] = useState('');
    const [confirmChecked, setConfirmChecked] = useState(false);

    useEffect(() => {
        if (!isAdmin()) {
            router.push('/dashboard');
        }
    }, [user]);

    useEffect(() => {
        loadPrograms();
    }, []);

    useEffect(() => {
        if (selectedProgram) {
            loadData();
        }
    }, [selectedProgram]);

    const loadPrograms = async () => {
        try {
            const response = await programAPI.getAll();
            const programList = response.data.programs;
            setPrograms(programList);
            if (programList.length > 0) {
                setSelectedProgram(programList[0]);
            }
        } catch (error) {
            console.error('Error loading programs:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [expensesRes, dashboardRes] = await Promise.all([
                expenseAPI.getByProgram(selectedProgram.id),
                dashboardAPI.get(selectedProgram.id),
            ]);
            const pendingExpenses = expensesRes.data.expenses.filter(e => e.status === 'pending');
            setExpenses(pendingExpenses);
            setDashboard(dashboardRes.data.dashboard);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = (expense) => {
        setSelectedExpense(expense);
        setActionType('approve');
        setConfirmChecked(false);
    };

    const openRejectionModal = (expense) => {
        setSelectedExpense(expense);
        setActionType('reject');
        setRejectionNote('');
        setConfirmChecked(false);
    };

    const closeModal = () => {
        setSelectedExpense(null);
        setActionType(null);
        setRejectionNote('');
        setConfirmChecked(false);
    };

    const handleApprove = async () => {
        if (!confirmChecked) {
            alert('Harap centang konfirmasi terlebih dahulu');
            return;
        }

        try {
            await expenseAPI.approve(selectedExpense.id);
            alert('✓ Pengeluaran berhasil disetujui!\n\nAnggaran telah dikurangi dan pengaju akan menerima notifikasi.');
            closeModal();
            loadData();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Gagal menyetujui pengeluaran'));
        }
    };

    const handleReject = async () => {
        if (!rejectionNote.trim()) {
            alert('Harap masukkan alasan penolakan yang jelas');
            return;
        }

        if (!confirmChecked) {
            alert('Harap centang konfirmasi terlebih dahulu');
            return;
        }

        try {
            await expenseAPI.reject(selectedExpense.id, rejectionNote);
            alert('✓ Pengeluaran berhasil ditolak.\n\nPengaju akan menerima notifikasi beserta alasan penolakan.');
            closeModal();
            loadData();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Gagal menolak pengeluaran'));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    if (!isAdmin()) {
        return null;
    }

    const selectedCategory = selectedExpense ?
        dashboard?.category_breakdown.find(c => c.id === selectedExpense.category_id) : null;

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                {/* Page Header with Admin Responsibility Message */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-3 text-text-primary">Persetujuan Pengeluaran</h1>
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
                        <div className="flex items-start gap-3">
                            <FaExclamationTriangle className="text-yellow-500 text-xl mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-text-secondary leading-relaxed">
                                <p className="font-medium text-text-primary mb-2">Tanggung Jawab Admin:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Keputusan persetujuan atau penolakan <strong>berdampak langsung pada anggaran</strong></li>
                                    <li>Setelah disetujui, dana <strong>tidak dapat dikembalikan</strong> tanpa pencatatan ulang</li>
                                    <li>Selalu <strong>periksa nota/struk</strong> untuk memastikan kesesuaian</li>
                                    <li>Berikan <strong>alasan yang jelas</strong> saat menolak pengajuan</li>
                                    <li>Semua keputusan Anda <strong>tercatat dalam log aktivitas</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Program Selector */}
                    {programs.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-text-secondary">
                                Program yang sedang dilihat:
                            </label>
                            <select
                                value={selectedProgram?.id}
                                onChange={(e) => {
                                    const program = programs.find(p => p.id === parseInt(e.target.value));
                                    setSelectedProgram(program);
                                }}
                                className="input max-w-md"
                            >
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>{program.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Budget Overview */}
                {dashboard && (
                    <div className="bg-white/5 border border-border rounded-xl p-6 mb-8">
                        <h3 className="font-semibold mb-4 text-text-primary">Status Anggaran Saat Ini</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-bg-tertiary/50 p-4 rounded-lg">
                                <p className="text-sm text-text-muted mb-1">Total Anggaran</p>
                                <p className="text-2xl font-bold text-blue-400">{formatCurrency(dashboard.program.total_budget)}</p>
                            </div>
                            <div className="bg-bg-tertiary/50 p-4 rounded-lg">
                                <p className="text-sm text-text-muted mb-1">Sudah Terpakai</p>
                                <p className="text-2xl font-bold text-purple-400">{formatCurrency(dashboard.program.total_spent)}</p>
                            </div>
                            <div className="bg-bg-tertiary/50 p-4 rounded-lg">
                                <p className="text-sm text-text-muted mb-1">Sisa Tersedia</p>
                                <p className="text-2xl font-bold text-green-400">{formatCurrency(dashboard.program.remaining_budget)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pending Count */}
                <div className="mb-6">
                    {expenses.length === 0 ? (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                            <FaCheckCircle className="text-green-400 text-2xl" />
                            <p className="text-green-400 font-medium">
                                Tidak ada pengajuan yang menunggu persetujuan saat ini
                            </p>
                        </div>
                    ) : (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
                            <FaExclamationTriangle className="text-yellow-400 text-2xl" />
                            <div>
                                <p className="text-yellow-400 font-semibold">
                                    {expenses.length} pengajuan perlu ditinjau
                                </p>
                                <p className="text-sm text-text-secondary mt-1">
                                    Harap periksa kelengkapan dokumen sebelum menyetujui
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Expenses List */}
                <div className="bg-white/5 border border-border rounded-xl p-8">
                    <h3 className="text-xl font-bold mb-6 text-text-primary">Daftar Pengajuan Pending</h3>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                            <p className="text-text-secondary">Memuat data...</p>
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-12 text-text-muted">
                            <FaCheckCircle className="text-6xl mx-auto mb-4 text-green-500/50" />
                            <p className="text-lg font-medium">Semua pengajuan sudah ditangani</p>
                            <p className="text-sm mt-2">Tidak ada yang perlu ditinjau saat ini</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {expenses.map((expense) => {
                                const category = dashboard?.category_breakdown.find(c => c.id === expense.category_id);
                                const wouldExceed = category && expense.amount > category.remaining_budget;

                                return (
                                    <div key={expense.id} className="bg-bg-secondary border border-border rounded-lg p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Expense Details */}
                                            <div className="lg:col-span-2">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-text-primary text-lg mb-1">
                                                            {expense.description}
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                                                            <span className="flex items-center gap-1">
                                                                <FaUser className="text-xs" />
                                                                {expense.submitted_by?.name}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {new Date(expense.transaction_date).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                                        {expense.category?.name}
                                                    </span>
                                                </div>

                                                {/* Amount and Budget Impact */}
                                                <div className="bg-bg-tertiary/50 rounded-lg p-4 mb-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm text-text-secondary">Jumlah Pengajuan:</span>
                                                        <span className="text-2xl font-bold text-text-primary">{formatCurrency(expense.amount)}</span>
                                                    </div>
                                                    {category && (
                                                        <>
                                                            <div className="flex justify-between text-sm text-text-secondary">
                                                                <span>Sisa anggaran kategori ini:</span>
                                                                <span className={wouldExceed ? 'text-red-400 font-semibold' : 'text-green-400'}>
                                                                    {formatCurrency(category.remaining_budget)}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 pt-3 border-t border-border/50">
                                                                <p className="text-sm font-medium text-text-muted mb-1">
                                                                    Jika disetujui, sisa anggaran kategori akan menjadi:
                                                                </p>
                                                                <p className={`text-xl font-bold ${wouldExceed ? 'text-red-400' : 'text-green-400'}`}>
                                                                    {formatCurrency(Math.max(0, category.remaining_budget - expense.amount))}
                                                                </p>
                                                            </div>
                                                            {wouldExceed && (
                                                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                                                    <p className="text-sm text-red-400 font-medium">
                                                                        ⚠️ Peringatan: Jumlah ini melebihi sisa anggaran kategori!
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Receipt */}
                                                {expense.receipts?.[0] && (
                                                    <a
                                                        href={`http://localhost:8000/storage/${expense.receipts[0].file_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-bg-tertiary hover:bg-bg-hover rounded-lg transition-colors"
                                                    >
                                                        {expense.receipts[0].file_type === 'pdf' ? <FaFilePdf /> : <FaFileImage />}
                                                        <span>Lihat Bukti Nota/Struk</span>
                                                    </a>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => openApprovalModal(expense)}
                                                    className="btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3"
                                                    disabled={wouldExceed}
                                                >
                                                    <FaCheckCircle />
                                                    <span>Setujui</span>
                                                </button>
                                                <button
                                                    onClick={() => openRejectionModal(expense)}
                                                    className="btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 py-3"
                                                >
                                                    <span>✕</span>
                                                    <span>Tolak</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Approval Modal */}
                {selectedExpense && actionType === 'approve' && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-bg-secondary border-2 border-green-500/30 rounded-xl max-w-lg w-full p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaCheckCircle className="text-4xl text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-2">Konfirmasi Persetujuan</h3>
                                <p className="text-sm text-text-secondary">
                                    Pastikan Anda sudah memeriksa kelengkapan dan kesesuaian pengajuan
                                </p>
                            </div>

                            <div className="bg-bg-tertiary rounded-lg p-4 mb-6 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-text-secondary">Pengaju:</span>
                                    <span className="font-medium text-text-primary">{selectedExpense.submitted_by?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-text-secondary">Kategori:</span>
                                    <span className="font-medium text-text-primary">{selectedExpense.category?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-text-secondary">Jumlah:</span>
                                    <span className="text-xl font-bold text-green-400">{formatCurrency(selectedExpense.amount)}</span>
                                </div>
                            </div>

                            {selectedCategory && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                                    <p className="text-sm font-medium text-yellow-400 mb-2">Dampak terhadap anggaran:</p>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between text-text-secondary">
                                            <span>Sisa anggaran sebelum:</span>
                                            <span className="font-medium">{formatCurrency(selectedCategory.remaining_budget)}</span>
                                        </div>
                                        <div className="flex justify-between text-green-400 font-semibold">
                                            <span>Sisa anggaran sesudah:</span>
                                            <span>{formatCurrency(selectedCategory.remaining_budget - selectedExpense.amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <label className="flex items-start gap-3 mb-6 cursor-pointer p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors">
                                <input
                                    type="checkbox"
                                    checked={confirmChecked}
                                    onChange={(e) => setConfirmChecked(e.target.checked)}
                                    className="mt-1"
                                />
                                <span className="text-sm text-text-secondary">
                                    Saya sudah <strong className="text-text-primary">memeriksa bukti nota</strong> dan yakin pengajuan ini <strong className="text-text-primary">layak disetujui</strong>. Saya memahami keputusan ini akan langsung mengurangi sisa anggaran.
                                </span>
                            </label>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleApprove}
                                    className={`btn flex-1 py-3 ${confirmChecked ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'} text-white`}
                                    disabled={!confirmChecked}
                                >
                                    <FaCheckCircle />
                                    <span>Ya, Setujui Sekarang</span>
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="btn btn-secondary flex-1 py-3"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejection Modal */}
                {selectedExpense && actionType === 'reject' && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-bg-secondary border-2 border-red-500/30 rounded-xl max-w-lg w-full p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl text-red-400">✕</span>
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-2">Tolak Pengajuan</h3>
                                <p className="text-sm text-text-secondary">
                                    Berikan alasan yang jelas agar pengaju memahami dan bisa memperbaiki
                                </p>
                            </div>

                            <div className="bg-bg-tertiary rounded-lg p-4 mb-6">
                                <p className="text-sm text-text-secondary mb-1">Pengajuan dari:</p>
                                <p className="font-semibold text-text-primary">{selectedExpense.submitted_by?.name}</p>
                                <p className="text-sm text-text-muted mt-2 line-clamp-2">{selectedExpense.description}</p>
                                <p className="text-xl font-bold text-text-primary mt-3">{formatCurrency(selectedExpense.amount)}</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2 text-text-primary">
                                    Alasan Penolakan <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={rejectionNote}
                                    onChange={(e) => setRejectionNote(e.target.value)}
                                    className="input"
                                    rows="5"
                                    placeholder="Contoh: Nota yang diupload kurang jelas dan tidak terbaca. Mohon upload ulang dengan foto yang lebih baik agar bisa diverifikasi."
                                    required
                                />
                                <p className="text-xs text-text-muted mt-2">
                                    Alasan ini akan dikirim ke pengaju. Berikan penjelasan yang konstruktif.
                                </p>
                            </div>

                            <label className="flex items-start gap-3 mb-6 cursor-pointer p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors">
                                <input
                                    type="checkbox"
                                    checked={confirmChecked}
                                    onChange={(e) => setConfirmChecked(e.target.checked)}
                                    className="mt-1"
                                />
                                <span className="text-sm text-text-secondary">
                                    Saya sudah <strong className="text-text-primary">memberikan alasan yang jelas</strong> dan yakin pengajuan ini <strong className="text-text-primary">perlu ditolak</strong>. Pengaju akan menerima notifikasi beserta alasan ini.
                                </span>
                            </label>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReject}
                                    className={`btn flex-1 py-3 ${confirmChecked && rejectionNote.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'} text-white`}
                                    disabled={!confirmChecked || !rejectionNote.trim()}
                                >
                                    <span>✕</span>
                                    <span>Tolak Pengajuan</span>
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="btn btn-secondary flex-1 py-3"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
