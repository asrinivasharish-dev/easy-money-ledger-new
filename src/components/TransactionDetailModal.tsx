import React, { useState } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  Calendar,
  Trash2,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
  Tag,
  Edit3,
  Layers,
  PlusCircle,
  Receipt,
  Users,
  ExternalLink
} from 'lucide-react';
import { Loan, Repayment, AdditionalCredit, TransactionMedium } from '../types';
import { calculateLoan, formatINR, formatDateStr } from '../utils/interestCalculator';
import { RepaymentModal } from './RepaymentModal';
import { AdditionalCreditModal } from './AdditionalCreditModal';
import { getCategoryTheme } from '../utils/categoryUtils';
import { TransactionMediumBadge } from '../utils/mediumUtils';

interface TransactionDetailModalProps {
  loan: Loan | null;
  isOpen: boolean;
  allLoans?: Loan[];
  onClose: () => void;
  onAddRepayment: (
    loanId: string,
    amount: number,
    paymentDate: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string
  ) => void;
  onEditRepayment: (
    loanId: string,
    repaymentId: string,
    amount: number,
    paymentDate: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string
  ) => void;
  onDeleteRepayment: (loanId: string, repaymentId: string) => void;
  onAddAdditionalCredit: (
    loanId: string,
    amount: number,
    date: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string
  ) => void;
  onEditAdditionalCredit: (
    loanId: string,
    creditId: string,
    amount: number,
    date: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string
  ) => void;
  onDeleteAdditionalCredit: (loanId: string, creditId: string) => void;
  onDeleteLoan: (loanId: string) => void;
  onSelectPersonFilter?: (personName: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  loan,
  isOpen,
  allLoans,
  onClose,
  onAddRepayment,
  onEditRepayment,
  onDeleteRepayment,
  onAddAdditionalCredit,
  onEditAdditionalCredit,
  onDeleteAdditionalCredit,
  onDeleteLoan,
  onSelectPersonFilter,
}) => {
  const [isRepaymentOpen, setIsRepaymentOpen] = useState(false);
  const [editingRepayment, setEditingRepayment] = useState<Repayment | null>(null);

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<AdditionalCredit | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'payments' | 'credits'>('all');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen || !loan) return null;

  const calc = calculateLoan(loan);
  const isGiven = loan.transactionType === 'GIVEN';
  const categoryTheme = getCategoryTheme(loan.category);
  const progressPercent = calc.totalAmount > 0 ? Math.min(100, Math.round((calc.totalPaid / calc.totalAmount) * 100)) : 0;

  // Check if person has multiple loans
  const otherLoansForPerson = (allLoans || []).filter(
    (l) => l.id !== loan.id && l.personName.trim().toLowerCase() === loan.personName.trim().toLowerCase()
  );
  const otherTotalUnpaid = otherLoansForPerson.reduce((sum, l) => sum + calculateLoan(l).remainingBalance, 0);
  const combinedUnpaid = calc.remainingBalance + otherTotalUnpaid;

  // Combined timeline of all ledger events: Initial disbursement, top-up credits, and repayments
  interface TimelineItem {
    id: string;
    type: 'INITIAL_CREDIT' | 'ADDITIONAL_CREDIT' | 'REPAYMENT';
    date: string;
    amount: number;
    paymentMedium?: TransactionMedium;
    transactionRef?: string;
    notes?: string;
    raw?: any;
  }

  const timelineItems: TimelineItem[] = [
    {
      id: 'init-' + loan.id,
      type: 'INITIAL_CREDIT',
      date: loan.startDate,
      amount: loan.amount,
      paymentMedium: loan.paymentMedium,
      transactionRef: loan.transactionRef,
      notes: loan.notes || 'Initial disbursement',
    },
    ...(loan.additionalCredits || []).map((c) => ({
      id: c.id,
      type: 'ADDITIONAL_CREDIT' as const,
      date: c.date,
      amount: c.amount,
      paymentMedium: c.paymentMedium,
      transactionRef: c.transactionRef,
      notes: c.notes,
      raw: c,
    })),
    ...(loan.repayments || []).map((r) => ({
      id: r.id,
      type: 'REPAYMENT' as const,
      date: r.paymentDate,
      amount: r.amount,
      paymentMedium: r.paymentMedium,
      transactionRef: r.transactionRef,
      notes: r.notes,
      raw: r,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenEditRepayment = (rep: Repayment) => {
    setEditingRepayment(rep);
    setIsRepaymentOpen(true);
  };

  const handleOpenAddRepayment = () => {
    setEditingRepayment(null);
    setIsRepaymentOpen(true);
  };

  const handleOpenEditCredit = (credit: AdditionalCredit) => {
    setEditingCredit(credit);
    setIsCreditModalOpen(true);
  };

  const handleOpenAddCredit = () => {
    setEditingCredit(null);
    setIsCreditModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                isGiven ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isGiven ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{loan.personName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-slate-500 font-medium">
                  {isGiven ? 'Money Given (Lent)' : 'Money Taken (Borrowed)'}
                </p>
                {loan.category && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${categoryTheme.badgeBg} ${categoryTheme.badgeText} ${categoryTheme.badgeBorder}`}
                  >
                    {categoryTheme.icon}
                    <span>{loan.category}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {loan.mobileNumber && (
              <a
                href={`tel:${loan.mobileNumber}`}
                className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition"
                title="Call phone number"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
              title="Delete loan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Multi-loan Banner for same person if applicable */}
          {otherLoansForPerson.length > 0 && (
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <Users className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{loan.personName}</strong> has {otherLoansForPerson.length} other credit account(s). Total combined unpaid: <strong>{formatINR(combinedUnpaid)}</strong>
                </span>
              </div>
              {onSelectPersonFilter && (
                <button
                  onClick={() => {
                    onSelectPersonFilter(loan.personName);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] shrink-0 transition"
                >
                  View All
                </button>
              )}
            </div>
          )}

          {/* Outstanding Balance Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              isGiven
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {isGiven ? 'Remaining to Receive' : 'Remaining to Pay'}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white shadow-sm border border-slate-200">
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
                <span>Total: {formatINR(calc.totalAmount)}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Detailed Financial Overview Grid */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-2">Loan & Credit Overview</h4>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Initial Principal</span>
              <span className="font-bold text-slate-800">{formatINR(calc.initialPrincipal)}</span>
            </div>

            {calc.additionalCreditsTotal > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200/60 text-emerald-800">
                <span className="font-medium flex items-center gap-1">
                  <span>Additional Credits Added</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 font-bold">
                    {(loan.additionalCredits || []).length} top-ups
                  </span>
                </span>
                <span className="font-bold">+{formatINR(calc.additionalCreditsTotal)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-200/60 bg-slate-100/60 px-2 rounded-lg">
              <span className="text-slate-700 font-bold">Total Principal Disbursed</span>
              <span className="font-black text-slate-900">{formatINR(calc.principal)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60 items-center">
              <span className="text-slate-500 font-medium">Category</span>
              <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md border ${categoryTheme.badgeBg} ${categoryTheme.badgeText} ${categoryTheme.badgeBorder}`}>
                {categoryTheme.icon}
                <span>{loan.category || 'Personal'}</span>
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60 items-center">
              <span className="text-slate-500 font-medium">Disbursed Via</span>
              <TransactionMediumBadge medium={loan.paymentMedium || 'CASH'} reference={loan.transactionRef} showRef={true} />
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Interest Rate</span>
              <span className="font-bold text-slate-800">
                {loan.interestType === 'SIMPLE_INTEREST'
                  ? `${loan.interestRate}% (${loan.interestFrequency.toLowerCase()})`
                  : 'No Interest'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Interest Accumulated</span>
              <span className="font-bold text-amber-700">+{formatINR(calc.interestAmount)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Total Amount Due</span>
              <span className="font-bold text-slate-900">{formatINR(calc.totalAmount)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Amount Already Paid</span>
              <span className="font-bold text-emerald-700">{formatINR(calc.totalPaid)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Remaining Amount</span>
              <span className="font-bold text-slate-900">{formatINR(calc.remainingBalance)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Start Date</span>
              <span className="font-medium text-slate-800">{formatDateStr(loan.startDate)}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Due Date</span>
              <span className={`font-semibold ${calc.status === 'OVERDUE' ? 'text-rose-600' : 'text-slate-800'}`}>
                {loan.hasIndefiniteDueDate || !loan.dueDate ? (
                  <span className="inline-flex items-center gap-1 text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs font-bold">
                    <span>♾️</span> No Due Date (Indefinite)
                  </span>
                ) : (
                  formatDateStr(loan.dueDate)
                )}
              </span>
            </div>

            {loan.notes && (
              <div className="pt-2 border-t border-slate-200/60 text-slate-600">
                <span className="font-medium text-slate-400 block text-[10px] uppercase">Notes:</span>
                <p className="mt-0.5 text-xs italic">{loan.notes}</p>
              </div>
            )}
          </div>

          {/* Interest Formula Details */}
          {loan.interestType === 'SIMPLE_INTEREST' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info className="w-3.5 h-3.5" />
                <span>Interest Calculation Explanation</span>
              </div>
              <p className="text-amber-900/80 font-mono text-[11px] leading-relaxed">
                {calc.formulaExplanation}
              </p>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleOpenAddCredit}
              className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Add Credit Top-Up</span>
            </button>
            <button
              onClick={handleOpenAddRepayment}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Record Repayment</span>
            </button>
          </div>

          {/* Ledger History & Tabs */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Activity ({timelineItems.length})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'payments'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Payments ({(loan.repayments || []).length})
                </button>
                <button
                  onClick={() => setActiveTab('credits')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'credits'
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Credits ({1 + (loan.additionalCredits || []).length})
                </button>
              </div>
            </div>

            {/* TAB CONTENT: ALL ACTIVITY */}
            {activeTab === 'all' && (
              <div className="space-y-2">
                {timelineItems.map((item) => {
                  const isRep = item.type === 'REPAYMENT';
                  const isInit = item.type === 'INITIAL_CREDIT';
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition ${
                        isRep
                          ? 'bg-emerald-50/60 border-emerald-200/80'
                          : isInit
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-amber-50/60 border-amber-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isRep
                              ? 'bg-emerald-600 text-white'
                              : isInit
                              ? 'bg-slate-700 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {isRep ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`font-black text-sm ${
                                isRep ? 'text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {isRep ? '-' : '+'}{formatINR(item.amount)}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200/60 text-slate-600">
                              {isRep ? 'Payment' : isInit ? 'Initial Credit' : 'Top-Up Credit'}
                            </span>
                            <TransactionMediumBadge medium={item.paymentMedium} reference={item.transactionRef} showRef={true} />
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDateStr(item.date)}</span>
                            {item.notes && <span className="truncate">• {item.notes}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isRep && (
                          <>
                            <button
                              onClick={() => handleOpenEditRepayment(item.raw)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 transition"
                              title="Edit repayment"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteRepayment(loan.id, item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete repayment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {!isRep && !isInit && (
                          <>
                            <button
                              onClick={() => handleOpenEditCredit(item.raw)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-100 transition"
                              title="Edit credit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteAdditionalCredit(loan.id, item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete credit top-up"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: PAYMENTS */}
            {activeTab === 'payments' && (
              <div className="space-y-2">
                {(!loan.repayments || loan.repayments.length === 0) ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-xs">
                    No repayments recorded yet.
                  </div>
                ) : (
                  loan.repayments
                    .slice()
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .map((rep) => (
                      <div
                        key={rep.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-emerald-700 text-sm">
                              {formatINR(rep.amount)}
                            </span>
                            <TransactionMediumBadge medium={rep.paymentMedium || 'UPI'} reference={rep.transactionRef} showRef={true} />
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDateStr(rep.paymentDate)}</span>
                            {rep.notes && <span>• {rep.notes}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditRepayment(rep)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Edit repayment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRepayment(loan.id, rep.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete repayment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* TAB CONTENT: CREDITS */}
            {activeTab === 'credits' && (
              <div className="space-y-2">
                {/* Initial Credit */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{formatINR(loan.amount)}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        Initial Principal
                      </span>
                      <TransactionMediumBadge medium={loan.paymentMedium || 'CASH'} reference={loan.transactionRef} showRef={true} />
                    </div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDateStr(loan.startDate)}</span>
                      {loan.notes && <span>• {loan.notes}</span>}
                    </div>
                  </div>
                </div>

                {/* Additional Credits */}
                {(loan.additionalCredits || []).map((credit) => (
                  <div
                    key={credit.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-900 text-sm">+{formatINR(credit.amount)}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Top-Up Credit
                        </span>
                        <TransactionMediumBadge medium={credit.paymentMedium || 'CASH'} reference={credit.transactionRef} showRef={true} />
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDateStr(credit.date)}</span>
                        {credit.notes && <span>• {credit.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCredit(credit)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-100 transition"
                        title="Edit credit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteAdditionalCredit(loan.id, credit.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete credit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Floating Buttons */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md p-4 border-t border-slate-100 grid grid-cols-2 gap-2">
          <button
            onClick={handleOpenAddCredit}
            className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <PlusCircle className="w-4 h-4 text-amber-700" />
            <span>Add Credit</span>
          </button>
          <button
            onClick={handleOpenAddRepayment}
            className="py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Repayment Modal (Add or Edit) */}
      <RepaymentModal
        isOpen={isRepaymentOpen}
        loan={loan}
        initialRepayment={editingRepayment}
        onClose={() => {
          setIsRepaymentOpen(false);
          setEditingRepayment(null);
        }}
        onSave={(amount, paymentDate, paymentMedium, transactionRef, notes, repaymentId) => {
          if (repaymentId) {
            onEditRepayment(loan.id, repaymentId, amount, paymentDate, paymentMedium, transactionRef, notes);
          } else {
            onAddRepayment(loan.id, amount, paymentDate, paymentMedium, transactionRef, notes);
          }
        }}
      />

      {/* Additional Credit Modal (Add or Edit) */}
      <AdditionalCreditModal
        isOpen={isCreditModalOpen}
        loan={loan}
        initialCredit={editingCredit}
        onClose={() => {
          setIsCreditModalOpen(false);
          setEditingCredit(null);
        }}
        onSave={(amount, date, paymentMedium, transactionRef, notes, creditId) => {
          if (creditId) {
            onEditAdditionalCredit(loan.id, creditId, amount, date, paymentMedium, transactionRef, notes);
          } else {
            onAddAdditionalCredit(loan.id, amount, date, paymentMedium, transactionRef, notes);
          }
        }}
      />

      {/* Confirm Delete Loan Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">Delete Record?</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete the loan for <strong>{loan.personName}</strong>? All recorded repayments and additional credits will also be deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteLoan(loan.id);
                  setShowConfirmDelete(false);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
