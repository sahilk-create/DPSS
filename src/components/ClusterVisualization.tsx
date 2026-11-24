import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  HardDrive,
  PauseCircle,
  Server,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { MigrationEvent, NodeState, ProcessItem } from '../engine/types';

interface ClusterVisualizationProps {
  nodes: NodeState[];
  processes: ProcessItem[];
  migrationEvents: MigrationEvent[];
  currentTick: number;
  onSelectProcess: (proc: ProcessItem) => void;
}

const NODE_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 110, y: 42 },
  2: { x: 330, y: 42 },
  3: { x: 550, y: 42 },
  4: { x: 770, y: 42 },
};

export function ClusterVisualization({
  nodes,
  processes,
  migrationEvents,
  currentTick,
  onSelectProcess,
}: ClusterVisualizationProps) {
  const processMap = new Map(processes.map((p) => [p.id, p]));
  const completedProcesses = processes.filter((p) => p.status === 'Completed');
  const waitingPool = processes.filter((p) => p.status === 'Waiting' || p.status === 'New');

  // Highlight recent migrations within the last 4 ticks or most recent migration
  const activeMigrations = migrationEvents.filter(
    (m) => currentTick - m.tick <= 3
  );
  const latestMigration =
    migrationEvents.length > 0 ? migrationEvents[migrationEvents.length - 1] : null;

  return (
    <section
      id="cluster"
      aria-label="Distributed cluster nodes visualization"
      className="space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Distributed Nodes &amp; Live Task Execution
          </h2>
          <p className="text-xs text-slate-400">
            4 independent compute nodes executing local queues with real-time load monitoring and dynamic task migration. Click any process block to inspect details.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono tabular-nums">
          Migrations recorded: {migrationEvents.length}
        </div>
      </div>

      {/* Animated Inter-Node Migration Topology Bus */}
      <div className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-4 shadow-lg shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Server className="h-4 w-4 text-violet-400" aria-hidden="true" />
            <span>Cluster Interconnect &amp; Migration Channel</span>
          </div>
          <div className="text-xs text-slate-400">
            {latestMigration ? (
              <span>
                Latest migration at tick {latestMigration.tick}:{' '}
                <strong className="font-mono text-violet-300">{latestMigration.pid}</strong>{' '}
                Node {latestMigration.fromNodeId} &rarr; Node {latestMigration.toNodeId}
              </span>
            ) : (
              <span>No task migrations triggered yet — cluster balanced</span>
            )}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 880 96"
            className="h-24 w-full min-w-[600px]"
            role="img"
            aria-label="Cluster interconnect topology and animated process migration paths"
          >
            {/* Base Cluster Bus */}
            <line
              x1="110"
              y1="42"
              x2="770"
              y2="42"
              stroke="rgba(139, 92, 246, 0.25)"
              strokeWidth="2"
            />

            {/* Animated Migration Curved Arrows */}
            {activeMigrations.map((mig, idx) => {
              const from = NODE_POSITIONS[mig.fromNodeId];
              const to = NODE_POSITIONS[mig.toNodeId];
              if (!from || !to) return null;
              const midX = (from.x + to.x) / 2;
              const arcLift = mig.fromNodeId < mig.toNodeId ? 10 : 78;
              const pathD = `M ${from.x} ${from.y} Q ${midX} ${arcLift} ${to.x} ${to.y}`;
              const labelY = mig.fromNodeId < mig.toNodeId ? 20 : 82;

              return (
                <g key={mig.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    className="animate-packet-flow"
                  />
                  <circle cx={to.x} cy={to.y} r="5" fill="#EC4899" />
                  <rect
                    x={midX - 36}
                    y={labelY - 10}
                    width="72"
                    height="18"
                    rx="4"
                    fill="#1E1B4B"
                    stroke="#8B5CF6"
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={labelY + 2}
                    textAnchor="middle"
                    className="fill-violet-200 font-mono text-[10px] font-semibold"
                  >
                    {mig.pid} N{mig.fromNodeId}&rarr;N{mig.toNodeId}
                  </text>
                  {idx === 0 && (
                    <circle r="4" fill="#38BDF8">
                      <animateMotion dur="1.1s" repeatCount="indefinite" path={pathD} />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Node Anchors on Bus */}
            {nodes.map((node) => {
              const pos = NODE_POSITIONS[node.id];
              const fill =
                node.status === 'Busy'
                  ? '#F59E0B'
                  : node.status === 'Online'
                    ? '#10B981'
                    : '#475569';
              return (
                <g key={node.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="16"
                    fill="#0B1124"
                    stroke={fill}
                    strokeWidth="2"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    className="fill-slate-100 font-mono text-[11px] font-semibold"
                  >
                    N{node.id}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 32}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {node.instantCpuLoad}% load
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4 Independent Computer Nodes Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {nodes.map((node) => {
          const runningProc = node.runningProcessId
            ? processMap.get(node.runningProcessId) ?? null
            : null;
          const queuedProcs = node.readyQueue
            .map((id) => processMap.get(id))
            .filter((p): p is ProcessItem => Boolean(p));
          const assignedCount = (runningProc ? 1 : 0) + queuedProcs.length;
          const availableMemory = Math.max(0, node.totalMemory - node.usedMemory);
          const memoryPercent = Math.round((node.usedMemory / node.totalMemory) * 100);
          const nodeCompletedCount = processes.filter(
            (p) => p.assignedNodeId === node.id && p.status === 'Completed'
          ).length;

          const statusStyles =
            node.status === 'Busy'
              ? 'text-amber-300'
              : node.status === 'Online'
                ? 'text-emerald-300'
                : 'text-slate-400';

          return (
            <article
              key={node.id}
              data-testid={`node-card-${node.id}`}
              className="flex flex-col justify-between rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30 transition-colors hover:border-violet-400/40"
            >
              <div>
                {/* Node Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-violet-300">
                      <Server className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{node.name}</h3>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Assigned: {assignedCount} · Done: {nodeCompletedCount}
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusStyles}`}>
                    {node.status === 'Busy' ? (
                      <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : node.status === 'Online' ? (
                      <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{node.status}</span>
                  </div>
                </div>

                {/* CPU Utilization & Available Memory Meters */}
                <div className="mt-3.5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                        <span>CPU Load</span>
                      </span>
                      <span
                        className="font-mono font-semibold tabular-nums text-slate-100"
                        data-testid={`node-${node.id}-cpu`}
                      >
                        {node.instantCpuLoad}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${node.instantCpuLoad}%`,
                          backgroundColor:
                            node.instantCpuLoad >= 80
                              ? '#F59E0B'
                              : node.instantCpuLoad > 0
                                ? '#8B5CF6'
                                : '#334155',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                        <span>Available Memory</span>
                      </span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {availableMemory} / {node.totalMemory} MB
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-sky-500/80 transition-all duration-300"
                        style={{ width: `${memoryPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Currently Executing Process */}
                <div className="mt-4 border-t border-slate-800/80 pt-3.5">
                  <div className="text-[11px] font-medium text-slate-400 mb-2">
                    Current Running Process
                  </div>

                  {runningProc ? (
                    <motion.button
                      key={runningProc.id}
                      layout
                      initial={{ opacity: 0.7, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      type="button"
                      onClick={() => onSelectProcess(runningProc)}
                      className="w-full rounded-lg bg-[#080d20] p-3 text-left ring-1 ring-violet-400/50 transition-colors hover:ring-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded px-1.5 font-mono text-xs font-bold text-white"
                            style={{ backgroundColor: runningProc.color }}
                          >
                            {runningProc.pid}
                          </span>
                          <span className="text-xs font-medium text-slate-200">
                            {runningProc.priority} · {runningProc.memoryRequired} MB
                          </span>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-sky-300">
                          {runningProc.executedTime}/{runningProc.burstTime}t
                        </span>
                      </div>

                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${Math.round(
                              (runningProc.executedTime / runningProc.burstTime) * 100
                            )}%`,
                            backgroundColor: runningProc.color,
                          }}
                        />
                      </div>
                    </motion.button>
                  ) : (
                    <div className="rounded-lg bg-[#080d20]/60 px-3 py-3 text-xs text-slate-500">
                      CPU idle — waiting for ready tasks
                    </div>
                  )}
                </div>
              </div>

              {/* Local Ready Queue */}
              <div className="mt-4 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-2">
                  <span>Node Ready Queue</span>
                  <span className="font-mono tabular-nums">{queuedProcs.length} queued</span>
                </div>

                {queuedProcs.length === 0 ? (
                  <div className="text-xs text-slate-500 py-1">Queue empty</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <AnimatePresence mode="popLayout">
                      {queuedProcs.map((proc) => (
                        <motion.button
                          key={proc.id}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          type="button"
                          onClick={() => onSelectProcess(proc)}
                          title={`Click to inspect ${proc.pid}`}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#080d20] px-2.5 py-1.5 text-xs font-mono text-slate-100 ring-1 ring-slate-700/80 transition-colors hover:ring-violet-400 cursor-pointer"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: proc.color }}
                          />
                          <span className="font-semibold">{proc.pid}</span>
                          <span className="text-[11px] text-slate-400">
                            {proc.remainingTime}t
                          </span>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Pending / Waiting Pool & Completed Processes Strip */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-4 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2.5">
            <span>Incoming &amp; Memory-Waiting Pool</span>
            <span className="font-mono tabular-nums text-slate-400">
              {waitingPool.length} pending
            </span>
          </div>
          {waitingPool.length === 0 ? (
            <p className="text-xs text-slate-500">
              All processes have been admitted to distributed node queues.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {waitingPool.map((proc) => (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => onSelectProcess(proc)}
                  className="inline-flex items-center gap-2 rounded-md bg-[#080d20] px-2.5 py-1.5 text-xs text-slate-200 ring-1 ring-slate-700/80 hover:ring-violet-400 cursor-pointer"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: proc.color }}
                  />
                  <span className="font-mono font-semibold">{proc.pid}</span>
                  <span className="text-slate-400 font-mono tabular-nums">
                    arr:{proc.arrivalTime} · {proc.burstTime}t · {proc.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-[#0d142b]/90 p-4 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-2.5">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>Completed Processes</span>
            </span>
            <span className="font-mono tabular-nums text-emerald-300">
              {completedProcesses.length} / {processes.length}
            </span>
          </div>
          {completedProcesses.length === 0 ? (
            <p className="text-xs text-slate-500">
              Completed processes will appear here with green completion indicators.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {completedProcesses.map((proc) => (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => onSelectProcess(proc)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-950/40 px-2.5 py-1.5 text-xs text-emerald-200 ring-1 ring-emerald-500/35 hover:ring-emerald-400 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="font-mono font-semibold">{proc.pid}</span>
                  <span className="text-emerald-300/80 font-mono tabular-nums">
                    N{proc.assignedNodeId} · TAT:{proc.turnaroundTime}t
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Migration Log */}
      {migrationEvents.length > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-4 shadow-lg shadow-black/30">
          <h3 className="text-xs font-semibold text-slate-200 mb-2">
            Recent Load-Balancing Migrations
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {migrationEvents.slice(-6).reverse().map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-[#080d20] px-3 py-2 text-xs"
              >
                <span className="flex items-center gap-1.5 font-mono text-violet-300 whitespace-nowrap">
                  <span>t={ev.tick}</span>
                  <span className="font-semibold text-white">{ev.pid}</span>
                  <span>N{ev.fromNodeId}</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  <span>N{ev.toNodeId}</span>
                </span>
                <span className="truncate text-slate-400" title={ev.reason}>
                  {ev.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
