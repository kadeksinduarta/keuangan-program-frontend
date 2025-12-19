import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { programAPI, transactionAPI, rabItemAPI } from "@/lib/api";
import {
  FaPlus,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaReceipt,
  FaTrash,
  FaCalendarAlt,
  FaSearch,
  FaChartLine,
  FaCoins,
  FaWallet,
  FaEllipsisV,
} from "react-icons/fa";

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [rabItems, setRabItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    type: "income",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    rab_allocations: [{ rab_item_id: "", amount: "" }],
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
      const programList =
        response.data.data?.programs || response.data.programs || [];
      setPrograms(programList);
      if (programList.length > 0 && !selectedProgramId) {
        setSelectedProgramId(programList[0].id);
      }
    } catch (error) {
      console.error("Error loading programs:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getByProgram(selectedProgramId);
      setTransactions(response.data.data?.data || response.data.data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRABItems = async () => {
    try {
      const response = await rabItemAPI.getByProgram(selectedProgramId);
      setRabItems(response.data.data?.rab_items || []);
    } catch (error) {
      console.error("Error loading RAB items:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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

      if (formData.type === "expense") {
        submitData.rab_allocations = formData.rab_allocations
          .filter((alloc) => alloc.rab_item_id && alloc.amount)
          .map((alloc) => ({
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
      alert(
        "Gagal menyimpan transaksi: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    try {
      await transactionAPI.delete(id);
      loadTransactions();
      loadRABItems();
      setDropdownOpen(null);
    } catch (error) {
      alert(
        "Gagal menghapus transaksi: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      id: transaction.id,
      type: transaction.type,
      date: transaction.date,
      amount: transaction.amount.toString(),
      description: transaction.description,
      rab_allocations: transaction.rab_allocations || [
        { rab_item_id: "", amount: "" },
      ],
    });
    setShowForm(true);
    setDropdownOpen(null);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      type: "income",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      description: "",
      rab_allocations: [{ rab_item_id: "", amount: "" }],
    });
  };

  const addRabAllocation = () => {
    setFormData({
      ...formData,
      rab_allocations: [
        ...formData.rab_allocations,
        { rab_item_id: "", amount: "" },
      ],
    });
  };

  const removeRabAllocation = (index) => {
    const newAllocations = formData.rab_allocations.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, rab_allocations: newAllocations });
  };

  const updateRabAllocation = (index, field, value) => {
    const newAllocations = [...formData.rab_allocations];
    newAllocations[index][field] = value;
    setFormData({ ...formData, rab_allocations: newAllocations });
  };

  const calculateTotalAllocations = () => {
    return formData.rab_allocations.reduce(
      (sum, alloc) => sum + (parseFloat(alloc.amount) || 0),
      0
    );
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (
      searchTerm &&
      !t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Transaksi Keuangan
              </h1>
              <p className="text-slate-600 text-base">
                Catat dan pantau arus kas program Anda dengan mudah
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {programs.length > 0 && (
                <select
                  value={selectedProgramId || ""}
                  onChange={(e) =>
                    setSelectedProgramId(parseInt(e.target.value))
                  }
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
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-xl transition-all font-semibold shadow-lg hover:scale-105 transform"
              >
                <FaPlus className="text-base" /> Tambah Transaksi
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-12">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Total Pemasukan
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(incomeTotal)}
                </p>
              </div>
              <div className="p-4 bg-emerald-100 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                <FaArrowUp className="text-2xl" />
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {transactions.filter((t) => t.type === "income").length} transaksi
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Total Pengeluaran
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(expenseTotal)}
                </p>
              </div>
              <div className="p-4 bg-red-100 rounded-xl text-red-600 group-hover:scale-110 transition-transform">
                <FaArrowDown className="text-2xl" />
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {transactions.filter((t) => t.type === "expense").length}{" "}
              transaksi
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Saldo Bersih
                </p>
                <p
                  className={`text-3xl font-bold ${
                    incomeTotal - expenseTotal >= 0
                      ? "text-indigo-600"
                      : "text-orange-600"
                  }`}
                >
                  {formatCurrency(incomeTotal - expenseTotal)}
                </p>
              </div>
              <div className="p-4 bg-indigo-100 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                <FaWallet className="text-2xl" />
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {transactions.length} total transaksi
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-col sm:flex-row gap-5">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm hover:border-indigo-300 transition-all font-medium placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white font-semibold shadow-sm hover:border-indigo-300 transition-all"
          >
            <option value="all">Semua Transaksi</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-500 animate-pulse">Memuat transaksi...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaChartLine className="text-2xl text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Belum ada transaksi
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
              Mulai dengan menambahkan transaksi pemasukan atau pengeluaran.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl ${
                        transaction.type === "income"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <FaArrowUp className="text-xl" />
                      ) : (
                        <FaArrowDown className="text-xl" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 mb-1">
                        {transaction.description}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <FaCalendarAlt className="text-slate-400" />
                          {new Date(transaction.date).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                        <span className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">
                          {transaction.type === "income"
                            ? "Pemasukan"
                            : "Pengeluaran"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <p
                      className={`text-xl font-bold ${
                        transaction.type === "income"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setDropdownOpen(
                              dropdownOpen === transaction.id
                                ? null
                                : transaction.id
                            )
                          }
                          className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <FaEllipsisV className="text-sm" />
                        </button>
                        {dropdownOpen === transaction.id && (
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="absolute right-0 mt-1 px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium text-sm whitespace-nowrap z-10"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {transaction.rab_allocations &&
                  transaction.rab_allocations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                        Alokasi RAB:
                      </p>
                      <div className="space-y-1">
                        {transaction.rab_allocations.map((alloc, idx) => (
                          <p key={idx} className="text-sm text-slate-600">
                            {alloc.rab_item?.name}:{" "}
                            <span className="font-medium">
                              {formatCurrency(alloc.amount)}
                            </span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0">
                <h3 className="text-2xl font-bold text-slate-900">
                  {formData.id ? "✏️ Edit Transaksi" : "➕ Transaksi Baru"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-7 space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-3">
                    Jenis Transaksi *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: "income",
                          rab_allocations: [{ rab_item_id: "", amount: "" }],
                        })
                      }
                      className={`p-4 rounded-xl border-2 font-bold transition-all ${
                        formData.type === "income"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                      }`}
                    >
                      <FaArrowUp className="mr-2 inline" /> Pemasukan
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: "expense",
                          rab_allocations: [{ rab_item_id: "", amount: "" }],
                        })
                      }
                      className={`p-4 rounded-xl border-2 font-bold transition-all ${
                        formData.type === "expense"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-red-200"
                      }`}
                    >
                      <FaArrowDown className="mr-2 inline" /> Pengeluaran
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Tanggal *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
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
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Deskripsi *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                    placeholder="Contoh: Pembelian Konsumsi"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* Allocation for Expenses */}
                {formData.type === "expense" && rabItems.length > 0 && (
                  <div className="border-t-2 border-slate-200 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-bold text-slate-900">
                        Alokasi RAB
                      </label>
                      <button
                        type="button"
                        onClick={addRabAllocation}
                        className="text-xs font-bold px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
                      >
                        + Tambah
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.rab_allocations.map((alloc, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <select
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                            value={alloc.rab_item_id}
                            onChange={(e) =>
                              updateRabAllocation(
                                idx,
                                "rab_item_id",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Pilih Item RAB</option>
                            {rabItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-32 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                            placeholder="Jumlah"
                            value={alloc.amount}
                            onChange={(e) =>
                              updateRabAllocation(idx, "amount", e.target.value)
                            }
                          />
                          {formData.rab_allocations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRabAllocation(idx)}
                              className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {formData.rab_allocations.some(
                      (a) => a.rab_item_id && a.amount
                    ) && (
                      <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <p className="text-xs font-bold text-indigo-900 mb-1">
                          Total Alokasi
                        </p>
                        <p className="text-lg font-bold text-indigo-700">
                          {formatCurrency(calculateTotalAllocations())}
                        </p>
                        {Math.abs(
                          parseFloat(formData.amount || 0) -
                            calculateTotalAllocations()
                        ) > 0.01 && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            ⚠️ Alokasi tidak sesuai dengan jumlah transaksi
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    Simpan Transaksi
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
