import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { programAPI, userAPI } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { FaUserPlus, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

export default function ProgramMembersPage() {
  const router = useRouter();
  const { id: programId } = router.query;
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("anggota");
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (programId) loadMembers();
  }, [programId]);

  const loadMembers = async () => {
    try {
      const res = await programAPI.getMembers(programId);
      setMembers(res.data.data.members || []);
    } catch (e) {
      setError("Gagal memuat anggota");
    }
  };

  const handleSearch = async () => {
    setError("");
    setSuccess("");
    setSearchResult(null);
    if (!email) return;
    try {
      const res = await userAPI.getByEmail(email);
      const user = (res.data.users || []).find((u) => u.email === email);
      if (!user) {
        setError("Email tidak ditemukan atau belum terdaftar");
        return;
      }
      setSearchResult(user);
    } catch (e) {
      setError("Gagal mencari user");
    }
  };

  const handleInvite = async () => {
    if (!searchResult) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await programAPI.addMember(programId, { user_id: searchResult.id, role });
      setSuccess("Anggota berhasil ditambahkan");
      setEmail("");
      setSearchResult(null);
      loadMembers();
    } catch (e) {
      setError(e.response?.data?.message || "Gagal menambah anggota");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm("Yakin ingin menghapus anggota ini?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await programAPI.removeMember(programId, userId);
      setSuccess("Anggota berhasil dihapus");
      loadMembers();
    } catch (e) {
      setError(e.response?.data?.message || "Gagal menghapus anggota");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-10">
        <h2 className="text-2xl font-bold mb-6">Kelola Anggota Program</h2>
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300"
              placeholder="Masukkan email anggota"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold"
              disabled={loading || !email}
            >
              Cari
            </button>
          </div>
          {searchResult && (
            <div className="flex items-center gap-3 mt-2 p-2 bg-white rounded-lg border border-slate-200">
              <span>
                {searchResult.full_name || searchResult.name} (
                {searchResult.email})
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-300"
              >
                <option value="anggota">Anggota</option>
                <option value="bendahara">Bendahara</option>
              </select>
              <button
                onClick={handleInvite}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1"
                disabled={loading}
              >
                <FaUserPlus /> Tambah
              </button>
            </div>
          )}
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {success && <div className="text-emerald-600 mt-2">{success}</div>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold mb-3">
            Daftar Anggota ({members.length}/5)
          </h3>
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li
                key={m.user.id}
                className="flex items-center justify-between py-2"
              >
                <span>
                  {m.user.full_name || m.user.name} ({m.user.email}) -{" "}
                  <span className="font-semibold">{m.role}</span>
                  {m.status === "approved" && (
                    <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded">
                      Aktif
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemove(m.user.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg flex items-center gap-1"
                    disabled={loading}
                  >
                    <FaTrash /> Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
