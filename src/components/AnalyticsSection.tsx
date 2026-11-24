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
import { BarChart3 } from 'lucide-react';
import type {
  MigrationEvent,
  NodeState,
  ProcessItem,
  SimulationMetrics,
} from '../engine/types';

interface AnalyticsSectionProps {
  nodes: NodeState[];
  processes: ProcessItem[];
  metrics: SimulationMetrics;
  migrationEvents: MigrationEvent[];
  currentTick: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#090f24',
  border: '1px solid rgba(139, 92, 246, 0.35)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#f1f5f9',
};

export function AnalyticsSection({
  nodes,
  processes,
  metrics,
  migrationEvents,
  currentTick,
}: AnalyticsSectionProps) {
  const nodeCpuData = nodes.map((n) => {
    const cumulativeUtil =
      currentTick > 0 ? Number(((n.busyTicks / currentTick) * 100).toFixed(1)) : 0;
    const assigned = (n.runningProcessId ? 1 : 0) + n.readyQueue.length;
    const completed = processes.filter(
      (p) => p.assignedNodeId === n.id && p.status === 'Completed'
    ).length;

    return {
      name: n.name,
      instantLoad: n.instantCpuLoad,
      cumulativeUtil,
      assigned,
      completed,
    };
  });

  const latestMigration =
    migrationEvents.length > 0 ? migrationEvents[migrationEvents.length - 1] : null;

  const beforeAfterData = nodes.map((n, idx) => ({
    name: n.name,
    beforeLoad: latestMigration ? latestMigration.beforeLoads[idx] : n.instantCpuLoad,
    afterLoad: latestMigration ? latestMigration.afterLoads[idx] : n.instantCpuLoad,
  }));

  const processTimingData = processes.slice(0, 12).map((p) => ({
    pid: p.pid,
    waitingTime: p.waitingTime,
    turnaroundTime:
      p.turnaroundTime !== null
        ? p.turnaroundTime
        : p.status === 'New'
          ? 0
          : p.waitingTime + p.executedTime,
  }));

  const statusData = [
    { status: 'New', count: processes.filter((p) => p.status === 'New').length },
    { status: 'Ready', count: processes.filter((p) => p.status === 'Ready').length },
    { status: 'Running', count: processes.filter((p) => p.status === 'Running').length },
    { status: 'Waiting', count: processes.filter((p) => p.status === 'Waiting').length },
    { status: 'Completed', count: processes.filter((p) => p.status === 'Completed').length },
  ];

  const calculatedCards = [
    {
      label: 'Average Waiting Time',
      value: `${metrics.avgWaitingTime.toFixed(2)} ticks`,
    },
    {
      label: 'Average Turnaround Time',
      value: `${metrics.avgTurnaroundTime.toFixed(2)} ticks`,
    },
    {
      label: 'Throughput',
      value: `${metrics.throughput.toFixed(3)} proc/tick`,
    },
    {
      label: 'CPU Utilization',
      value: `${metrics.avgCpuUtilization.toFixed(1)}%`,
    },
    {
      label: 'Makespan',
      value: `${metrics.makespan} ticks`,
    },
  ];

  return (
    <section
      id="analytics"
      aria-label="Performance analytics and load distribution"
      className="space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <BarChart3 className="h-5 w-5 text-violet-400" aria-hidden="true" />
            <span>Performance Analytics &amp; Load Distribution</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time mathematical metrics computed directly from simulation ticks, node utilization, and completed processes.
          </p>
        </div>
      </div>

      {/* Calculated Performance Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80 rounded-xl border border-violet-500/20 bg-[#0d142b]/90 shadow-lg shadow-black/30">
        {calculatedCards.map((item) => (
          <div key={item.label} className="px-4 py-3.5">
            <div className="text-xs text-slate-400">{item.label}</div>
            <div
              className="mt-1 font-mono text-lg font-semibold tabular-nums text-white"
              data-testid={`metric-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Recharts Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 1. CPU Utilization of All Nodes */}
        <div className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30">
          <h3 className="text-sm font-semibold text-white">
            CPU Utilization Across Nodes (%)
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Instantaneous node CPU load vs cumulative active execution percentage.
          </p>
          <div className="mt-4 h-[230px] w-full">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={nodeCpuData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="instantLoad"
                  name="Instant Load (%)"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="cumulativeUtil"
                  name="Cumulative Util (%)"
                  fill="#38BDF8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Before vs After Load Balancing Distribution */}
        <div className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30">
          <h3 className="text-sm font-semibold text-white">
            Before &amp; After Load Balancing CPU Distribution
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {latestMigration
              ? `Latest rebalance (Tick ${latestMigration.tick}): migrated ${latestMigration.pid} from Node ${latestMigration.fromNodeId} to Node ${latestMigration.toNodeId}.`
              : 'Displays before-and-after node loads whenever a load-balancing migration occurs.'}
          </p>
          <div className="mt-4 h-[230px] w-full">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={beforeAfterData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="beforeLoad"
                  name="Before Migration (%)"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="afterLoad"
                  name="After Migration (%)"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Waiting Time & Turnaround Time Comparison */}
        <div className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30">
          <h3 className="text-sm font-semibold text-white">
            Waiting Time vs Turnaround Time by Process
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Per-process waiting and turnaround ticks accumulated during the run.
          </p>
          <div className="mt-4 h-[230px] w-full">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={processTimingData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="pid" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="waitingTime"
                  name="Waiting Time (ticks)"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="turnaroundTime"
                  name="Turnaround Time (ticks)"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Process Completion Statistics & Node Load Distribution */}
        <div className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30">
          <h3 className="text-sm font-semibold text-white">
            Process Lifecycle &amp; Node Completion Statistics
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Live process count across lifecycle states and completed tasks per node.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey="count"
                    name="Processes"
                    fill="#A855F7"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={nodeCpuData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar
                    dataKey="assigned"
                    name="Active/Queued"
                    fill="#38BDF8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
