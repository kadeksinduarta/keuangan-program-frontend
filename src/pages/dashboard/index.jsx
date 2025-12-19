import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { dashboardAPI, programAPI } from "@/lib/api";
import {
  FaWallet,
  FaChartBar,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaFileInvoiceDollar,
  FaCoins,
  FaChartPie,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

// Enhanced Account Card Component with modern minimal style
function AccountCard({ title, amount, icon, change, color, formatCurrency }) {
  const colorBg = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    violet: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };
  const selectedBg = colorBg[color] || colorBg.indigo;
  return (
    <div className="bg-white rounded-xl p-8 shadow border border-slate-100 hover:shadow-md transition-all flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-lg ${selectedBg} flex items-center justify-center`}
        >
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-slate-900">
            {formatCurrency(amount)}
          </h3>
        </div>
        {change && (
          <span
            className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
              change >= 0
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {change >= 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}{" "}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      loadDashboard();
    }
  }, [selectedProgram]);

  const loadPrograms = async () => {
    try {
      const response = await programAPI.getAll();
      const programList =
        response.data?.data?.programs || response.data?.programs || [];

      if (Array.isArray(programList)) {
        setPrograms(programList);
        if (programList.length > 0) {
          setSelectedProgram(programList[0]);
        }
      } else {
        setPrograms([]);
      }
    } catch (error) {
      console.error("Error loading programs:", error);
      setPrograms([]);
    }
  };

  const loadDashboard = async () => {
    if (!selectedProgram?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await dashboardAPI.get(selectedProgram.id);
      const dashboardData =
        response.data?.data || response.data?.dashboard || response.data;
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, showText = false) => {
    if (!amount && amount !== 0) return "Rp 0";
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
    return formatted;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Container utama dashboard
  return (
    <DashboardLayout>
      <div className="min-h-screen w-full bg-gradient-to-br from-violet-50 via-white to-indigo-100 py-12 px-2">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">
                Dashboard
              </h1>
              <p className="text-slate-500 flex items-center gap-2 text-lg">
                <FaCalendarAlt className="text-indigo-500" />
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              {programs.length > 1 && (
                <select
                  value={selectedProgram?.id || ""}
                  onChange={(e) => {
                    const program = programs.find(
                      (p) => p.id === parseInt(e.target.value)
                    );
                    if (program) setSelectedProgram(program);
                  }}
                  className="bg-transparent border-none text-slate-700 font-semibold text-sm focus:ring-0 cursor-pointer px-3 py-2"
                >
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Account Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl shadow-lg p-7 flex flex-col items-center text-center">
              <div className="bg-indigo-500/10 rounded-full p-4 mb-3">
                <FaWallet className="text-indigo-500 text-3xl" />
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                Total Anggaran
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">
                {formatCurrency(
                  dashboard?.program?.total_budget ||
                    dashboard?.program?.total_income ||
                    0
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl shadow-lg p-7 flex flex-col items-center text-center">
              <div className="bg-emerald-500/10 rounded-full p-4 mb-3">
                <FaArrowUp className="text-emerald-500 text-3xl" />
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                Pemasukan
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">
                {formatCurrency(dashboard?.program?.total_income || 0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl shadow-lg p-7 flex flex-col items-center text-center">
              <div className="bg-orange-500/10 rounded-full p-4 mb-3">
                <FaArrowDown className="text-orange-500 text-3xl" />
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                Pengeluaran
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">
                {formatCurrency(
                  dashboard?.program?.total_expense ||
                    dashboard?.program?.total_spent ||
                    0
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-violet-100 to-violet-200 rounded-2xl shadow-lg p-7 flex flex-col items-center text-center">
              <div className="bg-violet-500/10 rounded-full p-4 mb-3">
                <FaCoins className="text-violet-500 text-3xl" />
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                Saldo Tersisa
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">
                {formatCurrency(
                  dashboard?.program?.balance ||
                    dashboard?.program?.remaining_budget ||
                    0
                )}
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Main Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-10 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    Realisasi Anggaran per Kategori
                  </h3>
                  <p className="text-sm text-slate-500">
                    Perbandingan target vs realisasi pengeluaran
                  </p>
                </div>
                <span className="text-xs font-bold px-4 py-2 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                  Live Data
                </span>
              </div>
              <div className="h-72 w-full">
                {/* ...existing code for Bar chart... */}
                <Bar
                  data={{
                    labels:
                      dashboard?.category_breakdown?.map((cat) => cat.name) ||
                      [],
                    datasets: [
                      {
                        label: "Target Anggaran",
                        data:
                          dashboard?.category_breakdown?.map(
                            (cat) => cat.allocated_budget
                          ) || [],
                        backgroundColor: "#6366f1",
                        borderRadius: 6,
                        barPercentage: 0.65,
                      },
                      {
                        label: "Realisasi",
                        data:
                          dashboard?.category_breakdown?.map(
                            (cat) => cat.spent_amount
                          ) || [],
                        backgroundColor: "#f59e0b",
                        borderRadius: 6,
                        barPercentage: 0.65,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                        align: "end",
                        labels: { usePointStyle: true, padding: 15 },
                      },
                      tooltip: {
                        backgroundColor: "#1e293b",
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                          label: (c) =>
                            ` ${c.dataset.label}: ${formatCurrency(c.raw)}`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 12 } },
                      },
                      y: {
                        border: { display: false },
                        grid: { color: "#f1f5f9", drawBorder: false },
                        ticks: { font: { size: 11 }, color: "#64748b" },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Status Dana - Doughnut Chart */}
            <div className="bg-white rounded-3xl shadow-lg p-10 hover:shadow-xl transition-all flex flex-col">
              <div className="mb-8 space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Status Alokasi Dana
                </h3>
                <p className="text-sm text-slate-500">
                  Persentase penggunaan total anggaran
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center relative min-h-64">
                <Doughnut
                  data={{
                    labels: ["Terpakai", "Tersisa"],
                    datasets: [
                      {
                        data: [
                          dashboard?.program?.total_expense ||
                            dashboard?.program?.total_spent ||
                            0,
                          dashboard?.program?.balance ||
                            dashboard?.program?.remaining_budget ||
                            0,
                        ],
                        backgroundColor: ["#f59e0b", "#34d399"],
                        borderWidth: 0,
                        hoverOffset: 8,
                      },
                    ],
                  }}
                  options={{
                    cutout: "75%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: { size: 12 },
                        },
                      },
                    },
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Total Dana
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(
                      dashboard?.program?.total_budget ||
                        dashboard?.program?.total_income ||
                        0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-3xl shadow-lg p-10 overflow-x-auto">
            <div className="px-8 py-7 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 mb-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-900">
                    Rincian Pembayaran
                  </h3>
                  <p className="text-sm text-slate-500">
                    Breakdown transaksi per kategori
                  </p>
                </div>
                <span className="text-xs font-semibold px-4 py-2 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                  {dashboard?.payment_details?.length || 0} Kategori
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs font-bold text-slate-700 uppercase bg-slate-50/70 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-5 font-bold">Kategori</th>
                    <th className="px-8 py-5 text-right font-bold">Target</th>
                    <th className="px-8 py-5 text-right font-bold">
                      Realisasi
                    </th>
                    <th className="px-8 py-5 text-right font-bold">Sisa</th>
                    <th className="px-8 py-5 text-right font-bold">
                      % Pemakaian
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard?.payment_details?.map((payment, idx) => {
                    const total =
                      (payment.cash || 0) +
                      (payment.bank || 0) +
                      (payment.scholarship || 0) +
                      (payment.current_account || 0) +
                      (payment.virtual_account || 0) +
                      (payment.leave || 0);
                    const percentage =
                      total > 0
                        ? Math.round(
                            (total / (dashboard?.program?.total_budget || 1)) *
                              100
                          )
                        : 0;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-indigo-50/60 transition-colors group"
                      >
                        <td className="px-8 py-5 font-semibold text-slate-900">
                          {payment.name}
                        </td>
                        <td className="px-8 py-5 text-right font-medium text-slate-700">
                          {formatCurrency(payment.cash || 0)}
                        </td>
                        <td className="px-8 py-5 text-right font-medium text-slate-700">
                          {formatCurrency(payment.bank || 0)}
                        </td>
                        <td className="px-8 py-5 text-right font-medium text-emerald-600">
                          {formatCurrency(payment.scholarship || 0)}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 w-10 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!dashboard?.payment_details ||
                    dashboard.payment_details.length === 0) && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-8 py-12 text-center text-slate-400 italic"
                      >
                        Tidak ada data transaksi untuk ditampilkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
