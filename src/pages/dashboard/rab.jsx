import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { programAPI, rabItemAPI } from "@/lib/api";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaBox,
  FaChartBar,
  FaWarning,
  FaCheckCircle,
  FaClock,
  FaPercent,
  FaDollarSign,
} from "react-icons/fa";

export default function RAB() {
  const router = useRouter();
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [rabItems, setRabItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);

  // Form State
  const [itemForm, setItemForm] = useState({
    id: null,
    name: "",
    category: "",
    volume: "",
    unit: "",
    unit_price: "",
    notes: "",
  });

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      loadRAB();
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

  const loadRAB = async () => {
    try {
      setLoading(true);
      const [itemsResponse, summaryResponse] = await Promise.all([
        rabItemAPI.getByProgram(selectedProgramId),
        rabItemAPI.getSummary(selectedProgramId),
      ]);
      setRabItems(itemsResponse.data.data?.rab_items || []);
      setSummary(summaryResponse.data.data);
    } catch (error) {
      console.error("Error loading RAB:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalBudget = () => {
    if (itemForm.volume && itemForm.unit_price) {
      return parseFloat(itemForm.volume) * parseFloat(itemForm.unit_price);
    }
    return 0;
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        name: itemForm.name,
        category: itemForm.category,
        volume: parseFloat(itemForm.volume),
        unit: itemForm.unit,
        unit_price: parseFloat(itemForm.unit_price),
        notes: itemForm.notes,
      };

      if (itemForm.id) {
        await rabItemAPI.update(itemForm.id, itemData);
      } else {
        await rabItemAPI.create(selectedProgramId, itemData);
      }

      setShowItemForm(false);
      setItemForm({
        id: null,
        name: "",
        category: "",
        volume: "",
        unit: "",
        unit_price: "",
        notes: "",
      });
      loadRAB();
    } catch (error) {
      alert(
        "Gagal menyimpan item RAB: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm("Yakin ingin menghapus item RAB ini?")) {
      try {
        await rabItemAPI.delete(id);
        loadRAB();
      } catch (error) {
        alert(
          "Gagal menghapus item: " +
            (error.response?.data?.message || error.message)
        );
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
      belum_terpenuhi: {
        icon: FaClock,
        label: "Belum Terpenuhi",
        color: "slate",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
      },
      sebagian_terpenuhi: {
        icon: FaPercent,
        label: "Sebagian",
        color: "amber",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      },
      terpenuhi: {
        icon: FaCheckCircle,
        label: "Lengkap",
        color: "emerald",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
      },
    };
    return configs[status] || configs.belum_terpenuhi;
  };

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const utilizationPercentage =
    summary?.total_budget > 0
      ? Math.round((summary?.total_realized / summary?.total_budget) * 100)
      : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                RAB & Anggaran
              </h1>
              <p className="text-slate-600 text-base">
                Rencana Anggaran Biaya dan realisasi penggunaan dana
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

              {selectedProgram?.status === "draft" && user && (
                <button
                  onClick={() => {
                    setShowItemForm(true);
                    setItemForm({
                      id: null,
                      name: "",
                      category: "",
                      volume: "",
                      unit: "",
                      unit_price: "",
                      notes: "",
                    });
                  }}
                  className="inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-xl transition-all font-semibold shadow-lg hover:scale-105 transform"
                >
                  <FaPlus className="text-base" /> Tambah Item
                </button>
              )}
            </div>
          </div>

          {selectedProgram?.status !== "draft" && selectedProgram?.status && (
            <div className="mt-7 bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl flex items-center gap-3 font-semibold">
              <FaClock className="text-blue-500 flex-shrink-0 text-lg" />
              Program sudah aktif. RAB tidak dapat diubah (mode Read-only).
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-12">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-5">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Total Anggaran
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(summary.total_budget || 0)}
                  </p>
                </div>
                <div className="p-4 bg-indigo-100 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                  <FaDollarSign className="text-2xl" />
                </div>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                {rabItems.length} item dalam anggaran
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-5">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Terpakai / Realisasi
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(summary.total_realized || 0)}
                  </p>
                </div>
                <div className="p-4 bg-orange-100 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                  <FaChartBar className="text-2xl" />
                </div>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                {utilizationPercentage}% dari total anggaran
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-5">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Sisa Anggaran
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(summary.total_remaining || 0)}
                  </p>
                </div>
                <div className="p-4 bg-emerald-100 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                  <FaCheckCircle className="text-2xl" />
                </div>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                {100 - utilizationPercentage}% tersisa
              </div>
            </div>
          </div>
        )}

        {/* Overall Progress Bar */}
        {summary && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-12 hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-4">
              <p className="text-base font-bold text-slate-900">
                Penggunaan Total Anggaran
              </p>
              <p className="text-3xl font-bold text-indigo-600">
                {utilizationPercentage}%
              </p>
            </div>
            <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  utilizationPercentage > 90
                    ? "bg-red-500"
                    : utilizationPercentage > 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* RAB Items List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-500 animate-pulse">Memuat data RAB...</p>
          </div>
        ) : rabItems.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-2xl border border-slate-200 border-dashed hover:border-slate-300 transition-all">
            <div className="bg-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBox className="text-3xl text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Belum ada item RAB
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mt-3">
              Tambahkan item untuk mulai menyusun anggaran.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {rabItems.map((item, idx) => {
              const statusConfig = getStatusConfig(item.status);
              const StatusIcon = statusConfig.icon;
              const progressPercent =
                item.total_budget > 0
                  ? Math.min(
                      100,
                      (item.realized_amount / item.total_budget) * 100
                    )
                  : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-8 mb-7">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-5 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900">
                          {item.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-600 ${statusConfig.bgColor} border ${statusConfig.borderColor}`}
                        >
                          <StatusIcon className="text-sm" />
                          {statusConfig.label}
                        </span>
                        {item.category && (
                          <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                            Volume
                          </p>
                          <p className="font-bold text-slate-900 text-lg">
                            {item.volume}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {item.unit}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                            Harga Satuan
                          </p>
                          <p className="font-bold text-slate-900">
                            {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                            Total Budget
                          </p>
                          <p className="font-bold text-indigo-600 text-lg">
                            {formatCurrency(item.total_budget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                            Terpakai
                          </p>
                          <p className="font-bold text-orange-600 text-lg">
                            {formatCurrency(item.realized_amount || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedProgram &&
                      selectedProgram.status === "draft" &&
                      user && (
                        <div className="flex gap-3 self-start lg:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setShowItemForm(true);
                              setItemForm({
                                id: item.id,
                                name: item.name,
                                category: item.category || "",
                                volume: item.volume.toString(),
                                unit: item.unit,
                                unit_price: item.unit_price.toString(),
                                notes: item.notes || "",
                              });
                            }}
                            className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all font-semibold"
                            title="Edit item"
                          >
                            <FaEdit className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all font-semibold"
                            title="Hapus item"
                          >
                            <FaTrash className="text-base" />
                          </button>
                        </div>
                      )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Progress Penggunaan
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {progressPercent.toFixed(1)}% dari{" "}
                        {formatCurrency(item.total_budget)}
                      </p>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPercent > 90
                            ? "bg-red-500"
                            : progressPercent > 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-right font-medium">
                      Sisa:{" "}
                      <span className="font-bold text-slate-700">
                        {formatCurrency(
                          item.total_budget - item.realized_amount ||
                            item.total_budget
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Item Form Modal */}
        {showItemForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100">
                <h3 className="text-2xl font-bold text-slate-900">
                  {itemForm.id ? "✏️ Edit Item RAB" : "➕ Tambah Item RAB"}
                </h3>
                <button
                  onClick={() => setShowItemForm(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors text-2xl"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Nama Barang/Kegiatan *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                      placeholder="Contoh: Konsumsi Peserta"
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Kategori
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      placeholder="Contoh: Konsumsi"
                      value={itemForm.category}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, category: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Satuan *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      placeholder="Paket/Orang/Unit"
                      value={itemForm.unit}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, unit: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Volume *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      placeholder="0"
                      value={itemForm.volume}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, volume: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Harga Satuan (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      placeholder="0"
                      value={itemForm.unit_price}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, unit_price: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-indigo-900">
                    Total Budget Estimasi
                  </span>
                  <span className="text-2xl font-bold text-indigo-700">
                    {formatCurrency(calculateTotalBudget())}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                    placeholder="Keterangan atau catatan tambahan untuk item ini..."
                    value={itemForm.notes}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, notes: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowItemForm(false)}
                    className="px-6 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    Simpan Item RAB
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
