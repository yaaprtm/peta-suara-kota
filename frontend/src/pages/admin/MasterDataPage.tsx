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
import LanguageToggle from '../../components/ui/LanguageToggle';
import { useTranslation } from '../../i18n/useTranslation';

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
  const { t } = useTranslation();
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
      toast.success(t('masterData.toastUpdated'));
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
      toast.success(t('masterData.toastAdded'));
      setShowAddCategory(false);
    }
    setNewCatName('');
    setNewCatDesc('');
    setNewCatScore(30);
  };

  const handleRoleChange = (id: string, role: UserRole) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, role } : a));
    toast.success(t('masterData.toastRoleChanged', { role }));
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
            >
              <IconArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-navy text-white px-1.5 py-0.5 rounded font-mono">
                  {t('masterData.headerTag')}
                </span>
                <span className="text-xs text-slate-400">{t('masterData.headerBreadcrumb')}</span>
              </div>
              <h1 className="font-bold text-navy text-sm sm:text-base">
                {t('masterData.headerTitle')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <Link to="/superadmin" className="btn-outline text-xs">
              {t('masterData.backBtn')}
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap">
          {[
            { key: 'kategori', icon: <IconCategory className="w-4 h-4 text-orange" />, label: t('masterData.tab1'), count: categories.length },
            { key: 'level', icon: <IconFlame className="w-4 h-4 text-orange" />, label: t('masterData.tab2'), count: levels.length },
            { key: 'akun', icon: <IconUsers className="w-4 h-4 text-orange" />, label: t('masterData.tab3'), count: accounts.length },
          ].map(({ key, icon, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === key ? 'border-navy text-navy font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {icon}
              <span>{label}</span>
              <span className="bg-slate-100 text-slate-600 px-1.5 rounded-full text-[10px]">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* TAB 1: Category Laporan */}
        {activeTab === 'kategori' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-navy text-sm">{t('masterData.catTitle')}</h2>
                <p className="text-xs text-slate-500">{t('masterData.catSubtitle')}</p>
              </div>
              <button
                onClick={() => { setNewCatName(''); setNewCatDesc(''); setNewCatScore(30); setShowAddCategory(true); }}
                className="btn-navy py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <IconPlus className="w-3.5 h-3.5 text-orange" />
                <span>{t('masterData.addCatBtn')}</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">{t('masterData.colCatName')}</th>
                    <th className="p-3">{t('masterData.colCatCode')}</th>
                    <th className="p-3">{t('masterData.colCatDesc')}</th>
                    <th className="p-3 text-center">{t('masterData.colCatScore')}</th>
                    <th className="p-3 text-right">{t('masterData.colCatActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-navy">{c.name}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{c.type}</td>
                      <td className="p-3 text-slate-600 max-w-sm">{c.description}</td>
                      <td className="p-3 text-center font-bold text-orange font-mono">
                        {t('masterData.scoreUnit', { score: c.baseScore })}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => { setEditingCategory(c); setNewCatName(c.name); setNewCatDesc(c.description); setNewCatScore(c.baseScore); }}
                          className="p-1.5 text-slate-600 hover:text-navy hover:bg-slate-100 rounded"
                          title={t('masterData.editCatTitle')}
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
              <h2 className="font-bold text-navy text-sm">{t('masterData.levelTitle')}</h2>
              <p className="text-xs text-slate-500">{t('masterData.levelSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {levels.map((lvl) => (
                <div key={lvl.level} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full text-white" style={{ backgroundColor: lvl.color }}>
                      {lvl.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {t('masterData.levelRange', { min: lvl.minScore, max: lvl.maxScore })}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t('masterData.levelSLA')}</span>
                      <span className="font-bold text-navy">{t('masterData.levelSLAUnit', { hours: lvl.targetResponseHours })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t('masterData.levelPriority')}</span>
                      <span className="font-semibold text-slate-700">
                        {lvl.level === 'kritis' ? t('masterData.levelPriority1') : lvl.level === 'tinggi' ? t('masterData.levelPriority2') : t('masterData.levelPriority3')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => toast.success(t('masterData.toastSLASaved', { name: lvl.name }))}
                      className="btn-outline text-xs py-1 px-3"
                    >
                      {t('masterData.updateParam')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Daftar Akun */}
        {activeTab === 'akun' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-navy text-sm">{t('masterData.userTitle')}</h2>
              <p className="text-xs text-slate-500">{t('masterData.userSubtitle')}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">{t('masterData.colUserName')}</th>
                    <th className="p-3">{t('masterData.colUserEmail')}</th>
                    <th className="p-3">{t('masterData.colUserRole')}</th>
                    <th className="p-3 text-right">{t('masterData.colUserChange')}</th>
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
                      <td className="p-3 font-mono text-[11px] text-slate-500">{acc.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          acc.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800'
                          : acc.role === 'PETUGAS' ? 'bg-orange-100 text-orange-800'
                          : 'bg-sky-100 text-sky-800'
                        }`}>{acc.role}</span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={acc.role}
                          onChange={(e) => handleRoleChange(acc.id, e.target.value as UserRole)}
                          className="border border-slate-200 rounded text-xs px-2 py-1 bg-white focus:outline-none"
                        >
                          <option value="WARGA">{t('masterData.setWarga')}</option>
                          <option value="PETUGAS">{t('masterData.setPetugas')}</option>
                          <option value="SUPERADMIN">{t('masterData.setSuperadmin')}</option>
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
                {editingCategory ? t('masterData.editModalTitle') : t('masterData.addModalTitle')}
              </h3>
              <button onClick={() => { setShowAddCategory(false); setEditingCategory(null); }} className="text-slate-400 hover:text-white">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('masterData.catNameLabel')}</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={t('masterData.catNamePlaceholder')}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-navy"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('masterData.catDescLabel')}</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder={t('masterData.catDescPlaceholder')}
                  rows={3}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-navy"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('masterData.catScoreLabel')}</label>
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
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-navy py-1.5 px-4 text-xs">
                  {t('common.save')} Kategori
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
