import React, { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  IconArrowLeft,
  IconTrophy,
  IconClock,
  IconCheck,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { statsApi } from '@/lib/api';
import { LeaderboardEntry } from '@/types';
import { LoadingSpinner, SkeletonCard } from '@/Components/ui/Badges';
import LanguageToggle from '@/Components/ui/LanguageToggle';
import { useTranslation } from '@/i18n/useTranslation';
import clsx from 'clsx';

// Sample fallback leaderboard if backend is offline
const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { kelurahan: { id: 'k-1', name: 'Gubeng', kecamatan: 'Gubeng', kota: 'Surabaya' }, totalReports: 42, resolvedReports: 39, resolutionRate: 92.8, avgResponseHours: 3.5, score: 96 },
  { kelurahan: { id: 'k-2', name: 'Genteng', kecamatan: 'Genteng', kota: 'Surabaya' }, totalReports: 35, resolvedReports: 32, resolutionRate: 91.4, avgResponseHours: 4.1, score: 93 },
  { kelurahan: { id: 'k-3', name: 'Tegalsari', kecamatan: 'Tegalsari', kota: 'Surabaya' }, totalReports: 28, resolvedReports: 25, resolutionRate: 89.2, avgResponseHours: 4.8, score: 88 },
  { kelurahan: { id: 'k-4', name: 'Wonokromo', kecamatan: 'Wonokromo', kota: 'Surabaya' }, totalReports: 45, resolvedReports: 38, resolutionRate: 84.4, avgResponseHours: 5.2, score: 85 },
  { kelurahan: { id: 'k-5', name: 'Rungkut Kidul', kecamatan: 'Rungkut', kota: 'Surabaya' }, totalReports: 31, resolvedReports: 26, resolutionRate: 83.8, avgResponseHours: 6.0, score: 82 },
  { kelurahan: { id: 'k-6', name: 'Krembangan Selatan', kecamatan: 'Krembangan', kota: 'Surabaya' }, totalReports: 22, resolvedReports: 18, resolutionRate: 81.8, avgResponseHours: 6.5, score: 79 },
];

const LeaderboardPage: React.FC = () => {
  const navigate = (url: string) => router.visit(url);
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>(SAMPLE_LEADERBOARD);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.leaderboard()
      .then((data: any) => {
        if (data?.leaderboard && data.leaderboard.length > 0) {
          setEntries(data.leaderboard);
        }
      })
      .catch(() => {
        // Fallback to sample leaderboard
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const maxScore = entries[0]?.score || 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title={t('common.back')}
            >
              <IconArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <IconTrophy className="w-4 h-4 text-orange" />
                <h1 className="font-bold text-navy text-sm sm:text-base leading-none">
                  {t('leaderboard.headerTitle')}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('leaderboard.headerSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-navy-50 text-navy px-3 py-1.5 rounded-lg border border-navy-100">
              <IconBuildingCommunity className="w-4 h-4 text-orange" />
              <span>{t('leaderboard.regionBadge')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Top 3 Podium */}
        {!isLoading && entries.length >= 3 && (
          <div className="flex items-end justify-center gap-3 sm:gap-4 mb-6">
            <PodiumCard entry={entries[1]} rank={2} />
            <PodiumCard entry={entries[0]} rank={1} isFirst />
            <PodiumCard entry={entries[2]} rank={3} />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Full Table */}
        {!isLoading && entries.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-navy uppercase">
              <span>{t('leaderboard.tableTitle')}</span>
              <span className="text-[11px] text-slate-500 font-mono">{t('leaderboard.tableCount', { count: entries.length })}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const barWidth = Math.max(5, Math.round((entry.score / maxScore) * 100));

                return (
                  <div
                    key={entry.kelurahan.id}
                    className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center gap-3.5 text-xs"
                  >
                    <span className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0',
                      rank === 1 ? 'bg-orange text-navy-900 font-black shadow-xs'
                      : rank === 2 ? 'bg-slate-200 text-slate-800'
                      : rank === 3 ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                    )}>
                      #{rank}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="font-bold text-sm text-navy uppercase tracking-tight">
                            {t('leaderboard.kelurahanPrefix')} {entry.kelurahan.name}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            {t('leaderboard.kecamatanPrefix')} {entry.kelurahan.kecamatan}
                          </span>
                        </div>
                        <span className="font-bold text-navy text-sm font-mono">
                          {t('leaderboard.scoreUnit', { score: entry.score })}
                        </span>
                      </div>

                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-navy rounded-full transition-all duration-300" style={{ width: `${barWidth}%` }} />
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-emerald-700">
                          <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {t('leaderboard.resolutionText', { done: entry.resolvedReports, total: entry.totalReports, pct: entry.resolutionRate })}
                        </span>
                        <span className="flex items-center gap-1">
                          <IconClock className="w-3.5 h-3.5 text-slate-400" />
                          {entry.avgResponseHours !== null
                            ? t('leaderboard.avgResponse', { hours: entry.avgResponseHours })
                            : t('leaderboard.avgResponseNone')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ─── Podium Card Subcomponent ─────────────────────────────────────────────────

interface PodiumCardProps {
  entry: LeaderboardEntry;
  rank: number;
  isFirst?: boolean;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ entry, rank, isFirst }) => {
  const { t } = useTranslation();
  return (
    <div className={clsx(
      'p-4 rounded-xl flex flex-col items-center text-center border transition-all flex-1 max-w-[220px]',
      isFirst ? 'bg-white border-orange shadow-md -translate-y-3 ring-2 ring-orange/30' : 'bg-white border-slate-200 shadow-2xs'
    )}>
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 shadow-xs',
        isFirst ? 'bg-orange text-navy-900 font-black' : rank === 2 ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900'
      )}>
        #{rank}
      </div>
      <div className="font-bold text-xs text-navy uppercase truncate w-full">{entry.kelurahan.name}</div>
      <div className="text-[10px] text-slate-500 truncate w-full mb-2">
        {t('leaderboard.kecamatanPrefix')} {entry.kelurahan.kecamatan.toUpperCase()}
      </div>
      <div className="font-bold text-base text-navy font-mono">{t('leaderboard.scoreUnit', { score: entry.score })}</div>
      <div className="text-[9px] text-slate-500 uppercase font-semibold">{t('leaderboard.scoreKinerja')}</div>
    </div>
  );
};

export default LeaderboardPage;
