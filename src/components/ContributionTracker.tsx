import React from 'react';
import { motion } from 'motion/react';
import { Radio, Square } from 'lucide-react';

interface ContributionTrackerProps {
  stats: Record<string, number>;
  streak: number;
}

export const ContributionTracker: React.FC<ContributionTrackerProps> = ({ stats, streak }) => {
  // Generate heatmap data for the last 18 weeks (approx matching the image)
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    // Start from the beginning of a week 18 weeks ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - (18 * 7));
    // Adjust to Monday (or Sunday) to align columns
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek + 1);

    for (let i = 0; i < 18 * 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        data.push({
            date: d,
            iso,
            count: stats[iso] || 0
        });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();
  const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 5) return 'bg-[#A7F3D0]'; // Light green (Emerald 200)
    if (count <= 10) return 'bg-[#059669]'; // Dark green (Emerald 600)
    return 'bg-accent'; // Purple (11+)
  };

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
          <div className="flex items-center gap-2 text-accent">
            <Radio className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Nhiệm vụ hôm nay</span>
          </div>
          <p className="text-xl font-bold text-text-primary leading-tight">
            Ghi âm <span className="text-accent underline underline-offset-4 decoration-2">{Math.max(0, 25 - todayCount)}</span> câu trả lời nhé :)
          </p>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm space-y-6">
        <div className="flex justify-between pl-12 pr-6 text-[11px] font-bold text-text-secondary uppercase tracking-[0.15em]">
            {months.map(m => <span key={m}>{m}</span>)}
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col justify-between py-2 text-[11px] font-bold text-text-secondary uppercase tracking-widest h-[120px]">
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 flex-1">
            {heatmapData.map((day, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.001 }}
                className={`w-4 h-4 rounded-sm ${getColor(day.count)} transition-colors`}
                title={`${day.iso}: ${day.count} recordings`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Đông</span>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-50 rounded-lg">
                    <div className="w-4 h-4 bg-cyan-400 rounded-md" />
                    <span className="text-[11px] font-black text-cyan-600">x 0</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mr-1">Ít</span>
                <div className="w-3 h-3 bg-gray-100 rounded-[2px]" />
                <div className="w-3 h-3 bg-[#A7F3D0] rounded-[2px]" title="1-5 sentences" />
                <div className="w-3 h-3 bg-[#059669] rounded-[2px]" title="6-10 sentences" />
                <div className="w-3 h-3 bg-accent rounded-[2px]" title="11+ sentences" />
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Nhiều</span>
            </div>
        </div>
      </div>
    </div>
  );
};
