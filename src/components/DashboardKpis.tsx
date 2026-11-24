import type { SimulationMetrics, SimulationStatus } from '../engine/types';

interface DashboardKpisProps {
  metrics: SimulationMetrics;
  currentTick: number;
  status: SimulationStatus;
  algorithmName: string;
}

export function DashboardKpis({
  metrics,
  currentTick,
  status,
  algorithmName,
}: DashboardKpisProps) {
  const statusLabel =
    status === 'running'
      ? 'Running'
      : status === 'paused'
        ? 'Paused'
        : status === 'finished'
          ? 'Completed'
          : 'Ready';

  const kpis = [
    { label: 'Total Processes', value: String(metrics.totalProcesses), sub: 'Workload' },
    { label: 'Active Processes', value: String(metrics.activeProcesses), sub: 'Running on CPU' },
    { label: 'Completed Processes', value: String(metrics.completedProcesses), sub: 'Finished' },
    { label: 'Waiting Processes', value: String(metrics.waitingProcesses), sub: 'Queued / New' },
    { label: 'Distributed Nodes', value: String(metrics.distributedNodes), sub: 'Cluster Hosts' },
    {
      label: 'Avg CPU Utilization',
      value: `${metrics.avgCpuUtilization.toFixed(1)}%`,
      sub: 'Cumulative',
    },
    {
      label: 'System Load',
      value: `${metrics.systemLoad.toFixed(1)}%`,
      sub: 'Instant Cluster',
    },
  ];

  return (
    <section
      aria-label="System overview metrics"
      className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 shadow-lg shadow-black/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 px-5 py-3.5">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
            Distributed Operating System Cluster Monitor
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            <span>Scheduler: {algorithmName}</span>
            <span aria-hidden="true" className="mx-2 text-slate-600">
              ·
            </span>
            <span>State: {statusLabel}</span>
            <span aria-hidden="true" className="mx-2 text-slate-600">
              ·
            </span>
            <span className="font-mono tabular-nums text-violet-300" data-testid="sim-clock">
              Clock Tick: {currentTick}
            </span>
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono tabular-nums">
          Throughput: {metrics.throughput.toFixed(2)} proc/tick
          <span aria-hidden="true" className="mx-2 text-slate-600">
            ·
          </span>
          Makespan: {metrics.makespan} ticks
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
        {kpis.map((item) => (
          <div key={item.label} className="px-4 py-3.5">
            <div className="text-xs font-medium text-slate-400 truncate">{item.label}</div>
            <div
              className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 font-mono tabular-nums"
              data-testid={`kpi-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.value}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">{item.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
