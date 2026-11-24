import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMetrics,
  compareAllAlgorithms,
  createInitialSimulationState,
  createProcessItem,
  isSimulationComplete,
  performLoadBalancingPass,
  runFullSimulationPreview,
  stepSimulation,
} from './scheduler';

test('FCFS schedules processes to completion with exact waiting and turnaround times', () => {
  const p1 = createProcessItem(
    { pid: 'P1', priority: 'Medium', burstTime: 4, arrivalTime: 0, memoryRequired: 512 },
    0,
    2
  );
  const p2 = createProcessItem(
    { pid: 'P2', priority: 'Medium', burstTime: 3, arrivalTime: 0, memoryRequired: 512 },
    1,
    2
  );
  const sim = runFullSimulationPreview([p1, p2], 'FCFS', 2, false);
  assert.equal(isSimulationComplete(sim.processes), true);
  assert.equal(sim.currentTick, 4);

  const metrics = calculateMetrics(sim);
  assert.equal(metrics.completedProcesses, 2);
  assert.equal(metrics.avgWaitingTime, 0);
  assert.equal(metrics.avgTurnaroundTime, 3.5);
  assert.equal(metrics.makespan, 4);
});

test('SJF prioritizes shorter burst on the same node', () => {
  // 5 processes on 4 nodes with arrivalTime 0 -> Node 1 gets P1 (burst 8) and P5 (burst 2).
  // P1 runs first at t=0 if all arrive at 0? Wait: P1 arrives before P5 in array order,
  // so at t=0 P1 and P5 both arrive; pickNextProcessId picks P5 (burst 2) before P1 (burst 8)!
  const procs = [
    createProcessItem({ pid: 'P1', priority: 'Low', burstTime: 8, arrivalTime: 0, memoryRequired: 256 }, 0, 2),
    createProcessItem({ pid: 'P2', priority: 'Low', burstTime: 5, arrivalTime: 0, memoryRequired: 256 }, 1, 2),
    createProcessItem({ pid: 'P3', priority: 'Low', burstTime: 5, arrivalTime: 0, memoryRequired: 256 }, 2, 2),
    createProcessItem({ pid: 'P4', priority: 'Low', burstTime: 5, arrivalTime: 0, memoryRequired: 256 }, 3, 2),
    createProcessItem({ pid: 'P5', priority: 'Low', burstTime: 2, arrivalTime: 0, memoryRequired: 256 }, 4, 2),
  ];

  const sim = runFullSimulationPreview(procs, 'SJF', 2, false);
  const p5 = sim.processes.find((p) => p.pid === 'P5')!;
  const p1 = sim.processes.find((p) => p.pid === 'P1')!;
  assert.equal(p5.startTime, 0);
  assert.equal(p5.completionTime, 2);
  assert.equal(p1.startTime, 2);
  assert.equal(p1.completionTime, 10);
});

test('Round Robin preempts after configured time quantum', () => {
  // Put 5 processes at arrival 0 so Node 1 gets P1 (burst 5) and P5 (burst 3)
  const procs = [
    createProcessItem({ pid: 'P1', priority: 'Medium', burstTime: 5, arrivalTime: 0, memoryRequired: 256 }, 0, 2),
    createProcessItem({ pid: 'P2', priority: 'Medium', burstTime: 2, arrivalTime: 0, memoryRequired: 256 }, 1, 2),
    createProcessItem({ pid: 'P3', priority: 'Medium', burstTime: 2, arrivalTime: 0, memoryRequired: 256 }, 2, 2),
    createProcessItem({ pid: 'P4', priority: 'Medium', burstTime: 2, arrivalTime: 0, memoryRequired: 256 }, 3, 2),
    createProcessItem({ pid: 'P5', priority: 'Medium', burstTime: 3, arrivalTime: 0, memoryRequired: 256 }, 4, 2),
  ];

  const sim = runFullSimulationPreview(procs, 'RR', 2, false);
  const node1Slices = sim.ganttSlices.filter((s) => s.nodeId === 1 && !s.isIdle);
  // Expect P1 (0-2), P5 (2-4), P1 (4-6), P5 (6-7), P1 (7-8)
  assert.deepEqual(
    node1Slices.map((s) => ({ pid: s.pid, start: s.startTime, end: s.endTime })),
    [
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P5', start: 2, end: 4 },
      { pid: 'P1', start: 4, end: 6 },
      { pid: 'P5', start: 6, end: 7 },
      { pid: 'P1', start: 7, end: 8 },
    ]
  );
});

test('Priority scheduling executes High priority before Low priority', () => {
  const procs = [
    createProcessItem({ pid: 'P1', priority: 'Low', burstTime: 4, arrivalTime: 0, memoryRequired: 256 }, 0, 2),
    createProcessItem({ pid: 'P2', priority: 'Medium', burstTime: 3, arrivalTime: 0, memoryRequired: 256 }, 1, 2),
    createProcessItem({ pid: 'P3', priority: 'Medium', burstTime: 3, arrivalTime: 0, memoryRequired: 256 }, 2, 2),
    createProcessItem({ pid: 'P4', priority: 'Medium', burstTime: 3, arrivalTime: 0, memoryRequired: 256 }, 3, 2),
    createProcessItem({ pid: 'P5', priority: 'High', burstTime: 2, arrivalTime: 0, memoryRequired: 256 }, 4, 2),
  ];

  const sim = runFullSimulationPreview(procs, 'PRIORITY', 2, false);
  const p5 = sim.processes.find((p) => p.pid === 'P5')!;
  const p1 = sim.processes.find((p) => p.pid === 'P1')!;
  assert.equal(p5.startTime, 0);
  assert.equal(p5.completionTime, 2);
  assert.equal(p1.startTime, 2);
});

test('Load balancing migrates queued tasks from overloaded node to idle node', () => {
  const state = createInitialSimulationState('LOAD_BALANCING', 3);
  // Manually overload Node 1 with 1 running + 2 ready processes, leaving Node 2..4 empty
  const procs = [
    createProcessItem({ pid: 'P1', priority: 'Medium', burstTime: 8, arrivalTime: 0, memoryRequired: 512 }, 0, 3),
    createProcessItem({ pid: 'P2', priority: 'Medium', burstTime: 6, arrivalTime: 0, memoryRequired: 512 }, 1, 3),
    createProcessItem({ pid: 'P3', priority: 'Medium', burstTime: 5, arrivalTime: 0, memoryRequired: 512 }, 2, 3),
  ];
  procs[0].status = 'Running';
  procs[0].assignedNodeId = 1;
  procs[1].status = 'Ready';
  procs[1].assignedNodeId = 1;
  procs[2].status = 'Ready';
  procs[2].assignedNodeId = 1;

  state.processes = procs;
  state.nodes[0].runningProcessId = procs[0].id;
  state.nodes[0].readyQueue = [procs[1].id, procs[2].id];

  const result = performLoadBalancingPass(state.nodes, state.processes, 1, true);
  assert.ok(result.migrations.length >= 1, 'Expected at least one migration event');
  const migratedProc = result.processes.find((p) => p.id === result.migrations[0].processId)!;
  assert.notEqual(migratedProc.assignedNodeId, 1);
  assert.equal(result.migrations[0].fromNodeId, 1);
});

test('Memory constraint places excess process in Waiting until memory frees', () => {
  // Each node has 4096 MB; create 5 processes each requiring 4096 MB
  const procs = Array.from({ length: 5 }, (_, i) =>
    createProcessItem(
      { pid: `P${i + 1}`, priority: 'Medium', burstTime: 2, arrivalTime: 0, memoryRequired: 4096 },
      i,
      2
    )
  );
  let sim = createInitialSimulationState('FCFS', 2, procs);
  sim = stepSimulation(sim);

  const waiting = sim.processes.filter((p) => p.status === 'Waiting');
  assert.equal(waiting.length, 1);

  // Step 2 more ticks: first 4 complete, 5th runs and finishes
  sim = stepSimulation(sim);
  sim = stepSimulation(sim);
  sim = stepSimulation(sim);
  assert.equal(isSimulationComplete(sim.processes), true);
});

test('compareAllAlgorithms produces valid, distinct metrics without migration ping-pong', () => {
  const state = createInitialSimulationState();
  const results = compareAllAlgorithms(state.processes, 3);
  assert.equal(results.length, 5);
  for (const r of results) {
    assert.ok(r.makespan > 0);
    assert.ok(r.cpuUtilization > 0 && r.cpuUtilization <= 100);
    assert.ok(r.avgTurnaroundTime >= r.avgWaitingTime);
    assert.ok(r.migrationsCount <= 6, `Unexpected excessive migrations: ${r.migrationsCount}`);
  }
  const lb = results.find((r) => r.algorithm === 'LOAD_BALANCING')!;
  const fcfs = results.find((r) => r.algorithm === 'FCFS')!;
  assert.ok(lb.makespan <= fcfs.makespan);
});
