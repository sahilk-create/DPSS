import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { NewProcessInput, Priority, ProcessItem, ProcessStatus } from '../engine/types';

interface ProcessManagerProps {
  processes: ProcessItem[];
  onAddProcess: (input: NewProcessInput) => void;
  onDeleteProcess: (processId: string) => void;
  onSelectProcess: (proc: ProcessItem) => void;
}

type FilterTab = 'All' | ProcessStatus;

export function ProcessManager({
  processes,
  onAddProcess,
  onDeleteProcess,
  onSelectProcess,
}: ProcessManagerProps) {
  const nextPidSuggestion = `P${processes.length + 1}`;
  const [pid, setPid] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [burstTime, setBurstTime] = useState('5');
  const [arrivalTime, setArrivalTime] = useState('0');
  const [memoryRequired, setMemoryRequired] = useState('512');
  const [formError, setFormError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanedPid = (pid.trim() || nextPidSuggestion).toUpperCase();
    const burst = Number(burstTime);
    const arrival = Number(arrivalTime);
    const mem = Number(memoryRequired);

    if (!cleanedPid) {
      setFormError('Process ID (PID) is required.');
      return;
    }
    if (processes.some((p) => p.pid.toUpperCase() === cleanedPid)) {
      setFormError(`PID "${cleanedPid}" already exists. Choose a unique PID.`);
      return;
    }
    if (!Number.isFinite(burst) || burst < 1 || burst > 30) {
      setFormError('CPU burst time must be between 1 and 30 ticks.');
      return;
    }
    if (!Number.isFinite(arrival) || arrival < 0 || arrival > 100) {
      setFormError('Arrival time must be between 0 and 100.');
      return;
    }
    if (!Number.isFinite(mem) || mem < 64 || mem > 4096) {
      setFormError('Memory requirement must be between 64 and 4096 MB.');
      return;
    }

    setFormError(null);
    onAddProcess({
      pid: cleanedPid,
      priority,
      burstTime: burst,
      arrivalTime: arrival,
      memoryRequired: mem,
    });
    setPid('');
  };

  const filteredProcesses = processes.filter((p) => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.pid.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filterTabs: FilterTab[] = ['All', 'New', 'Ready', 'Running', 'Waiting', 'Completed'];

  return (
    <section
      id="processes"
      aria-label="Process management and queue table"
      className="grid grid-cols-1 gap-5 xl:grid-cols-12"
    >
      {/* Add New Process Form */}
      <div className="xl:col-span-4 rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30">
        <h2 className="text-lg font-semibold text-white">Add Process</h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Inject a custom process into the distributed cluster workload.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pid-input" className="block text-xs font-medium text-slate-300 mb-1">
                Process ID (PID)
              </label>
              <input
                id="pid-input"
                type="text"
                value={pid}
                placeholder={nextPidSuggestion}
                onChange={(e) => setPid(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-700 bg-[#080d20] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            <div>
              <label
                htmlFor="priority-select"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Priority
              </label>
              <select
                id="priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="min-h-[40px] w-full rounded-lg border border-slate-700 bg-[#080d20] px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="burst-input"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Burst (ticks)
              </label>
              <input
                id="burst-input"
                type="number"
                min={1}
                max={30}
                value={burstTime}
                onChange={(e) => setBurstTime(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-700 bg-[#080d20] px-3 py-2 text-sm font-mono tabular-nums text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            <div>
              <label
                htmlFor="arrival-input"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Arrival
              </label>
              <input
                id="arrival-input"
                type="number"
                min={0}
                max={100}
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-700 bg-[#080d20] px-3 py-2 text-sm font-mono tabular-nums text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            <div>
              <label
                htmlFor="memory-input"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Memory (MB)
              </label>
              <input
                id="memory-input"
                type="number"
                min={64}
                max={4096}
                step={64}
                value={memoryRequired}
                onChange={(e) => setMemoryRequired(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-700 bg-[#080d20] px-3 py-2 text-sm font-mono tabular-nums text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-rose-400">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Process</span>
          </button>
        </form>
      </div>

      {/* Dynamic Process Table */}
      <div className="xl:col-span-8 rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-semibold text-white">Process Control Table</h2>
            <p className="text-xs text-slate-400">
              Live status transitions across New, Ready, Running, Waiting, and Completed states.
            </p>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PID..."
              aria-label="Search processes by PID"
              className="min-h-[38px] w-44 rounded-lg border border-slate-700 bg-[#080d20] pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mt-3 flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#080d20] p-1">
          {filterTabs.map((tab) => {
            const count =
              tab === 'All'
                ? processes.length
                : processes.filter((p) => p.status === tab).length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`min-h-[32px] rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-3 font-medium">PID</th>
                <th className="py-2.5 px-2 font-medium">Priority</th>
                <th className="py-2.5 px-2 font-medium text-right">Arrival</th>
                <th className="py-2.5 px-2 font-medium text-right">Burst</th>
                <th className="py-2.5 px-2 font-medium text-right">Remaining</th>
                <th className="py-2.5 px-2 font-medium text-right">Memory</th>
                <th className="py-2.5 px-2 font-medium">Node</th>
                <th className="py-2.5 px-2 font-medium">Status</th>
                <th className="py-2.5 px-2 font-medium">Progress</th>
                <th className="py-2.5 pl-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No processes match the current filter.
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((proc) => {
                  const pct = Math.round((proc.executedTime / proc.burstTime) * 100);
                  const canDelete =
                    proc.status === 'New' ||
                    proc.status === 'Ready' ||
                    proc.status === 'Waiting';

                  return (
                    <tr
                      key={proc.id}
                      onClick={() => onSelectProcess(proc)}
                      className="transition-colors hover:bg-violet-950/20 cursor-pointer"
                    >
                      <td className="py-2.5 pr-3 font-mono font-semibold text-white">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm shrink-0"
                            style={{ backgroundColor: proc.color }}
                          />
                          <span>{proc.pid}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={
                            proc.priority === 'High'
                              ? 'text-rose-300 font-medium'
                              : proc.priority === 'Medium'
                                ? 'text-amber-300 font-medium'
                                : 'text-slate-300'
                          }
                        >
                          {proc.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-300">
                        {proc.arrivalTime}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-300">
                        {proc.burstTime}t
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-300">
                        {proc.remainingTime}t
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-300">
                        {proc.memoryRequired} MB
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-300">
                        {proc.assignedNodeId ? `Node ${proc.assignedNodeId}` : '—'}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            proc.status === 'Completed'
                              ? 'text-emerald-300'
                              : proc.status === 'Running'
                                ? 'text-sky-300'
                                : proc.status === 'Waiting'
                                  ? 'text-amber-300'
                                  : proc.status === 'Ready'
                                    ? 'text-violet-300'
                                    : 'text-slate-400'
                          }`}
                        >
                          {proc.status === 'Completed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : proc.status === 'Running' ? (
                            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{proc.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  proc.status === 'Completed' ? '#10B981' : proc.color,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[11px] tabular-nums text-slate-400">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td
                        className="py-2.5 pl-2 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectProcess(proc)}
                            aria-label={`Inspect ${proc.pid}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProcess(proc.id)}
                            disabled={!canDelete}
                            aria-label={`Delete ${proc.pid}`}
                            title={
                              canDelete
                                ? `Delete pending process ${proc.pid}`
                                : `Cannot delete ${proc.status} process`
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-950/60 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
