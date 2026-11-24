import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { ALGORITHM_INFO, runFullSimulationPreview } from '../engine/scheduler';
import type {
  GanttSlice,
  ProcessItem,
  SchedulingAlgorithm,
} from '../engine/types';

interface GanttChartProps {
  currentTick: number;
  liveSlices: GanttSlice[];
  processes: ProcessItem[];
  algorithm: SchedulingAlgorithm;
  timeQuantum: number;
  autoLoadBalance: boolean;
  onSelectProcess: (proc: ProcessItem) => void;
}

export function GanttChart({
  currentTick,
  liveSlices,
  processes,
  algorithm,
  timeQuantum,
  autoLoadBalance,
  onSelectProcess,
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<'auto' | 'projected'>('auto');

  const projectedSim = useMemo(() => {
    if (processes.length === 0) return null;
    return runFullSimulationPreview(
      processes,
      algorithm,
      timeQuantum,
      autoLoadBalance
    );
  }, [processes, algorithm, timeQuantum, autoLoadBalance]);

  const showingLive = currentTick > 0 && viewMode === 'auto';
  const slices = showingLive ? liveSlices : projectedSim?.ganttSlices ?? [];
  const maxEnd = Math.max(
    1,
    showingLive ? currentTick : projectedSim?.currentTick ?? 1,
    ...slices.map((s) => s.endTime)
  );

  const processMap = new Map(processes.map((p) => [p.id, p]));
  const tickWidth = Math.max(26, Math.min(44, Math.floor(920 / Math.max(10, maxEnd))));
  const totalWidth = maxEnd * tickWidth;
  const ticks = Array.from({ length: maxEnd + 1 }, (_, i) => i);

  return (
    <section
      id="gantt"
      aria-label="Dynamic distributed Gantt chart"
      className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <CalendarClock className="h-5 w-5 text-violet-400" aria-hidden="true" />
            <span>Dynamic Node-Wise Gantt Chart</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {showingLive
              ? `Live execution timeline (Tick 0 to ${currentTick}) under ${ALGORITHM_INFO[algorithm].name}.`
              : `Projected execution schedule under ${ALGORITHM_INFO[algorithm].name}${
                  algorithm === 'RR' ? ` (Quantum Q=${timeQuantum})` : ''
                }. Updates immediately when algorithm or workload changes.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentTick > 0 && (
            <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d20] p-1">
              <button
                type="button"
                onClick={() => setViewMode('auto')}
                className={`min-h-[32px] rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'auto'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Live Timeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode('projected')}
                className={`min-h-[32px] rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'projected'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Full Projected ({ALGORITHM_INFO[algorithm].shortName})
              </button>
            </div>
          )}
        </div>
      </div>

      {processes.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          Add or generate processes to render the distributed Gantt timeline.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto pb-2" data-testid="gantt-timeline">
          <div style={{ width: `${totalWidth + 110}px` }} className="min-w-full">
            {[1, 2, 3, 4].map((nodeId) => {
              const nodeSlices = slices.filter((s) => s.nodeId === nodeId);
              return (
                <div
                  key={nodeId}
                  className="flex items-center border-b border-slate-800/70 py-2.5"
                >
                  <div className="w-[100px] shrink-0 pr-3 text-xs font-semibold text-slate-200 font-mono">
                    Node {nodeId}
                  </div>
                  <div
                    className="relative h-10 rounded-md bg-[#080d20]/80"
                    style={{ width: `${totalWidth}px` }}
                  >
                    {nodeSlices.map((slice) => {
                      const left = slice.startTime * tickWidth;
                      const width = Math.max(12, (slice.endTime - slice.startTime) * tickWidth);
                      const duration = slice.endTime - slice.startTime;
                      const proc = slice.processId ? processMap.get(slice.processId) : undefined;

                      if (slice.isIdle) {
                        return (
                          <div
                            key={slice.id}
                            title={`Node ${nodeId} IDLE (${slice.startTime} → ${slice.endTime}, ${duration}t)`}
                            style={{ left: `${left}px`, width: `${width}px` }}
                            className="gantt-idle-pattern absolute top-1 bottom-1 flex items-center justify-center rounded border border-slate-800/80 text-[10px] font-mono text-slate-500"
                          >
                            {width >= 36 ? 'IDLE' : ''}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slice.id}
                          type="button"
                          onClick={() => proc && onSelectProcess(proc)}
                          title={`${slice.pid}: Start ${slice.startTime}, End ${slice.endTime}, Duration ${duration} ticks`}
                          style={{
                            left: `${left}px`,
                            width: `${width - 2}px`,
                            backgroundColor: slice.color,
                          }}
                          className="absolute top-1 bottom-1 flex flex-col items-center justify-center overflow-hidden rounded px-1 text-white shadow-sm transition-transform hover:z-10 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                        >
                          <span className="font-mono text-[11px] font-bold leading-none">
                            {slice.pid}
                          </span>
                          {width >= 44 && (
                            <span className="mt-0.5 font-mono text-[9px] leading-none text-white/90 tabular-nums">
                              {slice.startTime}-{slice.endTime}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Time Ruler */}
            <div className="flex items-center pt-2">
              <div className="w-[100px] shrink-0 pr-3 text-[11px] font-mono text-slate-500">
                Time (ticks)
              </div>
              <div className="relative h-5" style={{ width: `${totalWidth}px` }}>
                {ticks.map((t) => {
                  const showLabel = maxEnd <= 25 || t % 2 === 0 || t === maxEnd;
                  return (
                    <div
                      key={t}
                      style={{ left: `${t * tickWidth}px` }}
                      className="absolute top-0 flex flex-col items-start"
                    >
                      <span className="h-1.5 w-px bg-slate-700" />
                      {showLabel && (
                        <span className="mt-0.5 -translate-x-1/2 font-mono text-[10px] tabular-nums text-slate-400">
                          {t}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
