import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { programAPI, transactionAPI, rabItemAPI } from '@/lib/api';
import {
    FaPlus,
    FaTimes,
    FaArrowUp,
    FaArrowDown,
    FaReceipt,
    FaTrash,
    FaCalendarAlt,
    FaSearch,
    FaBox
} from 'react-icons/fa';

export default function TransactionsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [rabItems, setRabItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, income, expense

    // Form State
    const [transactionType, setTransactionType] = useState('income');
    const [formData, setFormData] = useState({
        id: null,
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        rab_allocations: [{ rab_item_id: '', amount: '' }],
    });

    useEffect(() => {
        loadPrograms();
    }, []);

    useEffect(() => {
        if (selectedProgramId) {
            loadTransactions();
            loadRABItems();
        }
    }, [selectedProgramId]);

    const loadPrograms = async () => {
        try {
            const response = await programAPI.getAll();
            const programList = response.data.data?.programs || response.data.programs || [];
            setPrograms(programList);
            if (programList.length > 0 && !selectedProgramId) {
                setSelectedProgramId(programList[0].id);
            }
        } catch (error) {
            console.error('Error loading programs:', error);
        }
    };

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const response = await transactionAPI.getByProgram(selectedProgramId);
            setTransactions(response.data.data?.data || response.data.data || []);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRABItems = async () => {
        try {
            const response = await rabItemAPI.getByProgram(selectedProgramId);
            setRabItems(response.data.data?.rab_items || []);
        } catch (error) {
            console.error('Error loading RAB items:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                type: formData.type,
                date: formData.date,
                amount: parseFloat(formData.amount),
                description: formData.description,
            };

            if (formData.type === 'expense') {
                submitData.rab_allocations = formData.rab_allocations
                    .filter(alloc => alloc.rab_item_id && alloc.amount)
                    .map(alloc => ({
                        rab_item_id: parseInt(alloc.rab_item_id),
                        amount: parseFloat(alloc.amount),
                    }));
            }

            if (formData.id) {
                await transactionAPI.update(formData.id, submitData);
            } else {
                await transactionAPI.create(selectedProgramId, submitData);
            }

            setShowForm(false);
            resetForm();
            loadTransactions();
            loadRABItems();
        } catch (error) {
            alert('Gagal menyimpan transaksi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
        try {
            await transactionAPI.delete(id);
            loadTransactions();
            loadRABItems();
        } catch (error) {
            alert('Gagal menghapus transaksi: ' + (error.response?.data?.message || error.message));
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            type: 'income',
            date: new Date().toISOString().split('T')[0],
            amount: '',
            description: '',
            rab_allocations: [{ rab_item_id: '', amount: '' }],
        });
        setTransactionType('income');
    };

    // Helper functions for form
    const addRabAllocation = () => {
        setFormData({
            ...formData,
            rab_allocations: [...formData.rab_allocations, { rab_item_id: '', amount: '' }],
        });
    };

    const removeRabAllocation = (index) => {
        const newAllocations = formData.rab_allocations.filter((_, i) => i !== index);
        setFormData({ ...formData, rab_allocations: newAllocations });
    };

    const updateRabAllocation = (index, field, value) => {
        const newAllocations = [...formData.rab_allocations];
        newAllocations[index][field] = value;
        setFormData({ ...formData, rab_allocations: newAllocations });
    };

    const calculateTotalAllocations = () => {
        return formData.rab_allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.amount) || 0), 0);
    };

    const selectedProgram = programs.find(p => p.id === selectedProgramId);

    // Filtered Transactions
    const filteredTransactions = transactions.filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const incomeTotal = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenseTotal = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                            Transaksi Keuangan
                        </h1>
                        <p className="text-slate-500 text-lg">Catat dan pantau arus kas program Anda dengan mudah</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        {programs.length > 0 && (
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaBox className="text-indigo-500" />
                                </div>
                                <select
                                    value={selectedProgramId || ''}
                                    onChange={(e) => setSelectedProgramId(parseInt(e.target.value))}
                                    className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full md:w-64 cursor-pointer hover:border-indigo-300 transition-all font-medium"
                                >
                                    {programs.map(program => (
                                        <option key={program.id} value={program.id}>{program.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        )}

                        {user && (
                            <button
                                onClick={() => { setShowForm(true); resetForm(); }}
                                className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transform hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-indigo-500/30 font-bold"
                            >
                                <FaPlus /> Transaksi Baru
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                <FaArrowDown />
                            </div>
                            <p className="text-sm font-medium text-emerald-800">Total Pemasukan</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">{formatCurrency(incomeTotal)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm bg-gradient-to-br from-white to-red-50/50">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                <FaArrowUp />
                            </div>
                            <p className="text-sm font-medium text-red-800">Total Pengeluaran</p>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{formatCurrency(expenseTotal)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm bg-gradient-to-br from-white to-indigo-50/50">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                <FaPlus />
                            </div>
                            <p className="text-sm font-medium text-indigo-800">Saldo Bersih</p>
                        </div>
                        <p className="text-2xl font-bold text-indigo-700">{formatCurrency(incomeTotal - expenseTotal)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'income', 'expense'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === type
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {type === 'all' ? 'Semua' : type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Logic */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                                <h3 className="text-xl font-bold text-slate-800">
                                    {formData.id ? 'Edit Transaksi' : 'Transaksi Baru'}
                                </h3>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Type Selector */}
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${formData.type === 'income'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 hover:border-emerald-200 text-slate-500'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value="income"
                                            checked={formData.type === 'income'}
                                            onChange={(e) => {
                                                setFormData({ ...formData, type: 'income' });
                                                setTransactionType('income');
                                            }}
                                            className="hidden"
                                        />
                                        <div className="p-2 bg-white rounded-full shadow-sm"><FaArrowDown className={formData.type === 'income' ? 'text-emerald-500' : 'text-slate-400'} /></div>
                                        <span className="font-medium">Pemasukan</span>
                                    </label>

                                    <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${formData.type === 'expense'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-slate-200 hover:border-red-200 text-slate-500'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value="expense"
                                            checked={formData.type === 'expense'}
                                            onChange={(e) => {
                                                setFormData({ ...formData, type: 'expense' });
                                                setTransactionType('expense');
                                            }}
                                            className="hidden"
                                        />
                                        <div className="p-2 bg-white rounded-full shadow-sm"><FaArrowUp className={formData.type === 'expense' ? 'text-red-500' : 'text-slate-400'} /></div>
                                        <span className="font-medium">Pengeluaran</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Transaksi</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Total Nominal (Rp)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan</label>
                                    <textarea
                                        required
                                        rows="3"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Contoh: Dana dari sponsor A..."
                                    ></textarea>
                                </div>

                                {/* RAB Allocation Section */}
                                {formData.type === 'expense' && (
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium text-slate-700 flex items-center gap-2">
                                                <FaReceipt className="text-slate-400" />
                                                Alokasi Anggaran (RAB)
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={addRabAllocation}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                                            >
                                                + Tambah Item
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.rab_allocations.map((alloc, idx) => (
                                                <div key={idx} className="flex gap-3 items-start animate-fade-in">
                                                    <div className="flex-1">
                                                        <select
                                                            required
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            value={alloc.rab_item_id}
                                                            onChange={(e) => updateRabAllocation(idx, 'rab_item_id', e.target.value)}
                                                        >
                                                            <option value="">Pilih Item RAB...</option>
                                                            {rabItems.filter(r => r.remaining_budget > 0).map(item => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name} (Sisa: {formatCurrency(item.remaining_budget)})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="w-32">
                                                        <input
                                                            type="number"
                                                            required
                                                            placeholder="Rp 0"
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            value={alloc.amount}
                                                            onChange={(e) => updateRabAllocation(idx, 'amount', e.target.value)}
                                                        />
                                                    </div>
                                                    {formData.rab_allocations.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRabAllocation(idx)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Total Alokasi:</span>
                                            <span className={`font-bold ${Math.abs(calculateTotalAllocations() - parseFloat(formData.amount || 0)) < 1
                                                ? 'text-emerald-600'
                                                : 'text-red-600'
                                                }`}>
                                                {formatCurrency(calculateTotalAllocations())}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-md hover:shadow-lg transition-all"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Transactions List */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-slate-500 animate-pulse">Memuat data transaksi...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="bg-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <FaSearch className="text-3xl text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">Tidak ada transaksi</h3>
                            <p className="text-slate-500">Belum ada data transaksi yang sesuai dengan filter.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/80 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Keterangan</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Jenis</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Nominal</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTransactions.map((transaction, idx) => (
                                        <tr key={transaction.id}
                                            className="hover:bg-slate-50/50 transition-colors group animate-fade-in"
                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <FaCalendarAlt className="text-slate-400" />
                                                    {new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                {transaction.description}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${transaction.type === 'income'
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                    {transaction.type === 'income' ? <FaArrowDown /> : <FaArrowUp />}
                                                    {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleDelete(transaction.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Hapus Transaksi"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
