import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconTrophy,
  IconClock,
  IconCheck,
  IconFileText,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { statsApi } from '../../lib/api';
import { LeaderboardEntry } from '../../types';
import { LoadingSpinner, SkeletonCard } from '../../components/ui/Badges';
import clsx from 'clsx';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = (await statsApi.leaderboard()) as { leaderboard: LeaderboardEntry[] };
        setEntries(data.leaderboard);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal memuat rekapitulasi kelurahan');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const maxScore = entries[0]?.score || 100;

  return (
    <div className="min-h-screen bg-board-bg board-pattern text-paper-white overflow-y-auto">
      {/* Official Header */}
      <header className="border-b border-ink bg-paper-white text-ink sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 border border-ink bg-paper-white hover:bg-paper-kraft text-ink transition-colors"
              title="Kembali ke Peta"
            >
              <IconArrowLeft className="w-4 h-4" stroke={1.5} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <IconTrophy className="w-5 h-5 text-mustard" stroke={1.5} />
                <h1 className="font-body font-bold text-base text-ink uppercase tracking-tight leading-none">
                  PAPAN SKOR KELURAHAN KOTA SURABAYA
                </h1>
              </div>
              <p className="font-mono text-[10px] text-ink/70 mt-0.5 tracking-tight uppercase">
                REKAPITULASI RESPONS DAN PENYELESAIAN PENGADUAN WARGA RESMI
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] bg-paper-kraft px-2.5 py-1 border border-ink text-ink font-bold">
            <IconBuildingCommunity className="w-3.5 h-3.5" stroke={1.5} />
            <span>WILAYAH SURABAYA</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Top 3 Podium Cards */}
        {!isLoading && entries.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-6">
            {/* 2nd place */}
            <PodiumCard entry={entries[1]} rank={2} />
            {/* 1st place */}
            <PodiumCard entry={entries[0]} rank={1} isFirst />
            {/* 3rd place */}
            <PodiumCard entry={entries[2]} rank={3} />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-paper-white border border-stamp-red p-4 text-center text-stamp-red font-mono text-xs">
            {error}
          </div>
        )}

        {/* Full Registry List */}
        {!isLoading && entries.length > 0 && (
          <div className="bg-paper-white border border-ink text-ink">
            <div className="p-3 border-b border-ink bg-paper-kraft flex items-center justify-between font-mono font-bold text-xs uppercase text-ink">
              <span>DAFTAR PERINGKAT KELURAHAN</span>
              <span>{entries.length} KELURAHAN TERDATA</span>
            </div>

            <div className="divide-y divide-ink/20">
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const barWidth = Math.max(5, Math.round((entry.score / maxScore) * 100));

                return (
                  <div
                    key={entry.kelurahan.id}
                    className="p-3 hover:bg-paper-kraft/40 transition-colors flex items-center gap-3 text-xs"
                  >
                    {/* Rank number badge */}
                    <span
                      className={clsx(
                        'w-7 h-7 flex items-center justify-center font-mono font-bold text-xs border border-ink shrink-0',
                        rank === 1
                          ? 'bg-mustard text-paper-white'
                          : rank === 2
                          ? 'bg-paper-blue text-ink'
                          : rank === 3
                          ? 'bg-paper-kraft text-ink'
                          : 'bg-paper-white text-ink/70'
                      )}
                    >
                      #{rank}
                    </span>

                    {/* Kelurahan info & score meter */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-body font-bold text-sm text-ink uppercase tracking-tight">
                            {entry.kelurahan.name}
                          </span>
                          <span className="font-mono text-[10px] text-ink/60 ml-2">
                            Kec. {entry.kelurahan.kecamatan}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-ink text-sm">{entry.score} PTS</span>
                      </div>

                      {/* Bar indicator */}
                      <div className="h-1.5 bg-paper-kraft/60 border border-ink/40 overflow-hidden">
                        <div
                          className="h-full bg-ink transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      {/* Sub-stats */}
                      <div className="flex items-center gap-4 mt-1 font-mono text-[10px] text-ink/70">
                        <span className="flex items-center gap-1">
                          <IconCheck className="w-3 h-3 text-muted-teal" stroke={2} />
                          {entry.resolvedReports}/{entry.totalReports} LAPORAN TUNTAS
                        </span>
                        <span className="flex items-center gap-1">
                          <IconClock className="w-3 h-3 text-ink/70" stroke={1.5} />
                          RERATA RESPON: {entry.avgResponseHours !== null ? `${Math.round(entry.avgResponseHours)} JAM` : '-'}
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
  return (
    <div
      className={clsx(
        'p-3.5 flex flex-col items-center text-center border border-ink text-ink transition-all flex-1 max-w-[210px]',
        isFirst
          ? 'bg-paper-white -translate-y-2'
          : rank === 2
          ? 'bg-paper-blue'
          : 'bg-paper-kraft'
      )}
    >
      <div
        className={clsx(
          'w-7 h-7 flex items-center justify-center font-mono font-bold text-xs mb-1.5 border border-ink',
          isFirst
            ? 'bg-mustard text-paper-white'
            : rank === 2
            ? 'bg-paper-white text-ink'
            : 'bg-paper-white text-ink'
        )}
      >
        #{rank}
      </div>

      <div className="font-body font-bold text-xs text-ink uppercase tracking-tight truncate w-full">
        {entry.kelurahan.name}
      </div>
      <div className="font-mono text-[9px] text-ink/70 truncate w-full mb-2">
        KEC. {entry.kelurahan.kecamatan.toUpperCase()}
      </div>

      <div className="font-mono text-sm font-bold text-ink">{entry.score} PTS</div>
      <div className="font-mono text-[8px] text-ink/60 uppercase">INDEKS KINERJA</div>
    </div>
  );
};

export default LeaderboardPage;
