import React, { useState, useEffect } from 'react';
import { X, Check, Edit3 } from 'lucide-react';
import { Loan, Repayment, TransactionMedium } from '../types';
import { calculateLoan, formatINR } from '../utils/interestCalculator';
import { TransactionMediumSelector } from './TransactionMediumSelector';

interface RepaymentModalProps {
  isOpen: boolean;
  loan: Loan;
  initialRepayment?: Repayment | null;
  onClose: () => void;
  onSave: (
    amount: number,
    paymentDate: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string,
    repaymentId?: string
  ) => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  isOpen,
  loan,
  initialRepayment,
  onClose,
  onSave,
}) => {
  const calc = calculateLoan(loan);
  const [amountStr, setAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMedium, setPaymentMedium] = useState<TransactionMedium>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialRepayment) {
        setAmountStr(initialRepayment.amount.toString());
        setPaymentDate(initialRepayment.paymentDate);
        setPaymentMedium(initialRepayment.paymentMedium || 'UPI');
        setTransactionRef(initialRepayment.transactionRef || '');
        setNotes(initialRepayment.notes || '');
      } else {
        setAmountStr('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMedium('UPI');
        setTransactionRef('');
        setNotes('');
      }
    }
  }, [isOpen, initialRepayment]);

  if (!isOpen) return null;

  const paymentAmount = parseFloat(amountStr) || 0;
  // If editing, diff against the old repayment amount
  const oldAmount = initialRepayment ? initialRepayment.amount : 0;
  const currentTotalPaidWithoutThis = Math.max(0, calc.totalPaid - oldAmount);
  const newRemaining = Math.max(0, calc.totalAmount - currentTotalPaidWithoutThis - paymentAmount);
  const isValid = paymentAmount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSave(
      paymentAmount,
      paymentDate,
      paymentMedium,
      transactionRef.trim() || undefined,
      notes.trim() || undefined,
      initialRepayment?.id
    );
    onClose();
  };

  const isEditing = Boolean(initialRepayment);

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Fixed Header */}
        <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit3 className="w-4 h-4 text-emerald-700" />
                  <span>Edit Repayment</span>
                </>
              ) : (
                <span>Record Repayment</span>
              )}
            </h3>
            <p className="text-xs text-slate-500">For {loan.personName}</p>
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
        <form id="repayment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Current Outstanding Balance */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {isEditing ? 'Original Total Due:' : 'Current Outstanding:'}
            </span>
            <span className="text-sm font-black text-slate-900">
              {formatINR(isEditing ? calc.totalAmount : calc.remainingBalance)}
            </span>
          </div>

          {/* Payment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setAmountStr(calc.remainingBalance.toString())}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  Pay Full Balance
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                autoFocus
                placeholder="e.g. 2000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 text-base font-bold bg-white"
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Payment Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              />
            </div>
          </div>

          {/* Medium of Transaction (Cash / UPI / Online) */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <TransactionMediumSelector
              selectedMedium={paymentMedium}
              onSelectMedium={setPaymentMedium}
              transactionRef={transactionRef}
              onChangeTransactionRef={setTransactionRef}
              label="Medium of Repayment"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Part instalment 1, final settlement"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 text-xs"
            />
          </div>

          {/* Live Remaining Balance Calculation Preview */}
          {paymentAmount > 0 && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-900">New Remaining Balance:</span>
              <span className="text-sm font-black text-emerald-800">{formatINR(newRemaining)}</span>
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
            form="repayment-form"
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Update Payment' : 'Save Payment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
