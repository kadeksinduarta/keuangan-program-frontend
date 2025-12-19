'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { expenseAPI, rabAPI, programAPI } from '@/lib/api';
import {
    FaPlus,
    FaTimes,
    FaFileInvoiceDollar,
    FaCheck,
    FaBan,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaReceipt,
    FaSearch
} from 'react-icons/fa';

export default function Expenses() {
    const router = useRouter();
    const { user } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        category_id: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        receipt: null,
    });

    const [validationMessages, setValidationMessages] = useState({
        category: '',
        amount: '',
        receipt: '',
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0
    });

    useEffect(() => {
        loadPrograms();
    }, []);

    useEffect(() => {
        if (selectedProgram) {
            loadData();
        }
    }, [selectedProgram]);

    // Real-time validation
    useEffect(() => {
        if (formData.category_id && formData.amount) {
            validateAmount();
        }
    }, [formData.amount, formData.category_id]);

    const loadPrograms = async () => {
        try {
            const response = await programAPI.getAll();
            const programList = response.data?.data?.programs || response.data?.programs || [];
            setPrograms(programList);
            if (programList.length > 0) {
                setSelectedProgram(programList[0]);
            }
        } catch (error) {
            console.error('Error loading programs:', error);
        }
    };

    const loadData = async (page = 1) => {
        try {
            setLoading(true);
            const [expensesRes, rabRes] = await Promise.all([
                expenseAPI.getByProgram(selectedProgram.id, { page }),
                rabAPI.getByProgram(selectedProgram.id),
            ]);

            const expensesData = expensesRes.data.expenses;
            if (expensesData && expensesData.data) {
                setExpenses(expensesData.data);
                setPagination({
                    current_page: expensesData.current_page,
                    last_page: expensesData.last_page,
                    total: expensesData.total,
                    from: expensesData.from,
                    to: expensesData.to
                });
            } else {
                setExpenses(expensesData || []);
            }

            setCategories(rabRes.data.data?.rab_items || rabRes.data.rab_categories || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateAmount = () => {
        const selectedCategory = categories.find(c => c.id == formData.category_id);
        if (selectedCategory && formData.amount) {
            const amount = parseFloat(formData.amount);
            const remaining = parseFloat(selectedCategory.remaining_budget || selectedCategory.total_budget);

            if (amount > remaining) {
                setValidationMessages(prev => ({
                    ...prev,
                    amount: `⚠️ Jumlah melebihi sisa anggaran (${formatCurrency(remaining)})`
                }));
                return false;
            } else if (amount > remaining * 0.8) {
                setValidationMessages(prev => ({
                    ...prev,
                    amount: `⚠️ Perhatian: Menggunakan ${((amount / remaining) * 100).toFixed(0)}% dari sisa anggaran`
                }));
                return true;
            } else {
                setValidationMessages(prev => ({
                    ...prev,
                    amount: `✓ Aman (Sisa: ${formatCurrency(remaining - amount)})`
                }));
                return true;
            }
        }
        return true;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                setValidationMessages(prev => ({
                    ...prev,
                    receipt: '❌ File harus berupa JPG/PNG atau PDF'
                }));
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setValidationMessages(prev => ({
                    ...prev,
                    receipt: '❌ Ukuran maksimal 2MB'
                }));
                return;
            }
            setValidationMessages(prev => ({
                ...prev,
                receipt: `✓ ${file.name} (${(file.size / 1024).toFixed(0)} KB)`
            }));
            setFormData({ ...formData, receipt: file });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateAmount()) {
            alert('Jumlah melebihi anggaran!');
            return;
        }
        if (!formData.receipt) {
            alert('Harap upload bukti transaksi');
            return;
        }

        setSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('category_id', formData.category_id);
            submitData.append('amount', formData.amount);
            submitData.append('description', formData.description);
            submitData.append('transaction_date', formData.transaction_date);
            submitData.append('receipt', formData.receipt);

            await expenseAPI.create(selectedProgram.id, submitData);
            alert('Sukses! Pengeluaran berhasil diajukan.');

            // Reset
            setFormData({
                category_id: '',
                amount: '',
                description: '',
                transaction_date: new Date().toISOString().split('T')[0],
                receipt: null,
            });
            setValidationMessages({ category: '', amount: '', receipt: '' });
            setShowForm(false);
            loadData();
        } catch (error) {
            alert('Gagal: ' + (error.response?.data?.message || 'Terjadi kesalahan sistem'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id) => {
        if (confirm('Setujui pengeluaran ini? Dana akan ditarik dari anggaran.')) {
            try {
                await expenseAPI.approve(id);
                loadData();
            } catch (error) {
                alert('Gagal: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Alasan penolakan:');
        if (reason) {
            try {
                await expenseAPI.reject(id, { rejection_note: reason });
                loadData();
            } catch (error) {
                alert('Gagal: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    // Filter Logic
    const filteredExpenses = expenses
        .filter(e => {
            // Note: User filtering is now handled by backend
            if (searchTerm && !e.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-2">
                            Pengeluaran
                        </h1>
                        <p className="text-slate-500 text-lg">Kelola dan ajukan pengeluaran untuk program Anda</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        {programs.length > 1 && (
                            <select
                                className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm w-full md:w-64 cursor-pointer hover:border-teal-300 transition-colors"
                                value={selectedProgram?.id || ''}
                                onChange={(e) => setSelectedProgram(programs.find(p => p.id === parseInt(e.target.value)))}
                            >
                                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        )}
                        {!showForm && user?.role !== 'admin' && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="inline-flex justify-center items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transform hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg font-medium"
                            >
                                <FaPlus /> Buat Pengajuan
                            </button>
                        )}
                    </div>
                </div>

                {/* Form Logic */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-800">Formulir Pengajuan Dana</h3>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Kategori Anggaran</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id} disabled={parseFloat(c.remaining_budget || c.total_budget) <= 0}>
                                                    {c.name} (Sisa: {formatCurrency(c.remaining_budget || c.total_budget)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Pengajuan (Rp)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0"
                                            />
                                        </div>
                                        {validationMessages.amount && (
                                            <p className={`text-xs mt-2 font-medium ${validationMessages.amount.includes('✓') ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {validationMessages.amount}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Transaksi</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                            value={formData.transaction_date}
                                            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Bukti Transaksi (Struk/Nota)</label>
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-400 transition-colors bg-slate-50 group cursor-pointer transition-all hover:bg-teal-50">
                                            <input
                                                type="file"
                                                id="receipt-upload"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                            />
                                            <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                                                    <FaReceipt className="text-xl text-slate-500 group-hover:text-teal-700" />
                                                </div>
                                                <span className="text-sm text-teal-700 font-bold">Klik untuk upload file</span>
                                                <span className="text-xs text-slate-400">Max 2MB (JPG, PNG, PDF)</span>
                                            </label>
                                        </div>
                                        {validationMessages.receipt && (
                                            <p className={`text-xs mt-2 text-center font-medium ${validationMessages.receipt.includes('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {validationMessages.receipt}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan / Keperluan</label>
                                        <textarea
                                            required
                                            rows="4"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                            placeholder="Jelaskan detail pengeluaran..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-8 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {submitting ? 'Mengirim...' : <><FaCheck /> Ajukan Sekarang</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Search & Stats Bar */}
                <div className="flex flex-col sm:flex-row gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-4 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari pengeluaran berdasarkan deskripsi..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Simple Stats */}
                    <div className="bg-teal-50 px-6 py-2 rounded-xl border border-teal-100 flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-teal-600 font-bold uppercase tracking-wide">Total Pengeluaran</p>
                            <p className="text-lg font-extrabold text-teal-800">
                                {formatCurrency(filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                            <p className="text-slate-500 animate-pulse font-medium">Memuat data pengeluaran...</p>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="bg-slate-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                <FaFileInvoiceDollar className="text-4xl text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada pengeluaran</h3>
                            <p className="text-slate-500">Data pengajuan pengeluaran akan muncul di sini.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/80 border-b border-slate-200">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah</th>
                                        <th className="px-8 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-8 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Bukti</th>
                                        <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredExpenses.map((expense, idx) => (
                                        <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                                            <td className="px-8 py-6 text-sm text-slate-600 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                        <FaCalendarAlt />
                                                    </div>
                                                    <span className="font-medium">{new Date(expense.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-semibold text-slate-900 line-clamp-1 mb-1">{expense.description}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md font-medium border border-teal-100">
                                                            {expense.category?.name || 'Umum'}
                                                        </span>
                                                        <span className="text-xs text-slate-400">by {expense.submitted_by?.name || 'Unknown'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-base font-bold text-slate-800 tracking-tight">
                                                    {formatCurrency(expense.amount)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-center">
                                                {expense.status === 'approved' && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                        <FaCheck className="text-[10px]" /> Disetujui
                                                    </span>
                                                )}
                                                {expense.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Menunggu
                                                    </span>
                                                )}
                                                {expense.status === 'rejected' && (
                                                    <div className="group relative inline-flex">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 cursor-help">
                                                            <FaTimes className="text-[10px]" /> Ditolak
                                                        </span>
                                                        {expense.rejection_note && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 leading-relaxed">
                                                                <span className="font-bold block mb-1">Alasan Penolakan:</span>
                                                                {expense.rejection_note}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {expense.receipts?.[0] ? (
                                                    <a
                                                        href={`http://localhost:8000/storage/${expense.receipts[0].file_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-md"
                                                        title="Lihat Bukti"
                                                    >
                                                        <FaFileInvoiceDollar className="text-lg" />
                                                    </a>
                                                ) : <span className="text-slate-300 font-medium">-</span>}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {user?.role === 'admin' && expense.status === 'pending' && (
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => handleApprove(expense.id)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm hover:shadow"
                                                            title="Setujui"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(expense.id)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow"
                                                            title="Tolak"
                                                        >
                                                            <FaBan />
                                                        </button>
                                                    </div>
                                                )}
                                                {user?.role !== 'admin' && expense.status === 'pending' && (
                                                    <span className="text-xs text-slate-400 italic font-medium">Menunggu review</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {pagination.last_page > 1 && (
                    <div className="flex justify-between items-center mt-6">
                        <p className="text-sm text-slate-500">
                            Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} data
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadData(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => loadData(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
