import type {
  AlgorithmComparisonResult,
  GanttSlice,
  MigrationEvent,
  NewProcessInput,
  NodeState,
  NodeStatus,
  Priority,
  ProcessItem,
  SchedulingAlgorithm,
  SimulationMetrics,
  SimulationState,
} from './types';

export const NODE_COUNT = 4;
export const NODE_TOTAL_MEMORY_MB = 4096;

export const PROCESS_COLORS = [
  '#8B5CF6', // Violet
  '#38BDF8', // Sky
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#A855F7', // Purple
  '#06B6D4', // Cyan
];

export const ALGORITHM_INFO: Record<
  SchedulingAlgorithm,
  {
    name: string;
    shortName: string;
    summary: string;
    mechanism: string;
    bestFor: string;
    tradeoff: string;
  }
> = {
  FCFS: {
    name: 'First Come First Serve (FCFS)',
    shortName: 'FCFS',
    summary:
      'Processes are dispatched strictly in the order they arrive in each node ready queue without preemption.',
    mechanism:
      'Incoming jobs are distributed across nodes in arrival order and queued FIFO. Each node executes the head of its queue until completion.',
    bestFor: 'Predictable batch workloads with uniform burst durations.',
    tradeoff: 'Susceptible to the convoy effect when long CPU bursts delay short tasks.',
  },
  SJF: {
    name: 'Shortest Job First (SJF)',
    shortName: 'SJF',
    summary:
      'Selects the ready process with the smallest remaining CPU burst time to minimize average waiting time.',
    mechanism:
      'When a node CPU becomes free, it scans its local ready queue and schedules the shortest burst task non-preemptively.',
    bestFor: 'Minimizing average waiting and turnaround times across mixed workloads.',
    tradeoff: 'Long-running processes can experience starvation if short jobs arrive continuously.',
  },
  RR: {
    name: 'Round Robin (RR)',
    shortName: 'Round Robin',
    summary:
      'Allocates a fixed time quantum to each ready process in cyclic order for responsive time-sharing.',
    mechanism:
      'Each node runs a process for up to Q ticks. If unfinished when Q expires, it is preempted and moved to the tail of the ready queue.',
    bestFor: 'Interactive distributed systems requiring fair CPU sharing and low response latency.',
    tradeoff: 'Higher context-switch frequency when quantum Q is set very small.',
  },
  PRIORITY: {
    name: 'Priority Scheduling',
    shortName: 'Priority',
    summary:
      'Schedules processes according to assigned priority tiers (High > Medium > Low), breaking ties by arrival time.',
    mechanism:
      'Each node selects the highest-priority task from its ready queue upon CPU availability.',
    bestFor: 'Real-time or SLA-critical workloads where high-priority tasks cannot wait behind background jobs.',
    tradeoff: 'Low-priority processes may wait longer unless paired with load balancing.',
  },
  LOAD_BALANCING: {
    name: 'Load Balancing Scheduling',
    shortName: 'Load Balancing',
    summary:
      'Actively routes incoming tasks to the least-loaded node and migrates queued processes away from overloaded nodes.',
    mechanism:
      'Monitors CPU utilization, queue depth, and free memory across all 4 nodes. Dispatches to the lightest node and migrates excess ready tasks dynamically.',
    bestFor: 'Preventing node hotspots and maximizing cluster-wide CPU utilization and throughput.',
    tradeoff: 'Task migration introduces state-transfer coordination across cluster nodes.',
  },
};

export function priorityWeight(priority: Priority): number {
  switch (priority) {
    case 'High':
      return 3;
    case 'Medium':
      return 2;
    case 'Low':
      return 1;
  }
}

export function createInitialNodes(): NodeState[] {
  return Array.from({ length: NODE_COUNT }, (_, idx) => ({
    id: idx + 1,
    name: `Node ${idx + 1}`,
    totalMemory: NODE_TOTAL_MEMORY_MB,
    usedMemory: 0,
    runningProcessId: null,
    readyQueue: [],
    waitingQueue: [],
    busyTicks: 0,
    totalTicks: 0,
    instantCpuLoad: 0,
    status: 'Idle' as NodeStatus,
  }));
}

export function createSampleProcesses(): ProcessItem[] {
  const seeds: Array<Omit<NewProcessInput, 'pid'> & { pid: string }> = [
    { pid: 'P1', priority: 'Low', burstTime: 9, arrivalTime: 0, memoryRequired: 768 },
    { pid: 'P2', priority: 'Medium', burstTime: 7, arrivalTime: 0, memoryRequired: 512 },
    { pid: 'P3', priority: 'Low', burstTime: 8, arrivalTime: 0, memoryRequired: 1024 },
    { pid: 'P4', priority: 'Medium', burstTime: 6, arrivalTime: 0, memoryRequired: 640 },
    { pid: 'P5', priority: 'High', burstTime: 2, arrivalTime: 0, memoryRequired: 384 },
    { pid: 'P6', priority: 'High', burstTime: 3, arrivalTime: 0, memoryRequired: 512 },
    { pid: 'P7', priority: 'Low', burstTime: 5, arrivalTime: 1, memoryRequired: 768 },
    { pid: 'P8', priority: 'High', burstTime: 2, arrivalTime: 1, memoryRequired: 384 },
  ];

  return seeds.map((seed, index) => createProcessItem(seed, index, 3));
}

export function createProcessItem(
  input: NewProcessInput,
  colorIndex: number,
  timeQuantum: number
): ProcessItem {
  return {
    id: `proc-${input.pid}-${colorIndex}-${Math.random().toString(36).slice(2, 7)}`,
    pid: input.pid.trim(),
    priority: input.priority,
    burstTime: Math.max(1, Math.round(input.burstTime)),
    remainingTime: Math.max(1, Math.round(input.burstTime)),
    arrivalTime: Math.max(0, Math.round(input.arrivalTime)),
    memoryRequired: Math.max(64, Math.min(NODE_TOTAL_MEMORY_MB, Math.round(input.memoryRequired))),
    status: 'New',
    assignedNodeId: null,
    startTime: null,
    completionTime: null,
    waitingTime: 0,
    turnaroundTime: null,
    executedTime: 0,
    quantumRemaining: timeQuantum,
    color: PROCESS_COLORS[colorIndex % PROCESS_COLORS.length],
    migrations: [],
  };
}

export function createInitialSimulationState(
  algorithm: SchedulingAlgorithm = 'LOAD_BALANCING',
  timeQuantum = 3,
  processes?: ProcessItem[]
): SimulationState {
  const initialProcesses = (processes ?? createSampleProcesses()).map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    status: 'New' as const,
    assignedNodeId: null,
    startTime: null,
    completionTime: null,
    waitingTime: 0,
    turnaroundTime: null,
    executedTime: 0,
    quantumRemaining: timeQuantum,
    migrations: [],
  }));

  return {
    currentTick: 0,
    status: 'idle',
    algorithm,
    timeQuantum,
    autoLoadBalance: algorithm === 'LOAD_BALANCING',
    processes: initialProcesses,
    nodes: createInitialNodes(),
    ganttSlices: [],
    migrationEvents: [],
    arrivalCounter: 0,
  };
}

export function computeNodeWorkScore(
  node: NodeState,
  processMap: Map<string, ProcessItem>
): number {
  let work = 0;
  if (node.runningProcessId) {
    const running = processMap.get(node.runningProcessId);
    if (running) work += running.remainingTime;
  }
  for (const pid of node.readyQueue) {
    const proc = processMap.get(pid);
    if (proc) work += proc.remainingTime;
  }
  return work;
}

export function computeNodeInstantLoad(
  node: NodeState,
  processMap: Map<string, ProcessItem>
): number {
  const activeCount = (node.runningProcessId ? 1 : 0) + node.readyQueue.length;
  if (activeCount === 0) return 0;

  const work = computeNodeWorkScore(node, processMap);
  const memoryRatio = node.usedMemory / node.totalMemory;
  const baseLoad = node.runningProcessId ? 58 : 25;
  const queuePenalty = Math.min(30, node.readyQueue.length * 12);
  const workBonus = Math.min(12, work * 1.1);
  const memBonus = Math.round(memoryRatio * 10);

  return Math.min(100, Math.round(baseLoad + queuePenalty + workBonus * 0.5 + memBonus * 0.4));
}

export function computeNodeStatus(node: NodeState): NodeStatus {
  if (!node.runningProcessId && node.readyQueue.length === 0) {
    return 'Idle';
  }
  if (node.instantCpuLoad >= 80 || node.readyQueue.length >= 2) {
    return 'Busy';
  }
  return 'Online';
}

export function refreshNodesTelemetry(
  nodes: NodeState[],
  processes: ProcessItem[]
): NodeState[] {
  const processMap = new Map(processes.map((p) => [p.id, p]));
  return nodes.map((node) => {
    const usedMemory = processes
      .filter(
        (p) =>
          p.assignedNodeId === node.id &&
          (p.status === 'Running' || p.status === 'Ready')
      )
      .reduce((acc, p) => acc + p.memoryRequired, 0);

    const updated: NodeState = {
      ...node,
      usedMemory,
    };
    updated.instantCpuLoad = computeNodeInstantLoad(updated, processMap);
    updated.status = computeNodeStatus(updated);
    return updated;
  });
}

function selectTargetNodeForArrival(
  proc: ProcessItem,
  nodes: NodeState[],
  processes: ProcessItem[],
  algorithm: SchedulingAlgorithm,
  arrivalCounter: number,
  autoLoadBalance: boolean
): NodeState | null {
  const eligible = nodes.filter(
    (n) => n.totalMemory - n.usedMemory >= proc.memoryRequired
  );
  if (eligible.length === 0) return null;

  const processMap = new Map(processes.map((p) => [p.id, p]));

  if (algorithm === 'LOAD_BALANCING' || autoLoadBalance) {
    // Least-loaded available node
    if (algorithm === 'LOAD_BALANCING') {
      const sorted = [...eligible].sort((a, b) => {
        const loadDiff = computeNodeWorkScore(a, processMap) - computeNodeWorkScore(b, processMap);
        if (loadDiff !== 0) return loadDiff;
        const countDiff =
          (a.runningProcessId ? 1 : 0) +
          a.readyQueue.length -
          ((b.runningProcessId ? 1 : 0) + b.readyQueue.length);
        if (countDiff !== 0) return countDiff;
        return a.usedMemory - b.usedMemory || a.id - b.id;
      });
      return sorted[0];
    }
  }

  // Non-load-balancing modes use deterministic round-robin placement (creating realistic uneven bursts when job lengths vary)
  const preferredId = (arrivalCounter % NODE_COUNT) + 1;
  const preferred = eligible.find((n) => n.id === preferredId);
  return preferred ?? eligible[0];
}

function pickNextProcessId(
  readyQueue: string[],
  processMap: Map<string, ProcessItem>,
  algorithm: SchedulingAlgorithm
): string | null {
  if (readyQueue.length === 0) return null;

  const candidates = readyQueue
    .map((id) => processMap.get(id))
    .filter((p): p is ProcessItem => Boolean(p));

  if (candidates.length === 0) return null;

  switch (algorithm) {
    case 'FCFS':
    case 'RR':
      // Maintain FIFO queue order (for FCFS also ensure earlier arrival first on tie)
      if (algorithm === 'FCFS') {
        candidates.sort(
          (a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid)
        );
      }
      return candidates[0].id;

    case 'SJF':
    case 'LOAD_BALANCING':
      candidates.sort(
        (a, b) =>
          a.remainingTime - b.remainingTime ||
          a.arrivalTime - b.arrivalTime ||
          a.pid.localeCompare(b.pid)
      );
      return candidates[0].id;

    case 'PRIORITY':
      candidates.sort(
        (a, b) =>
          priorityWeight(b.priority) - priorityWeight(a.priority) ||
          a.arrivalTime - b.arrivalTime ||
          a.pid.localeCompare(b.pid)
      );
      return candidates[0].id;
  }
}

export function performLoadBalancingPass(
  nodes: NodeState[],
  processes: ProcessItem[],
  currentTick: number,
  force = false
): {
  nodes: NodeState[];
  processes: ProcessItem[];
  migrations: MigrationEvent[];
} {
  let nextNodes = refreshNodesTelemetry(nodes, processes);
  const nextProcesses = processes.map((p) => ({
    ...p,
    migrations: [...p.migrations],
  }));
  const migrations: MigrationEvent[] = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    const processMap = new Map(nextProcesses.map((p) => [p.id, p]));
    const rankedByLoad = [...nextNodes].sort((a, b) => {
      const workDiff =
        computeNodeWorkScore(b, processMap) - computeNodeWorkScore(a, processMap);
      if (workDiff !== 0) return workDiff;
      return b.readyQueue.length - a.readyQueue.length;
    });

    const source = rankedByLoad[0];
    const sourceWork = computeNodeWorkScore(source, processMap);
    const sourceCount = (source.runningProcessId ? 1 : 0) + source.readyQueue.length;

    if (source.readyQueue.length === 0) break;

    const candidates = [...nextNodes]
      .filter((n) => n.id !== source.id)
      .sort((a, b) => {
        const workDiff =
          computeNodeWorkScore(a, processMap) - computeNodeWorkScore(b, processMap);
        if (workDiff !== 0) return workDiff;
        return a.usedMemory - b.usedMemory;
      });

    const target = candidates.find((cand) => {
      const targetWork = computeNodeWorkScore(cand, processMap);
      const targetCount = (cand.runningProcessId ? 1 : 0) + cand.readyQueue.length;
      const isIdleTarget = targetCount === 0 && sourceCount >= 2;
      const isQueueImbalanced = sourceCount - targetCount >= 2;
      const isWorkImbalanced = force
        ? isIdleTarget || isQueueImbalanced || (sourceWork - targetWork >= 5 && sourceCount >= 2)
        : isQueueImbalanced || (source.instantCpuLoad >= 80 && cand.instantCpuLoad <= 35 && sourceWork - targetWork >= 4);

      if (!isWorkImbalanced) return false;

      // Ensure at least one ready process fits in target memory, was not just migrated, and strictly improves balance
      return source.readyQueue.some((pid) => {
        const p = processMap.get(pid);
        if (!p) return false;
        const lastMig = p.migrations[p.migrations.length - 1];
        if (lastMig && currentTick - lastMig.tick <= 2) return false;
        const fitsMemory = cand.totalMemory - cand.usedMemory >= p.memoryRequired;
        const improvesBalance = targetWork + p.remainingTime <= sourceWork - 1;
        return fitsMemory && improvesBalance;
      });
    });

    if (!target) break;

    // Migrate a ready process from source that fits in target and improves balance without ping-ponging
    const targetWork = computeNodeWorkScore(target, processMap);
    const movableId = [...source.readyQueue].reverse().find((pid) => {
      const p = processMap.get(pid);
      if (!p) return false;
      const lastMig = p.migrations[p.migrations.length - 1];
      if (lastMig && currentTick - lastMig.tick <= 2) return false;
      return (
        target.totalMemory - target.usedMemory >= p.memoryRequired &&
        targetWork + p.remainingTime <= sourceWork - 1
      );
    });

    if (!movableId) break;

    const procIdx = nextProcesses.findIndex((p) => p.id === movableId);
    if (procIdx === -1) break;

    const beforeLoads = nextNodes.map((n) => n.instantCpuLoad);
    const proc = nextProcesses[procIdx];

    nextNodes = nextNodes.map((n) => {
      if (n.id === source.id) {
        return {
          ...n,
          readyQueue: n.readyQueue.filter((id) => id !== movableId),
        };
      }
      if (n.id === target.id) {
        return {
          ...n,
          readyQueue: [...n.readyQueue, movableId],
        };
      }
      return n;
    });

    const reason =
      source.instantCpuLoad >= 78
        ? `${source.name} overloaded (${source.instantCpuLoad}% load); migrated to ${target.name}`
        : `Queue imbalance (${sourceCount} vs ${(target.runningProcessId ? 1 : 0) + target.readyQueue.length} tasks)`;

    nextProcesses[procIdx] = {
      ...proc,
      assignedNodeId: target.id,
      migrations: [
        ...proc.migrations,
        {
          tick: currentTick,
          fromNodeId: source.id,
          toNodeId: target.id,
          reason,
        },
      ],
    };

    nextNodes = refreshNodesTelemetry(nextNodes, nextProcesses);
    const afterLoads = nextNodes.map((n) => n.instantCpuLoad);

    migrations.push({
      id: `mig-${currentTick}-${proc.pid}-${source.id}-${target.id}-${migrations.length}`,
      tick: currentTick,
      processId: proc.id,
      pid: proc.pid,
      fromNodeId: source.id,
      toNodeId: target.id,
      reason,
      beforeLoads,
      afterLoads,
    });
  }

  return {
    nodes: nextNodes,
    processes: nextProcesses,
    migrations,
  };
}

function appendGanttTick(
  slices: GanttSlice[],
  nodeId: number,
  proc: ProcessItem | null,
  tick: number
): GanttSlice[] {
  const processId = proc ? proc.id : null;
  const pid = proc ? proc.pid : 'IDLE';
  const color = proc ? proc.color : '#1E293B';
  const isIdle = proc === null;

  // Find last slice for this node
  let lastIdx = -1;
  for (let i = slices.length - 1; i >= 0; i--) {
    if (slices[i].nodeId === nodeId) {
      lastIdx = i;
      break;
    }
  }

  if (
    lastIdx !== -1 &&
    slices[lastIdx].processId === processId &&
    slices[lastIdx].endTime === tick
  ) {
    const updated = [...slices];
    updated[lastIdx] = {
      ...updated[lastIdx],
      endTime: tick + 1,
    };
    return updated;
  }

  return [
    ...slices,
    {
      id: `gantt-${nodeId}-${tick}-${pid}`,
      nodeId,
      processId,
      pid,
      startTime: tick,
      endTime: tick + 1,
      color,
      isIdle,
    },
  ];
}

export function isSimulationComplete(processes: ProcessItem[]): boolean {
  return processes.length > 0 && processes.every((p) => p.status === 'Completed');
}

export function stepSimulation(state: SimulationState): SimulationState {
  if (state.processes.length === 0 || isSimulationComplete(state.processes)) {
    return {
      ...state,
      status: state.processes.length > 0 ? 'finished' : 'idle',
    };
  }

  const tick = state.currentTick;
  let arrivalCounter = state.arrivalCounter;
  let nodes = state.nodes.map((n) => ({
    ...n,
    readyQueue: [...n.readyQueue],
    waitingQueue: [...n.waitingQueue],
  }));
  let processes = state.processes.map((p) => ({
    ...p,
    migrations: [...p.migrations],
  }));
  let ganttSlices = [...state.ganttSlices];
  const newMigrations: MigrationEvent[] = [];

  // 1. Admit newly arrived processes (New -> Ready or Waiting if no memory)
  const arriving = processes
    .filter((p) => p.status === 'New' && p.arrivalTime <= tick)
    .sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));

  for (const proc of arriving) {
    nodes = refreshNodesTelemetry(nodes, processes);
    const targetNode = selectTargetNodeForArrival(
      proc,
      nodes,
      processes,
      state.algorithm,
      arrivalCounter,
      state.autoLoadBalance
    );

    const idx = processes.findIndex((p) => p.id === proc.id);
    if (targetNode) {
      processes[idx] = {
        ...processes[idx],
        status: 'Ready',
        assignedNodeId: targetNode.id,
        quantumRemaining: state.timeQuantum,
      };
      nodes = nodes.map((n) =>
        n.id === targetNode.id
          ? { ...n, readyQueue: [...n.readyQueue, proc.id] }
          : n
      );
      arrivalCounter += 1;
    } else {
      processes[idx] = {
        ...processes[idx],
        status: 'Waiting',
        assignedNodeId: null,
      };
    }
  }

  // 2. Try to admit any previously Waiting processes if memory opened up
  const waitingProcs = processes.filter((p) => p.status === 'Waiting');
  for (const proc of waitingProcs) {
    nodes = refreshNodesTelemetry(nodes, processes);
    const targetNode = selectTargetNodeForArrival(
      proc,
      nodes,
      processes,
      state.algorithm,
      arrivalCounter,
      state.autoLoadBalance
    );
    if (targetNode) {
      const idx = processes.findIndex((p) => p.id === proc.id);
      processes[idx] = {
        ...processes[idx],
        status: 'Ready',
        assignedNodeId: targetNode.id,
        quantumRemaining: state.timeQuantum,
      };
      nodes = nodes.map((n) =>
        n.id === targetNode.id
          ? { ...n, readyQueue: [...n.readyQueue, proc.id] }
          : n
      );
      arrivalCounter += 1;
    }
  }

  // 3. Load balancing migration check (active in LOAD_BALANCING mode or when autoLoadBalance detects overload)
  if (state.algorithm === 'LOAD_BALANCING' || state.autoLoadBalance) {
    const lbResult = performLoadBalancingPass(
      nodes,
      processes,
      tick,
      state.algorithm === 'LOAD_BALANCING'
    );
    nodes = lbResult.nodes;
    processes = lbResult.processes;
    newMigrations.push(...lbResult.migrations);
  }

  // 4. Round Robin quantum expiry check & CPU dispatch on each node
  let processMap = new Map(processes.map((p) => [p.id, p]));

  nodes = nodes.map((node) => {
    let runningId = node.runningProcessId;
    let readyQueue = [...node.readyQueue];

    if (runningId && state.algorithm === 'RR') {
      const runningProc = processMap.get(runningId);
      if (runningProc && runningProc.quantumRemaining <= 0) {
        if (readyQueue.length > 0) {
          const idx = processes.findIndex((p) => p.id === runningId);
          if (idx !== -1) {
            processes[idx] = {
              ...processes[idx],
              status: 'Ready',
              quantumRemaining: state.timeQuantum,
            };
          }
          readyQueue.push(runningId);
          runningId = null;
        } else {
          const idx = processes.findIndex((p) => p.id === runningId);
          if (idx !== -1) {
            processes[idx] = {
              ...processes[idx],
              quantumRemaining: state.timeQuantum,
            };
          }
        }
      }
    }

    processMap = new Map(processes.map((p) => [p.id, p]));

    if (!runningId && readyQueue.length > 0) {
      const nextId = pickNextProcessId(readyQueue, processMap, state.algorithm);
      if (nextId) {
        readyQueue = readyQueue.filter((id) => id !== nextId);
        runningId = nextId;
        const idx = processes.findIndex((p) => p.id === nextId);
        if (idx !== -1) {
          processes[idx] = {
            ...processes[idx],
            status: 'Running',
            startTime: processes[idx].startTime ?? tick,
            quantumRemaining: state.timeQuantum,
          };
        }
      }
    }

    return {
      ...node,
      runningProcessId: runningId,
      readyQueue,
    };
  });

  // 5. Increment waitingTime for Ready and Waiting processes
  processes = processes.map((p) => {
    if (p.status === 'Ready' || p.status === 'Waiting') {
      return { ...p, waitingTime: p.waitingTime + 1 };
    }
    return p;
  });

  // 6. Execute 1 CPU tick on every node & update Gantt chart
  const runningMap = new Map(processes.map((p) => [p.id, p]));
  nodes = nodes.map((node) => {
    const proc = node.runningProcessId ? runningMap.get(node.runningProcessId) ?? null : null;
    ganttSlices = appendGanttTick(ganttSlices, node.id, proc, tick);

    if (proc) {
      const nextRemaining = Math.max(0, proc.remainingTime - 1);
      const nextExecuted = proc.executedTime + 1;
      const nextQuantum = proc.quantumRemaining - 1;
      const completed = nextRemaining === 0;

      const idx = processes.findIndex((p) => p.id === proc.id);
      if (idx !== -1) {
        const completionTime = completed ? tick + 1 : null;
        const turnaroundTime =
          completionTime !== null ? completionTime - proc.arrivalTime : null;
        processes[idx] = {
          ...processes[idx],
          remainingTime: nextRemaining,
          executedTime: nextExecuted,
          quantumRemaining: nextQuantum,
          status: completed ? 'Completed' : 'Running',
          completionTime,
          turnaroundTime,
          waitingTime:
            turnaroundTime !== null
              ? Math.max(0, turnaroundTime - proc.burstTime)
              : processes[idx].waitingTime,
        };
      }

      return {
        ...node,
        runningProcessId: completed ? null : proc.id,
        busyTicks: node.busyTicks + 1,
        totalTicks: node.totalTicks + 1,
      };
    }

    return {
      ...node,
      totalTicks: node.totalTicks + 1,
    };
  });

  nodes = refreshNodesTelemetry(nodes, processes);
  const done = isSimulationComplete(processes);

  return {
    ...state,
    currentTick: tick + 1,
    status: done ? 'finished' : state.status,
    processes,
    nodes,
    ganttSlices,
    migrationEvents: [...state.migrationEvents, ...newMigrations],
    arrivalCounter,
  };
}

export function calculateMetrics(state: SimulationState): SimulationMetrics {
  const totalProcesses = state.processes.length;
  const completed = state.processes.filter((p) => p.status === 'Completed');
  const activeProcesses = state.processes.filter(
    (p) => p.status === 'Running'
  ).length;
  const waitingProcesses = state.processes.filter(
    (p) => p.status === 'Waiting' || p.status === 'Ready' || p.status === 'New'
  ).length;

  const avgInstantLoad =
    state.nodes.reduce((acc, n) => acc + n.instantCpuLoad, 0) / NODE_COUNT;

  const totalBusyTicks = state.nodes.reduce((acc, n) => acc + n.busyTicks, 0);
  const totalCapacityTicks = state.currentTick * NODE_COUNT;
  const avgCpuUtilization =
    totalCapacityTicks > 0 ? (totalBusyTicks / totalCapacityTicks) * 100 : 0;

  const avgWaitingTime =
    completed.length > 0
      ? completed.reduce((acc, p) => acc + p.waitingTime, 0) / completed.length
      : state.processes.filter((p) => p.status !== 'New').length > 0
        ? state.processes
            .filter((p) => p.status !== 'New')
            .reduce((acc, p) => acc + p.waitingTime, 0) /
          state.processes.filter((p) => p.status !== 'New').length
        : 0;

  const avgTurnaroundTime =
    completed.length > 0
      ? completed.reduce((acc, p) => acc + (p.turnaroundTime ?? 0), 0) / completed.length
      : 0;

  const maxCompletion =
    completed.length > 0
      ? Math.max(...completed.map((p) => p.completionTime ?? 0))
      : state.currentTick;
  const minArrival =
    state.processes.length > 0
      ? Math.min(...state.processes.map((p) => p.arrivalTime))
      : 0;
  const makespan = completed.length > 0 ? Math.max(0, maxCompletion - minArrival) : state.currentTick;

  const elapsed = Math.max(1, state.currentTick);
  const throughput = state.currentTick > 0 ? completed.length / elapsed : 0;

  return {
    totalProcesses,
    activeProcesses,
    completedProcesses: completed.length,
    waitingProcesses,
    distributedNodes: NODE_COUNT,
    avgCpuUtilization: Number(avgCpuUtilization.toFixed(1)),
    systemLoad: Number(avgInstantLoad.toFixed(1)),
    avgWaitingTime: Number(avgWaitingTime.toFixed(2)),
    avgTurnaroundTime: Number(avgTurnaroundTime.toFixed(2)),
    throughput: Number(throughput.toFixed(3)),
    makespan,
  };
}

export function runFullSimulationPreview(
  processes: ProcessItem[],
  algorithm: SchedulingAlgorithm,
  timeQuantum: number,
  autoLoadBalance: boolean,
  maxTicks = 400
): SimulationState {
  let sim = createInitialSimulationState(algorithm, timeQuantum, processes);
  sim.autoLoadBalance = algorithm === 'LOAD_BALANCING' ? true : autoLoadBalance;
  sim.status = 'running';

  let guard = 0;
  while (!isSimulationComplete(sim.processes) && guard < maxTicks) {
    sim = stepSimulation(sim);
    guard += 1;
  }

  return sim;
}

export function compareAllAlgorithms(
  processes: ProcessItem[],
  timeQuantum: number
): AlgorithmComparisonResult[] {
  const algorithms: SchedulingAlgorithm[] = [
    'FCFS',
    'SJF',
    'RR',
    'PRIORITY',
    'LOAD_BALANCING',
  ];

  return algorithms.map((alg) => {
    const autoLB = alg === 'LOAD_BALANCING';
    const sim = runFullSimulationPreview(processes, alg, timeQuantum, autoLB);
    const metrics = calculateMetrics(sim);
    const nodeBusyRatios = sim.nodes.map((n) =>
      n.totalTicks > 0 ? (n.busyTicks / n.totalTicks) * 100 : 0
    );
    const mean =
      nodeBusyRatios.reduce((acc, v) => acc + v, 0) / nodeBusyRatios.length;
    const variance =
      nodeBusyRatios.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
      nodeBusyRatios.length;

    return {
      algorithm: alg,
      label: ALGORITHM_INFO[alg].shortName,
      avgWaitingTime: metrics.avgWaitingTime,
      avgTurnaroundTime: metrics.avgTurnaroundTime,
      throughput: metrics.throughput,
      cpuUtilization: metrics.avgCpuUtilization,
      makespan: metrics.makespan,
      migrationsCount: sim.migrationEvents.length,
      loadVariance: Number(Math.sqrt(variance).toFixed(1)),
    };
  });
}

export function generateRandomProcesses(
  existingCount: number,
  count = 4,
  baseArrival = 0,
  timeQuantum = 3
): ProcessItem[] {
  const priorities: Priority[] = ['High', 'Medium', 'Low'];
  const memChoices = [256, 384, 512, 640, 768, 1024];

  return Array.from({ length: count }, (_, idx) => {
    const pidNum = existingCount + idx + 1;
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const burstTime = Math.floor(Math.random() * 8) + 2; // 2..9
    const arrivalTime = baseArrival + Math.floor(Math.random() * 4);
    const memoryRequired = memChoices[Math.floor(Math.random() * memChoices.length)];

    return createProcessItem(
      {
        pid: `P${pidNum}`,
        priority,
        burstTime,
        arrivalTime,
        memoryRequired,
      },
      pidNum - 1,
      timeQuantum
    );
  });
}
