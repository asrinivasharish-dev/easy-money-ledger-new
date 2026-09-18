import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  Calendar,
  Trash2,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Share2,
  Check,
  CreditCard,
  TrendingUp,
  X,
  Tag,
  Edit3,
  PlusCircle,
  Users
} from 'lucide-react';
import { Loan, Repayment, AdditionalCredit, DashboardSummary, TransactionMedium } from '../types';
import { calculateLoan, formatINR, formatDateStr } from '../utils/interestCalculator';
import { getCategoryTheme } from '../utils/categoryUtils';
import { TransactionMediumBadge } from '../utils/mediumUtils';

interface TabletDetailPaneProps {
  loan: Loan | null;
  summary: DashboardSummary;
  allLoans: Loan[];
  onSelectLoan: (loanId: string | null) => void;
  onOpenAddRepayment: (loanId: string) => void;
  onEditRepayment: (loanId: string, repayment: Repayment) => void;
  onDeleteRepayment: (loanId: string, repaymentId: string) => void;
  onOpenAddAdditionalCredit: (loanId: string) => void;
  onEditAdditionalCredit: (loanId: string, credit: AdditionalCredit) => void;
  onDeleteAdditionalCredit: (loanId: string, creditId: string) => void;
  onDeleteLoan: (loanId: string) => void;
  onOpenAddTransaction: () => void;
  onSelectPersonFilter?: (personName: string) => void;
}

export const TabletDetailPane: React.FC<TabletDetailPaneProps> = ({
  loan,
  summary,
  allLoans,
  onSelectLoan,
  onOpenAddRepayment,
  onEditRepayment,
  onDeleteRepayment,
  onOpenAddAdditionalCredit,
  onEditAdditionalCredit,
  onDeleteAdditionalCredit,
  onDeleteLoan,
  onOpenAddTransaction,
  onSelectPersonFilter,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'all' | 'payments' | 'credits'>('all');

  // If no loan is selected in landscape mode, show Tablet Portfolio & Analytics Station
  if (!loan) {
    const overdueLoans = allLoans.filter((l) => {
      const calc = calculateLoan(l);
      return calc.status === 'OVERDUE';
    });
    const upcomingLoans = allLoans.filter((l) => {
      const calc = calculateLoan(l);
      return calc.status === 'PENDING' || calc.status === 'PARTIALLY_PAID';
    });

    const netBalance = summary.totalReceivable - summary.totalPayable;

    return (
      <div className="h-full flex flex-col space-y-4 p-1">
        {/* Top Header Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md border border-slate-700/60">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Tablet Financial Command Center
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
              Landscape View
            </span>
          </div>

          <div className="my-3 space-y-1">
            <span className="text-xs text-slate-400">Net Ledger Position</span>
            <div
              className={`text-3xl font-black tracking-tight ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netBalance >= 0 ? `+${formatINR(netBalance)}` : formatINR(netBalance)}
            </div>
            <span className="text-[11px] text-slate-400">
              {netBalance >= 0 ? 'Overall positive receivable surplus' : 'Overall payable liability'}
            </span>
          </div>

          {/* Receivable vs Payable Bar */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span className="text-emerald-300">Receivable: {formatINR(summary.totalReceivable)}</span>
              <span className="text-rose-300">Payable: {formatINR(summary.totalPayable)}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${
                    summary.totalReceivable + summary.totalPayable > 0
                      ? (summary.totalReceivable / (summary.totalReceivable + summary.totalPayable)) * 100
                      : 50
                  }%`,
                }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{
                  width: `${
                    summary.totalReceivable + summary.totalPayable > 0
                      ? (summary.totalPayable / (summary.totalReceivable + summary.totalPayable)) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Callout */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Record a New Transaction</h4>
            <p className="text-[11px] text-slate-500">Add money given or taken with simple interest calculation</p>
          </div>
          <button
            onClick={onOpenAddTransaction}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Loan</span>
          </button>
        </div>

        {/* Priority Due Dates & Alerts */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex-1 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Priority Settlements Requiring Attention
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Select any to inspect</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {overdueLoans.length === 0 && upcomingLoans.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <span>All loans are up to date with zero overdue balances.</span>
              </div>
            ) : (
              [...overdueLoans, ...upcomingLoans].slice(0, 5).map((l) => {
                const calc = calculateLoan(l);
                const isOverdue = calc.status === 'OVERDUE';
                const isGiven = l.transactionType === 'GIVEN';
                return (
                  <div
                    key={l.id}
                    onClick={() => onSelectLoan(l.id)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50/40 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">{l.personName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : isGiven
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : isGiven ? 'Gave' : 'Took'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {l.hasIndefiniteDueDate || !l.dueDate
                          ? 'No due date (Indefinite)'
                          : `Due ${formatDateStr(l.dueDate)}`}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black ${
                          isGiven ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatINR(calc.remainingBalance)}
                      </span>
                      <span className="text-[9px] text-slate-400 block">Remaining</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            👉 Tap any transaction on the left list to view details and record repayments.
          </div>
        </div>
      </div>
    );
  }

  // Active Loan Details View
  const calc = calculateLoan(loan);
  const isGiven = loan.transactionType === 'GIVEN';
  const progressPercent =
    calc.totalAmount > 0 ? Math.min(100, Math.round((calc.totalPaid / calc.totalAmount) * 100)) : 0;

  const handleShareReminder = () => {
    const duePhrase =
      loan.hasIndefiniteDueDate || !loan.dueDate
        ? 'with no fixed due date (open-ended)'
        : `Due: ${formatDateStr(loan.dueDate)}`;
    const text = `Hi ${loan.personName}, friendly reminder regarding the loan of ${formatINR(
      loan.amount
    )} recorded on ${formatDateStr(loan.startDate)}. Current outstanding balance is ${formatINR(
      calc.remainingBalance
    )} (${duePhrase}). Thank you!`;
    navigator.clipboard.writeText(text);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 3000);
  };

  return (
    <div className="h-full flex flex-col space-y-3.5 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm overflow-y-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              isGiven ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isGiven ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 leading-tight truncate">
              {loan.personName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <p className="text-[11px] text-slate-500 font-medium">
                {isGiven ? 'Money Given (Lent)' : 'Money Taken (Borrowed)'}
              </p>
              {loan.category && (() => {
                const catTheme = getCategoryTheme(loan.category);
                return (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}
                  >
                    {catTheme.icon}
                    <span>{loan.category}</span>
                  </span>
                );
              })()}
              <TransactionMediumBadge medium={loan.paymentMedium || 'CASH'} reference={loan.transactionRef} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {loan.mobileNumber && (
            <a
              href={`tel:${loan.mobileNumber}`}
              className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition"
              title="Call phone number"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={handleShareReminder}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="Copy payment reminder message"
          >
            {copiedReminder ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
            title="Delete this loan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectLoan(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
            title="Close detail pane"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {copiedReminder && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Payment reminder text copied to clipboard!</span>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      {showConfirmDelete && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-900 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Delete Loan Record?</span>
          </div>
          <p className="text-rose-700 text-[11px]">
            This will permanently remove {loan.personName}'s loan and all repayment history.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDeleteLoan(loan.id);
                setShowConfirmDelete(false);
              }}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Multi-loan banner for same person */}
      {(() => {
        const otherLoansForPerson = allLoans.filter(
          (l) => l.id !== loan.id && l.personName.trim().toLowerCase() === loan.personName.trim().toLowerCase()
        );
        if (otherLoansForPerson.length === 0) return null;
        const otherUnpaid = otherLoansForPerson.reduce((sum, l) => sum + calculateLoan(l).remainingBalance, 0);
        return (
          <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <Users className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{loan.personName}</strong> has {otherLoansForPerson.length} other credit account(s). Total combined unpaid: <strong>{formatINR(calc.remainingBalance + otherUnpaid)}</strong>
              </span>
            </div>
            {onSelectPersonFilter && (
              <button
                onClick={() => onSelectPersonFilter(loan.personName)}
                className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] shrink-0 transition"
              >
                Filter Person
              </button>
            )}
          </div>
        );
      })()}

      {/* Outstanding Balance Banner */}
      <div
        className={`p-4 rounded-2xl border ${
          isGiven
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {isGiven ? 'Remaining to Receive' : 'Remaining to Pay'}
          </span>
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white shadow-2xs border border-slate-200 uppercase">
            {calc.status}
          </span>
        </div>

        <div className="text-3xl font-black mt-1 mb-3 tracking-tight">
          {formatINR(calc.remainingBalance)}
        </div>

        {/* Repayment Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span>Paid: {formatINR(calc.totalPaid)} ({progressPercent}%)</span>
            <span>Total Amount: {formatINR(calc.totalAmount)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {calc.additionalCreditsTotal > 0 ? 'Total Principal' : 'Principal Amount'}
          </span>
          <div className="text-base font-bold text-slate-900">{formatINR(calc.principal)}</div>
          {calc.additionalCreditsTotal > 0 ? (
            <span className="text-[10px] text-emerald-700 font-medium">
              Initial {formatINR(calc.initialPrincipal)} + Top-Ups {formatINR(calc.additionalCreditsTotal)}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">Initial loan sum</span>
          )}
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interest Accrued</span>
          <div className="text-base font-bold text-amber-700">
            {calc.interestAmount > 0 ? `+${formatINR(calc.interestAmount)}` : '₹0 (0%)'}
          </div>
          <span className="text-[10px] text-slate-500">
            {loan.interestType === 'SIMPLE_INTEREST'
              ? `${loan.interestRate}% ${loan.interestFrequency.toLowerCase()}`
              : 'No interest'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Date</span>
          <div className="text-sm font-semibold text-slate-800">{formatDateStr(loan.startDate)}</div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due Date</span>
          <div
            className={`text-sm font-semibold ${
              calc.status === 'OVERDUE' ? 'text-rose-600 font-bold' : 'text-slate-800'
            }`}
          >
            {loan.hasIndefiniteDueDate || !loan.dueDate ? (
              <span className="inline-flex items-center gap-1 text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs font-bold">
                <span>♾️</span> No Due Date (Indefinite)
              </span>
            ) : (
              formatDateStr(loan.dueDate)
            )}
          </div>
        </div>
      </div>

      {/* Formula Explanation if interest exists */}
      {calc.formulaExplanation && (
        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Simple Interest Formula: </span>
            <span>{calc.formulaExplanation}</span>
          </div>
        </div>
      )}

      {/* Notes if present */}
      {loan.notes && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Notes</span>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{loan.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onOpenAddAdditionalCredit(loan.id)}
          className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
          <span>Add Credit Top-Up</span>
        </button>
        <button
          onClick={() => onOpenAddRepayment(loan.id)}
          className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Repayment</span>
        </button>
      </div>

      {/* History Tabs & List */}
      <div className="pt-2 border-t border-slate-100 flex-1 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveHistoryTab('all')}
              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition ${
                activeHistoryTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setActiveHistoryTab('payments')}
              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition ${
                activeHistoryTab === 'payments'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Payments ({loan.repayments?.length || 0})
            </button>
            <button
              onClick={() => setActiveHistoryTab('credits')}
              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition ${
                activeHistoryTab === 'credits'
                  ? 'bg-amber-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Credits ({1 + (loan.additionalCredits?.length || 0)})
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-2 overflow-y-auto flex-1 max-h-52 pr-1">
          {activeHistoryTab === 'all' && (
            <>
              {/* Combine credits and repayments */}
              {[
                {
                  id: 'init-' + loan.id,
                  type: 'INIT',
                  date: loan.startDate,
                  amount: loan.amount,
                  paymentMedium: loan.paymentMedium,
                  transactionRef: loan.transactionRef,
                  notes: loan.notes,
                },
                ...(loan.additionalCredits || []).map((c) => ({
                  id: c.id,
                  type: 'CREDIT',
                  date: c.date,
                  amount: c.amount,
                  paymentMedium: c.paymentMedium,
                  transactionRef: c.transactionRef,
                  notes: c.notes,
                  raw: c,
                })),
                ...(loan.repayments || []).map((r) => ({
                  id: r.id,
                  type: 'REP',
                  date: r.paymentDate,
                  amount: r.amount,
                  paymentMedium: r.paymentMedium,
                  transactionRef: r.transactionRef,
                  notes: r.notes,
                  raw: r,
                })),
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((item) => {
                  const isRep = item.type === 'REP';
                  const isInit = item.type === 'INIT';
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        isRep
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isInit
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-bold ${
                              isRep ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            {isRep ? '-' : '+'}{formatINR(item.amount)}
                          </span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                            {isRep ? 'Payment' : isInit ? 'Initial' : 'Top-Up'}
                          </span>
                          <TransactionMediumBadge medium={item.paymentMedium} reference={item.transactionRef} />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateStr(item.date)}
                          {item.notes && <span> • {item.notes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isRep && (
                          <>
                            <button
                              onClick={() => onEditRepayment(loan.id, item.raw)}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                              title="Edit payment"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteRepayment(loan.id, item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="Delete repayment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {!isRep && !isInit && (
                          <>
                            <button
                              onClick={() => onEditAdditionalCredit(loan.id, item.raw)}
                              className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition"
                              title="Edit credit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteAdditionalCredit(loan.id, item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="Delete credit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </>
          )}

          {activeHistoryTab === 'payments' && (
            <>
              {!loan.repayments || loan.repayments.length === 0 ? (
                <div className="text-center py-6 px-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
                  <span>No repayments recorded yet.</span>
                </div>
              ) : (
                loan.repayments.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-700">+{formatINR(rep.amount)}</span>
                        <TransactionMediumBadge medium={rep.paymentMedium || 'UPI'} reference={rep.transactionRef} />
                        <span className="text-[10px] text-slate-400">{formatDateStr(rep.paymentDate)}</span>
                      </div>
                      {rep.notes && <span className="text-[10px] text-slate-500 block">{rep.notes}</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditRepayment(loan.id, rep)}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                        title="Edit repayment"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRepayment(loan.id, rep.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Delete repayment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeHistoryTab === 'credits' && (
            <>
              {/* Initial */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{formatINR(loan.amount)}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      Initial Principal
                    </span>
                    <TransactionMediumBadge medium={loan.paymentMedium || 'CASH'} reference={loan.transactionRef} />
                  </div>
                  <span className="text-[10px] text-slate-400 block">{formatDateStr(loan.startDate)}</span>
                </div>
              </div>

              {/* Additional */}
              {(loan.additionalCredits || []).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-amber-900">+{formatINR(c.amount)}</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Top-Up
                      </span>
                      <TransactionMediumBadge medium={c.paymentMedium || 'CASH'} reference={c.transactionRef} />
                    </div>
                    <span className="text-[10px] text-slate-400 block">{formatDateStr(c.date)}</span>
                    {c.notes && <span className="text-[10px] text-slate-500 block">{c.notes}</span>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditAdditionalCredit(loan.id, c)}
                      className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition"
                      title="Edit credit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAdditionalCredit(loan.id, c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      title="Delete credit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
