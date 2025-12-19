import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { programAPI } from "@/lib/api";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUsers,
  FaCalendarAlt,
  FaEllipsisV,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaExclamationCircle,
  FaChevronRight,
} from "react-icons/fa";

export default function ProgramsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    period_start: "",
    period_end: "",
  });

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const response = await programAPI.getAll();
      setPrograms(response.data.data?.programs || response.data.programs || []);
    } catch (error) {
      console.error("Error loading programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.period_end && formData.period_start > formData.period_end) {
      alert("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }

    try {
      if (editingProgram) {
        await programAPI.update(editingProgram.id, formData);
      } else {
        await programAPI.create(formData);
      }
      setShowForm(false);
      setEditingProgram(null);
      setFormData({
        name: "",
        description: "",
        period_start: "",
        period_end: "",
      });
      loadPrograms();
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      alert("Gagal menyimpan program: " + message);
    }
  };

  const handleEdit = (program, e) => {
    e.stopPropagation();
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description || "",
      period_start: program.period_start,
      period_end: program.period_end || "",
    });
    setShowForm(true);
    setDropdownOpen(null);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Yakin ingin menghapus program ini?")) return;
    try {
      await programAPI.delete(id);
      loadPrograms();
      setDropdownOpen(null);
    } catch (error) {
      alert(
        "Gagal menghapus program: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleStatusChange = async (program, newStatus, e) => {
    e.stopPropagation();
    try {
      await programAPI.updateStatus(program.id, newStatus);
      loadPrograms();
      setDropdownOpen(null);
    } catch (error) {
      alert(
        "Gagal mengubah status: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        icon: FaClock,
        label: "Draft",
        color: "amber",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
      },
      active: {
        icon: FaCheckCircle,
        label: "Aktif",
        color: "emerald",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
      },
      closed: {
        icon: FaTimes,
        label: "Selesai",
        color: "slate",
        bgColor: "bg-slate-50",
        textColor: "text-slate-700",
        borderColor: "border-slate-200",
      },
      cancelled: {
        icon: FaExclamationCircle,
        label: "Dibatalkan",
        color: "red",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
      },
    };
    return configs[status] || configs.draft;
  };

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: programs.length,
    active: programs.filter((p) => p.status === "active").length,
    draft: programs.filter((p) => p.status === "draft").length,
    closed: programs.filter((p) => p.status === "closed").length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Program Kerja
              </h1>
              <p className="text-slate-600 text-base">
                Kelola program dan anggaran untuk semua divisi Anda
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingProgram(null);
                  setFormData({
                    name: "",
                    description: "",
                    period_start: "",
                    period_end: "",
                  });
                }}
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-xl transition-all font-semibold shadow-lg hover:scale-105 transform"
              >
                <FaPlus className="text-base" /> Buat Program Baru
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">
            {[
              { label: "Total Program", value: stats.total, color: "indigo" },
              { label: "Program Aktif", value: stats.active, color: "emerald" },
              { label: "Draft", value: stats.draft, color: "amber" },
              { label: "Selesai", value: stats.closed, color: "slate" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`bg-${stat.color}-50 border border-${stat.color}-100 rounded-xl p-6 hover:shadow-md transition-all`}
              >
                <p
                  className={`text-xs font-bold text-${stat.color}-700 uppercase tracking-wider mb-2`}
                >
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold text-${stat.color}-900`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-10 flex flex-col sm:flex-row gap-5">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Cari program..."
              className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm hover:border-indigo-300 transition-all font-medium placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white font-semibold shadow-sm hover:border-indigo-300"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="active">Aktif</option>
            <option value="closed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {/* Programs Table/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-500 animate-pulse">Memuat program...</p>
            </div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed hover:border-slate-300 transition-all">
            <div className="bg-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaExclamationCircle className="text-3xl text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Belum ada program
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mt-3">
              Program yang Anda buat akan muncul di sini. Mulai dengan membuat
              program baru.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs font-bold text-slate-700 uppercase bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-6 font-bold">Program</th>
                    <th className="px-8 py-6 font-bold">Periode</th>
                    <th className="px-8 py-6 font-bold">Anggota</th>
                    <th className="px-8 py-6 font-bold">Status</th>
                    <th className="px-8 py-6 text-center font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrograms.map((program) => {
                    const statusConfig = getStatusConfig(program.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr
                        key={program.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div
                            className="flex items-start gap-4 cursor-pointer hover:underline"
                            onClick={() =>
                              router.push(`/dashboard/programs/${program.id}`)
                            }
                          >
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                              {program.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate text-base">
                                {program.name}
                              </p>
                              <p className="text-xs text-slate-500 truncate mt-1">
                                {program.description || "Tidak ada deskripsi"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <FaCalendarAlt className="text-indigo-500 flex-shrink-0" />
                            {new Date(program.period_start).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <FaUsers className="text-slate-400" />
                            {program.user_roles?.length || 0}
                            <button
                              className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/programs/${program.id}/members`
                                );
                              }}
                              title="Kelola Anggota"
                            >
                              Kelola
                            </button>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
                          >
                            <StatusIcon className="text-sm" />
                            {statusConfig.label}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                router.push(`/dashboard/programs/${program.id}`)
                              }
                              className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-semibold"
                              title="Lihat detail"
                            >
                              <FaChevronRight className="text-sm" />
                            </button>
                            {isAdmin && (
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setDropdownOpen(
                                      dropdownOpen === program.id
                                        ? null
                                        : program.id
                                    )
                                  }
                                  className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all font-semibold"
                                >
                                  <FaEllipsisV className="text-sm" />
                                </button>
                                {dropdownOpen === program.id && (
                                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-50">
                                    <button
                                      onClick={(e) => handleEdit(program, e)}
                                      className="w-full px-5 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 text-slate-700 font-semibold transition-all"
                                    >
                                      <FaEdit className="text-indigo-500 text-base" />{" "}
                                      Edit
                                    </button>
                                    {program.status === "draft" && (
                                      <button
                                        onClick={(e) =>
                                          handleStatusChange(
                                            program,
                                            "active",
                                            e
                                          )
                                        }
                                        className="w-full px-5 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 text-emerald-700 font-semibold transition-all"
                                      >
                                        <FaCheckCircle className="text-emerald-500 text-base" />{" "}
                                        Aktifkan
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) =>
                                        handleDelete(program.id, e)
                                      }
                                      className="w-full px-5 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-700 font-semibold transition-all"
                                    >
                                      <FaTrash className="text-red-500 text-base" />{" "}
                                      Hapus
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100">
                <h3 className="text-2xl font-bold text-slate-900">
                  {editingProgram ? "✏️ Edit Program" : "➕ Program Baru"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-7">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-3">
                    Nama Program *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium hover:border-indigo-200"
                    placeholder="Contoh: KKN Desa Penari"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-3">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium hover:border-indigo-200"
                      value={formData.period_start}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          period_start: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-3">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      className="w-full px-5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium hover:border-indigo-200"
                      value={formData.period_end}
                      onChange={(e) =>
                        setFormData({ ...formData, period_end: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-3">
                    Deskripsi
                  </label>
                  <textarea
                    rows="5"
                    className="w-full px-5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium resize-none hover:border-indigo-200"
                    placeholder="Jelaskan tujuan dan rincian program ini..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="pt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-7 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 transform"
                  >
                    Simpan Program
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
