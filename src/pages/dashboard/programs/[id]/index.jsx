import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { programAPI } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { FaUsers, FaCalendarAlt, FaChevronLeft } from "react-icons/fa";

export default function ProgramDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProgram();
  }, [id]);

  const loadProgram = async () => {
    setLoading(true);
    try {
      const res = await programAPI.getById(id);
      setProgram(res.data.data?.program || res.data.program);
    } catch (e) {
      setProgram(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-20 text-center text-slate-500">
          Memuat detail program...
        </div>
      </DashboardLayout>
    );
  }
  if (!program) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-20 text-center text-red-500">
          Program tidak ditemukan.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-10">
        <button
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:underline"
          onClick={() => router.push("/dashboard/programs")}
        >
          <FaChevronLeft /> Kembali ke Daftar Program
        </button>
        <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
        <div className="mb-4 text-slate-600">{program.description}</div>
        <div className="flex gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <FaCalendarAlt className="text-indigo-500" />
            {new Date(program.period_start).toLocaleDateString("id-ID")} -{" "}
            {program.period_end
              ? new Date(program.period_end).toLocaleDateString("id-ID")
              : "-"}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaUsers className="text-indigo-500" />
            {program.user_roles?.length || 0} anggota
          </div>
        </div>
        <div className="flex gap-4 mb-8">
          <button
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
            onClick={() =>
              router.push(`/dashboard/programs/${program.id}/members`)
            }
          >
            Kelola/Invite Anggota
          </button>
        </div>
        {/* Bagian lain detail program bisa ditambahkan di sini */}
      </div>
    </DashboardLayout>
  );
}
