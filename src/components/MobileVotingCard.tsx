import React from 'react';
import { Star } from 'lucide-react';
import { Vote } from '../types';

interface MobileVotingCardProps {
  country: string;
  currentVote: Vote | null;
  pointScale: number[];
  onCastVote: (country: string, score: number, type: 'mandatory' | 'joker') => void;
  votingRules: { sets: number; mandatorySlots: number; jokerSlots: number };
  usageCount: (score: number) => number;
  jokerSlotsAvailable: boolean;
}

export default function MobileVotingCard({
  country,
  currentVote,
  pointScale,
  onCastVote,
  votingRules,
  usageCount,
  jokerSlotsAvailable
}: MobileVotingCardProps) {
  const isJokerMode = currentVote?.type === 'joker';

  return (
    <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 space-y-4">
      <h4 className="font-black text-lg tracking-tight uppercase">{country}</h4>
      
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mandatory Points</label>
        <div className="grid grid-cols-5 gap-2">
          {pointScale.map(pt => {
            const count = usageCount(pt);
            const isSelected = !isJokerMode && currentVote?.value === pt;
            const isFullyUsed = count >= votingRules.sets;
            
            return (
              <button
                key={pt}
                onClick={() => onCastVote(country, pt, 'mandatory')}
                className={`
                  h-10 rounded-xl text-sm font-black transition-all
                  ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 
                    (isFullyUsed && !isSelected) ? 'bg-slate-800/30 text-slate-700 opacity-20' : 
                    'bg-slate-800/60 hover:bg-indigo-500/20 text-slate-400 border border-white/5'}
                `}
              >
                {pt}
              </button>
            );
          })}
        </div>
      </div>

      {votingRules.jokerSlots > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Star className="w-3 h-3" /> Joker
          </label>
          <div className="grid grid-cols-5 gap-2">
            {pointScale.map(pt => (
              <button
                key={`joker-${pt}`}
                onClick={() => onCastVote(country, pt, 'joker')}
                className={`
                  h-10 rounded-xl text-sm font-black transition-all border
                  ${isJokerMode && currentVote?.value === pt ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-slate-800/60 border-white/5 text-slate-500'}
                `}
              >
                {pt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
