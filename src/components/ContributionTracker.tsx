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
  const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr']; // Simplified as per image

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count < 5) return 'bg-emerald-200';
    if (count < 10) return 'bg-emerald-300';
    if (count < 15) return 'bg-emerald-500';
    if (count < 20) return 'bg-emerald-600';
    return 'bg-accent'; // Purple for high activity
  };

  return (
    <div className="flex flex-col gap-4 w-[450px]">
      {/* Top Banner */}
      <div className="bg-white border border-gray-100 rounded-[24px] p-6 flex items-center shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <div className="w-6 h-6 bg-accent rounded-md" />
          </div>
          <div>
            <div className="text-3xl font-black text-accent">{streak}</div>
            <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Day streak</div>
          </div>
        </div>
        
        <div className="w-px h-12 bg-gray-100 mx-6" />

        <div className="flex-[2] space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <Radio className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Nhiệm vụ hôm nay</span>
          </div>
          <p className="text-lg font-bold text-text-primary leading-tight">
            Ghi âm <span className="text-accent underline">25</span> câu trả lời nhé :)
          </p>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm space-y-4">
        <div className="flex justify-between pl-10 pr-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            {months.map(m => <span key={m}>{m}</span>)}
        </div>
        
        <div className="flex gap-3">
          <div className="flex flex-col justify-between py-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest h-[110px]">
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
                className={`w-3.5 h-3.5 rounded-sm ${getColor(day.count)} transition-colors`}
                title={`${day.iso}: ${day.count} recordings`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Đông</span>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-cyan-400 rounded-md" />
                    <span className="text-[10px] font-bold text-text-secondary truncate">x 0</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mr-1">Ít</span>
                <div className="w-2.5 h-2.5 bg-gray-100 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-emerald-200 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-emerald-300 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-emerald-600 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-accent rounded-sm" />
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Nhiều</span>
            </div>
        </div>
      </div>
    </div>
  );
};
