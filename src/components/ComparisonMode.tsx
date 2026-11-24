import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Scale } from 'lucide-react';
import { compareAllAlgorithms } from '../engine/scheduler';
import type { ProcessItem, SchedulingAlgorithm } from '../engine/types';

interface ComparisonModeProps {
  processes: ProcessItem[];
  timeQuantum: number;
  activeAlgorithm: SchedulingAlgorithm;
  onApplyAlgorithm: (alg: SchedulingAlgorithm) => void;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#090f24',
  border: '1px solid rgba(139, 92, 246, 0.35)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#f1f5f9',
};

export function ComparisonMode({
  processes,
  timeQuantum,
  activeAlgorithm,
  onApplyAlgorithm,
}: ComparisonModeProps) {
  const results = useMemo(() => {
    if (processes.length === 0) return [];
    return compareAllAlgorithms(processes, timeQuantum);
  }, [processes, timeQuantum]);

  const bestWait =
    results.length > 0 ? Math.min(...results.map((r) => r.avgWaitingTime)) : 0;
  const bestMakespan =
    results.length > 0 ? Math.min(...results.map((r) => r.makespan)) : 0;
  const bestUtil =
    results.length > 0 ? Math.max(...results.map((r) => r.cpuUtilization)) : 0;

  return (
    <section
      id="comparison"
      aria-label="Scheduling algorithm comparison mode"
      className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Scale className="h-5 w-5 text-violet-400" aria-hidden="true" />
            <span>Algorithm Comparison Mode</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Deterministic benchmark simulating your current {processes.length}-process workload across all 5 scheduling policies (Round Robin Q={timeQuantum}).
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          Add processes to run the cross-algorithm benchmark.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="h-[240px] w-full">
              <h3 className="mb-2 text-xs font-semibold text-slate-200">
                Average Waiting Time, Turnaround Time &amp; Makespan (ticks)
              </h3>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={results} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="avgWaitingTime"
                    name="Avg Wait"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgTurnaroundTime"
                    name="Avg Turnaround"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="makespan"
                    name="Makespan"
                    fill="#38BDF8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[240px] w-full">
              <h3 className="mb-2 text-xs font-semibold text-slate-200">
                Cluster CPU Utilization (%) &amp; Inter-Node Load Imbalance (σ%)
              </h3>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={results} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="cpuUtilization"
                    name="CPU Utilization (%)"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="loadVariance"
                    name="Load StdDev (%)"
                    fill="#EC4899"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-800/80 pt-4">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">Algorithm</th>
                  <th className="py-2 px-2 font-medium text-right">Avg Wait</th>
                  <th className="py-2 px-2 font-medium text-right">Avg Turnaround</th>
                  <th className="py-2 px-2 font-medium text-right">Throughput</th>
                  <th className="py-2 px-2 font-medium text-right">CPU Util</th>
                  <th className="py-2 px-2 font-medium text-right">Makespan</th>
                  <th className="py-2 px-2 font-medium text-right">Migrations</th>
                  <th className="py-2 pl-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {results.map((row) => {
                  const isActive = row.algorithm === activeAlgorithm;
                  return (
                    <tr
                      key={row.algorithm}
                      className={isActive ? 'bg-violet-950/30' : 'hover:bg-slate-900/50'}
                    >
                      <td className="py-2.5 pr-3 font-semibold text-white">
                        {row.label}
                        {isActive && (
                          <span className="ml-2 text-[11px] font-normal text-violet-300">
                            (Active)
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right font-mono tabular-nums ${
                          row.avgWaitingTime === bestWait
                            ? 'text-emerald-300 font-semibold'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.avgWaitingTime.toFixed(2)}t
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-200">
                        {row.avgTurnaroundTime.toFixed(2)}t
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-200">
                        {row.throughput.toFixed(3)}/t
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right font-mono tabular-nums ${
                          row.cpuUtilization === bestUtil
                            ? 'text-emerald-300 font-semibold'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.cpuUtilization.toFixed(1)}%
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right font-mono tabular-nums ${
                          row.makespan === bestMakespan
                            ? 'text-emerald-300 font-semibold'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.makespan}t
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-300">
                        {row.migrationsCount}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => onApplyAlgorithm(row.algorithm)}
                          disabled={isActive}
                          className="min-h-[32px] rounded-md border border-violet-500/35 bg-violet-500/15 px-3 py-1 text-[11px] font-semibold text-violet-200 transition-colors hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer whitespace-nowrap"
                        >
                          {isActive ? 'Selected' : 'Apply Policy'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
