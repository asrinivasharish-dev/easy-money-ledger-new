import React from 'react';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from 'lucide-react';
import { DashboardSummary, TransactionType } from '../types';
import { formatINR } from '../utils/interestCalculator';

interface DashboardCardsProps {
  summary: DashboardSummary;
  selectedTypeFilter: TransactionType | null;
  onSelectTypeFilter: (type: TransactionType | null) => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  summary,
  selectedTypeFilter,
  onSelectTypeFilter,
}) => {
  return (
    <div className="space-y-3">
      {/* Primary Financial Overview Card (Material 3 Container) */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-950 text-white p-4 sm:p-5 shadow-sm border border-emerald-700/50">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-[11px] font-bold tracking-wider text-emerald-200 uppercase">
            Financial Balance Overview
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
            Local Ledger
          </span>
        </div>

        {/* Primary Receivable vs Payable Highlight */}
        <div className="grid grid-cols-2 gap-4 my-3.5">
          <div className="space-y-0.5">
            <span className="text-xs text-emerald-200/80 font-medium">Total Receivable</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 tracking-tight">
              {formatINR(summary.totalReceivable)}
            </div>
            <span className="text-[10px] text-emerald-300/70 block">Money to collect</span>
          </div>

          <div className="space-y-0.5 text-right">
            <span className="text-xs text-rose-200/80 font-medium">Total Payable</span>
            <div className="text-xl sm:text-2xl font-black text-rose-300 tracking-tight">
              {formatINR(summary.totalPayable)}
            </div>
            <span className="text-[10px] text-rose-300/70 block">Money to return</span>
          </div>
        </div>

        {/* 3 Secondary Metric Badges */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-2 px-1.5 border border-white/5">
            <span className="text-[10px] text-slate-300 block">Total Gave</span>
            <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">
              {formatINR(summary.totalMoneyGave)}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl py-2 px-1.5 border border-white/5">
            <span className="text-[10px] text-slate-300 block">Total Took</span>
            <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">
              {formatINR(summary.totalMoneyTook)}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl py-2 px-1.5 border border-white/5">
            <span className="text-[10px] text-amber-300 block">Total Interest</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300 block mt-0.5">
              {formatINR(summary.totalInterest)}
            </span>
          </div>
        </div>
      </div>

      {/* Two Main Requested Buttons: Money I Gave & Money I Took */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onSelectTypeFilter(selectedTypeFilter === 'GIVEN' ? null : 'GIVEN')}
          className={`relative flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-sm transition shadow-sm border ${
            selectedTypeFilter === 'GIVEN'
              ? 'bg-emerald-700 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/40'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${selectedTypeFilter === 'GIVEN' ? 'bg-white/20' : 'bg-emerald-200/70'}`}>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold leading-tight">Money I Gave</span>
            <span className="text-[10px] font-normal opacity-80">
              {selectedTypeFilter === 'GIVEN' ? 'Viewing Lent' : 'Tap to filter'}
            </span>
          </div>
        </button>

        <button
          onClick={() => onSelectTypeFilter(selectedTypeFilter === 'TAKEN' ? null : 'TAKEN')}
          className={`relative flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-sm transition shadow-sm border ${
            selectedTypeFilter === 'TAKEN'
              ? 'bg-rose-700 text-white border-rose-600 shadow-md ring-2 ring-rose-500/40'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${selectedTypeFilter === 'TAKEN' ? 'bg-white/20' : 'bg-rose-200/70'}`}>
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold leading-tight">Money I Took</span>
            <span className="text-[10px] font-normal opacity-80">
              {selectedTypeFilter === 'TAKEN' ? 'Viewing Borrowed' : 'Tap to filter'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
