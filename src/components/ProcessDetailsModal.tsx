import { ArrowRight, CheckCircle2, Clock, Cpu, HardDrive, X } from 'lucide-react';
import type { ProcessItem } from '../engine/types';

interface ProcessDetailsModalProps {
  process: ProcessItem | null;
  onClose: () => void;
}

export function ProcessDetailsModal({ process, onClose }: ProcessDetailsModalProps) {
  if (!process) return null;

  const progress = Math.round((process.executedTime / process.burstTime) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="process-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-violet-500/30 bg-[#0d142b] p-6 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg font-mono text-sm font-bold text-white shadow-inner"
              style={{ backgroundColor: process.color }}
            >
              {process.pid}
            </span>
            <div>
              <h2 id="process-modal-title" className="text-lg font-semibold text-white">
                Process {process.pid} Inspection
              </h2>
              <p className="text-xs text-slate-400">
                Priority: {process.priority}
                <span aria-hidden="true" className="mx-2 text-slate-600">
                  ·
                </span>
                Status: {process.status}
                <span aria-hidden="true" className="mx-2 text-slate-600">
                  ·
                </span>
                Node: {process.assignedNodeId ? `Node ${process.assignedNodeId}` : 'Unassigned'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${process.pid} details`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Execution Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              {process.status === 'Completed' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <Cpu className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
              )}
              <span>Execution Progress</span>
            </span>
            <span className="font-mono tabular-nums">
              {process.executedTime} / {process.burstTime} ticks ({progress}%)
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${progress}%`,
                backgroundColor: process.status === 'Completed' ? '#10B981' : process.color,
              }}
            />
          </div>
        </div>

        {/* Numeric Telemetry Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-slate-800/90 py-4">
          <div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" /> Arrival Time
            </div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white">
              {process.arrivalTime}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">CPU Burst</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white">
              {process.burstTime} ticks
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Remaining</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white">
              {process.remainingTime} ticks
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <HardDrive className="h-3 w-3" aria-hidden="true" /> Memory
            </div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white">
              {process.memoryRequired} MB
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Start Time</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white">
              {process.startTime !== null ? process.startTime : '—'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Completion Time</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white">
              {process.completionTime !== null ? process.completionTime : '—'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Waiting Time</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-amber-300">
              {process.waitingTime} ticks
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Turnaround Time</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-emerald-300">
              {process.turnaroundTime !== null ? `${process.turnaroundTime} ticks` : '—'}
            </div>
          </div>
        </div>

        {/* Migration History */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-slate-200">
            Load-Balancing Migration History ({process.migrations.length})
          </h3>
          {process.migrations.length === 0 ? (
            <p className="mt-1.5 text-xs text-slate-500">
              No inter-node migrations recorded for this process.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {process.migrations.map((mig, i) => (
                <li
                  key={`${mig.tick}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#080d20] px-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-1.5 font-mono text-violet-300">
                    <span>Tick {mig.tick}:</span>
                    <span>Node {mig.fromNodeId}</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    <span>Node {mig.toNodeId}</span>
                  </span>
                  <span className="text-slate-400 truncate">{mig.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
