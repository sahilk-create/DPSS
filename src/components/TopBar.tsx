import { Cpu, RotateCcw } from 'lucide-react';

interface TopBarProps {
  onReset: () => void;
}

export function TopBar({ onReset }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-violet-500/15 bg-[#070b1d]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 sm:gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="flex min-w-0 items-center gap-2.5 text-sm sm:text-base font-semibold tracking-tight text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-md"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30">
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="truncate">Distributed Process Scheduling Simulator</span>
        </a>

        <nav
          aria-label="Primary sections"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300"
        >
          <a
            href="#cluster"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400"
          >
            Cluster
          </a>
          <a
            href="#gantt"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400"
          >
            Gantt
          </a>
          <a
            href="#processes"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400"
          >
            Processes
          </a>
          <a
            href="#analytics"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400"
          >
            Analytics
          </a>
          <a
            href="#comparison"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400"
          >
            Comparison
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-950/50 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Lab</span>
          </button>
        </div>
      </div>
    </header>
  );
}
