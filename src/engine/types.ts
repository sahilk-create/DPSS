export type Priority = 'High' | 'Medium' | 'Low';

export type ProcessStatus = 'New' | 'Ready' | 'Running' | 'Waiting' | 'Completed';

export type SchedulingAlgorithm =
  | 'FCFS'
  | 'SJF'
  | 'RR'
  | 'PRIORITY'
  | 'LOAD_BALANCING';

export type NodeStatus = 'Idle' | 'Online' | 'Busy';

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface MigrationRecord {
  tick: number;
  fromNodeId: number;
  toNodeId: number;
  reason: string;
}

export interface ProcessItem {
  id: string;
  pid: string;
  priority: Priority;
  burstTime: number;
  remainingTime: number;
  arrivalTime: number;
  memoryRequired: number;
  status: ProcessStatus;
  assignedNodeId: number | null;
  startTime: number | null;
  completionTime: number | null;
  waitingTime: number;
  turnaroundTime: number | null;
  executedTime: number;
  quantumRemaining: number;
  color: string;
  migrations: MigrationRecord[];
}

export interface NewProcessInput {
  pid: string;
  priority: Priority;
  burstTime: number;
  arrivalTime: number;
  memoryRequired: number;
}

export interface NodeState {
  id: number;
  name: string;
  totalMemory: number;
  usedMemory: number;
  runningProcessId: string | null;
  readyQueue: string[];
  waitingQueue: string[];
  busyTicks: number;
  totalTicks: number;
  instantCpuLoad: number;
  status: NodeStatus;
}

export interface GanttSlice {
  id: string;
  nodeId: number;
  processId: string | null;
  pid: string;
  startTime: number;
  endTime: number;
  color: string;
  isIdle: boolean;
}

export interface MigrationEvent {
  id: string;
  tick: number;
  processId: string;
  pid: string;
  fromNodeId: number;
  toNodeId: number;
  reason: string;
  beforeLoads: number[];
  afterLoads: number[];
}

export interface SimulationMetrics {
  totalProcesses: number;
  activeProcesses: number;
  completedProcesses: number;
  waitingProcesses: number;
  distributedNodes: number;
  avgCpuUtilization: number;
  systemLoad: number;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  throughput: number;
  makespan: number;
}

export interface SimulationState {
  currentTick: number;
  status: SimulationStatus;
  algorithm: SchedulingAlgorithm;
  timeQuantum: number;
  autoLoadBalance: boolean;
  processes: ProcessItem[];
  nodes: NodeState[];
  ganttSlices: GanttSlice[];
  migrationEvents: MigrationEvent[];
  arrivalCounter: number;
}

export interface AlgorithmComparisonResult {
  algorithm: SchedulingAlgorithm;
  label: string;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  throughput: number;
  cpuUtilization: number;
  makespan: number;
  migrationsCount: number;
  loadVariance: number;
}
