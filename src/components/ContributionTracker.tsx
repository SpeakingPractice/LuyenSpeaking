import React from 'react';
import { Radio } from 'lucide-react';

interface ContributionTrackerProps {
  stats: Record<string, number>;
  streak: number;
}

export const ContributionTracker: React.FC<ContributionTrackerProps> = ({ stats, streak }) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const todayCount = stats[todayIso] || 0;

  return (
    <div className="flex flex-col gap-4 w-full lg:w-[480px]">
      {/* Top Banner */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 flex items-center shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 bg-accent rounded-lg" />
          </div>
          <div>
            <div className="text-[40px] font-black text-accent leading-none">{streak}</div>
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Day streak</div>
          </div>
        </div>
        
        <div className="w-px h-16 bg-gray-100 mx-8" />

        <div className="flex-[2.5] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-accent">
              <Radio className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">Nhiệm vụ hôm nay</span>
            </div>
            <span className="text-[10px] font-bold text-text-secondary bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">Mục tiêu: 30</span>
          </div>
          <p className="text-xl font-bold text-text-primary leading-tight">
            Nói được <span className="text-accent underline underline-offset-4 decoration-2">{todayCount}</span> câu rồi, Hang in there!
          </p>
        </div>
      </div>
    </div>
  );
};
