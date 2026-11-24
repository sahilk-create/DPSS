import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyticsSection } from './components/AnalyticsSection';
import { ClusterVisualization } from './components/ClusterVisualization';
import { ComparisonMode } from './components/ComparisonMode';
import { DashboardKpis } from './components/DashboardKpis';
import { GanttChart } from './components/GanttChart';
import { ProcessDetailsModal } from './components/ProcessDetailsModal';
import { ProcessManager } from './components/ProcessManager';
import { SimulationControls } from './components/SimulationControls';
import { TopBar } from './components/TopBar';
import {
  ALGORITHM_INFO,
  calculateMetrics,
  createInitialSimulationState,
  createProcessItem,
  generateRandomProcesses,
  isSimulationComplete,
  performLoadBalancingPass,
  refreshNodesTelemetry,
  stepSimulation,
} from './engine/scheduler';
import type {
  NewProcessInput,
  ProcessItem,
  SchedulingAlgorithm,
  SimulationState,
} from './engine/types';

export default function App() {
  const [simState, setSimState] = useState<SimulationState>(() =>
    createInitialSimulationState('LOAD_BALANCING', 3)
  );
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  const metrics = useMemo(() => calculateMetrics(simState), [simState]);

  const selectedProcess = useMemo(
    () => simState.processes.find((p) => p.id === selectedProcessId) ?? null,
    [simState.processes, selectedProcessId]
  );

  // Real-time simulation timer loop
  useEffect(() => {
    if (simState.status !== 'running') return;

    const intervalMs = Math.max(150, Math.round(750 / speedMultiplier));
    const timer = window.setInterval(() => {
      setSimState((prev) => {
        if (prev.status !== 'running') return prev;
        if (isSimulationComplete(prev.processes)) {
          return { ...prev, status: 'finished' };
        }
        return stepSimulation(prev);
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [simState.status, speedMultiplier]);

  const handleStart = useCallback(() => {
    setSimState((prev) => {
      if (prev.processes.length === 0 || isSimulationComplete(prev.processes)) {
        return prev;
      }
      return { ...prev, status: 'running' };
    });
  }, []);

  const handlePause = useCallback(() => {
    setSimState((prev) =>
      prev.status === 'running' ? { ...prev, status: 'paused' } : prev
    );
  }, []);

  const handleResume = useCallback(() => {
    setSimState((prev) =>
      prev.status === 'paused' ? { ...prev, status: 'running' } : prev
    );
  }, []);

  const handleStepForward = useCallback(() => {
    setSimState((prev) => {
      if (prev.processes.length === 0 || isSimulationComplete(prev.processes)) {
        return prev;
      }
      const stepped = stepSimulation({
        ...prev,
        status: prev.status === 'idle' ? 'paused' : prev.status,
      });
      return stepped;
    });
  }, []);

  const handleReset = useCallback(() => {
    setSimState((prev) =>
      createInitialSimulationState(
        prev.algorithm,
        prev.timeQuantum,
        prev.processes.length > 0 ? prev.processes : undefined
      )
    );
  }, []);

  const handleChangeAlgorithm = useCallback((alg: SchedulingAlgorithm) => {
    setSimState((prev) => ({
      ...prev,
      algorithm: alg,
      autoLoadBalance: alg === 'LOAD_BALANCING',
    }));
  }, []);

  const handleChangeQuantum = useCallback((q: number) => {
    setSimState((prev) => ({
      ...prev,
      timeQuantum: q,
    }));
  }, []);

  const handleToggleAutoLoadBalance = useCallback((enabled: boolean) => {
    setSimState((prev) => ({
      ...prev,
      autoLoadBalance: enabled,
    }));
  }, []);

  const handleRebalanceNow = useCallback(() => {
    setSimState((prev) => {
      const lb = performLoadBalancingPass(
        prev.nodes,
        prev.processes,
        prev.currentTick,
        true
      );
      if (lb.migrations.length === 0) return prev;
      return {
        ...prev,
        nodes: lb.nodes,
        processes: lb.processes,
        migrationEvents: [...prev.migrationEvents, ...lb.migrations],
      };
    });
  }, []);

  const handleGenerateRandom = useCallback(() => {
    setSimState((prev) => {
      const generated = generateRandomProcesses(
        prev.processes.length,
        4,
        prev.currentTick,
        prev.timeQuantum
      );
      const nextStatus = prev.status === 'finished' ? 'paused' : prev.status;
      return {
        ...prev,
        status: nextStatus,
        processes: [...prev.processes, ...generated],
      };
    });
  }, []);

  const handleAddProcess = useCallback((input: NewProcessInput) => {
    setSimState((prev) => {
      const item = createProcessItem(
        input,
        prev.processes.length,
        prev.timeQuantum
      );
      const nextStatus = prev.status === 'finished' ? 'paused' : prev.status;
      return {
        ...prev,
        status: nextStatus,
        processes: [...prev.processes, item],
      };
    });
  }, []);

  const handleDeleteProcess = useCallback((processId: string) => {
    setSimState((prev) => {
      const target = prev.processes.find((p) => p.id === processId);
      if (!target || target.status === 'Running' || target.status === 'Completed') {
        return prev;
      }
      const nextProcesses = prev.processes.filter((p) => p.id !== processId);
      const nextNodes = refreshNodesTelemetry(
        prev.nodes.map((node) => ({
          ...node,
          readyQueue: node.readyQueue.filter((id) => id !== processId),
        })),
        nextProcesses
      );

      return {
        ...prev,
        processes: nextProcesses,
        nodes: nextNodes,
      };
    });
    setSelectedProcessId((curr) => (curr === processId ? null : curr));
  }, []);

  const handleSelectProcess = useCallback((proc: ProcessItem) => {
    setSelectedProcessId(proc.id);
  }, []);

  return (
    <div id="top" className="min-h-screen flex flex-col">
      <TopBar onReset={handleReset} />

      <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardKpis
          metrics={metrics}
          currentTick={simState.currentTick}
          status={simState.status}
          algorithmName={ALGORITHM_INFO[simState.algorithm].name}
        />

        <SimulationControls
          status={simState.status}
          algorithm={simState.algorithm}
          timeQuantum={simState.timeQuantum}
          speedMultiplier={speedMultiplier}
          autoLoadBalance={simState.autoLoadBalance}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onReset={handleReset}
          onStepForward={handleStepForward}
          onGenerateRandom={handleGenerateRandom}
          onRebalanceNow={handleRebalanceNow}
          onChangeAlgorithm={handleChangeAlgorithm}
          onChangeQuantum={handleChangeQuantum}
          onChangeSpeed={setSpeedMultiplier}
          onToggleAutoLoadBalance={handleToggleAutoLoadBalance}
        />

        <ClusterVisualization
          nodes={simState.nodes}
          processes={simState.processes}
          migrationEvents={simState.migrationEvents}
          currentTick={simState.currentTick}
          onSelectProcess={handleSelectProcess}
        />

        <GanttChart
          currentTick={simState.currentTick}
          liveSlices={simState.ganttSlices}
          processes={simState.processes}
          algorithm={simState.algorithm}
          timeQuantum={simState.timeQuantum}
          autoLoadBalance={simState.autoLoadBalance}
          onSelectProcess={handleSelectProcess}
        />

        <ProcessManager
          processes={simState.processes}
          onAddProcess={handleAddProcess}
          onDeleteProcess={handleDeleteProcess}
          onSelectProcess={handleSelectProcess}
        />

        <AnalyticsSection
          nodes={simState.nodes}
          processes={simState.processes}
          metrics={metrics}
          migrationEvents={simState.migrationEvents}
          currentTick={simState.currentTick}
        />

        <ComparisonMode
          processes={simState.processes}
          timeQuantum={simState.timeQuantum}
          activeAlgorithm={simState.algorithm}
          onApplyAlgorithm={(alg) => {
            setSimState((prev) =>
              createInitialSimulationState(alg, prev.timeQuantum, prev.processes)
            );
          }}
        />
      </main>

      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500">
        Distributed Process Scheduling Simulator · Interactive Operating Systems Laboratory
      </footer>

      <ProcessDetailsModal
        process={selectedProcess}
        onClose={() => setSelectedProcessId(null)}
      />
    </div>
  );
}
