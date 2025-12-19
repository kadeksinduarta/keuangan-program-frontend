"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { expenseAPI, programAPI } from "@/lib/api";
import {
  FaPlus,
  FaTimes,
  FaFileInvoiceDollar,
  FaCheck,
  FaBan,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaReceipt,
  FaSearch,
  FaExclamationCircle,
  FaEllipsisV,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
} from "react-icons/fa";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
    receipt: null,
  });

  const [validationMessages, setValidationMessages] = useState({
    category: "",
    amount: "",
    receipt: "",
  });

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      loadData();
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (formData.category_id && formData.amount) {
      validateAmount();
    }
  }, [formData.amount, formData.category_id]);

  const loadPrograms = async () => {
    try {
      const response = await programAPI.getAll();
      const programList =
        response.data?.data?.programs || response.data?.programs || [];
      setPrograms(programList);
      if (programList.length > 0) {
        setSelectedProgram(programList[0]);
      }
    } catch (error) {
      console.error("Error loading programs:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getByProgram(selectedProgram?.id);
      const expensesData = response.data.expenses;

      if (expensesData && expensesData.data) {
        setExpenses(expensesData.data);
      } else {
        setExpenses(expensesData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const validateAmount = () => {
    const selectedCategory = categories.find(
      (c) => c.id == formData.category_id
    );
    if (selectedCategory && formData.amount) {
      const amount = parseFloat(formData.amount);
      const remaining = parseFloat(
        selectedCategory.remaining_budget || selectedCategory.total_budget || 0
      );

      if (amount > remaining) {
        setValidationMessages((prev) => ({
          ...prev,
          amount: `⚠️ Jumlah melebihi sisa anggaran (${formatCurrency(
            remaining
          )})`,
        }));
        return false;
      } else {
        setValidationMessages((prev) => ({
          ...prev,
          amount: `✓ Aman`,
        }));
        return true;
      }
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        setValidationMessages((prev) => ({
          ...prev,
          receipt: "❌ File harus berupa JPG/PNG atau PDF",
        }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setValidationMessages((prev) => ({
          ...prev,
          receipt: "❌ Ukuran maksimal 2MB",
        }));
        return;
      }
      setValidationMessages((prev) => ({
        ...prev,
        receipt: `✓ ${file.name}`,
      }));
      setFormData({ ...formData, receipt: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAmount()) {
      alert("Jumlah melebihi anggaran!");
      return;
    }
    if (!formData.receipt) {
      alert("Harap upload bukti transaksi");
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("category_id", formData.category_id);
      submitData.append("amount", formData.amount);
      submitData.append("description", formData.description);
      submitData.append("transaction_date", formData.transaction_date);
      submitData.append("receipt", formData.receipt);

      await expenseAPI.create(selectedProgram.id, submitData);
      alert("Pengeluaran berhasil diajukan!");

      setFormData({
        category_id: "",
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split("T")[0],
        receipt: null,
      });
      setValidationMessages({ category: "", amount: "", receipt: "" });
      setShowForm(false);
      loadData();
    } catch (error) {
      alert(
        "Gagal: " +
          (error.response?.data?.message || "Terjadi kesalahan sistem")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    if (confirm("Setujui pengeluaran ini?")) {
      try {
        await expenseAPI.approve(id);
        loadData();
        setDropdownOpen(null);
      } catch (error) {
        alert("Gagal: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Alasan penolakan:");
    if (reason) {
      try {
        await expenseAPI.reject(id, { rejection_note: reason });
        loadData();
        setDropdownOpen(null);
      } catch (error) {
        alert("Gagal: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: FaClock,
        label: "Menunggu",
        color: "amber",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      },
      approved: {
        icon: FaCheckCircle,
        label: "Disetujui",
        color: "emerald",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
      },
      rejected: {
        icon: FaTimesCircle,
        label: "Ditolak",
        color: "red",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      },
    };
    return configs[status] || configs.pending;
  };

  const filteredExpenses = expenses
    .filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (
        searchTerm &&
        !e.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const stats = {
    total: expenses.length,
    pending: expenses.filter((e) => e.status === "pending").length,
    approved: expenses.filter((e) => e.status === "approved").length,
    rejected: expenses.filter((e) => e.status === "rejected").length,
    totalAmount: expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount || 0),
      0
    ),
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Pengeluaran
              </h1>
              <p className="text-slate-600 text-base">
                Kelola dan pantau pengeluaran program dengan bukti transaksi
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {programs.length > 0 && (
                <select
                  value={selectedProgram?.id || ""}
                  onChange={(e) => {
                    const p = programs.find(
                      (prog) => prog.id === parseInt(e.target.value)
                    );
                    setSelectedProgram(p);
                  }}
                  className="px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white font-semibold shadow-sm hover:border-indigo-300 transition-all"
                >
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-xl transition-all font-semibold shadow-lg hover:scale-105 transform"
              >
                <FaPlus className="text-base" /> Ajukan Pengeluaran
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-7 mb-12">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Total Pengajuan
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-4 bg-indigo-100 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                <FaFileInvoiceDollar className="text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Menunggu Persetujuan
                </p>
                <p className="text-3xl font-bold text-amber-600">
                  {stats.pending}
                </p>
              </div>
              <div className="p-4 bg-amber-100 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                <FaClock className="text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Disetujui
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats.approved}
                </p>
              </div>
              <div className="p-4 bg-emerald-100 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                <FaCheckCircle className="text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Total Jumlah
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="p-4 bg-slate-100 rounded-xl text-slate-600 group-hover:scale-110 transition-transform">
                <FaReceipt className="text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-col sm:flex-row gap-5">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Cari pengeluaran..."
              className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm hover:border-indigo-300 transition-all font-medium placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white font-semibold shadow-sm hover:border-indigo-300 transition-all"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {/* Expenses List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-500 animate-pulse">
              Memuat pengeluaran...
            </p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFileInvoiceDollar className="text-2xl text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Belum ada pengeluaran
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
              Mulai dengan mengajukan pengeluaran baru beserta bukti transaksi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => {
              const statusConfig = getStatusConfig(expense.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={expense.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${statusConfig.bgColor}`}>
                        <FaFileInvoiceDollar
                          className={`text-${statusConfig.color}-600`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <p className="font-bold text-slate-900">
                            {expense.description}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-600 ${statusConfig.bgColor} border ${statusConfig.borderColor}`}
                          >
                            <StatusIcon className="text-xs" />
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-slate-400" />
                            {new Date(
                              expense.transaction_date
                            ).toLocaleDateString("id-ID")}
                          </span>
                          {expense.category && (
                            <span className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">
                              {expense.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(expense.amount)}
                      </p>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {expense.receipt && (
                          <a
                            href={expense.receipt}
                            download
                            className="p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                            title="Download bukti"
                          >
                            <FaDownload className="text-sm" />
                          </a>
                        )}

                        {user?.role === "admin" &&
                          expense.status === "pending" && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setDropdownOpen(
                                    dropdownOpen === expense.id
                                      ? null
                                      : expense.id
                                  )
                                }
                                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                              >
                                <FaEllipsisV className="text-sm" />
                              </button>
                              {dropdownOpen === expense.id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg border border-slate-200 shadow-lg z-10">
                                  <button
                                    onClick={() => handleApprove(expense.id)}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 flex items-center gap-2 border-b border-slate-100 text-emerald-700 font-medium"
                                  >
                                    <FaCheck /> Setujui
                                  </button>
                                  <button
                                    onClick={() => handleReject(expense.id)}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700 font-medium"
                                  >
                                    <FaBan /> Tolak
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {expense.rejection_note && (
                    <div className="mt-4 pt-4 border-t border-slate-100 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1.5">
                        <FaExclamationCircle /> Alasan Penolakan
                      </p>
                      <p className="text-sm text-red-600">
                        {expense.rejection_note}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0">
                <h3 className="text-2xl font-bold text-slate-900">
                  ➕ Ajukan Pengeluaran Baru
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Kategori RAB *
                    </label>
                    <select
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name || cat.category} - Sisa:{" "}
                          {formatCurrency(cat.remaining_budget || 0)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Tanggal Transaksi *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                      value={formData.transaction_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transaction_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Jumlah (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                    {validationMessages.amount && (
                      <p className="text-xs mt-1.5 font-medium">
                        {validationMessages.amount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      File Bukti *
                    </label>
                    <label className="cursor-pointer">
                      <div className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-all text-center font-medium text-slate-600">
                        {formData.receipt ? "✓ File dipilih" : "Pilih file..."}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    {validationMessages.receipt && (
                      <p className="text-xs mt-1.5 font-medium">
                        {validationMessages.receipt}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Deskripsi/Keterangan *
                  </label>
                  <textarea
                    required
                    rows="4"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium resize-none"
                    placeholder="Jelaskan detail pengeluaran ini..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {submitting ? "Mengirim..." : "Ajukan Pengeluaran"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
