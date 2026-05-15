import React from 'react';
import { HelpCircle, X, CheckCircle2, Vote, Trophy, Info } from 'lucide-react';
import { useTranslation } from '../i18n/context';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">{t('help')}</h2>
              <p className="text-xs text-indigo-400 font-bold tracking-widest uppercase">{t('rules_title')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="font-black text-lg uppercase tracking-tight">{t('how_to_join')}</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed ml-8">
              {t('how_to_join_desc')}
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Vote className="w-5 h-5 text-indigo-500" />
              <h3 className="font-black text-lg uppercase tracking-tight">{t('how_to_vote')}</h3>
            </div>
            <div className="ml-8 space-y-3">
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('how_to_vote_desc')}
              </p>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300 uppercase">{t('rules_title')}</p>
                  <ul className="text-[11px] text-slate-500 font-medium space-y-1">
                    <li>• {t('rules_sets').replace('{sets}', '1, 2, 3, 4, 5, 6, 7, 8, 10, 12')}</li>
                    <li>• {t('rules_jokers').replace('{jokers}', '5')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="font-black text-lg uppercase tracking-tight">{t('how_to_view_results')}</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed ml-8">
              {t('how_to_view_results_desc')}
            </p>
          </section>
        </div>

        <div className="p-6 md:p-8 bg-slate-950/30 border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;
