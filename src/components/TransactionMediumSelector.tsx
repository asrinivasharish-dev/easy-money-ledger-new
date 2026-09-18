import React from 'react';
import { Hash } from 'lucide-react';
import { TransactionMedium } from '../types';
import { TRANSACTION_MEDIUMS, getMediumConfig } from '../utils/mediumUtils';

interface TransactionMediumSelectorProps {
  selectedMedium: TransactionMedium;
  onSelectMedium: (medium: TransactionMedium) => void;
  transactionRef: string;
  onChangeTransactionRef: (ref: string) => void;
  label?: string;
  showReferenceInput?: boolean;
}

export const TransactionMediumSelector: React.FC<TransactionMediumSelectorProps> = ({
  selectedMedium,
  onSelectMedium,
  transactionRef,
  onChangeTransactionRef,
  label = 'Medium of Transaction',
  showReferenceInput = true,
}) => {
  const currentConfig = getMediumConfig(selectedMedium);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 block">
          {label} <span className="text-rose-500">*</span>
        </label>
        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          {currentConfig.label}
        </span>
      </div>

      {/* Reduced-size compact Medium selector buttons */}
      <div className="grid grid-cols-5 gap-1">
        {TRANSACTION_MEDIUMS.map((option) => {
          const isSelected = selectedMedium === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectMedium(option.id)}
              className={`py-1.5 px-1 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                isSelected
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs ring-1 ring-emerald-600/30'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={`${option.label} (${option.description})`}
            >
              <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                {option.icon}
              </span>
              <span className="text-[10px] font-bold tracking-tight truncate w-full">
                {option.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Compact Reference / UTR field */}
      {showReferenceInput && (
        <div className="pt-0.5">
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder={
                selectedMedium === 'CASH'
                  ? 'Receipt / Voucher No. (Optional)'
                  : selectedMedium === 'UPI'
                  ? 'UPI Reference ID / UTR (Optional)'
                  : selectedMedium === 'CHEQUE'
                  ? 'Cheque / DD Number (Optional)'
                  : 'Transaction / Reference ID (Optional)'
              }
              value={transactionRef}
              onChange={(e) => onChangeTransactionRef(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1.5 focus:ring-emerald-600 text-slate-900 text-xs font-medium placeholder:text-slate-400 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
