import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Vote } from '../types';
import { useTranslation } from '../i18n/context';

interface MobileVotingCardProps {
  country: string;
  currentVote: Vote | null;
  pointScale: number[];
  onCastVote: (country: string, score: number, type: 'mandatory' | 'joker') => void;
  votingRules: { sets: number; mandatorySlots: number; jokerSlots: number };
  usageCount: (score: number) => number;
  jokerSlotsAvailable: boolean;
  votingLocked?: boolean;
}

export default function MobileVotingCard({
  country,
  currentVote,
  pointScale,
  onCastVote,
  votingRules,
  usageCount,
  jokerSlotsAvailable,
  votingLocked = false
}: MobileVotingCardProps) {
  const { t } = useTranslation();
  const isJokerMode = currentVote?.type === 'joker';

  return (
    <div className="bg-slate-900/60 rounded-3xl p-5 border border-white/5 space-y-5 shadow-xl">
      <div className="flex items-center justify-between">
        <h4 className="font-black text-xl tracking-tight uppercase text-white">{country}</h4>
        {currentVote && currentVote.value > 0 && (
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 ${isJokerMode ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'}`}>
              {isJokerMode && <Star className="w-3 h-3 fill-amber-500" />}
              {currentVote.value} {t('pts')}
            </div>
            {!votingLocked && (
              <button 
                onClick={() => onCastVote(country, 0, 'mandatory')}
                className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('mandatory_points')}</label>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {pointScale.map(pt => {
            const count = usageCount(pt);
            const isSelected = !isJokerMode && currentVote?.value === pt;
            const isFullyUsed = count >= votingRules.sets;
            
            return (
              <button
                key={pt}
                onClick={() => onCastVote(country, pt, 'mandatory')}
                disabled={votingLocked}
                className={`
                  h-11 rounded-xl text-sm font-black transition-all relative overflow-hidden
                  ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-white/20' : 
                    (isFullyUsed && !isSelected) ? 'bg-slate-800/30 text-slate-700 opacity-20 cursor-not-allowed' : 
                    votingLocked ? 'bg-slate-800/30 text-slate-700 cursor-not-allowed' :
                    'bg-slate-800/60 active:bg-indigo-500/30 text-slate-400 border border-white/5'}
                `}
              >
                {pt}
                {votingRules.sets > 1 && !isSelected && !isFullyUsed && !votingLocked && (
                  <span className="absolute top-0 right-0 bg-slate-700 text-[7px] w-3 h-3 rounded-bl-lg flex items-center justify-center border-l border-b border-white/10 opacity-50">
                    {votingRules.sets - count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {votingRules.jokerSlots > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest flex items-center gap-2">
              <Star className="w-3 h-3 fill-amber-500/50" /> {t('joker_point')}
            </label>
            {!isJokerMode && !jokerSlotsAvailable && !votingLocked && (
              <span className="text-[8px] text-slate-600 font-bold uppercase">{t('no_slots_left')}</span>
            )}
            {votingLocked && <span className="text-[8px] text-red-500 font-bold uppercase">{t('locked_badge')}</span>}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {pointScale.map(pt => (
              <button
                key={`joker-${pt}`}
                onClick={() => onCastVote(country, pt, 'joker')}
                disabled={votingLocked || (!isJokerMode && !jokerSlotsAvailable)}
                className={`
                  h-11 rounded-xl text-sm font-black transition-all border
                  ${isJokerMode && currentVote?.value === pt ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-lg shadow-amber-500/10' : 
                    (!isJokerMode && !jokerSlotsAvailable) ? 'bg-slate-800/10 text-slate-800 border-transparent opacity-20' :
                    votingLocked ? 'bg-slate-800/10 text-slate-800 border-transparent cursor-not-allowed' :
                    'bg-slate-800/60 border-white/5 text-slate-500 active:bg-amber-500/20'}
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
