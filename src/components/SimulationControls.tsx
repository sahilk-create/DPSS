import {
  ArrowRightLeft,
  Info,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SkipForward,
} from 'lucide-react';
import { ALGORITHM_INFO } from '../engine/scheduler';
import type { SchedulingAlgorithm, SimulationStatus } from '../engine/types';

interface SimulationControlsProps {
  status: SimulationStatus;
  algorithm: SchedulingAlgorithm;
  timeQuantum: number;
  speedMultiplier: number;
  autoLoadBalance: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onGenerateRandom: () => void;
  onRebalanceNow: () => void;
  onChangeAlgorithm: (alg: SchedulingAlgorithm) => void;
  onChangeQuantum: (q: number) => void;
  onChangeSpeed: (speed: number) => void;
  onToggleAutoLoadBalance: (enabled: boolean) => void;
}

const SPEED_OPTIONS = [0.5, 1, 2, 4];

export function SimulationControls({
  status,
  algorithm,
  timeQuantum,
  speedMultiplier,
  autoLoadBalance,
  onStart,
  onPause,
  onResume,
  onReset,
  onStepForward,
  onGenerateRandom,
  onRebalanceNow,
  onChangeAlgorithm,
  onChangeQuantum,
  onChangeSpeed,
  onToggleAutoLoadBalance,
}: SimulationControlsProps) {
  const algInfo = ALGORITHM_INFO[algorithm];
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isFinished = status === 'finished';

  return (
    <section
      aria-label="Simulation controls and scheduling policy"
      className="rounded-xl border border-violet-500/20 bg-[#0d142b]/90 p-5 shadow-lg shadow-black/30"
    >
      <div className="flex flex-col gap-5">
        {/* Primary Playback & Generation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onStart}
              disabled={isRunning || isPaused || isFinished}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Start Simulation</span>
            </button>

            <button
              type="button"
              onClick={onPause}
              disabled={!isRunning}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Pause Simulation</span>
            </button>

            <button
              type="button"
              onClick={onResume}
              disabled={!isPaused}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Resume Simulation</span>
            </button>

            <button
              type="button"
              onClick={onStepForward}
              disabled={isRunning || isFinished}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Step Forward</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Simulation</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onRebalanceNow}
              disabled={isFinished}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Rebalance Load</span>
            </button>

            <button
              type="button"
              onClick={onGenerateRandom}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Generate Random Processes</span>
            </button>
          </div>
        </div>

        {/* Algorithm, Quantum, Speed, Load Balancing Settings */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-800/80 pt-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="algorithm-select" className="text-xs font-medium text-slate-300">
              Scheduling Algorithm
            </label>
            <select
              id="algorithm-select"
              value={algorithm}
              onChange={(e) => onChangeAlgorithm(e.target.value as SchedulingAlgorithm)}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-[#080d20] px-3 py-2 text-sm text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="FCFS">First Come First Serve (FCFS)</option>
              <option value="SJF">Shortest Job First (SJF)</option>
              <option value="RR">Round Robin (RR)</option>
              <option value="PRIORITY">Priority Scheduling</option>
              <option value="LOAD_BALANCING">Load Balancing Scheduling</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="rr-quantum-input" className="text-xs font-medium text-slate-300">
              Round Robin Time Quantum (ticks)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="rr-quantum-input"
                type="number"
                min={1}
                max={12}
                value={timeQuantum}
                onChange={(e) =>
                  onChangeQuantum(Math.max(1, Math.min(12, Number(e.target.value) || 1)))
                }
                className="min-h-[40px] w-24 rounded-lg border border-slate-700 bg-[#080d20] px-3 py-2 text-sm font-mono tabular-nums text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
              <span className="text-xs text-slate-400">
                {algorithm === 'RR' ? 'Active in Round Robin' : 'Used when RR selected'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-300">
              Simulation Speed ({speedMultiplier}x)
            </span>
            <div
              role="group"
              aria-label="Simulation speed controller"
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d20] p-1"
            >
              {SPEED_OPTIONS.map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onChangeSpeed(spd)}
                  className={`flex-1 min-h-[32px] rounded-md px-2.5 py-1 text-xs font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                    speedMultiplier === spd
                      ? 'bg-violet-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-300">
              Overload Task Migration
            </span>
            <label className="flex min-h-[40px] cursor-pointer items-center justify-between rounded-lg border border-slate-700 bg-[#080d20] px-3 py-2">
              <span className="text-xs text-slate-200">
                {autoLoadBalance || algorithm === 'LOAD_BALANCING'
                  ? 'Auto-migration active'
                  : 'Auto-migration paused'}
              </span>
              <input
                type="checkbox"
                checked={algorithm === 'LOAD_BALANCING' ? true : autoLoadBalance}
                disabled={algorithm === 'LOAD_BALANCING'}
                onChange={(e) => onToggleAutoLoadBalance(e.target.checked)}
                className="h-4 w-4 accent-violet-500 cursor-pointer disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </div>

        {/* Clear Algorithm Explanation */}
        <div className="border-t border-slate-800/80 pt-3.5 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 lg:gap-6">
              <div>
                <span className="font-semibold text-white">{algInfo.name}: </span>
                <span className="text-slate-300">{algInfo.summary}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-200">Mechanism: </span>
                <span className="text-slate-400">{algInfo.mechanism}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-200">Best for / Trade-off: </span>
                <span className="text-slate-400">
                  {algInfo.bestFor} {algInfo.tradeoff}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
