import React, { useState, useEffect } from 'react';
import { X, Check, PlusCircle, AlertCircle, Edit3 } from 'lucide-react';
import { Loan, AdditionalCredit, TransactionMedium } from '../types';
import { calculateLoan, formatINR } from '../utils/interestCalculator';
import { TransactionMediumSelector } from './TransactionMediumSelector';

interface AdditionalCreditModalProps {
  isOpen: boolean;
  loan: Loan;
  initialCredit?: AdditionalCredit | null;
  onClose: () => void;
  onSave: (
    amount: number,
    date: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string,
    creditId?: string
  ) => void;
}

export const AdditionalCreditModal: React.FC<AdditionalCreditModalProps> = ({
  isOpen,
  loan,
  initialCredit,
  onClose,
  onSave,
}) => {
  const calc = calculateLoan(loan);
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMedium, setPaymentMedium] = useState<TransactionMedium>('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialCredit) {
        setAmountStr(initialCredit.amount.toString());
        setDate(initialCredit.date);
        setPaymentMedium(initialCredit.paymentMedium || 'CASH');
        setTransactionRef(initialCredit.transactionRef || '');
        setNotes(initialCredit.notes || '');
      } else {
        setAmountStr('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMedium('CASH');
        setTransactionRef('');
        setNotes('');
      }
    }
  }, [isOpen, initialCredit]);

  if (!isOpen) return null;

  const addedAmount = parseFloat(amountStr) || 0;
  const isEditing = Boolean(initialCredit);

  // Live preview calculations
  const oldAmount = initialCredit ? initialCredit.amount : 0;
  const newPrincipal = Math.max(0, calc.principal - oldAmount + addedAmount);
  const newRemaining = Math.max(0, calc.remainingBalance - oldAmount + addedAmount);
  const isValid = addedAmount > 0;

  const isGiven = loan.transactionType === 'GIVEN';
  const actionTitle = isGiven ? 'Disburse Additional Credit' : 'Record Additional Borrowing';
  const personActionVerb = isGiven ? 'borrowed more money' : 'lent you more money';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSave(
      addedAmount,
      date,
      paymentMedium,
      transactionRef.trim() || undefined,
      notes.trim() || undefined,
      initialCredit?.id
    );
    onClose();
  };

  const presetNotes = isGiven
    ? ['Additional cash needed', 'Urgent medical help', 'Material purchase', 'Shop restock']
    : ['Extra funds borrowed', 'Business operational cost', 'Emergency loan', 'Personal expense'];

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleQuickAddAmount = (val: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + val).toString());
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Fixed Header */}
        <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>Edit Credit Entry</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  <span>{actionTitle}</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              For <span className="font-semibold text-slate-800">{loan.personName}</span> ({personActionVerb})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="credit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Current Balance Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px]">Current Principal:</span>
              <span className="font-bold text-slate-900 text-sm">{formatINR(calc.principal)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px]">Current Unpaid:</span>
              <span className="font-bold text-rose-600 text-sm">{formatINR(calc.remainingBalance)}</span>
            </div>
          </div>

          {/* Additional Credit Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                {isGiven ? 'Additional Amount Disbursed' : 'Additional Amount Taken'} (₹){' '}
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Required</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                autoFocus
                placeholder="e.g. 5000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 text-base font-bold bg-white"
              />
            </div>
            {/* Quick Add Chips */}
            <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Quick:</span>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickAddAmount(q)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-600 text-[11px] font-semibold transition shrink-0"
                >
                  +{q >= 1000 ? `${q / 1000}k` : q}
                </button>
              ))}
            </div>
          </div>

          {/* Disbursement Date */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Credit Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              />
            </div>
          </div>

          {/* Medium of Transaction (Cash / UPI / Online) - Reduced size */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <TransactionMediumSelector
              selectedMedium={paymentMedium}
              onSelectMedium={setPaymentMedium}
              transactionRef={transactionRef}
              onChangeTransactionRef={setTransactionRef}
              label={isGiven ? 'Disbursed Via' : 'Received Via'}
            />
          </div>

          {/* Note & Preset Tags */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Reason / Note (Optional)</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {presetNotes.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNotes(tag)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                    notes === tag
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="e.g. Extra advance for purchase"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 text-xs"
            />
          </div>

          {/* Live Updated Principal & Balance Preview */}
          {addedAmount > 0 && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">New Total Principal:</span>
                <span className="font-bold text-emerald-900 text-xs">{formatINR(newPrincipal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                <span className="text-emerald-900 font-medium">Updated Unpaid Balance:</span>
                <span className="font-black text-rose-700 text-xs">{formatINR(newRemaining)}</span>
              </div>
            </div>
          )}
        </form>

        {/* Fixed Footer with Action Buttons */}
        <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2.5 z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="credit-form"
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Update Credit' : 'Save Credit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
