import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconArrowLeft,
  IconDatabase,
  IconCategory,
  IconFlame,
  IconUsers,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconTool,
  IconDroplet,
  IconShieldExclamation,
  IconFileText,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { MasterCategory, MasterLevel, ReportCategory, User, UserRole } from '../../types';
import { Avatar } from '../../components/ui/Badges';

const INITIAL_CATEGORIES: MasterCategory[] = [
  {
    id: 'cat-infra',
    name: 'Infrastruktur & Jalan',
    type: 'INFRASTRUKTUR',
    icon: 'IconTool',
    description: 'Jalan berlubang, lampu penerangan jalan umum mati, jembatan rusak, trotoar amblas.',
    baseScore: 40,
  },
  {
    id: 'cat-kebersihan',
    name: 'Kebersihan & Sampah',
    type: 'KEBERSIHAN',
    icon: 'IconTrash',
    description: 'Tumpukan sampah liar, TPS overload, ranting pohon tumbang di ruang publik.',
    baseScore: 35,
  },
  {
    id: 'cat-keamanan',
    name: 'Ketertiban & Keamanan',
    type: 'KEAMANAN',
    icon: 'IconShieldExclamation',
    description: 'Pungli, tawuran, gangguan ketertiban umum, pelanggaran parkir liar.',
    baseScore: 50,
  },
  {
    id: 'cat-banjir',
    name: 'Banjir & Genangan Air',
    type: 'BANJIR',
    icon: 'IconDroplet',
    description: 'Saluran air tersumbat, tanggul jebol, genangan air jalan protokol pasca hujan.',
    baseScore: 60,
  },
  {
    id: 'cat-lainnya',
    name: 'Pelayanan Publik Lainnya',
    type: 'LAINNYA',
    icon: 'IconFileText',
    description: 'Aspirasi umum, pengaduan fasilitas dinas, perizinan, dan administrasi kependudukan.',
    baseScore: 25,
  },
];

const INITIAL_LEVELS: MasterLevel[] = [
  {
    level: 'kritis',
    name: 'Level 1: Kritis (Emergency)',
    minScore: 80,
    maxScore: 100,
    color: '#DC2626',
    targetResponseHours: 2,
  },
  {
    level: 'tinggi',
    name: 'Level 2: Tinggi (Prioritas)',
    minScore: 60,
    maxScore: 79,
    color: '#EA580C',
    targetResponseHours: 6,
  },
  {
    level: 'sedang',
    name: 'Level 3: Sedang (Standar)',
    minScore: 35,
    maxScore: 59,
    color: '#F5A524',
    targetResponseHours: 24,
  },
  {
    level: 'rendah',
    name: 'Level 4: Rendah (Rutin)',
    minScore: 0,
    maxScore: 34,
    color: '#10B981',
    targetResponseHours: 72,
  },
];

const INITIAL_ACCOUNTS: User[] = [
  { id: 'usr-1', name: 'Budi Santoso', email: 'warga@surabaya.go.id', role: 'WARGA', phone: '081234567890', isActive: true },
  { id: 'usr-2', name: 'Bambang Trianto', email: 'petugas@surabaya.go.id', role: 'PETUGAS', phone: '081234567891', isActive: true },
  { id: 'usr-3', name: 'Rendra Prasetya', email: 'superadmin@surabaya.go.id', role: 'SUPERADMIN', phone: '081234567892', isActive: true },
  { id: 'usr-4', name: 'Siti Aminah', email: 'siti.aminah@surabaya.go.id', role: 'WARGA', phone: '081298765432', isActive: true },
  { id: 'usr-5', name: 'Agus Setiawan', email: 'agus.dkrth@surabaya.go.id', role: 'PETUGAS', phone: '081345678901', isActive: true },
];

const MasterDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'kategori' | 'level' | 'akun'>('kategori');

  // Master States
  const [categories, setCategories] = useState<MasterCategory[]>(INITIAL_CATEGORIES);
  const [levels, setLevels] = useState<MasterLevel[]>(INITIAL_LEVELS);
  const [accounts, setAccounts] = useState<User[]>(INITIAL_ACCOUNTS);

  // Edit/Add modal state
  const [editingCategory, setEditingCategory] = useState<MasterCategory | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatScore, setNewCatScore] = useState(30);

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(prev =>
        prev.map(c => c.id === editingCategory.id ? { ...c, name: newCatName, description: newCatDesc, baseScore: Number(newCatScore) } : c)
      );
      toast.success('Kategori berhasil diperbarui');
      setEditingCategory(null);
    } else {
      const newCat: MasterCategory = {
        id: `cat-${Date.now()}`,
        name: newCatName,
        type: 'LAINNYA',
        icon: 'IconFileText',
        description: newCatDesc,
        baseScore: Number(newCatScore),
      };
      setCategories(prev => [...prev, newCat]);
      toast.success('Kategori baru berhasil ditambahkan');
      setShowAddCategory(false);
    }
    setNewCatName('');
    setNewCatDesc('');
    setNewCatScore(30);
  };

  const handleRoleChange = (id: string, role: UserRole) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, role } : a));
    toast.success(`Role pengguna diubah menjadi: ${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/superadmin')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Kembali ke Dashboard Superadmin"
            >
              <IconArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-navy text-white px-1.5 py-0.5 rounded font-mono">
                  SUPERADMIN
                </span>
                <span className="text-xs text-slate-400">/ Master Data</span>
              </div>
              <h1 className="font-bold text-navy text-sm sm:text-base">
                Kelola Master Data & Konfigurasi Sistem
              </h1>
            </div>
          </div>

          <Link
            to="/superadmin"
            className="btn-outline text-xs"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('kategori')}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'kategori'
                ? 'border-navy text-navy font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <IconCategory className="w-4 h-4 text-orange" />
            <span>Category Laporan</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('level')}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'level'
                ? 'border-navy text-navy font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <IconFlame className="w-4 h-4 text-orange" />
            <span>Level Laporan</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {levels.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('akun')}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'akun'
                ? 'border-navy text-navy font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <IconUsers className="w-4 h-4 text-orange" />
            <span>Daftar Akun & Role Pengguna</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {accounts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* TAB 1: Category Laporan */}
        {activeTab === 'kategori' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-navy text-sm">Master Kategori Pengaduan</h2>
                <p className="text-xs text-slate-500">
                  Daftar kategori resmi masalah kota dengan konfigurasi bobot urgensi dasar (base score).
                </p>
              </div>
              <button
                onClick={() => {
                  setNewCatName('');
                  setNewCatDesc('');
                  setNewCatScore(30);
                  setShowAddCategory(true);
                }}
                className="btn-navy py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <IconPlus className="w-3.5 h-3.5 text-orange" />
                <span>Tambah Kategori</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Nama Kategori</th>
                    <th className="p-3">Kode Tipe</th>
                    <th className="p-3">Deskripsi & Ruang Lingkup</th>
                    <th className="p-3 text-center">Base Score</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-navy">
                        {c.name}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {c.type}
                      </td>
                      <td className="p-3 text-slate-600 max-w-sm">
                        {c.description}
                      </td>
                      <td className="p-3 text-center font-bold text-orange font-mono">
                        +{c.baseScore} Poin
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setNewCatName(c.name);
                            setNewCatDesc(c.description);
                            setNewCatScore(c.baseScore);
                          }}
                          className="p-1.5 text-slate-600 hover:text-navy hover:bg-slate-100 rounded"
                          title="Edit Kategori"
                        >
                          <IconEdit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Level Laporan */}
        {activeTab === 'level' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-navy text-sm">Master Level Urgensi & SLA Penanganan</h2>
              <p className="text-xs text-slate-500">
                Klasifikasi tingkat kegentingan laporan berdasarkan skor kecerdasan buatan dan batas target respon dinas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {levels.map((lvl) => (
                <div key={lvl.level} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-1 text-xs font-bold rounded-full text-white"
                      style={{ backgroundColor: lvl.color }}
                    >
                      {lvl.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      Rentang: {lvl.minScore} - {lvl.maxScore} Poin
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Waktu Respon (SLA):</span>
                      <span className="font-bold text-navy">{lvl.targetResponseHours} Jam</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Prioritas Antrean Petugas:</span>
                      <span className="font-semibold text-slate-700">
                        {lvl.level === 'kritis' ? 'Tertinggi (Paling Atas)' : lvl.level === 'tinggi' ? 'Prioritas Kedua' : 'Normal'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => toast.success(`Konfigurasi SLA Level ${lvl.name} tersimpan`)}
                      className="btn-outline text-xs py-1 px-3"
                    >
                      Perbarui Parameter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Daftar Akun dan Role Pengguna */}
        {activeTab === 'akun' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-navy text-sm">Daftar Akun dan Role Pengguna</h2>
              <p className="text-xs text-slate-500">
                Kelola hak akses pengguna platform: WARGA, PETUGAS (Command Center), dan SUPERADMIN.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Nama & Profil</th>
                    <th className="p-3">Email Pengguna</th>
                    <th className="p-3">Peran Saat Ini</th>
                    <th className="p-3 text-right">Ubah Hak Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={acc.name} size="sm" />
                          <span className="font-bold text-navy text-xs">{acc.name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {acc.email}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          acc.role === 'SUPERADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : acc.role === 'PETUGAS'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {acc.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={acc.role}
                          onChange={(e) => handleRoleChange(acc.id, e.target.value as UserRole)}
                          className="border border-slate-200 rounded text-xs px-2 py-1 bg-white focus:outline-none"
                        >
                          <option value="WARGA">Set: WARGA</option>
                          <option value="PETUGAS">Set: PETUGAS</option>
                          <option value="SUPERADMIN">Set: SUPERADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit/Add Category Modal */}
      {(showAddCategory || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy px-4 py-3 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider">
                {editingCategory ? 'Edit Kategori Laporan' : 'Tambah Kategori Laporan Baru'}
              </h3>
              <button
                onClick={() => { setShowAddCategory(false); setEditingCategory(null); }}
                className="text-slate-400 hover:text-white"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kategori:
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Lampu Penerangan Jalan (PJU)"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-navy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi & Ruang Lingkup:
                </label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Penjelasan cakupan pengaduan..."
                  rows={3}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-navy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Score Urgensi (0 - 100):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCatScore}
                  onChange={(e) => setNewCatScore(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-navy"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddCategory(false); setEditingCategory(null); }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-navy py-1.5 px-4 text-xs"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDataPage;
