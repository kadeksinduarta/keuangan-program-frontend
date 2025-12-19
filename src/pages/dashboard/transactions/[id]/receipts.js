'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { transactionAPI, receiptAPI } from '@/lib/api';
import { FaUpload, FaTrash, FaDownload, FaArrowLeft, FaFile } from 'react-icons/fa';

export default function ReceiptsPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth();
    const [transaction, setTransaction] = useState(null);
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [transactionResponse, receiptsResponse] = await Promise.all([
                transactionAPI.getById(id),
                receiptAPI.getByTransaction(id),
            ]);
            setTransaction(transactionResponse.data.data || transactionResponse.data);
            setReceipts(receiptsResponse.data.data || receiptsResponse.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            alert('Pilih file terlebih dahulu');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            await receiptAPI.upload(id, formData);
            setFile(null);
            loadData();
        } catch (error) {
            alert('Gagal upload nota: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (receiptId) => {
        if (!confirm('Yakin ingin menghapus nota ini?')) return;
        try {
            await receiptAPI.delete(receiptId);
            loadData();
        } catch (error) {
            alert('Gagal menghapus nota: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDownload = async (receiptId) => {
        try {
            const response = await receiptAPI.download(receiptId);
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = receipts.find(r => r.id === receiptId)?.original_filename || 'receipt.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Gagal download nota: ' + (error.response?.data?.message || error.message));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                        <p className="text-slate-600">Memuat data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!transaction) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-slate-600">Transaksi tidak ditemukan</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto bg-white">
                <button
                    onClick={() => router.back()}
                    className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
                >
                    <FaArrowLeft /> Kembali
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Nota</h1>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-sm text-slate-700">
                            <span className="font-semibold">Transaksi:</span> {transaction.description}
                        </p>
                        <p className="text-sm text-slate-700">
                            <span className="font-semibold">Jumlah:</span> {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-slate-700">
                            <span className="font-semibold">Tanggal:</span> {new Date(transaction.date).toLocaleDateString('id-ID')}
                        </p>
                    </div>
                </div>

                {/* Upload Form */}
                <div className="mb-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Upload Nota Baru</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700">File Nota *</label>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-1">Format: JPG, PNG, PDF (Max: 2MB)</p>
                        </div>
                        <button
                            type="submit"
                            disabled={uploading || !file}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Mengupload...</span>
                                </>
                            ) : (
                                <>
                                    <FaUpload /> Upload Nota
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Receipts List */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Nota Terupload ({receipts.length})</h3>
                    {receipts.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-slate-600">Belum ada nota. Upload nota untuk transaksi ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {receipts.map((receipt) => (
                                <div key={receipt.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <FaFile className="text-indigo-600 text-xl" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{receipt.original_filename}</p>
                                            <p className="text-sm text-slate-500">
                                                Uploaded: {new Date(receipt.created_at).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDownload(receipt.id)}
                                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors inline-flex items-center gap-2"
                                        >
                                            <FaDownload /> Download
                                        </button>
                                        <button
                                            onClick={() => handleDelete(receipt.id)}
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

